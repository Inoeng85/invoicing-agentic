import {
  prisma,
  type AssignmentEndReason,
  type CollectionOutcome as PrismaCollectionOutcome,
  type Prisma,
} from '@invoicing/database'

import { DomainError } from './errors.ts'
import { computeCommissionCents } from './invoiceTotals.ts'

type Tx = Prisma.TransactionClient

export const COLLECTION_OUTCOMES = [
  'contacted',
  'no_response',
  'promised_to_pay',
  'partial_payment_reported',
  'refused',
  'other',
] as const satisfies readonly PrismaCollectionOutcome[]

export type CollectionOutcome = (typeof COLLECTION_OUTCOMES)[number]

function isCollectionOutcome(value: string): value is CollectionOutcome {
  return (COLLECTION_OUTCOMES as readonly string[]).includes(value)
}

async function requireOutstandingInvoiceInTx(tx: Tx, userId: string, invoiceId: string) {
  let invoice = await tx.invoice.findFirst({ where: { id: invoiceId, userId }, select: { status: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new DomainError('Hanya invoice outstanding yang dapat ditagih', 'invoice_not_outstanding', 409)
  }
}

function findActiveAssignmentInTx(tx: Tx, invoiceId: string) {
  return tx.collectionAssignment.findFirst({ where: { invoiceId, endedAt: null } })
}

// Every way an assignment ends goes through here so its tracking link and location trail go too (BR-11).
async function endAssignmentInTx(
  tx: Tx,
  assignmentId: string,
  data: { endReason: AssignmentEndReason; commissionCents?: number | null },
) {
  await tx.collectorLocation.deleteMany({ where: { assignmentId } })
  return tx.collectionAssignment.update({
    where: { id: assignmentId },
    data: { ...data, endedAt: new Date(), trackingToken: null },
  })
}

export async function assignCollector(userId: string, invoiceId: string, collectorId: string) {
  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let collector = await tx.debtCollector.findFirst({ where: { id: collectorId, userId } })
    if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
    if (!collector.active) throw new DomainError('Kolektor nonaktif', 'collector_inactive', 409)

    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (current?.collectorId === collectorId) {
      throw new DomainError('Kolektor sudah di-assign ke invoice ini', 'already_assigned', 409)
    }
    if (current) {
      await endAssignmentInTx(tx, current.id, { endReason: 'reassigned' })
    }
    return tx.collectionAssignment.create({
      data: { userId, invoiceId, collectorId, rateSnapshot: collector.commissionRate },
      include: { collector: true },
    })
  })
}

export async function unassignCollector(userId: string, invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (!current) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
    return endAssignmentInTx(tx, current.id, { endReason: 'unassigned' })
  })
}

export async function addCollectionActivity(
  userId: string,
  invoiceId: string,
  input: { occurredAt: Date; outcome: string; note?: string | null },
) {
  let outcome = input.outcome
  if (!isCollectionOutcome(outcome)) {
    throw new DomainError('Hasil penagihan tidak valid', 'invalid_outcome')
  }
  let time = input.occurredAt.getTime()
  if (!Number.isFinite(time) || time > Date.now()) {
    throw new DomainError('Tanggal aktivitas tidak valid', 'invalid_occurred_at')
  }

  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (!current) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
    return tx.collectionActivity.create({
      data: {
        assignmentId: current.id,
        occurredAt: input.occurredAt,
        outcome,
        note: input.note?.trim() || null,
      },
    })
  })
}

export async function getInvoiceCollection(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
  let rows = await prisma.collectionAssignment.findMany({
    where: { invoiceId, userId },
    include: { collector: true, activities: { orderBy: { occurredAt: 'desc' } } },
    orderBy: { assignedAt: 'desc' },
  })
  // Active first regardless of timestamps: a reassign can create two rows within the same millisecond.
  let active = rows.find((a) => a.endedAt === null) ?? null
  let history = active ? [active, ...rows.filter((a) => a !== active)] : rows
  return { active, history }
}

export type InvoiceCollection = Awaited<ReturnType<typeof getInvoiceCollection>>

export async function closeActiveAssignmentInTx(
  tx: Tx,
  invoiceId: string,
  reason: 'paid' | 'cancelled',
  totalCents: number,
) {
  let current = await findActiveAssignmentInTx(tx, invoiceId)
  if (!current) return
  await endAssignmentInTx(tx, current.id, {
    endReason: reason,
    commissionCents: reason === 'paid' ? computeCommissionCents(totalCents, current.rateSnapshot) : null,
  })
}

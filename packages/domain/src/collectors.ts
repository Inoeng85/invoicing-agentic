import { prisma, type DebtCollector } from '@invoicing/database'

import { DomainError } from './errors.ts'

export interface CollectorInput {
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  commissionRate: number
}

export interface CollectorSummary {
  collector: DebtCollector
  activeCount: number
  activeOutstandingCents: number
  earnedCommissionCents: number
}

function cleanOptional(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  return value?.trim() || null
}

function normalizeCollectorInput(input: Partial<CollectorInput>) {
  let name = input.name?.trim()
  if (input.name !== undefined && !name) {
    throw new DomainError('Nama kolektor wajib', 'missing_name')
  }
  let email = cleanOptional(input.email)
  if (email && !email.includes('@')) {
    throw new DomainError('Email kolektor tidak valid', 'invalid_email')
  }
  let rate = input.commissionRate
  if (rate !== undefined && !(Number.isFinite(rate) && rate >= 0 && rate <= 1)) {
    throw new DomainError('Komisi harus antara 0% dan 100%', 'invalid_commission_rate')
  }
  return {
    name,
    email,
    phone: cleanOptional(input.phone),
    notes: cleanOptional(input.notes),
    commissionRate: rate,
  }
}

export async function listCollectors(userId: string, includeInactive = false) {
  return prisma.debtCollector.findMany({
    where: { userId, ...(includeInactive ? {} : { active: true }) },
    orderBy: { name: 'asc' },
  })
}

export async function getCollector(userId: string, collectorId: string) {
  let collector = await prisma.debtCollector.findFirst({ where: { id: collectorId, userId } })
  if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
  return collector
}

export async function createCollector(userId: string, input: CollectorInput) {
  let data = normalizeCollectorInput(input)
  return prisma.debtCollector.create({
    data: {
      userId,
      name: data.name!,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      commissionRate: data.commissionRate!,
    },
  })
}

export async function updateCollector(userId: string, collectorId: string, input: Partial<CollectorInput>) {
  await getCollector(userId, collectorId)
  let data = normalizeCollectorInput(input)
  return prisma.debtCollector.update({ where: { id: collectorId }, data })
}

export async function setCollectorActive(userId: string, collectorId: string, active: boolean) {
  // Same transaction as the check so a concurrent assignCollector can't slip in between (BR-09).
  return prisma.$transaction(async (tx) => {
    let collector = await tx.debtCollector.findFirst({ where: { id: collectorId, userId }, select: { id: true } })
    if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
    if (!active) {
      let open = await tx.collectionAssignment.count({ where: { collectorId, endedAt: null } })
      if (open > 0) {
        throw new DomainError(
          'Kolektor masih menagih invoice aktif',
          'collector_has_active_assignments',
          409,
        )
      }
    }
    return tx.debtCollector.update({ where: { id: collectorId }, data: { active } })
  })
}

export async function listCollectorSummaries(userId: string): Promise<CollectorSummary[]> {
  let [collectors, assignments] = await Promise.all([
    listCollectors(userId, true),
    prisma.collectionAssignment.findMany({
      where: { userId, OR: [{ endedAt: null }, { endReason: 'paid' }] },
      select: { collectorId: true, endedAt: true, commissionCents: true, invoice: { select: { totalCents: true } } },
    }),
  ])
  return collectors.map((collector) => {
    let own = assignments.filter((a) => a.collectorId === collector.id)
    let active = own.filter((a) => a.endedAt === null)
    return {
      collector,
      activeCount: active.length,
      activeOutstandingCents: active.reduce((sum, a) => sum + a.invoice.totalCents, 0),
      earnedCommissionCents: own.reduce((sum, a) => sum + (a.commissionCents ?? 0), 0),
    }
  })
}

export async function getCollectorSummary(userId: string, collectorId: string) {
  let collector = await getCollector(userId, collectorId)
  let [activeAssignments, earned] = await Promise.all([
    prisma.collectionAssignment.findMany({
      where: { userId, collectorId, endedAt: null },
      include: { invoice: { include: { client: true } } },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.collectionAssignment.aggregate({
      where: { userId, collectorId, endReason: 'paid' },
      _sum: { commissionCents: true },
    }),
  ])
  return {
    collector,
    activeAssignments,
    activeCount: activeAssignments.length,
    activeOutstandingCents: activeAssignments.reduce((sum, a) => sum + a.invoice.totalCents, 0),
    earnedCommissionCents: earned._sum.commissionCents ?? 0,
  }
}

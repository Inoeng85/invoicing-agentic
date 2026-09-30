import { randomBytes } from 'node:crypto'

import type { InvoiceStatus } from '@prisma/client'

import { computeCommissionCents, computeInvoiceTotals } from '../../../domain/src/invoiceTotals.ts'
import { prisma } from '../../src/client.ts'
import { createRandom, SAMPLE_EMAIL, SAMPLE_SIZE, type Random } from './random.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const DESCRIPTIONS = [
  'Desain logo & identitas visual',
  'Pengembangan website company profile',
  'Maintenance aplikasi bulanan',
  'Konsultasi UI/UX',
  'Fotografi produk',
  'Copywriting konten media sosial',
  'Integrasi payment gateway',
  'Pelatihan tim internal',
] as const
const OUTCOMES = ['contacted', 'no_response', 'promised_to_pay', 'partial_payment_reported', 'refused', 'other'] as const

// Index ranges give an exact, test-checked mix: 20 draft, 35 sent, 20 overdue, 20 paid, 5 cancelled.
function statusFor(index: number): InvoiceStatus {
  if (index < 20) return 'draft'
  if (index < 55) return 'sent'
  if (index < 75) return 'overdue'
  if (index < 95) return 'paid'
  return 'cancelled'
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS)
}

function issueDateFor(status: InvoiceStatus, random: Random): Date {
  switch (status) {
    case 'draft':
      return daysAgo(random.int(0, 10))
    case 'sent':
      return daysAgo(random.int(0, 20))
    case 'overdue':
      return daysAgo(random.int(45, 120))
    case 'paid':
      return daysAgo(random.int(40, 150))
    case 'cancelled':
      return daysAgo(random.int(20, 90))
  }
}

// Amount columns are 32-bit INT in SQLite (max ≈ Rp 21.474.836 per invoice), so 3 lines × 3 × Rp 2 jt × PPN stays below it.
function buildLines(random: Random) {
  return Array.from({ length: random.int(1, 3) }, () => {
    let quantity = random.int(1, 3)
    let unitPriceCents = random.int(1, 20) * 10_000_000
    let discountCents = random.chance(0.2) ? Math.round(quantity * unitPriceCents * random.int(5, 10) / 100) : 0
    return { description: random.pick(DESCRIPTIONS), quantity, unitPriceCents, discountCents }
  })
}

export async function seedSampleInvoices(userId: string) {
  let [clients, collectors] = await Promise.all([
    prisma.client.findMany({ where: { userId, email: SAMPLE_EMAIL }, orderBy: { email: 'asc' } }),
    prisma.debtCollector.findMany({ where: { userId, email: SAMPLE_EMAIL }, orderBy: { email: 'asc' } }),
  ])
  if (clients.length < SAMPLE_SIZE || collectors.length < SAMPLE_SIZE) {
    throw new Error('Data sampel klien/kolektor belum lengkap — jalankan npm run db:seed:clients dan npm run db:seed:collectors dulu')
  }
  let activeCollectors = collectors.filter((c) => c.active)
  let random = createRandom(2026_1002)
  let created = 0

  for (let index = 0; index < SAMPLE_SIZE; index++) {
    let status = statusFor(index)
    let number = `SMP-${String(index + 1).padStart(3, '0')}`
    // Draw every random value before the existence check so reruns stay deterministic for later invoices.
    let issueDate = issueDateFor(status, random)
    let lines = buildLines(random)
    let ppnEnabled = random.chance(0.5)
    let paidAt = status === 'paid' ? new Date(Math.min(issueDate.getTime() + random.int(3, 40) * DAY_MS, Date.now())) : null
    let collector = random.pick(activeCollectors)
    let assign = status === 'sent' || status === 'overdue' ? random.chance(0.6) : status === 'paid' ? random.chance(0.5) : false
    let activityCount = random.int(0, 3)
    let outcomes = Array.from({ length: activityCount }, () => random.pick(OUTCOMES))
    let activityFractions = Array.from({ length: activityCount }, () => random.next())

    let existing = await prisma.invoice.findFirst({ where: { userId, number }, select: { id: true } })
    if (existing) continue

    let totals = computeInvoiceTotals(lines, ppnEnabled, 0.11)
    let sent = status !== 'draft'
    let invoice = await prisma.invoice.create({
      data: {
        userId,
        clientId: clients[index]!.id,
        number,
        status,
        issueDate,
        dueDate: new Date(issueDate.getTime() + 30 * DAY_MS),
        ppnEnabled,
        ppnRate: 0.11,
        ...totals,
        footerNote: 'Terima kasih atas kepercayaan Anda.',
        publicToken: sent ? randomBytes(24).toString('base64url') : null,
        sentAt: sent ? issueDate : null,
        paidAt,
        lineItems: { create: lines.map((line, sortOrder) => ({ ...line, sortOrder })) },
      },
    })

    if (assign) {
      let assignedAt = new Date(Math.min(issueDate.getTime() + DAY_MS, Date.now()))
      let endedAt = paidAt
      let windowEnd = (endedAt ?? new Date()).getTime()
      await prisma.collectionAssignment.create({
        data: {
          userId,
          invoiceId: invoice.id,
          collectorId: collector.id,
          rateSnapshot: collector.commissionRate,
          assignedAt,
          endedAt,
          endReason: endedAt ? 'paid' : null,
          commissionCents: endedAt ? computeCommissionCents(totals.totalCents, collector.commissionRate) : null,
          activities: {
            create: outcomes.map((outcome, i) => ({
              outcome,
              occurredAt: new Date(assignedAt.getTime() + activityFractions[i]! * (windowEnd - assignedAt.getTime())),
              note: outcome === 'promised_to_pay' ? 'Janji transfer minggu ini' : null,
            })),
          },
        },
      })
    }
    created++
  }
  return { created, total: SAMPLE_SIZE }
}

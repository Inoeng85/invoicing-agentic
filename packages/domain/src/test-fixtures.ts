import { randomBytes } from 'node:crypto'

import { prisma, type InvoiceStatus } from '@invoicing/database'

function uid(): string {
  return randomBytes(6).toString('hex')
}

export async function makeUser() {
  return prisma.user.create({
    data: {
      email: `user-${uid()}@test.local`,
      passwordHash: 'salt:hash',
      profile: { create: { legalName: 'Studio Test' } },
    },
  })
}

export async function makeClient(userId: string) {
  return prisma.client.create({
    data: { userId, name: `Klien ${uid()}`, email: `klien-${uid()}@test.local` },
  })
}

export async function makeInvoice(
  userId: string,
  clientId: string,
  options: { status?: InvoiceStatus; totalCents?: number } = {},
) {
  let totalCents = options.totalCents ?? 100_000_000
  let status = options.status ?? 'sent'
  return prisma.invoice.create({
    data: {
      userId,
      clientId,
      status,
      number: status === 'draft' ? null : `INV-TEST-${uid()}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotalCents: totalCents,
      totalCents,
    },
  })
}

export async function makeCollector(
  userId: string,
  options: { commissionRate?: number; active?: boolean } = {},
) {
  return prisma.debtCollector.create({
    data: {
      userId,
      name: `Kolektor ${uid()}`,
      commissionRate: options.commissionRate ?? 0.1,
      active: options.active ?? true,
    },
  })
}

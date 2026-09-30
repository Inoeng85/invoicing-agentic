import { randomBytes } from 'node:crypto'

import { prisma } from '@invoicing/database'
import type { InvoiceStatus } from '@prisma/client'

import { sendEmail } from './email.ts'
import { DomainError } from './errors.ts'
import { computeInvoiceTotals, type LineItemInput } from './invoiceTotals.ts'
import { generateInvoicePdf } from './pdf.ts'

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export async function refreshOverdueInvoices(userId: string) {
  let today = startOfDay(new Date())
  await prisma.invoice.updateMany({
    where: {
      userId,
      status: 'sent',
      dueDate: { lt: today },
    },
    data: { status: 'overdue' },
  })
}

function assertDraft(invoice: { status: string }) {
  if (invoice.status !== 'draft') {
    throw new DomainError('Hanya invoice draft yang dapat diubah', 'not_draft', 409)
  }
}

function mapLines(
  lines: Array<{
    description: string
    quantity: number
    unitPriceCents: number
    discountCents?: number
    sortOrder?: number
  }>,
): LineItemInput[] {
  return lines.map((line) => ({
    description: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    discountCents: line.discountCents ?? 0,
  }))
}

type InvoiceTx = Pick<typeof prisma, 'invoice'>

async function nextInvoiceNumberInTx(tx: InvoiceTx, userId: string, issueDate: Date): Promise<string> {
  let year = issueDate.getFullYear()
  let prefix = `INV-${year}-`
  let count = await tx.invoice.count({
    where: { userId, number: { startsWith: prefix } },
  })
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

export async function listInvoices(userId: string, status?: InvoiceStatus) {
  await refreshOverdueInvoices(userId)
  return prisma.invoice.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { client: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getInvoice(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { lineItems: { orderBy: { sortOrder: 'asc' } }, client: true, user: { include: { profile: true } } },
  })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
  return invoice
}

export async function createInvoiceDraft(
  userId: string,
  input: {
    clientId: string
    issueDate?: Date
    dueDate?: Date
    ppnEnabled?: boolean
    ppnRate?: number
    footerNote?: string
    lines: Array<{
      description: string
      quantity: number
      unitPriceCents: number
      discountCents?: number
    }>
  },
) {
  if (!input.lines.length) throw new DomainError('Minimal satu line item', 'missing_lines')

  let profile = await prisma.businessProfile.findUnique({ where: { userId } })
  let issueDate = input.issueDate ?? new Date()
  let dueDate =
    input.dueDate ??
    new Date(issueDate.getTime() + (profile?.defaultDueDays ?? 30) * 24 * 60 * 60 * 1000)

  await prisma.client.findFirstOrThrow({ where: { id: input.clientId, userId, active: true } })

  let ppnEnabled = input.ppnEnabled ?? false
  let ppnRate = input.ppnRate ?? 0.11
  let totals = computeInvoiceTotals(mapLines(input.lines), ppnEnabled, ppnRate)

  return prisma.invoice.create({
    data: {
      userId,
      clientId: input.clientId,
      status: 'draft',
      issueDate,
      dueDate,
      ppnEnabled,
      ppnRate,
      subtotalCents: totals.subtotalCents,
      ppnCents: totals.ppnCents,
      totalCents: totals.totalCents,
      footerNote: input.footerNote ?? profile?.footerDefault,
      lineItems: {
        create: input.lines.map((line, index) => ({
          sortOrder: index,
          description: line.description.trim(),
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          discountCents: line.discountCents ?? 0,
        })),
      },
    },
    include: { lineItems: true, client: true },
  })
}

export async function updateInvoiceDraft(
  userId: string,
  invoiceId: string,
  input: {
    clientId?: string
    issueDate?: Date
    dueDate?: Date
    ppnEnabled?: boolean
    ppnRate?: number
    footerNote?: string | null
    lines?: Array<{
      description: string
      quantity: number
      unitPriceCents: number
      discountCents?: number
    }>
  },
) {
  let invoice = await getInvoice(userId, invoiceId)
  assertDraft(invoice)

  let lines = input.lines ?? invoice.lineItems.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    discountCents: l.discountCents,
  }))

  if (!lines.length) throw new DomainError('Minimal satu line item', 'missing_lines')

  let ppnEnabled = input.ppnEnabled ?? invoice.ppnEnabled
  let ppnRate = input.ppnRate ?? invoice.ppnRate
  let totals = computeInvoiceTotals(mapLines(lines), ppnEnabled, ppnRate)

  return prisma.$transaction(async (tx) => {
    if (input.lines) {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId } })
      await tx.invoiceLineItem.createMany({
        data: lines.map((line, index) => ({
          invoiceId,
          sortOrder: index,
          description: line.description.trim(),
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          discountCents: line.discountCents ?? 0,
        })),
      })
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: input.clientId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        ppnEnabled,
        ppnRate,
        footerNote: input.footerNote,
        subtotalCents: totals.subtotalCents,
        ppnCents: totals.ppnCents,
        totalCents: totals.totalCents,
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } }, client: true },
    })
  })
}

export async function deleteInvoiceDraft(userId: string, invoiceId: string) {
  let invoice = await getInvoice(userId, invoiceId)
  if (invoice.status !== 'draft') {
    throw new DomainError('Hanya draft yang dapat dihapus (BR-06)', 'not_draft', 409)
  }
  await prisma.invoice.delete({ where: { id: invoiceId } })
}

export async function sendInvoice(
  userId: string,
  invoiceId: string,
  options: { appUrl: string },
) {
  let sendPayload = await prisma.$transaction(async (tx) => {
    let invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { client: true, user: { include: { profile: true } } },
    })
    if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
    if (invoice.status !== 'draft') {
      throw new DomainError('Invoice sudah dikirim', 'already_sent', 409)
    }
    if (!invoice.client.email) throw new DomainError('Email klien wajib', 'missing_client_email')

    let number = await nextInvoiceNumberInTx(tx, userId, invoice.issueDate)
    let publicToken = randomBytes(24).toString('base64url')

    let updated = await tx.invoice.updateMany({
      where: { id: invoiceId, userId, status: 'draft' },
      data: {
        status: 'sent',
        number,
        publicToken,
        publicTokenRevokedAt: null,
        sentAt: new Date(),
      },
    })
    if (updated.count === 0) {
      throw new DomainError('Invoice sudah dikirim', 'already_sent', 409)
    }

    return {
      number,
      publicToken,
      to: invoice.client.email,
      legalName: invoice.user.profile?.legalName ?? 'Freelancer',
    }
  })

  let emailResult = await sendEmail({
    to: sendPayload.to,
    subject: `Invoice ${sendPayload.number} dari ${sendPayload.legalName}`,
    html: `<p>Invoice ${sendPayload.number} siap dibayar.</p><p><a href="${options.appUrl}/i/${sendPayload.publicToken}">Lihat invoice</a></p>`,
  })

  if (!emailResult.ok) {
    await prisma.invoice.updateMany({
      where: { id: invoiceId, userId, status: 'sent', number: sendPayload.number },
      data: { status: 'draft', number: null, publicToken: null, sentAt: null },
    })
    throw new DomainError(emailResult.error ?? 'Gagal mengirim email', 'email_failed', 502)
  }

  return getInvoice(userId, invoiceId)
}

export async function cancelInvoice(userId: string, invoiceId: string) {
  let invoice = await getInvoice(userId, invoiceId)
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new DomainError('Hanya invoice terkirim yang dapat dibatalkan', 'invalid_status', 409)
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'cancelled' },
    include: { client: true, lineItems: true },
  })
}

export async function markInvoicePaid(userId: string, invoiceId: string) {
  let invoice = await getInvoice(userId, invoiceId)
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new DomainError('Hanya invoice terkirim yang dapat ditandai lunas', 'invalid_status', 409)
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid', paidAt: new Date() },
    include: { client: true },
  })
}

export async function revokePublicLink(userId: string, invoiceId: string) {
  let invoice = await getInvoice(userId, invoiceId)
  if (invoice.status === 'draft' || invoice.status === 'cancelled') {
    throw new DomainError('Link publik tidak tersedia untuk draft', 'invalid_status', 409)
  }
  if (invoice.publicTokenRevokedAt) {
    throw new DomainError('Link sudah dicabut', 'already_revoked', 409)
  }
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { publicTokenRevokedAt: new Date() },
  })
}

export async function getInvoiceByPublicToken(token: string) {
  let invoice = await prisma.invoice.findFirst({
    where: { publicToken: token },
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' } },
      client: true,
      user: { include: { profile: true } },
    },
  })
  if (!invoice || invoice.publicTokenRevokedAt) {
    throw new DomainError('Link tidak valid atau dicabut', 'invalid_token', 404)
  }
  if (invoice.status === 'draft' || invoice.status === 'cancelled') {
    throw new DomainError('Invoice tidak tersedia', 'invalid_token', 404)
  }
  return invoice
}

export async function buildInvoicePdfBytes(userId: string, invoiceId: string) {
  let invoice = await getInvoice(userId, invoiceId)
  let profile = invoice.user.profile
  if (!profile) throw new DomainError('Profil bisnis belum lengkap', 'missing_profile')

  return generateInvoicePdf({
    number: invoice.number ?? 'DRAFT',
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    business: profile,
    client: invoice.client,
    lines: invoice.lineItems,
    subtotalCents: invoice.subtotalCents,
    ppnCents: invoice.ppnCents,
    totalCents: invoice.totalCents,
    ppnEnabled: invoice.ppnEnabled,
    footerNote: invoice.footerNote,
  })
}

export async function getDashboardSummary(userId: string) {
  await refreshOverdueInvoices(userId)
  let [invoices, outstandingAgg] = await Promise.all([
    listInvoices(userId),
    prisma.invoice.aggregate({
      where: { userId, status: { in: ['sent', 'overdue'] } },
      _sum: { totalCents: true },
      _count: true,
    }),
  ])

  return {
    invoices,
    outstandingCount: outstandingAgg._count,
    outstandingCents: outstandingAgg._sum.totalCents ?? 0,
  }
}

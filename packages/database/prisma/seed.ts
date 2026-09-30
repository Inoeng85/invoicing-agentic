import { computeInvoiceTotals } from '../../domain/src/invoiceTotals.ts'
import { hashPassword } from '../../domain/src/password.ts'
import { prisma } from '../src/client.ts'

const DEMO_EMAIL = (process.env.SEED_DEMO_USER_EMAIL ?? 'dewi.kartika@studio-kartika.demo').toLowerCase()
const DEMO_PASSWORD = process.env.SEED_DEMO_USER_PASSWORD ?? 'DemoStudio123!'

async function main() {
  let passwordHash = await hashPassword(DEMO_PASSWORD)
  let user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      profile: {
        create: {
          legalName: 'Studio Kartika',
          address: 'Jl. Senopati No. 12, Jakarta Selatan',
          footerDefault: 'Terima kasih atas kepercayaan Anda.',
        },
      },
    },
    include: { profile: true },
  })

  let clients = [
    { name: 'PT Arunika Digital', email: 'billing@arunika.demo', notes: 'Retainer bulanan' },
    { name: 'CV Nusantara Kreatif', email: 'finance@nusantara.demo' },
    { name: 'Budi Santoso', email: '—', notes: 'Tanpa email — kirim manual' },
    { name: 'Yayasan Cerdas Bangsa', email: 'admin@cerdasbangsa.demo' },
  ]

  let clientIds: Record<string, string> = {}
  for (let c of clients) {
    let existing = await prisma.client.findFirst({
      where: { userId: user.id, name: c.name },
    })
    if (existing) {
      clientIds[c.name] = existing.id
      continue
    }
    let created = await prisma.client.create({
      data: {
        userId: user.id,
        name: c.name,
        email: c.email,
        notes: c.notes,
      },
    })
    clientIds[c.name] = created.id
  }

  let line = {
    description: 'Jasa desain & development',
    quantity: 1,
    unitPriceCents: 25_000_000,
    discountCents: 0,
  }
  let totals = computeInvoiceTotals([line], true, 0.11)

  async function ensureInvoice(
    key: string,
    status: 'draft' | 'sent' | 'paid' | 'overdue',
    clientName: string,
  ) {
    let number = `SEED-${key}`
    let existing = await prisma.invoice.findFirst({
      where: { userId: user.id, number },
    })
    if (existing) return existing

    let issueDate = new Date()
    let dueDate = new Date(issueDate.getTime() + 30 * 86400000)
    if (status === 'overdue') {
      dueDate = new Date(issueDate.getTime() - 14 * 86400000)
    }

    return prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: clientIds[clientName]!,
        number,
        status,
        issueDate,
        dueDate,
        ppnEnabled: true,
        ppnRate: 0.11,
        subtotalCents: totals.subtotalCents,
        ppnCents: totals.ppnCents,
        totalCents: totals.totalCents,
        sentAt: status === 'sent' || status === 'overdue' || status === 'paid' ? new Date() : null,
        paidAt: status === 'paid' ? new Date() : null,
        publicToken: status === 'draft' ? null : `seed-public-${key}`,
        lineItems: {
          create: [{ sortOrder: 0, ...line }],
        },
      },
    })
  }

  await ensureInvoice('draft', 'draft', 'PT Arunika Digital')
  await ensureInvoice('sent', 'sent', 'CV Nusantara Kreatif')
  await ensureInvoice('overdue', 'overdue', 'Budi Santoso')
  await ensureInvoice('paid', 'paid', 'Yayasan Cerdas Bangsa')

  console.log(`db:seed — demo user ${DEMO_EMAIL} (Studio Kartika) ready`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

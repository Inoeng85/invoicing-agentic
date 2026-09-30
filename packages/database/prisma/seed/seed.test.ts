import '../../../domain/src/test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeCommissionCents } from '../../../domain/src/invoiceTotals.ts'
import { prisma } from '../../src/client.ts'
import { seedSampleClients } from './clients.ts'
import { seedSampleCollectors } from './collectors.ts'
import { ensureDemoUser } from './demo-user.ts'
import { seedSampleInvoices } from './invoices.ts'

const SAMPLE = { endsWith: '@sample.demo' }

describe('sample seed per module', () => {
  it('invoices refuse to run before clients and collectors exist', async () => {
    let userId = await ensureDemoUser()
    await assert.rejects(seedSampleInvoices(userId), /db:seed:clients/)
  })

  it('creates 100 clients, collectors and invoices, and is idempotent', async () => {
    let userId = await ensureDemoUser()
    assert.equal((await seedSampleClients(userId)).created, 100)
    assert.equal((await seedSampleCollectors(userId)).created, 100)
    assert.equal((await seedSampleInvoices(userId)).created, 100)

    assert.equal((await seedSampleClients(userId)).created, 0)
    assert.equal((await seedSampleCollectors(userId)).created, 0)
    assert.equal((await seedSampleInvoices(userId)).created, 0)

    assert.equal(await prisma.client.count({ where: { userId, email: SAMPLE } }), 100)
    assert.equal(await prisma.debtCollector.count({ where: { userId, email: SAMPLE } }), 100)
    assert.equal(await prisma.invoice.count({ where: { userId, number: { startsWith: 'SMP-' } } }), 100)
  })

  it('produces a realistic, internally consistent mix', async () => {
    let userId = await ensureDemoUser()
    let invoices = await prisma.invoice.findMany({
      where: { userId, number: { startsWith: 'SMP-' } },
      include: { lineItems: true, collectionAssignments: { include: { collector: true } } },
    })
    let byStatus = Object.fromEntries(
      ['draft', 'sent', 'overdue', 'paid', 'cancelled'].map((s) => [s, invoices.filter((i) => i.status === s).length]),
    )
    assert.deepEqual(byStatus, { draft: 20, sent: 35, overdue: 20, paid: 20, cancelled: 5 })

    for (let invoice of invoices) {
      assert.ok(invoice.lineItems.length >= 1 && invoice.lineItems.length <= 3, `${invoice.number} line items`)
      let outstanding = invoice.status === 'sent' || invoice.status === 'overdue'
      let active = invoice.collectionAssignments.filter((a) => a.endedAt === null)
      assert.ok(active.length <= 1, `${invoice.number} has at most one active assignment`)
      if (active[0]) {
        assert.ok(outstanding, `${invoice.number} active assignment only on outstanding invoices`)
        assert.ok(active[0].collector.active, `${invoice.number} assigned collector is active`)
      }
      if (invoice.status === 'overdue') assert.ok(invoice.dueDate < new Date(), `${invoice.number} overdue is past due`)
      if (invoice.status === 'sent') assert.ok(invoice.dueDate >= new Date(), `${invoice.number} sent is not yet due`)
      for (let ended of invoice.collectionAssignments.filter((a) => a.endReason === 'paid')) {
        assert.equal(invoice.status, 'paid')
        assert.equal(ended.commissionCents, computeCommissionCents(invoice.totalCents, ended.rateSnapshot))
      }
      if (invoice.status === 'draft' || invoice.status === 'cancelled') {
        assert.equal(invoice.collectionAssignments.length, 0, `${invoice.number} has no collection`)
      }
    }
    assert.ok(invoices.some((i) => i.collectionAssignments.some((a) => a.endedAt === null)), 'some active collection')
    assert.ok(invoices.some((i) => i.collectionAssignments.some((a) => a.endReason === 'paid')), 'some locked commission')

    let pinned = await prisma.client.count({ where: { userId, email: SAMPLE, latitude: { not: null } } })
    assert.ok(pinned >= 55 && pinned <= 85, `pinned clients ${pinned}`)
    let inactive = await prisma.debtCollector.count({ where: { userId, email: SAMPLE, active: false } })
    assert.equal(inactive, 10)
  })
})

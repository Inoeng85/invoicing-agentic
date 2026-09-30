import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import {
  createCollector,
  getCollector,
  listCollectors,
  listCollectorSummaries,
  setCollectorActive,
  updateCollector,
} from './collectors.ts'
import { assignCollector } from './collections.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('collectors (FR-14a/b, BR-09)', () => {
  it('creates a collector with trimmed name and nullable contact fields', async () => {
    let user = await makeUser()
    let collector = await createCollector(user.id, { name: '  Budi  ', email: '', commissionRate: 0.075 })
    assert.equal(collector.name, 'Budi')
    assert.equal(collector.email, null)
    assert.equal(collector.commissionRate, 0.075)
    assert.equal(collector.active, true)
  })

  it('rejects empty name', async () => {
    let user = await makeUser()
    await rejectsWith(createCollector(user.id, { name: '  ', commissionRate: 0.1 }), 'missing_name')
  })

  it('rejects invalid email', async () => {
    let user = await makeUser()
    await rejectsWith(createCollector(user.id, { name: 'Budi', email: 'bukan-email', commissionRate: 0.1 }), 'invalid_email')
  })

  it('rejects commission rate outside 0–1 or NaN', async () => {
    let user = await makeUser()
    for (let rate of [-0.01, 1.01, Number.NaN]) {
      await rejectsWith(createCollector(user.id, { name: 'Budi', commissionRate: rate }), 'invalid_commission_rate')
    }
  })

  it('hides collectors of other users', async () => {
    let owner = await makeUser()
    let other = await makeUser()
    let collector = await makeCollector(owner.id)
    await rejectsWith(getCollector(other.id, collector.id), 'collector_not_found')
    await rejectsWith(updateCollector(other.id, collector.id, { name: 'X' }), 'collector_not_found')
  })

  it('listCollectors excludes inactive by default', async () => {
    let user = await makeUser()
    let active = await makeCollector(user.id)
    await makeCollector(user.id, { active: false })
    let ids = (await listCollectors(user.id)).map((c) => c.id)
    assert.deepEqual(ids, [active.id])
    assert.equal((await listCollectors(user.id, true)).length, 2)
  })

  it('BR-09: cannot deactivate while holding an active assignment', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id)
    let assignment = await prisma.collectionAssignment.create({
      data: { userId: user.id, invoiceId: invoice.id, collectorId: collector.id, rateSnapshot: 0.1 },
    })
    await rejectsWith(setCollectorActive(user.id, collector.id, false), 'collector_has_active_assignments')

    await prisma.collectionAssignment.update({
      where: { id: assignment.id },
      data: { endedAt: new Date(), endReason: 'unassigned' },
    })
    let updated = await setCollectorActive(user.id, collector.id, false)
    assert.equal(updated.active, false)
  })

  it('BR-09 holds when deactivate races an assign', async () => {
    for (let round = 0; round < 5; round++) {
      let user = await makeUser()
      let client = await makeClient(user.id)
      let invoice = await makeInvoice(user.id, client.id)
      let collector = await makeCollector(user.id)
      await Promise.allSettled([
        setCollectorActive(user.id, collector.id, false),
        assignCollector(user.id, invoice.id, collector.id),
      ])
      let fresh = await getCollector(user.id, collector.id)
      let open = await prisma.collectionAssignment.count({ where: { collectorId: collector.id, endedAt: null } })
      assert.ok(fresh.active || open === 0, `round ${round}: inactive collector holds ${open} active assignment(s)`)
    }
  })

  it('summaries count active outstanding and earned commission', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let collector = await makeCollector(user.id)
    let open = await makeInvoice(user.id, client.id, { totalCents: 50_000_000 })
    let paid = await makeInvoice(user.id, client.id, { status: 'paid', totalCents: 20_000_000 })
    await prisma.collectionAssignment.create({
      data: { userId: user.id, invoiceId: open.id, collectorId: collector.id, rateSnapshot: 0.1 },
    })
    await prisma.collectionAssignment.create({
      data: {
        userId: user.id,
        invoiceId: paid.id,
        collectorId: collector.id,
        rateSnapshot: 0.1,
        endedAt: new Date(),
        endReason: 'paid',
        commissionCents: 2_000_000,
      },
    })
    let [summary] = await listCollectorSummaries(user.id)
    assert.equal(summary?.activeCount, 1)
    assert.equal(summary?.activeOutstandingCents, 50_000_000)
    assert.equal(summary?.earnedCommissionCents, 2_000_000)
  })
})

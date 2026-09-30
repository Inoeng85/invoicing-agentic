import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import {
  addCollectionActivity,
  assignCollector,
  getInvoiceCollection,
  unassignCollector,
} from './collections.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

async function setup(status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled' = 'sent') {
  let user = await makeUser()
  let client = await makeClient(user.id)
  let invoice = await makeInvoice(user.id, client.id, { status })
  let collector = await makeCollector(user.id, { commissionRate: 0.1 })
  return { user, client, invoice, collector }
}

describe('assignCollector (FR-14c, BR-07)', () => {
  it('assigns and snapshots the collector rate', async () => {
    let { user, invoice, collector } = await setup()
    let assignment = await assignCollector(user.id, invoice.id, collector.id)
    assert.equal(assignment.rateSnapshot, 0.1)
    assert.equal(assignment.endedAt, null)
  })

  it('accepts overdue invoices', async () => {
    let { user, invoice, collector } = await setup('overdue')
    let assignment = await assignCollector(user.id, invoice.id, collector.id)
    assert.equal(assignment.collectorId, collector.id)
  })

  it('rejects non-outstanding invoices', async () => {
    for (let status of ['draft', 'paid', 'cancelled'] as const) {
      let { user, invoice, collector } = await setup(status)
      await rejectsWith(assignCollector(user.id, invoice.id, collector.id), 'invoice_not_outstanding')
    }
  })

  it('rejects inactive collectors', async () => {
    let { user, invoice } = await setup()
    let inactive = await makeCollector(user.id, { active: false })
    await rejectsWith(assignCollector(user.id, invoice.id, inactive.id), 'collector_inactive')
  })

  it('rejects cross-user collector and invoice', async () => {
    let { user, invoice, collector } = await setup()
    let other = await setup()
    await rejectsWith(assignCollector(user.id, invoice.id, other.collector.id), 'collector_not_found')
    await rejectsWith(assignCollector(user.id, other.invoice.id, collector.id), 'not_found')
  })

  it('rejects assigning the same collector twice', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await rejectsWith(assignCollector(user.id, invoice.id, collector.id), 'already_assigned')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id } }), 1)
  })

  it('reassign closes the previous assignment', async () => {
    let { user, invoice, collector } = await setup()
    let second = await makeCollector(user.id, { commissionRate: 0.2 })
    await assignCollector(user.id, invoice.id, collector.id)
    await assignCollector(user.id, invoice.id, second.id)
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active?.collectorId, second.id)
    assert.equal(active?.rateSnapshot, 0.2)
    assert.equal(history.length, 2)
    assert.equal(history[1]?.endReason, 'reassigned')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id, endedAt: null } }), 1)
  })
})

describe('unassignCollector', () => {
  it('closes the active assignment as unassigned', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await unassignCollector(user.id, invoice.id)
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active, null)
    assert.equal(history[0]?.endReason, 'unassigned')
  })

  it('rejects when nothing is assigned', async () => {
    let { user, invoice } = await setup()
    await rejectsWith(unassignCollector(user.id, invoice.id), 'no_active_assignment')
  })
})

describe('addCollectionActivity (FR-14d)', () => {
  it('logs an activity on the active assignment', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await addCollectionActivity(user.id, invoice.id, {
      occurredAt: new Date(Date.now() - 60_000),
      outcome: 'promised_to_pay',
      note: '  Janji transfer Jumat  ',
    })
    let { active } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active?.activities.length, 1)
    assert.equal(active?.activities[0]?.outcome, 'promised_to_pay')
    assert.equal(active?.activities[0]?.note, 'Janji transfer Jumat')
  })

  it('rejects unknown outcome', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await rejectsWith(
      addCollectionActivity(user.id, invoice.id, { occurredAt: new Date(), outcome: 'bribed' }),
      'invalid_outcome',
    )
  })

  it('rejects future or invalid dates', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    for (let occurredAt of [new Date(Date.now() + 86_400_000), new Date(Number.NaN)]) {
      await rejectsWith(
        addCollectionActivity(user.id, invoice.id, { occurredAt, outcome: 'contacted' }),
        'invalid_occurred_at',
      )
    }
  })

  it('rejects when no collector is assigned', async () => {
    let { user, invoice } = await setup()
    await rejectsWith(
      addCollectionActivity(user.id, invoice.id, { occurredAt: new Date(), outcome: 'contacted' }),
      'no_active_assignment',
    )
  })
})

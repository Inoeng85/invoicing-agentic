import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import { assignCollector, getInvoiceCollection } from './collections.ts'
import { updateCollector } from './collectors.ts'
import { cancelInvoice, getInvoiceByPublicToken, listInvoices, markInvoicePaid } from './invoices.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('invoice lifecycle closes collection (BR-08)', () => {
  it('mark paid locks commission from the snapshot, not the current rate', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id, { totalCents: 111_000_000 })
    let collector = await makeCollector(user.id, { commissionRate: 0.1 })
    await assignCollector(user.id, invoice.id, collector.id)
    await updateCollector(user.id, collector.id, { commissionRate: 0.5 })

    let paid = await markInvoicePaid(user.id, invoice.id)
    assert.equal(paid.status, 'paid')
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active, null)
    assert.equal(history[0]?.endReason, 'paid')
    assert.equal(history[0]?.commissionCents, 11_100_000)
  })

  it('mark paid without a collector still works', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let paid = await markInvoicePaid(user.id, invoice.id)
    assert.equal(paid.status, 'paid')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id } }), 0)
  })

  it('cancel closes the assignment without commission', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id, { status: 'overdue' })
    let collector = await makeCollector(user.id)
    await assignCollector(user.id, invoice.id, collector.id)
    await cancelInvoice(user.id, invoice.id)
    let { history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(history[0]?.endReason, 'cancelled')
    assert.equal(history[0]?.commissionCents, null)
  })

  it('keeps existing status errors', async () => {
    let user = await makeUser()
    let other = await makeUser()
    let client = await makeClient(user.id)
    let draft = await makeInvoice(user.id, client.id, { status: 'draft' })
    await rejectsWith(markInvoicePaid(user.id, draft.id), 'invalid_status')
    await rejectsWith(cancelInvoice(user.id, draft.id), 'invalid_status')
    await rejectsWith(markInvoicePaid(other.id, draft.id), 'not_found')
  })
})

describe('listInvoices collector filter (FR-14f)', () => {
  it('returns only invoices actively assigned to the collector', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let collector = await makeCollector(user.id)
    let assigned = await makeInvoice(user.id, client.id)
    await makeInvoice(user.id, client.id)
    await assignCollector(user.id, assigned.id, collector.id)

    let rows = await listInvoices(user.id, undefined, collector.id)
    assert.deepEqual(rows.map((r) => r.id), [assigned.id])
    assert.equal(rows[0]?.collectionAssignments[0]?.collector.name, collector.name)
  })
})

describe('public invoice hides collection data (D-08)', () => {
  it('does not include collection assignments', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await prisma.invoice.update({ where: { id: invoice.id }, data: { publicToken: `tok-${invoice.id}` } })
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let pub = await getInvoiceByPublicToken(`tok-${invoice.id}`)
    assert.equal('collectionAssignments' in pub, false)
  })
})

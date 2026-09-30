import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import { assignCollector } from './collections.ts'
import {
  createTrackingLink,
  getTrackingSession,
  getTrackingView,
  recordCollectorLocation,
  revokeTrackingLink,
} from './collector-tracking.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

const HOME = { latitude: -6.2, longitude: 106.8 }
const NEARBY = { latitude: -6.21, longitude: 106.81 }

async function assigned() {
  let user = await makeUser()
  let client = await makeClient(user.id)
  await prisma.client.update({ where: { id: client.id }, data: HOME })
  let invoice = await makeInvoice(user.id, client.id)
  let collector = await makeCollector(user.id)
  await assignCollector(user.id, invoice.id, collector.id)
  return { user, client, invoice, collector }
}

describe('tracking links (FR-14i-1, BR-10)', () => {
  it('creates a link only for an active assignment', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await rejectsWith(createTrackingLink(user.id, invoice.id), 'no_active_assignment')
  })

  it('session exposes destination but no invoice money or number', async () => {
    let { user, invoice, client, collector } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    let session = await getTrackingSession(token)
    assert.equal(session.collectorName, collector.name)
    assert.equal(session.freelancerName, 'Studio Test')
    assert.deepEqual(session.client, { name: client.name, address: null, ...HOME })
    assert.equal(JSON.stringify(session).includes('totalCents'), false)
    assert.equal(JSON.stringify(session).includes(invoice.number!), false)
  })

  it('regenerating replaces the old token; revoke kills it', async () => {
    let { user, invoice } = await assigned()
    let first = await createTrackingLink(user.id, invoice.id)
    let second = await createTrackingLink(user.id, invoice.id)
    assert.notEqual(first, second)
    await rejectsWith(getTrackingSession(first), 'tracking_not_found')
    await revokeTrackingLink(user.id, invoice.id)
    await rejectsWith(getTrackingSession(second), 'tracking_not_found')
  })

  it('other users cannot manage the link', async () => {
    let { invoice } = await assigned()
    let other = await makeUser()
    await rejectsWith(createTrackingLink(other.id, invoice.id), 'not_found')
    await rejectsWith(revokeTrackingLink(other.id, invoice.id), 'not_found')
  })
})

describe('recordCollectorLocation (FR-14i-3, BR-12)', () => {
  it('stores the point and updates last position', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { ...NEARBY, accuracyM: 12, recordedAt: new Date() })
    let view = await getTrackingView(user.id, invoice.id)
    assert.equal(view.last?.latitude, NEARBY.latitude)
    assert.equal(view.last?.accuracyM, 12)
    assert.equal(view.trail.length, 1)
    assert.ok(view.distanceToClientM !== null && view.distanceToClientM > 1000 && view.distanceToClientM < 2000)
  })

  it('validates coordinates, accuracy and time', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await rejectsWith(recordCollectorLocation(token, { latitude: 99, longitude: 0, recordedAt: new Date() }), 'invalid_location')
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, accuracyM: 1500, recordedAt: new Date() }),
      'location_inaccurate',
    )
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date(Date.now() + 10 * 60_000) }),
      'invalid_location',
    )
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date(Date.now() - 24 * 3_600_000) }),
      'invalid_location',
    )
  })

  it('unknown or revoked token → tracking_ended', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await revokeTrackingLink(user.id, invoice.id)
    await rejectsWith(recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() }), 'tracking_ended')
    await rejectsWith(recordCollectorLocation('nope', { ...NEARBY, recordedAt: new Date() }), 'tracking_ended')
  })
})

describe('getTrackingView (FR-14i-4)', () => {
  it('is scoped to the owner', async () => {
    let { invoice } = await assigned()
    let other = await makeUser()
    await rejectsWith(getTrackingView(other.id, invoice.id), 'not_found')
  })

  it('without client pin there is no distance', async () => {
    let { user, invoice, client } = await assigned()
    await prisma.client.update({ where: { id: client.id }, data: { latitude: null, longitude: null } })
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
    let view = await getTrackingView(user.id, invoice.id)
    assert.equal(view.distanceToClientM, null)
    assert.equal(view.trackingActive, true)
  })

  it('trail only contains points from today', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    let assignment = await prisma.collectionAssignment.findFirstOrThrow({ where: { invoiceId: invoice.id } })
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await prisma.collectorLocation.create({ data: { assignmentId: assignment.id, ...HOME, recordedAt: yesterday } })
    await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
    assert.equal((await getTrackingView(user.id, invoice.id)).trail.length, 1)
  })
})

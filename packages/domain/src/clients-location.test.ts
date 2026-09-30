import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getClient, setClientLocation } from './clients.ts'
import { makeClient, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('setClientLocation (FR-14j)', () => {
  it('stores and clears the pin', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    await setClientLocation(user.id, client.id, { latitude: -6.2, longitude: 106.8 })
    let stored = await getClient(user.id, client.id)
    assert.deepEqual([stored.latitude, stored.longitude], [-6.2, 106.8])
    await setClientLocation(user.id, client.id, null)
    let cleared = await getClient(user.id, client.id)
    assert.deepEqual([cleared.latitude, cleared.longitude], [null, null])
  })

  it('rejects invalid coordinates and other users', async () => {
    let user = await makeUser()
    let other = await makeUser()
    let client = await makeClient(user.id)
    await rejectsWith(setClientLocation(user.id, client.id, { latitude: Number.NaN, longitude: 106 }), 'invalid_location')
    await rejectsWith(setClientLocation(other.id, client.id, { latitude: -6, longitude: 106 }), 'not_found')
  })
})

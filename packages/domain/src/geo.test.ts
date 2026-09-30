import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { assertValidCoordinates, distanceMeters } from './geo.ts'

const JAKARTA = { latitude: -6.2088, longitude: 106.8456 }
const BANDUNG = { latitude: -6.9175, longitude: 107.6191 }

describe('geo', () => {
  it('Jakarta–Bandung is about 116 km as the crow flies', () => {
    let km = distanceMeters(JAKARTA, BANDUNG) / 1000
    assert.ok(km > 114 && km < 118, `got ${km}`)
  })

  it('same point is 0 m', () => {
    assert.equal(distanceMeters(JAKARTA, JAKARTA), 0)
  })

  it('rejects out-of-range or non-finite coordinates', () => {
    for (let point of [
      { latitude: 91, longitude: 0 },
      { latitude: 0, longitude: -181 },
      { latitude: Number.NaN, longitude: 0 },
    ]) {
      assert.throws(() => assertValidCoordinates(point), (e: unknown) => (e as { code?: string }).code === 'invalid_location')
    }
    assertValidCoordinates(JAKARTA)
  })
})

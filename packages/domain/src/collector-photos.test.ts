import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MAX_COLLECTOR_PHOTO_BYTES,
  detectImageType,
  getCollectorPhoto,
  removeCollectorPhoto,
  setCollectorPhoto,
} from './collector-photos.ts'
import { getCollector, listCollectors } from './collectors.ts'
import { JPEG_BYTES, PNG_BYTES, WEBP_BYTES, makeCollector, makeUser } from './test-fixtures.ts'

const SVG_BYTES = new Uint8Array(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('detectImageType (D-04)', () => {
  it('detects JPEG, PNG and WebP from magic bytes', () => {
    assert.equal(detectImageType(JPEG_BYTES), 'image/jpeg')
    assert.equal(detectImageType(PNG_BYTES), 'image/png')
    assert.equal(detectImageType(WEBP_BYTES), 'image/webp')
  })

  it('rejects SVG, text and empty input', () => {
    assert.equal(detectImageType(SVG_BYTES), null)
    assert.equal(detectImageType(new TextEncoder().encode('hello')), null)
    assert.equal(detectImageType(new Uint8Array()), null)
  })
})

describe('collector photos (FR-14h)', () => {
  it('stores a photo and returns identical bytes with the detected type', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let updated = await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    assert.ok(updated.photoUpdatedAt instanceof Date)
    let photo = await getCollectorPhoto(user.id, collector.id)
    assert.equal(photo.mimeType, 'image/png')
    assert.deepEqual(Array.from(photo.bytes), Array.from(PNG_BYTES))
  })

  it('replacing a photo updates type and timestamp', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let first = await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    await new Promise((resolve) => setTimeout(resolve, 5))
    let second = await setCollectorPhoto(user.id, collector.id, JPEG_BYTES)
    assert.ok(second.photoUpdatedAt!.getTime() > first.photoUpdatedAt!.getTime())
    assert.equal((await getCollectorPhoto(user.id, collector.id)).mimeType, 'image/jpeg')
  })

  it('rejects files over the size limit', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let big = new Uint8Array(MAX_COLLECTOR_PHOTO_BYTES + 1)
    big.set(PNG_BYTES)
    await rejectsWith(setCollectorPhoto(user.id, collector.id, big), 'photo_too_large')
  })

  it('rejects SVG regardless of what the browser claimed', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    await rejectsWith(setCollectorPhoto(user.id, collector.id, SVG_BYTES), 'photo_invalid_type')
  })

  it('scopes photos to the owner', async () => {
    let owner = await makeUser()
    let other = await makeUser()
    let collector = await makeCollector(owner.id)
    await setCollectorPhoto(owner.id, collector.id, PNG_BYTES)
    await rejectsWith(setCollectorPhoto(other.id, collector.id, PNG_BYTES), 'collector_not_found')
    await rejectsWith(getCollectorPhoto(other.id, collector.id), 'photo_not_found')
    await rejectsWith(removeCollectorPhoto(other.id, collector.id), 'collector_not_found')
  })

  it('remove clears the photo and is idempotent', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    await removeCollectorPhoto(user.id, collector.id)
    await removeCollectorPhoto(user.id, collector.id)
    assert.equal((await getCollector(user.id, collector.id)).photoUpdatedAt, null)
    await rejectsWith(getCollectorPhoto(user.id, collector.id), 'photo_not_found')
  })

  it('collector queries never carry photo bytes', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    let [row] = await listCollectors(user.id)
    assert.equal(row !== undefined && 'photo' in row, false)
    assert.equal(row !== undefined && 'bytes' in row, false)
  })
})

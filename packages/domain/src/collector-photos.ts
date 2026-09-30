import { prisma, type Prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'

export const MAX_COLLECTOR_PHOTO_BYTES = 1_000_000

export type CollectorPhotoMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

// The type comes from the file's own bytes, never the browser-declared MIME, so an SVG/HTML
// payload renamed to .png can't be stored and later served as active content.
export function detectImageType(bytes: Uint8Array): CollectorPhotoMimeType | null {
  let at = (offset: number, signature: number[]) => signature.every((b, i) => bytes[offset + i] === b)
  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp'
  return null
}

async function requireOwnedCollectorInTx(tx: Prisma.TransactionClient, userId: string, collectorId: string) {
  let collector = await tx.debtCollector.findFirst({ where: { id: collectorId, userId }, select: { id: true } })
  if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
}

export async function setCollectorPhoto(userId: string, collectorId: string, bytes: Uint8Array<ArrayBuffer>) {
  if (bytes.byteLength > MAX_COLLECTOR_PHOTO_BYTES) {
    throw new DomainError('Foto maksimal 1 MB', 'photo_too_large')
  }
  let mimeType = detectImageType(bytes)
  if (!mimeType) {
    throw new DomainError('Format foto harus JPG, PNG, atau WebP', 'photo_invalid_type')
  }
  return prisma.$transaction(async (tx) => {
    await requireOwnedCollectorInTx(tx, userId, collectorId)
    await tx.debtCollectorPhoto.upsert({
      where: { collectorId },
      create: { collectorId, bytes, mimeType },
      update: { bytes, mimeType },
    })
    return tx.debtCollector.update({ where: { id: collectorId }, data: { photoUpdatedAt: new Date() } })
  })
}

export async function removeCollectorPhoto(userId: string, collectorId: string) {
  return prisma.$transaction(async (tx) => {
    await requireOwnedCollectorInTx(tx, userId, collectorId)
    await tx.debtCollectorPhoto.deleteMany({ where: { collectorId } })
    return tx.debtCollector.update({ where: { id: collectorId }, data: { photoUpdatedAt: null } })
  })
}

export async function getCollectorPhoto(userId: string, collectorId: string) {
  let photo = await prisma.debtCollectorPhoto.findFirst({
    where: { collectorId, collector: { userId } },
    select: { bytes: true, mimeType: true, updatedAt: true },
  })
  if (!photo) throw new DomainError('Foto tidak ditemukan', 'photo_not_found', 404)
  return photo
}

import { randomBytes } from 'node:crypto'

import { prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'
import { assertValidCoordinates, distanceMeters, type GeoPoint } from './geo.ts'

export const MAX_LOCATION_ACCURACY_M = 1000
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

async function requireOwnedInvoice(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
}

export async function createTrackingLink(userId: string, invoiceId: string): Promise<string> {
  await requireOwnedInvoice(userId, invoiceId)
  let token = randomBytes(24).toString('base64url')
  let updated = await prisma.collectionAssignment.updateMany({
    where: { invoiceId, userId, endedAt: null },
    data: { trackingToken: token },
  })
  if (updated.count === 0) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
  return token
}

export async function revokeTrackingLink(userId: string, invoiceId: string): Promise<void> {
  await requireOwnedInvoice(userId, invoiceId)
  await prisma.collectionAssignment.updateMany({
    where: { invoiceId, userId, endedAt: null },
    data: { trackingToken: null },
  })
}

export async function getTrackingSession(token: string) {
  let assignment = await prisma.collectionAssignment.findFirst({
    where: { trackingToken: token, endedAt: null },
    select: {
      collector: { select: { name: true } },
      user: { select: { profile: { select: { legalName: true } } } },
      invoice: { select: { client: { select: { name: true, address: true, latitude: true, longitude: true } } } },
    },
  })
  if (!assignment) throw new DomainError('Link tracking tidak aktif', 'tracking_not_found', 404)
  return {
    collectorName: assignment.collector.name,
    freelancerName: assignment.user.profile?.legalName ?? 'Freelancer',
    client: assignment.invoice.client,
  }
}

export type TrackingSession = Awaited<ReturnType<typeof getTrackingSession>>

export async function recordCollectorLocation(
  token: string,
  input: GeoPoint & { accuracyM?: number | null; recordedAt: Date },
): Promise<void> {
  assertValidCoordinates(input)
  let accuracyM = input.accuracyM ?? null
  if (accuracyM !== null && !(Number.isFinite(accuracyM) && accuracyM >= 0)) {
    throw new DomainError('Akurasi tidak valid', 'invalid_location')
  }
  if (accuracyM !== null && accuracyM > MAX_LOCATION_ACCURACY_M) {
    throw new DomainError('Lokasi kurang akurat', 'location_inaccurate', 422)
  }
  let recordedMs = input.recordedAt.getTime()
  if (!Number.isFinite(recordedMs) || recordedMs > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new DomainError('Waktu lokasi tidak valid', 'invalid_location')
  }

  await prisma.$transaction(async (tx) => {
    let assignment = await tx.collectionAssignment.findFirst({
      where: { trackingToken: token, endedAt: null },
      select: { id: true, assignedAt: true },
    })
    if (!assignment) throw new DomainError('Penugasan sudah selesai', 'tracking_ended', 410)
    if (recordedMs < assignment.assignedAt.getTime()) {
      throw new DomainError('Waktu lokasi tidak valid', 'invalid_location')
    }
    await tx.collectorLocation.create({
      data: {
        assignmentId: assignment.id,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyM,
        recordedAt: input.recordedAt,
      },
    })
    await tx.collectionAssignment.update({
      where: { id: assignment.id },
      data: {
        lastLatitude: input.latitude,
        lastLongitude: input.longitude,
        lastAccuracyM: accuracyM,
        lastLocationAt: input.recordedAt,
      },
    })
  })
}

export async function getTrackingView(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: {
      client: { select: { name: true, address: true, latitude: true, longitude: true } },
      collectionAssignments: {
        orderBy: { assignedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          endedAt: true,
          trackingToken: true,
          lastLatitude: true,
          lastLongitude: true,
          lastAccuracyM: true,
          lastLocationAt: true,
          collector: { select: { id: true, name: true, photoUpdatedAt: true } },
        },
      },
    },
  })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)

  let latest = invoice.collectionAssignments[0] ?? null
  let active = latest && latest.endedAt === null ? latest : null
  let startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  let trail = active
    ? await prisma.collectorLocation.findMany({
        where: { assignmentId: active.id, recordedAt: { gte: startOfToday } },
        orderBy: { recordedAt: 'asc' },
        select: { latitude: true, longitude: true, recordedAt: true },
      })
    : []

  let last =
    latest?.lastLocationAt && latest.lastLatitude !== null && latest.lastLongitude !== null
      ? {
          latitude: latest.lastLatitude,
          longitude: latest.lastLongitude,
          accuracyM: latest.lastAccuracyM,
          at: latest.lastLocationAt,
        }
      : null
  let { client } = invoice
  let clientPoint =
    client.latitude !== null && client.longitude !== null
      ? { latitude: client.latitude, longitude: client.longitude }
      : null

  return {
    client,
    collector: latest?.collector ?? null,
    assignmentActive: active !== null,
    trackingActive: Boolean(active?.trackingToken),
    last,
    trail,
    distanceToClientM: last && clientPoint ? Math.round(distanceMeters(last, clientPoint)) : null,
  }
}

export type TrackingView = Awaited<ReturnType<typeof getTrackingView>>

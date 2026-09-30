import { prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'
import { assertValidCoordinates, type GeoPoint } from './geo.ts'

export async function listClients(userId: string, includeInactive = false) {
  return prisma.client.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: { name: 'asc' },
  })
}

export async function getClient(userId: string, clientId: string) {
  let client = await prisma.client.findFirst({ where: { id: clientId, userId } })
  if (!client) throw new DomainError('Klien tidak ditemukan', 'not_found', 404)
  return client
}

export async function createClient(
  userId: string,
  input: { name: string; email: string; address?: string; notes?: string },
) {
  if (!input.name.trim()) throw new DomainError('Nama klien wajib', 'missing_name')
  if (!input.email.trim().includes('@')) throw new DomainError('Email klien wajib', 'missing_email')

  return prisma.client.create({
    data: {
      userId,
      name: input.name.trim(),
      email: input.email.trim(),
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  })
}

export async function updateClient(
  userId: string,
  clientId: string,
  input: {
    name?: string
    email?: string
    address?: string | null
    notes?: string | null
    active?: boolean
  },
) {
  await getClient(userId, clientId)
  if (input.email !== undefined && !input.email.trim().includes('@')) {
    throw new DomainError('Email klien wajib', 'missing_email')
  }

  return prisma.client.update({
    where: { id: clientId },
    data: {
      name: input.name?.trim(),
      email: input.email?.trim(),
      address: input.address,
      notes: input.notes,
      active: input.active,
    },
  })
}

export async function deactivateClient(userId: string, clientId: string) {
  return updateClient(userId, clientId, { active: false })
}

export async function setClientLocation(userId: string, clientId: string, location: GeoPoint | null) {
  await getClient(userId, clientId)
  if (location) assertValidCoordinates(location)
  return prisma.client.update({
    where: { id: clientId },
    data: { latitude: location?.latitude ?? null, longitude: location?.longitude ?? null },
  })
}

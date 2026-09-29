import { prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'
import { hashPassword, verifyPassword } from './password.ts'
import { createSessionToken } from './session.ts'

export async function registerUser(input: {
  email: string
  password: string
  legalName: string
}): Promise<{ userId: string; sessionToken: string }> {
  let email = input.email.trim().toLowerCase()
  if (!email.includes('@')) throw new DomainError('Email tidak valid', 'invalid_email')
  if (input.password.length < 8) {
    throw new DomainError('Password minimal 8 karakter', 'weak_password')
  }
  if (!input.legalName.trim()) {
    throw new DomainError('Nama bisnis wajib', 'missing_legal_name')
  }

  let existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new DomainError('Email sudah terdaftar', 'email_taken', 409)

  let passwordHash = await hashPassword(input.password)
  let user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          legalName: input.legalName.trim(),
        },
      },
    },
  })

  return { userId: user.id, sessionToken: createSessionToken(user.id) }
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<{ userId: string; sessionToken: string }> {
  let email = input.email.trim().toLowerCase()
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new DomainError('Email atau password salah', 'invalid_credentials', 401)

  let ok = await verifyPassword(input.password, user.passwordHash)
  if (!ok) throw new DomainError('Email atau password salah', 'invalid_credentials', 401)

  return { userId: user.id, sessionToken: createSessionToken(user.id) }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })
}

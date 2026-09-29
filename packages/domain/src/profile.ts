import { prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'

export async function updateBusinessProfile(
  userId: string,
  input: {
    legalName?: string
    address?: string | null
    npwp?: string | null
    bankDetails?: string | null
    footerDefault?: string | null
    logoUrl?: string | null
    defaultDueDays?: number
  },
) {
  if (input.legalName !== undefined && !input.legalName.trim()) {
    throw new DomainError('Nama bisnis wajib', 'missing_legal_name')
  }

  return prisma.businessProfile.update({
    where: { userId },
    data: {
      legalName: input.legalName?.trim(),
      address: input.address,
      npwp: input.npwp,
      bankDetails: input.bankDetails,
      footerDefault: input.footerDefault,
      logoUrl: input.logoUrl,
      defaultDueDays: input.defaultDueDays,
    },
  })
}

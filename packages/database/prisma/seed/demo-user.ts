import { hashPassword } from '../../../domain/src/password.ts'
import { prisma } from '../../src/client.ts'

const DEMO_EMAIL = (process.env.SEED_DEMO_USER_EMAIL ?? 'dewi.kartika@studio-kartika.demo').toLowerCase()
const DEMO_PASSWORD = process.env.SEED_DEMO_USER_PASSWORD ?? 'DemoStudio123!'

/** Same demo account as prisma/seed.ts, so sample data shows up after logging in with it. */
export async function ensureDemoUser(): Promise<string> {
  let existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } })
  if (existing) return existing.id
  let user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      profile: {
        create: {
          legalName: 'Studio Kartika',
          address: 'Jl. Senopati No. 12, Jakarta Selatan',
          footerDefault: 'Terima kasih atas kepercayaan Anda.',
        },
      },
    },
  })
  return user.id
}

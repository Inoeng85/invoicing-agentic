import { prisma } from '../../src/client.ts'
import { FIRST_NAMES, LAST_NAMES } from './names.ts'
import { createRandom, sampleEmail, SAMPLE_SIZE } from './random.ts'

export interface SampleCollector {
  name: string
  email: string
  phone: string
  notes: string | null
  commissionRate: number
  active: boolean
}

export function buildSampleCollectors(): SampleCollector[] {
  let random = createRandom(2026_1001)
  let used = new Set<string>()
  return Array.from({ length: SAMPLE_SIZE }, (_, index) => {
    let name: string
    do {
      name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`
      // 20×20 name pairs cannot give 100 unique people once repeats pile up; a middle initial keeps them distinct.
      if (used.has(name)) name = `${name.split(' ')[0]} ${String.fromCharCode(65 + random.int(0, 25))}. ${name.split(' ')[1]}`
    } while (used.has(name))
    used.add(name)
    return {
      name,
      email: sampleEmail('kolektor', index),
      phone: `08${random.int(11, 99)}${String(random.int(0, 99_999_999)).padStart(8, '0')}`,
      notes: random.chance(0.2) ? random.pick(['Area Jakarta Selatan', 'Bisa bahasa Sunda', 'Punya motor', 'Shift malam']) : null,
      commissionRate: random.int(5, 15) / 100,
      active: index % 10 !== 9,
    }
  })
}

export async function seedSampleCollectors(userId: string) {
  let created = 0
  for (let collector of buildSampleCollectors()) {
    let existing = await prisma.debtCollector.findFirst({ where: { userId, email: collector.email }, select: { id: true } })
    if (existing) continue
    await prisma.debtCollector.create({ data: { userId, ...collector } })
    created++
  }
  return { created, total: SAMPLE_SIZE }
}

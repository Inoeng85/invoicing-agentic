import { prisma } from '../../src/client.ts'
import { CITIES, FIRST_NAMES, LAST_NAMES } from './names.ts'
import { createRandom, sampleEmail, SAMPLE_SIZE } from './random.ts'

const COMPANY_PREFIXES = ['PT', 'CV', 'UD', 'Yayasan', 'Koperasi'] as const
const COMPANY_WORDS = [
  'Arunika', 'Nusantara', 'Cahaya', 'Samudra', 'Mitra', 'Karya', 'Sentosa', 'Bumi', 'Lintas', 'Garuda',
  'Harapan', 'Makmur', 'Sinergi', 'Pelangi', 'Andalas', 'Kencana', 'Mandiri', 'Semesta', 'Prima', 'Jaya',
] as const

export interface SampleClient {
  name: string
  email: string
  address: string
  notes: string | null
  latitude: number | null
  longitude: number | null
}

export function buildSampleClients(): SampleClient[] {
  let random = createRandom(2026_0930)
  let used = new Set<string>()
  return Array.from({ length: SAMPLE_SIZE }, (_, index) => {
    let name: string
    do {
      name =
        index % 10 < 7
          ? `${random.pick(COMPANY_PREFIXES)} ${random.pick(COMPANY_WORDS)} ${random.pick(COMPANY_WORDS)}`
          : `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`
    } while (used.has(name))
    used.add(name)
    let city = random.pick(CITIES)
    let pinned = random.chance(0.7)
    return {
      name,
      email: sampleEmail('klien', index),
      address: `${random.pick(city.streets)} No. ${random.int(1, 150)}, ${city.name}`,
      notes: random.chance(0.3) ? random.pick(['Retainer bulanan', 'PIC bagian keuangan', 'Termin 50/50', 'Minta faktur via email']) : null,
      // Jitter around the city centre so pins spread over the city instead of stacking.
      latitude: pinned ? Number((city.latitude + (random.next() - 0.5) * 0.08).toFixed(6)) : null,
      longitude: pinned ? Number((city.longitude + (random.next() - 0.5) * 0.08).toFixed(6)) : null,
    }
  })
}

export async function seedSampleClients(userId: string) {
  let created = 0
  for (let client of buildSampleClients()) {
    let existing = await prisma.client.findFirst({ where: { userId, email: client.email }, select: { id: true } })
    if (existing) continue
    await prisma.client.create({ data: { userId, ...client } })
    created++
  }
  return { created, total: SAMPLE_SIZE }
}

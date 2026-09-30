// Seeded PRNG (mulberry32) so every run produces the same sample data.
export function createRandom(seed: number) {
  let state = seed >>> 0
  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    chance: (probability: number) => next() < probability,
  }
}

export type Random = ReturnType<typeof createRandom>

export function sampleEmail(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, '0')}@sample.demo`
}

export const SAMPLE_EMAIL = { endsWith: '@sample.demo' } as const
export const SAMPLE_SIZE = 100

export function parsePercentInput(value: string): number {
  let trimmed = value.trim()
  if (!trimmed) return Number.NaN
  let percent = Number(trimmed.replace(',', '.'))
  // Round through basis points so "7.5" becomes exactly 0.075, not 0.07500000000000001.
  return Math.round(percent * 100) / 10_000
}

export function formatPercentInput(rate: number): string {
  return String(Math.round(rate * 10_000) / 100)
}

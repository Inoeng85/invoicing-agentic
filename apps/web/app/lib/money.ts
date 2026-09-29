export function idrToCents(idr: number): number {
  return Math.round(idr * 100)
}

export function parseIdrInput(value: string): number {
  let cleaned = value.replace(/[^\d]/g, '')
  return Number.parseInt(cleaned || '0', 10)
}

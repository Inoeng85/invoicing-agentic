export interface LineItemInput {
  quantity: number
  unitPriceCents: number
  discountCents: number
}

export interface InvoiceTotals {
  subtotalCents: number
  ppnCents: number
  totalCents: number
}

export function computeLineSubtotalCents(line: LineItemInput): number {
  let raw = Math.round(line.quantity * line.unitPriceCents) - line.discountCents
  return Math.max(0, raw)
}

export function computeInvoiceTotals(
  lines: LineItemInput[],
  ppnEnabled: boolean,
  ppnRate: number,
): InvoiceTotals {
  let subtotalCents = lines.reduce((sum, line) => sum + computeLineSubtotalCents(line), 0)
  let ppnCents = ppnEnabled ? Math.round(subtotalCents * ppnRate) : 0
  let totalCents = subtotalCents + ppnCents
  return { subtotalCents, ppnCents, totalCents }
}

export function computeCommissionCents(totalCents: number, rate: number): number {
  return Math.round(totalCents * rate)
}

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { formatIdr } from './money.ts'

export interface InvoicePdfInput {
  number: string
  issueDate: Date
  dueDate: Date
  business: {
    legalName: string
    address?: string | null
    bankDetails?: string | null
    npwp?: string | null
  }
  client: { name: string; email: string; address?: string | null }
  lines: Array<{
    description: string
    quantity: number
    unitPriceCents: number
    discountCents: number
  }>
  subtotalCents: number
  ppnCents: number
  totalCents: number
  ppnEnabled: boolean
  footerNote?: string | null
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  let doc = await PDFDocument.create()
  let page = doc.addPage([595, 842])
  let font = await doc.embedFont(StandardFonts.Helvetica)
  let bold = await doc.embedFont(StandardFonts.HelveticaBold)
  let y = 800

  const draw = (text: string, size = 11, useBold = false) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0.1, 0.1, 0.1) })
    y -= size + 6
  }

  draw(input.business.legalName, 16, true)
  if (input.business.address) draw(input.business.address)
  if (input.business.npwp) draw(`NPWP: ${input.business.npwp}`)
  y -= 8
  draw(`Invoice ${input.number}`, 14, true)
  draw(`Tanggal: ${input.issueDate.toISOString().slice(0, 10)}`)
  draw(`Jatuh tempo: ${input.dueDate.toISOString().slice(0, 10)}`)
  y -= 8
  draw(`Kepada: ${input.client.name}`, 12, true)
  draw(input.client.email)
  if (input.client.address) draw(input.client.address)
  y -= 8

  for (let line of input.lines) {
    let lineTotal =
      Math.max(0, Math.round(line.quantity * line.unitPriceCents) - line.discountCents)
    draw(
      `${line.description} · ${line.quantity} × ${formatIdr(line.unitPriceCents)} = ${formatIdr(lineTotal)}`,
    )
  }

  y -= 8
  draw(`Subtotal: ${formatIdr(input.subtotalCents)}`)
  if (input.ppnEnabled) draw(`PPN: ${formatIdr(input.ppnCents)}`)
  draw(`Total: ${formatIdr(input.totalCents)}`, 12, true)
  if (input.business.bankDetails) {
    y -= 8
    draw('Rekening:', 11, true)
    draw(input.business.bankDetails)
  }
  if (input.footerNote) {
    y -= 8
    draw(input.footerNote)
  }

  return doc.save()
}

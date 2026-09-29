import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeInvoiceTotals } from './invoiceTotals.ts'

describe('computeInvoiceTotals (FR-03 / BR-04)', () => {
  it('UAT-FR-03-a: PPN 11% on subtotal 1_000_000 IDR', () => {
    let lines = [{ quantity: 1, unitPriceCents: 100_000_000, discountCents: 0 }]
    let totals = computeInvoiceTotals(lines, true, 0.11)
    assert.equal(totals.subtotalCents, 100_000_000)
    assert.equal(totals.ppnCents, 11_000_000)
    assert.equal(totals.totalCents, 111_000_000)
  })

  it('UAT-FR-03-b: PPN off equals subtotal', () => {
    let lines = [{ quantity: 1, unitPriceCents: 100_000_000, discountCents: 0 }]
    let totals = computeInvoiceTotals(lines, false, 0.11)
    assert.equal(totals.ppnCents, 0)
    assert.equal(totals.totalCents, totals.subtotalCents)
  })

  it('UAT-FR-03-c: PPN base after line discount', () => {
    let lines = [{ quantity: 2, unitPriceCents: 50_000_000, discountCents: 10_000_000 }]
    let totals = computeInvoiceTotals(lines, true, 0.11)
    assert.equal(totals.subtotalCents, 90_000_000)
    assert.equal(totals.ppnCents, 9_900_000)
    assert.equal(totals.totalCents, 99_900_000)
  })
})

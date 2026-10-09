# PRD-0301 — PPN Kalkulator (FR-03)

| Meta | Nilai |
|------|-------|
| ID | **0301** (subfeature **03**) |
| Prioritas dev | **5** |
| Gate | **G3** |
| FR | **FR-03** |
| BR | **BR-04** |
| Development phase | [0301_PRD_PPN_Kalkulator_Development_phase.md](0301_PRD_PPN_Kalkulator_Development_phase.md) |

## Ringkasan

PPN opsional per invoice; tarif default **11%**; basis PPN = subtotal setelah diskon baris (BR-04).

## Requirement

| ID | Requirement |
|----|-------------|
| FR-03 | Toggle PPN on/off per invoice |
| FR-03a | Default rate 11% |
| FR-03b | 3 skenario uji kalkulasi lulus (domain tests) |
| BR-04 | PPN base = subtotal after line discounts |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | `npm run test:domain` — 3 skenario FR-03 pass |
| AC-02 | Gate G3.2: PPN 11jt on 100jt subtotal |
| AC-03 | UAT UAT-FR-03-a/b/c pass |

## Dependensi

- **0300** invoice draft & line items

## Referensi

- `@invoicing/domain` — `computeInvoiceTotals`

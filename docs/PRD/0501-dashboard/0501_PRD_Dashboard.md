# PRD-0501 — Dashboard Invoice (FR-08)

| Meta | Nilai |
|------|-------|
| ID | **0501** (subfeature **05**) |
| Prioritas dev | **10** |
| Gate | **G5** |
| FR | **FR-08** |
| BR | **BR-03** |
| Development phase | [0501_PRD_Dashboard_Development_phase.md](./0501_PRD_Dashboard_Development_phase.md) |

## Ringkasan

Dashboard daftar invoice dengan filter status dan ringkasan jumlah **outstanding** (sent + overdue unpaid).

## Requirement

| ID | Requirement |
|----|-------------|
| FR-08 | List invoice, filter status, outstanding count/sum |
| BR-03 | `overdue` = `due_date` < today AND status `sent` |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | Filters: draft, sent, paid, overdue |
| AC-02 | Outstanding metric matches BR-03 |
| AC-03 | Gate G5.2 dashboard checks |
| AC-04 | UAT dashboard stories pass |

## Dependensi

- **0500** (status paid)
- **0401** (sent invoices exist)

## Referensi

- [WIREFRAMES.md](../../invoicing/brd/WIREFRAMES.md)
- [PRODUCT-BRIEF.md](../../invoicing/brd/PRODUCT-BRIEF.md)

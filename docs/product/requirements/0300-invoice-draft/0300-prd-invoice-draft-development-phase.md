---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0300 — Invoice Draft · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0300** |
| Gate | **G3** (with 0301) |

## Task

| Task | Output |
|------|--------|
| 030001-db-invoice-line-items | Invoice, LineItem models |
| 030002-domain-draft-totals-base | Subtotal, discount per line (pre-PPN) |
| 030003-be-invoice-draft-crud | API draft CRUD |
| 030004-fe-invoice-editor | Web draft UI |
| 030005-fe-invoice-list-draft | List/filter draft |
| 030006-domain-br01-guards | Reject line edit when not draft |

## Urutan

DB → domain totals base → BR-01 guards → API → web editor → list

## Handoff ke 0301

- `computeInvoiceTotals` extension for PPN toggle & rate

## DoD

- [ ] ≥1 line item validation
- [ ] ClientId required on create

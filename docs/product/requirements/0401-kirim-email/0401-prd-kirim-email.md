---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0401 — Kirim Invoice Email (FR-05)

| Meta | Nilai |
|------|-------|
| ID | **0401** (subfeature **04**) |
| Prioritas dev | **7** |
| Gate | **G4** |
| FR | **FR-05** |
| BR | **BR-02** |
| Gap | **G-13** (email failure UX) |
| Development phase | [0401-prd-kirim-email-development-phase.md](0401-prd-kirim-email-development-phase.md) |

## Ringkasan

Kirim invoice ke email klien: assign nomor invoice, token public, set status `sent` + `sent_at`. Email gagal → status tetap **draft** (BRD).

## Requirement

| ID | Requirement |
|----|-------------|
| FR-05 | Status `sent`, `sent_at`; email terkirim atau error jelas |
| BR-02 | Nomor invoice immutable setelah `sent` |
| BR-01 | Tidak edit line material setelah sent |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | Send assigns invoice number + public token |
| AC-02 | Email adapter: log (dev) / Resend (staging prod, PRD-0000) |
| AC-03 | On email failure: remain draft, user-visible error |
| AC-04 | Gate G4.2 send flow |

## Dependensi

- **0400** PDF (attachment atau link)
- **0000** email provider staging (G-04)

## Referensi

- [mvp-scope-lock.md](../../brd/mvp-scope-lock.md)

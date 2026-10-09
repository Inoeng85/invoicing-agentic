# PRD-0400 — PDF Invoice (FR-04)

| Meta | Nilai |
|------|-------|
| ID | **0400** |
| Prioritas dev | **6** |
| Gate | **G4** (partial) |
| FR | **FR-04** |
| Development phase | [0400_PRD_PDF_Invoice_Development_phase.md](0400_PRD_PDF_Invoice_Development_phase.md) |

## Ringkasan

Generate PDF invoice dari data draft/sent: logo, nomor (jika assigned), tanggal, due date, rekening, line items, total/PPN.

## Requirement

| ID | Requirement |
|----|-------------|
| FR-04 | PDF berisi field wajib MVP |
| FR-04a | Download via API + web |
| FR-04b | `Content-Type: application/pdf` |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | PDF bytes valid (pdf-lib) |
| AC-02 | Gate G4 section PDF check pass |
| AC-03 | Selaras preview web / design tokens (PRD-0000 O-5) |

## Dependensi

- **0301** G3 (data invoice lengkap)

## Scope (out)

- Kirim email → **0401**
- Public link → **0402**

## Referensi

- [ARCHITECTURE-ALIGNMENT.md](../../brd/ARCHITECTURE-ALIGNMENT.md) FR-04

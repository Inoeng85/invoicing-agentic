# PRD-0300 — Invoice Draft (FR-02)

| Meta | Nilai |
|------|-------|
| ID | **0300** |
| Prioritas dev | **4** |
| Gate | **G3** (partial — PPN di **0301**) |
| FR | **FR-02** |
| BR | **BR-01**, **BR-06** |
| Development phase | [0300_PRD_Invoice_Draft_Development_phase.md](0300_PRD_Invoice_Draft_Development_phase.md) |

## Ringkasan

Buat dan edit invoice dalam status **draft** dengan minimal satu line item; subtotal dan grand total dihitung otomatis (PPN detail di PRD-0301).

## Requirement

| ID | Requirement |
|----|-------------|
| FR-02 | CRUD draft; ≥1 line item; subtotal/grand total otomatis |
| BR-01 | Edit material line items hanya saat `draft`; setelah `sent` tidak edit material |
| BR-06 | Hard delete hanya `draft`; lainnya arsip/nonaktif |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | Create/update draft only untuk line items |
| AC-02 | Subtotal & total tersimpan di DB |
| AC-03 | Gate G3.2 draft 201 (PPN assertion may depend on 0301) |
| AC-04 | Pilih klien dari FR-01 |

## Dependensi

- **0200** G2
- **0301** untuk FR-03 / BR-04 lengkap

## Referensi

- [DEVELOPMENT-PHASES.md](../../../engineering/DEVELOPMENT-PHASES.md) Phase 3

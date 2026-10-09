---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0200 — Klien (FR-01)

| Meta | Nilai |
|------|-------|
| ID | **0200** |
| Prioritas dev | **3** |
| Gate | **G2** |
| FR | **FR-01** |
| Development phase | [0200-prd-klien-development-phase.md](0200-prd-klien-development-phase.md) |

## Ringkasan

CRUD klien per user untuk dipilih saat membuat invoice dan sebagai penerima email. Email klien **wajib** untuk alur kirim invoice (FR-05).

## Requirement

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-01 | CRUD klien | Tambah, edit, nonaktifkan (bukan hard delete aktif) |
| FR-01a | Scoping | Semua record scoped `userId` |
| FR-01b | Email | Field email wajib & valid untuk kirim |

## Business rules

- Deactivate preferred over hard delete for clients in use on invoices
- BR-06: hard delete hanya draft invoice — klien mengikuti pola nonaktif

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | API: list, create, show, update, destroy(deactivate) |
| AC-02 | Web: `/clients` list + form tambah/edit |
| AC-03 | Gate G2.1 create 201 + list 200 |
| AC-04 | UAT US-01/02 pass ([user-stories-uat.md](../../brd/user-stories-uat.md)) |

## Dependensi

- **0101** G1

## Referensi

- [mvp-scope-lock.md](../../brd/mvp-scope-lock.md) FR-01
- [architecture-alignment.md](../../brd/architecture-alignment.md)

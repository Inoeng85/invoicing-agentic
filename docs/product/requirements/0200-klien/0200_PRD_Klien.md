# PRD-0200 — Klien (FR-01)

| Meta | Nilai |
|------|-------|
| ID | **0200** |
| Prioritas dev | **3** |
| Gate | **G2** |
| FR | **FR-01** |
| Development phase | [0200_PRD_Klien_Development_phase.md](0200_PRD_Klien_Development_phase.md) |

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
| AC-04 | UAT US-01/02 pass ([USER-STORIES-UAT.md](../../brd/USER-STORIES-UAT.md)) |

## Dependensi

- **0101** G1

## Referensi

- [MVP-SCOPE-LOCK.md](../../brd/MVP-SCOPE-LOCK.md) FR-01
- [ARCHITECTURE-ALIGNMENT.md](../../brd/ARCHITECTURE-ALIGNMENT.md)

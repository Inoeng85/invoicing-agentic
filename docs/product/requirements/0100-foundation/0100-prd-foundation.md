---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0100 — Foundation (Monorepo & Health)

| Meta | Nilai |
|------|-------|
| ID | **0100** |
| Prioritas dev | **1** (setelah 0000 PG-0) |
| Gate produk | **G0** |
| Development phase | [0100-prd-foundation-development-phase.md](0100-prd-foundation-development-phase.md) |
| Sumber | [development-phases.md](../../../engineering/development-phases.md) Phase 0 · [ARCHITECTURE.md](../../../architecture/README.md) |

## Latar belakang

Layer aplikasi invoicing membutuhkan fondasi monorepo yang konsisten: package domain terpisah, Prisma + SQLite, dan health check API agar gate otomatis dan deploy dapat memverifikasi readiness.

## Tujuan

| ID | Tujuan | Ukuran keberhasilan |
|----|--------|---------------------|
| T-01 | Workspace terstruktur | `@invoicing/web`, `@invoicing/api`, `@invoicing/domain`, `@invoicing/database` build/typecheck |
| T-02 | Database siap | Migrasi applied; satu path SQLite canonical (selaras PRD-0000) |
| T-03 | Observability minimal | Health live + ready; domain `getSystemStatus()` tanpa throw |

## Scope (in)

- Prisma schema awal + migrasi
- `GET /api/health/live`, `GET /api/health/ready` (DB ping)
- Integrasi `@invoicing/domain` ke API (status sistem)
- Gate script Phase 0 (`scripts/gates/`)

## Scope (out)

- Register/login ( **0101** )
- CRUD bisnis (klien, invoice)

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | `npm run db:migrate` exit 0 |
| AC-02 | Health live & ready → HTTP 200 |
| AC-03 | `npm run test:domain` + `npm run gate` (G0 section) pass |
| AC-04 | `npm run typecheck` exit 0 |

## Business rules

Tidak ada BR produk; patuhi konvensi repo PRD-0000.

## Dependensi

- **0000** PG-0 (Node, lockfile, DB path, `verify`)

## Referensi

- [mvp-scope-lock.md](../../brd/mvp-scope-lock.md) (infra impl, bukan FR)

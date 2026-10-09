# PRD-0100 — Foundation · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0100** |
| Gate | **G0** |
| Task ID prefix | `0100yy-[area]-[slug]` |

## Ringkasan fase

**Tujuan:** monorepo packages + migrasi + health endpoints + gate G0.

| Task | Area | Output |
|------|------|--------|
| 010001-stack-workspace-packages | stack | `apps/*`, `packages/*` di root `package.json` workspaces |
| 010002-db-prisma-schema-baseline | db | Schema + migrasi awal |
| 010003-db-migrate-scripts | db | Root scripts selaras TECH-STACK |
| 010004-be-health-live | be | Route live 200 |
| 010005-be-health-ready | be | Ready 200 jika DB ok |
| 010006-domain-system-status | domain | `getSystemStatus()` |
| 010007-infra-gate-phase0 | infra | Gate script G0.1–G0.3 |

## Urutan eksekusi

`010001` → `010002` → `010003` → `010004` → `010005` → `010006` → `010007`

## Gate G0 — pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G0.1 | `npm run db:migrate` | Exit 0 |
| G0.2 | `npm run gate` (Phase 0) | Health live + ready 200 |
| G0.3 | `npm run typecheck` | Exit 0 |

## Definition of Done

- [ ] `DATABASE_URL` valid; migrasi applied
- [ ] Health endpoints documented di README/runbook
- [ ] Gate G0 section green in `npm run verify`

## Bloker

- PG-0 belum lulus → jangan merge epic 0101

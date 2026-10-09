# Plan task — 0700-task-01

| Field | Nilai |
|-------|-------|
| **Task ID** | 0700-task-01 |
| **Task** | Prisma schema + migration |
| **Phase** | 0700 / phase-01 (0700-P1) |
| **Status plan** | `defined` |

## Penjelasan

Prisma schema + migration (PRD epic 0700).

File utama:
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/<timestamp>_debt_collector/migration.sql`
- `packages/database/src/index.ts`

## Tujuan

npm run db:migrate -- --name debt_collector

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0700-task-01` | [docs/workflow/features/0700-task-01.md](../../../../../features/0700-task-01.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |
| QA | [skills/qa.md](skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0700-debt-collector/0700_PRD_Debt_Collector_Development_phase.md`
- **Produces:** —
- **Verifikasi:** npm run db:migrate -- --name debt_collector
- **Files:**
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/<timestamp>_debt_collector/migration.sql`
- `packages/database/src/index.ts`

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

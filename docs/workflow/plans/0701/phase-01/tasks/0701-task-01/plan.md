# Plan task — 0701-task-01

| Field | Nilai |
|-------|-------|
| **Task ID** | 0701-task-01 |
| **Task** | Schema + migration |
| **Phase** | 0701 / phase-01 (0701-P1) |
| **Status plan** | `defined` |

## Penjelasan

Schema + migration (PRD epic 0701).

`prisma.debtCollectorPhoto`; `DebtCollector.photoUpdatedAt: Date | null`; type export `DebtCollectorPhoto`.

File utama:
- `packages/database/prisma/schema.prisma`
- `packages/database/src/index.ts`
- `packages/database/prisma/migrations/20260930130000_collector_photo/migration.sql`

## Tujuan

npm run typecheck

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0701-task-01` | [docs/workflow/features/0701-task-01.md](../../../../../features/0701-task-01.md) |

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

- Development phase: `docs/product/requirements/0701-foto-kolektor/0701-prd-foto-kolektor-development-phase.md`
- **Produces:** `prisma.debtCollectorPhoto`; `DebtCollector.photoUpdatedAt: Date | null`; type export `DebtCollectorPhoto`.
- **Verifikasi:** npm run typecheck
- **Files:**
- `packages/database/prisma/schema.prisma`
- `packages/database/src/index.ts`
- `packages/database/prisma/migrations/20260930130000_collector_photo/migration.sql`

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

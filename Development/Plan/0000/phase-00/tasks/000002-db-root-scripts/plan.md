# Plan task — 000002-db-root-scripts

| Field | Nilai |
|-------|-------|
| **Task ID** | 000002-db-root-scripts |
| **Task** | db root scripts |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

db root scripts (PRD epic 0000).

- Tambahkan `db:reset` (drop + migrate) dan `db:seed` (placeholder yang aman bila seed belum ada — isi seed di 000003-db) di `packages/database/package.json`.
- Ekspos keempat script di root `package.json` via `-w @invoicing/database`.
- Pastikan `db:migrate` non-interaktif untuk CI (mis. `migrate deploy` untuk CI, `migrate dev` untuk lokal).

## Tujuan

keempat script jalan dari `Agentic/`.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-db-root-scripts` | [agentic/development/features/0000-db-root-scripts.md](../../../../../../agentic/development/features/0000-db-root-scripts.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](./skills/infra.md) |
| Docs | [skills/docs.md](./skills/docs.md) |
| QA | [skills/qa.md](./skills/qa.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-14
- **Verifikasi:** keempat script jalan dari `Agentic/`.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

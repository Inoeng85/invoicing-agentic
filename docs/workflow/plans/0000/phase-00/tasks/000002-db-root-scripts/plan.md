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
| `0000-db-root-scripts` | [docs/workflow/features/0000-db-root-scripts.md](../../../../../features/0000-db-root-scripts.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/workflow/results/0000/phase-00/development/000002-db-root-scripts.md |
| Commit/PR | baseline sudah di tree · tidak ada commit baru |
| Selesai | 2026-10-01T15:56:38+07:00 |

### Catatan implementasi

Empat script root sudah meneruskan ke `@invoicing/database`: `db:migrate` (`prisma migrate dev`), `db:reset` (`prisma migrate reset --force`), `db:seed`, `db:studio`. CI non-interaktif memakai `db:migrate:deploy` (`prisma migrate deploy`). `db:reset` tidak dijalankan karena menghapus `dev.db` yang sedang dipakai server dev.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/workflow/results/0000/phase-00/qa/000002-db-root-scripts.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T15:58:38+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |
| QA | [skills/qa.md](skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/PRD_platform_setup_development_phase.md`
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

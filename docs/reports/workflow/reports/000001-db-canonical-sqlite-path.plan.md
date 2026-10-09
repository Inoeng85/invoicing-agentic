# Plan task — 000001-db-canonical-sqlite-path

| Field | Nilai |
|-------|-------|
| **Task ID** | 000001-db-canonical-sqlite-path |
| **Task** | db canonical sqlite path |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

db canonical sqlite path (PRD epic 0000).

- Tetapkan lokasi canonical: `packages/database/prisma/dev.db`.
- Pahami resolusi path: URL SQLite relatif di Prisma diresolusi relatif ke lokasi `schema.prisma`; tentukan nilai `DATABASE_URL` untuk `packages/database/.env` sesuai aturan itu.
- Samakan `DATABASE_URL` di `apps/web/.env` dan `apps/api/.env` agar mengarah ke file yang sama (atau muat dari satu `.env` root lewat script).
- Hapus DB lama, jalankan `npm run db:migrate`.
- Buat data lewat web (`/register`), lalu buka Prisma Studio.

## Tujuan

hanya ada satu `dev.db` · user yang dibuat di web tampil di Prisma Studio · `GET /api/health/ready` 200.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-db-canonical-path` | [docs/workflow/features/0000-db-canonical-path.md](../../../workflow/features/0000-db-canonical-path.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/archive/completed-tasks/results/0000/phase-00/development/000001-db-canonical-sqlite-path.md |
| Commit/PR | baseline repo (PS-13 Done 2026-09-30) |
| Selesai | 2026-10-01T06:54:00+07:00 |

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/archive/completed-tasks/results/0000/phase-00/qa/000001-db-canonical-sqlite-path.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T07:00:00+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](../../../workflow/plans/0000/phase-00/tasks/000001-db-canonical-sqlite-path/skills/infra.md) |
| Docs | [skills/docs.md](../../../workflow/plans/0000/phase-00/tasks/000001-db-canonical-sqlite-path/skills/docs.md) |
| QA | [skills/qa.md](../../../workflow/plans/0000/phase-00/tasks/000001-db-canonical-sqlite-path/skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-13
- **Verifikasi:** hanya ada satu `dev.db` · user yang dibuat di web tampil di Prisma Studio · `GET /api/health/ready` 200.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

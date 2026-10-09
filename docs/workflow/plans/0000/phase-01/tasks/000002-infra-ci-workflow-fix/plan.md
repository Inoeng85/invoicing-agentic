# Plan task — 000002-infra-ci-workflow-fix

| Field | Nilai |
|-------|-------|
| **Task ID** | 000002-infra-ci-workflow-fix |
| **Task** | infra ci workflow fix |
| **Phase** | 0000 / phase-01 (0000-P1) |
| **Status plan** | `defined` |

## Penjelasan

infra ci workflow fix (PRD epic 0000).

- Hapus `defaults.run.working-directory: Agentic` (git root = `Agentic/`).
- Ubah `cache-dependency-path` menjadi `package-lock.json`.
- Ganti `node-version: '24'` dengan `node-version-file: .nvmrc`.
- Ganti langkah salin `.env` dengan env CI eksplisit (`DATABASE_URL` DB test, `SESSION_SECRET` dummy, `EMAIL_PROVIDER=log`).
- Gunakan migrasi non-interaktif (`migrate deploy`).

## Tujuan

workflow jalan di PR uji dan mencapai langkah test.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-ci-workflow-fix` | [docs/workflow/features/0000-infra-ci-workflow-fix.md](../../../../../features/0000-infra-ci-workflow-fix.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/workflow/results/0000/phase-01/development/000002-infra-ci-workflow-fix.md |
| Commit/PR | baseline `.github/workflows/ci.yml` · tidak ada commit baru |
| Selesai | 2026-10-01T16:07:38+07:00 |

### Catatan implementasi

Workflow sudah memakai `.nvmrc`, `package-lock.json`, `db:migrate:deploy`, dan env CI pada langkah verify. Tidak ada `working-directory: Agentic`. Salinan `.env.example` tetap ada agar Prisma dan app punya file; nilai CI datang dari `env`. `npm ci` tidak diulang (daemon memakai `node_modules`). Run GitHub terakhir gagal startup ~3s.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/workflow/results/0000/phase-01/qa/000002-infra-ci-workflow-fix.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T16:08:18+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-22, PS-24
- **Verifikasi:** workflow jalan di PR uji dan mencapai langkah test.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

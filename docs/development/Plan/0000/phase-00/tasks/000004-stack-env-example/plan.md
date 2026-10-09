# Plan task — 000004-stack-env-example

| Field | Nilai |
|-------|-------|
| **Task ID** | 000004-stack-env-example |
| **Task** | stack env example |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack env example (PRD epic 0000).

- Inventaris variabel dari TECHNOLOGY-STACK §5 dan kode (`process.env.*`).
- Tulis per file: `DATABASE_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN` (API), `API_BASE_URL` (web), `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`.
- Beri komentar per variabel: wajib/opsional, per environment, nilai default dev.
- Isi nilai dev aman (email `log`, `APP_URL=http://localhost:44100`).

## Tujuan

`rg "process.env\.\w+"` → setiap nama ada di `.env.example` terkait.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [docs/agentic/development/features/0000-platform-stack.md](../../../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/development/Result/0000/phase-00/development/000004-stack-env-example.md |
| Commit/PR | belum di-commit |
| Selesai | 2026-10-01T15:54:10+07:00 |

### Catatan implementasi

Example web/api/database sudah memuat variabel PS-09 dengan default dev (`EMAIL_PROVIDER=log`, `APP_URL=http://localhost:44100`). Ditambah komentar `TRUST_PROXY` di web dan `NODE_ENV` di database. HMR tetap di luar example.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/development/Result/0000/phase-00/qa/000004-stack-env-example.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T15:55:21+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-09
- **Verifikasi:** `rg "process.env\.\w+"` → setiap nama ada di `.env.example` terkait.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

# Plan task — 000001-be-env-validation

| Field | Nilai |
|-------|-------|
| **Task ID** | 000001-be-env-validation |
| **Task** | be env validation |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

be env validation (PRD epic 0000).

- Buat modul config bersama (mis. `packages/domain/src/config.ts` atau package `config`) yang membaca & memvalidasi env.
- Definisikan aturan per `NODE_ENV`: production wajib `SESSION_SECRET`, `APP_URL`, `DATABASE_URL`, `EMAIL_*` bila provider ≠ log.
- Panggil saat start `apps/web/server.ts` dan `apps/api/src/server.ts`; gagal cepat dengan daftar variabel yang hilang.
- Jangan ubah logic domain/fitur; hanya membaca config.

## Tujuan

start production tanpa `SESSION_SECRET` → exit ≠ 0 dengan nama variabel · dev tetap jalan dengan default.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-be-env-validation` | [agentic/development/features/0000-be-env-validation.md](../../../../../../agentic/development/features/0000-be-env-validation.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Backend | [skills/backend.md](./skills/backend.md) |
| QA | [skills/qa.md](./skills/qa.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-10
- **Verifikasi:** start production tanpa `SESSION_SECRET` → exit ≠ 0 dengan nama variabel · dev tetap jalan dengan default.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

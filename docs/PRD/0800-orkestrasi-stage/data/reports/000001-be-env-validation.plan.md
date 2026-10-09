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
| `0000-be-env-validation` | [docs/agentic/development/features/0000-be-env-validation.md](../../../../agentic/development/features/0000-be-env-validation.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/development/Result/0000/phase-02/development/000001-be-env-validation.md |
| Commit/PR | `ef84c90` (Phase 2 M2) · `eb44e65` |
| Selesai | 2026-10-01T14:57:16+07:00 |

### Catatan implementasi

Validasi env ada di `packages/platform/src/env.ts` dan dipanggil `bootstrapPlatform` dari `apps/web/server.ts` serta `apps/api/src/server.ts`. Production tanpa `SESSION_SECRET` exit 1 dengan nama variabel. Development tetap listen bila `DATABASE_URL` ada.

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Backend | [skills/backend.md](../../../../development/Plan/0000/phase-02/tasks/000001-be-env-validation/skills/backend.md) |
| QA | [skills/qa.md](../../../../development/Plan/0000/phase-02/tasks/000001-be-env-validation/skills/qa.md) |

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

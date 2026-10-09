# Plan task — 000002-fe-web-css-token-build

| Field | Nilai |
|-------|-------|
| **Task ID** | 000002-fe-web-css-token-build |
| **Task** | fe web css token build |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

fe web css token build (PRD epic 0000).

- Import token bersama di `app.css`, pertahankan `@layer base, rmx, app` (ARCH §12).
- Map `--color-brand` lama ke `--primary` agar markup existing tetap benar.
- Jangan ubah markup/layar (penerapan resep ke layar = pekerjaan fitur terpisah, G-07).
- Jangan aktifkan `.dark` di app (D-11).
- Catat ukuran `public/app.css` sebelum/sesudah.

## Tujuan

`npm run css:build` sukses · halaman web existing tidak berubah secara visual · tidak ada toggle dark.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-fe-web-css-token-build` | [docs/workflow/features/0000-fe-web-css-token-build.md](../../../workflow/features/0000-fe-web-css-token-build.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Frontend | [skills/frontend.md](../../../workflow/plans/0000/phase-02/tasks/000002-fe-web-css-token-build/skills/frontend.md) |
| QA | [skills/qa.md](../../../workflow/plans/0000/phase-02/tasks/000002-fe-web-css-token-build/skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-42, PS-45
- **Verifikasi:** `npm run css:build` sukses · halaman web existing tidak berubah secara visual · tidak ada toggle dark.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

# Plan task — 000006-stack-verify-script

| Field | Nilai |
|-------|-------|
| **Task ID** | 000006-stack-verify-script |
| **Task** | stack verify script |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack verify script (PRD epic 0000).

- Definisikan urutan: `typecheck` → `test:domain` → `test` (web) → `css:build` → `design:css` → `gate` (sama dengan yang dijalankan CI lewat PS-23).
- Tambahkan `"verify"` di root `package.json` (gagal di langkah pertama yang merah).
- Jalankan dan perbaiki kegagalan non-fitur (konfigurasi, path, script).

## Tujuan

`npm run verify` exit 0 di Node 24 · `design:css` dan `css:build` gagal → verify merah (PS-43).

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [agentic/development/features/0000-platform-stack.md](../../../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-20, PS-43
- **Verifikasi:** `npm run verify` exit 0 di Node 24 · `design:css` dan `css:build` gagal → verify merah (PS-43).
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

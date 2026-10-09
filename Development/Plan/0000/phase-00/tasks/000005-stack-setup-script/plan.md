# Plan task — 000005-stack-setup-script

| Field | Nilai |
|-------|-------|
| **Task ID** | 000005-stack-setup-script |
| **Task** | stack setup script |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack setup script (PRD epic 0000).

- Buat `scripts/setup.ts` (dijalankan via `tsx`).
- Langkah script: cek versi Node → `npm install` bila `node_modules` belum ada → salin `.env.example` → `.env` bila belum ada → generate `SESSION_SECRET` dev acak → `db:migrate` → `db:seed` **no-op atau minimal** (seed penuh PS-15 = task `000003-db-seed-demo`, Phase 2).
- Script idempoten: tidak menimpa `.env` yang sudah ada.
- Tambahkan `"setup"` di root `package.json`.

## Tujuan

di folder hasil clone bersih, `npm run setup && npm run dev` → web `:44100` dan API `:44101` terbuka.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [agentic/development/features/0000-platform-stack.md](../../../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | Development/Result/0000/phase-00/development/000005-stack-setup-script.md |
| Commit/PR | baseline sudah di tree · tidak ada commit baru |
| Selesai | 2026-10-01T15:59:26+07:00 |

### Catatan implementasi

`scripts/setup.ts` dan `"setup"` di root `package.json` sudah ada. `npm run setup` exit 0, tidak menimpa `.env` yang sudah ada (ukuran file tetap), lalu `db:migrate:deploy` dan `db:seed`. Web `:44100` sudah 302 dan API live `:44101` 200, jadi `npm run dev` tidak dijalankan lagi.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | Development/Result/0000/phase-00/qa/000005-stack-setup-script.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T16:00:05+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-18
- **Verifikasi:** di folder hasil clone bersih, `npm run setup && npm run dev` → web `:44100` dan API `:44101` terbuka.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

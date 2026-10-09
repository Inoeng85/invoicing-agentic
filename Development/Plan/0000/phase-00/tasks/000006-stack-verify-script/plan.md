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

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | Development/Result/0000/phase-00/development/000006-stack-verify-script.md |
| Commit/PR | baseline sudah di tree · tidak ada commit baru |
| Selesai | 2026-10-01T16:01:05+07:00 |

### Catatan implementasi

`scripts/verify.ts` menjalankan typecheck → test:domain → test web → css:build → design:css → gate dan `process.exit` pada langkah pertama yang gagal (PS-43). `"verify"` ada di root `package.json`. `npm run verify` di Node v24.3.0 exit 0.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | Development/Result/0000/phase-00/qa/000006-stack-verify-script.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T16:01:45+07:00 |

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

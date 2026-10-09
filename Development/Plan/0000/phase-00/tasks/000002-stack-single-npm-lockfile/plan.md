# Plan task — 000002-stack-single-npm-lockfile

| Field | Nilai |
|-------|-------|
| **Task ID** | 000002-stack-single-npm-lockfile |
| **Task** | stack single npm lockfile |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack single npm lockfile (PRD epic 0000).

- Hapus `yarn.lock` (root), `apps/web/yarn.lock`, `apps/web/package-lock.json`.
- Hapus `node_modules` di root dan di workspace.
- Jalankan `npm install` dari root di Node 24 untuk meregenerasi `package-lock.json`.
- Bandingkan versi paket kunci (`remix`, `prisma`, `@prisma/client`, `tailwindcss`, `pdf-lib`) dengan sebelum regenerasi; catat perbedaan.
- Jalankan `npm run test:domain`, `npm run typecheck`, `npm run gate`.

## Tujuan

hanya ada satu lockfile · gate G0–G5 tetap Pass.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [agentic/development/features/0000-platform-stack.md](../../../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | Development/Result/0000/phase-00/development/000002-stack-single-npm-lockfile.md |
| Commit/PR | baseline (`package-lock.json` @ `ea6a164`) |
| Selesai | 2026-10-01T15:31:45+07:00 |

### Catatan implementasi

Satu `package-lock.json` di root sudah ada; tidak ada `yarn.lock` atau lockfile workspace. `node_modules` tidak dihapus (daemon jalan). Versi kunci: remix `3.0.0-rc.4`, prisma / `@prisma/client` `6.19.3`, tailwindcss `4.3.3`, pdf-lib `1.17.1`. `test:domain`, `typecheck`, dan `gate` (G0–G7) exit 0.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | Development/Result/0000/phase-00/qa/000002-stack-single-npm-lockfile.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T15:32:25+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-03
- **Verifikasi:** hanya ada satu lockfile · gate G0–G5 tetap Pass.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

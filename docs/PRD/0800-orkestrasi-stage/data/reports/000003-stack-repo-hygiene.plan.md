# Plan task — 000003-stack-repo-hygiene

| Field | Nilai |
|-------|-------|
| **Task ID** | 000003-stack-repo-hygiene |
| **Task** | stack repo hygiene |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack repo hygiene (PRD epic 0000).

- Lengkapi `.gitignore`: `.DS_Store`, `*.db`, `*.db-journal`, `.env`, `.env.*`, `!.env.example`, `apps/web/public/app.css` (bila diputuskan artefak build), `docs/design/prototype/assets/ui.css` (bila diputuskan artefak build).
- Hapus artefak tak terpakai: folder `ui-prototype/` (kosong), `packages/database/prisma/prisma/dev.db`, semua `.DS_Store`.
- Pastikan `.env` lokal tidak ter-track (`git status`).
- Buat initial commit di `main`.
- Tambahkan remote GitHub dan push `main`.

## Tujuan

`git status` bersih setelah `npm run dev` · tidak ada `.env`/`.db` di `git ls-files`.

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
- **Produces:** PS-05 (commit/remote), PS-06, PS-07
- **Verifikasi:** `git status` bersih setelah `npm run dev` · tidak ada `.env`/`.db` di `git ls-files`.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

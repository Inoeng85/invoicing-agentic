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
| `0000-platform-stack` | [docs/workflow/features/0000-platform-stack.md](../../../../../features/0000-platform-stack.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/workflow/results/0000/phase-00/development/000003-stack-repo-hygiene.md |
| Commit/PR | tidak ada commit baru · baseline `4bbc062` · remote `origin` sudah ada · tidak di-push |
| Selesai | 2026-10-01T15:33:37+07:00 |

### Catatan implementasi

`.gitignore` sudah memuat `.DS_Store`, `*.db`, `*.db-journal`, `.env`, `.env.*`, `!.env.example`, dan artefak CSS build. `.DS_Store` lokal dihapus. `git ls-files` hanya memuat `.env.example`. Dev server yang sudah jalan: web 302, API live 200. Tidak commit/push.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/workflow/results/0000/phase-00/qa/000003-stack-repo-hygiene.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T15:34:34+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
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

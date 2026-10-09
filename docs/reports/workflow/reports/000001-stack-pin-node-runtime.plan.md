# Plan task — 000001-stack-pin-node-runtime

| Field | Nilai |
|-------|-------|
| **Task ID** | 000001-stack-pin-node-runtime |
| **Task** | stack pin node runtime |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

stack pin node runtime (PRD epic 0000).

- Tentukan versi Node 24.x minimum ≥ 24.3 (sama dengan `engines` root).
- Buat `.nvmrc` dan `.node-version` di root `Agentic/` dengan versi tersebut.
- Buat `.npmrc` berisi `engine-strict=true`.
- Samakan `engines.node` di root, `apps/web`, `apps/api` (dan tambahkan ke `packages/*` bila belum ada).
- Pasang Node 24 lokal via `nvm install && nvm use`.

## Tujuan

`node -v` = 24.x · `npm ci` di Node 20 gagal dengan pesan engine · `npm ci` di Node 24 sukses.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [docs/workflow/features/0000-platform-stack.md](../../../workflow/features/0000-platform-stack.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/workflow/results/0000/phase-00/development/000001-stack-pin-node-runtime.md |
| Commit/PR | `4bbc062` (baseline Phase 0, 2026-09-29) |
| Selesai | 2026-10-01T14:52:54+07:00 |

### Catatan implementasi

Pin Node `24.3.0` / `engines.node` `>=24.3.0` dan `engine-strict=true` sudah ada di baseline. `nvm install && nvm use` memakai `.nvmrc`. Node 20 → `EBADENGINE`; Node `v24.3.0` → `npm install --dry-run` exit 0.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/workflow/results/0000/phase-00/qa/000001-stack-pin-node-runtime.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T15:29:00+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](../../../workflow/plans/0000/phase-00/tasks/000001-stack-pin-node-runtime/skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-01, PS-02
- **Verifikasi:** `node -v` = 24.x · `npm ci` di Node 20 gagal dengan pesan engine · `npm ci` di Node 24 sukses.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

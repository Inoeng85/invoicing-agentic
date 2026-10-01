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
| `0000-platform-stack` | [agentic/development/features/0000-platform-stack.md](../../../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
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

# Plan task — 000007-stack-pin-dev-dependencies

| Field | Nilai |
|-------|-------|
| **Task ID** | 000007-stack-pin-dev-dependencies |
| **Task** | stack pin dev dependencies |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

stack pin dev dependencies (PRD epic 0000).

- Ganti `typescript: latest` dan `@types/node: latest` dengan versi eksplisit di semua workspace.
- Samakan versi `tailwindcss`/`@tailwindcss/cli` root dan `apps/web`.
- Regenerasi lockfile, jalankan `npm run verify`.

## Tujuan

`rg '"latest"' --glob package.json` kosong.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [docs/workflow/features/0000-platform-stack.md](../../../../../features/0000-platform-stack.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-04
- **Verifikasi:** `rg '"latest"' --glob package.json` kosong.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

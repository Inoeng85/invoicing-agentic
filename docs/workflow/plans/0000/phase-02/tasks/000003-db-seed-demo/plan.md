# Plan task — 000003-db-seed-demo

| Field | Nilai |
|-------|-------|
| **Task ID** | 000003-db-seed-demo |
| **Task** | db seed demo |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

db seed demo (PRD epic 0000).

- Buat `packages/database/prisma/seed.ts` memakai fungsi domain yang ada (bukan logic baru).
- Data: user demo Dewi Kartika / Studio Kartika + profil bisnis; klien PT Arunika Digital, CV Nusantara Kreatif, Budi Santoso (tanpa email), Yayasan Cerdas Bangsa; invoice status draft, sent, overdue, paid.
- Idempoten: upsert berdasarkan email user demo.
- Kredensial demo hanya untuk local/staging (dari env).

## Tujuan

`db:seed` dua kali → data tidak ganda · dashboard menampilkan outstanding.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-db-seed-demo` | [docs/workflow/features/0000-db-seed-demo.md](../../../../../features/0000-db-seed-demo.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |
| QA | [skills/qa.md](skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-15
- **Verifikasi:** `db:seed` dua kali → data tidak ganda · dashboard menampilkan outstanding.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

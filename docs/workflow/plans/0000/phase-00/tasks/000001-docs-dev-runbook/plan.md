# Plan task — 000001-docs-dev-runbook

| Field | Nilai |
|-------|-------|
| **Task ID** | 000001-docs-dev-runbook |
| **Task** | docs dev runbook |
| **Phase** | 0000 / phase-00 (0000-P0) |
| **Status plan** | `defined` |

## Penjelasan

docs dev runbook (PRD epic 0000).

- Tulis ulang alur di [stack-integration.md](../../../../../../engineering/stack-integration.md): prasyarat (nvm, Node 24), `npm run setup`, `npm run dev`, `npm run verify`, perintah DB, prototype.
- Tabel port & URL: web 44100, API 44101, server prototype.
- Bagian troubleshooting: engine mismatch, `IMPORT_OUTSIDE_MOUNTS`, DB path.
- Samakan ringkasan di `docs/README.md` root.
- Uji dengan satu orang yang belum pernah setup; catat waktu.

## Tujuan

onboarding ≤ 15 menit tanpa bantuan.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-docs-dev-runbook` | [docs/workflow/features/0000-docs-dev-runbook.md](../../../../../features/0000-docs-dev-runbook.md) |

## Development

| Field | Nilai |
|-------|-------|
| Status | `complete` |
| Laporan | docs/workflow/results/0000/phase-00/development/000001-docs-dev-runbook.md |
| Commit/PR | belum di-commit |
| Selesai | 2026-10-01T16:02:54+07:00 |

### Catatan implementasi

Runbook dan README sudah memuat alur onboarding. Diselaraskan: seed setup idempoten, dan `verify` mencakup gate G0–G7. Waktu onboarding penguji baru tidak diukur.

## QA

| Field | Nilai |
|-------|-------|
| Status | `pass` |
| Laporan | docs/workflow/results/0000/phase-00/qa/000001-docs-dev-runbook.md |
| Fix dalam session | tidak |
| Selesai | 2026-10-01T16:03:20+07:00 |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-21, PS-46
- **Verifikasi:** onboarding ≤ 15 menit tanpa bantuan.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

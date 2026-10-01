# Plan task — 000003-infra-ci-verify-pipeline

| Field | Nilai |
|-------|-------|
| **Task ID** | 000003-infra-ci-verify-pipeline |
| **Task** | infra ci verify pipeline |
| **Phase** | 0000 / phase-01 (0000-P1) |
| **Status plan** | `defined` |

## Penjelasan

infra ci verify pipeline (PRD epic 0000).

- Ganti langkah terpisah dengan `npm run verify` (sudah mencakup `css:build`, `design:css`, `test` web).
- Pisahkan step agar log per tahap terbaca (opsional: step per sub-script).
- Aktifkan status check wajib di branch protection (000001-infra).

## Tujuan

PR sengaja merusak CSS → CI merah · PR normal → CI hijau.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-ci-verify-pipeline` | [agentic/development/features/0000-infra-ci-verify-pipeline.md](../../../../../../agentic/development/features/0000-infra-ci-verify-pipeline.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](./skills/infra.md) |
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-23, PS-43
- **Verifikasi:** PR sengaja merusak CSS → CI merah · PR normal → CI hijau.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

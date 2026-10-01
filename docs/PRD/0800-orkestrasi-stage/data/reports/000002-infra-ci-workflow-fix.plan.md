# Plan task — 000002-infra-ci-workflow-fix

| Field | Nilai |
|-------|-------|
| **Task ID** | 000002-infra-ci-workflow-fix |
| **Task** | infra ci workflow fix |
| **Phase** | 0000 / phase-01 (0000-P1) |
| **Status plan** | `defined` |

## Penjelasan

infra ci workflow fix (PRD epic 0000).

- Hapus `defaults.run.working-directory: Agentic` (git root = `Agentic/`).
- Ubah `cache-dependency-path` menjadi `package-lock.json`.
- Ganti `node-version: '24'` dengan `node-version-file: .nvmrc`.
- Ganti langkah salin `.env` dengan env CI eksplisit (`DATABASE_URL` DB test, `SESSION_SECRET` dummy, `EMAIL_PROVIDER=log`).
- Gunakan migrasi non-interaktif (`migrate deploy`).

## Tujuan

workflow jalan di PR uji dan mencapai langkah test.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-ci-workflow-fix` | [agentic/development/features/0000-infra-ci-workflow-fix.md](../../../../../../agentic/development/features/0000-infra-ci-workflow-fix.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](./skills/infra.md) |
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-22, PS-24
- **Verifikasi:** workflow jalan di PR uji dan mencapai langkah test.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

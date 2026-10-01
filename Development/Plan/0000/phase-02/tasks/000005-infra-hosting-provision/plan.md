# Plan task — 000005-infra-hosting-provision

| Field | Nilai |
|-------|-------|
| **Task ID** | 000005-infra-hosting-provision |
| **Task** | infra hosting provision |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

infra hosting provision (PRD epic 0000).

- Buat project/app staging untuk `web` dan `api` (Node 24).
- Provision PostgreSQL managed staging.
- Isi secret store staging: `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN`, `API_BASE_URL`, `EMAIL_*`.
- Pastikan `.env` tidak masuk image/build; secret di-inject saat runtime.

## Tujuan

audit `git grep` & isi image tanpa secret.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-hosting-provision` | [agentic/development/features/0000-infra-hosting-provision.md](../../../../../../agentic/development/features/0000-infra-hosting-provision.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](./skills/infra.md) |
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-27, PS-11
- **Verifikasi:** audit `git grep` & isi image tanpa secret.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

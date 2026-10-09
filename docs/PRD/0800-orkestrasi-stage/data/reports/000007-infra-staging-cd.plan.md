# Plan task — 000007-infra-staging-cd

| Field | Nilai |
|-------|-------|
| **Task ID** | 000007-infra-staging-cd |
| **Task** | infra staging cd |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

infra staging cd (PRD epic 0000).

- Workflow deploy on push `main` (setelah CI hijau).
- Langkah: `npm ci` → `prisma generate` → `css:build` → `prisma migrate deploy` → start web & API.
- Health check host: liveness `/api/health/live`, readiness `/api/health/ready`.
- Smoke setelah deploy: `GET /api/health/ready` = 200, gagal → tandai deploy gagal.
- Jalankan `db:seed` demo sekali di staging.

## Tujuan

merge PR → staging hijau tanpa langkah manual, < 15 menit.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-staging-cd` | [docs/agentic/development/features/0000-infra-staging-cd.md](../../../../agentic/development/features/0000-infra-staging-cd.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](../../../../development/Plan/0000/phase-02/tasks/000007-infra-staging-cd/skills/infra.md) |
| Docs | [skills/docs.md](../../../../development/Plan/0000/phase-02/tasks/000007-infra-staging-cd/skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-28, PS-35
- **Verifikasi:** merge PR → staging hijau tanpa langkah manual, < 15 menit.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

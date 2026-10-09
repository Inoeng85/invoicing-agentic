# Plan task — 000011-infra-production-cd

| Field | Nilai |
|-------|-------|
| **Task ID** | 000011-infra-production-cd |
| **Task** | infra production cd |
| **Phase** | 0000 / phase-03 (0000-P3) |
| **Status plan** | `defined` |

## Penjelasan

infra production cd (PRD epic 0000).

- Environment `production` di GitHub dengan required reviewer.
- Workflow on tag `v*.*.*`: build → approval → `migrate deploy` → deploy → smoke `/api/health/ready`.
- Secret production terpisah dari staging.

## Tujuan

tag `v0.1.0-rc.1` → menunggu approval → deploy prod-like hijau.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-production-cd` | [docs/agentic/development/features/0000-infra-production-cd.md](../../../../agentic/development/features/0000-infra-production-cd.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](../../../../development/Plan/0000/phase-03/tasks/000011-infra-production-cd/skills/infra.md) |
| Docs | [skills/docs.md](../../../../development/Plan/0000/phase-03/tasks/000011-infra-production-cd/skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-29
- **Verifikasi:** tag `v0.1.0-rc.1` → menunggu approval → deploy prod-like hijau.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

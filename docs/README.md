# Invoicing Workspace (Agentic)

Monorepo **dokumentasi** + **web** + **backend API** + shared packages. Tanpa Docker · **SQLite** semua environment.

**Dokumentasi:** [docs/invoicing/BRD-DEFINITION-OF-DONE.md](invoicing/BRD-DEFINITION-OF-DONE.md)
**Launch (PG/G6):** [docs/0000_platform_setup/LAUNCH-LANE.md](0000_platform_setup/LAUNCH-LANE.md)

## Indeks dokumentasi

- [Kontribusi](CONTRIBUTING.md) dan [branch protection](governance/BRANCH_PROTECTION.md)
- [Requirement dan fase pengembangan](PRD/README.md)
- [Produk invoicing](invoicing/README.md)
- [Web](apps/web/README.md), [API](apps/api/README.md), dan [shared packages](packages/README.md)
- [Seed database](packages/database/seed/README.md) dan [deployment Railway](infra/railway/README.md)
- [Workflow agentic](agentic/README.md) dan [feature backlog](agentic/development/features/README.md)
- [Rencana pengembangan](development/Plan/README.md) dan [laporan hasil](development/Result/README.md)
- Template dokumentasi: [BRD](skills/invoicing-brd/Skill.md), [arsitektur](skills/invoicing-architecture/Skill.md), [stack](skills/invoicing-stack/Skill.md), [desain](skills/invoicing-design/Skill.md)

Semua dokumentasi proyek disimpan di `docs/`. File `AGENTS.md`, skill aktif di `.cursor/skills/`, template pull request di `.github/`, dan state runtime di `.agentic/` tetap di lokasi operasionalnya.

## Struktur

| Path | Package | Port (dev) |
|------|---------|------------|
| [apps/web/](../apps/web/) | `@invoicing/web` | 44100 |
| [apps/api/](../apps/api/) | `@invoicing/api` | 44101 |
| [packages/database/](../packages/database/) | `@invoicing/database` | — |
| [packages/domain/](../packages/domain/) | `@invoicing/domain` | — |

## Dev

Prasyarat: **Node 24.3+** (`nvm use`).

```sh
npm run setup
npm run dev       # web + API
npm run verify    # typecheck, tests, css, gate G0–G7
```

Runbook: [STACK-INTEGRATION.md](invoicing/engineering/STACK-INTEGRATION.md)

## Scripts (platform & release)

| Command | Purpose |
|---------|---------|
| `npm run ci:local` | Paritas job CI GitHub (PG-1) |
| `npm run release:check` | G6 readiness |
| `npm run host:check` | Env production sebelum deploy |
| `npm run staging:smoke` | Health API setelah deploy |
| `npm run email:smoke` | Resend (G-04) |
| `npm run start` | Production: web + API satu host |

## Dokumen kunci

- [Platform PRD](0000_platform_setup/prd_platform_setup.md)
- [Architecture](invoicing/ARCHITECTURE.md)
- [API spec](invoicing/engineering/API.md)
- [Skills BRD / Arch / Stack / Design](invoicing/SKILLS-DOCUMENTATION.md)

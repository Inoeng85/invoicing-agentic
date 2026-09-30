# Invoicing Workspace (Agentic)

Monorepo **dokumentasi** + **web** + **backend API** + shared packages. Tanpa Docker · **SQLite** semua environment.

**Dokumentasi:** [docs/invoicing/BRD-DEFINITION-OF-DONE.md](docs/invoicing/BRD-DEFINITION-OF-DONE.md)  
**Launch (PG/G6):** [docs/0000_platform_setup/LAUNCH-LANE.md](docs/0000_platform_setup/LAUNCH-LANE.md)

## Struktur

| Path | Package | Port (dev) |
|------|---------|------------|
| [apps/web/](apps/web/) | `@invoicing/web` | 44100 |
| [apps/api/](apps/api/) | `@invoicing/api` | 44101 |
| [packages/database/](packages/database/) | `@invoicing/database` | — |
| [packages/domain/](packages/domain/) | `@invoicing/domain` | — |

## Dev

Prasyarat: **Node 24.3+** (`nvm use`).

```sh
npm run setup
npm run dev       # web + API
npm run verify    # typecheck, tests, gate G0–G6
```

Runbook: [STACK-INTEGRATION.md](docs/invoicing/engineering/STACK-INTEGRATION.md)

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

- [Platform PRD](docs/0000_platform_setup/prd_platform_setup.md)
- [Architecture](docs/invoicing/ARCHITECTURE.md)
- [API spec](docs/invoicing/engineering/API.md)
- [Skills BRD / Arch / Stack / Design](docs/invoicing/SKILLS-DOCUMENTATION.md)

# Invoicing Workspace (Agentic)

Monorepo **dokumentasi** + **web** + **backend API** + shared packages. Tanpa Docker.

**Dokumentasi:** [docs/invoicing/BRD-DEFINITION-OF-DONE.md](docs/invoicing/BRD-DEFINITION-OF-DONE.md)

## Struktur

| Path | Package | Port (dev) |
|------|---------|------------|
| [apps/web/](apps/web/) | `@invoicing/web` | 44100 |
| [apps/api/](apps/api/) | `@invoicing/api` | 44101 |
| [packages/database/](packages/database/) | `@invoicing/database` | — |
| [packages/domain/](packages/domain/) | `@invoicing/domain` | — |

## Dev (ringkas)

Prasyarat: **Node 24.3+** (`nvm use` — lihat `.nvmrc`).

Runbook lengkap: [docs/invoicing/engineering/STACK-INTEGRATION.md](docs/invoicing/engineering/STACK-INTEGRATION.md).

```sh
npm run setup    # first-time / clean clone
npm run dev      # web + API
npm run verify   # same checks as CI (Phase 1)
```

## Dokumen kunci

- [BRD](docs/invoicing/BRD.md)
- [System architecture](docs/invoicing/ARCHITECTURE.md)
- [API spec](docs/invoicing/engineering/API.md)
- [Platform setup PRD](docs/0000_platform_setup/prd_platform_setup.md)

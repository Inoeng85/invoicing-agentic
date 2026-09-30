# Railway — staging & prod (ADR-0002, ADR-0003) · SQLite

## Mode B — recommended (satu service, SQLite)

Satu process menjalankan web + API → **satu file DB**, tanpa volume shared rumit.

| Setting | Value |
|---------|--------|
| Start command | `npm run start` |
| Build | `npm ci && npm run css:build` |
| Volume | mount `/data` |
| `DATABASE_URL` | `file:/data/invoicing.db` |
| Health | path `/api/health/ready` on API port (44101 default — set `PORT` per Railway) |

> Railway satu service = satu `PORT` publik. Untuk MVP, expose **web** port; API tetap localhost internal jika web memanggil domain via server actions (current app: domain langsung + API terpisah). **Jika butuh API publik terpisah**, gunakan Mode A.

Env template: [env.staging.example](./env.staging.example)

## Mode A — dua service (subdomain API)

Volume **shared** antara `invoicing-api` dan `invoicing-web`, `DATABASE_URL` identik.

### Service `invoicing-api`

Start: `npm run start:api` · Health: `/api/health/ready`

### Service `invoicing-web`

Start: `npm run start:web`

Variables: lihat env template.

## Migrate & seed

```sh
npm run db:migrate:deploy
npm run db:seed
```

Pre-deploy: `npm run host:check` dengan env production.

## GitHub

- Environment **staging** → [STAGING-PROVISION-CHECKLIST.md](../../docs/0000_platform_setup/STAGING-PROVISION-CHECKLIST.md)
- Environment **production** → [PRODUCTION-PROVISION-CHECKLIST.md](../../docs/0000_platform_setup/PRODUCTION-PROVISION-CHECKLIST.md)

Workflows: `deploy-staging.yml`, `deploy-production.yml`

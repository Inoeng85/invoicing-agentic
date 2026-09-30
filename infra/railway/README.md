# Railway — staging (ADR-0002, ADR-0003) · SQLite

Buat **dua service** (web + API) dengan **volume persisten bersama** agar satu file SQLite dipakai kedua proses.

## Volume (wajib untuk SQLite)

1. Tambah volume Railway (mis. `/data`).
2. Mount volume yang **sama** ke service `invoicing-api` dan `invoicing-web`.
3. Set di **kedua** service: `DATABASE_URL=file:/data/invoicing.db`

## Service `invoicing-api`

| Setting | Value |
|---------|--------|
| Start command | `npm run start:api` |
| Health check path | `/api/health/ready` |

Build: `npm ci && npm run css:build`

Variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `APP_URL`, `CORS_ORIGIN`, `EMAIL_*`, `TRUST_PROXY=1`.

## Service `invoicing-web`

| Setting | Value |
|---------|--------|
| Start command | `npm run start:web` |

Variables: sama `DATABASE_URL` (path volume), `SESSION_SECRET`, `APP_URL`, `API_BASE_URL`, `EMAIL_*`.

## Migrate & seed

```sh
npm run db:migrate:deploy
npm run db:seed   # optional, staging QA
```

Jalankan dari CI deploy atau Railway one-off (cwd repo, env `DATABASE_URL` sama).

## GitHub Environment `staging`

Secrets: `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID_API`, `RAILWAY_SERVICE_ID_WEB`, `DATABASE_URL` (untuk migrate di CI).

Workflow: [.github/workflows/deploy-staging.yml](../../.github/workflows/deploy-staging.yml)

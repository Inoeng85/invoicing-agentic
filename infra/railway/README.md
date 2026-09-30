# Railway — staging (ADR-0002, ADR-0003)

Buat **dua service** dalam satu project Railway, keduanya root directory = repo root.

## Service `invoicing-api`

| Setting | Value |
|---------|--------|
| Start command | `npm run start:api` |
| Health check path | `/api/health/ready` |
| Port | `PORT` (Railway inject) |

Build command (recommended):

```sh
npm ci && npm run css:build
```

Variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `APP_URL`, `CORS_ORIGIN`, `EMAIL_*`, `TRUST_PROXY=1`.

## Service `invoicing-web`

| Setting | Value |
|---------|--------|
| Start command | `npm run start:web` |
| Port | `PORT` |

Variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `APP_URL`, `API_BASE_URL`, `EMAIL_*`.

`API_BASE_URL` = public URL service API (untuk fetch server-side jika dipakai).

## Migrate & seed (sekali per deploy schema)

Jalankan di GitHub Actions atau Railway one-off:

```sh
npm run db:migrate:deploy:postgres
npm run db:seed   # optional, staging QA
```

## GitHub Environment `staging`

Secrets: `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID_API`, `RAILWAY_SERVICE_ID_WEB`, `DATABASE_URL`, plus runtime vars di Railway dashboard.

Workflow: [.github/workflows/deploy-staging.yml](../../.github/workflows/deploy-staging.yml)

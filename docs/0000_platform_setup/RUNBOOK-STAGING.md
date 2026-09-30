# Runbook — Staging (Phase 2)

ADR: [ADR-0002](./adr/ADR-0002-hosting.md) · [ADR-0003](./adr/ADR-0003-web-api-topology.md)

## Prasyarat

1. Akun **Railway** (atau host setara) + PostgreSQL plugin.
2. Domain staging (TLS otomatis di Railway).
3. Secret **tidak** di repo — inject di dashboard host / GitHub Environment `staging`.

## Secret staging (wajib)

| Secret | Contoh |
|--------|--------|
| `DATABASE_URL` | `postgresql://…` (managed) |
| `SESSION_SECRET` | random 32+ byte hex |
| `APP_URL` | `https://staging…` |
| `CORS_ORIGIN` | sama dengan `APP_URL` origin web |
| `API_BASE_URL` | `https://api.staging…` |
| `EMAIL_PROVIDER` | `resend` (Phase 2 email task) |
| `EMAIL_API_KEY` | key staging Resend |
| `EMAIL_FROM` | alamat allowlist QA |

## Deploy

1. Build: `npm ci` → `npm run css:build`
2. Migrate: `npm run db:migrate:deploy:postgres`
3. Start: `npm run start:api` + `npm run start:web` (dua service)
4. Seed sekali: `npm run db:seed` (user demo Studio Kartika)
5. Smoke: `GET $API_BASE_URL/api/health/ready` → 200

Provision detail: [infra/railway/README.md](../../infra/railway/README.md)

Workflow: [.github/workflows/deploy-staging.yml](../../.github/workflows/deploy-staging.yml) (`workflow_dispatch` atau setelah CI hijau)

Smoke lokal/CI: `API_BASE_URL=… npm run staging:smoke`

## Verifikasi lokal parity Postgres

```sh
docker compose -f docker-compose.postgres.yml up -d
npm run verify:postgres
```

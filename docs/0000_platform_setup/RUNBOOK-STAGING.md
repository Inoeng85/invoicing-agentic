# Runbook — Staging (Phase 2)

ADR: [ADR-0002](./adr/ADR-0002-hosting.md) · [ADR-0003](./adr/ADR-0003-web-api-topology.md) · [ADR-0001](./adr/ADR-0001-sqlite-postgresql.md)

## Prasyarat

1. Akun **Railway** (atau host setara) + **volume persisten** untuk file SQLite.
2. Domain staging (TLS otomatis di Railway).
3. Secret **tidak** di repo — inject di dashboard host / GitHub Environment `staging`.

## Secret staging (wajib)

| Secret | Contoh |
|--------|--------|
| `DATABASE_URL` | `file:/data/invoicing.db` (volume shared web+api) |
| `SESSION_SECRET` | random 32+ byte hex |
| `APP_URL` | `https://staging…` |
| `CORS_ORIGIN` | sama dengan `APP_URL` origin web |
| `API_BASE_URL` | `https://api.staging…` |
| `EMAIL_PROVIDER` | `resend` (Phase 2 email task) |
| `EMAIL_API_KEY` | key staging Resend |
| `EMAIL_FROM` | alamat allowlist QA |

## Deploy

1. Build: `npm ci` → `npm run css:build`
2. Migrate: `npm run db:migrate:deploy`
3. Start: `npm run start:api` + `npm run start:web` (dua service, satu file DB)
4. Seed sekali: `npm run db:seed` (user demo Studio Kartika)
5. Smoke: `GET $API_BASE_URL/api/health/ready` → 200

Provision detail: [infra/railway/README.md](../infra/railway/README.md)

Workflow: [.github/workflows/deploy-staging.yml](../../.github/workflows/deploy-staging.yml)

Smoke: `API_BASE_URL=… npm run staging:smoke`

Verifikasi lokal = SQLite: `npm run verify` (sama engine dengan staging/prod).

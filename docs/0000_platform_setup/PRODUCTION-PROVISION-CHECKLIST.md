# Production provision checklist (PG-3)

Setelah **staging PG-2** lulus UAT.

## Environment GitHub `production`

- [ ] Required reviewers on deploy (workflow `deploy-production.yml`)
- [ ] Secrets terpisah dari staging: `DATABASE_URL`, `RAILWAY_*`, `API_BASE_URL`, `SESSION_SECRET`, `EMAIL_*`

## Hosting (SQLite)

**Disarankan — satu service Railway:**

| Setting | Value |
|---------|--------|
| Start | `npm run start` (web + API satu mesin, satu file DB) |
| Volume | mount `/data` · `DATABASE_URL=file:/data/invoicing.db` |
| Health | `GET /api/health/ready` (port API internal) |

Atau dua service + volume shared — [infra/railway/README.md](../infra/railway/README.md).

## Pre-tag

```sh
npm run ci:local
npm run host:check   # dengan env production staging mirror
```

## Release

1. Tag `v0.1.0-rc.1` on `develop`
2. Approve GitHub Environment **production**
3. Smoke: `API_BASE_URL=… npm run staging:smoke`
4. Legal + sign-off: [RELEASE-READINESS.md](../invoicing/engineering/RELEASE-READINESS.md)

## PG-3 gates (operator)

- [ ] Backup harian file `.db` (RUNBOOK-OPS §3)
- [ ] Rollback redeploy teruji
- [ ] Resend domain prod (SPF/DKIM/DMARC)
- [ ] Alert/log retention per RUNBOOK-OPS §6

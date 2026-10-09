# Staging provision checklist (PG-2)

Operator — setelah repo siap (`npm run verify` / `npm run ci:local`).

## 000005 — Hosting (Railway)

**Opsi B (disarankan SQLite):** satu service · start `npm run start` · volume `/data` · `DATABASE_URL=file:/data/invoicing.db`

**Opsi A:** dua service + volume shared (web + api)

- [ ] Project Railway + service(s) + volume persisten
- [ ] Env dari [infra/railway/env.staging.example](../../infra/railway/env.staging.example)
- [ ] `npm run host:check` lulus dengan env staging
- [ ] Secrets runtime: `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN`, `API_BASE_URL`, `EMAIL_*`, `TRUST_PROXY=1`
- [ ] Detail: [infra/railway/README.md](deployment/railway/README.md)

## 000006 — Domain & TLS

- [ ] Domain staging web + API (ADR-0003)
- [ ] TLS aktif · `APP_URL` / `CORS_ORIGIN` = origin HTTPS web

## 000007 — CD

- [ ] GitHub Environment **staging** + secrets (`RAILWAY_*`, `DATABASE_URL`, `API_BASE_URL`)
- [ ] CI hijau atau `npm run ci:local` lulus sebelum rely on deploy
- [ ] Run workflow **Deploy staging** · smoke: `API_BASE_URL=… npm run staging:smoke`

## 000008 — Email (Resend)

- [ ] `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` di staging
- [ ] `EMAIL_ALLOWLIST` untuk QA
- [ ] Kirim invoice demo → inbox QA (G-04)

## Gate PG-2

- [ ] `/api/health/ready` 200 on staging
- [ ] `npm run db:seed` sekali (Studio Kartika demo)
- [ ] UAT web against staging: [UAT-GATE-TRACE.md](../engineering/UAT-GATE-TRACE.md)

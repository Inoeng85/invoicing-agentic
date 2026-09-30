# Staging provision checklist (PG-2)

Operator — setelah repo siap (`npm run verify` / `npm run ci:local`).

## 000005 — Hosting (Railway)

- [ ] Project Railway + service **invoicing-api** + **invoicing-web**
- [ ] Volume persisten **shared** (mis. `/data`) di kedua service
- [ ] `DATABASE_URL=file:/data/invoicing.db` (sama di web & api)
- [ ] Secrets runtime: `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN`, `API_BASE_URL`, `EMAIL_*`, `TRUST_PROXY=1`
- [ ] Detail: [infra/railway/README.md](../../infra/railway/README.md)

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
- [ ] UAT web against staging: [UAT-GATE-TRACE.md](../invoicing/engineering/UAT-GATE-TRACE.md)

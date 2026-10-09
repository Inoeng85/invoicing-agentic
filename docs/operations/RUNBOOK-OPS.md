# Runbook Ops — Platform (PRD-0000 Phase 3)

| Meta | Nilai |
|------|-------|
| Staging detail | [RUNBOOK-STAGING.md](./RUNBOOK-STAGING.md) |
| Branch / CI | [CONTRIBUTING.md](../engineering/CONTRIBUTING.md) · `.github/workflows/` |

---

## 1. Deploy

### Staging (merge `develop`)

1. CI `verify` hijau (lokal: `npm run verify`).
2. Workflow [deploy-staging.yml](../../.github/workflows/deploy-staging.yml) (`workflow_dispatch`) atau deploy otomatis host.
3. `npm run db:migrate:deploy` · `npm run db:seed` (sekali).
4. Smoke: `GET $API_BASE_URL/api/health/ready` → 200.

### Production (tag SemVer)

1. Tag `v0.1.0-rc.1` / `v0.1.0` pada commit yang sudah lulus staging.
2. GitHub Environment **production** — wajib reviewer (PS-29).
3. Workflow [deploy-production.yml](../../.github/workflows/deploy-production.yml).
4. Secret **production** terpisah dari staging (PS-11).
5. Smoke health ready + login smoke manual.

---

## 2. Rollback (PS-30)

1. **Aplikasi:** redeploy release/build sebelumnya di host (Railway rollback / redeploy image).
2. **Database:** migrasi **forward-only** default; jangan `migrate reset` di prod.
3. Rollback schema hanya jika ada migration `down` yang sudah di-review — otherwise restore backup.
4. Verifikasi: `/api/health/ready` 200, login, sample invoice baca.

---

## 3. Backup & restore SQLite (PS-17)

| Env | RPO | Mekanisme |
|-----|-----|-----------|
| Production | 24 jam | Salin file DB (volume persisten) — cron/host backup |

**Restore uji (staging dulu):**

1. Stop API/web (hindari tulis saat restore).
2. Ganti file `.db` dengan salinan backup (path = `DATABASE_URL`, biasanya di volume `/data`).
3. Start API · `GET /api/health/ready` → 200; catat durasi restore.

---

## 4. Rotasi secret (PS-12)

### `SESSION_SECRET`

- **Dampak:** semua session invalid → user login ulang.
- **Langkah:** generate secret baru → update secret store → rolling restart web + api → smoke login.
- **Uji:** staging sebelum production.

### `EMAIL_API_KEY` (Resend)

- Buat key baru di Resend → update secret → kirim email uji → revoke key lama.

---

## 5. Email production (PS-39)

1. DNS: SPF, DKIM, DMARC untuk domain pengirim.
2. Verifikasi domain di Resend; `EMAIL_FROM` domain terverifikasi.
3. Production `EMAIL_API_KEY` terpisah dari staging.
4. Staging: `EMAIL_ALLOWLIST=qa@yourcompany.com,...` (PS-39 sandbox).

---

## 6. Alert & log (PS-36, PS-37)

| Signal | Threshold | Aksi |
|--------|-----------|------|
| Readiness | `/api/health/ready` ≠ 200 > 2 menit | Page on-call |
| 5xx rate | > 5% / 5 menit | Investigate API logs (`requestId`) |
| Email errors | Lonjakan `[email:blocked]` / Resend 4xx | Cek allowlist & key |

**Retensi:** log stdout host/agregator **30 hari** (konfigurasi dashboard Railway/Datadog).

**Uji alert:** matikan DB staging sementara → readiness gagal → alert terkirim.

---

## 7. Reverse proxy & rate limit (PS-32)

- Contoh: [infra/proxy/Caddyfile.example](../../infra/proxy/Caddyfile.example)
- API: `TRUST_PROXY=1` agar rate limit memakai IP klien asli (`X-Forwarded-For`).

---

## 8. Kontak & akses

| Area | Owner | Catatan |
|------|-------|---------|
| GitHub repo | Engineering | `Inoeng85/invoicing-agentic` |
| Host (Railway) | Product / Eng | staging + prod projects |
| Postgres | Host managed | backup dashboard |
| Resend | Product | DNS + API keys |
| DNS / TLS | Product | domain prod & staging |

---

## 9. Insiden cepat

| Gejala | Langkah 1 |
|--------|-----------|
| Ready 503 | Cek `DATABASE_URL`, migrasi, disk |
| 5xx spike | Filter log JSON by `requestId`; deploy rollback? |
| Email tidak terkirim | `EMAIL_PROVIDER`, allowlist, Resend status |
| Public link `/i/*` abuse | Tighten proxy rate limit; revoke token invoice |

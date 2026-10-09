# ADR-0003 — Topologi web & API

| Status | Accepted |
|--------|----------|
| Tanggal | 2026-09-30 |
| Konteks | Q-03 · PS-31 |

## Keputusan

- **Dua proses terpisah** (sesuai arsitektur): web dan API.
- **Staging URLs (contoh):**
  - Web: `https://staging.invoicing.example` → `APP_URL`
  - API: `https://api.staging.invoicing.example` → `CORS_ORIGIN` = origin web

## Konsekuensi

- `API_BASE_URL` di web mengarah ke subdomain API.
- Health check host memakai `/api/health/live` dan `/api/health/ready` di service API.

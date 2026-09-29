# Backend API — Spesifikasi (MVP)

**Service:** `@invoicing/api` · **Base URL (dev):** `http://localhost:44101`  
**Indeks:** [../BRD-DEFINITION-OF-DONE.md](../BRD-DEFINITION-OF-DONE.md)

Format respons default: JSON `{ data?, meta?, error? }`. Auth: `Authorization: Bearer <sessionToken>` atau cookie `invoicing_session` (token HMAC — [TECHNOLOGY-STACK](./TECHNOLOGY-STACK.md) §2.6).  
**Selarasan FR:** [../brd/ARCHITECTURE-ALIGNMENT.md](../brd/ARCHITECTURE-ALIGNMENT.md) §3

---

## Health (observability)

| Method | Path | 200 body | Gate |
|--------|------|----------|------|
| GET | `/api/health/live` | `{ status: "ok", service: "@invoicing/api" }` | Liveness |
| GET | `/api/health/ready` | `{ status: "ready", database: "ok" }` | DB reachable |
| GET | `/api/health/ready` | 503 jika DB error | Readiness |

Selaras [ARCHITECTURE.md](../ARCHITECTURE.md) §14.

---

## v1 — Status

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/v1/status` | Count users, clients, invoices |

---

## v1 — Clients (FR-01)

| Method | Path | FR | Status |
|--------|------|-----|--------|
| GET | `/api/v1/clients` | List | Implemented |
| POST | `/api/v1/clients` | Create | Implemented |
| GET | `/api/v1/clients/:id` | Read | Implemented |
| PATCH | `/api/v1/clients/:id` | Update | Implemented |
| DELETE | `/api/v1/clients/:id` | Deactivate | Implemented |

---

## v1 — Auth & dashboard

| Method | Path | Status |
|--------|------|--------|
| POST | `/api/v1/auth/register` | Implemented |
| POST | `/api/v1/auth/login` | Implemented |
| POST | `/api/v1/auth/logout` | Implemented |
| GET | `/api/v1/profile` | Implemented |
| PATCH | `/api/v1/profile` | Implemented |
| GET | `/api/v1/dashboard` | Implemented (FR-08) |

---

## v1 — Invoices (FR-02–07)

| Method | Path | FR |
|--------|------|-----|
| GET | `/api/v1/invoices` | FR-08 list · Implemented |
| POST | `/api/v1/invoices` | FR-02 create draft · Implemented |
| GET | `/api/v1/invoices/:id` | Read · Implemented |
| PATCH | `/api/v1/invoices/:id` | Update draft · Implemented |
| DELETE | `/api/v1/invoices/:id` | Delete draft · Implemented |
| POST | `/api/v1/invoices/:id/send` | FR-05 · Implemented — assign `INV-{YYYY}-{SEQ4}` + token; 502 `email_failed` jika email gagal (status tetap draft) |
| POST | `/api/v1/invoices/:id/mark-paid` | FR-07 · Implemented |
| GET | `/api/v1/invoices/:id/pdf` | FR-04 · Implemented |
| POST | `/api/v1/invoices/:id/revoke-link` | BR-05 · Implemented (UI web: gap G-02) |
| POST | `/api/v1/invoices/:id/cancel` | BR-01 · **Belum** (gap G-01) |

---

## Public (FR-06)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/public/invoices/:token` | Token only · Implemented — 404 “Link tidak valid atau dicabut” jika revoked; draft/cancelled tidak tersedia |

Alternatif HTML public view tetap di `@invoicing/web` route `/i/:token` (TDD).

---

## CORS

Dev: `CORS_ORIGIN=http://localhost:44100` (web app). Production: domain web produksi.

---

## Pemetaan ke monorepo

| Layer | Path |
|-------|------|
| HTTP server | [apps/api/src/server.ts](../../../apps/api/src/server.ts) |
| Routes | [apps/api/src/routes.ts](../../../apps/api/src/routes.ts) |
| Domain | [packages/domain](../../../packages/domain/) |
| DB | [packages/database](../../../packages/database/) |

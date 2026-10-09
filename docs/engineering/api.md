---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Backend API — Spesifikasi (MVP)

**Service:** `@invoicing/api` · **Base URL (dev):** `http://localhost:44101`  
**Indeks:** [../brd-definition-of-done.md](../product/brd-definition-of-done.md)

Format respons default: JSON `{ data?, meta?, error? }`. Auth: `Authorization: Bearer <sessionToken>` atau cookie `invoicing_session` (token HMAC — [TECHNOLOGY-STACK](technology-stack.md) §2.6).\
**Selarasan FR:** [../brd/architecture-alignment.md](../product/brd/architecture-alignment.md) §3

---

## Health (observability)

| Method | Path | 200 body | Gate |
|--------|------|----------|------|
| GET | `/api/health/live` | `{ status: "ok", service: "@invoicing/api" }` | Liveness |
| GET | `/api/health/ready` | `{ status: "ready", database: "ok" }` | DB reachable |
| GET | `/api/health/ready` | 503 jika DB error | Readiness |

Selaras [ARCHITECTURE.md](../architecture/README.md) §14.

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
| POST | `/api/v1/invoices/:id/revoke-link` | BR-05 · Implemented |
| POST | `/api/v1/invoices/:id/cancel` | BR-01 · Implemented |

---

## Debt collector (FR-14 · PRD-0700)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/v1/collectors` | List + ringkasan (`activeCount`, `activeOutstandingCents`, `earnedCommissionCents`) |
| POST | `/api/v1/collectors` | Create → 201. Body `{ name, email?, phone?, notes?, commissionRate }` (fraksi 0–1) |
| GET | `/api/v1/collectors/:id` | Detail + assignment aktif |
| PATCH | `/api/v1/collectors/:id` | Update; `active: false` → 409 `collector_has_active_assignments` bila masih menagih |
| DELETE | `/api/v1/collectors/:id` | Nonaktifkan (BR-09) |
| GET | `/api/v1/invoices/:id/collection` | `{ active, history }` — `history[0]` = assignment aktif bila ada |
| POST | `/api/v1/invoices/:id/collection/assign` | `{ collectorId }` — assign/reassign (BR-07) |
| POST | `/api/v1/invoices/:id/collection/unassign` | Lepas kolektor |
| POST | `/api/v1/invoices/:id/collection/activities` | `{ occurredAt, outcome, note? }` → 201 |
| GET | `/api/v1/invoices?collectorId=` | Filter invoice yang sedang ditagih kolektor |

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
| HTTP server | [apps/api/src/server.ts](../../apps/api/src/server.ts) |
| Routes | [apps/api/src/routes.ts](../../apps/api/src/routes.ts) |
| Domain | [packages/domain](../../packages/domain) |
| DB | [packages/database](../../packages/database) |

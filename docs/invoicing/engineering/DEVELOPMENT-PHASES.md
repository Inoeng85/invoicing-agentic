# Development Phases — MVP Invoicing

**Versi:** 1.0 · **Tanggal:** 2026-09-29  
**Indeks:** [../BRD-DEFINITION-OF-DONE.md](../BRD-DEFINITION-OF-DONE.md)  
**Sumber requirement:** [../brd/MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) · [TECHNICAL-DESIGN.md](./TECHNICAL-DESIGN.md)

Dokumen ini mengunci **urutan implementasi**, **Definition of Done (DoD)** per fase, dan **gate pass** (verifikasi/validasi) sebelum lanjut fase berikutnya.

**Verifikasi otomatis:** dari root monorepo `Agentic/`:

```bash
npm run db:migrate
npm run test:domain
npm run gate
```

### Status gate (2026-09-30)

| Gate | Otomatis (`npm run gate`) | Manual / UAT |
|------|---------------------------|--------------|
| G0–G5 | **Pass** (test:domain 3/3, typecheck, gate) | Pending (G1.2, G1.3, G2.2, G3.3, G4.2, G4.3, G5.2) |
| G6 | `npm run release:check` · CI `verify` job | G6.1 CI GitHub · legal · UAT · sign-off · G-04 prod Resend |

---

## Ringkasan fase

| Fase | Fokus | FR / capability | Gate ID |
|------|--------|-----------------|---------|
| **0** | Foundation | Monorepo, health, DB | G0 |
| **1** | Auth & profil | Register, login, settings | G1 |
| **2** | Klien | FR-01 | G2 |
| **3** | Invoice draft + PPN | FR-02, FR-03, BR-04 | G3 |
| **4** | PDF, kirim, publik | FR-04, FR-05, FR-06, BR-02 | G4 |
| **5** | Lunas & dashboard | FR-07, FR-08, BR-03 | G5 |
| **6** | Release readiness | UAT trace, CI, legal checklist | G6 |

---

## Phase 0 — Foundation

### Scope

- npm workspaces: `@invoicing/web`, `@invoicing/api`, `@invoicing/domain`, `@invoicing/database`
- Prisma schema + migrasi SQLite
- Health endpoints API

### Definition of Done

- [ ] `DATABASE_URL` valid; migrasi applied
- [ ] `GET /api/health/live` → 200
- [ ] `GET /api/health/ready` → 200 (database ok)
- [ ] `@invoicing/domain` `getSystemStatus()` tanpa throw

### Gate G0 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G0.1 | `npm run db:migrate` | Exit 0 |
| G0.2 | `npm run gate` (Phase 0 section) | Health live + ready 200 |
| G0.3 | `npm run typecheck` | Exit 0 (web + api) |

---

## Phase 1 — Auth & business profile

### Scope

- Register / login (domain + API + web)
- Session signed token (cookie web, Bearer API)
- Halaman `/settings` profil bisnis

### Definition of Done

- [ ] User + `BusinessProfile` terbuat saat register
- [ ] Password hashed (scrypt)
- [ ] Endpoint terproteksi return 401 tanpa session
- [ ] Web: `/login`, `/register`, dashboard require auth

### Gate G1 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G1.1 | Gate script Phase 1 | Register 200 + profile 200 |
| G1.2 | Manual | Login web → redirect dashboard |
| G1.3 | Manual | Update profil di `/settings` persist |

---

## Phase 2 — Clients (FR-01)

### Scope

- CRUD klien scoped `userId`
- Deactivate (bukan hard delete aktif)

### Definition of Done

- [ ] API: list, create, show, update, destroy(deactivate)
- [ ] Web: `/clients` list + form tambah/edit
- [ ] Email klien wajib untuk alur kirim invoice

### Gate G2 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G2.1 | Gate script Phase 2 | Create 201 + list 200 |
| G2.2 | [USER-STORIES-UAT.md](../brd/USER-STORIES-UAT.md) US-01/02 | Checklist Pass (manual UAT) |

---

## Phase 3 — Invoice draft & PPN (FR-02, FR-03)

### Scope

- Draft + ≥1 line item
- `computeInvoiceTotals` di `@invoicing/domain`
- BR-04: PPN dari subtotal setelah diskon baris

### Definition of Done

- [ ] Create/update draft only (BR-01)
- [ ] Subtotal / PPN / total tersimpan di DB
- [ ] Unit test 3 skenario PPN lulus

### Gate G3 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G3.1 | `npm run test:domain` | 3 test FR-03 Pass |
| G3.2 | Gate script Phase 3 | Draft 201; PPN 11jt on 100jt subtotal |
| G3.3 | UAT UAT-FR-03-a/b/c | [ ] → Pass |

---

## Phase 4 — PDF, email, public link (FR-04–06)

### Scope

- PDF (`pdf-lib`) via API + web download
- Send: assign number, token, `sent_at`; email adapter (log dev)
- Public: `/api/public/invoices/:token` + web `/i/:token`
- BR-02: nomor immutable setelah sent
- BR-05: revoke link (API)

### Definition of Done

- [ ] PDF Content-Type `application/pdf`
- [ ] Email gagal → status tetap draft (BRD)
- [ ] Public read-only; token revoked → 404

### Gate G4 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G4.1 | Gate script Phase 4 | PDF 200; send 200; public 200 |
| G4.2 | Manual | Buka `/i/:token` HTML read-only |
| G4.3 | UAT US-06 | Edit sent blocked |

---

## Phase 5 — Mark paid & dashboard (FR-07, FR-08)

### Scope

- `mark-paid` untuk `sent` / `overdue`
- Dashboard outstanding + list invoice
- BR-03: overdue job on read

### Definition of Done

- [ ] Status `paid` + `paid_at`
- [ ] Dashboard aggregate outstanding cents/count
- [ ] Web home menampilkan ringkasan FR-08

### Gate G5 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G5.1 | Gate script Phase 5 | mark-paid 200; dashboard 200 |
| G5.2 | UAT FR-07, FR-08 | Checklist Pass |

---

## Phase 6 — Release readiness

### Scope

- CI workflow (ARCHITECTURE §15)
- Legal review placeholder
- Engineering sign-off MVP-SCOPE-LOCK

### Definition of Done

- [x] `.github/workflows/ci.yml`: `npm run verify` (+ gate summary artifact)
- [ ] CI hijau di GitHub (G6.1)
- [ ] [legal/](../legal/) reviewed sebelum prod
- [ ] Semua Must FR UAT Pass
- [ ] Node ≥ 24.3 di CI (selaras engines)

### Gate G6 — Pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| G6.1 | CI green | All jobs Pass |
| G6.2 | `npm run gate` full | Phase 0–5 Pass |
| G6.3 | Product sign-off | MVP-SCOPE-LOCK engineering row filled |

---

## Traceability gate → script

Implementasi gate: [scripts/gates/run-all.ts](../../../scripts/gates/run-all.ts)

| Gate | Phase script |
|------|----------------|
| G0 | `gatePhase0()` |
| G1 | `gatePhase1()` |
| G2 | `gatePhase2()` |
| G3 | `gatePhase3()` + `test:domain` |
| G4 | `gatePhase4()` |
| G5 | `gatePhase5()` |
| G6 | Gate Phase 6 (revoke/cancel) + release:check + CI |

---

## Setelah semua gate Pass

1. Jalankan UAT lengkap: [USER-STORIES-UAT.md](../brd/USER-STORIES-UAT.md)  
2. Deploy staging (PostgreSQL prod path): [STACK-INTEGRATION.md](./STACK-INTEGRATION.md)  
3. Update [BRD-DEFINITION-OF-DONE.md](../BRD-DEFINITION-OF-DONE.md) checklist fitur bisnis

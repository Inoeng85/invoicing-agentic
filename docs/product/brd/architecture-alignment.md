---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Selarasan BRD ↔ Architecture ↔ Tech Stack ↔ Design

**Versi:** 2.1 · **Tanggal:** 2026-09-30  
Dokumen jembatan (hub) antara [BRD](../brd.md), [ARCHITECTURE.md](../../architecture/README.md), [technology-stack.md](../../engineering/technology-stack.md), dan [design-guidelines.md](../../design/design-guidelines.md).\
**MoSCoW & teks FR/BR:** [mvp-scope-lock.md](mvp-scope-lock.md) · **Kode:** `apps/*`, `packages/*` (sumber kebenaran status implementasi)

Jika dua dokumen berbeda, urutan otoritas: **MVP-SCOPE-LOCK** (requirement) → **dokumen ini §2** (keputusan lintas dokumen) → dokumen pilar masing-masing.

---

## 1. Konteks produk (sama di semua pilar)

| Aspek | BRD | Architecture | Tech stack | Design |
|-------|-----|--------------|------------|--------|
| Nama produk (UI) | PuraPuraLupa · Komando | §2 | — | M02 wordmark |
| Segmen | [product-brief.md](product-brief.md) | §2 | §1 | §3 persona |
| MVP outcome | Profil → klien → invoice → PDF/link → email → lunas → dashboard → **penagihan kolektor** | §2 | §3 | §4 backbone |
| North Star | Invoice terkirim / user aktif / minggu | §2 | — | §2 prinsip 1 |
| Non-goals | e-Faktur, payment gateway, multi-user, multi-currency | §2 | §1 “Explicitly out” | §8 copy PPN |

---

## 2. Keputusan canonical (lintas dokumen)

| # | Topik | Keputusan | Dirujuk oleh |
|---|-------|-----------|--------------|
| D-01 | Status implementasi | FR-01–FR-08 + **FR-14 / FR-14h** **implemented** (gate **G0–G7** Pass via `npm run gate`); Phase 6 (UAT manual, legal, sign-off engineering) **pending** | BRD, ARCH §20, TDD §9, DoD |
| D-02 | Nomor invoice | `INV-{YYYY}-{SEQ}` dengan SEQ 4 digit (contoh `INV-2026-0014`), per user per tahun terbit, di-assign saat kirim (BR-02) | Wireframes, Design §7, ARCH §8.1 |
| D-03 | Layar MVP | **8+ layar inti**: 7 layar invoicing (6 wireframe + daftar invoice) + **Kolektor** (`/collectors`, detail/edit) + panel Penagihan di `/invoices/:id` | Wireframes, Design M02, ARCH §12 |
| D-04 | Detail & preview | Satu route `/invoices/:id` = detail + preview (mirror PDF); tidak ada `/invoices/:id/preview` terpisah | ARCH §12, TDD §3, Wireframes §4 |
| D-05 | Label status | `draft` Draft · `sent` Terkirim · `overdue` Jatuh tempo · `paid` Lunas · `cancelled` Dibatalkan; publik: Menunggu pembayaran / Lunas | Design §6.4, UAT |
| D-06 | Overdue (BR-03) | Promosi **on-read** (list & dashboard, `refreshOverdueInvoices`); cron harian = post-MVP | ARCH §14.7, Stack §2.8 |
| D-07 | PDF (FR-04) | **pdf-lib** (final MVP) di `@invoicing/domain/pdf.ts` | ARCH §3, Stack §2.7 |
| D-08 | Email (FR-05) | Adapter `setEmailSender` di domain; default **log adapter** (dev/test); **Resend** = provider produksi (belum terpasang) | ARCH §11, Stack §2.7 |
| D-09 | Auth | Password **scrypt** (`node:crypto`); session token ditandatangani **HMAC** (`SESSION_SECRET`); cookie `invoicing_session` (HttpOnly, SameSite=Lax) atau `Authorization: Bearer` di API | ARCH §10, Stack §2.6, api.md |
| D-10 | Design tokens | Token semantik di **`packages/design-tokens/`** (`tokens.css`, `components.css`) di-import `apps/web/app/styles/app.css`; prototype = referensi visual | Design M03, Stack §2.2 |
| D-11 | Dark mode | Token dark tersedia di prototype saja; app MVP **light only** (Could FR-12) | Design §1, §15 |
| D-12 | Should/Could | FR-10 (default due +30 & footer default) **sudah terimplementasi**; FR-09, FR-11, FR-12, FR-13 belum — tampil di prototype sebagai desain, bukan komitmen MVP | MVP-SCOPE-LOCK, Design §15 |
| D-13 | Health endpoint | `/api/health/live`, `/api/health/ready` (prefix `/api`) | ARCH §14.3, api.md |
| D-14 | Brand | Wordmark **PuraPuraLupa**; tagline **Komisi Matel Indonesia (Komando)**; monorepo npm tetap `@invoicing/*` | `apps/web/app/lib/brand.ts`, prototype, M02 |

---

## 3. Pemetaan FR Must → arsitektur → stack → design

| FR | Ringkas (BRD) | Web (`apps/web`) | API (`apps/api`) | Domain / DB | Stack | Layar design (prototype) | Status |
|----|---------------|------------------|------------------|-------------|-------|--------------------------|--------|
| Setup | Register, login, profil | `/login`, `/register`, `/settings` | `/api/v1/auth/*`, `/api/v1/profile` | `auth.ts`, `profile.ts` · `User`, `BusinessProfile` | scrypt, HMAC session | `screen-auth`, `screen-settings` | Implemented |
| FR-01 | CRUD klien | `/clients`, `/clients/new`, `/clients/:id(/edit)` | `/api/v1/clients` (DELETE = nonaktifkan) | `clients.ts` · `Client.active` | Prisma | `screen-clients`, `screen-client-detail` | Implemented (search: gap G-10) |
| FR-02 | Invoice draft | `/invoices/new`, `/invoices/:id/edit` | `/api/v1/invoices` CRUD | `invoices.ts` · `Invoice`, `InvoiceLineItem` | Prisma `$transaction` | `screen-invoice-editor` | Implemented |
| FR-03 | PPN toggle | Editor + disclaimer | field `ppnEnabled`, `ppnRate` | `invoiceTotals.ts` (BR-04) | `node:test` 3 skenario | `screen-invoice-editor` | Implemented |
| FR-04 | PDF | `/invoices/:id` + `GET /invoices/:id/pdf` | `GET /api/v1/invoices/:id/pdf` | `pdf.ts` | pdf-lib | `screen-invoice-preview`, `screen-pdf-states` | Implemented |
| FR-05 | Kirim email | `POST /invoices/:id/send` | `POST /api/v1/invoices/:id/send` | `sendInvoice` + `email.ts` (BR-02) | Log adapter → Resend (G-04) | `screen-invoice-send` | Implemented (provider: gap G-04) |
| FR-06 | Public link | `GET /i/:token` | `GET /api/public/invoices/:token`, `POST .../revoke-link` | `getInvoiceByPublicToken` (BR-05) | token `randomBytes(24)` base64url | `screen-public`, `screen-pdf-states` | Implemented |
| FR-07 | Tandai lunas | `POST /invoices/:id/mark-paid` | `POST /api/v1/invoices/:id/mark-paid` | `markInvoicePaid` (+ tutup assignment kolektor, BR-08) | Prisma | `screen-invoice-locked`, dashboard row action | Implemented |
| FR-08 | Dashboard | `/`, `/invoices` | `GET /api/v1/dashboard`, `GET /api/v1/invoices` | `getDashboardSummary` (BR-03) | Prisma aggregate | `screen-dashboard`, `screen-invoice-list` | Implemented |
| FR-14 | Debt collector | `/collectors`, panel `/invoices/:id/collection/*` | `/api/v1/collectors`, `/api/v1/invoices/:id/collection/*` | `collectors.ts`, `collections.ts` · `DebtCollector`, `CollectionAssignment`, `CollectionActivity` | Gate G7 | Nav **Kolektor** · panel Penagihan di detail invoice | Implemented |
| FR-14h | Foto kolektor | `GET/POST/DELETE …/collectors/:id/photo` | _(tidak ada — web only)_ | `collector-photos.ts` · `DebtCollectorPhoto` BLOB | Validasi magic bytes, 1 MB | Avatar di edit kolektor + `collection-panel` | Implemented |

Should/Could:

| FR | Status | Catatan design |
|----|--------|----------------|
| FR-09 Duplicate | Belum | Aksi di `screen-invoice-locked`, `screen-invoice-list` |
| FR-10 Default due/footer | Implemented | `BusinessProfile.defaultDueDays`, `footerDefault` |
| FR-11 Export CSV | Belum | Dialog di `screen-invoice-list` |
| FR-12 Dark | Belum (app) | Toggle hanya di prototype |
| FR-13 PDF ID/EN | Belum | Tab di `screen-pdf-states` |

Public invoice (FR-06): **HTML** di web `/i/:token` (Wireframes §5) · **JSON** di API `/api/public/invoices/:token` ([api.md](../../engineering/api.md)).

---

## 4. Pemetaan BR → lapisan

| BR | Enforced di | Implementasi | Design |
|----|-------------|--------------|--------|
| BR-01 | Domain `assertDraft`, `cancelInvoice` | Edit hanya `draft`; `sent`/`overdue` → `cancelled` via web + API | `screen-invoice-locked` (banner + dialog batalkan) |
| BR-02 | Domain `sendInvoice` | Nomor + token di-assign saat kirim dalam `$transaction`; email setelah commit (G-13) | Editor “(auto saat kirim)”, alert “Nomor dikunci” |
| BR-03 | Domain `refreshOverdueInvoices` | On-read (D-06) | Badge Jatuh tempo, alert dashboard |
| BR-04 | `invoiceTotals.ts` | `max(0, qty×harga − diskon)`; PPN = round(subtotal × rate) | Kalkulator editor prototype (`prototype.js` mirror) |
| BR-05 | Domain + API + web | `publicTokenRevokedAt`; `POST …/revoke-link` | “Link tidak valid atau dicabut” |
| BR-06 | Domain `deleteInvoiceDraft` | API DELETE; web `POST …/delete-draft` | Dialog “Hapus draft” dashboard |
| BR-07 | `collections.ts` | Assign/activity hanya `sent`/`overdue`; kolektor aktif milik user | Panel Penagihan di detail invoice |
| BR-08 | `collections.ts` | Snapshot rate saat assign; `commissionCents` saat `paid` | Ringkasan komisi di panel + list kolektor |
| BR-09 | `collectors.ts` | Nonaktifkan ditolak jika assignment aktif | Edit kolektor + badge nonaktif |

State machine: ARCHITECTURE §8.1 (selaras lifecycle di [user-story-map.md](user-story-map.md)).

---

## 5. UX, design & QA vs arsitektur

| Artefak | Arsitektur | Design |
|---------|------------|--------|
| [user-story-map.md](user-story-map.md) | ARCHITECTURE §9 alur data | Design §4 backbone |
| [wireframes.md](wireframes.md) | ARCHITECTURE §12 routes | Design §9 checklist, prototype `screen-*.html` |
| [user-stories-uat.md](user-stories-uat.md) | ARCHITECTURE §17 QA | Design §10 edge cases |
| Legal PPN | ARCHITECTURE §4 prinsip 7 | Design §8.1 copy |

**UAT MVP:** jalur **web** = acceptance user-facing; **API** = contract/integration test (`npm run gate`) untuk baris FR yang sama.

---

## 6. Register gap (dokumen ↔ kode)

Gap yang **disadari** — dokumen menyebut perilaku target; kode belum. Tutup sebelum tag `v0.1.0` kecuali ditandai post-MVP.

| ID | Area | Target (dokumen) | Kondisi kode | Prioritas |
|----|------|------------------|--------------|-----------|
| G-03 | Format nomor | Setting `invoiceNumberFormat` dipakai | Selalu `INV-YYYY-NNNN` | Should |
| G-04 | FR-05 provider | Resend + `EMAIL_API_KEY`, `EMAIL_FROM` | Log adapter default | Must (pre-prod) |
| G-05 | Keamanan | CSRF form web, rate limit `/i/:token`, `noindex` | CSRF `_csrf`, rate limit web+API public, `noindex` halaman `/i/` | Must (pre-prod) · **Implemented** |
| G-06 | Observability | JSON log + `requestId` | `@invoicing/platform` `requestLogging()` di web & API | Should · **Implemented** |
| G-07 | Design di app | Token package + nav aktif dinamis + wordmark PuraPuraLupa | `design-tokens` + `layout.tsx` nav 5 item | Should · **Implemented** |
| G-10 | Klien search | Kolom cari (Wireframes §2) | Belum | Could |
| G-11 | FR-09, FR-11 | Should backlog | Belum | Sprint 2 |
| G-12 | Env example | `SESSION_SECRET`, `APP_URL` | Ada di `apps/*/.env.example` + setup | Should · **Implemented** |

Gap **ditutup** (tidak lagi terbuka): G-01 cancel, G-02 revoke UI, G-08 hapus draft web, G-09 verify CI, G-13 send atomik — lihat riwayat gate G6/G7.

---

## 7. Maintenance

- FR/BR berubah di [mvp-scope-lock.md](mvp-scope-lock.md) → perbarui §3–§4 di file ini **dan** ARCHITECTURE §7.1.
- Keputusan lintas dokumen baru → tambah baris §2 (D-xx), lalu rujuk dari dokumen pilar.
- Gap ditutup → hapus baris §6 dan ubah status di §3.

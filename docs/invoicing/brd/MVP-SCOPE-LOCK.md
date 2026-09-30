# MVP Scope Lock — MoSCoW

**Status:** LOCKED untuk development MVP  
**Tanggal lock:** 2026-09-29  
**Referensi validasi:** [STAKEHOLDER-VALIDATION.md](./STAKEHOLDER-VALIDATION.md)  
**Pemetaan teknis:** [ARCHITECTURE-ALIGNMENT.md](./ARCHITECTURE-ALIGNMENT.md) · [ARCHITECTURE.md](../ARCHITECTURE.md) §7.1

## Must have (development wajib)

| ID | Requirement | Acceptance summary |
|----|-------------|-------------------|
| **FR-01** | CRUD klien | Tambah/edit/nonaktifkan; email wajib untuk kirim invoice |
| **FR-02** | CRUD invoice draft | ≥1 line item; subtotal/grand total otomatis |
| **FR-03** | PPN opsional per invoice | Toggle; tarif default 11%; 3 skenario uji kalkulasi lulus |
| **FR-04** | Generate PDF | Logo, nomor, tanggal, due date, rekening, items, total |
| **FR-05** | Kirim invoice | Status `sent`, `sent_at`; email terkirim atau error jelas |
| **FR-06** | Public link | Klien tanpa login; read-only; selaras preview |
| **FR-07** | Tandai lunas | Manual `paid` + `paid_at` |
| **FR-08** | Dashboard | List invoice, filter status, jumlah outstanding |

## Should have (sprint berikutnya jika MVP on-track)

| ID | Requirement | Status |
|----|-------------|--------|
| FR-09 | Duplicate invoice | Belum |
| FR-10 | Default due date +30 hari, footer default | Implemented (bersama Phase 1/3) |
| FR-11 | Export CSV periode | Belum |

## Could have (buffer MVP)

FR-12 dark preview · FR-13 label PDF ID/EN

## Won't have (MVP)

e-Faktur, payment gateway, multi-user, multi-currency.

## Pemetaan FR/BR → sistem

Tabel lengkap web / API / domain / stack / layar design + status implementasi: [ARCHITECTURE-ALIGNMENT.md](./ARCHITECTURE-ALIGNMENT.md) §3–§4; gap terbuka §6.  
Must have di bawah ini = **sumber teks requirement**; implementasi mengikuti `@invoicing/domain` + saluran di alignment doc.

## Business rules (implementasi wajib)

| ID | Aturan |
|----|--------|
| BR-01 | Invoice `sent`: tidak edit line items material; cancel + buat baru, atau edit hanya saat `draft` |
| BR-02 | Nomor invoice immutable setelah `sent` |
| BR-03 | `overdue` = `due_date` < today AND status `sent` |
| BR-04 | PPN base = subtotal setelah diskon baris |
| BR-05 | Public link revocable |
| BR-06 | Hard delete hanya `draft`; lainnya arsip |

## Sign-off

| Peran | Nama | Tanggal | MoSCoW Must |
|-------|------|---------|-------------|
| Product | Cursor (PM) | 2026-09-29 | Approved |
| Engineering | _(sign-off pending)_ | | Pre-release auto: `npm run release:check` + [LEGAL-REVIEW-CHECKLIST.md](../legal/LEGAL-REVIEW-CHECKLIST.md) |
| Legal (draft) | _(review [../legal/](../legal/))_ | | |

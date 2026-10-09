---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# MVP Scope Lock — MoSCoW

**Status:** LOCKED untuk development MVP  
**Tanggal lock:** 2026-09-30 (perluasan FR-14 / FR-14h)  
**Referensi validasi:** [stakeholder-validation.md](stakeholder-validation.md)\
**Pemetaan teknis:** [architecture-alignment.md](architecture-alignment.md) · [ARCHITECTURE.md](../../architecture/README.md) §7.1\
**Brand produk (UI):** **PuraPuraLupa** · tagline **Komisi Matel Indonesia (Komando)** — [`apps/web/app/lib/brand.ts`](../../../apps/web/app/lib/brand.ts)

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
| **FR-14** | Debt collector | CRUD kontak kolektor, assign/reassign/unassign pada invoice `sent`/`overdue`, log penagihan, komisi terkunci saat lunas — [PRD-0700](../requirements/0700-debt-collector/0700-prd-debt-collector.md) |
| **FR-14h** | Foto kolektor | Upload/ganti/hapus foto (JPG/PNG/WebP ≤ 1 MB); avatar di panel Penagihan — [PRD-0701](../requirements/0701-foto-kolektor/0701-prd-foto-kolektor.md) |

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

Tabel lengkap web / API / domain / stack / layar design + status implementasi: [architecture-alignment.md](architecture-alignment.md) §3–§4; gap terbuka §6.\
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
| BR-07 | Assign/aktivitas penagihan hanya untuk invoice `sent`/`overdue`; kolektor harus aktif & milik user |
| BR-08 | Rate komisi di-snapshot saat assign; dikunci saat `paid`, tanpa komisi saat `cancelled` |
| BR-09 | Kolektor dengan assignment aktif tidak dapat dinonaktifkan |
| BR-10 | Link tracking hanya untuk penugasan aktif; lokasi hanya diterima selama penugasan aktif & token cocok |
| BR-11 | Saat penugasan berakhir, token tracking dikosongkan dan jejak lokasi dihapus; hanya posisi terakhir disimpan |
| BR-12 | Validasi lokasi: lat ±90, lng ±180, akurasi ≤ 1000 m, waktu ≤ sekarang + 5 menit dan ≥ waktu assign |

Kolektor **bukan user** — non-goal multi-user tetap berlaku.

## Sign-off

| Peran | Nama | Tanggal | MoSCoW Must |
|-------|------|---------|-------------|
| Product | Cursor (PM) | 2026-09-30 | Approved (termasuk FR-14, FR-14h) |
| Engineering | _(sign-off pending)_ | | Pre-release auto: `npm run release:check` + [legal-review-checklist.md](../legal/legal-review-checklist.md) |
| Legal (draft) | _(review [../legal/](../legal))_ | | L-6 wajib sebelum prod (kolektor + foto) |

---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# User Stories & UAT Checklist

Format: **Given / When / Then** · Traceability ke FR/BR ([mvp-scope-lock.md](mvp-scope-lock.md))

**UAT MVP:** skenario di dokumen ini validasi terutama **`apps/web`** (UI). Untuk **`apps/api`**, gunakan contract/integration test untuk FR yang sama ([architecture-alignment.md](architecture-alignment.md) §5).\
**Architecture QA:** [../ARCHITECTURE.md](../../architecture/README.md) §17

---

## Epic: Setup & profil

### US-01 — Registrasi

**Given** pengunjung belum punya akun  
**When** mengisi email dan password valid lalu mendaftar  
**Then** akun terbuat dan diarahkan ke onboarding profil bisnis  

_UAT:_ US-01-1 Registrasi sukses · US-01-2 Email duplikat ditolak · US-01-3 Password policy enforced  

---

### US-02 — Profil bisnis

**Given** user login pertama kali  
**When** mengisi nama legal, alamat, dan rekening bank lalu menyimpan  
**Then** data tersimpan dan dipakai default di invoice/PDF baru  

_UAT:_ US-02-1 Simpan profil · US-02-2 Logo opsional tampil di PDF jika diupload  

---

## Epic: Klien (FR-01)

### US-03 — Tambah klien

**Given** user di halaman Klien  
**When** menambah klien dengan nama dan email valid  
**Then** klien muncul di daftar dan bisa dipilih di editor invoice  

**Given** email kosong  
**When** menyimpan klien  
**Then** validasi gagal dengan pesan jelas  

_UAT:_ US-03-1 CRUD happy path · US-03-2 Edit · US-03-3 Nonaktifkan (tidak muncul di picker baru) · US-03-4 Email wajib  

---

## Epic: Invoice draft (FR-02, FR-03, BR-01, BR-02)

### US-04 — Buat invoice dari klien

**Given** minimal satu klien aktif  
**When** user membuat invoice draft dan memilih klien, menambah ≥1 line item  
**Then** subtotal dan total terhitung otomatis  

_UAT:_ US-04-1 Satu baris · US-04-2 Banyak baris · US-04-3 Diskon per baris  

---

### US-05 — PPN opsional

**Given** invoice draft dengan subtotal Rp 1.000.000  
**When** user mengaktifkan PPN 11%  
**Then** PPN Rp 110.000 dan total Rp 1.110.000  

**Given** PPN nonaktif  
**When** menyimpan  
**Then** total = subtotal  

_UAT:_ US-05-1 Toggle on · US-05-2 Toggle off · US-05-3 Fixture 3 skenario (plan FR-03)  

---

### US-06 — Immutability setelah kirim (BR-01, BR-02)

**Given** invoice status `sent`  
**When** user mencoba mengubah line item  
**Then** UI menolak atau hanya izinkan cancel + invoice baru  

**Given** invoice `sent`  
**When** melihat nomor invoice  
**Then** nomor tidak berubah  

_UAT:_ US-06-1 Edit blocked sent · US-06-2 Draft editable · US-06-3 Number stable  

---

## Epic: PDF & kirim (FR-04, FR-05)

### US-07 — Generate PDF

**Given** invoice draft lengkap  
**When** user unduh PDF  
**Then** PDF berisi logo (jika ada), nomor, tanggal, due date, rekening, items, total  

_UAT:_ US-07-1 Field completeness · US-07-2 p95 generate < 5 detik (NFR)  

---

### US-08 — Kirim email

**Given** invoice draft valid dan klien punya email  
**When** user klik Kirim ke klien  
**Then** status `sent`, `sent_at` terisi, email terkirim (link + attachment atau link prominent)  

**Given** gagal SMTP  
**When** kirim  
**Then** status tetap draft atau sent tidak set; pesan error jelas  

_UAT:_ US-08-1 Send success · US-08-2 sent_at · US-08-3 Email failure handling  

---

## Epic: Public link (FR-06, BR-05)

### US-09 — Klien lihat invoice

**Given** token publik valid  
**When** klien membuka `/i/:token` tanpa login  
**Then** tampilan read-only selaras preview  

**Given** token dicabut  
**When** klien membuka link  
**Then** 404 atau halaman “tidak tersedia”  

_UAT:_ US-09-1 Public view · US-09-2 Revoke · US-09-3 No auth required  

---

## Epic: Pembayaran & dashboard (FR-07, FR-08, BR-03)

### US-10 — Tandai lunas

**Given** invoice `sent` atau `overdue`  
**When** user tandai lunas  
**Then** status `paid`, `paid_at` terisi, outstanding dashboard berkurang  

_UAT:_ US-10-1 Mark paid · US-10-2 paid_at  

---

### US-11 — Overdue otomatis

**Given** invoice `sent` dan due_date kemarin  
**When** job harian atau load dashboard  
**Then** status tampil `overdue`  

_UAT:_ US-11-1 Overdue rule BR-03  

---

### US-12 — Dashboard

**Given** user punya beberapa invoice dengan status berbeda  
**When** membuka dashboard  
**Then** outstanding sum benar dan filter status bekerja  

_UAT:_ US-12-1 Outstanding · US-12-2 Filter sent/paid/draft/overdue  

---

## Epic: Klien forward PDF (kritikal plan §14)

### US-13 — Unduh untuk WA

**Given** invoice `sent`  
**When** freelancer unduh PDF dari preview/detail  
**Then** file siap dibagikan manual  

_UAT:_ US-13-1 Download from detail  

---

## UAT master checklist (MVP release)

Centang sebelum release MVP. ID test → FR.

| Test ID | FR | Deskripsi | Pass |
|---------|-----|-----------|------|
| UAT-FR-01-a | FR-01 | Create client | [ ] |
| UAT-FR-01-b | FR-01 | Edit client | [ ] |
| UAT-FR-01-c | FR-01 | Deactivate client | [ ] |
| UAT-FR-02-a | FR-02 | Create draft 1+ lines | [ ] |
| UAT-FR-02-b | FR-02 | Auto totals | [ ] |
| UAT-FR-03-a | FR-03 | PPN on scenario A | [ ] |
| UAT-FR-03-b | FR-03 | PPN off | [ ] |
| UAT-FR-03-c | FR-03 | PPN discount scenario | [ ] |
| UAT-FR-04-a | FR-04 | PDF content | [ ] |
| UAT-FR-05-a | FR-05 | Send → sent + email | [ ] |
| UAT-FR-06-a | FR-06 | Public link view | [ ] |
| UAT-FR-06-b | FR-06 | Revoke token | [ ] |
| UAT-FR-07-a | FR-07 | Mark paid | [ ] |
| UAT-FR-08-a | FR-08 | Dashboard list + filter | [ ] |
| UAT-FR-08-b | FR-08 | Outstanding sum | [ ] |
| UAT-BR-01 | BR-01 | No edit lines when sent | [ ] |
| UAT-BR-03 | BR-03 | Overdue | [ ] |
| UAT-NFR-01 | NFR | PDF p95 < 5s (staging) | [ ] |
| UAT-NFR-02 | NFR | Dashboard p95 < 2s | [ ] |

**Exit criteria MVP:** Semua UAT-FR-* dan UAT-BR-* Pass; NFR staging documented.

---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Wireframes Low-Fi — MVP

**Scope:** `@invoicing/web` saja (SSR + Tailwind). API tidak memiliki layar.  
**Routes:** [../ARCHITECTURE.md](../../architecture/README.md) §12 · **FR:** [mvp-scope-lock.md](mvp-scope-lock.md) · **Keputusan canonical:** [architecture-alignment.md](architecture-alignment.md) §2\
**Prototype hi-fi:** [../../design/prototype/](../../design/prototype/index.html) (`screen-*.html`)  
**Design guidelines:** [../design/design-guidelines.md](../../design/design-guidelines.md) · [modules](../../design/modules/README.md) · [5 contoh](../../design/examples/index.html)

Konvensi: `[ ]` input · `( )` radio · `[Btn]` tombol · `|---|` tabel · `*` navigasi aktif

---

## 1. Dashboard (`/`)

```
+------------------------------------------------------------------+
| [Logo] PuraPuraLupa   *Dashboard* Klien Kolektor Invoice Pengaturan [Avatar]|
+------------------------------------------------------------------+
|  Outstanding (IDR)                                               |
|  +------------------+  +------------------+  +----------------+ |
|  | Rp 12.450.000    |  | 3 Jatuh tempo    |  | 5 Draft        | |
|  +------------------+  +------------------+  +----------------+ |
|                                                                  |
|  Invoice terbaru                    [Filter: Semua v] [+ Invoice]|
|  +--------------------------------------------------------------+|
|  | No.        | Klien      | Jumlah      | Status   | Due      ||
|  |INV-2026-0012| PT ABC    | Rp 5.550.000| Terkirim | 05 Okt   ||
|  |INV-2026-0011| Budi      | Rp 2.000.000| Jatuh t. | 20 Sep   ||
|  |INV-2026-0010| CV XYZ    | Rp 4.950.000| Lunas    | —        ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Elemen kunci:** FR-08 outstanding, filter status, CTA buat invoice. Row action `[···]` → Lihat · Unduh PDF · Tandai lunas (FR-07). Label status sesuai Design §6.4.

---

## 2. Client list (`/clients`)

```
+------------------------------------------------------------------+
| * Klien *                                                        |
+------------------------------------------------------------------+
| [Cari nama/email...                    ]        [+ Tambah klien] |
|                                                                  |
|  +--------------------------------------------------------------+|
|  | Nama          | Email              | Invoice | Aksi         ||
|  | PT ABC        | finance@abc.co.id    | 4       | Edit Nonaktif||
|  | Budi Santoso  | budi@gmail.com       | 2       | Edit Nonaktif||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Modal Tambah klien:** Nama*, Email*, Alamat, Catatan · [Batal] [Simpan]

---

## 3. Invoice editor (`/invoices/new` | `/invoices/:id/edit`)

```
+------------------------------------------------------------------+
|  Invoice draft                          [Simpan draft] [Preview] |
+------------------------------------------------------------------+
|  Klien: [ PT ABC - finance@abc.co.id        v ]                  |
|  Tanggal: [29 Sep 2026]   Jatuh tempo: [29 Okt 2026]           |
|  No: (auto INV-2026-0013 saat kirim)                             |
|                                                                  |
|  Line items                                                      |
|  | Deskripsi          | Qty | Harga    | Diskon | Subtotal     ||
|  | Desain landing     |  1  | 5000000  |   0    | 5.000.000  ||
|  | [+ Baris]                                                    |
|                                                                  |
|  ( ) Tanpa PPN   (x) PPN 11%                                     |
|                                                                  |
|                              Subtotal:      Rp 5.000.000         |
|                              PPN 11%:       Rp   550.000         |
|                              Total:         Rp 5.550.000         |
|                                                                  |
|  Catatan footer: [ Pembayaran ke BCA 1234567890 a/n ... ]        |
|                                                                  |
|  [Batal]              [Unduh PDF]  [Kirim ke klien]              |
+------------------------------------------------------------------+
|  * PPN hanya kalkulator. Bukan e-Faktur DJP. (link disclaimer)   |
+------------------------------------------------------------------+
```

**Elemen kunci:** FR-02, FR-03; kirim disabled jika draft invalid / klien tanpa email.

---

## 4. Detail & preview (`/invoices/:id`)

```
+------------------------------------------------------------------+
|  Invoice INV-2026-0012  [Terkirim]  [Kembali] [Tandai lunas]     |
+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  | [Logo]  Nama Bisnis Freelancer                             |  |
|  |         Jl. ... Jakarta                                    |  |
|  |                                                            |  |
|  |  INVOICE INV-2026-0012         Tagihan kepada: PT ABC      |  |
|  |  Tanggal: 29 Sep 2026          finance@abc.co.id           |  |
|  |  Jatuh tempo: 29 Okt 2026                                  |  |
|  |  | Item | Qty | Harga | Total |                             |  |
|  |  ...                                                       |  |
|  |  Total: Rp 5.550.000                                       |  |
|  |  Transfer: BCA 1234567890                                  |  |
|  +------------------------------------------------------------+  |
|  [Unduh PDF]                                                     |
+------------------------------------------------------------------+
```

**Elemen kunci:** FR-04 WYSIWYG dengan PDF (`GET /invoices/:id/pdf`). Satu route untuk detail + preview ([ALIGNMENT D-04](architecture-alignment.md#2-keputusan-canonical-lintas-dokumen)). Draft: tombol [Edit] [Kirim ke klien]; sent/overdue: [Tandai lunas] [Salin tautan] [Cabut tautan].

---

## 5. Public view (`/i/:token`)

```
+------------------------------------------------------------------+
|  [Logo] Invoice dari Nama Bisnis Freelancer                      |
+------------------------------------------------------------------+
|  (Same content as preview — no edit controls)                    |
|  Status untuk klien: Menunggu pembayaran / Lunas               |
|  Jatuh tempo: 29 Okt 2026                                        |
|                                                                  |
|  [Unduh PDF]                                                     |
+------------------------------------------------------------------+
|  Powered by PuraPuraLupa · Privasi                               |
+------------------------------------------------------------------+
```

**Elemen kunci:** FR-06 tanpa login; noindex; rate limit server-side.

---

## 6. Settings (`/settings`)

```
+------------------------------------------------------------------+
|  Pengaturan                                                      |
+------------------------------------------------------------------+
|  Profil bisnis                                                   |
|  Nama legal:    [________________________]                       |
|  Alamat:        [________________________]                       |
|  NPWP (opsional):[________________________]                       |
|  Logo:          [Upload]  preview                                |
|  Rekening bank: [________________________]                       |
|  Footer default:[________________________]                       |
|                                                                  |
|  Invoice                                                         |
|  Format nomor:  [INV-{YYYY}-{SEQ}     ]                          |
|  Default due:   [30] hari                                        |
|                                                                  |
|  Akun                                                            |
|  Email: user@example.com                                         |
|  [Ubah password]  [Hapus akun]                                   |
|                                                                  |
|  Legal: [Syarat] [Privasi]                                       |
|                                                                  |
|  [Simpan perubahan]                                              |
+------------------------------------------------------------------+
```

**Elemen kunci:** Profil bisnis MVP; format nomor; legal links.

---

## 7. Daftar invoice (`/invoices`)

```
+------------------------------------------------------------------+
| [Logo] PuraPuraLupa    Dashboard  Klien Kolektor *Invoice* Pengaturan [Avatar]|
+------------------------------------------------------------------+
|  Invoice                                          [+ Invoice baru]|
|  [Semua] [Draft] [Terkirim] [Jatuh tempo] [Lunas]   [Cari...    ] |
|  +--------------------------------------------------------------+|
|  | No.          | Klien     | Jumlah       | Status   | Due  |···||
|  | (auto saat kirim) | Yayasan | Rp 3.330.000 | Draft |  —   |···||
|  | INV-2026-0012| CV XYZ    | Rp 2.000.000 | Jatuh t. | 26 Sep|···||
|  | INV-2026-0011| Budi      | Rp 1.500.000 | Lunas    | 20 Sep|···||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Elemen kunci:** target menu “Invoice”; filter status (FR-08); kolom/filter **Kolektor** (FR-14f); row action draft → Edit · Hapus draft (BR-06); sent → Tandai lunas (FR-07). Export CSV (FR-11) & Duplikat (FR-09) = Should.

---

## 8. Kolektor (`/collectors`) — FR-14 / FR-14h

```
+------------------------------------------------------------------+
| [Logo] PuraPuraLupa   Dashboard  Klien *Kolektor* Invoice Pengaturan [Avatar]|
+------------------------------------------------------------------+
|  Kolektor                                      [+ Kolektor baru] |
|  +--------------------------------------------------------------+|
|  | Nama        | Kontak           | Komisi | Aktif | Invoice aktif||
|  | Pak Joko    | joko@… / 08…     | 10%    | Ya    | 2              ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Edit kolektor:** form kontak + rate komisi + **upload foto** (FR-14h, max 1 MB).  
**Detail invoice:** panel **Penagihan** — assign kolektor, log aktivitas, avatar + komisi (FR-14c–e).

---

## Review wireframe (checklist)

- [x] Layar inti + daftar invoice + **Kolektor** sesuai ARCHITECTURE §12
- [x] Trace ke FR-01 (clients), FR-02–05 (editor/preview), FR-06 (public), FR-07 (mark paid), **FR-14 / FR-14h** (kolektor + foto)
- [x] Disclaimer PPN visible di editor
- [x] Nav 5 item: Dashboard · Klien · Kolektor · Invoice · Pengaturan (M02)

**Catatan:** Aksi **Tandai lunas** ada di detail invoice (`/invoices/:id`) dan row action dashboard/daftar invoice: `[···] → Tandai lunas`.

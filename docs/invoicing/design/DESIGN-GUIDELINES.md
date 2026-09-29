# Design Guidelines — Invoicing Freelancer (Indonesia)

**Versi:** 1.1 · **Tanggal:** 2026-09-29  
**Indeks:** [../BRD-DEFINITION-OF-DONE.md](../BRD-DEFINITION-OF-DONE.md)  
**Sumber BRD:** [../brd/PRODUCT-BRIEF.md](../brd/PRODUCT-BRIEF.md) · [../brd/WIREFRAMES.md](../brd/WIREFRAMES.md) · [../brd/MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) · [../brd/USER-STORY-MAP.md](../brd/USER-STORY-MAP.md)  
**Implementasi UI:** `@invoicing/web` (Remix 3 SSR + Tailwind CSS v4) · **Stack:** [../engineering/TECHNOLOGY-STACK.md](../engineering/TECHNOLOGY-STACK.md) §2.2 · **Routes:** [../ARCHITECTURE.md](../ARCHITECTURE.md) §12  
**Keputusan canonical lintas dokumen:** [../brd/ARCHITECTURE-ALIGNMENT.md](../brd/ARCHITECTURE-ALIGNMENT.md) §2 (D-02 nomor, D-03 layar, D-05 label status, D-10 token, D-11 dark)

Panduan ini mengunci **prinsip desain**, **pola visual**, **pola konten**, dan **pola layar** untuk MVP. Detail low-fi: [WIREFRAMES.md](../brd/WIREFRAMES.md).

---

## 1. Tujuan & audiens

| Audiens | Pakai guideline untuk |
|---------|------------------------|
| Product / PM | Konsistensi acceptance & UAT |
| Design / FE | Wireframe → implementasi Tailwind |
| QA | Ekspektasi UI per FR |
| Legal / compliance | Copy PPN & batas klaim produk |

**Out of scope:** design system proprietary (Figma kit penuh), dark mode di app (Could FR-12 — token dark hanya tersedia di prototype), bilingual PDF label (Could FR-13).

---

## 2. Prinsip desain produk

Selaras [PRODUCT-BRIEF.md](../brd/PRODUCT-BRIEF.md) dan validasi persona ([STAKEHOLDER-VALIDATION.md](../brd/STAKEHOLDER-VALIDATION.md)).

1. **Cepat sampai invoice terkirim** — North Star: invoice *sent*; minim langkah dari dashboard ke kirim email.
2. **Satu sumber kebenaran** — status invoice, total IDR, dan riwayat klien jelas; hindari informasi duplikat di banyak layar.
3. **Profesional tapi ringan** — tampilan layak dikirim ke klien korporat, tanpa kompleksitas ERP.
4. **Jujur soal pajak** — PPN = kalkulator; disclaimer selalu terlihat saat PPN relevan ([PPN-DISCLAIMER.md](../legal/PPN-DISCLAIMER.md)).
5. **Server-first, form-native** — aksi utama via HTML form + SSR; interaksi client minimal (selaras arsitektur web).
6. **Mobile usable, desktop first** — freelancer sering di laptop; layout responsif wajib, native app tidak.

---

## 3. Persona & skenario desain

| Persona | Kebutuhan UI | Implikasi |
|---------|--------------|-----------|
| Freelancer kreatif/teknis | Invoice cepat setelah milestone | CTA “Buat invoice”, default due +30 hari |
| Konsultan part-time | Klien berulang, data konsisten | CRUD klien, pick-list di editor |
| Klien penerima (FR-06) | Tanpa akun, percaya dokumen | Public view bersih, PDF, status bayar |

**Time-to-first-invoice (sent):** alur register → profil minimal → 1 klien → 1 draft → kirim ≤ **15 menit median** (target produk).

---

## 4. Arsitektur informasi & navigasi

Backbone: **Setup → Client → Invoice → Send → Collect → Report** ([USER-STORY-MAP.md](../brd/USER-STORY-MAP.md)).

### 4.1 Navigasi utama (authenticated)

| Label | Route | FR |
|-------|-------|-----|
| Dashboard | `/` | FR-08 |
| Klien | `/clients` | FR-01 |
| Invoice | `/invoices` | FR-08 list · FR-02–07 |
| Pengaturan | `/settings` | Profil bisnis |

**Pola:** header horizontal + label section aktif (pill `bg-slate-100` = token `bg-accent`, `aria-current="page"`). Logo/wordmark **Invoicing** + subcopy opsional “Freelancer Indonesia”.

### 4.2 Rute tanpa nav app

| Route | Aktor | Catatan |
|-------|-------|---------|
| `/login`, `/register` | Freelancer | Tanpa sidebar; fokus form |
| `/i/:token` | Klien | Tanpa kontrol edit; footer legal ringkas |

### 4.3 Hierarki layar MVP (7 layar)

| # | Layar | Route | Wireframe | Prototype |
|---|--------|-------|-----------|-----------|
| 1 | Dashboard | `/` | [WIREFRAMES §1](../brd/WIREFRAMES.md#1-dashboard-) | `screen-dashboard.html` |
| 2 | Klien | `/clients`, `/clients/:id` | [WIREFRAMES §2](../brd/WIREFRAMES.md#2-client-list-clients) | `screen-clients.html`, `screen-client-detail.html` |
| 3 | Invoice editor | `/invoices/new`, `/invoices/:id/edit` | [WIREFRAMES §3](../brd/WIREFRAMES.md#3-invoice-editor-invoicesnew--invoicesidedit) | `screen-invoice-editor.html` |
| 4 | Detail & preview | `/invoices/:id` | [WIREFRAMES §4](../brd/WIREFRAMES.md#4-detail--preview-invoicesid) | `screen-invoice-preview.html`, `screen-invoice-send.html`, `screen-invoice-locked.html` |
| 5 | Public view | `/i/:token` | [WIREFRAMES §5](../brd/WIREFRAMES.md#5-public-view-itoken) | `screen-public.html`, `screen-pdf-states.html` |
| 6 | Settings | `/settings` | [WIREFRAMES §6](../brd/WIREFRAMES.md#6-settings-settings) | `screen-settings.html` |
| 7 | Daftar invoice | `/invoices` | [WIREFRAMES §7](../brd/WIREFRAMES.md#7-daftar-invoice-invoices) | `screen-invoice-list.html` |

Auth (`/login`, `/register`): `screen-auth.html`.

---

## 5. Identitas visual

### 5.1 Warna

| Peran | Hex / Tailwind | Token semantik (§13.1) | Penggunaan |
|-------|----------------|------------------------|------------|
| Brand primary | `#2563eb` · `blue-600` | `--primary` | CTA utama, link aktif |
| Brand subtle | `blue-600` on `white` | `text-primary` | Label “Invoicing” |
| Surface page | `slate-50` | `--page` | Background body |
| Surface card | `white` + `border-slate-200` | `--card`, `--border` | Kartu metrik, form, tabel |
| Text primary | `slate-900` | `--foreground` | Judul, angka penting |
| Text secondary | `slate-600` / `slate-500` | `--muted-foreground` | Meta, hint |
| Success | `emerald-600` / `emerald-700` | `--success` | **Lunas**, **Tandai lunas** |
| Warning | `amber-600` | `--warning` | **Jatuh tempo** (overdue) |
| Danger | `red-600` / `red-700` | `--destructive` | Error form, aksi destruktif |

CSS saat ini: `--color-brand: #2563eb` di `apps/web/app/styles/app.css`; target = blok token §13.1 (gap G-07).

### 5.2 Tipografi

| Elemen | Gaya (Tailwind) |
|--------|-----------------|
| Page title | `text-xl font-bold text-slate-900` |
| Section title | `text-lg font-semibold` |
| Label form | `text-sm` + input block |
| Meta / caption | `text-xs text-slate-500` |
| Angka metrik | `text-2xl font-bold` |
| Nav item | `text-sm font-medium` |

**Font:** system UI stack (default Tailwind); tidak custom webfont MVP.

### 5.3 Spacing & layout

- **Container:** `.page-container` — `max-w-5xl`, horizontal padding `px-4 sm:px-6 lg:px-8`.
- **Kartu:** `rounded-xl` atau `rounded-2xl`, `border`, `shadow-sm` untuk elevation ringan.
- **Grid metrik dashboard:** `sm:grid-cols-2 lg:grid-cols-3/4` sesuai wireframe.
- **Whitespace:** section `space-y-8` di main; form `space-y-3`.

### 5.4 Radius & border

Radius dasar `--radius: 0.625rem`; resep canonical di §13.2. Setara utility:

- Input (`.input`): `h-9 rounded-md border border-input px-3 text-sm`
- Primary button (`.btn-default`): `h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground`
- Secondary (`.btn-outline` / `.btn-secondary`): `h-9 rounded-md border px-4 text-sm`
- Nav pill (`.nav-link`): `h-8 rounded-full px-3 text-sm font-medium`
- Kartu (`.card`): `rounded-xl border shadow-sm`

---

## 6. Komponen & pola UI

### 6.1 Tombol (hierarki)

| Level | Contoh copy | Kapan |
|-------|-------------|--------|
| Primary | Simpan, Kirim ke klien, Buat akun | Satu aksi utama per section |
| Secondary | Preview, Unduh PDF, Batal | Alternatif non-destruktif |
| Destructive | Nonaktifkan klien, Hapus draft | Konfirmasi implisit atau eksplisit |
| Ghost / link | Edit, Kembali | Navigasi dalam alur |

**FR-05:** “Kirim ke klien” disabled jika draft invalid atau klien tanpa email (wireframe §3).

### 6.2 Form

- Label di atas field; `*` untuk wajib (Nama klien, Email klien, Nama legal).
- Error inline di bawah field (`text-sm text-red-600`) — login/register pattern.
- Checkbox PPN: label “PPN 11%” + disclaimer di bawah ([§8](#8-compliance--copy-legal)).
- Tanggal: format tampilan **Indonesia** (contoh: `29 Sep 2026`).

### 6.3 Tabel & list

- Header row `text-slate-500`, border bawah.
- Row hover opsional `hover:bg-slate-50`.
- Kolom wajib dashboard & daftar invoice: No., Klien, Jumlah (IDR), Status, Due, Aksi. Draft menampilkan “(auto saat kirim)” di kolom No.
- Aksi baris invoice: menu `···` → Lihat · Unduh PDF · **Tandai lunas** (FR-07); draft → Edit · Hapus draft (BR-06).
- Aksi baris klien: **Edit**, **Nonaktifkan** / Aktifkan.

### 6.4 Status invoice (badge)

| Status | Warna suggested | Copy UI |
|--------|-----------------|---------|
| `draft` | `slate-100` / slate text | Draft |
| `sent` | `blue-50` / blue text | Terkirim |
| `overdue` | `amber-50` / amber text | Jatuh tempo |
| `paid` | `emerald-50` / emerald text | Lunas |
| `cancelled` | `slate-100` strikethrough optional | Dibatalkan |

Public view (klien): **Menunggu pembayaran** / **Lunas** — bahasa plain, bukan enum internal.

### 6.5 Kartu metrik (dashboard)

- **Outstanding (IDR)** — angka paling menonjol (FR-08).
- **Jatuh tempo** — count invoice `sent`/`overdue` mendekati due.
- **Draft** — count draft (opsional wireframe).

---

## 7. Format & bahasa konten

| Aspek | Aturan |
|-------|--------|
| Bahasa UI | **Bahasa Indonesia** utama MVP |
| Mata uang | **IDR** — `Intl` / helper domain; titik ribuan Indonesia (Rp 1.110.000) |
| Nomor invoice | `INV-{YYYY}-{SEQ}` default; tampilkan “(auto saat kirim)” di draft |
| Email | Validasi jelas; pesan error “Email klien wajib untuk kirim” |
| Tone | Profesional, singkat, hindari jargon ERP |

**Jangan** (marketing MVP): klaim e-Faktur / DJP ([PPN-DISCLAIMER.md](../legal/PPN-DISCLAIMER.md) § Marketing).

---

## 8. Compliance & copy legal

### 8.1 PPN (FR-03) — wajib di editor invoice

**Teks singkat** (di bawah toggle PPN, `text-xs text-slate-500`):

> PPN hanya kalkulator. Bukan e-Faktur DJP.

Link opsional: “Pelajari lebih lanjut” → `/help/ppn` atau modal (post-MVP).

**Teks panjang:** [PPN-DISCLAIMER.md](../legal/PPN-DISCLAIMER.md).

### 8.2 PDF

Jika PPN aktif, footer PDF boleh memuat kalimat informasi ([PPN-DISCLAIMER.md](../legal/PPN-DISCLAIMER.md) § PDF footer).

### 8.3 Settings & public footer

- Settings: link [Syarat](../legal/TERMS.md) · [Privasi](../legal/PRIVACY.md).
- Public `/i/:token`: “Powered by Invoicing · Privasi” (wireframe §5).

---

## 9. Panduan per layar (checklist desain)

### 9.1 Dashboard

- [ ] Outstanding IDR + filter status + list invoice
- [ ] CTA **+ Invoice** visible above fold (desktop)
- [ ] Aksi **Tandai lunas** dari detail/barisan

### 9.2 Klien

- [ ] List + **Tambah klien** (dialog: Nama*, Email*, Alamat, Catatan)
- [ ] Search nama/email (wireframe §2; kode: gap G-10)
- [ ] Email visible; badge “Email kosong” dan indikator nonaktif

### 9.3 Invoice editor

- [ ] Line items ≥1; subtotal/PPN/total real-time atau setelah simpan
- [ ] Immutability: sent → no edit lines (BR-01) — UI block + pesan jelas; jalur “Batalkan & buat baru” (gap G-01)
- [ ] Nomor “(auto INV-{YYYY}-{SEQ} saat kirim)”; due default dari Settings (FR-10)
- [ ] Disclaimer PPN visible

### 9.4 Detail & preview (FR-04) — `/invoices/:id`

- [ ] WYSIWYG dengan PDF: logo, nomor, tanggal, due, rekening, items, total
- [ ] **Unduh PDF** secondary tidak mengubah status
- [ ] Sent: salin tautan publik; **Cabut tautan** (BR-05, UI web: gap G-02)

### 9.5 Public view (FR-06)

- [ ] Read-only; noindex meta (implementasi FE/SEO)
- [ ] **Unduh PDF** untuk klien
- [ ] Tanpa nav authenticated

### 9.6 Settings

- [ ] Profil bisnis MVP: legal name, alamat, NPWP opsional, logo, rekening, footer
- [ ] Default due days & format nomor (wireframe; format custom belum dipakai kode: gap G-03)

### 9.7 Daftar invoice — `/invoices`

- [ ] Filter status (Semua · Draft · Terkirim · Jatuh tempo · Lunas)
- [ ] Kolom §6.3; row action sesuai status
- [ ] Export CSV (FR-11) & Duplikat (FR-09) hanya di prototype — Should, bukan MVP

---

## 10. Feedback & edge cases

| Situasi | Pola UI |
|---------|---------|
| Email gagal (FR-05) | Error jelas; status tetap draft, nomor belum dipakai |
| Kirim sukses | Redirect ke detail; status `sent` + timestamp |
| Token publik revoked | Halaman 404 friendly “Link tidak valid atau dicabut” |
| Loading SSR | Prefer full page SSR; skeleton optional post-MVP |
| Empty state | “Belum ada klien” + CTA tambah |

---

## 11. Aksesibilitas (MVP baseline)

- Kontras teks minimal WCAG AA untuk body & CTA (`slate-900` on `white`, `white` on `blue-600`).
- Input: `<label>` terasosiasi; `required` + `type="email"`.
- Fokus keyboard: jangan `outline-none` tanpa substitusi.
- Status tidak hanya warna: selalu ada **label teks** (Draft, Lunas, …).
- Bahasa halaman: `<html lang="id">` untuk app Indonesia.

---

## 12. Pemetaan FR → elemen desain

| FR | Elemen desain utama | Prototype |
|----|---------------------|-----------|
| FR-01 | Client list, form, deactivate | `screen-clients`, `screen-client-detail` |
| FR-02 | Invoice editor, line table | `screen-invoice-editor` |
| FR-03 | Toggle PPN + disclaimer + total breakdown | `screen-invoice-editor` |
| FR-04 | Preview card, Unduh PDF | `screen-invoice-preview`, `screen-pdf-states` |
| FR-05 | Kirim ke klien, konfirmasi/error | `screen-invoice-send` |
| FR-06 | Public layout, status klien | `screen-public`, `screen-pdf-states` |
| FR-07 | Tandai lunas (detail/dashboard) | `screen-invoice-locked`, `screen-dashboard` |
| FR-08 | Metrik outstanding, filter, tabel | `screen-dashboard`, `screen-invoice-list` |

Traceability teknis + status implementasi: [ARCHITECTURE-ALIGNMENT.md](../brd/ARCHITECTURE-ALIGNMENT.md) §3.

---

## 13. Prototype HTML

Preview interaktif design system & layar BRD (v2 — Tailwind CSS v4 + konvensi shadcn/ui):

**[../../design/prototype/index.html](../../design/prototype/index.html)** · [README](../../design/prototype/README.md)

Build: `npm run design:css` (sumber `docs/design/prototype/src/tailwind.css` → `assets/ui.css`).

### 13.1 Token semantik (shadcn/ui)

Token didefinisikan sebagai CSS variable di `:root` / `.dark`, lalu dipetakan ke utility lewat `@theme inline` (`bg-primary`, `text-muted-foreground`, `border-border`, …). Nilai light mode = palet §5.1.

| Token | Light | Dark | Pemakaian |
|-------|-------|------|-----------|
| `--background` / `--foreground` | `#ffffff` / `#0f172a` | `#020617` / `#f8fafc` | Permukaan & teks utama |
| `--page` | `#f8fafc` (slate-50) | `#0b1120` | Kanvas body |
| `--card`, `--popover` | `#ffffff` | `#0f172a` | Kartu, dropdown, dialog |
| `--primary` | `#2563eb` (blue-600) | `#3b82f6` | CTA, link aktif, ring fokus |
| `--secondary`, `--muted`, `--accent` | `#f1f5f9` | `#1e293b` | Tombol sekunder, hover, latar tabs |
| `--muted-foreground` | `#64748b` | `#94a3b8` | Meta, hint |
| `--success` / `--warning` / `--destructive` | emerald-600 / amber-600 / red-600 | emerald-500 / amber-500 / red-500 | Lunas / jatuh tempo / error |
| `--border` / `--input` / `--ring` | slate-200 / slate-300 / blue-600 | slate-800 / slate-700 / blue-500 | Garis, kontrol form, fokus |
| `--radius` | `0.625rem` | — | `rounded-md/lg/xl` diturunkan dari sini |

### 13.2 Resep komponen

Nama class mengikuti komponen shadcn/ui agar mudah dipetakan: `.btn` + `btn-{default|secondary|outline|ghost|link|destructive|success}` + `btn-{sm|lg|icon}`; `.input`, `.select`, `.textarea`, `.field`, `.switch-track`; `.card-{header|title|description|content|footer}`; `.badge-{draft|sent|overdue|paid|cancelled}`; `.alert-{info|success|warning|destructive}`; `.table`, `.tabs-list/trigger`, `.dropdown-*`, `.dialog`, `.sheet`, `.toast`, `.skeleton`.

### 13.3 Batasan

- `@invoicing/web` memakai **Remix 3 UI, bukan React** — komponen React shadcn tidak dipakai langsung; yang diadopsi adalah token + resep class. Interaksi memakai elemen native (`<details>`, `<dialog>`) agar tetap berfungsi dengan progressive enhancement.
- **Tailwind UI (Tailwind Plus)** berlisensi berbayar — prototype hanya mengikuti *pola* layout-nya (app shell, page heading, stats, stacked list); markup ditulis sendiri.

## 14. Implementasi referensi (code)

| Aspek | Lokasi |
|-------|--------|
| Tailwind entry | `apps/web/app/styles/app.css` |
| Layout shell | `apps/web/app/ui/layout.tsx` |
| Token brand | `--color-brand` di `@layer base` |
| Wireframe routes | [TECHNICAL-DESIGN.md](../engineering/TECHNICAL-DESIGN.md) §3 |

**Stack UI:** [TECHNOLOGY-STACK.md](../engineering/TECHNOLOGY-STACK.md) §2.2 — Tailwind v4 utility-first + token semantik; bukan komponen library eksternal MVP. Status adopsi di app (token, nav aktif dinamis, wordmark): gap G-07. Untuk adopsi token/resep shadcn di `app.css`, salin blok `:root`, `.dark`, `@theme inline`, dan `@layer components` dari `docs/design/prototype/src/tailwind.css` (§13).

---

## 15. Evolusi (post-MVP)

| Item | Prioritas BRD | Catatan desain |
|------|---------------|----------------|
| Dark preview | Could FR-12 | Token `.dark` sudah ada di prototype (§13.1) |
| Label PDF ID/EN | Could FR-13 | Copy [PPN-DISCLAIMER EN] |
| Duplicate invoice | Should FR-09 | Aksi secondary di detail |
| Export CSV | Should FR-11 | Dialog di daftar invoice |
| Default due/footer | Should FR-10 | **Sudah implemented** — Settings §9.6 |

---

## 16. Review & maintenance

- Ubah requirement UI → update [MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) + [WIREFRAMES.md](../brd/WIREFRAMES.md), lalu sinkronkan §9–§12 dokumen ini, prototype `screen-*.html`, dan [ARCHITECTURE-ALIGNMENT.md](../brd/ARCHITECTURE-ALIGNMENT.md) §3.
- Perubahan brand/color → update §5.1 dan `app.css`.
- Sign-off desain MVP: Product + Engineering (referensi [MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) § Sign-off).

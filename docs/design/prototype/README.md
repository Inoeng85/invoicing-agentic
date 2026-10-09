# UI prototype (HTML) — v2 · Tailwind CSS v4 + shadcn/ui

Prototype statis interaktif untuk design system **PuraPuraLupa (Komando)** — selaras [invoicing/design/design-guidelines.md](../design-guidelines.md) dan [invoicing/brd/wireframes.md](../../product/brd/wireframes.md).

- **Tailwind CSS v4** (CLI lokal, tanpa CDN) untuk utility & build.
- **shadcn/ui** sebagai konvensi token (`--background`, `--primary`, `--muted`, …) dan resep komponen (`.btn-{variant}`, `.card-*`, `.badge-*`, `.dialog`, …).
- **Pola Tailwind UI** (app shell, page heading, stats, stacked list) — markup ditulis ulang, bukan disalin dari Tailwind Plus (berlisensi berbayar).
- Ikon: subset **Lucide** (ISC), sama dengan ikon default shadcn.

## Cara buka

```sh
cd Agentic
npm run design:css          # build assets/ui.css (wajib setelah ubah HTML / src)
cd docs/design/prototype
python3 -m http.server 8765 # http://localhost:8765
```

Saat mengedit: `npm run design:css:watch`.

## Struktur

| File | Isi |
|------|-----|
| `src/tailwind.css` | Sumber: token light/dark, `@theme inline`, resep komponen `@layer components` |
| `assets/ui.css` | Hasil build (minified) — jangan edit manual |
| `assets/prototype.js` | Ikon, nav prototipe, dark mode, tabs, dialog, dropdown, toast, kalkulasi invoice |
| `index.html` | Overview & peta layar |
| `color-palette.html` | Token semantik, skala, status, 4 opsi aksen, kontras |
| `typography.html` | Skala tipe, angka IDR, pola teks, 3 opsi font |
| `buttons.html` | 7 varian, ukuran, state, group/split, aksi per status, 3 opsi bentuk |
| `forms.html` | Kontrol, validasi, form klien, profil bisnis, 3 opsi layout (tabs) |
| `header.html` | 6 opsi shell: stacked, sidebar, page heading, brand gelap, publik/auth, editor |
| `footer.html` | App, publik (disclaimer PPN), marketing, sticky action bar |
| `menu.html` | Top nav, sidebar, sheet mobile, dropdown, tabs, breadcrumb, pagination |
| `components.html` | Stats, badge, alert, data table, dialog, toast, tooltip, empty/skeleton, timeline |
| `screen-auth.html` | Masuk / daftar (split layout) |
| `screen-dashboard.html` | FR-08 — metrik, filter status, aksi baris |
| `screen-clients.html` | FR-01 — kartu/tabel, pencarian, dialog tambah |
| `screen-invoice-editor.html` | FR-02, FR-03 — baris item dinamis, PPN 11% live |
| `screen-invoice-preview.html` | FR-04, FR-05, FR-07 — dokumen, kirim ulang, tandai lunas, tautan publik (BR-05) |
| `screen-public.html` | FR-06 — tampilan klien tanpa login |
| `screen-settings.html` | Profil bisnis, default invoice & pajak, akun |
| `screen-invoice-list.html` | FR-08, FR-09, FR-11, BR-06 — daftar lengkap, filter status/periode, duplikat, ekspor CSV, arsip |
| `screen-client-detail.html` | FR-01 — kontak, riwayat invoice, state email kosong & nonaktif |
| `screen-invoice-send.html` | FR-05, BR-02 — pratinjau email + state siap / tanpa email / gagal / berhasil |
| `screen-invoice-locked.html` | BR-01, BR-02, FR-07, FR-09 — invoice terkirim read-only, batalkan & buat pengganti |
| `screen-pdf-states.html` | FR-04, FR-06, FR-13, BR-05 — PDF A4 ID/EN, publik lunas, link dicabut |

## Konvensi data-attribute (prototype.js)

| Attribute | Perilaku |
|-----------|----------|
| `body[data-shell="docs"\|"screen"]` | Sisipkan header dokumentasi / toolbar navigasi layar |
| `i[data-icon="name"]` | Diganti SVG Lucide |
| `[data-theme-toggle]` | Toggle `.dark` (disimpan di `localStorage`) |
| `[role=tablist]` + `[role=tab][aria-controls]` | Tabs; `data-filter-target` + `data-filter` untuk filter baris `[data-status]` |
| `[data-dialog-open="id"]`, `[data-dialog-close]` | Native `<dialog>` (`.dialog`, `.sheet`) |
| `[data-toast="pesan"]`, `form[data-demo]` | Toast demo |
| `[data-copy="teks"]` | Salin ke clipboard |
| `[data-search="id"]` | Filter `[data-row]` berdasarkan teks |
| `[data-invoice]` | Kalkulasi: `[data-qty]`, `[data-price]`, `[data-discount]` (rupiah), `[data-ppn-toggle]` → `[data-subtotal]`, `[data-ppn]`, `[data-total]` |

| `[data-when-tab="panelId"]`, `[data-unless-tab="panelId"]` | Tampil / sembunyi mengikuti tab yang aktif |

Kalkulasi mengikuti `computeInvoiceTotals` di `@invoicing/domain`: jumlah baris = `max(0, qty × harga − diskon)`, PPN = `round(subtotal × 0.11)` (BR-04).

## Keselarasan dengan DESIGN-GUIDELINES

| Aturan | Diterapkan di |
|--------|---------------|
| §4.1 Navigasi: Dashboard · Klien · Invoice · Pengaturan, aktif = pill | Semua `screen-*.html`, `header.html`, `menu.html` |
| §5.2 Skala tipe: page title `text-xl font-bold`, section `text-lg font-semibold`, metrik `text-2xl font-bold`, meta `text-xs` muted | `typography.html`, semua layar |
| §5.3 Layout: `max-w-5xl`, `px-4 sm:px-6 lg:px-8`, `space-y-8` | Semua layar aplikasi |
| §6.4 Label status: Draft / Terkirim / Jatuh tempo / Lunas / Dibatalkan; nomor draft "(auto saat kirim)" | Dashboard, daftar invoice, editor |
| §9.3 + §8.1 Editor satu kolom: Klien & tanggal → Line items → PPN + disclaimer → Catatan footer → [Unduh PDF] [Kirim ke klien] | `screen-invoice-editor.html` |
| §9.2 Klien: tabel + cari, dialog tambah, nonaktifkan; "Email klien wajib untuk kirim" | `screen-clients.html`, `screen-invoice-send.html` |
| §9.6 + §8.3 Pengaturan: satu formulir (Profil bisnis, Invoice, Akun) | `screen-settings.html` |
| §7 + §8.3 Copy: "Unduh PDF", "Preview", tanggal "29 Sep 2026", "Powered by PuraPuraLupa · Privasi" | Semua halaman |

## Implementasi produk

`@invoicing/web` memakai Remix 3 UI (bukan React), jadi komponen React shadcn **tidak** dipakai langsung. Yang dipindahkan:

1. Blok `:root` / `.dark` / `@theme inline` dari `src/tailwind.css` → `apps/web/app/styles/app.css`.
2. Resep `@layer components` (atau ekstrak sebagai helper class string per varian).
3. Markup layar sebagai referensi komponen `Handle<Props>` di `apps/web/app/ui/`.

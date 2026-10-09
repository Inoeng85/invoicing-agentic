# M05 — Layar, FR, & aksesibilitas

**Module design** · sumber [DESIGN-GUIDELINES](../design-guidelines.md) §9–§12\
**5 contoh halaman:** [examples/](../examples/index.html)

## Pemetaan FR → contoh

| Contoh | FR / BR | Route app | Prototype |
|--------|---------|-----------|-----------|
| [01 Dashboard & collect](../examples/01-dashboard-collect.html) | FR-07, FR-08, BR-03 | `/`, `/invoices` | `screen-dashboard`, `screen-invoice-list` |
| [02 Klien](../examples/02-klien.html) | FR-01 | `/clients` | `screen-clients` |
| [03 Invoice & PPN](../examples/03-invoice-ppn.html) | FR-02, FR-03, BR-01, BR-04 | `/invoices/new` | `screen-invoice-editor` |
| [04 Kirim, PDF, publik](../examples/04-kirim-pdf-publik.html) | FR-04–06, BR-02, BR-05 | `/invoices/:id`, `/i/:token` | `screen-invoice-send`, `screen-public` |
| [05 Auth & pengaturan](../examples/05-auth-pengaturan.html) | Profil, FR-10 | `/login`, `/settings` | `screen-auth`, `screen-settings` |

## Checklist per cluster

**01** Outstanding IDR, filter status, CTA Invoice baru, Tandai lunas.\
**02** List + Tambah klien (Nama*, Email*), search, badge email kosong.\
**03** ≥1 line item, toggle PPN + disclaimer, nomor auto, totals.\
**04** Preview PDF, kirim (gagal → tetap draft), public read-only, cabut tautan.\
**05** Form auth tanpa nav app; settings: legal name, rekening, due default.

## A11y baseline

- `html lang="id"`
- Kontras WCAG AA
- `<label>` + `required` + `type="email"`
- Fokus terlihat (ring token)
- Status selalu berlabel teks, bukan hanya warna

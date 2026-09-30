# Design Guidelines — Invoicing Freelancer (Indonesia)

**Versi:** 2.0 · **Tanggal:** 2026-09-30  
**Bentuk:** **5 module** + **5 contoh halaman** (feature BRD)

Isi guideline dipaket per module. Prototype hi-fi tetap di [../../design/prototype/](../../design/prototype/index.html).

| Module | Isi |
|--------|-----|
| [M01 Prinsip & persona](./modules/M01-prinsip-persona.md) | Tujuan, 6 prinsip, persona |
| [M02 Navigasi & shell](./modules/M02-navigasi-shell.md) | Top nav, auth, publik, editor |
| [M03 Token & komponen](./modules/M03-token-komponen.md) | Warna, resep `.btn` / `.badge` / `.card` |
| [M04 Konten & compliance](./modules/M04-konten-compliance.md) | IDR, PPN, legal, edge case |
| [M05 Layar & a11y](./modules/M05-layar-a11y.md) | FR → contoh + checklist |

Indeks module: [modules/README.md](./modules/README.md)

---

## 5 contoh halaman (feature BRD)

Buka [examples/index.html](./examples/index.html) (CSS prototype).

| # | Halaman | FR / BR | Modules |
|---|---------|---------|---------|
| 01 | [Dashboard & collect](./examples/01-dashboard-collect.html) | FR-07, FR-08, BR-03 | M01 M02 M03 |
| 02 | [Klien](./examples/02-klien.html) | FR-01 | M02 M03 |
| 03 | [Invoice & PPN](./examples/03-invoice-ppn.html) | FR-02, FR-03, BR-01, BR-04 | M03 M04 |
| 04 | [Kirim, PDF, publik](./examples/04-kirim-pdf-publik.html) | FR-04–06, BR-02, BR-05 | M04 |
| 05 | [Auth & pengaturan](./examples/05-auth-pengaturan.html) | FR-10, profil | M02 M04 |

Implementasi app: `@invoicing/web` · token: `packages/design-tokens/` · requirement: [../brd/MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md)

---

## Pemetaan FR → desain (ringkas)

| FR | Module | Contoh | Prototype lengkap |
|----|--------|--------|-------------------|
| FR-01 | M02 M03 | 02 | `screen-clients.html` |
| FR-02 FR-03 | M03 M04 | 03 | `screen-invoice-editor.html` |
| FR-04 FR-05 FR-06 | M04 | 04 | `screen-invoice-send.html`, `screen-public.html` |
| FR-07 FR-08 | M01–M03 | 01 | `screen-dashboard.html`, `screen-invoice-list.html` |

Keputusan D-xx: [ARCHITECTURE-ALIGNMENT.md](../brd/ARCHITECTURE-ALIGNMENT.md) §2.

---

## Implementasi referensi

| Aspek | Lokasi |
|-------|--------|
| Token + resep | `packages/design-tokens/tokens.css`, `components.css` |
| App shell | `apps/web/app/ui/layout.tsx` |
| Tailwind app | `apps/web/app/styles/app.css` |
| Prototype build | `npm run design:css` |

---

## Review

Ubah FR/BR di [MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md), lalu sinkronkan module terkait, 5 contoh, dan `screen-*.html`.

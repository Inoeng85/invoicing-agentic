---
name: invoicing-design
description: >-
  Menulis Design Guidelines (token, navigasi, layar MVP, copy PPN) selaras BRD
  dan wireframes. Gunakan saat user minta design system, UI guidelines,
  design-guidelines.md, prototype index, atau pola Tailwind/Remix UI.
---

# Skill — Design Guidelines

## Kapan dipakai

- Buat `design/design-guidelines.md`
- Selaraskan wireframes (`brd/wireframes.md`) dengan token & routes
- Definisikan 7 layar MVP + public view

## Input wajib

1. BRD + USER-STORY-MAP + WIREFRAMES (atau draft layar)
2. Keputusan: light-only vs dark, bahasa UI, format IDR
3. Route list dari ARCHITECTURE §12 (atau draft)

## Output

1. Salin [template.md.tmpl](./template.md.tmpl) → `docs/design/design-guidelines.md`
2. Isi navigasi, hierarki layar, token §13, komponen pola
3. Cross-link prototype HTML paths di `docs/design/prototype/`
4. Tambah keputusan D-xx (label status, token, dark) di ARCHITECTURE-ALIGNMENT

## Aturan

- **Server-first:** form HTML, minim client JS (selaras Remix web)
- Disclaimer PPN visible pada editor, preview, public, PDF
- Status invoice: label konsisten dengan domain enum
- Token semantik (bukan hard-code hex di prose) — refer `packages/design-tokens/` jika ada
- Wireframe = struktur; guideline = prinsip + token + pola interaksi
- A11y: kontras, focus, `aria-current` nav

## Checklist

- [ ] Tujuan & audiens
- [ ] Prinsip desain (5–7 bullet)
- [ ] Persona → implikasi UI
- [ ] Nav authenticated + public routes
- [ ] Tabel 7 layar MVP + wireframe links
- [ ] Token / typography / spacing
- [ ] Pola form, table, empty state, error
- [ ] Copy & compliance (PPN)
- [ ] Out of scope (dark app, bilingual PDF, dll.)

## Referensi

- [docs/design/design-guidelines.md](../../../docs/design/design-guidelines.md)
- [docs/product/brd/wireframes.md](../../../docs/product/brd/wireframes.md)

---
name: invoicing-brd
description: >-
  Menulis atau memperbarui dokumen BRD (Business Requirements Document) untuk
  produk invoicing/freelancer ala Agentic. Gunakan saat user minta BRD, FR/BR,
  MoSCoW, scope lock, user stories, wireframe index, atau paket requirement bisnis.
---

# Skill — BRD (Invoicing)

## Kapan dipakai

- Buat BRD baru atau revisi major
- Turunkan FR/BR dari ide produk
- Susun indeks paket `brd/` (scope lock, UAT, wireframes)

## Input wajib (kumpulkan dulu)

1. Nama produk, segmen, mata uang, locale
2. Persona utama (min. freelancer + penerima invoice)
3. Must/Should/Could/Won't (MoSCoW)
4. Metrik MVP (activation, time-to-value)
5. Non-goals eksplisit

## Output

1. Salin [template.md.tmpl](template.md.tmpl) → `docs/product/BRD.md` (atau path yang diminta user)
2. Ganti semua placeholder `{{...}}`
3. Buat/arahkan artefak turunan di `docs/product/brd/` bila scope MVP:
   - `MVP-SCOPE-LOCK.md`, `PRODUCT-BRIEF.md`, `USER-STORIES-UAT.md`, `WIREFRAMES.md`
4. Tambah baris indeks di `BRD-DEFINITION-OF-DONE.md` jika paket baru

## Aturan penulisan

- **Bahasa:** Indonesia untuk produk ID; ID requirement tetap `FR-xx`, `BR-xx`
- **Must** = gate release; jangan campur dengan platform PRD (PS-xx)
- Setiap FR Must punya acceptance ringkas + link ke alignment §3 nanti
- PPN / compliance: arahkan ke `legal/PPN-DISCLAIMER.md`, bukan e-Faktur
- Cross-link wajib: ARCHITECTURE, TECHNOLOGY-STACK, DESIGN-GUIDELINES (placeholder path jika greenfield)

## Checklist sebelum selesai

- [ ] Executive summary + north star
- [ ] FR Must tabel + Should/Could/Won't
- [ ] BR-01…BR-06 (atau setara) di scope lock
- [ ] UX artefacts table (story map, wireframes, UAT, design)
- [ ] Versi, tanggal, status dokumen
- [ ] Tidak duplikasi detail teknis (cukup link ke architecture/stack)

## Referensi canonical (repo ini)

- [docs/product/BRD.md](../../../product/BRD.md)
- [docs/product/brd/MVP-SCOPE-LOCK.md](../../../product/brd/MVP-SCOPE-LOCK.md)

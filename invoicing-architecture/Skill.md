---
name: invoicing-architecture
description: >-
  Menulis dokumen System Architecture (C4, domain, alur FR/BR, keamanan) selaras
  BRD untuk monorepo invoicing. Gunakan saat user minta arsitektur sistem,
  diagram alur, pemetaan modul, trust boundary, atau ARCHITECTURE.md.
---

# Skill — System Architecture

## Kapan dipakai

- Buat `ARCHITECTURE.md` baru atau major revision
- Derive struktur dari BRD yang sudah locked
- Jelaskan web vs API vs domain vs database

## Input wajib

1. Link atau ringkasan [BRD](../docs/invoicing/BRD.md) / MVP-SCOPE-LOCK
2. Keputusan deploy (monorepo, tanpa Docker, SQLite, dll.)
3. Daftar FR Must yang perlu sequence diagram

## Output

1. Salin [template.md.tmpl](./template.md.tmpl) → `docs/invoicing/ARCHITECTURE.md`
2. Isi placeholder; tambah mermaid hanya untuk alur non-trivial (auth, send invoice, public link)
3. Update atau buat `brd/ARCHITECTURE-ALIGNMENT.md` (D-xx keputusan, G-xx gap)
4. Cross-link `engineering/TECHNICAL-DESIGN.md`, `API.md`, `STACK-INTEGRATION.md`

## Aturan

- **Domain logic** hanya di `@invoicing/domain`; controllers tipis
- Setiap FR Must map ke § modul (web route, API route, domain function)
- Keamanan: session freelancer vs public token; jangan rinci env setup (→ platform PRD)
- Stack detail ringkas di §3; deep dive → TECHNOLOGY-STACK.md
- Prinsip numerik (7±2) — konsisten dengan repo referensi

## Checklist

- [ ] Konteks produk tabel §2
- [ ] Stack ringkas + link stack doc
- [ ] Prinsip arsitektur
- [ ] C4 L1 (mermaid)
- [ ] Container / komponen monorepo
- [ ] Pemetaan FR → modul
- [ ] Sequence: register, send invoice, public view (minimal)
- [ ] Keamanan & data retention ringkas
- [ ] Out of scope dokumen jelas

## Referensi

- [docs/invoicing/ARCHITECTURE.md](../docs/invoicing/ARCHITECTURE.md)

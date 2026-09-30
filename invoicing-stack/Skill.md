---
name: invoicing-stack
description: >-
  Menulis dokumen Technology Stack dan integrasi dev (TECHNOLOGY-STACK.md,
  STACK-INTEGRATION) untuk monorepo invoicing Node/Remix/Prisma. Gunakan saat
  user minta stack teknologi, env vars, diagram lapisan, trade-offs, atau
  pemetaan FR ke teknologi.
---

# Skill — Technology Stack

## Kapan dipakai

- Buat atau revisi `engineering/TECHNOLOGY-STACK.md`
- Dokumentasi `STACK-INTEGRATION.md` (setup, verify, scripts)
- Keputusan teknologi baru (harus selaras ARCHITECTURE)

## Input wajib

1. ARCHITECTURE.md §3 (stack ringkas sudah disetujui)
2. Constraint: Node version, monorepo, DB, tanpa Docker (jika produk Agentic)
3. Daftar integrasi (PDF, email, auth)

## Output

1. Salin [template.md.tmpl](./template.md.tmpl) → `docs/invoicing/engineering/TECHNOLOGY-STACK.md`
2. Isi tabel ringkasan + minimal 1 diagram mermaid (lapisan + monorepo)
3. Section env vars (web, api, database) selaras `.env.example`
4. Update `STACK-INTEGRATION.md` jika workflow dev berubah
5. Tambah baris D-xx di ARCHITECTURE-ALIGNMENT jika keputusan canonical baru

## Aturan

- Setiap baris stack map ke FR atau constraint BRD bila relevan
- Bedakan **dev** vs **staging/prod** (SQLite file, volume, secrets)
- Jangan duplikasi API endpoint list (→ API.md)
- Versi package: pin eksplisit, hindari `latest`
- Won't stack = explicit (e-Faktur gateway, dll.)

## Checklist

- [ ] Ringkasan eksekutif tabel §1
- [ ] Diagram stack §1.1
- [ ] UI / API / domain / data subsections
- [ ] Auth, email, PDF
- [ ] Env matrix
- [ ] Dev workflow + link verify/ci scripts
- [ ] Trade-offs & alternatif ditolak
- [ ] Cross-link ARCHITECTURE + DESIGN-GUIDELINES

## Referensi

- [docs/invoicing/engineering/TECHNOLOGY-STACK.md](../docs/invoicing/engineering/TECHNOLOGY-STACK.md)
- [docs/invoicing/engineering/STACK-INTEGRATION.md](../docs/invoicing/engineering/STACK-INTEGRATION.md)

---
status: approved
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Business Requirements Document (BRD) — PuraPuraLupa (Komando)

**Versi:** 1.3 · **Status:** Approved for MVP  
**Indeks paket:** [brd-definition-of-done.md](brd-definition-of-done.md)\
**System architecture:** [ARCHITECTURE.md](../architecture/README.md) · **Tech stack:** [engineering/technology-stack.md](../engineering/technology-stack.md) · **Design:** [design/design-guidelines.md](../design/design-guidelines.md)\
**Selarasan lintas dokumen:** [brd/architecture-alignment.md](brd/architecture-alignment.md) (keputusan canonical D-01…D-13, gap register G-01…G-13)

Dokumen **BRD canonical** — ringkas dan navigasi. Detail di [brd/](brd/README.md).

> **Fase workspace:** FR-01–FR-08 + **FR-14 / FR-14h** terimplementasi di monorepo (gate **G0–G7** Pass, `npm run gate`). Tersisa Phase 6: UAT manual, review legal (termasuk L-6 kolektor + foto), sign-off engineering, dan gap pre-prod (mis. G-04) di [alignment §6](brd/architecture-alignment.md#6-register-gap-dokumen--kode).

---

## 1. Executive summary

| Item | Keputusan |
|------|-----------|
| Produk | **PuraPuraLupa** — invoicing freelancer/solo, **IDR**, Indonesia (tagline: Komisi Matel Indonesia / Komando) |
| MVP | Profil → klien → invoice (+ PPN) → PDF/link → email → lunas → dashboard → **penagihan kolektor + foto** |
| North Star | Invoice **terkirim** / user aktif / minggu |
| Out of scope MVP | e-Faktur, payment gateway, multi-user, multi-currency |

Detail visi: [brd/product-brief.md](brd/product-brief.md).

---

## 2. Persona

Freelancer kreatif/teknis · konsultan part-time · klien penerima invoice (read-only link).  
Validasi: [brd/stakeholder-validation.md](brd/stakeholder-validation.md).

---

## 3. Metrik MVP

| Metrik | Target |
|--------|--------|
| Time-to-first-invoice (sent) | Median &lt; 15 menit |
| Activation (7 hari) | ≥ 60% punya ≥1 klien + ≥1 invoice |
| Collection rate | Track only |

---

## 4. Functional requirements

**Must (locked):** FR-01 … FR-08, **FR-14**, **FR-14h** — [brd/mvp-scope-lock.md](brd/mvp-scope-lock.md)

| ID | Ringkas |
|----|---------|
| FR-01 | CRUD klien |
| FR-02 | Invoice draft + line items |
| FR-03 | PPN 11% opsional |
| FR-04 | PDF |
| FR-05 | Kirim email → `sent` |
| FR-06 | Public link |
| FR-07 | Tandai lunas |
| FR-08 | Dashboard + outstanding |
| FR-14 | Debt collector — assign, log penagihan, komisi — [PRD-0700](requirements/0700-debt-collector/0700-prd-debt-collector.md) |
| FR-14h | Foto kolektor (web) — [PRD-0701](requirements/0701-foto-kolektor/0701-prd-foto-kolektor.md) |

Should/Could/Won't: file yang sama. FR-10 (default due +30 hari, footer default) sudah ikut terimplementasi; FR-09, FR-11–FR-13 belum.

Status per FR (web · API · domain · layar design): [brd/architecture-alignment.md §3](brd/architecture-alignment.md#3-pemetaan-fr-must--arsitektur--stack--design).

---

## 5. Business rules

BR-01 … BR-09 — [brd/mvp-scope-lock.md](brd/mvp-scope-lock.md#business-rules-implementasi-wajib).

---

## 6. UX, wireframe, QA

| Artefak | Link |
|---------|------|
| Story map | [brd/user-story-map.md](brd/user-story-map.md) |
| Wireframes (+ Kolektor) | [brd/wireframes.md](brd/wireframes.md) |
| Design guidelines | [design/design-guidelines.md](../design/design-guidelines.md) |
| Prototype HTML | [../design/prototype/index.html](../design/prototype/index.html) |
| UAT | [brd/user-stories-uat.md](brd/user-stories-uat.md) |

---

## 7. Legal (MVP draft)

[legal/ppn-disclaimer.md](legal/ppn-disclaimer.md) · [legal/privacy.md](legal/privacy.md) · [legal/terms.md](legal/terms.md)

---

## 8. Downstream (engineering)

| Topik | Dokumen |
|-------|---------|
| System architecture | [ARCHITECTURE.md](../architecture/README.md) |
| **Technology stack** | [engineering/technology-stack.md](../engineering/technology-stack.md) |
| TDD | [engineering/technical-design.md](../engineering/technical-design.md) |
| Dev & env | [engineering/stack-integration.md](../engineering/stack-integration.md) |
| Web | [apps/web](../../apps/web) |
| API / backend | [apps/api](../../apps/api) · [engineering/api.md](../engineering/api.md) |
| Shared | [packages/](../../packages) |

---

## 9. DoD paket BRD

[brd-definition-of-done.md](brd-definition-of-done.md)

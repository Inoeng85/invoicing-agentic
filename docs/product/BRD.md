# Business Requirements Document (BRD) — PuraPuraLupa (Komando)

**Versi:** 1.3 · **Status:** Approved for MVP  
**Indeks paket:** [BRD-DEFINITION-OF-DONE.md](BRD-DEFINITION-OF-DONE.md)\
**System architecture:** [ARCHITECTURE.md](../architecture/README.md) · **Tech stack:** [engineering/TECHNOLOGY-STACK.md](../engineering/TECHNOLOGY-STACK.md) · **Design:** [design/DESIGN-GUIDELINES.md](../design/DESIGN-GUIDELINES.md)\
**Selarasan lintas dokumen:** [brd/ARCHITECTURE-ALIGNMENT.md](brd/ARCHITECTURE-ALIGNMENT.md) (keputusan canonical D-01…D-13, gap register G-01…G-13)

Dokumen **BRD canonical** — ringkas dan navigasi. Detail di [brd/](brd/README.md).

> **Fase workspace:** FR-01–FR-08 + **FR-14 / FR-14h** terimplementasi di monorepo (gate **G0–G7** Pass, `npm run gate`). Tersisa Phase 6: UAT manual, review legal (termasuk L-6 kolektor + foto), sign-off engineering, dan gap pre-prod (mis. G-04) di [alignment §6](brd/ARCHITECTURE-ALIGNMENT.md#6-register-gap-dokumen--kode).

---

## 1. Executive summary

| Item | Keputusan |
|------|-----------|
| Produk | **PuraPuraLupa** — invoicing freelancer/solo, **IDR**, Indonesia (tagline: Komisi Matel Indonesia / Komando) |
| MVP | Profil → klien → invoice (+ PPN) → PDF/link → email → lunas → dashboard → **penagihan kolektor + foto** |
| North Star | Invoice **terkirim** / user aktif / minggu |
| Out of scope MVP | e-Faktur, payment gateway, multi-user, multi-currency |

Detail visi: [brd/PRODUCT-BRIEF.md](brd/PRODUCT-BRIEF.md).

---

## 2. Persona

Freelancer kreatif/teknis · konsultan part-time · klien penerima invoice (read-only link).  
Validasi: [brd/STAKEHOLDER-VALIDATION.md](brd/STAKEHOLDER-VALIDATION.md).

---

## 3. Metrik MVP

| Metrik | Target |
|--------|--------|
| Time-to-first-invoice (sent) | Median &lt; 15 menit |
| Activation (7 hari) | ≥ 60% punya ≥1 klien + ≥1 invoice |
| Collection rate | Track only |

---

## 4. Functional requirements

**Must (locked):** FR-01 … FR-08, **FR-14**, **FR-14h** — [brd/MVP-SCOPE-LOCK.md](brd/MVP-SCOPE-LOCK.md)

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
| FR-14 | Debt collector — assign, log penagihan, komisi — [PRD-0700](requirements/0700-debt-collector/0700_PRD_Debt_Collector.md) |
| FR-14h | Foto kolektor (web) — [PRD-0701](requirements/0701-foto-kolektor/0701_PRD_Foto_Kolektor.md) |

Should/Could/Won't: file yang sama. FR-10 (default due +30 hari, footer default) sudah ikut terimplementasi; FR-09, FR-11–FR-13 belum.

Status per FR (web · API · domain · layar design): [brd/ARCHITECTURE-ALIGNMENT.md §3](brd/ARCHITECTURE-ALIGNMENT.md#3-pemetaan-fr-must--arsitektur--stack--design).

---

## 5. Business rules

BR-01 … BR-09 — [brd/MVP-SCOPE-LOCK.md](brd/MVP-SCOPE-LOCK.md#business-rules-implementasi-wajib).

---

## 6. UX, wireframe, QA

| Artefak | Link |
|---------|------|
| Story map | [brd/USER-STORY-MAP.md](brd/USER-STORY-MAP.md) |
| Wireframes (+ Kolektor) | [brd/WIREFRAMES.md](brd/WIREFRAMES.md) |
| Design guidelines | [design/DESIGN-GUIDELINES.md](../design/DESIGN-GUIDELINES.md) |
| Prototype HTML | [../design/prototype/index.html](../design/prototype/index.html) |
| UAT | [brd/USER-STORIES-UAT.md](brd/USER-STORIES-UAT.md) |

---

## 7. Legal (MVP draft)

[legal/PPN-DISCLAIMER.md](legal/PPN-DISCLAIMER.md) · [legal/PRIVACY.md](legal/PRIVACY.md) · [legal/TERMS.md](legal/TERMS.md)

---

## 8. Downstream (engineering)

| Topik | Dokumen |
|-------|---------|
| System architecture | [ARCHITECTURE.md](../architecture/README.md) |
| **Technology stack** | [engineering/TECHNOLOGY-STACK.md](../engineering/TECHNOLOGY-STACK.md) |
| TDD | [engineering/TECHNICAL-DESIGN.md](../engineering/TECHNICAL-DESIGN.md) |
| Dev & env | [engineering/STACK-INTEGRATION.md](../engineering/STACK-INTEGRATION.md) |
| Web | [apps/web](../../apps/web/) |
| API / backend | [apps/api](../../apps/api/) · [engineering/API.md](../engineering/API.md) |
| Shared | [packages/](../../packages/) |

---

## 9. DoD paket BRD

[BRD-DEFINITION-OF-DONE.md](BRD-DEFINITION-OF-DONE.md)

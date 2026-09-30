# Business Requirements Document (BRD) — Invoicing Freelancer Indonesia

**Versi:** 1.2 · **Status:** Approved for MVP  
**Indeks paket:** [BRD-DEFINITION-OF-DONE.md](./BRD-DEFINITION-OF-DONE.md)  
**System architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Tech stack:** [engineering/TECHNOLOGY-STACK.md](./engineering/TECHNOLOGY-STACK.md) · **Design:** [design/DESIGN-GUIDELINES.md](./design/DESIGN-GUIDELINES.md)  
**Selarasan lintas dokumen:** [brd/ARCHITECTURE-ALIGNMENT.md](./brd/ARCHITECTURE-ALIGNMENT.md) (keputusan canonical D-01…D-13, gap register G-01…G-13)

Dokumen **BRD canonical** — ringkas dan navigasi. Detail di [brd/](./brd/README.md).

> **Fase workspace:** FR-01–FR-08 terimplementasi di monorepo (gate G0–G5 Pass, `npm run gate`). Tersisa Phase 6: UAT manual, review legal, sign-off engineering, dan penutupan gap Must di [alignment §6](./brd/ARCHITECTURE-ALIGNMENT.md#6-register-gap-dokumen--kode).

---

## 1. Executive summary

| Item | Keputusan |
|------|-----------|
| Produk | Invoicing freelancer/solo, **IDR**, Indonesia |
| MVP | Profil → klien → invoice (+ PPN opsional) → PDF/link → email → lunas → dashboard |
| North Star | Invoice **terkirim** / user aktif / minggu |
| Out of scope MVP | e-Faktur, payment gateway, multi-user, multi-currency |

Detail visi: [brd/PRODUCT-BRIEF.md](./brd/PRODUCT-BRIEF.md).

---

## 2. Persona

Freelancer kreatif/teknis · konsultan part-time · klien penerima invoice (read-only link).  
Validasi: [brd/STAKEHOLDER-VALIDATION.md](./brd/STAKEHOLDER-VALIDATION.md).

---

## 3. Metrik MVP

| Metrik | Target |
|--------|--------|
| Time-to-first-invoice (sent) | Median &lt; 15 menit |
| Activation (7 hari) | ≥ 60% punya ≥1 klien + ≥1 invoice |
| Collection rate | Track only |

---

## 4. Functional requirements

**Must (locked):** FR-01 … FR-08 — [brd/MVP-SCOPE-LOCK.md](./brd/MVP-SCOPE-LOCK.md)

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

Should/Could/Won't: file yang sama. FR-10 (default due +30 hari, footer default) sudah ikut terimplementasi; FR-09, FR-11–FR-13 belum.

Post-MVP: FR-14 debt collector — [PRD-0700](../PRD/0700-debt-collector/0700_PRD_Debt_Collector.md).

Status per FR (web · API · domain · layar design): [brd/ARCHITECTURE-ALIGNMENT.md §3](./brd/ARCHITECTURE-ALIGNMENT.md#3-pemetaan-fr-must--arsitektur--stack--design).

---

## 5. Business rules

BR-01 … BR-06 — [brd/MVP-SCOPE-LOCK.md](./brd/MVP-SCOPE-LOCK.md#business-rules-implementasi-wajib).

---

## 6. UX, wireframe, QA

| Artefak | Link |
|---------|------|
| Story map | [brd/USER-STORY-MAP.md](./brd/USER-STORY-MAP.md) |
| Wireframes (7 layar) | [brd/WIREFRAMES.md](./brd/WIREFRAMES.md) |
| Design guidelines | [design/DESIGN-GUIDELINES.md](./design/DESIGN-GUIDELINES.md) |
| Prototype HTML | [../design/prototype/index.html](../design/prototype/index.html) |
| UAT | [brd/USER-STORIES-UAT.md](./brd/USER-STORIES-UAT.md) |

---

## 7. Legal (MVP draft)

[legal/PPN-DISCLAIMER.md](./legal/PPN-DISCLAIMER.md) · [legal/PRIVACY.md](./legal/PRIVACY.md) · [legal/TERMS.md](./legal/TERMS.md)

---

## 8. Downstream (engineering)

| Topik | Dokumen |
|-------|---------|
| System architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Technology stack** | [engineering/TECHNOLOGY-STACK.md](./engineering/TECHNOLOGY-STACK.md) |
| TDD | [engineering/TECHNICAL-DESIGN.md](./engineering/TECHNICAL-DESIGN.md) |
| Dev & env | [engineering/STACK-INTEGRATION.md](./engineering/STACK-INTEGRATION.md) |
| Web | [apps/web](../../apps/web/) |
| API / backend | [apps/api](../../apps/api/) · [engineering/API.md](./engineering/API.md) |
| Shared | [packages/](../../packages/) |

---

## 9. DoD paket BRD

[BRD-DEFINITION-OF-DONE.md](./BRD-DEFINITION-OF-DONE.md)

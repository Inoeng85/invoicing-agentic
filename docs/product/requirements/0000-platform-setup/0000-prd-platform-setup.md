---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0000 — Platform & Environment Setup

| Meta | Nilai |
|------|-------|
| ID | **0000** |
| Versi | 2.3 (mirror canonical) |
| Prioritas dev | **0** (sebelum semua PRD produk) |
| Owner | Product (PM) |
| Development phase | [0000-prd-platform-setup-development-phase.md](0000-prd-platform-setup-development-phase.md) |
| **Dokumen canonical penuh** | [../../0000_platform_setup/prd-platform-setup.md](prd-platform-setup.md) |

## Ringkasan

PRD ini mengatur **platform, environment, tooling, CI/CD, hosting, design-token pipeline** untuk monorepo Invoicing MVP. **Tidak** mencakup fitur produk FR-01–FR-13 atau perubahan BR-01–BR-06.

## Tujuan (O-1 … O-5)

| ID | Tujuan | Ukuran keberhasilan |
|----|--------|---------------------|
| O-1 | Onboarding dev | Clone → web + API ≤ 15 menit, tanpa Docker wajib |
| O-2 | Determinisme env | Node ≥24.3, satu `package-lock.json`, SQLite canonical |
| O-3 | PR quality | CI `verify` wajib sebelum merge `main` |
| O-4 | Deploy readiness | Staging/prod `GET /api/health/ready` → 200 |
| O-5 | Design pipeline | Token prototype = token `apps/web` |

## Milestone & gate

| Milestone | Gate | Fokus |
|-----------|------|--------|
| M0 | **PG-0** | Local baseline (`setup`, `verify`, lockfile, DB path) |
| M1 | **PG-1** | CI workflow + branch protection |
| M2 | **PG-2** | Staging host, TLS, CORS, email staging, CD |
| M3 | **PG-3** | Prod CD, backup, secrets, alerting, email domain |

## Requirement platform (PS)

Requirement lengkap, baseline B-01–B-12, dan pemetaan PS→task ada di **canonical PRD** §3–§7. Ringkas:

- **Stack:** Node 24.3+, npm workspaces, `engine-strict`, scripts `setup` / `verify` / `doctor`
- **DB:** SQLite semua environment; `db:migrate`, `db:migrate:deploy`, seed; ADR-0001
- **Backend platform:** env validation boot, structured logging + request ID, email adapter selection
- **Frontend platform:** shared design tokens, CSS build dari token
- **Infra:** GitHub Actions `verify`, Railway (atau setara), secret rotation, rollback runbook
- **Docs:** dev runbook, ops runbook, LAUNCH-LANE

## Non-goals

- Implementasi FR invoice, auth bisnis (lihat PRD **0100**–**0600**)
- e-Faktur, payment gateway, multi-tenant

## Dependensi ke PRD produk

| PRD produk | Butuh dari 0000 |
|------------|-----------------|
| 0100 Foundation | PG-0 (minimal) |
| 0101+ | PG-0; staging UAT butuh PG-2 |
| 0600 Release | PG-1 formal + PG-2/3 |

## Referensi

- [prd-platform-setup-development-phase.md](prd-platform-setup-development-phase.md)
- [launch-lane.md](../../../operations/launch-lane.md)
- [technology-stack.md](../../../engineering/technology-stack.md)
- [architecture-alignment.md](../../brd/architecture-alignment.md) (gap G-04, G-06, G-07, G-13)

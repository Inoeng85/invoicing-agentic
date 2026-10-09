---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0600 — Release Readiness · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0600** |
| Gate | **G6** |

## Task

| Task | Output |
|------|--------|
| 060001-docs-uat-trace-matrix | FR ↔ UAT ↔ gate |
| 060002-product-gap-g01-revoke-cancel | Cancel sent + align BR-01 |
| 060003-product-gap-g02-public-hardening | Verify 0402 + security review |
| 060004-product-gap-g05-legal-copy | Invoice footer/disclaimer |
| 060005-product-gap-g13-email-errors | UX on send failure |
| 060006-infra-release-check-script | `npm run release:check` |
| 060007-infra-ci-g6 | Required verify on main |
| 060008-ops-staging-uat-run | Checklist signed |
| 060009-ops-prod-launch | LAUNCH-LANE steps |
| 060010-docs-signoff-mvp-scope | MVP-SCOPE-LOCK engineering row |

## Urutan eksekusi disarankan

1. Close manual UAT (G1.2–G5.2)
2. Gap fixes G-01, G-02, G-05, G-13
3. `release:check` + legal checklist
4. PG-1 CI / waiver documentation
5. PG-2 staging UAT → PG-3 prod launch

## Gate G6

| Check | Metode | Pass |
|-------|--------|------|
| G6.0 | `npm run release:check` | Exit 0 |
| G6.1 | GitHub Actions `verify` | Green (or documented equivalent) |
| G6.2 | Legal checklist | Review complete |
| G6.3 | MVP-SCOPE-LOCK | Engineering sign-off date |

## DoD

- [ ] All Must FR traced in README PRD index
- [ ] Known Won't documented for support
- [ ] Rollback runbook linked (PRD-0000 Phase 3)

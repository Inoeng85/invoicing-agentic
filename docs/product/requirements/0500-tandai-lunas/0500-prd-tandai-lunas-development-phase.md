---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0500 — Tandai Lunas · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0500** |
| Gate | **G5** (partial) |

## Task

| Task | Output |
|------|--------|
| 050001-db-paid-fields | `paid_at`, status `paid` |
| 050002-domain-paid-transition | Valid state machine |
| 050003-be-mark-paid | PATCH endpoint |
| 050004-fe-mark-paid-button | Invoice detail |
| 050005-infra-gate-g5-paid | G5.1 |

## Urutan

DB → domain → API → UI → gate

## DoD

- [ ] Cannot mark paid from draft
- [ ] `paid_at` set server-side

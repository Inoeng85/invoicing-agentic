---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0501 — Dashboard · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0501** |
| Gate | **G5** |

## Task

| Task | Output |
|------|--------|
| 050101-domain-overdue-compute | BR-03 helper |
| 050102-be-invoice-list-filters | Query params status |
| 050103-be-outstanding-aggregate | API summary |
| 050104-fe-dashboard | Main list + filters |
| 050105-fe-outstanding-widget | KPI card |
| 050106-infra-gate-g5-dashboard | G5.2 |

## Urutan

Domain overdue → list API → aggregate → dashboard UI → gate

## DoD

- [ ] Pagination or sensible limit documented
- [ ] Timezone for due date = business default (document in ARCH)

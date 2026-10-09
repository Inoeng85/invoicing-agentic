---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0400 — PDF · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0400** |
| Gate | **G4** (PDF subset) |

## Task

| Task | Output |
|------|--------|
| 040001-domain-pdf-layout-data | DTO for PDF renderer |
| 040002-be-pdf-generate | `pdf-lib` service |
| 040003-be-pdf-download-route | Authenticated download |
| 040004-fe-download-button | Web action |
| 040005-infra-gate-pdf | Content-Type + size > 0 |

## Urutan

DTO → generator → API route → web → gate

## DoD

- [ ] Logo optional graceful
- [ ] IDR formatting consistent with UI

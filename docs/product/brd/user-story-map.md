---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# User Story Map

**Delivery:** aktivitas user di **web**; data yang sama diekspos via **API** ([architecture-alignment.md](architecture-alignment.md)).\
**Architecture:** [../ARCHITECTURE.md](../../architecture/README.md) §9

Backbone: **Setup → Client → Invoice → Send → Collect → Report**

```
Setup          Client           Invoice              Send              Collect           Report
─────────────────────────────────────────────────────────────────────────────────────────────
Register       Add client       Create draft         Preview PDF       Mark paid         Dashboard
Login          Edit client      Add line items       Send email        Filter status     Outstanding sum
Business       Deactivate       Toggle PPN           Public link       Overdue auto      (CSV fase 2)
profile        Pick client      Set due date         Revoke link
Logo/bank      Search/list      Assign number
NPWP opt       Email required   Duplicate (S2)
```

## Release slice — MVP

1. **Setup:** Register, login, business profile (minimal).
2. **Client:** FR-01 full path.
3. **Invoice:** FR-02, FR-03, numbering, draft lifecycle.
4. **Send:** FR-04, FR-05, FR-06.
5. **Collect:** FR-07, BR-03 overdue.
6. **Report:** FR-08.

## Release slice — Sprint 2 (Should)

FR-09, FR-10, FR-11.

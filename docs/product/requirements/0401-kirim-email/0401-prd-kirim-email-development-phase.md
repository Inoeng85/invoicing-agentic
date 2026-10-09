---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0401 — Kirim Email · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0401** |
| Gate | **G4** |

## Task

| Task | Output |
|------|--------|
| 040101-domain-invoice-numbering | Sequential per user |
| 040102-db-sent-fields | `status`, `sent_at`, `number`, `publicToken` |
| 040103-be-send-invoice | Transaction: number + token + email |
| 040104-be-email-adapter | Pluggable; fail → no sent |
| 040105-fe-send-action | Confirm + errors |
| 040106-infra-email-smoke | `npm run email:smoke` staging |
| 040107-infra-gate-g4-send | G4.2 |

## Urutan

Numbering → DB → send service → adapter → UI → smoke → gate

## DoD

- [ ] Idempotent send protection (no double number)
- [ ] Client email required enforced

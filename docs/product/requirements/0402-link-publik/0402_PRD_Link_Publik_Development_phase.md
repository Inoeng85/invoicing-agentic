# PRD-0402 — Link Publik · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0402** |
| Gate | **G4** |

## Task

| Task | Output |
|------|--------|
| 040201-db-token-revoked-flag | `publicTokenRevokedAt` or equivalent |
| 040202-be-public-invoice-api | Unauthenticated read |
| 040203-be-revoke-link | Owner revoke |
| 040204-fe-public-page | `/i/:token` |
| 040205-fe-revoke-ui | Settings on invoice detail |
| 040206-infra-gate-g4-public | G4.3 |

## Urutan

DB → public API → revoke API → public web → owner UI → gate

## DoD

- [ ] Rate limit ready (PRD-0000 proxy) documented
- [ ] Token unguessable (crypto random)

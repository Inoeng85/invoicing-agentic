# PRD-0200 — Klien · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0200** |
| Gate | **G2** |

## Task

| Task | Output |
|------|--------|
| 020001-db-client-model | Prisma Client + relasi User |
| 020002-domain-client-validation | Email required rules |
| 020003-be-client-crud | REST scoped userId |
| 020004-fe-clients-list | `/clients` |
| 020005-fe-client-form | Create/edit |
| 020006-infra-gate-phase2 | G2.1 |

## Urutan

DB → domain → API → web list → web form → gate

## Gate G2

| Check | Pass |
|-------|------|
| G2.1 | Gate script Phase 2 |
| G2.2 | UAT US-01/02 manual |

## DoD

- [ ] Inactive client tidak muncul di picker default (atau ditandai jelas)
- [ ] 404/403 cross-user access

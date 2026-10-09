# PRD-0101 — Auth & Profil · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0101** |
| Gate | **G1** |

## Task

| Task | Depends | Output |
|------|---------|--------|
| 010101-db-user-business-profile | 0100 | Prisma models User, BusinessProfile |
| 010102-domain-auth-password | 010101 | Hash/verify scrypt |
| 010103-be-register-login | 010102 | API routes + session |
| 010104-be-auth-middleware | 010103 | 401 on protected routes |
| 010105-be-profile-crud | 010103 | GET/PATCH profile |
| 010106-fe-login-register | 010103 | Remix routes |
| 010107-fe-settings | 010105 | `/settings` form |
| 010108-fe-dashboard-guard | 010106 | Auth loader redirect |
| 010109-infra-gate-phase1 | 010103–105 | Gate G1.1 |

## Urutan eksekusi

DB → domain auth → API auth → middleware → profile API → web auth → settings → gate

## Gate G1

| Check | Metode | Pass |
|-------|--------|------|
| G1.1 | `npm run gate` Phase 1 | Register + profile API |
| G1.2 | Manual UAT | Login flow web |
| G1.3 | Manual UAT | Settings persist |

## DoD

- [ ] Password never logged/plain stored
- [ ] `SESSION_SECRET` required in prod (env validation 0000)

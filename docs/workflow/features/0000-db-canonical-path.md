# Feature — 0000-db-canonical-path

| Field | Nilai |
|-------|-------|
| **Feature ID** | 0000-db-canonical-path |
| **Nama** | SQLite canonical dev path (PS-13) |
| **Epic** | 0000 |
| **Task utama** | 000001-db-canonical-sqlite-path |

## Ringkasan

Satu file `packages/database/prisma/dev.db` dipakai migrasi Prisma dan runtime web/API lewat `DATABASE_URL=file:./dev.db` (relatif ke `schema.prisma`).

## File terkait (session boundary)

### Backend

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed/env.ts`
- `packages/database/.env.example`

### Frontend

- `apps/web/.env.example`

### Docs / lainnya

- `apps/api/.env.example`
- `docs/engineering/STACK-INTEGRATION.md` (referensi saja)

## Task plan yang memakai feature ini

| Task ID | Phase | Status dev |
|---------|-------|------------|
| 000001-db-canonical-sqlite-path | 0000-P0 | `complete` |

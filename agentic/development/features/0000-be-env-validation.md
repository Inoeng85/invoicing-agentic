# Feature — 0000-be-env-validation

| Field | Nilai |
|-------|-------|
| **Feature ID** | 0000-be-env-validation |
| **Nama** | be env validation |
| **Epic** | 0000 |
| **Task utama** | 000001-be-env-validation |

## Ringkasan

Boot web dan API memanggil `bootstrapPlatform`, yang menjalankan `validateEnvAtBoot`. Production berhenti bila variabel wajib hilang; development tetap jalan dengan default selama `DATABASE_URL` ada.

## File terkait (session boundary)

### Backend

- `packages/platform/src/env.ts`
- `packages/platform/src/bootstrap.ts`
- `packages/platform/src/index.ts`
- `apps/api/src/server.ts`

### Frontend

- `apps/web/server.ts`

### Docs / lainnya

- —

## Task plan yang memakai feature ini

| Task ID | Phase | Status dev |
|---------|-------|------------|
| 000001-be-env-validation | 0000-P2 | `complete` |

## Out of scope

- Task lain di epic yang tidak memakai feature ID ini.

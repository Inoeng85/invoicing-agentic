# Development report — 000001-be-env-validation

| Field | Nilai |
|-------|-------|
| Task ID | 000001-be-env-validation |
| Feature | [0000-be-env-validation](../../../../features/0000-be-env-validation.md) |
| Phase | 0000-P2 |
| Selesai | 2026-10-01T14:57:16+07:00 |
| Commit / PR | `ef84c90` (Phase 2 M2) · sentuhan `eb44e65` |

## Ringkasan

PS-10 sudah ada di `@invoicing/platform`: `validateEnvAtBoot` dipanggil dari `bootstrapPlatform` saat start web dan API. Production menolak boot bila `SESSION_SECRET`, `APP_URL`, atau `DATABASE_URL` kosong, dan menolak `EMAIL_API_KEY` / `EMAIL_FROM` bila `EMAIL_PROVIDER` bukan `log`. Development tetap boot tanpa `SESSION_SECRET` selama `DATABASE_URL` ada.

## File diubah

- Tidak ada perubahan produk. Modul sudah di baseline:
  - `packages/platform/src/env.ts`
  - `packages/platform/src/bootstrap.ts`
  - `packages/platform/src/index.ts`
  - `apps/web/server.ts`
  - `apps/api/src/server.ts`

## Verifikasi dijalankan

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use
node -v   # v24.3.0

# production, SESSION_SECRET kosong
NODE_ENV=production DATABASE_URL=file:./dev.db APP_URL=http://localhost:44100 \
  EMAIL_PROVIDER=log SESSION_SECRET= CORS_ORIGIN=http://localhost:44100 \
  node --import tsx apps/api/src/server.ts

# cwd apps/web
NODE_ENV=production DATABASE_URL=file:./dev.db APP_URL=http://localhost:44100 \
  EMAIL_PROVIDER=log SESSION_SECRET= \
  node --import tsx server.ts

# development tanpa SESSION_SECRET (proses dihentikan setelah listen)
NODE_ENV=development DATABASE_URL=file:./dev.db SESSION_SECRET= EMAIL_PROVIDER=log \
  node --import tsx apps/api/src/server.ts
NODE_ENV=development DATABASE_URL=file:./dev.db SESSION_SECRET= EMAIL_PROVIDER=log \
  node --import tsx server.ts   # cwd apps/web

# production, EMAIL_PROVIDER=resend tanpa key
node --import tsx -e "import { validateEnvAtBoot } from './packages/platform/src/env.ts'; validateEnvAtBoot('web')"

npm run typecheck -w @invoicing/platform
```

## Exit / hasil

- API production tanpa `SESSION_SECRET` → exit 1, `Missing required environment variables: SESSION_SECRET`
- Web production tanpa `SESSION_SECRET` → exit 1, pesan yang sama
- API development tanpa `SESSION_SECRET` → `API listening on http://localhost:44101`
- Web development tanpa `SESSION_SECRET` → `Server listening on http://localhost:44100`
- Production `EMAIL_PROVIDER=resend` tanpa key → exit 1, `EMAIL_API_KEY, EMAIL_FROM`
- `tsc --noEmit` pada `@invoicing/platform` → exit 0
- Listener uji dihentikan; port 44100 dan 44101 bebas

## Catatan untuk QA

Boot production harus dijalankan dari `apps/web` untuk web (Remix resolve `app/` dari cwd). Kosongkan `SESSION_SECRET` di environment proses, bukan hanya mengandalkan unset, supaya nilai di `.env` tidak mengisi kembali.

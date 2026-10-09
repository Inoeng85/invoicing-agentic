# Development report — 000004-stack-env-example

| Field | Nilai |
|-------|-------|
| Task ID | 000004-stack-env-example |
| Feature | [0000-platform-stack](../../../workflow/features/0000-platform-stack.md) |
| Phase | 0000-P0 |
| Selesai | 2026-10-01T15:54:10+07:00 |
| Commit / PR | belum di-commit |

## Ringkasan

PS-09 sudah hampir lengkap di tiga `.env.example`. Session ini menambah nama yang dibaca kode tetapi belum tercatat: `TRUST_PROXY` di `apps/web/.env.example` (komentar, sama seperti API) dan `NODE_ENV` di `packages/database/.env.example` (komentar; mengontrol log Prisma). Nilai dev aman tetap `EMAIL_PROVIDER=log` dan `APP_URL=http://localhost:44100`. Variabel HMR (`HMR_PORT`, `HMR_PROXY_PORT`, `APP_PORT`, `REMIX_NODE_HMR`) tetap di luar example, sesuai hasil PRD.

## File diubah

- `apps/web/.env.example` — komentar `TRUST_PROXY`
- `packages/database/.env.example` — komentar `NODE_ENV`

## Verifikasi dijalankan

Inventaris `process.env.NAME` di `apps/web`, `apps/api`, `packages/database`, dan `packages/platform`, lalu cek nama tersebut muncul di `.env.example` terkait.

## Exit / hasil

- Wajib plan: `DATABASE_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN` (API), `API_BASE_URL` (web), `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` — semua ada
- `packages/platform` tidak punya nama yang hilang dari example web+api (`EMAIL_ALLOWLIST` ada sebagai komentar di API)
- `packages/database` tidak punya nama yang hilang setelah komentar `NODE_ENV`
- HMR dikecualikan

## Catatan untuk QA

Ulangi inventaris `process.env` terhadap tiga `.env.example`. Abaikan `HMR_*`, `APP_PORT`, dan `REMIX_NODE_HMR`.

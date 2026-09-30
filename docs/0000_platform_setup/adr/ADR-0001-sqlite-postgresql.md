# ADR-0001 — SQLite (dev) dan PostgreSQL (staging/prod)

| Status | Accepted |
|--------|----------|
| Tanggal | 2026-09-30 |
| Konteks | Q-01 · PS-16 |

## Keputusan

1. **Development:** SQLite `file:./dev.db` (schema `prisma/schema.prisma`, migrasi `prisma/migrations/`).
2. **Staging / production / CI parity:** PostgreSQL managed (`prisma/postgresql/schema.prisma`, migrasi `prisma/postgresql/migrations/`).
3. **Runtime:** `@invoicing/database` memilih Prisma client dari `DATABASE_URL` (`postgres*` → client PostgreSQL, selain itu SQLite).
4. **Deploy staging/prod:** `npm run db:migrate:deploy:postgres` sebelum start proses.

## Konsekuensi

- Dua riwayat migrasi dipelihara selaras model (enum `InvoiceStatus` native di PostgreSQL).
- Gate lokal/CI SQLite tetap default; job opsional `verify-postgres` menjalankan gate terhadap PostgreSQL.

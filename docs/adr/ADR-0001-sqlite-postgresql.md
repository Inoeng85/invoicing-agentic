# ADR-0001 — SQLite (semua environment)

| Status | Accepted (revised 2026-09-30) |
|--------|----------------------------------|
| Tanggal | 2026-09-30 |
| Konteks | Q-01 · PS-16 · keputusan product: tanpa PostgreSQL |

## Keputusan

1. **Development, staging, production:** SQLite file (`prisma/schema.prisma`, migrasi `prisma/migrations/`).
2. **`DATABASE_URL`:** `file:./dev.db` (lokal) atau `file:./data/prod.db` di host dengan **volume persisten** (Railway volume / disk).
3. **Deploy:** `npm run db:migrate:deploy` sebelum start web & API.
4. **PostgreSQL:** tidak dipakai; dual schema & client Postgres dihapus dari repo.

## Konsekuensi

- Satu riwayat migrasi, satu Prisma client (`@prisma/client`).
- Backup prod = salin file `.db` (bukan snapshot Postgres) — lihat [RUNBOOK-OPS.md](../operations/RUNBOOK-OPS.md).
- Skala & konkurensi tulis terbatas SQLite; cukup untuk MVP freelancer invoicing.

## Ditolak

- PostgreSQL managed untuk staging/prod (kompleksitas ops vs MVP).

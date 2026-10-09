# Skill qa — 0700-task-01

Uji terkecil dari plan; verifikasi acceptance; laporkan pass/fail.

## Task

Prisma schema + migration

## Langkah

1. Baca plan task dan feature doc.
2. Kerjakan hanya dalam boundary file PRD/plan.
3. Catat perintah uji yang dijalankan.

## Verifikasi

npm run db:migrate -- --name debt_collector

## Files

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/<timestamp>_debt_collector/migration.sql`
- `packages/database/src/index.ts`

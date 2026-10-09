# Skill infra — 000001-db-canonical-sqlite-path

1. Pastikan `packages/database/.env.example` memakai `DATABASE_URL="file:./dev.db"`.
2. Samakan `apps/web/.env.example` dan `apps/api/.env.example`.
3. Konfirmasi resolusi path relatif ke `schema.prisma` (Prisma docs).
4. Hapus artefak `prisma/prisma/dev.db` jika muncul lagi.
5. `npm run db:migrate` dari root Agentic.

**Selesai bila:** `find . -name dev.db` hanya `packages/database/prisma/dev.db`.

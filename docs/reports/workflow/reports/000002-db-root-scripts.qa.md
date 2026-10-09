# QA report — 000002-db-root-scripts

| Field | Nilai |
|-------|-------|
| Task ID | 000002-db-root-scripts |
| Feature | [0000-db-root-scripts](../../../workflow/features/0000-db-root-scripts.md) |
| Phase | 0000-P0 |
| **Hasil** | `pass` |
| Selesai | 2026-10-01T15:58:38+07:00 |

## Uji terkecil (dari skills/qa.md)

Verifikasi: keempat script jalan dari root `Agentic/`. `db:reset` hanya lewat `--help` agar `dev.db` yang dipakai server tidak terhapus. `db:migrate:deploy` diuji sebagai jalur CI non-interaktif.

| # | Perintah / langkah | Expected | Actual | OK |
|---|-------------------|----------|--------|-----|
| 1 | Root scripts `db:migrate`, `db:reset`, `db:seed`, `db:studio` | Meneruskan ke `@invoicing/database` | Empat script ada dan memakai `-w @invoicing/database` | ya |
| 2 | `npm run db:migrate:deploy` | Exit 0, non-interaktif | Exit 0 · 4 migrations · no pending migrations | ya |
| 3 | `npm run db:seed` | Exit 0 | Exit 0 · demo user `dewi.kartika@studio-kartika.demo` ready | ya |
| 4 | `npm run db:migrate -- -- --help` | Memanggil `prisma migrate dev` | Exit 0 · `prisma migrate dev --help` | ya |
| 5 | `npm run db:reset -- -- --help` | Memanggil `prisma migrate reset` tanpa menghapus data | Exit 0 · `prisma migrate reset --force --help` | ya |
| 6 | `npm run db:studio -- -- --help` | Memanggil `prisma studio` tanpa membuka server | Exit 0 · `prisma studio --help` | ya |

## Fix dalam session

Tidak ada.

## Log / bukti

```text
db:migrate:deploy → No pending migrations to apply. EXIT_DEPLOY:0
db:seed → db:seed — demo user dewi.kartika@studio-kartika.demo (Studio Kartika) ready EXIT_SEED:0
prisma migrate dev --help EXIT_MIGRATE:0
prisma migrate reset --force --help EXIT_RESET:0
prisma studio --help EXIT_STUDIO:0
```

## Catatan untuk Audit

PS-14 lulus. Jangan menjalankan `db:reset` penuh selama server dev memakai database yang sama.

# Development report — 000002-db-root-scripts

| Field | Nilai |
|-------|-------|
| Task ID | 000002-db-root-scripts |
| Feature | [0000-db-root-scripts](../../../features/0000-db-root-scripts.md) |
| Phase | 0000-P0 |
| Selesai | 2026-10-01T15:56:38+07:00 |
| Commit / PR | baseline sudah di tree · tidak ada commit baru |

## Ringkasan

PS-14 sudah ada. Root `package.json` mengekspos `db:migrate`, `db:reset`, `db:seed`, dan `db:studio` lewat `-w @invoicing/database`. `db:migrate` lokal adalah `prisma migrate dev`. Jalur CI non-interaktif adalah `db:migrate:deploy` (`prisma migrate deploy`). Seed sudah idempoten (bukan placeholder kosong). Tidak ada perubahan produk.

## File diubah

- Tidak ada. Script yang diverifikasi:
  - `package.json`
  - `packages/database/package.json`

## Verifikasi dijalankan

```bash
npm run db:migrate:deploy
npm run db:seed
npm run db:migrate -- -- --help
npm run db:reset -- -- --help
npm run db:studio -- -- --help
```

`db:reset` tanpa `--help` tidak dijalankan: `prisma migrate reset --force` menghapus `dev.db` yang sedang dipakai server di `:44100` / `:44101`.

## Exit / hasil

- `db:migrate:deploy` → exit 0 · 4 migrations · no pending migrations
- `db:seed` → exit 0 · `db:seed — demo user dewi.kartika@studio-kartika.demo (Studio Kartika) ready`
- `db:migrate` help → `prisma migrate dev --help` exit 0
- `db:reset` help → `prisma migrate reset --force --help` exit 0
- `db:studio` help → `prisma studio --help` exit 0

## Catatan untuk QA

Ulangi `db:migrate:deploy` dan `db:seed` dari root. Jangan jalankan `db:reset` tanpa `--help` selama server dev memakai database yang sama.

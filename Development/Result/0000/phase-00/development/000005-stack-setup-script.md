# Development report — 000005-stack-setup-script

| Field | Nilai |
|-------|-------|
| Task ID | 000005-stack-setup-script |
| Feature | [0000-platform-stack](../../../../../agentic/development/features/0000-platform-stack.md) |
| Phase | 0000-P0 |
| Selesai | 2026-10-01T15:59:26+07:00 |
| Commit / PR | baseline sudah di tree · tidak ada commit baru |

## Ringkasan

PS-18 sudah ada. `scripts/setup.ts` mengecek Node `>=24.3`, meng-install hanya bila `node_modules` belum ada, menyalin `.env.example` hanya bila `.env` belum ada, menambah `SESSION_SECRET` hanya bila kunci itu belum ada, lalu menjalankan `db:migrate:deploy` dan `db:seed`. Root `package.json` punya `"setup"`. Tidak ada perubahan produk.

## File diubah

- Tidak ada. Yang diverifikasi: `scripts/setup.ts`, `package.json` (`"setup"`).

## Verifikasi dijalankan

```bash
npm run setup
curl -sS -o /dev/null -w "%{http_code}" http://localhost:44100/
curl -sS -o /dev/null -w "%{http_code}" http://localhost:44101/api/health/live
```

`npm run dev` tidak diulang: port 44100 dan 44101 sudah listen.

## Exit / hasil

- `npm run setup` → exit 0 · `Setup complete. Run: npm run dev`
- Ukuran `.env` tidak berubah: database 29 byte, web 222 byte, api 232 byte (tidak ditimpa)
- `db:migrate:deploy` → no pending migrations
- `db:seed` → demo user ready (idempoten)
- Web 302 · API live 200

## Catatan untuk QA

Ulangi `npm run setup` dan pastikan ukuran `.env` tidak berubah. Jangan menjalankan `npm run dev` kedua bila port sudah dipakai.

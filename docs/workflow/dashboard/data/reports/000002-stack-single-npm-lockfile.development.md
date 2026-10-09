# Development report — 000002-stack-single-npm-lockfile

| Field | Nilai |
|-------|-------|
| Task ID | 000002-stack-single-npm-lockfile |
| Feature | [0000-platform-stack](../../../features/0000-platform-stack.md) |
| Phase | 0000-P0 |
| Selesai | 2026-10-01T15:31:45+07:00 |
| Commit / PR | baseline sudah di tree (`package-lock.json` terakhir disentuh `ea6a164`) |

## Ringkasan

PS-03 sudah terpenuhi di baseline: satu-satunya lockfile adalah `package-lock.json` di root. Tidak ada `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`, atau `package-lock.json` di workspace. `node_modules` tidak dihapus dan lockfile tidak diregenerasi — daemon autopilot sedang berjalan, dan menghapus `node_modules` hanya akan mengulang install yang sudah benar.

## File diubah

- Tidak ada perubahan produk.
- Lockfile yang ada: `package-lock.json` (root).

## Versi paket kunci (lockfile saat ini)

Tidak ada regenerasi, jadi tidak ada diff sebelum/sesudah. Versi terkunci:

| Paket | Versi |
|-------|-------|
| remix | 3.0.0-rc.4 |
| prisma | 6.19.3 |
| @prisma/client | 6.19.3 |
| tailwindcss | 4.3.3 |
| pdf-lib | 1.17.1 |

## Verifikasi dijalankan

```bash
find . \( -name yarn.lock -o -name pnpm-lock.yaml -o -name package-lock.json -o -name bun.lock -o -name bun.lockb \) | grep -v node_modules
npm run test:domain
npm run typecheck
npm run gate
```

## Exit / hasil

- Lockfile: hanya `./package-lock.json`
- `npm run test:domain` → exit 0 · 63 pass, 0 fail
- `npm run typecheck` → exit 0 (web, api, domain, platform)
- `npm run gate` → exit 0 · Phase 0–7 PASS, termasuk G0–G5 (health, register, client, invoice/PPN, PDF/send/public, mark paid/dashboard)

## Catatan untuk QA

Uji terkecil: pastikan tidak ada lockfile selain `package-lock.json` di root (abaikan `node_modules`), dan `npm run gate` tetap PASS untuk Phase 0–5.

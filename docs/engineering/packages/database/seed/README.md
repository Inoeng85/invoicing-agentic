# Sample data (100 per modul)

Data deterministik untuk akun demo **Studio Kartika** — sama dengan `npm run db:seed` (`dewi.kartika@studio-kartika.demo` / `DemoStudio123!`).

| Modul | File | Email / nomor | Isi |
|-------|------|---------------|-----|
| **Klien** | `clients.ts` | `klien-001@sample.demo` … `100` | PT/CV + perorangan, alamat ID, ~70% pin koordinat (Jakarta/Bandung/Surabaya) |
| **Kolektor** | `collectors.ts` | `kolektor-001@sample.demo` … | Nama ID, telepon, komisi 5–15%, 10 nonaktif |
| **Invoice** | `invoices.ts` | `SMP-001` … `SMP-100` | 20 draft · 35 sent · 20 overdue · 20 paid · 5 cancelled; line items + PPN; penagihan & komisi selaras BR-08 |

Shared: `random.ts` (PRNG), `names.ts`, `demo-user.ts`, `run.ts` (CLI).

## Perintah (wajib dari root `Agentic/`)

```bash
cd Agentic
npm run db:seed:sample       # migrate deploy + clients → collectors → invoices
npm run db:seed:clients      # 100 klien saja
npm run db:seed:collectors   # 100 kolektor saja
npm run db:seed:invoices     # 100 invoice (wajib clients + collectors sudah 100)
```

Idempoten: record dengan email/nomor yang sama tidak diduplikasi.

### Troubleshooting

| Gejala | Penyebab | Perbaikan |
|--------|----------|-----------|
| `Could not read package.json` | Di folder `AIEngineer/` bukan `Agentic/` | `cd Agentic` lalu ulangi |
| `no such table` / P2021 | DB belum dimigrasi | `npm run db:migrate:deploy` (otomatis di `db:seed:sample`) |
| `db:seed:clients` di pesan error | Invoice sebelum klien/kolektor | Jalankan urutan clients → collectors → invoices atau `db:seed:sample` |
| Seed sukses tapi UI kosong | Login bukan akun demo | Email `dewi.kartika@studio-kartika.demo` · password `DemoStudio123!` |
| `0 dibuat, 100 sudah ada` | Bukan gagal — data sudah ada | Normal (idempoten); cek filter `@sample.demo` / `SMP-*` |

## Tes

```bash
npm run test -w @invoicing/database
```

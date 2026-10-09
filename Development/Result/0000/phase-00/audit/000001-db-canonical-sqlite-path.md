# Laporan audit — 000001-db-canonical-sqlite-path

| Field | Nilai |
|-------|-------|
| Task ID | 000001-db-canonical-sqlite-path |
| Phase | 0000-P0 |
| Epic | 0000 |
| **Hasil** | `pass` |
| Selesai | 2026-10-01T15:23:00+07:00 |

## Ringkasan

PS-13 lulus untuk task ini. Hanya ada satu SQLite `packages/database/prisma/dev.db`. API development membuka file itu dan `GET /api/health/ready` mengembalikan 200. Ini audit task, bukan release phase 0000-P0: task lain di phase belum QA pass.

## Code review

| Area | Temuan | Severity |
|------|--------|----------|
| Path canonical | `schema.prisma` memakai `file:` lewat `DATABASE_URL`. Web, API, dan package database menyetel `DATABASE_URL="file:./dev.db"`. | — |
| Runtime | Proses API memegang `packages/database/prisma/dev.db` (bukan salinan di `apps/`). | — |
| Skill QA | Perintah health di `skills/qa.md` menyebut port `4000`. Server dev mendengarkan `44101`. Uji ini memakai port yang benar-benar listen. | low |

## Uji

```bash
find . -name 'dev.db' -not -path '*/node_modules/*'
grep -h DATABASE_URL apps/web/.env.example apps/api/.env.example packages/database/.env.example
sqlite3 packages/database/prisma/dev.db "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM clients; SELECT COUNT(*) FROM invoices;"
npm run dev:api
curl -sS -D - http://localhost:44101/api/health/ready
lsof packages/database/prisma/dev.db
```

- Satu file: `./packages/database/prisma/dev.db`
- `.env` dan `.env.example` web, api, database: `DATABASE_URL="file:./dev.db"`
- Isi file itu: 1 user, 100 client, 100 invoice
- `GET /api/health/ready` → HTTP 200, `{"status":"ready","database":"ok"}`
- `lsof` pada proses API menunjuk file canonical yang sama
- API uji dihentikan; port 44101 bebas

Prisma Studio tidak dibuka. File yang dipegang API adalah file yang dibaca Studio dari `packages/database` (`file:./dev.db` relatif ke `schema.prisma`).

## Keputusan

- [x] Task `000001-db-canonical-sqlite-path` siap **Done**
- [ ] Phase 0000-P0 siap Human QA — belum; task lain belum QA pass

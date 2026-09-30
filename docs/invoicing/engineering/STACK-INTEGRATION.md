# Stack Integration — Monorepo

**Indeks:** [../BRD-DEFINITION-OF-DONE.md](../BRD-DEFINITION-OF-DONE.md)  
**API:** [API.md](./API.md)

---

## Stack ringkas

| Lapisan | Lokasi |
|---------|--------|
| Web UI | `apps/web` — Remix 3 + Tailwind v4 |
| Backend API | `apps/api` — Remix router, JSON |
| Domain | `packages/domain` |
| Database | `packages/database` — Prisma 6 + SQLite |
| Design prototype | `docs/design/prototype` — Tailwind v4 CLI |

Node **24.3+** (`.nvmrc` di root) · **Tanpa Docker**

---

## Prasyarat

1. [nvm](https://github.com/nvm-sh/nvm) (atau fnm/asdf dengan Node 24.3+).
2. Dari root `Agentic/`:

```sh
nvm install    # reads .nvmrc → 24.3.0
nvm use
node -v        # v24.x
```

`.npmrc` mengaktifkan `engine-strict=true` — `npm ci` gagal di Node &lt; 24.3.

---

## Onboarding (canonical)

Dari root `Agentic/` setelah clone:

```sh
npm run setup    # Node check, install, .env dari .env.example, migrate, seed no-op
npm run dev      # web :44100 + api :44101
```

Atau terpisah: `npm run dev:web` · `npm run dev:api`

### Port & URL (dev)

| Layanan | URL / port |
|---------|------------|
| Web app | http://localhost:44100 |
| API | http://localhost:44101 |
| API health | http://localhost:44101/api/health/ready |
| Design prototype (static) | Buka `docs/design/prototype/index.html` setelah `npm run design:css` |

---

## Verifikasi lokal (= CI)

```sh
npm run verify
```

Urutan: `typecheck` → `test:domain` → `test` (web) → `css:build` → `design:css` → `gate` (G0–G5).

Langkah individual masih tersedia: `npm run test:domain`, `npm run typecheck`, `npm run gate`.

**GitHub Actions:** workflow `.github/workflows/ci.yml` menjalankan `npm run db:migrate:deploy` lalu `npm run verify` di Node dari `.nvmrc`. Branch protection: [.github/BRANCH_PROTECTION.md](../../../.github/BRANCH_PROTECTION.md).

**Release (Phase 6):** `npm run release:check` · [RELEASE-READINESS.md](./RELEASE-READINESS.md).

**Postgres parity (PG-2):** `docker compose -f docker-compose.postgres.yml up -d` → `npm run verify:postgres`.

---

## Environment

Salinan `.env` dibuat oleh `npm run setup` (tidak menimpa `.env` yang sudah ada). Template lengkap:

| File | Variabel utama |
|------|----------------|
| `packages/database/.env.example` | `DATABASE_URL` |
| `apps/web/.env.example` | `DATABASE_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`, `API_BASE_URL`, `EMAIL_*` |
| `apps/api/.env.example` | `DATABASE_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN`, `EMAIL_*` |

`DATABASE_URL` dev canonical: `file:./dev.db` → **`packages/database/prisma/dev.db`** (relatif ke `schema.prisma`).

Daftar referensi: [TECHNOLOGY-STACK.md](./TECHNOLOGY-STACK.md) §5.

---

## Database

| Perintah (dari root) | Keterangan |
|----------------------|------------|
| `npm run db:migrate` | `prisma migrate dev` (interaktif, lokal) |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (CI / non-interaktif) |
| `npm run db:reset` | Reset + migrate ulang |
| `npm run db:seed` | Demo Studio Kartika (idempoten) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:migrate:deploy:postgres` | Migrasi PostgreSQL (staging/CI) |
| `npm run doctor` | Diagnosa Node, lockfile, env, DB, port |

---

## Prototype design system

```sh
npm run design:css    # → docs/design/prototype/assets/ui.css (gitignored, dibuild ulang)
npm run design:serve  # static server http://localhost:8765 (setelah design:css)
```

---

## Monorepo + asset server

Dependensi npm di-hoist ke `Agentic/node_modules`. Konfigurasi `apps/web/app/assets.ts` mem-mount `../../node_modules` agar import `remix/*` dari entry browser valid.

---

## Troubleshooting

| Gejala | Penyebab umum | Perbaikan |
|--------|---------------|-----------|
| `npm ci` / engine error | Node bukan 24.3+ | `nvm use` di root |
| `IMPORT_OUTSIDE_MOUNTS` | install tidak di root | `npm install` dari `Agentic/` |
| Data web tidak muncul di Studio | `DATABASE_URL` beda file | Samakan ke `file:./dev.db` di ketiga `.env`; hapus `prisma/prisma/dev.db` lama |
| Dua lockfile | Yarn lock tersisa | Hanya `package-lock.json` di root; jalankan `npm ci` |
| Port sudah dipakai | proses dev lama | Hentikan proses di 44100/44101 |

---

## Dokumen terkait

- [TECHNICAL-DESIGN.md](./TECHNICAL-DESIGN.md)  
- [../ARCHITECTURE.md](../ARCHITECTURE.md)  
- Platform setup PRD: [docs/0000_platform_setup/prd_platform_setup.md](../../0000_platform_setup/prd_platform_setup.md)

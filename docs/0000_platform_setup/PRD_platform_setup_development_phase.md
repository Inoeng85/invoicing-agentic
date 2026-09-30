# PRD-0000 — Platform Setup · Development Phase

| Meta | Nilai |
|------|-------|
| Versi | 1.3 · selaras [prd_platform_setup.md](./prd_platform_setup.md) v1.4 |
| Milestone & gate | PRD [§7](./prd_platform_setup.md#7-milestone-gate--development-phase) · pemetaan PS→task [§7.2](./prd_platform_setup.md#72-pemetaan-requirement--task) |
| Verifikasi terakhir | 2026-09-30 · PG-0 lulus · PG-1 partial · commit `b3525dc` |

**Scope:** platform & environment saja — tanpa pengembangan fitur.

**Format ID task:** `xxxxyy-[kanonik]-task`

| Bagian | Arti |
|--------|------|
| `xxxx` | Identitas PRD — `0000` |
| `yy` | Urutan task per kanonik (dihitung terpisah untuk tiap kanonik) |
| `kanonik` | `stack` toolchain & repo · `db` database · `be` platform server (config, logging, adapter) · `fe` CSS & design token · `infra` CI/CD, hosting, secret, provider · `docs` runbook & ADR |

---

## Ringkasan fase

| Fase dev | Milestone PRD | Gate | Jumlah task |
|----------|---------------|------|-------------|
| Phase 0 — Local baseline | M0 | PG-0 (**9/9 task done** · gate lokal ✅ · push remote ⏳) | 9 |
| Phase 1 — Continuous Integration | M1 | PG-1 (**2/3 task done** · CI run + branch protection terblokir plan/repo) | 3 |
| Phase 2 — Staging | M2 | PG-2 | 16 |
| Phase 3 — Production readiness | M3 | PG-3 | 10 |

### Urutan eksekusi (canonical)

Sama dengan PRD §7.1 — jangan ubah urutan di satu dokumen tanpa mengubah yang lain.

**Phase 0:** `000001-stack-pin-node-runtime` → `000002-stack-single-npm-lockfile` → `000003-stack-repo-hygiene` → `000001-db-canonical-sqlite-path` → `000004-stack-env-example` → `000002-db-root-scripts` → `000005-stack-setup-script` → `000006-stack-verify-script` → `000001-docs-dev-runbook`

**Phase 1:** `000001-infra-github-repo-protection` → `000002-infra-ci-workflow-fix` → `000003-infra-ci-verify-pipeline`

**Phase 2:** `000002-docs-adr-platform-decisions` → `000003-docs-branch-commit-convention` → `000007-stack-pin-dev-dependencies` → `000004-db-postgres-strategy` → `000001-be-env-validation` → `000002-be-structured-logging-request-id` → `000003-be-email-adapter-selection` → `000003-db-seed-demo` → `000008-stack-doctor-script` → `000005-infra-hosting-provision` → `000006-infra-domain-tls-cors` → `000007-infra-staging-cd` → `000008-infra-email-provider-staging` → `000004-infra-ci-performance` → `000001-fe-shared-design-tokens` → `000002-fe-web-css-token-build`

**Phase 3:** `000005-db-backup-restore` → `000009-infra-secret-rotation` → `000010-infra-ci-gate-summary` → `000011-infra-production-cd` → `000012-infra-rollback` → `000013-infra-proxy-rate-limit-ready` → `000014-infra-alerting-log-retention` → `000015-infra-email-domain-production` → `000003-fe-design-serve` → `000004-docs-ops-runbook`

---

## Pemetaan baseline PRD → task

| Baseline (PRD §1.1) | Task penutup | Fase |
|---------------------|--------------|------|
| B-01 Runtime Node | 000001-stack-pin-node-runtime | 0 |
| B-02 Lockfile ganda | 000002-stack-single-npm-lockfile | 0 |
| B-03 CI path salah | 000002-infra-ci-workflow-fix | 1 |
| B-04 CI coverage | 000006-stack-verify-script, 000003-infra-ci-verify-pipeline | 0, 1 |
| B-05 DB ganda | 000001-db-canonical-sqlite-path | 0 |
| B-06 Env incomplete | 000004-stack-env-example, 000001-be-env-validation | 0, 2 |
| B-07 Postgres strategy | 000004-db-postgres-strategy (+ ADR Q-01) | 2 |
| B-08 Email provider | 000003-be-email-adapter-selection, 000008-infra-email-provider-staging | 2 |
| B-09 Observability | 000002-be-structured-logging-request-id | 2 |
| B-10 Design pipeline | 000001-fe-shared-design-tokens, 000002-fe-web-css-token-build | 2 |
| B-11 Repo hygiene | 000003-stack-repo-hygiene | 0 |
| B-12 Staging/prod | 000005-infra-hosting-provision … 000011-infra-production-cd | 2, 3 |

---

## Phase 0 — Local baseline

**Tujuan fase:** clone bersih → `npm run setup && npm run verify` hijau di Node 24, satu lockfile, satu database dev.

| Task | Status | Verifikasi 2026-09-30 |
|------|--------|------------------------|
| 000001-stack-pin-node-runtime | Done | `.nvmrc`, `.node-version`, `.npmrc`, `engines` packages |
| 000002-stack-single-npm-lockfile | Done | Satu `package-lock.json`; yarn lock dihapus |
| 000003-stack-repo-hygiene | Done* | Commit `4bbc062`; `.gitignore`; no `.env`/`.db` tracked · *push remote belum |
| 000001-db-canonical-sqlite-path | Done | Satu `prisma/dev.db`; gate health ready PASS |
| 000004-stack-env-example | Done | TECH-STACK §5 + `EMAIL_*` di `.env.example` |
| 000002-db-root-scripts | Done | `db:migrate`, `db:migrate:deploy`, `db:reset`, `db:seed`, `db:studio` |
| 000005-stack-setup-script | Done | `scripts/setup.ts`; idempoten (tidak timpa `.env`) |
| 000006-stack-verify-script | Done | `npm run verify` exit 0; G0–G5 PASS |
| 000001-docs-dev-runbook | Done* | STACK-INTEGRATION + README · *uji onboarding ≤15 menit belum formal |

### 000001-stack-pin-node-runtime

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-01, PS-02 | — | `.nvmrc`, `.node-version`, `.npmrc` |

**Tahapan**
1. Tentukan versi Node 24.x minimum ≥ 24.3 (sama dengan `engines` root).
2. Buat `.nvmrc` dan `.node-version` di root `Agentic/` dengan versi tersebut.
3. Buat `.npmrc` berisi `engine-strict=true`.
4. Samakan `engines.node` di root, `apps/web`, `apps/api` (dan tambahkan ke `packages/*` bila belum ada).
5. Pasang Node 24 lokal via `nvm install && nvm use`.

**Verifikasi:** `node -v` = 24.x · `npm ci` di Node 20 gagal dengan pesan engine · `npm ci` di Node 24 sukses.

**Hasil:** `v24.3.0` · Node 20 → `EBADENGINE` · Node 24 → `npm ci` / `npm run verify` sukses.

### 000002-stack-single-npm-lockfile

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-03 | 000001-stack | Satu `package-lock.json` di root |

**Tahapan**
1. Hapus `yarn.lock` (root), `apps/web/yarn.lock`, `apps/web/package-lock.json`.
2. Hapus `node_modules` di root dan di workspace.
3. Jalankan `npm install` dari root di Node 24 untuk meregenerasi `package-lock.json`.
4. Bandingkan versi paket kunci (`remix`, `prisma`, `@prisma/client`, `tailwindcss`, `pdf-lib`) dengan sebelum regenerasi; catat perbedaan.
5. Jalankan `npm run test:domain`, `npm run typecheck`, `npm run gate`.

**Verifikasi:** hanya ada satu lockfile · gate G0–G5 tetap Pass.

**Hasil:** lockfile tunggal; gate via `npm run verify` PASS.

### 000003-stack-repo-hygiene

**Status:** Done (push ⏳) · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-05 (commit/remote), PS-06, PS-07 | 000002-stack | `.gitignore` final, initial commit · proteksi branch = Phase 1 |

**Tahapan**
1. Lengkapi `.gitignore`: `.DS_Store`, `*.db`, `*.db-journal`, `.env`, `.env.*`, `!.env.example`, `apps/web/public/app.css` (bila diputuskan artefak build), `docs/design/prototype/assets/ui.css` (bila diputuskan artefak build).
2. Hapus artefak tak terpakai: folder `ui-prototype/` (kosong), `packages/database/prisma/prisma/dev.db`, semua `.DS_Store`.
3. Pastikan `.env` lokal tidak ter-track (`git status`).
4. Buat initial commit di `main`.
5. Tambahkan remote GitHub dan push `main`.

**Verifikasi:** `git status` bersih setelah `npm run dev` · tidak ada `.env`/`.db` di `git ls-files`.

**Hasil:** initial commit `4bbc062`; `git ls-files` tanpa `.env`/`.db`/`yarn.lock` · **remote GitHub belum dikonfigurasi**.

### 000001-db-canonical-sqlite-path

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-13 | 000003-stack | Satu file `dev.db` dipakai migrate & runtime |

**Tahapan**
1. Tetapkan lokasi canonical: `packages/database/prisma/dev.db`.
2. Pahami resolusi path: URL SQLite relatif di Prisma diresolusi relatif ke lokasi `schema.prisma`; tentukan nilai `DATABASE_URL` untuk `packages/database/.env` sesuai aturan itu.
3. Samakan `DATABASE_URL` di `apps/web/.env` dan `apps/api/.env` agar mengarah ke file yang sama (atau muat dari satu `.env` root lewat script).
4. Hapus DB lama, jalankan `npm run db:migrate`.
5. Buat data lewat web (`/register`), lalu buka Prisma Studio.

**Verifikasi:** hanya ada satu `dev.db` · user yang dibuat di web tampil di Prisma Studio · `GET /api/health/ready` 200.

**Hasil:** `find` → satu `./packages/database/prisma/dev.db`; gate register + health PASS.

### 000002-db-root-scripts

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-14 | 000001-db | Script `db:migrate`, `db:reset`, `db:seed`, `db:studio` di root |

**Tahapan**
1. Tambahkan `db:reset` (drop + migrate) dan `db:seed` (placeholder yang aman bila seed belum ada — isi seed di 000003-db) di `packages/database/package.json`.
2. Ekspos keempat script di root `package.json` via `-w @invoicing/database`.
3. Pastikan `db:migrate` non-interaktif untuk CI (mis. `migrate deploy` untuk CI, `migrate dev` untuk lokal).

**Verifikasi:** keempat script jalan dari `Agentic/`.

**Hasil:** script root + `db:migrate:deploy` untuk setup/CI non-interaktif.

### 000004-stack-env-example

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-09 | 000001-db | `.env.example` lengkap di `apps/web`, `apps/api`, `packages/database` |

**Tahapan**
1. Inventaris variabel dari TECHNOLOGY-STACK §5 dan kode (`process.env.*`).
2. Tulis per file: `DATABASE_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN` (API), `API_BASE_URL` (web), `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`.
3. Beri komentar per variabel: wajib/opsional, per environment, nilai default dev.
4. Isi nilai dev aman (email `log`, `APP_URL=http://localhost:44100`).

**Verifikasi:** `rg "process.env\.\w+"` → setiap nama ada di `.env.example` terkait.

**Hasil:** variabel TECH-STACK §5 + `EMAIL_PROVIDER` tercatat; env dev-only HMR (`HMR_*`) sengaja tidak di example (internal dev).

### 000005-stack-setup-script

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-18 | 000004-stack, 000002-db | `npm run setup` |

**Tahapan**
1. Buat `scripts/setup.ts` (dijalankan via `tsx`).
2. Langkah script: cek versi Node → `npm install` bila `node_modules` belum ada → salin `.env.example` → `.env` bila belum ada → generate `SESSION_SECRET` dev acak → `db:migrate` → `db:seed` **no-op atau minimal** (seed penuh PS-15 = task `000003-db-seed-demo`, Phase 2).
3. Script idempoten: tidak menimpa `.env` yang sudah ada.
4. Tambahkan `"setup"` di root `package.json`.

**Verifikasi:** di folder hasil clone bersih, `npm run setup && npm run dev` → web `:44100` dan API `:44101` terbuka.

**Hasil:** `npm run setup` idempoten; port 44100/44101 sesuai runbook (uji `dev` manual belum diulang saat verifikasi ini).

### 000006-stack-verify-script

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-20, PS-43 | 000005-stack | `npm run verify` |

**Tahapan**
1. Definisikan urutan: `typecheck` → `test:domain` → `test` (web) → `css:build` → `design:css` → `gate` (sama dengan yang dijalankan CI lewat PS-23).
2. Tambahkan `"verify"` di root `package.json` (gagal di langkah pertama yang merah).
3. Jalankan dan perbaiki kegagalan non-fitur (konfigurasi, path, script).

**Verifikasi:** `npm run verify` exit 0 di Node 24 · `design:css` dan `css:build` gagal → verify merah (PS-43).

**Hasil:** exit 0 · urutan typecheck → test:domain → test web → css:build → design:css → gate (semua PASS).

### 000001-docs-dev-runbook

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-21, PS-46 | 000006-stack | STACK-INTEGRATION.md + README root diperbarui |

**Tahapan**
1. Tulis ulang alur di [STACK-INTEGRATION.md](../invoicing/engineering/STACK-INTEGRATION.md): prasyarat (nvm, Node 24), `npm run setup`, `npm run dev`, `npm run verify`, perintah DB, prototype.
2. Tabel port & URL: web 44100, API 44101, server prototype.
3. Bagian troubleshooting: engine mismatch, `IMPORT_OUTSIDE_MOUNTS`, DB path.
4. Samakan ringkasan di `README.md` root.
5. Uji dengan satu orang yang belum pernah setup; catat waktu.

**Verifikasi:** onboarding ≤ 15 menit tanpa bantuan.

**Hasil:** runbook + README diperbarui; **waktu onboarding belum diukur** dengan penguji independen (acceptance opsional).

### Gate PG-0 (PRD M0)

- [x] Node 24 terpasang dan ditegakkan (`engine-strict`) — PS-01, PS-02 · 2026-09-30
- [x] Satu `package-lock.json`, tanpa `yarn.lock` — PS-03 · 2026-09-30
- [x] Satu `dev.db`, dipakai migrate & runtime — PS-13 · 2026-09-30
- [x] `npm run setup && npm run verify` hijau (Node 24.3.0) — PS-18, PS-20, PS-43 · 2026-09-30
- [x] Initial commit ter-push ke `main` — PS-05 · remote `Inoeng85/invoicing-agentic` · 2026-09-30

**Kesimpulan PG-0:** **lulus** (2026-09-30) setelah push ke GitHub.

---

## Phase 1 — Continuous Integration

**Tujuan fase:** setiap PR diverifikasi otomatis dengan urutan yang sama dengan `npm run verify`; `main` terproteksi.

| Task | Status | Verifikasi |
|------|--------|------------|
| 000002-infra-ci-workflow-fix | Done | `ci.yml` — root path, `.nvmrc`, env CI, `db:migrate:deploy` |
| 000003-infra-ci-verify-pipeline | Done | Job menjalankan `npm run verify` |
| 000001-infra-github-repo-protection | Partial | Repo public · billing Actions · script `apply-branch-protection.sh` |

### 000001-infra-github-repo-protection

**Status:** Partial · 2026-09-30 (repo public; tunggu CI hijau + script)

| PS | Depends | Output |
|----|---------|--------|
| PS-05 (branch protection) | 000003-stack, PG-0 selesai | Branch protection `main` |

**Tahapan**
1. Aktifkan branch protection `main`: PR wajib, 1 approval (self-review OK untuk solo), larang force push.
2. Wajibkan status check CI (diaktifkan setelah 000003-infra hijau pertama kali).
3. Set default merge = squash.

**Verifikasi:** push langsung ke `main` ditolak.

**Hasil:** [.github/BRANCH_PROTECTION.md](../../../.github/BRANCH_PROTECTION.md) + `scripts/apply-branch-protection.sh`. CI GitHub terblokir **billing** (2026-09-30); fallback **`npm run ci:local`** PASS.

### 000002-infra-ci-workflow-fix

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-22, PS-24 | 000001-stack, 000002-stack | `.github/workflows/ci.yml` valid |

**Tahapan**
1. Hapus `defaults.run.working-directory: Agentic` (git root = `Agentic/`).
2. Ubah `cache-dependency-path` menjadi `package-lock.json`.
3. Ganti `node-version: '24'` dengan `node-version-file: .nvmrc`.
4. Ganti langkah salin `.env` dengan env CI eksplisit (`DATABASE_URL` DB test, `SESSION_SECRET` dummy, `EMAIL_PROVIDER=log`).
5. Gunakan migrasi non-interaktif (`migrate deploy`).

**Verifikasi:** workflow jalan di PR uji dan mencapai langkah test.

**Hasil:** `working-directory: Agentic` dihapus · `node-version-file: .nvmrc` · `cache-dependency-path: package-lock.json` · env per-step · `db:migrate:deploy`. Audit file: **PASS** (2026-09-30). Run GitHub: masih `startup_failure` (runner tidak start).

### 000003-infra-ci-verify-pipeline

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-23, PS-43 | 000002-infra, 000006-stack | CI = `npm run verify` (PS-43 terpenuhi oleh verify) |

**Tahapan**
1. Ganti langkah terpisah dengan `npm run verify` (sudah mencakup `css:build`, `design:css`, `test` web).
2. Pisahkan step agar log per tahap terbaca (opsional: step per sub-script).
3. Aktifkan status check wajib di branch protection (000001-infra).

**Verifikasi:** PR sengaja merusak CSS → CI merah · PR normal → CI hijau.

**Hasil:** satu step `npm run verify` (job name `verify`). Lokal dengan env CI: exit 0 · gate G0–G5 PASS (2026-09-30).

### Gate PG-1 (PRD M1)

- [ ] PR/run hijau di GitHub Actions — PS-22 · run terbaru `startup_failure` ([36661916437](https://github.com/Inoeng85/invoicing-agentic/actions/runs/36661916437))
- [x] CI membaca Node dari `.nvmrc` — PS-24 · 2026-09-30 (audit `ci.yml`)
- [x] CI **dikonfigurasi** menjalankan `npm run verify` — PS-23, PS-43 · 2026-09-30 · **paritas lokal verified**
- [ ] `main` terproteksi dengan status check wajib — PS-05 · **blocked** (private repo + Free → butuh public atau Pro)

**Kesimpulan PG-1:** implementasi Phase 1 **selesai di repo**; paritas lokal **`npm run ci:local`** (2026-09-30 PASS); gate formal terbuka sampai Actions runner + `./scripts/apply-branch-protection.sh`.

---

## Phase 2 — Staging

**Tujuan fase:** merge ke `main` → staging otomatis (SQLite + volume), env tervalidasi, log terstruktur, email sandbox, token design bersama.

| Task | Status | Catatan |
|------|--------|---------|
| 000002-docs-adr-platform-decisions | Done | `docs/0000_platform_setup/adr/ADR-0001…0004` Accepted |
| 000003-docs-branch-commit-convention | Done | `CONTRIBUTING.md` + PR template |
| 000007-stack-pin-dev-dependencies | Done | TS 7.0.2 · @types/node 22.15.30 · tailwind 4.3.3 |
| 000004-db-postgres-strategy | Superseded | SQLite-only · ADR-0001 revised · Postgres dihapus |
| 000001-be-env-validation | Done | `@invoicing/platform` bootstrap web/api |
| 000002-be-structured-logging-request-id | Done | JSON log + `X-Request-Id` middleware |
| 000003-be-email-adapter-selection | Done | `EMAIL_PROVIDER=log|resend` |
| 000003-db-seed-demo | Done | Studio Kartika idempoten |
| 000008-stack-doctor-script | Done | `npm run doctor` |
| 000001-fe-shared-design-tokens | Done | `packages/design-tokens/tokens.css` |
| 000002-fe-web-css-token-build | Done | `app.css` import token |
| 000004-infra-ci-performance | Done | npm cache di CI (existing) |
| 000005-infra-hosting-provision | Partial | `railway.toml`, env examples, LAUNCH-LANE · operator Railway |
| 000006-infra-domain-tls-cors | Pending | Butuh domain staging |
| 000007-infra-staging-cd | Partial | Railway redeploy + smoke + `workflow_run` setelah CI · butuh secrets |
| 000008-infra-email-provider-staging | Pending | Butuh Resend staging key |

### 000002-docs-adr-platform-decisions

| PS | Depends | Output |
|----|---------|--------|
| PS-48 | PG-1 | ADR Q-01…Q-04 di `docs/0000_platform_setup/adr/` |

**Tahapan**
1. ADR-0001 Q-01: strategi SQLite ↔ PostgreSQL dengan satu schema.
2. ADR-0002 Q-02: host staging/prod.
3. ADR-0003 Q-03: topologi web & API (dua service / subdomain).
4. ADR-0004 Q-04: lokasi token design bersama.
5. Review Engineering + Product; status Accepted.

**Verifikasi:** empat ADR berstatus Accepted sebelum 000004-db, 000005-infra, 000001-fe dimulai.

### 000003-docs-branch-commit-convention

| PS | Depends | Output |
|----|---------|--------|
| PS-08 | 000001-infra | `CONTRIBUTING.md` |

**Tahapan**
1. Tulis konvensi branch `feature/*`, `fix/*`, `release/*` (ARCH §16.1).
2. Format commit `type(scope): FR/US ringkas`.
3. Aturan tag SemVer `v0.1.0` dan changelog.
4. Tambahkan template PR (checklist: verify hijau, FR/PS terkait).

**Verifikasi:** PR berikutnya memakai template.

### 000007-stack-pin-dev-dependencies

| PS | Depends | Output |
|----|---------|--------|
| PS-04 | 000002-stack | Tanpa `latest` di `package.json` |

**Tahapan**
1. Ganti `typescript: latest` dan `@types/node: latest` dengan versi eksplisit di semua workspace.
2. Samakan versi `tailwindcss`/`@tailwindcss/cli` root dan `apps/web`.
3. Regenerasi lockfile, jalankan `npm run verify`.

**Verifikasi:** `rg '"latest"' --glob package.json` kosong.

### 000001-be-env-validation

| PS | Depends | Output |
|----|---------|--------|
| PS-10 | 000004-stack | Modul validasi env dipakai web & API saat boot |

**Tahapan**
1. Buat modul config bersama (mis. `packages/domain/src/config.ts` atau package `config`) yang membaca & memvalidasi env.
2. Definisikan aturan per `NODE_ENV`: production wajib `SESSION_SECRET`, `APP_URL`, `DATABASE_URL`, `EMAIL_*` bila provider ≠ log.
3. Panggil saat start `apps/web/server.ts` dan `apps/api/src/server.ts`; gagal cepat dengan daftar variabel yang hilang.
4. Jangan ubah logic domain/fitur; hanya membaca config.

**Verifikasi:** start production tanpa `SESSION_SECRET` → exit ≠ 0 dengan nama variabel · dev tetap jalan dengan default.

### 000002-be-structured-logging-request-id

| PS | Depends | Output |
|----|---------|--------|
| PS-33, PS-34 | 000001-be | Middleware log JSON + `X-Request-Id` di web & API |

**Tahapan**
1. Buat middleware request ID: pakai header `X-Request-Id` masuk atau generate; set di respons.
2. Buat logger JSON (stdout) dengan field `requestId`, `method`, `path`, `status`, `durationMs`.
3. Pasang di router API (ganti/lengkapi `remix/middleware/logger`) dan router web.
4. Mode dev boleh pretty-print; production JSON lines.

**Verifikasi:** setiap respons punya `X-Request-Id` · log staging bisa difilter per `requestId`.

### 000003-be-email-adapter-selection

| PS | Depends | Output |
|----|---------|--------|
| PS-40 | 000001-be | Pemilihan adapter via `EMAIL_PROVIDER` |

**Tahapan**
1. Saat boot, baca `EMAIL_PROVIDER` (`log` | `resend`).
2. `log`: pertahankan adapter default.
3. `resend`: daftarkan adapter via `setEmailSender` memakai `EMAIL_API_KEY`, `EMAIL_FROM`.
4. Jangan mengubah `sendInvoice` atau alur kirim.

**Verifikasi:** local/CI tetap log · staging dengan `resend` mengirim email uji.

### 000003-db-seed-demo

| PS | Depends | Output |
|----|---------|--------|
| PS-15 | 000002-db | `npm run db:seed` idempoten |

**Tahapan**
1. Buat `packages/database/prisma/seed.ts` memakai fungsi domain yang ada (bukan logic baru).
2. Data: user demo Dewi Kartika / Studio Kartika + profil bisnis; klien PT Arunika Digital, CV Nusantara Kreatif, Budi Santoso (tanpa email), Yayasan Cerdas Bangsa; invoice status draft, sent, overdue, paid.
3. Idempoten: upsert berdasarkan email user demo.
4. Kredensial demo hanya untuk local/staging (dari env).

**Verifikasi:** `db:seed` dua kali → data tidak ganda · dashboard menampilkan outstanding.

### 000004-db-postgres-strategy

| PS | Depends | Output |
|----|---------|--------|
| PS-16 | 000002-docs (ADR-0001) | Skema & migrasi untuk PostgreSQL |

**Tahapan**
1. Implementasikan keputusan ADR-0001 (mis. Postgres lokal native atau schema per provider).
2. Buat baseline migrasi PostgreSQL dari schema yang sama.
3. Cek tipe yang berbeda perilaku (enum `InvoiceStatus`, `Float` untuk `quantity`/`ppnRate`, `DateTime`).
4. Tambahkan job CI matrix/terpisah: `migrate deploy` + `gate` terhadap Postgres service.

**Verifikasi:** `gate` G0–G5 Pass terhadap PostgreSQL.

### 000008-stack-doctor-script

| PS | Depends | Output |
|----|---------|--------|
| PS-19 | 000001-be | `npm run doctor` |

**Tahapan**
1. Buat `scripts/doctor.ts`.
2. Cek: versi Node, satu lockfile, `.env` ada, env wajib (pakai modul 000001-be), DB reachable, port 44100/44101 bebas.
3. Output PASS/FAIL per cek; exit ≠ 0 bila ada FAIL.
4. Tautkan dari troubleshooting runbook.

**Verifikasi:** matikan DB / ubah Node → doctor FAIL dengan pesan tepat.

### 000004-infra-ci-performance

| PS | Depends | Output |
|----|---------|--------|
| PS-25 | 000003-infra | CI < 10 menit |

**Tahapan**
1. Aktifkan cache npm & Prisma engine.
2. Paralelkan job independen (typecheck vs test) bila bermanfaat.
3. Catat durasi median 5 run.

**Verifikasi:** median < 10 menit.

### 000005-infra-hosting-provision

| PS | Depends | Output |
|----|---------|--------|
| PS-27, PS-11 | 000002-docs (ADR-0002, ADR-0003) | Project staging di host terpilih |

**Tahapan**
1. Buat project/app staging untuk `web` dan `api` (Node 24).
2. Provision PostgreSQL managed staging.
3. Isi secret store staging: `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN`, `API_BASE_URL`, `EMAIL_*`.
4. Pastikan `.env` tidak masuk image/build; secret di-inject saat runtime.

**Verifikasi:** audit `git grep` & isi image tanpa secret.

### 000006-infra-domain-tls-cors

| PS | Depends | Output |
|----|---------|--------|
| PS-31 | 000005-infra | Domain HTTPS staging |

**Tahapan**
1. Tetapkan domain staging web dan API (sesuai ADR-0003).
2. Aktifkan TLS (host atau reverse proxy).
3. Set `APP_URL` = URL web HTTPS; `CORS_ORIGIN` = origin web.

**Verifikasi:** `https://<staging-web>/i/:token` dari email uji bisa dibuka · request web → API lolos CORS.

### 000007-infra-staging-cd

| PS | Depends | Output |
|----|---------|--------|
| PS-28, PS-35 | 000004-db, 000006-infra | Deploy otomatis `main` → staging |

**Tahapan**
1. Workflow deploy on push `main` (setelah CI hijau).
2. Langkah: `npm ci` → `prisma generate` → `css:build` → `prisma migrate deploy` → start web & API.
3. Health check host: liveness `/api/health/live`, readiness `/api/health/ready`.
4. Smoke setelah deploy: `GET /api/health/ready` = 200, gagal → tandai deploy gagal.
5. Jalankan `db:seed` demo sekali di staging.

**Verifikasi:** merge PR → staging hijau tanpa langkah manual, < 15 menit.

### 000008-infra-email-provider-staging

| PS | Depends | Output |
|----|---------|--------|
| PS-38, PS-39 (staging) | 000005-infra, 000003-be | Resend staging aktif |

**Tahapan**
1. Buat akun/workspace Resend; API key staging terpisah.
2. Set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` di secret staging.
3. Batasi penerima ke allowlist QA (fitur provider atau domain uji).

**Verifikasi:** kirim invoice demo di staging → email tiba di inbox QA; alamat di luar allowlist tidak menerima.

### 000001-fe-shared-design-tokens

| PS | Depends | Output |
|----|---------|--------|
| PS-41 | 000002-docs (ADR-0004) | File token bersama |

**Tahapan**
1. Ekstrak dari `docs/design/prototype/src/tailwind.css`: `:root`, `.dark`, `@theme inline`, `@layer components`.
2. Pindahkan ke lokasi ADR-0004 (mis. `packages/design-tokens/tokens.css`).
3. Ubah `docs/design/prototype/src/tailwind.css` agar meng-import file tersebut.
4. Rebuild prototype (`npm run design:css`) dan bandingkan visual layar utama.

**Verifikasi:** prototype tampil identik sebelum/sesudah ekstraksi.

### 000002-fe-web-css-token-build

| PS | Depends | Output |
|----|---------|--------|
| PS-42, PS-45 | 000001-fe | `apps/web/app/styles/app.css` meng-import token bersama |

**Tahapan**
1. Import token bersama di `app.css`, pertahankan `@layer base, rmx, app` (ARCH §12).
2. Map `--color-brand` lama ke `--primary` agar markup existing tetap benar.
3. Jangan ubah markup/layar (penerapan resep ke layar = pekerjaan fitur terpisah, G-07).
4. Jangan aktifkan `.dark` di app (D-11).
5. Catat ukuran `public/app.css` sebelum/sesudah.

**Verifikasi:** `npm run css:build` sukses · halaman web existing tidak berubah secara visual · tidak ada toggle dark.

### Gate PG-2 (PRD M2)

- [x] ADR-0001…0004 Accepted — PS-48
- [ ] Merge ke `main` → staging otomatis, `/api/health/ready` 200 (SQLite) — PS-28, PS-35
- [x] Gate G0–G5 Pass (SQLite) — PS-16 · `npm run verify`
- [x] Env tervalidasi saat boot; log JSON dengan `requestId` — PS-10, PS-33, PS-34 · `host:check` + boot
- [ ] Email sandbox staging diterima QA — PS-38, PS-39 (staging)
- [x] Prototype & web membangun dari token yang sama — PS-41, PS-42, PS-45
- [x] Seed demo tersedia untuk UAT — PS-15 · `npm run db:seed`

---

## Phase 3 — Production readiness

**Tujuan fase:** production siap menerima tag `v0.1.0` dengan backup, rollback, alert, dan runbook teruji.

| Task | Status | Catatan |
|------|--------|---------|
| 000010-infra-ci-gate-summary | Done | `.gate/*` + artifact CI · `GITHUB_STEP_SUMMARY` |
| 000003-fe-design-serve | Done | `npm run design:serve` :8765 |
| 000004-docs-ops-runbook | Done | [RUNBOOK-OPS.md](./RUNBOOK-OPS.md) |
| 000011-infra-production-cd | Partial | Railway redeploy + smoke on tag · butuh secrets production |
| 000009-infra-secret-rotation | Done | Runbook §4 |
| 000005-db-backup-restore | Done | Runbook §3 (prosedur; uji di host) |
| 000012-infra-rollback | Done | Runbook §2 |
| 000013-infra-proxy-rate-limit-ready | Done | `infra/proxy/Caddyfile.example` + `TRUST_PROXY` |
| 000014-infra-alerting-log-retention | Done | Runbook §6 |
| 000015-infra-email-domain-production | Done | Runbook §5 (DNS/Resend manual) |

### 000009-infra-secret-rotation

| PS | Depends | Output |
|----|---------|--------|
| PS-12 | 000005-infra | Prosedur rotasi teruji |

**Tahapan**
1. Tulis prosedur rotasi `SESSION_SECRET` (dampak: semua session logout) dan `EMAIL_API_KEY`.
2. Uji rotasi di staging; catat downtime & efek.
3. Masukkan ke runbook ops (000004-docs).

**Verifikasi:** rotasi staging sukses; app kembali health ready.

### 000005-db-backup-restore

| PS | Depends | Output |
|----|---------|--------|
| PS-17 | 000004-db | Backup harian prod + restore teruji |

**Tahapan**
1. Provision PostgreSQL production; aktifkan snapshot harian (RPO 24 jam).
2. Uji restore snapshot ke DB sementara.
3. Arahkan API sementara ke DB hasil restore; cek `/api/health/ready`.

**Verifikasi:** restore berhasil; waktu restore tercatat.

### 000010-infra-ci-gate-summary

| PS | Depends | Output |
|----|---------|--------|
| PS-26 | 000003-infra | Ringkasan gate di job summary |

**Tahapan**
1. Tulis hasil gate PASS/FAIL ke `$GITHUB_STEP_SUMMARY` (tanpa mengubah logika gate).
2. Unggah log gate sebagai artefak.

**Verifikasi:** reviewer melihat tabel hasil gate di halaman run.

### 000011-infra-production-cd

| PS | Depends | Output |
|----|---------|--------|
| PS-29 | 000007-infra, 000005-db | Deploy prod dari tag |

**Tahapan**
1. Environment `production` di GitHub dengan required reviewer.
2. Workflow on tag `v*.*.*`: build → approval → `migrate deploy` → deploy → smoke `/api/health/ready`.
3. Secret production terpisah dari staging.

**Verifikasi:** tag `v0.1.0-rc.1` → menunggu approval → deploy prod-like hijau.

### 000012-infra-rollback

| PS | Depends | Output |
|----|---------|--------|
| PS-30 | 000011-infra | Prosedur rollback teruji |

**Tahapan**
1. Mekanisme redeploy build/release sebelumnya di host.
2. Kebijakan migrasi: forward-only; rollback schema hanya bila `down` aman dan terdokumentasi.
3. Uji rollback satu kali di staging.

**Verifikasi:** rollback staging kembali ke versi sebelumnya dan health ready.

### 000013-infra-proxy-rate-limit-ready

| PS | Depends | Output |
|----|---------|--------|
| PS-32 | 000006-infra | Konfigurasi proxy siap limit |

**Tahapan**
1. Pastikan reverse proxy/host mendukung limit per IP untuk path `/i/*`.
2. Siapkan konfigurasi dengan nilai default konservatif (nilai final ditentukan tim fitur, G-05).
3. Pastikan IP klien asli diteruskan (`X-Forwarded-For`).

**Verifikasi:** uji beban ringan di staging memicu limit.

### 000014-infra-alerting-log-retention

| PS | Depends | Output |
|----|---------|--------|
| PS-36, PS-37 | 000002-be, 000011-infra | Alert & retensi log |

**Tahapan**
1. Alert: readiness gagal > 2 menit; 5xx > 5% / 5 menit; lonjakan error email.
2. Tetapkan channel notifikasi & on-call owner.
3. Retensi log 30 hari di host/agregator.

**Verifikasi:** alert uji (matikan DB staging) terkirim ke channel.

### 000015-infra-email-domain-production

| PS | Depends | Output |
|----|---------|--------|
| PS-39 (prod) | 000008-infra | Domain pengirim terverifikasi |

**Tahapan**
1. Tambahkan DNS SPF, DKIM, DMARC untuk domain pengirim.
2. Verifikasi domain di Resend; API key production terpisah.
3. Set `EMAIL_FROM` production ke domain terverifikasi.

**Verifikasi:** email uji production lolos SPF/DKIM (cek header) dan tidak masuk spam.

### 000003-fe-design-serve

| PS | Depends | Output |
|----|---------|--------|
| PS-44 | 000001-fe | `npm run design:serve` |

**Tahapan**
1. Tambahkan script server statis untuk `docs/design/prototype` pada port terdokumentasi (mis. 8765).
2. Jalankan `design:css` sebelum serve.
3. Dokumentasikan di runbook dev.

**Verifikasi:** `npm run design:serve` → prototype terbuka di browser.

### 000004-docs-ops-runbook

| PS | Depends | Output |
|----|---------|--------|
| PS-47 | 000009-infra, 000005-db, 000012-infra, 000014-infra | `docs/0000_platform_setup/RUNBOOK-OPS.md` |

**Tahapan**
1. Bagian deploy staging & production (alur tag + approval).
2. Rollback, restore backup, rotasi secret.
3. Respons alert: readiness gagal, 5xx, email error.
4. Kontak owner & akses (host, DB, provider email, DNS).

**Verifikasi:** simulasi insiden di staging diselesaikan hanya dengan runbook.

### Gate PG-3 (PRD M3)

- [ ] Tag `v0.1.0-rc` ter-deploy ke prod-like dengan approval — PS-29
- [ ] Backup harian aktif; restore teruji — PS-17
- [ ] Rollback teruji — PS-30
- [ ] Alert teruji; retensi log 30 hari — PS-36, PS-37
- [ ] Domain email production terverifikasi (SPF/DKIM/DMARC) — PS-39 (prod)
- [ ] Runbook ops lengkap — PS-47 · rotasi secret — PS-12

---

## Matriks task ↔ PS

Pemetaan lengkap PS→task juga ada di [PRD §7.2](./prd_platform_setup.md#72-pemetaan-requirement--task).

| Task | PS | Fase |
|------|----|------|
| 000001-stack-pin-node-runtime | PS-01, PS-02 | 0 |
| 000002-stack-single-npm-lockfile | PS-03 | 0 |
| 000003-stack-repo-hygiene | PS-05 (commit), PS-06, PS-07 | 0 |
| 000004-stack-env-example | PS-09 | 0 |
| 000005-stack-setup-script | PS-18 | 0 |
| 000006-stack-verify-script | PS-20, PS-43 | 0 |
| 000007-stack-pin-dev-dependencies | PS-04 | 2 |
| 000008-stack-doctor-script | PS-19 | 2 |
| 000001-db-canonical-sqlite-path | PS-13 | 0 |
| 000002-db-root-scripts | PS-14 | 0 |
| 000003-db-seed-demo | PS-15 | 2 |
| 000004-db-postgres-strategy | PS-16 | 2 |
| 000005-db-backup-restore | PS-17 | 3 |
| 000001-be-env-validation | PS-10 | 2 |
| 000002-be-structured-logging-request-id | PS-33, PS-34 | 2 |
| 000003-be-email-adapter-selection | PS-40 | 2 |
| 000001-fe-shared-design-tokens | PS-41 | 2 |
| 000002-fe-web-css-token-build | PS-42, PS-45 | 2 |
| 000003-fe-design-serve | PS-44 | 3 |
| 000001-infra-github-repo-protection | PS-05 (proteksi) | 1 |
| 000002-infra-ci-workflow-fix | PS-22, PS-24 | 1 |
| 000003-infra-ci-verify-pipeline | PS-23, PS-43 | 1 |
| 000004-infra-ci-performance | PS-25 | 2 |
| 000005-infra-hosting-provision | PS-11, PS-27 | 2 |
| 000006-infra-domain-tls-cors | PS-31 | 2 |
| 000007-infra-staging-cd | PS-28, PS-35 | 2 |
| 000008-infra-email-provider-staging | PS-38, PS-39 | 2 |
| 000009-infra-secret-rotation | PS-12 | 3 |
| 000010-infra-ci-gate-summary | PS-26 | 3 |
| 000011-infra-production-cd | PS-29 | 3 |
| 000012-infra-rollback | PS-30 | 3 |
| 000013-infra-proxy-rate-limit-ready | PS-32 | 3 |
| 000014-infra-alerting-log-retention | PS-36, PS-37 | 3 |
| 000015-infra-email-domain-production | PS-39 | 3 |
| 000001-docs-dev-runbook | PS-21, PS-46 | 0 |
| 000002-docs-adr-platform-decisions | PS-48 | 2 |
| 000003-docs-branch-commit-convention | PS-08 | 2 |
| 000004-docs-ops-runbook | PS-47 | 3 |

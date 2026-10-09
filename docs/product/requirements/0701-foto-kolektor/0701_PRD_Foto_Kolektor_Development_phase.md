# PRD-0701 — Foto Profil Kolektor · Development Phase (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Upload foto asli kolektor (BLOB SQLite, ≤ 1 MB, JPG/PNG/WebP) dan tampilkan sebagai avatar di panel Penagihan.

**Architecture:** Tabel `DebtCollectorPhoto` terpisah + `DebtCollector.photoUpdatedAt`; validasi & deteksi tipe di `@invoicing/domain`; tiga route web di `routes.collectorActions`; komponen `collectorAvatar`.

**Tech Stack:** Prisma 6 `Bytes` (SQLite BLOB), Remix 3, `node:test`, `remix/test`.

**Spec:** [0701_PRD_Foto_Kolektor.md](0701_PRD_Foto_Kolektor.md)

## Global Constraints

- Branch `feat/0700-debt-collector` (lanjutan epic 0700, belum di-merge).
- `nvm use` (Node ≥ 24.3); npm workspaces; gate = `npm run typecheck && npm run test:domain && npm test`.
- Batas file `MAX_COLLECTOR_PHOTO_BYTES = 1_000_000`; batas request `MAX_PHOTO_REQUEST_BYTES = 1_100_000`.
- Tipe hanya dari magic bytes; MIME dari browser diabaikan.
- Migration dibuat dengan `prisma migrate diff --from-migrations … --shadow-database-url` lalu `migrate deploy` (lihat ruling Task 1 PRD-0700: `migrate dev` interaktif macet di non-TTY).
- Web test yang menyentuh DB mengimpor `@invoicing/domain/test-setup` lebih dulu (temp DB).
- Commit per task, conventional commits, `git add` file spesifik.

## Review Focus

1. File PNG diunggah dengan MIME `image/jpeg` → disimpan sebagai `image/png` (Task 2).
2. File SVG/HTML berekstensi `.png` → ditolak `photo_invalid_type` (Task 2).
3. Request tanpa `Content-Length` atau > 1,1 MB → ditolak tanpa parse body (Task 3).
4. Foto kolektor user lain via URL langsung → 404 (Task 2, Task 3).
5. `listCollectors`/`getInvoiceCollection` tidak membawa bytes foto (Task 2).

---

### Task 1: Schema + migration

**Files:** Modify `packages/database/prisma/schema.prisma`, `packages/database/src/index.ts`; Create `packages/database/prisma/migrations/20260930130000_collector_photo/migration.sql`.

**Produces:** `prisma.debtCollectorPhoto`; `DebtCollector.photoUpdatedAt: Date | null`; type export `DebtCollectorPhoto`.

- [ ] Tambah `photoUpdatedAt DateTime? @map("photo_updated_at")` dan `photo DebtCollectorPhoto?` ke `DebtCollector`; tambah model `DebtCollectorPhoto` persis seperti spec §Data.
- [ ] Generate SQL: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url file:<tmp> --script > prisma/migrations/20260930130000_collector_photo/migration.sql` (cwd `packages/database`). Expected: `ALTER TABLE "debt_collectors" ADD COLUMN "photo_updated_at"` + `CREATE TABLE "debt_collector_photos"`.
- [ ] `npx prisma migrate deploy && npx prisma generate`; export `DebtCollectorPhoto` type.
- [ ] `npm run typecheck` → exit 0. Commit `feat(database): add collector photo storage`.

### Task 2: Domain `collector-photos.ts`

**Files:** Create `packages/domain/src/collector-photos.ts`, `packages/domain/src/collector-photos.test.ts`; Modify `packages/domain/src/index.ts`, `packages/domain/src/test-fixtures.ts` (export `PNG_BYTES`, `JPEG_BYTES`, `WEBP_BYTES` sample headers).

**Produces (exported):** `MAX_COLLECTOR_PHOTO_BYTES`, `detectImageType(bytes: Uint8Array): CollectorPhotoMimeType | null`, `setCollectorPhoto(userId, collectorId, bytes: Uint8Array): Promise<DebtCollector>`, `removeCollectorPhoto(userId, collectorId): Promise<DebtCollector>`, `getCollectorPhoto(userId, collectorId): Promise<{ bytes: Uint8Array; mimeType: string; updatedAt: Date }>`.

- [ ] Tests first (`collector-photos.test.ts`, imports `./test-setup.ts` first):
  - detects JPEG / PNG / WebP from sample bytes; returns null for `<svg …>` text and empty array
  - `setCollectorPhoto` stores PNG → `getCollectorPhoto` returns identical bytes + `image/png`; collector `photoUpdatedAt` set
  - replacing with JPEG changes `mimeType` and bumps `photoUpdatedAt`
  - 1_000_001 bytes with PNG header → `photo_too_large`; SVG bytes → `photo_invalid_type`
  - other user: set → `collector_not_found`; get → `photo_not_found`
  - remove → `photoUpdatedAt` null, get → `photo_not_found`; remove twice is fine
  - `listCollectors` rows have no `photo` key
- [ ] Run `npm run test:domain` → FAIL (module missing).
- [ ] Implement:

```ts
export function detectImageType(bytes: Uint8Array): CollectorPhotoMimeType | null {
  let at = (offset: number, signature: number[]) => signature.every((b, i) => bytes[offset + i] === b)
  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp'
  return null
}
```

  `setCollectorPhoto`: size check → type check → `prisma.$transaction`: ownership `findFirst({ id, userId })` (404 `collector_not_found`) → `debtCollectorPhoto.upsert` → `debtCollector.update({ photoUpdatedAt: new Date() })`. `removeCollectorPhoto`: ownership → `deleteMany` → `photoUpdatedAt: null`. `getCollectorPhoto`: `debtCollectorPhoto.findFirst({ where: { collectorId, collector: { userId } } })` → 404 `photo_not_found`.
- [ ] `npm run test:domain && npm run typecheck` → pass. Commit `feat(domain): store and validate collector photos (FR-14h)`.

### Task 3: Web upload / serve / delete routes + edit page

**Files:** Modify `apps/web/app/routes.ts` (`collectorActions.photo|uploadPhoto|deletePhoto`), `apps/web/app/actions/collectors/controller.tsx`, `apps/web/app/actions/controller.test.ts`; Create `apps/web/app/ui/collector-avatar.tsx`.

**Produces:** `collectorAvatar(collector: { id: string; name: string; photoUpdatedAt: Date | null }, sizeClass?: string): RemixNode`.

- [ ] Web tests first: signed-in multipart upload of PNG → 303 `Location` contains `notice=photo_saved`; `GET` photo → 200, `Content-Type: image/png`, `X-Content-Type-Options: nosniff`, bytes equal; request with `Content-Length: 5000000` → `notice=photo_too_large`; anonymous `GET` photo → 302 login; other user's `GET` photo → 404.
- [ ] Run `npm test` → FAIL (`routes.collectorActions.photo` undefined).
- [ ] Implement actions in `collectorActionsController`:
  - `photo`: `getCollectorPhoto` → `new Response(Buffer.from(bytes), { headers: { 'Content-Type', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=86400' } })`; `photo_not_found` → 404.
  - `uploadPhoto`: `let length = Number(request.headers.get('Content-Length'))`; `!length || length > MAX_PHOTO_REQUEST_BYTES` → redirect edit `?notice=photo_too_large` **before** `assertCsrf`/`formData()`; then CSRF, `formData.get('photo')` must be non-empty `File` else `photo_missing`; `setCollectorPhoto` → `photo_saved` or `?notice=<code>`.
  - `deletePhoto`: CSRF → `removeCollectorPhoto` → `photo_removed`.
- [ ] Edit page: pass `notice` + collector `photoUpdatedAt`; add "Foto" card (separate multipart form with `CsrfInput`, file input, preview via `collectorAvatar(..., 'size-16')`, "Hapus foto" form when photo exists). New notices: `photo_saved`, `photo_removed`, `photo_too_large`, `photo_invalid_type`, `photo_missing`.
- [ ] `npm test && npm run typecheck` → pass. Commit `feat(web): upload, serve and delete collector photos`.

### Task 4: Avatar di panel Penagihan

**Files:** Modify `apps/web/app/ui/collection-panel.tsx`, `apps/web/app/actions/controller.test.ts`.

- [ ] Test first: invoice detail with assigned collector **without** photo contains initials avatar and no `/photo?v=`; after `setCollectorPhoto`, contains `<img` with `/collectors/<id>/photo?v=` and collector email.
- [ ] Run → FAIL.
- [ ] Active block: `flex items-center gap-3` with `collectorAvatar(active.collector, 'size-10')`, name, `[email, phone].filter(Boolean).join(' · ')`, commission line. History rows: `collectorAvatar(assignment.collector, 'size-6')` before name.
- [ ] `npm test && npm run typecheck` → pass. Commit `feat(web): show collector avatar in collection panel`.

### Task 5: Docs

- [ ] `docs/product/requirements/README.md`: row `| 13 | **0701** | [0701-foto-kolektor](.) | G7 | FR-14h foto kolektor | 0700 |`.
- [ ] Spec status → `Implemented`.
- [ ] `docs/product/legal/LEGAL-REVIEW-CHECKLIST.md` L-6: tambahkan "foto kolektor (data pribadi, disimpan di DB)".
- [ ] Full verify: `npm run typecheck && npm run test:domain && npm test && npm run gate` → all pass. Commit `docs(prd): document collector photo (PRD-0701)`.

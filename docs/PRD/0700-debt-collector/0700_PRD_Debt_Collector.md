# PRD-0700 — Debt Collector (FR-14)

| Meta | Nilai |
|------|-------|
| ID | **0700** |
| Prioritas dev | **12** (post-MVP, setelah 0600) |
| Gate | **G7** |
| FR | **FR-14** |
| BR | **BR-07, BR-08, BR-09** |
| Status | Implemented |
| Development phase | [0700_PRD_Debt_Collector_Development_phase.md](./0700_PRD_Debt_Collector_Development_phase.md) |

## Ringkasan

Freelancer dapat mencatat **debt collector** (kolektor penagihan) sebagai kontak, meng-assign kolektor ke **invoice outstanding** (`sent` / `overdue`), mencatat **log aktivitas penagihan**, dan melihat **komisi** kolektor yang dihitung otomatis saat invoice ditandai lunas.

Kolektor adalah **data kontak milik freelancer, bukan user**. Kolektor tidak login, tidak menerima email dari sistem, dan tidak punya akses ke aplikasi. Dengan begitu non-goal *multi-user* di [MVP-SCOPE-LOCK.md](../../invoicing/brd/MVP-SCOPE-LOCK.md) tetap berlaku.

## Keputusan desain

| # | Keputusan | Alasan |
|---|-----------|--------|
| D-01 | Kolektor = kontak, scoped `userId` (pola sama dengan Klien) | Tidak membuka multi-user / role / auth baru |
| D-02 | Tabel `CollectionAssignment` terpisah (bukan kolom `collectorId` di `Invoice`) | Riwayat reassign + snapshot komisi tersimpan tanpa menggemukkan `Invoice` |
| D-03 | Maksimal **satu assignment aktif** per invoice | Tanggung jawab penagihan jelas |
| D-04 | Rate komisi di-**snapshot** saat assign | Perubahan rate kolektor tidak mengubah invoice lama |
| D-05 | Basis komisi = `totalCents` invoice (termasuk PPN), `Math.round` ke sen (pola sama dengan PPN) | Kolektor menagih total yang tertera di invoice |
| D-06 | Komisi hanya **ditampilkan** — tidak ada pencatatan pembayaran komisi | YAGNI; payout di luar sistem |
| D-07 | Log aktivitas **append-only** (tidak ada edit/hapus) | Audit trail penagihan |
| D-08 | Kolektor tidak pernah tampil di halaman publik `/i/:token` maupun PDF | Data internal freelancer |

## Requirement

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-14a | CRUD kolektor | Tambah, edit, nonaktifkan (bukan hard delete) |
| FR-14b | Komisi default | `commissionRate` per kolektor, input UI 0–100% (maks 2 desimal) |
| FR-14c | Assign / reassign / unassign | Hanya invoice `sent`/`overdue`; riwayat tersimpan |
| FR-14d | Log penagihan | Tanggal, hasil (enum), catatan opsional — pada assignment aktif |
| FR-14e | Komisi terhitung | Saat `paid`, `commissionCents` dikunci di assignment aktif |
| FR-14f | Filter | List invoice dapat difilter per kolektor |
| FR-14g | Ringkasan kolektor | Jumlah & nilai invoice aktif, total komisi dari invoice lunas |

## Business rules

- **BR-07 — Assignment hanya untuk outstanding.** Assign/reassign/unassign dan tambah aktivitas hanya jika invoice berstatus `sent` atau `overdue`. Kolektor harus milik user yang sama dan `active`.
- **BR-08 — Komisi di-snapshot dan dikunci saat lunas.** `rateSnapshot` diambil dari `commissionRate` kolektor saat assign. Ketika invoice ditandai `paid`, assignment aktif ditutup (`endReason = paid`) dan `commissionCents = round(totalCents × rateSnapshot)`. Ketika invoice `cancelled`, assignment aktif ditutup (`endReason = cancelled`) tanpa komisi.
- **BR-09 — Kolektor dengan assignment aktif tidak bisa dinonaktifkan.** Harus di-unassign/reassign dulu; riwayat assignment lama tetap tersimpan setelah kolektor nonaktif.

## Desain

### 1. Model data (`packages/database/prisma/schema.prisma`)

```prisma
model DebtCollector {
  id             String                 @id @default(cuid())
  userId         String                 @map("user_id")
  user           User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String?
  phone          String?
  notes          String?
  commissionRate Float                  @default(0) @map("commission_rate") // fraksi 0–1, pola sama dengan ppnRate
  active         Boolean                @default(true)
  createdAt      DateTime               @default(now()) @map("created_at")
  updatedAt      DateTime               @updatedAt @map("updated_at")
  assignments    CollectionAssignment[]

  @@index([userId])
  @@map("debt_collectors")
}

enum AssignmentEndReason {
  reassigned
  unassigned
  paid
  cancelled
}

model CollectionAssignment {
  id              String               @id @default(cuid())
  userId          String               @map("user_id")
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoiceId       String               @map("invoice_id")
  invoice         Invoice              @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  collectorId     String               @map("collector_id")
  collector       DebtCollector        @relation(fields: [collectorId], references: [id])
  rateSnapshot    Float                @map("rate_snapshot")
  assignedAt      DateTime             @default(now()) @map("assigned_at")
  endedAt         DateTime?            @map("ended_at")
  endReason       AssignmentEndReason? @map("end_reason")
  commissionCents Int?                 @map("commission_cents")
  activities      CollectionActivity[]

  @@index([invoiceId, endedAt])
  @@index([collectorId, endedAt])
  @@index([userId])
  @@map("collection_assignments")
}

enum CollectionOutcome {
  contacted
  no_response
  promised_to_pay
  partial_payment_reported
  refused
  other
}

model CollectionActivity {
  id           String               @id @default(cuid())
  assignmentId String               @map("assignment_id")
  assignment   CollectionAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  occurredAt   DateTime             @map("occurred_at")
  outcome      CollectionOutcome
  note         String?
  createdAt    DateTime             @default(now()) @map("created_at")

  @@index([assignmentId])
  @@map("collection_activities")
}
```

Relasi balik ditambahkan: `User.debtCollectors`, `User.collectionAssignments`, `Invoice.collectionAssignments`.

**Invariant D-03 ditegakkan di domain, bukan DB.** Partial unique index SQLite (`WHERE ended_at IS NULL`) tidak bisa diekspresikan di Prisma schema dan akan terbaca sebagai drift oleh `prisma migrate`. Semua mutasi assignment berjalan dalam satu `prisma.$transaction`; SQLite menserialisasi transaksi tulis, jadi cek-lalu-tulis di dalam transaksi aman.

`partial_payment_reported` hanya catatan — tidak mengubah status invoice (pembayaran parsial di luar scope).

### 2. Domain (`packages/domain/src/`)

**File baru `collectors.ts`** — pola sama dengan `clients.ts`:

| Fungsi | Perilaku |
|--------|----------|
| `listCollectors(userId, includeInactive?)` | Urut `name` asc |
| `getCollector(userId, id)` | 404 `collector_not_found` |
| `createCollector(userId, input)` | Validasi nama wajib, email (jika diisi) mengandung `@`, rate 0–1 |
| `updateCollector(userId, id, input)` | Validasi sama; perubahan rate **tidak** mengubah assignment aktif (D-04) |
| `setCollectorActive(userId, id, active)` | `active=false` + ada assignment aktif → 409 `collector_has_active_assignments` (BR-09) |
| `listCollectorSummaries(userId)` | Semua kolektor (termasuk nonaktif) + `activeCount`, `activeOutstandingCents`, `earnedCommissionCents` — untuk halaman list |
| `getCollectorSummary(userId, id)` | `activeCount`, `activeOutstandingCents`, `earnedCommissionCents` (sum `commissionCents` dengan `endReason = paid`) |

**File baru `collections.ts`:**

| Fungsi | Perilaku |
|--------|----------|
| `assignCollector(userId, invoiceId, collectorId)` | Dalam transaksi: invoice milik user & `sent`/`overdue` (else 409 `invoice_not_outstanding`); kolektor milik user & aktif (404 / 409 `collector_inactive`); assignment aktif ke kolektor yang sama → 409 `already_assigned`; ke kolektor lain → tutup dengan `reassigned`; buat assignment baru dengan `rateSnapshot` |
| `unassignCollector(userId, invoiceId)` | Invoice outstanding; tidak ada assignment aktif → 409 `no_active_assignment`; tutup dengan `unassigned` |
| `addCollectionActivity(userId, invoiceId, input)` | Invoice outstanding + assignment aktif wajib; `outcome` harus nilai enum (400 `invalid_outcome`); `occurredAt` tidak boleh di masa depan (400 `invalid_occurred_at`) |
| `getInvoiceCollection(userId, invoiceId)` | Assignment aktif + riwayat (desc) + aktivitas per assignment |
| `closeActiveAssignmentInTx(tx, invoiceId, reason, totalCents?)` | Internal; dipakai `markInvoicePaid` & `cancelInvoice` |

**Fungsi murni baru di `invoiceTotals.ts`:** `computeCommissionCents(totalCents, rate) = Math.round(totalCents * rate)` — diuji unit.

**Perubahan `invoices.ts`:**
- `markInvoicePaid` dan `cancelInvoice` pindah ke `prisma.$transaction`: `updateMany` dengan filter `status in ['sent','overdue']` (sekaligus menutup race cek-lalu-tulis yang ada sekarang), lalu `closeActiveAssignmentInTx` dengan `paid` / `cancelled`.
- `listInvoices(userId, status?, collectorId?)` — filter invoice yang punya assignment aktif ke `collectorId`; include kolektor aktif untuk kolom tabel.
- `getInvoiceByPublicToken` & `buildInvoicePdfBytes` **tidak** meng-include data penagihan (D-08).

Kode error baru di `DomainError`: `collector_not_found` 404, `collector_inactive` 409, `collector_has_active_assignments` 409, `invoice_not_outstanding` 409, `already_assigned` 409, `no_active_assignment` 409, `invalid_commission_rate` 400, `invalid_outcome` 400, `invalid_occurred_at` 400.

Semua export baru lewat `packages/domain/src/index.ts`.

### 3. API (`apps/api`)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/v1/collectors` | List (termasuk nonaktif) |
| POST | `/api/v1/collectors` | Create → 201 |
| GET | `/api/v1/collectors/:id` | Detail + summary |
| PATCH | `/api/v1/collectors/:id` | Update (termasuk `active`) |
| DELETE | `/api/v1/collectors/:id` | Nonaktifkan (BR-09) |
| GET | `/api/v1/invoices/:id/collection` | Assignment aktif + riwayat + aktivitas |
| POST | `/api/v1/invoices/:id/collection/assign` | Body `{ collectorId }` |
| POST | `/api/v1/invoices/:id/collection/unassign` | — |
| POST | `/api/v1/invoices/:id/collection/activities` | Body `{ occurredAt, outcome, note? }` → 201 |
| GET | `/api/v1/invoices?collectorId=` | Filter tambahan pada list yang ada |

Controller baru `collectors.controller.tsx` dan `collection.controller.tsx`, pola `handleDomain` + `requireUserId` yang ada. `commissionRate` di API berupa fraksi (0–1), konsisten dengan `ppnRate`.

### 4. Web (`apps/web`)

- **Route baru:** `collectors` resources (`index, new, create, show, edit, update`, param `collectorId`) + `collectorSetActive` POST; `invoiceAssignCollector`, `invoiceUnassignCollector`, `invoiceAddCollectionActivity` POST di bawah `/invoices/:invoiceId/collection/…`. Semua POST memakai `assertCsrf`.
- **Nav:** item "Kolektor" di `ui/layout.tsx` setelah "Klien".
- **`/collectors`:** tabel nama, kontak, komisi %, invoice aktif, outstanding, komisi diperoleh, status; tombol nonaktif/aktifkan (error BR-09 ditampilkan sebagai notice).
- **`/collectors/:id`:** detail + summary + daftar invoice yang sedang ditagih (link ke detail invoice).
- **Form kolektor:** nama, email, telepon, catatan, komisi (%) — dikonversi ke fraksi di controller.
- **Detail invoice (`ui/invoice-detail.tsx`) — panel "Penagihan":**
  - `sent`/`overdue` tanpa kolektor: select kolektor aktif + tombol Assign.
  - Dengan kolektor aktif: nama, sejak, rate snapshot, estimasi komisi; tombol Ganti (select + submit) dan Lepas; form aktivitas (tanggal, hasil, catatan) + daftar aktivitas terbaru.
  - `paid`/`cancelled`: riwayat read-only; komisi final pada assignment `paid`.
  - `draft`: panel tidak tampil.
- **List invoice (`ui/invoice-table.tsx`):** dropdown filter kolektor (query `collectorId`) dan kolom "Kolektor" pada tab outstanding.
- Label outcome (ID): Dihubungi · Tidak merespons · Janji bayar · Lapor bayar sebagian · Menolak · Lainnya.

### 5. Testing

| Level | Cakupan |
|-------|---------|
| Unit (`invoiceTotals.test.ts`) | `computeCommissionCents` — pembulatan, rate 0, rate 1 |
| Domain (baru, SQLite file sementara per run via `prisma migrate deploy`) | BR-07 tolak assign di `draft`/`paid`/`cancelled`; reassign menutup lama dengan `reassigned`; `already_assigned`; BR-08 komisi terkunci saat paid & snapshot tidak berubah saat rate kolektor diubah; cancel menutup tanpa komisi; BR-09 nonaktif ditolak; cross-user: kolektor/invoice user lain → 404; aktivitas tanpa assignment aktif → 409 |
| Gate (`scripts/gates/run-all.ts`) | Phase 7: create collector 201 → assign 200 → activity 201 → mark paid → `commissionCents` sesuai |
| Web smoke | Render `/collectors` dan panel penagihan di detail invoice |

## Out of scope

- Login / portal kolektor, role, atau link akses kolektor
- Email / notifikasi ke kolektor
- Pencatatan pembayaran komisi, laporan komisi per periode
- Pembayaran parsial (status invoice tetap sampai ditandai lunas penuh)
- Edit / hapus aktivitas penagihan

## Dampak dokumen

- [MVP-SCOPE-LOCK.md](../../invoicing/brd/MVP-SCOPE-LOCK.md) & [BRD.md](../../invoicing/BRD.md): tambah FR-14 (post-MVP) dan BR-07–BR-09
- [PRD README](../README.md): baris prioritas 12 / 0700 / G7
- [API.md](../../invoicing/engineering/API.md): endpoint §3
- [ARCHITECTURE.md](../../invoicing/ARCHITECTURE.md): komponen `collectors`, `collections`
- [legal/PRIVACY.md](../../invoicing/legal/PRIVACY.md) & [LEGAL-REVIEW-CHECKLIST.md](../../invoicing/legal/LEGAL-REVIEW-CHECKLIST.md): data debitur dibagikan freelancer ke kolektor pihak ketiga — perlu tinjauan UU PDP (tanggung jawab pengendali data ada pada freelancer)

## Dependensi

- **0500** (tandai lunas) dan **0501** (dashboard/list) — sudah implemented
- Disarankan: perbaikan validasi kepemilikan `clientId` di `updateInvoiceDraft` lebih dulu (temuan analisis, bukan bagian spec ini)

## Referensi

- [MVP-SCOPE-LOCK.md](../../invoicing/brd/MVP-SCOPE-LOCK.md) — non-goal multi-user
- [0200_PRD_Klien.md](../0200-klien/0200_PRD_Klien.md) — pola CRUD kontak
- [0500_PRD_Tandai_Lunas.md](../0500-tandai-lunas/0500_PRD_Tandai_Lunas.md)

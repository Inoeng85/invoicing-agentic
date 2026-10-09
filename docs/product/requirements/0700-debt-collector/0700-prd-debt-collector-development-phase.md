---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0700 — Debt Collector · Development Phase (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freelancer dapat mengelola kolektor (kontak), meng-assign kolektor ke invoice outstanding, mencatat aktivitas penagihan, dan melihat komisi yang terkunci saat invoice lunas.

**Architecture:** Tiga tabel Prisma baru (`DebtCollector`, `CollectionAssignment`, `CollectionActivity`). Semua aturan bisnis di `@invoicing/domain` (`collectors.ts`, `collections.ts`, perubahan kecil di `invoices.ts`); `apps/api` dan `apps/web` hanya controller tipis. Invariant "satu assignment aktif per invoice" dijaga di dalam `prisma.$transaction`.

**Tech Stack:** Node ≥ 24.3, TypeScript strict (tsgo 7), Prisma 6 + SQLite, Remix 3 (`remix/router`, `remix/ui`, `remix/test`), `node:test` untuk domain.

**Spec:** [0700-prd-debt-collector.md](0700-prd-debt-collector.md)

## Global Constraints

- **Prasyarat eksekusi:** working tree `main` saat ini berisi WIP yang belum di-commit (termasuk file untracked `apps/web/app/ui/invoice-detail.tsx`, `invoice-table.tsx`, `kit.tsx`, `layout.tsx` modified) yang dipakai plan ini. Commit WIP itu dulu (oleh pemilik repo), lalu buat branch `feat/0700-debt-collector` dari hasilnya. Jangan eksekusi di worktree dari `HEAD` lama — file UI di atas tidak akan ada.
- Node: jalankan `nvm use` (repo butuh ≥ 24.3; Node 20 membuat `remix test` crash di `fsp.glob`).
- Package manager repo ini **npm workspaces** (`package-lock.json`) — pakai `npm`, bukan pnpm.
- Verifikasi setiap task: `npm run typecheck` (root) harus lulus. Repo tidak punya script lint; typecheck adalah gate.
- `commissionRate` / `rateSnapshot` disimpan sebagai **fraksi 0–1** (pola `ppnRate`). UI memakai persen.
- Komisi: `Math.round(totalCents * rateSnapshot)` — sen, pola sama dengan PPN.
- Status outstanding = `sent` atau `overdue`.
- Semua query scoped `userId`; resource milik user lain → 404.
- Kolektor tidak boleh muncul di `/i/:token`, `/api/public/invoices/:token`, maupun PDF.
- Copy UI dalam Bahasa Indonesia; nama kode dalam Bahasa Inggris.
- Kode error baru (kode + HTTP): `collector_not_found` 404, `collector_inactive` 409, `collector_has_active_assignments` 409, `invoice_not_outstanding` 409, `already_assigned` 409, `no_active_assignment` 409, `invalid_commission_rate` 400, `invalid_outcome` 400, `invalid_occurred_at` 400, `missing_name` 400, `invalid_email` 400.
- Komentar hanya untuk WHY non-obvious. Tanpa `console.log` baru.
- Commit per task, conventional commits `type(scope): description`, `git add` file spesifik saja (jangan `git add -A`).

## Review Focus

1. **Double submit / assign kolektor yang sama dua kali** → harus 409 `already_assigned`, bukan assignment ganda. (Test di Task 4.)
2. **Rate kolektor diubah setelah assign** → komisi saat lunas tetap memakai `rateSnapshot` lama. (Test di Task 5.)
3. **Invoice lunas tanpa kolektor** → mark-paid tetap sukses, tidak ada baris assignment. (Test di Task 5.)
4. **Input komisi pakai koma ("7,5") atau kosong** → 0.075 / ditolak `invalid_commission_rate`, bukan diam-diam 0. (Test di Task 7 + Task 3.)
5. **Invoice `overdue` (hasil `refreshOverdueInvoices`)** → tetap bisa di-assign seperti `sent`. (Test di Task 4.)

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<timestamp>_debt_collector/migration.sql` (generated)
- Modify: `packages/database/src/index.ts`

**Interfaces:**
- Produces: Prisma models `DebtCollector`, `CollectionAssignment`, `CollectionActivity`; enums `AssignmentEndReason`, `CollectionOutcome`; delegates `prisma.debtCollector`, `prisma.collectionAssignment`, `prisma.collectionActivity`; type exports dari `@invoicing/database`: `DebtCollector`, `CollectionAssignment`, `CollectionActivity`, `AssignmentEndReason`, `CollectionOutcome`, `Prisma`.

- [ ] **Step 1: Tambah relasi balik di `User` dan `Invoice`**

Di `model User`, setelah `invoices     Invoice[]`:

```prisma
  debtCollectors        DebtCollector[]
  collectionAssignments CollectionAssignment[]
```

Di `model Invoice`, setelah `lineItems            InvoiceLineItem[]`:

```prisma
  collectionAssignments CollectionAssignment[]
```

- [ ] **Step 2: Tambah model dan enum baru di akhir `schema.prisma`**

```prisma
model DebtCollector {
  id             String                 @id @default(cuid())
  userId         String                 @map("user_id")
  user           User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String?
  phone          String?
  notes          String?
  commissionRate Float                  @default(0) @map("commission_rate")
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

- [ ] **Step 3: Generate migration**

Run: `npm run db:migrate -- --name debt_collector`
Expected: folder baru `packages/database/prisma/migrations/*_debt_collector/` berisi `CREATE TABLE "debt_collectors"`, `"collection_assignments"`, `"collection_activities"`; Prisma Client ter-generate.

- [ ] **Step 4: Export tipe baru dari `packages/database/src/index.ts`**

Ganti isi file menjadi:

```ts
export { prisma } from './client.ts'
export { PrismaClient } from '@prisma/client'
export type {
  User,
  BusinessProfile,
  Client,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  DebtCollector,
  CollectionAssignment,
  CollectionActivity,
  AssignmentEndReason,
  CollectionOutcome,
  Prisma,
} from '@prisma/client'
```

- [ ] **Step 5: Verifikasi**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations packages/database/src/index.ts
git commit -m "feat(database): add debt collector, assignment and activity models"
```

---

### Task 2: Domain test harness + `computeCommissionCents`

**Files:**
- Create: `packages/domain/src/test-setup.ts`
- Create: `packages/domain/src/test-fixtures.ts`
- Modify: `packages/domain/src/invoiceTotals.ts`
- Modify: `packages/domain/src/invoiceTotals.test.ts`
- Modify: `packages/domain/package.json` (script `test`)
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: Task 1 models.
- Produces:
  - `computeCommissionCents(totalCents: number, rate: number): number` (exported dari `@invoicing/domain`)
  - Test helpers (tidak diexport dari index): `makeUser(): Promise<User>`, `makeClient(userId: string): Promise<Client>`, `makeInvoice(userId: string, clientId: string, options?: { status?: InvoiceStatus; totalCents?: number }): Promise<Invoice>`, `makeCollector(userId: string, options?: { commissionRate?: number; active?: boolean }): Promise<DebtCollector>`
  - Konvensi: setiap test file yang menyentuh DB **harus** `import './test-setup.ts'` sebagai import pertama.

- [ ] **Step 1: Tulis failing test komisi** — tambahkan di akhir `packages/domain/src/invoiceTotals.test.ts`:

```ts
describe('computeCommissionCents (BR-08)', () => {
  it('10% of Rp1.000.000', () => {
    assert.equal(computeCommissionCents(100_000_000, 0.1), 10_000_000)
  })

  it('rounds half up to the nearest cent', () => {
    assert.equal(computeCommissionCents(335, 0.1), 34)
    assert.equal(computeCommissionCents(333, 0.1), 33)
  })

  it('rate 0 yields 0', () => {
    assert.equal(computeCommissionCents(100_000_000, 0), 0)
  })
})
```

dan ubah import di atas file menjadi:

```ts
import { computeCommissionCents, computeInvoiceTotals } from './invoiceTotals.ts'
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm run test:domain`
Expected: FAIL — `computeCommissionCents` tidak diexport.

- [ ] **Step 3: Implementasi** — tambahkan di akhir `packages/domain/src/invoiceTotals.ts`:

```ts
export function computeCommissionCents(totalCents: number, rate: number): number {
  return Math.round(totalCents * rate)
}
```

Di `packages/domain/src/index.ts` ubah baris invoiceTotals menjadi:

```ts
export {
  computeCommissionCents,
  computeInvoiceTotals,
  computeLineSubtotalCents,
  type InvoiceTotals,
  type LineItemInput,
} from './invoiceTotals.ts'
```

- [ ] **Step 4: Buat `packages/domain/src/test-setup.ts`**

```ts
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Must be the first import of every DB-backed test file: the Prisma client reads DATABASE_URL
// when it first connects, so it has to point at a throwaway DB before any domain code runs.
let dir = mkdtempSync(join(tmpdir(), 'invoicing-domain-test-'))
process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`

let databasePackage = join(dirname(fileURLToPath(import.meta.url)), '../../database')
execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: databasePackage,
  env: process.env,
  stdio: 'ignore',
})
```

- [ ] **Step 5: Buat `packages/domain/src/test-fixtures.ts`**

```ts
import { randomBytes } from 'node:crypto'

import { prisma, type InvoiceStatus } from '@invoicing/database'

function uid(): string {
  return randomBytes(6).toString('hex')
}

export async function makeUser() {
  return prisma.user.create({
    data: {
      email: `user-${uid()}@test.local`,
      passwordHash: 'salt:hash',
      profile: { create: { legalName: 'Studio Test' } },
    },
  })
}

export async function makeClient(userId: string) {
  return prisma.client.create({
    data: { userId, name: `Klien ${uid()}`, email: `klien-${uid()}@test.local` },
  })
}

export async function makeInvoice(
  userId: string,
  clientId: string,
  options: { status?: InvoiceStatus; totalCents?: number } = {},
) {
  let totalCents = options.totalCents ?? 100_000_000
  let status = options.status ?? 'sent'
  return prisma.invoice.create({
    data: {
      userId,
      clientId,
      status,
      number: status === 'draft' ? null : `INV-TEST-${uid()}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotalCents: totalCents,
      totalCents,
    },
  })
}

export async function makeCollector(
  userId: string,
  options: { commissionRate?: number; active?: boolean } = {},
) {
  return prisma.debtCollector.create({
    data: {
      userId,
      name: `Kolektor ${uid()}`,
      commissionRate: options.commissionRate ?? 0.1,
      active: options.active ?? true,
    },
  })
}
```

- [ ] **Step 6: Ubah script test domain** di `packages/domain/package.json`:

```json
    "test": "node --import tsx --test \"src/*.test.ts\"",
```

- [ ] **Step 7: Jalankan test + typecheck**

Run: `npm run test:domain && npm run typecheck`
Expected: 6 tests pass (3 lama + 3 baru), typecheck exit 0.

- [ ] **Step 8: Commit**

```bash
git add packages/domain/src/invoiceTotals.ts packages/domain/src/invoiceTotals.test.ts packages/domain/src/test-setup.ts packages/domain/src/test-fixtures.ts packages/domain/src/index.ts packages/domain/package.json
git commit -m "feat(domain): add commission calculation and DB-backed test harness"
```

---

### Task 3: Domain `collectors.ts`

**Files:**
- Create: `packages/domain/src/collectors.ts`
- Create: `packages/domain/src/collectors.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: Task 2 fixtures; `DomainError` (`packages/domain/src/errors.ts`).
- Produces (exported dari `@invoicing/domain`):
  - `interface CollectorInput { name: string; email?: string | null; phone?: string | null; notes?: string | null; commissionRate: number }`
  - `listCollectors(userId: string, includeInactive?: boolean): Promise<DebtCollector[]>`
  - `getCollector(userId: string, collectorId: string): Promise<DebtCollector>`
  - `createCollector(userId: string, input: CollectorInput): Promise<DebtCollector>`
  - `updateCollector(userId: string, collectorId: string, input: Partial<CollectorInput>): Promise<DebtCollector>`
  - `setCollectorActive(userId: string, collectorId: string, active: boolean): Promise<DebtCollector>`
  - `listCollectorSummaries(userId: string): Promise<CollectorSummary[]>`
  - `getCollectorSummary(userId: string, collectorId: string): Promise<CollectorSummary & { activeAssignments: Array<CollectionAssignment & { invoice: Invoice & { client: Client } }> }>`
  - `interface CollectorSummary { collector: DebtCollector; activeCount: number; activeOutstandingCents: number; earnedCommissionCents: number }`

- [ ] **Step 1: Tulis failing tests** — `packages/domain/src/collectors.test.ts`:

```ts
import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import {
  createCollector,
  getCollector,
  listCollectors,
  listCollectorSummaries,
  setCollectorActive,
  updateCollector,
} from './collectors.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('collectors (FR-14a/b, BR-09)', () => {
  it('creates a collector with trimmed name and nullable contact fields', async () => {
    let user = await makeUser()
    let collector = await createCollector(user.id, { name: '  Budi  ', email: '', commissionRate: 0.075 })
    assert.equal(collector.name, 'Budi')
    assert.equal(collector.email, null)
    assert.equal(collector.commissionRate, 0.075)
    assert.equal(collector.active, true)
  })

  it('rejects empty name', async () => {
    let user = await makeUser()
    await rejectsWith(createCollector(user.id, { name: '  ', commissionRate: 0.1 }), 'missing_name')
  })

  it('rejects invalid email', async () => {
    let user = await makeUser()
    await rejectsWith(createCollector(user.id, { name: 'Budi', email: 'bukan-email', commissionRate: 0.1 }), 'invalid_email')
  })

  it('rejects commission rate outside 0–1 or NaN', async () => {
    let user = await makeUser()
    for (let rate of [-0.01, 1.01, Number.NaN]) {
      await rejectsWith(createCollector(user.id, { name: 'Budi', commissionRate: rate }), 'invalid_commission_rate')
    }
  })

  it('hides collectors of other users', async () => {
    let owner = await makeUser()
    let other = await makeUser()
    let collector = await makeCollector(owner.id)
    await rejectsWith(getCollector(other.id, collector.id), 'collector_not_found')
    await rejectsWith(updateCollector(other.id, collector.id, { name: 'X' }), 'collector_not_found')
  })

  it('listCollectors excludes inactive by default', async () => {
    let user = await makeUser()
    let active = await makeCollector(user.id)
    await makeCollector(user.id, { active: false })
    let ids = (await listCollectors(user.id)).map((c) => c.id)
    assert.deepEqual(ids, [active.id])
    assert.equal((await listCollectors(user.id, true)).length, 2)
  })

  it('BR-09: cannot deactivate while holding an active assignment', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id)
    let assignment = await prisma.collectionAssignment.create({
      data: { userId: user.id, invoiceId: invoice.id, collectorId: collector.id, rateSnapshot: 0.1 },
    })
    await rejectsWith(setCollectorActive(user.id, collector.id, false), 'collector_has_active_assignments')

    await prisma.collectionAssignment.update({
      where: { id: assignment.id },
      data: { endedAt: new Date(), endReason: 'unassigned' },
    })
    let updated = await setCollectorActive(user.id, collector.id, false)
    assert.equal(updated.active, false)
  })

  it('summaries count active outstanding and earned commission', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let collector = await makeCollector(user.id)
    let open = await makeInvoice(user.id, client.id, { totalCents: 50_000_000 })
    let paid = await makeInvoice(user.id, client.id, { status: 'paid', totalCents: 20_000_000 })
    await prisma.collectionAssignment.create({
      data: { userId: user.id, invoiceId: open.id, collectorId: collector.id, rateSnapshot: 0.1 },
    })
    await prisma.collectionAssignment.create({
      data: {
        userId: user.id,
        invoiceId: paid.id,
        collectorId: collector.id,
        rateSnapshot: 0.1,
        endedAt: new Date(),
        endReason: 'paid',
        commissionCents: 2_000_000,
      },
    })
    let [summary] = await listCollectorSummaries(user.id)
    assert.equal(summary?.activeCount, 1)
    assert.equal(summary?.activeOutstandingCents, 50_000_000)
    assert.equal(summary?.earnedCommissionCents, 2_000_000)
  })
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm run test:domain`
Expected: FAIL — `Cannot find module './collectors.ts'`.

- [ ] **Step 3: Implementasi** — `packages/domain/src/collectors.ts`:

```ts
import { prisma, type DebtCollector } from '@invoicing/database'

import { DomainError } from './errors.ts'

export interface CollectorInput {
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  commissionRate: number
}

export interface CollectorSummary {
  collector: DebtCollector
  activeCount: number
  activeOutstandingCents: number
  earnedCommissionCents: number
}

function cleanOptional(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  return value?.trim() || null
}

function normalizeCollectorInput(input: Partial<CollectorInput>) {
  let name = input.name?.trim()
  if (input.name !== undefined && !name) {
    throw new DomainError('Nama kolektor wajib', 'missing_name')
  }
  let email = cleanOptional(input.email)
  if (email && !email.includes('@')) {
    throw new DomainError('Email kolektor tidak valid', 'invalid_email')
  }
  let rate = input.commissionRate
  if (rate !== undefined && !(Number.isFinite(rate) && rate >= 0 && rate <= 1)) {
    throw new DomainError('Komisi harus antara 0% dan 100%', 'invalid_commission_rate')
  }
  return {
    name,
    email,
    phone: cleanOptional(input.phone),
    notes: cleanOptional(input.notes),
    commissionRate: rate,
  }
}

export async function listCollectors(userId: string, includeInactive = false) {
  return prisma.debtCollector.findMany({
    where: { userId, ...(includeInactive ? {} : { active: true }) },
    orderBy: { name: 'asc' },
  })
}

export async function getCollector(userId: string, collectorId: string) {
  let collector = await prisma.debtCollector.findFirst({ where: { id: collectorId, userId } })
  if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
  return collector
}

export async function createCollector(userId: string, input: CollectorInput) {
  let data = normalizeCollectorInput(input)
  return prisma.debtCollector.create({
    data: {
      userId,
      name: data.name!,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      commissionRate: data.commissionRate!,
    },
  })
}

export async function updateCollector(userId: string, collectorId: string, input: Partial<CollectorInput>) {
  await getCollector(userId, collectorId)
  let data = normalizeCollectorInput(input)
  return prisma.debtCollector.update({ where: { id: collectorId }, data })
}

export async function setCollectorActive(userId: string, collectorId: string, active: boolean) {
  await getCollector(userId, collectorId)
  if (!active) {
    let open = await prisma.collectionAssignment.count({ where: { collectorId, endedAt: null } })
    if (open > 0) {
      throw new DomainError(
        'Kolektor masih menagih invoice aktif',
        'collector_has_active_assignments',
        409,
      )
    }
  }
  return prisma.debtCollector.update({ where: { id: collectorId }, data: { active } })
}

export async function listCollectorSummaries(userId: string): Promise<CollectorSummary[]> {
  let [collectors, assignments] = await Promise.all([
    listCollectors(userId, true),
    prisma.collectionAssignment.findMany({
      where: { userId, OR: [{ endedAt: null }, { endReason: 'paid' }] },
      select: { collectorId: true, endedAt: true, commissionCents: true, invoice: { select: { totalCents: true } } },
    }),
  ])
  return collectors.map((collector) => {
    let own = assignments.filter((a) => a.collectorId === collector.id)
    let active = own.filter((a) => a.endedAt === null)
    return {
      collector,
      activeCount: active.length,
      activeOutstandingCents: active.reduce((sum, a) => sum + a.invoice.totalCents, 0),
      earnedCommissionCents: own.reduce((sum, a) => sum + (a.commissionCents ?? 0), 0),
    }
  })
}

export async function getCollectorSummary(userId: string, collectorId: string) {
  let collector = await getCollector(userId, collectorId)
  let [activeAssignments, earned] = await Promise.all([
    prisma.collectionAssignment.findMany({
      where: { userId, collectorId, endedAt: null },
      include: { invoice: { include: { client: true } } },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.collectionAssignment.aggregate({
      where: { userId, collectorId, endReason: 'paid' },
      _sum: { commissionCents: true },
    }),
  ])
  return {
    collector,
    activeAssignments,
    activeCount: activeAssignments.length,
    activeOutstandingCents: activeAssignments.reduce((sum, a) => sum + a.invoice.totalCents, 0),
    earnedCommissionCents: earned._sum.commissionCents ?? 0,
  }
}
```

Tambahkan di `packages/domain/src/index.ts` (setelah blok clients):

```ts
export {
  listCollectors,
  getCollector,
  createCollector,
  updateCollector,
  setCollectorActive,
  listCollectorSummaries,
  getCollectorSummary,
  type CollectorInput,
  type CollectorSummary,
} from './collectors.ts'
```

- [ ] **Step 4: Jalankan test + typecheck**

Run: `npm run test:domain && npm run typecheck`
Expected: semua pass, exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/collectors.ts packages/domain/src/collectors.test.ts packages/domain/src/index.ts
git commit -m "feat(domain): add debt collector management (FR-14a, BR-09)"
```

---

### Task 4: Domain `collections.ts` (assign, unassign, activity)

**Files:**
- Create: `packages/domain/src/collections.ts`
- Create: `packages/domain/src/collections.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: Task 2 `computeCommissionCents`, fixtures; Task 3 `updateCollector` (di test).
- Produces:
  - Exported dari `@invoicing/domain`: `COLLECTION_OUTCOMES` (`readonly ['contacted','no_response','promised_to_pay','partial_payment_reported','refused','other']`), `type CollectionOutcome`, `assignCollector(userId: string, invoiceId: string, collectorId: string)`, `unassignCollector(userId: string, invoiceId: string)`, `addCollectionActivity(userId: string, invoiceId: string, input: { occurredAt: Date; outcome: string; note?: string | null })`, `getInvoiceCollection(userId: string, invoiceId: string): Promise<{ active: AssignmentWithDetail | null; history: AssignmentWithDetail[] }>`, `type InvoiceCollection = Awaited<ReturnType<typeof getInvoiceCollection>>`.
  - Internal (dipakai Task 5, **tidak** diexport dari index): `closeActiveAssignmentInTx(tx: Prisma.TransactionClient, invoiceId: string, reason: 'paid' | 'cancelled', totalCents: number): Promise<void>`.

- [ ] **Step 1: Tulis failing tests** — `packages/domain/src/collections.test.ts`:

```ts
import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import {
  addCollectionActivity,
  assignCollector,
  getInvoiceCollection,
  unassignCollector,
} from './collections.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

async function setup(status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled' = 'sent') {
  let user = await makeUser()
  let client = await makeClient(user.id)
  let invoice = await makeInvoice(user.id, client.id, { status })
  let collector = await makeCollector(user.id, { commissionRate: 0.1 })
  return { user, client, invoice, collector }
}

describe('assignCollector (FR-14c, BR-07)', () => {
  it('assigns and snapshots the collector rate', async () => {
    let { user, invoice, collector } = await setup()
    let assignment = await assignCollector(user.id, invoice.id, collector.id)
    assert.equal(assignment.rateSnapshot, 0.1)
    assert.equal(assignment.endedAt, null)
  })

  it('accepts overdue invoices', async () => {
    let { user, invoice, collector } = await setup('overdue')
    let assignment = await assignCollector(user.id, invoice.id, collector.id)
    assert.equal(assignment.collectorId, collector.id)
  })

  it('rejects non-outstanding invoices', async () => {
    for (let status of ['draft', 'paid', 'cancelled'] as const) {
      let { user, invoice, collector } = await setup(status)
      await rejectsWith(assignCollector(user.id, invoice.id, collector.id), 'invoice_not_outstanding')
    }
  })

  it('rejects inactive collectors', async () => {
    let { user, invoice } = await setup()
    let inactive = await makeCollector(user.id, { active: false })
    await rejectsWith(assignCollector(user.id, invoice.id, inactive.id), 'collector_inactive')
  })

  it('rejects cross-user collector and invoice', async () => {
    let { user, invoice, collector } = await setup()
    let other = await setup()
    await rejectsWith(assignCollector(user.id, invoice.id, other.collector.id), 'collector_not_found')
    await rejectsWith(assignCollector(user.id, other.invoice.id, collector.id), 'not_found')
  })

  it('rejects assigning the same collector twice', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await rejectsWith(assignCollector(user.id, invoice.id, collector.id), 'already_assigned')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id } }), 1)
  })

  it('reassign closes the previous assignment', async () => {
    let { user, invoice, collector } = await setup()
    let second = await makeCollector(user.id, { commissionRate: 0.2 })
    await assignCollector(user.id, invoice.id, collector.id)
    await assignCollector(user.id, invoice.id, second.id)
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active?.collectorId, second.id)
    assert.equal(active?.rateSnapshot, 0.2)
    assert.equal(history.length, 2)
    assert.equal(history[1]?.endReason, 'reassigned')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id, endedAt: null } }), 1)
  })
})

describe('unassignCollector', () => {
  it('closes the active assignment as unassigned', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await unassignCollector(user.id, invoice.id)
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active, null)
    assert.equal(history[0]?.endReason, 'unassigned')
  })

  it('rejects when nothing is assigned', async () => {
    let { user, invoice } = await setup()
    await rejectsWith(unassignCollector(user.id, invoice.id), 'no_active_assignment')
  })
})

describe('addCollectionActivity (FR-14d)', () => {
  it('logs an activity on the active assignment', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await addCollectionActivity(user.id, invoice.id, {
      occurredAt: new Date(Date.now() - 60_000),
      outcome: 'promised_to_pay',
      note: '  Janji transfer Jumat  ',
    })
    let { active } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active?.activities.length, 1)
    assert.equal(active?.activities[0]?.outcome, 'promised_to_pay')
    assert.equal(active?.activities[0]?.note, 'Janji transfer Jumat')
  })

  it('rejects unknown outcome', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    await rejectsWith(
      addCollectionActivity(user.id, invoice.id, { occurredAt: new Date(), outcome: 'bribed' }),
      'invalid_outcome',
    )
  })

  it('rejects future or invalid dates', async () => {
    let { user, invoice, collector } = await setup()
    await assignCollector(user.id, invoice.id, collector.id)
    for (let occurredAt of [new Date(Date.now() + 86_400_000), new Date(Number.NaN)]) {
      await rejectsWith(
        addCollectionActivity(user.id, invoice.id, { occurredAt, outcome: 'contacted' }),
        'invalid_occurred_at',
      )
    }
  })

  it('rejects when no collector is assigned', async () => {
    let { user, invoice } = await setup()
    await rejectsWith(
      addCollectionActivity(user.id, invoice.id, { occurredAt: new Date(), outcome: 'contacted' }),
      'no_active_assignment',
    )
  })
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm run test:domain`
Expected: FAIL — `Cannot find module './collections.ts'`.

- [ ] **Step 3: Implementasi** — `packages/domain/src/collections.ts`:

```ts
import { prisma, type CollectionOutcome as PrismaCollectionOutcome, type Prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'
import { computeCommissionCents } from './invoiceTotals.ts'

type Tx = Prisma.TransactionClient

export const COLLECTION_OUTCOMES = [
  'contacted',
  'no_response',
  'promised_to_pay',
  'partial_payment_reported',
  'refused',
  'other',
] as const satisfies readonly PrismaCollectionOutcome[]

export type CollectionOutcome = (typeof COLLECTION_OUTCOMES)[number]

function isCollectionOutcome(value: string): value is CollectionOutcome {
  return (COLLECTION_OUTCOMES as readonly string[]).includes(value)
}

async function requireOutstandingInvoiceInTx(tx: Tx, userId: string, invoiceId: string) {
  let invoice = await tx.invoice.findFirst({ where: { id: invoiceId, userId }, select: { status: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new DomainError('Hanya invoice outstanding yang dapat ditagih', 'invoice_not_outstanding', 409)
  }
}

function findActiveAssignmentInTx(tx: Tx, invoiceId: string) {
  return tx.collectionAssignment.findFirst({ where: { invoiceId, endedAt: null } })
}

export async function assignCollector(userId: string, invoiceId: string, collectorId: string) {
  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let collector = await tx.debtCollector.findFirst({ where: { id: collectorId, userId } })
    if (!collector) throw new DomainError('Kolektor tidak ditemukan', 'collector_not_found', 404)
    if (!collector.active) throw new DomainError('Kolektor nonaktif', 'collector_inactive', 409)

    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (current?.collectorId === collectorId) {
      throw new DomainError('Kolektor sudah di-assign ke invoice ini', 'already_assigned', 409)
    }
    if (current) {
      await tx.collectionAssignment.update({
        where: { id: current.id },
        data: { endedAt: new Date(), endReason: 'reassigned' },
      })
    }
    return tx.collectionAssignment.create({
      data: { userId, invoiceId, collectorId, rateSnapshot: collector.commissionRate },
      include: { collector: true },
    })
  })
}

export async function unassignCollector(userId: string, invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (!current) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
    return tx.collectionAssignment.update({
      where: { id: current.id },
      data: { endedAt: new Date(), endReason: 'unassigned' },
    })
  })
}

export async function addCollectionActivity(
  userId: string,
  invoiceId: string,
  input: { occurredAt: Date; outcome: string; note?: string | null },
) {
  let outcome = input.outcome
  if (!isCollectionOutcome(outcome)) {
    throw new DomainError('Hasil penagihan tidak valid', 'invalid_outcome')
  }
  let time = input.occurredAt.getTime()
  if (!Number.isFinite(time) || time > Date.now()) {
    throw new DomainError('Tanggal aktivitas tidak valid', 'invalid_occurred_at')
  }

  return prisma.$transaction(async (tx) => {
    await requireOutstandingInvoiceInTx(tx, userId, invoiceId)
    let current = await findActiveAssignmentInTx(tx, invoiceId)
    if (!current) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
    return tx.collectionActivity.create({
      data: {
        assignmentId: current.id,
        occurredAt: input.occurredAt,
        outcome,
        note: input.note?.trim() || null,
      },
    })
  })
}

export async function getInvoiceCollection(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
  let rows = await prisma.collectionAssignment.findMany({
    where: { invoiceId, userId },
    include: { collector: true, activities: { orderBy: { occurredAt: 'desc' } } },
    orderBy: { assignedAt: 'desc' },
  })
  // Active first regardless of timestamps: a reassign can create two rows within the same millisecond.
  let active = rows.find((a) => a.endedAt === null) ?? null
  let history = active ? [active, ...rows.filter((a) => a !== active)] : rows
  return { active, history }
}

export type InvoiceCollection = Awaited<ReturnType<typeof getInvoiceCollection>>

export async function closeActiveAssignmentInTx(
  tx: Tx,
  invoiceId: string,
  reason: 'paid' | 'cancelled',
  totalCents: number,
) {
  let current = await findActiveAssignmentInTx(tx, invoiceId)
  if (!current) return
  await tx.collectionAssignment.update({
    where: { id: current.id },
    data: {
      endedAt: new Date(),
      endReason: reason,
      commissionCents: reason === 'paid' ? computeCommissionCents(totalCents, current.rateSnapshot) : null,
    },
  })
}
```

`history[0]` selalu assignment aktif (bila ada); test `reassign` mengandalkan ini (`history[1]` = yang di-reassign).

Tambahkan di `packages/domain/src/index.ts`:

```ts
export {
  COLLECTION_OUTCOMES,
  assignCollector,
  unassignCollector,
  addCollectionActivity,
  getInvoiceCollection,
  type CollectionOutcome,
  type InvoiceCollection,
} from './collections.ts'
```

- [ ] **Step 4: Jalankan test + typecheck**

Run: `npm run test:domain && npm run typecheck`
Expected: semua pass, exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/collections.ts packages/domain/src/collections.test.ts packages/domain/src/index.ts
git commit -m "feat(domain): assign collectors and log collection activity (FR-14c/d, BR-07)"
```

---

### Task 5: `invoices.ts` — lunas/batal menutup assignment, filter kolektor

**Files:**
- Modify: `packages/domain/src/invoices.ts` (`listInvoices` :61-68, `cancelInvoice` :270-281, `markInvoicePaid` :283-294)
- Create: `packages/domain/src/invoices-collection.test.ts`

**Interfaces:**
- Consumes: Task 4 `closeActiveAssignmentInTx`, `assignCollector`, `getInvoiceCollection`; Task 3 `updateCollector`.
- Produces:
  - `listInvoices(userId: string, status?: InvoiceStatus, collectorId?: string)` — setiap row meng-include `collectionAssignments: Array<CollectionAssignment & { collector: { id: string; name: string } }>` (hanya yang aktif, maksimal 1).
  - `markInvoicePaid` / `cancelInvoice`: signature dan bentuk return sama seperti sebelumnya (`include: { client: true }` dan `include: { client: true, lineItems: true }`).

- [ ] **Step 1: Tulis failing tests** — `packages/domain/src/invoices-collection.test.ts`:

```ts
import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import { assignCollector, getInvoiceCollection } from './collections.ts'
import { updateCollector } from './collectors.ts'
import { cancelInvoice, getInvoiceByPublicToken, listInvoices, markInvoicePaid } from './invoices.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('invoice lifecycle closes collection (BR-08)', () => {
  it('mark paid locks commission from the snapshot, not the current rate', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id, { totalCents: 111_000_000 })
    let collector = await makeCollector(user.id, { commissionRate: 0.1 })
    await assignCollector(user.id, invoice.id, collector.id)
    await updateCollector(user.id, collector.id, { commissionRate: 0.5 })

    let paid = await markInvoicePaid(user.id, invoice.id)
    assert.equal(paid.status, 'paid')
    let { active, history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(active, null)
    assert.equal(history[0]?.endReason, 'paid')
    assert.equal(history[0]?.commissionCents, 11_100_000)
  })

  it('mark paid without a collector still works', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let paid = await markInvoicePaid(user.id, invoice.id)
    assert.equal(paid.status, 'paid')
    assert.equal(await prisma.collectionAssignment.count({ where: { invoiceId: invoice.id } }), 0)
  })

  it('cancel closes the assignment without commission', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id, { status: 'overdue' })
    let collector = await makeCollector(user.id)
    await assignCollector(user.id, invoice.id, collector.id)
    await cancelInvoice(user.id, invoice.id)
    let { history } = await getInvoiceCollection(user.id, invoice.id)
    assert.equal(history[0]?.endReason, 'cancelled')
    assert.equal(history[0]?.commissionCents, null)
  })

  it('keeps existing status errors', async () => {
    let user = await makeUser()
    let other = await makeUser()
    let client = await makeClient(user.id)
    let draft = await makeInvoice(user.id, client.id, { status: 'draft' })
    await rejectsWith(markInvoicePaid(user.id, draft.id), 'invalid_status')
    await rejectsWith(cancelInvoice(user.id, draft.id), 'invalid_status')
    await rejectsWith(markInvoicePaid(other.id, draft.id), 'not_found')
  })
})

describe('listInvoices collector filter (FR-14f)', () => {
  it('returns only invoices actively assigned to the collector', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let collector = await makeCollector(user.id)
    let assigned = await makeInvoice(user.id, client.id)
    await makeInvoice(user.id, client.id)
    await assignCollector(user.id, assigned.id, collector.id)

    let rows = await listInvoices(user.id, undefined, collector.id)
    assert.deepEqual(rows.map((r) => r.id), [assigned.id])
    assert.equal(rows[0]?.collectionAssignments[0]?.collector.name, collector.name)
  })
})

describe('public invoice hides collection data (D-08)', () => {
  it('does not include collection assignments', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await prisma.invoice.update({ where: { id: invoice.id }, data: { publicToken: `tok-${invoice.id}` } })
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let pub = await getInvoiceByPublicToken(`tok-${invoice.id}`)
    assert.equal('collectionAssignments' in pub, false)
  })
})
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm run test:domain`
Expected: FAIL — `history[0]?.endReason` undefined (assignment tidak ditutup), filter kolektor diabaikan.

- [ ] **Step 3: Implementasi di `packages/domain/src/invoices.ts`**

Tambah import (setelah import `DomainError`):

```ts
import { closeActiveAssignmentInTx } from './collections.ts'
```

Ubah import tipe baris 4 menjadi:

```ts
import type { InvoiceStatus, Prisma } from '@prisma/client'
```

Ganti `listInvoices` (:61-68):

```ts
export async function listInvoices(userId: string, status?: InvoiceStatus, collectorId?: string) {
  await refreshOverdueInvoices(userId)
  return prisma.invoice.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
      ...(collectorId ? { collectionAssignments: { some: { collectorId, endedAt: null } } } : {}),
    },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: 'asc' }, take: 1 },
      collectionAssignments: {
        where: { endedAt: null },
        include: { collector: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}
```

Ganti `cancelInvoice` dan `markInvoicePaid` (:270-294) dengan:

```ts
// Status check and write share one transaction so a concurrent send/cancel/pay can't slip between them.
async function closeOutstandingInvoiceInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  invoiceId: string,
  data: { status: 'paid'; paidAt: Date } | { status: 'cancelled' },
  invalidMessage: string,
) {
  let updated = await tx.invoice.updateMany({
    where: { id: invoiceId, userId, status: { in: ['sent', 'overdue'] } },
    data,
  })
  if (updated.count === 0) {
    let exists = await tx.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } })
    if (!exists) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
    throw new DomainError(invalidMessage, 'invalid_status', 409)
  }
  let invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, select: { totalCents: true } })
  await closeActiveAssignmentInTx(tx, invoiceId, data.status, invoice.totalCents)
}

export async function cancelInvoice(userId: string, invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    await closeOutstandingInvoiceInTx(
      tx,
      userId,
      invoiceId,
      { status: 'cancelled' },
      'Hanya invoice terkirim yang dapat dibatalkan',
    )
    return tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { client: true, lineItems: true },
    })
  })
}

export async function markInvoicePaid(userId: string, invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    await closeOutstandingInvoiceInTx(
      tx,
      userId,
      invoiceId,
      { status: 'paid', paidAt: new Date() },
      'Hanya invoice terkirim yang dapat ditandai lunas',
    )
    return tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { client: true } })
  })
}
```

- [ ] **Step 4: Jalankan test + typecheck**

Run: `npm run test:domain && npm run typecheck`
Expected: semua pass, exit 0. (Typecheck juga memastikan web/API yang memakai `listInvoices` tetap kompatibel.)

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/invoices.ts packages/domain/src/invoices-collection.test.ts
git commit -m "feat(domain): lock collector commission on paid and filter invoices by collector (BR-08)"
```

---

### Task 6: API endpoints + gate Phase 7

**Files:**
- Modify: `apps/api/src/routes.ts`
- Create: `apps/api/src/controllers/collectors.controller.tsx`
- Create: `apps/api/src/controllers/collection.controller.tsx`
- Modify: `apps/api/src/router.ts`
- Modify: `apps/api/src/controllers/invoices.controller.tsx:21-29` (index)
- Modify: `scripts/gates/run-all.ts`

**Interfaces:**
- Consumes: Task 3–5 domain exports.
- Produces: HTTP endpoints sesuai spec §3; `routes.v1Collectors`, `routes.v1InvoiceCollection.{show,assign,unassign,activities}`.

- [ ] **Step 1: Tulis failing gate** — di `scripts/gates/run-all.ts`, tambahkan sebelum `async function main()`:

```ts
async function gatePhase7Collection(token: string, clientId: string) {
  let auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  let collector = await apiFetch('/api/v1/collectors', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ name: 'Kolektor Gate', commissionRate: 0.1 }),
  })
  record('Phase 7 — FR-14 create collector', collector.status === 201, `status ${collector.status}`)
  let collectorId = ((await collector.json()) as { data: { id: string } }).data.id

  let create = await apiFetch('/api/v1/invoices', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      clientId,
      lines: [{ description: 'Collection gate', quantity: 1, unitPriceCents: 50_000_00, discountCents: 0 }],
    }),
  })
  let invoiceId = ((await create.json()) as { data: { id: string } }).data.id
  let send = await apiFetch(`/api/v1/invoices/${invoiceId}/send`, { method: 'POST', headers: auth })
  record('Phase 7 — send for collection', send.status === 200, `status ${send.status}`)

  let assign = await apiFetch(`/api/v1/invoices/${invoiceId}/collection/assign`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ collectorId }),
  })
  record('Phase 7 — FR-14 assign', assign.status === 200, `status ${assign.status}`)

  let activity = await apiFetch(`/api/v1/invoices/${invoiceId}/collection/activities`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ occurredAt: new Date().toISOString(), outcome: 'contacted' }),
  })
  record('Phase 7 — FR-14 activity', activity.status === 201, `status ${activity.status}`)

  let paid = await apiFetch(`/api/v1/invoices/${invoiceId}/mark-paid`, { method: 'POST', headers: auth })
  record('Phase 7 — mark paid', paid.status === 200, `status ${paid.status}`)

  let collection = await apiFetch(`/api/v1/invoices/${invoiceId}/collection`, { headers: auth })
  let body = (await collection.json()) as { data: { history: Array<{ commissionCents: number | null }> } }
  let commission = body.data.history[0]?.commissionCents
  record('Phase 7 — BR-08 commission locked', commission === 5_000_00, `commissionCents=${commission}`)
}
```

Di `main()`, setelah `await gatePhase6Release(token, clientId)`:

```ts
  await gatePhase7Collection(token, clientId)
```

Ganti judul report `'## Gate G0–G6 (release checks in Phase 6 section)'` menjadi `'## Gate G0–G7 (release checks in Phase 6, debt collector in Phase 7)'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm run gate`
Expected: `[FAIL] Phase 7 — FR-14 create collector: status 404`.

- [ ] **Step 3: Routes** — di `apps/api/src/routes.ts`, tambahkan sebelum `publicInvoice`:

```ts
  v1Collectors: resources('/api/v1/collectors', {
    only: ['index', 'show', 'create', 'update', 'destroy'],
  }),
  v1InvoiceCollection: {
    show: get('/api/v1/invoices/:id/collection'),
    assign: post('/api/v1/invoices/:id/collection/assign'),
    unassign: post('/api/v1/invoices/:id/collection/unassign'),
    activities: post('/api/v1/invoices/:id/collection/activities'),
  },
```

- [ ] **Step 4: Controller kolektor** — `apps/api/src/controllers/collectors.controller.tsx`:

```tsx
import { createController } from 'remix/router'
import {
  createCollector,
  getCollector,
  getCollectorSummary,
  listCollectorSummaries,
  setCollectorActive,
  updateCollector,
  type CollectorInput,
} from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1Collectors, {
  actions: {
    async index(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await listCollectorSummaries(userId) })
      })
    },

    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await getCollectorSummary(userId, context.params.id) })
      })
    },

    async create(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<CollectorInput>(context.request)
        return json({ data: await createCollector(userId, body) }, { status: 201 })
      })
    },

    async update(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let { active, ...fields } = await readJson<Partial<CollectorInput> & { active?: boolean }>(context.request)
        if (Object.keys(fields).length) await updateCollector(userId, context.params.id, fields)
        if (active !== undefined) await setCollectorActive(userId, context.params.id, active)
        return json({ data: await getCollector(userId, context.params.id) })
      })
    },

    async destroy(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await setCollectorActive(userId, context.params.id, false) })
      })
    },
  },
})
```

- [ ] **Step 5: Controller penagihan** — `apps/api/src/controllers/collection.controller.tsx`:

```tsx
import { createController } from 'remix/router'
import {
  addCollectionActivity,
  assignCollector,
  getInvoiceCollection,
  unassignCollector,
} from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1InvoiceCollection, {
  actions: {
    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await getInvoiceCollection(userId, context.params.id) })
      })
    },

    async assign(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<{ collectorId: string }>(context.request)
        return json({ data: await assignCollector(userId, context.params.id, body.collectorId) })
      })
    },

    async unassign(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await unassignCollector(userId, context.params.id) })
      })
    },

    async activities(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<{ occurredAt: string; outcome: string; note?: string | null }>(context.request)
        let data = await addCollectionActivity(userId, context.params.id, {
          occurredAt: new Date(body.occurredAt),
          outcome: body.outcome,
          note: body.note,
        })
        return json({ data }, { status: 201 })
      })
    },
  },
})
```

- [ ] **Step 6: Wire router + filter list invoice**

Di `apps/api/src/router.ts` tambah import dan map:

```ts
import collectionController from './controllers/collection.controller.tsx'
import collectorsController from './controllers/collectors.controller.tsx'
```

```ts
router.map(routes.v1Collectors, collectorsController)
router.map(routes.v1InvoiceCollection, collectionController)
```

Di `apps/api/src/controllers/invoices.controller.tsx`, action `index`, ganti dua baris `status` / `listInvoices` menjadi:

```ts
        let status = url.searchParams.get('status') ?? undefined
        let collectorId = url.searchParams.get('collectorId') ?? undefined
        let data = await listInvoices(userId, status as Parameters<typeof listInvoices>[1], collectorId)
```

- [ ] **Step 7: Jalankan gate + typecheck**

Run: `npm run typecheck && npm run gate`
Expected: exit 0; output diakhiri `[PASS] Phase 7 — BR-08 commission locked: commissionCents=500000` dan `=== All gates PASS ===`.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/routes.ts apps/api/src/router.ts apps/api/src/controllers/collectors.controller.tsx apps/api/src/controllers/collection.controller.tsx apps/api/src/controllers/invoices.controller.tsx scripts/gates/run-all.ts
git commit -m "feat(api): expose collector and invoice collection endpoints with gate phase 7"
```

(Jangan commit `docs/reports/gates/` — hasil run lokal.)

---

### Task 7: Web — halaman Kolektor + navigasi

**Files:**
- Create: `apps/web/app/lib/percent.ts`
- Create: `apps/web/app/lib/percent.test.ts`
- Modify: `apps/web/app/routes.ts`
- Create: `apps/web/app/actions/collectors/controller.tsx`
- Modify: `apps/web/app/router.ts`
- Modify: `apps/web/app/ui/layout.tsx:10,27-31` (NavKey + NAV)
- Modify: `apps/web/app/actions/controller.test.ts`

**Interfaces:**
- Consumes: Task 3 domain exports.
- Produces: `parsePercentInput(value: string): number`, `formatPercentInput(rate: number): string`; routes `routes.collectors.*` (param `collectorId`), `routes.collectorActions.setActive`; `NavKey` termasuk `'collectors'`.

- [ ] **Step 1: Tulis failing tests**

`apps/web/app/lib/percent.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { formatPercentInput, parsePercentInput } from './percent.ts'

describe('percent input', () => {
  it('parses dot and comma decimals into a fraction', () => {
    assert.equal(parsePercentInput('10'), 0.1)
    assert.equal(parsePercentInput('7,5'), 0.075)
    assert.equal(parsePercentInput(' 7.5 '), 0.075)
  })

  it('returns NaN for empty or non-numeric input so the domain rejects it', () => {
    assert.ok(Number.isNaN(parsePercentInput('')))
    assert.ok(Number.isNaN(parsePercentInput('abc')))
  })

  it('formats a fraction back to a percent string', () => {
    assert.equal(formatPercentInput(0.075), '7.5')
    assert.equal(formatPercentInput(0.1), '10')
  })
})
```

Tambahkan di `apps/web/app/actions/controller.test.ts` (di dalam `describe`):

```ts
  it('GET /collectors redirects anonymous users to login', async () => {
    let response = await router.fetch(new URL(routes.collectors.index.href(), 'http://localhost'))

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), routes.login.index.href())
  })
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test`
Expected: FAIL — `./percent.ts` tidak ada / `routes.collectors` undefined.

- [ ] **Step 3: `apps/web/app/lib/percent.ts`**

```ts
export function parsePercentInput(value: string): number {
  let trimmed = value.trim()
  if (!trimmed) return Number.NaN
  let percent = Number(trimmed.replace(',', '.'))
  // Round through basis points so "7.5" becomes exactly 0.075, not 0.07500000000000001.
  return Math.round(percent * 100) / 10_000
}

export function formatPercentInput(rate: number): string {
  return String(Math.round(rate * 10_000) / 100)
}
```

- [ ] **Step 4: Routes** — di `apps/web/app/routes.ts`, tambahkan setelah blok `invoices: resources(...)`:

```ts
  collectors: resources('/collectors', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'collectorId',
  }),
  collectorActions: {
    setActive: post('/collectors/:collectorId/active'),
  },
```

- [ ] **Step 5: Navigasi** — `apps/web/app/ui/layout.tsx`:

```ts
export type NavKey = 'dashboard' | 'clients' | 'collectors' | 'invoices' | 'settings'
```

Di array `NAV`, setelah item `clients`:

```ts
  { key: 'collectors', label: 'Kolektor', icon: 'wallet', href: () => routes.collectors.index.href() },
```

- [ ] **Step 6: Controller** — `apps/web/app/actions/collectors/controller.tsx`:

```tsx
import { createController } from 'remix/router'
import type { Handle } from 'remix/ui'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import {
  createCollector,
  getCollector,
  getCollectorSummary,
  isDomainError,
  listCollectorSummaries,
  setCollectorActive,
  updateCollector,
} from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { formatPercentInput, parsePercentInput } from '../../lib/percent.ts'
import { icon } from '../../ui/icons.tsx'
import { alertBox, formatDate, formatIdr, pageTitle, statusBadge } from '../../ui/kit.tsx'
import { AppLayout, loadShellUser, type ShellUser } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

const NOTICES: Record<string, { variant: 'success' | 'destructive'; title: string }> = {
  created: { variant: 'success', title: 'Kolektor tersimpan' },
  updated: { variant: 'success', title: 'Perubahan kolektor tersimpan' },
  deactivated: { variant: 'success', title: 'Kolektor dinonaktifkan' },
  activated: { variant: 'success', title: 'Kolektor diaktifkan kembali' },
  has_active: {
    variant: 'destructive',
    title: 'Kolektor masih menagih invoice aktif — lepas atau ganti kolektor di invoice tersebut dulu',
  },
}

interface CollectorValues {
  name: string
  email: string
  phone: string
  notes: string
  commissionPercent: string
}

function readCollectorValues(formData: FormData): CollectorValues {
  let text = (name: string) => String(formData.get(name) ?? '').trim()
  return {
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    notes: text('notes'),
    commissionPercent: text('commissionPercent'),
  }
}

function toCollectorInput(values: CollectorValues) {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    notes: values.notes || null,
    commissionRate: parsePercentInput(values.commissionPercent),
  }
}

function noticeFor(url: URL) {
  let notice = NOTICES[url.searchParams.get('notice') ?? '']
  return notice ? alertBox(notice.variant, notice.title) : null
}

function redirectWithNotice(href: string, notice: string): never {
  throw redirect(`${href}?notice=${notice}`, 303)
}

function setActiveForm(userId: string, collectorId: string, active: boolean, redirectTo: string) {
  return (
    <form method="post" action={routes.collectorActions.setActive.href({ collectorId })} class="inline">
      <CsrfInput userId={userId} />
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" class="btn btn-ghost btn-sm">
        {active ? 'Aktifkan' : 'Nonaktifkan'}
      </button>
    </form>
  )
}

export default createController(routes.collectors, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let [user, summaries] = await Promise.all([loadShellUser(userId), listCollectorSummaries(userId)])
      let activeCount = summaries.filter((s) => s.collector.active).length
      let indexHref = routes.collectors.index.href()
      return context.render(
        <AppLayout title="Kolektor" user={user} active="collectors">
          {pageTitle(
            'Kolektor',
            `${activeCount} kolektor aktif · assign kolektor dari halaman detail invoice terkirim atau jatuh tempo.`,
            <a class="btn btn-default" href={routes.collectors.new.href()}>
              {icon('plus')}
              Tambah kolektor
            </a>,
          )}
          {noticeFor(context.url)}
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th class="hidden md:table-cell">Kontak</th>
                  <th class="text-right">Komisi</th>
                  <th class="text-right">Invoice aktif</th>
                  <th class="hidden text-right md:table-cell">Outstanding</th>
                  <th class="hidden text-right md:table-cell">Komisi diperoleh</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(({ collector, activeCount, activeOutstandingCents, earnedCommissionCents }) => (
                  <tr key={collector.id} class={collector.active ? undefined : 'text-muted-foreground'}>
                    <td>
                      <a class="font-medium hover:text-primary" href={routes.collectors.show.href({ collectorId: collector.id })}>
                        {collector.name}
                      </a>
                      {collector.active ? null : <span class="ml-2 text-xs">(nonaktif)</span>}
                    </td>
                    <td class="hidden text-sm md:table-cell">
                      {[collector.email, collector.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td class="text-right tabular-nums">{formatPercentInput(collector.commissionRate)}%</td>
                    <td class="text-right tabular-nums">{activeCount}</td>
                    <td class="hidden text-right tabular-nums md:table-cell">{formatIdr(activeOutstandingCents)}</td>
                    <td class="hidden text-right tabular-nums md:table-cell">{formatIdr(earnedCommissionCents)}</td>
                    <td class="text-right">
                      <a class="btn btn-ghost btn-sm" href={routes.collectors.edit.href({ collectorId: collector.id })}>
                        Edit
                      </a>
                      {setActiveForm(userId, collector.id, !collector.active, indexHref)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summaries.length === 0 ? (
              <div class="border-t p-10 text-center text-sm text-muted-foreground">
                Belum ada kolektor. Tambahkan kolektor untuk mulai menugaskan penagihan.
              </div>
            ) : null}
          </div>
        </AppLayout>,
      )
    },

    async new(context) {
      let userId = requireUserId(context.request)
      return renderCollectorForm(context, await loadShellUser(userId), { values: { commissionPercent: '0' } })
    },

    async create(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readCollectorValues(await context.request.formData())
      let collectorId: string
      try {
        collectorId = (await createCollector(userId, toCollectorInput(values))).id
      } catch (error) {
        if (!isDomainError(error)) throw error
        return renderCollectorForm(context, await loadShellUser(userId), { values, error: error.message })
      }
      redirectWithNotice(routes.collectors.show.href({ collectorId }), 'created')
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let [user, summary] = await Promise.all([
        loadShellUser(userId),
        getCollectorSummary(userId, context.params.collectorId),
      ])
      let { collector } = summary
      let showHref = routes.collectors.show.href({ collectorId: collector.id })
      return context.render(
        <AppLayout title={collector.name} user={user} active="collectors">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href={routes.collectors.index.href()}>Kolektor</a>
            {icon('chevron-right')}
            <span class="text-foreground">{collector.name}</span>
          </nav>
          {pageTitle(
            collector.name,
            `Komisi ${formatPercentInput(collector.commissionRate)}% · ${collector.active ? 'aktif' : 'nonaktif'}`,
            <>
              <a class="btn btn-outline" href={routes.collectors.edit.href({ collectorId: collector.id })}>
                {icon('pencil')}
                Edit
              </a>
              {setActiveForm(userId, collector.id, !collector.active, showHref)}
            </>,
          )}
          {noticeFor(context.url)}
          <section class="grid gap-4 sm:grid-cols-3" aria-label="Ringkasan">
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Invoice aktif</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{summary.activeCount}</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Outstanding ditagih</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{formatIdr(summary.activeOutstandingCents)}</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Komisi diperoleh</p>
              <p class="mt-1 text-2xl font-bold text-success tabular-nums">{formatIdr(summary.earnedCommissionCents)}</p>
            </div>
          </section>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Klien</th>
                  <th class="text-right">Jumlah</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Sejak</th>
                </tr>
              </thead>
              <tbody>
                {summary.activeAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <a class="font-mono text-xs font-medium hover:text-primary" href={routes.invoices.show.href({ invoiceId: a.invoiceId })}>
                        {a.invoice.number ?? 'draft'}
                      </a>
                    </td>
                    <td>{a.invoice.client.name}</td>
                    <td class="text-right tabular-nums">{formatIdr(a.invoice.totalCents)}</td>
                    <td>{statusBadge(a.invoice.status)}</td>
                    <td class="hidden md:table-cell">{formatDate(a.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.activeAssignments.length === 0 ? (
              <div class="border-t p-10 text-center text-sm text-muted-foreground">
                Tidak ada invoice yang sedang ditagih kolektor ini.
              </div>
            ) : null}
          </div>
        </AppLayout>,
      )
    },

    async edit(context) {
      let userId = requireUserId(context.request)
      let [user, collector] = await Promise.all([loadShellUser(userId), getCollector(userId, context.params.collectorId)])
      return renderCollectorForm(context, user, {
        collector,
        values: {
          name: collector.name,
          email: collector.email ?? '',
          phone: collector.phone ?? '',
          notes: collector.notes ?? '',
          commissionPercent: formatPercentInput(collector.commissionRate),
        },
      })
    },

    async update(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readCollectorValues(await context.request.formData())
      let collectorId = context.params.collectorId
      try {
        await updateCollector(userId, collectorId, toCollectorInput(values))
      } catch (error) {
        if (!isDomainError(error)) throw error
        let [user, collector] = await Promise.all([loadShellUser(userId), getCollector(userId, collectorId)])
        return renderCollectorForm(context, user, { collector, values, error: error.message })
      }
      redirectWithNotice(routes.collectors.show.href({ collectorId }), 'updated')
    },
  },
})

export const collectorActionsController = createController(routes.collectorActions, {
  actions: {
    async setActive(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let active = formData.get('active') === 'true'
      let back = formData.get('redirectTo')
      let target =
        typeof back === 'string' && back.startsWith('/') && !back.startsWith('//')
          ? back
          : routes.collectors.index.href()
      try {
        await setCollectorActive(userId, context.params.collectorId, active)
      } catch (error) {
        if (isDomainError(error) && error.code === 'collector_has_active_assignments') {
          redirectWithNotice(target, 'has_active')
        }
        throw error
      }
      redirectWithNotice(target, active ? 'activated' : 'deactivated')
    },
  },
})

function renderCollectorForm(
  context: { render: RenderFunction },
  user: ShellUser,
  options: { collector?: { id: string; name: string }; values?: Partial<CollectorValues>; error?: string },
) {
  return context.render(
    <CollectorFormPage user={user} collector={options.collector} values={options.values ?? {}} error={options.error} />,
    { status: options.error ? 422 : 200 },
  )
}

function CollectorFormPage(
  handle: Handle<{
    user: ShellUser
    collector?: { id: string; name: string }
    values: Partial<CollectorValues>
    error?: string
  }>,
) {
  return () => {
    let { user, collector, values, error } = handle.props
    let title = collector ? 'Edit kolektor' : 'Tambah kolektor'
    let cancelHref = collector
      ? routes.collectors.show.href({ collectorId: collector.id })
      : routes.collectors.index.href()
    return (
      <AppLayout title={title} user={user} active="collectors">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href={routes.collectors.index.href()}>Kolektor</a>
          {icon('chevron-right')}
          <span class="text-foreground">{title}</span>
        </nav>
        <form
          method="post"
          action={collector ? routes.collectors.update.href({ collectorId: collector.id }) : routes.collectors.create.href()}
          class="card mx-auto max-w-xl"
        >
          <CsrfInput userId={user.id} />
          {collector ? <input type="hidden" name="_method" value="PUT" /> : null}
          <div class="card-header">
            <h1 class="card-title text-lg">{title}</h1>
            <p class="card-description">Kolektor tidak mendapat akses aplikasi — data ini hanya untuk catatan kamu.</p>
          </div>
          <div class="card-content space-y-4">
            {error ? alertBox('destructive', 'Kolektor belum tersimpan', <p>{error}</p>) : null}
            <div class="field">
              <label class="label" for="col-name">
                Nama <span class="text-destructive">*</span>
              </label>
              <input id="col-name" name="name" class="input" required value={values.name ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-email">Email</label>
              <input id="col-email" name="email" type="email" class="input" value={values.email ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-phone">Telepon</label>
              <input id="col-phone" name="phone" type="tel" class="input" value={values.phone ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-rate">
                Komisi default (%) <span class="text-destructive">*</span>
              </label>
              <input
                id="col-rate"
                name="commissionPercent"
                class="input"
                inputmode="decimal"
                required
                value={values.commissionPercent ?? '0'}
              />
              <p class="field-description">Dari total invoice (termasuk PPN). Terkunci per invoice saat di-assign.</p>
            </div>
            <div class="field">
              <label class="label" for="col-notes">Catatan</label>
              <textarea id="col-notes" name="notes" class="textarea min-h-16" value={values.notes ?? ''} />
            </div>
          </div>
          <div class="card-footer justify-end border-t pt-6">
            <a class="btn btn-outline" href={cancelHref}>
              Batal
            </a>
            <button type="submit" class="btn btn-default">
              {icon('save')}
              Simpan
            </button>
          </div>
        </form>
      </AppLayout>
    )
  }
}
```

- [ ] **Step 7: Wire router** — `apps/web/app/router.ts`:

```ts
import collectorsController, { collectorActionsController } from './actions/collectors/controller.tsx'
```

```ts
router.map(routes.collectors, collectorsController)
router.map(routes.collectorActions, collectorActionsController)
```

- [ ] **Step 8: Jalankan test + typecheck**

Run: `npm test && npm run typecheck`
Expected: semua pass, exit 0.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/lib/percent.ts apps/web/app/lib/percent.test.ts apps/web/app/routes.ts apps/web/app/router.ts apps/web/app/ui/layout.tsx apps/web/app/actions/collectors/controller.tsx apps/web/app/actions/controller.test.ts
git commit -m "feat(web): add collectors pages and navigation (FR-14a/b/g)"
```

---

### Task 8: Web — panel Penagihan di detail invoice + filter list

**Files:**
- Modify: `apps/web/app/routes.ts`
- Create: `apps/web/app/actions/collection/controller.tsx`
- Create: `apps/web/app/ui/collection-panel.tsx`
- Modify: `apps/web/app/router.ts`
- Modify: `apps/web/app/ui/invoice-detail.tsx` (NOTICES :20-24, props :34-39, aside :338)
- Modify: `apps/web/app/actions/invoices/controller.tsx` (imports :4-13, `index` :146-176 + toolbar, `show`)
- Modify: `apps/web/app/ui/invoice-table.tsx` (`InvoiceRow` :7-17, row + header)
- Modify: `apps/web/app/actions/controller.test.ts`

**Interfaces:**
- Consumes: Task 4 (`assignCollector`, `unassignCollector`, `addCollectionActivity`, `getInvoiceCollection`, `COLLECTION_OUTCOMES`, `CollectionOutcome`, `InvoiceCollection`), Task 3 `listCollectors`, Task 2 `computeCommissionCents`, Task 5 `listInvoices(userId, status?, collectorId?)`, Task 7 `formatPercentInput`.
- Produces: `collectionPanel(options: CollectionPanelOptions): RemixNode`; `routes.invoiceCollection.{assign,unassign,addActivity}`; `InvoiceDetailProps.collectionPanel?: RemixNode`.

- [ ] **Step 1: Tulis failing smoke test** — tambahkan di `apps/web/app/actions/controller.test.ts`:

```ts
  it('POST collection assign requires login', async () => {
    let response = await router.fetch(
      new URL(routes.invoiceCollection.assign.href({ invoiceId: 'x' }), 'http://localhost'),
      { method: 'POST' },
    )

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), routes.login.index.href())
  })
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test`
Expected: FAIL — `routes.invoiceCollection` undefined.

- [ ] **Step 3: Routes** — di `apps/web/app/routes.ts`, setelah `collectorActions`:

```ts
  invoiceCollection: {
    assign: post('/invoices/:invoiceId/collection/assign'),
    unassign: post('/invoices/:invoiceId/collection/unassign'),
    addActivity: post('/invoices/:invoiceId/collection/activities'),
  },
```

- [ ] **Step 4: Controller** — `apps/web/app/actions/collection/controller.tsx`:

```tsx
import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import { addCollectionActivity, assignCollector, isDomainError, unassignCollector } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { requireUserId } from '../../lib/auth.ts'
import { parseDateInput } from '../../ui/kit.tsx'
import { routes } from '../../routes.ts'

async function runCollectionAction(
  invoiceId: string,
  successNotice: string,
  action: () => Promise<unknown>,
): Promise<never> {
  let href = routes.invoices.show.href({ invoiceId })
  try {
    await action()
  } catch (error) {
    if (!isDomainError(error)) throw error
    throw redirect(`${href}?code=${encodeURIComponent(error.code)}#penagihan`, 303)
  }
  throw redirect(`${href}?notice=${successNotice}#penagihan`, 303)
}

export default createController(routes.invoiceCollection, {
  actions: {
    async assign(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'assigned', () =>
        assignCollector(userId, invoiceId, String(formData.get('collectorId') ?? '')),
      )
    },

    async unassign(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'unassigned', () => unassignCollector(userId, invoiceId))
    },

    async addActivity(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'activity_added', () =>
        addCollectionActivity(userId, invoiceId, {
          occurredAt: parseDateInput(formData.get('occurredAt')) ?? new Date(Number.NaN),
          outcome: String(formData.get('outcome') ?? ''),
          note: String(formData.get('note') ?? ''),
        }),
      )
    },
  },
})
```

Wire di `apps/web/app/router.ts`:

```ts
import collectionController from './actions/collection/controller.tsx'
```

```ts
router.map(routes.invoiceCollection, collectionController)
```

- [ ] **Step 5: Panel UI** — `apps/web/app/ui/collection-panel.tsx`:

```tsx
import type { RemixNode } from 'remix/ui'
import {
  COLLECTION_OUTCOMES,
  computeCommissionCents,
  type CollectionOutcome,
  type InvoiceCollection,
} from '@invoicing/domain'

import { CsrfInput } from '../lib/csrf-field.tsx'
import { formatPercentInput } from '../lib/percent.ts'
import { routes } from '../routes.ts'
import { alertBox, formatDate, formatIdr, toDateInput } from './kit.tsx'

const OUTCOME_LABEL: Record<CollectionOutcome, string> = {
  contacted: 'Dihubungi',
  no_response: 'Tidak merespons',
  promised_to_pay: 'Janji bayar',
  partial_payment_reported: 'Lapor bayar sebagian',
  refused: 'Menolak',
  other: 'Lainnya',
}

const END_REASON_LABEL: Record<string, string> = {
  reassigned: 'Diganti',
  unassigned: 'Dilepas',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
}

const ERROR_MESSAGES: Record<string, string> = {
  collector_not_found: 'Kolektor tidak ditemukan.',
  collector_inactive: 'Kolektor nonaktif — aktifkan dulu di halaman Kolektor.',
  invoice_not_outstanding: 'Hanya invoice terkirim atau jatuh tempo yang dapat ditagih.',
  already_assigned: 'Kolektor itu sudah di-assign ke invoice ini.',
  no_active_assignment: 'Belum ada kolektor di invoice ini.',
  invalid_outcome: 'Pilih hasil penagihan.',
  invalid_occurred_at: 'Tanggal aktivitas tidak boleh kosong atau di masa depan.',
}

export interface CollectionPanelOptions {
  userId: string
  invoice: { id: string; status: string; totalCents: number }
  collection: InvoiceCollection
  collectors: Array<{ id: string; name: string; commissionRate: number }>
  errorCode?: string | null
}

export function collectionPanel(options: CollectionPanelOptions): RemixNode {
  let { userId, invoice, collection, collectors, errorCode } = options
  let isOpen = invoice.status === 'sent' || invoice.status === 'overdue'
  if (!isOpen && collection.history.length === 0) return null

  let active = collection.active
  let candidates = collectors.filter((c) => c.id !== active?.collectorId)
  let today = toDateInput(new Date())

  return (
    <section id="penagihan" class="card gap-4">
      <div class="card-header">
        <h2 class="card-title">Penagihan</h2>
        <p class="card-description">Catatan internal — tidak tampil ke klien.</p>
      </div>
      <div class="card-content space-y-4">
        {errorCode ? alertBox('destructive', ERROR_MESSAGES[errorCode] ?? 'Aksi penagihan gagal.') : null}

        {active ? (
          <div class="space-y-1 text-sm">
            <p class="font-medium">{active.collector.name}</p>
            <p class="text-muted-foreground">
              Sejak {formatDate(active.assignedAt)} · komisi {formatPercentInput(active.rateSnapshot)}% (≈{' '}
              {formatIdr(computeCommissionCents(invoice.totalCents, active.rateSnapshot))})
            </p>
          </div>
        ) : isOpen ? (
          <p class="text-sm text-muted-foreground">Belum ada kolektor.</p>
        ) : null}

        {isOpen && candidates.length ? (
          <form method="post" action={routes.invoiceCollection.assign.href({ invoiceId: invoice.id })} class="flex gap-2">
            <CsrfInput userId={userId} />
            <select name="collectorId" class="select" required aria-label="Pilih kolektor">
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatPercentInput(c.commissionRate)}%)
                </option>
              ))}
            </select>
            <button type="submit" class="btn btn-outline btn-sm">
              {active ? 'Ganti' : 'Assign'}
            </button>
          </form>
        ) : null}

        {isOpen && collectors.length === 0 ? (
          <a class="btn btn-link btn-sm" href={routes.collectors.new.href()}>
            Tambah kolektor dulu
          </a>
        ) : null}

        {isOpen && active ? (
          <>
            <form method="post" action={routes.invoiceCollection.unassign.href({ invoiceId: invoice.id })}>
              <CsrfInput userId={userId} />
              <button type="submit" class="btn btn-ghost btn-sm">
                Lepas kolektor
              </button>
            </form>
            <form
              method="post"
              action={routes.invoiceCollection.addActivity.href({ invoiceId: invoice.id })}
              class="grid gap-2 border-t pt-4"
            >
              <CsrfInput userId={userId} />
              <div class="grid grid-cols-2 gap-2">
                <input class="input" type="date" name="occurredAt" value={today} max={today} required aria-label="Tanggal" />
                <select class="select" name="outcome" required aria-label="Hasil">
                  {COLLECTION_OUTCOMES.map((outcome) => (
                    <option key={outcome} value={outcome}>
                      {OUTCOME_LABEL[outcome]}
                    </option>
                  ))}
                </select>
              </div>
              <textarea class="textarea min-h-16" name="note" placeholder="Catatan (opsional)" aria-label="Catatan" />
              <button type="submit" class="btn btn-default btn-sm">
                Catat aktivitas
              </button>
            </form>
          </>
        ) : null}

        {collection.history.length ? (
          <ol class="space-y-3 border-t pt-4 text-sm">
            {collection.history.map((assignment) => (
              <li key={assignment.id} class="space-y-1">
                <p class="font-medium">
                  {assignment.collector.name}{' '}
                  <span class="text-xs font-normal text-muted-foreground">
                    {assignment.endedAt
                      ? `${END_REASON_LABEL[assignment.endReason ?? ''] ?? 'Selesai'} ${formatDate(assignment.endedAt)}`
                      : 'aktif'}
                    {assignment.commissionCents !== null ? ` · komisi ${formatIdr(assignment.commissionCents)}` : ''}
                  </span>
                </p>
                {assignment.activities.map((activity) => (
                  <p key={activity.id} class="text-xs text-muted-foreground">
                    {formatDate(activity.occurredAt)} — {OUTCOME_LABEL[activity.outcome]}
                    {activity.note ? `: ${activity.note}` : ''}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Sisipkan panel ke detail invoice** — `apps/web/app/ui/invoice-detail.tsx`:

Tambah entri di `NOTICES` (:20-24):

```ts
  assigned: { variant: 'success', title: 'Kolektor di-assign' },
  unassigned: { variant: 'info', title: 'Kolektor dilepas dari invoice' },
  activity_added: { variant: 'success', title: 'Aktivitas penagihan dicatat' },
```

Tambah prop di `InvoiceDetailProps` (:34-39):

```ts
  collectionPanel?: RemixNode
```

Di render, ubah destructuring `let { user, invoice, publicUrl, notice } = handle.props` menjadi `let { user, invoice, publicUrl, notice, collectionPanel } = handle.props`, lalu sisipkan `{collectionPanel}` di dalam `<aside class="space-y-4">` tepat setelah `</section>` kartu "Tautan publik" (sebelum kartu "Aktivitas").

- [ ] **Step 7: Controller invoices** — `apps/web/app/actions/invoices/controller.tsx`:

Import domain (:4-13) — tambahkan `getInvoiceCollection` dan `listCollectors`:

```ts
import {
  createInvoiceDraft,
  getInvoice,
  getInvoiceCollection,
  getUserById,
  isDomainError,
  listClients,
  listCollectors,
  listInvoices,
  updateInvoiceDraft,
} from '@invoicing/domain'
```

Tambah import UI:

```ts
import { collectionPanel } from '../../ui/collection-panel.tsx'
```

Ganti action `show`:

```tsx
    async show(context) {
      let userId = requireUserId(context.request)
      let invoiceId = context.params.invoiceId
      let [user, invoice, collection, collectors] = await Promise.all([
        loadShellUser(userId),
        getInvoice(userId, invoiceId),
        getInvoiceCollection(userId, invoiceId),
        listCollectors(userId),
      ])
      return context.render(
        <InvoiceDetail
          user={user}
          invoice={invoice}
          notice={context.url.searchParams.get('notice')}
          publicUrl={
            invoice.publicToken ? `${appUrl()}${routes.publicInvoice.href({ token: invoice.publicToken })}` : ''
          }
          collectionPanel={collectionPanel({
            userId,
            invoice,
            collection,
            collectors,
            errorCode: context.url.searchParams.get('code'),
          })}
        />,
      )
    },
```

Di action `index`, ganti baris loader:

```ts
      let collectorId = context.url.searchParams.get('collectorId') ?? ''
      let [user, invoices, collectors] = await Promise.all([
        loadShellUser(userId),
        listInvoices(userId, undefined, collectorId || undefined),
        listCollectors(userId, true),
      ])
```

Di `tabHref`, setelah `if (q) params.set('q', q)`:

```ts
        if (collectorId) params.set('collectorId', collectorId)
```

Di toolbar, di dalam form pencarian setelah hidden input `status`:

```tsx
                  {collectorId ? <input type="hidden" name="collectorId" value={collectorId} /> : null}
```

dan tambahkan form filter kolektor tepat setelah `{statusTabs({ ... })}`:

```tsx
                {collectors.length ? (
                  <form method="get" action={routes.invoices.index.href()} class="flex items-center gap-2">
                    {active !== 'all' ? <input type="hidden" name="status" value={active} /> : null}
                    {q ? <input type="hidden" name="q" value={q} /> : null}
                    <select name="collectorId" class="select h-8" aria-label="Filter kolektor">
                      <option value="" selected={!collectorId}>
                        Semua kolektor
                      </option>
                      {collectors.map((c) => (
                        <option key={c.id} value={c.id} selected={c.id === collectorId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" class="btn btn-outline btn-sm">
                      Terapkan
                    </button>
                  </form>
                ) : null}
```

- [ ] **Step 8: Kolom Kolektor di tabel** — `apps/web/app/ui/invoice-table.tsx`:

Di `InvoiceRow` tambahkan:

```ts
  collectionAssignments?: Array<{ collector: { name: string } }>
```

Di `<thead>`, setelah `<th>Status</th>`:

```tsx
              <th class="hidden lg:table-cell">Kolektor</th>
```

Di row, setelah `<td>{statusBadge(inv.status)}</td>`:

```tsx
        <td class="hidden text-sm text-muted-foreground lg:table-cell">
          {inv.collectionAssignments?.[0]?.collector.name ?? '—'}
        </td>
```

- [ ] **Step 9: Jalankan test + typecheck**

Run: `npm test && npm run test:domain && npm run typecheck`
Expected: semua pass, exit 0.

- [ ] **Step 10: Verifikasi manual di browser**

Run: `npm run dev`, login demo (`npm run db:seed` bila perlu), lalu:
1. `/collectors` → tambah kolektor "Budi", komisi `7,5` → detail menampilkan "Komisi 7.5%".
2. Buka invoice berstatus Terkirim → panel "Penagihan" → Assign Budi → notice "Kolektor di-assign", estimasi komisi tampil.
3. Catat aktivitas "Janji bayar" → muncul di riwayat.
4. Coba nonaktifkan Budi di `/collectors` → notice merah BR-09.
5. Tandai lunas → riwayat menampilkan "Lunas … · komisi Rp…"; `/collectors` menampilkan komisi diperoleh.
6. `/invoices?collectorId=<id Budi>` hanya menampilkan invoice Budi; kolom Kolektor terisi.
7. Buka tautan publik invoice → tidak ada nama kolektor.

- [ ] **Step 11: Commit**

```bash
git add apps/web/app/routes.ts apps/web/app/router.ts apps/web/app/actions/collection/controller.tsx apps/web/app/ui/collection-panel.tsx apps/web/app/ui/invoice-detail.tsx apps/web/app/actions/invoices/controller.tsx apps/web/app/ui/invoice-table.tsx apps/web/app/actions/controller.test.ts
git commit -m "feat(web): add collection panel on invoice detail and collector filter (FR-14c/d/f)"
```

---

### Task 9: Dokumentasi

**Files:**
- Modify: `docs/product/requirements/README.md`
- Modify: `docs/product/brd/mvp-scope-lock.md`
- Modify: `docs/product/brd.md`
- Modify: `docs/engineering/api.md`
- Modify: `docs/architecture/README.md`
- Modify: `docs/product/legal/legal-review-checklist.md`
- Modify: `docs/product/requirements/0700-debt-collector/0700-prd-debt-collector.md` (status)

- [ ] **Step 1: PRD index** — tambahkan baris di tabel `docs/product/requirements/README.md` setelah baris 0600:

```markdown
| 12 | **0700** | [0700-debt-collector](.) | G7 | FR-14, BR-07–BR-09 (post-MVP) | 0501 |
```

- [ ] **Step 2: Scope lock & BRD** — di `docs/product/brd/mvp-scope-lock.md`, tambahkan section baru di akhir:

```markdown
## Post-MVP (disetujui terpisah)

| ID | Requirement | PRD |
|----|-------------|-----|
| FR-14 | Debt collector (kontak) + assign ke invoice outstanding + log penagihan + komisi | [0700](0700-prd-debt-collector.md) |

| BR | Aturan |
|----|--------|
| BR-07 | Assign/aktivitas penagihan hanya untuk invoice `sent`/`overdue`; kolektor harus aktif & milik user |
| BR-08 | Rate komisi di-snapshot saat assign; dikunci saat `paid`, tanpa komisi saat `cancelled` |
| BR-09 | Kolektor dengan assignment aktif tidak dapat dinonaktifkan |

Kolektor **bukan user** — non-goal multi-user tetap berlaku.
```

Di `docs/product/brd.md`, setelah baris `Should/Could/Won't: ...` (:59), tambahkan:

```markdown
Post-MVP: FR-14 debt collector — [PRD-0700](0700-prd-debt-collector.md).
```

- [ ] **Step 3: api.md** — tambahkan section baru sebelum section endpoint publik:

```markdown
## Debt collector (FR-14 · PRD-0700)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/v1/collectors` | List + ringkasan (`activeCount`, `activeOutstandingCents`, `earnedCommissionCents`) |
| POST | `/api/v1/collectors` | Create → 201. Body `{ name, email?, phone?, notes?, commissionRate }` (fraksi 0–1) |
| GET | `/api/v1/collectors/:id` | Detail + assignment aktif |
| PATCH | `/api/v1/collectors/:id` | Update; `active: false` → 409 `collector_has_active_assignments` bila masih menagih |
| DELETE | `/api/v1/collectors/:id` | Nonaktifkan (BR-09) |
| GET | `/api/v1/invoices/:id/collection` | `{ active, history }` — `history[0]` = assignment aktif bila ada |
| POST | `/api/v1/invoices/:id/collection/assign` | `{ collectorId }` — assign/reassign (BR-07) |
| POST | `/api/v1/invoices/:id/collection/unassign` | Lepas kolektor |
| POST | `/api/v1/invoices/:id/collection/activities` | `{ occurredAt, outcome, note? }` → 201 |
| GET | `/api/v1/invoices?collectorId=` | Filter invoice yang sedang ditagih kolektor |
```

Sekalian perbaiki drift: baris `POST /api/v1/invoices/:id/cancel` ubah `**Belum** (gap G-01)` menjadi `Implemented`; baris revoke-link hapus `(UI web: gap G-02)`.

- [ ] **Step 4: ARCHITECTURE.md** — di tabel/daftar komponen domain (C4 Level 3, §7), tambahkan `collectors` (CRUD kolektor) dan `collections` (assignment, aktivitas, komisi) di bawah `packages_domain`, dan di mermaid `webActions` tambahkan node `CollectorsCtrl[collectors]`, di `apiActions` tambahkan `ApiCollectors[v1_collectors_collection]`.

- [ ] **Step 5: Legal checklist** — tambahkan baris di `docs/product/legal/legal-review-checklist.md`:

```markdown
- [ ] **FR-14 debt collector:** freelancer membagikan data debitur (klien) ke kolektor pihak ketiga di luar aplikasi — tinjau UU PDP (freelancer sebagai pengendali data) dan kebutuhan klausul di [terms.md](../../legal/terms.md) / [privacy.md](../../legal/privacy.md).
```

- [ ] **Step 6: Status spec** — di `0700-prd-debt-collector.md`, ubah `| Status | Draft spec — menunggu review |` menjadi `| Status | Implemented |` dan `| Development phase | *(dibuat setelah spec disetujui)* |` menjadi `| Development phase | [0700-prd-debt-collector-development-phase.md](0700-prd-debt-collector-development-phase.md) |`.

- [ ] **Step 7: Verifikasi akhir**

Run: `npm run typecheck && npm run test:domain && npm test && npm run gate`
Expected: semua exit 0, gate `=== All gates PASS ===`.

- [ ] **Step 8: Commit**

```bash
git add docs/product/requirements/README.md docs/product/brd/mvp-scope-lock.md docs/product/brd.md docs/engineering/api.md docs/architecture/README.md docs/product/legal/legal-review-checklist.md docs/product/requirements/0700-debt-collector
git commit -m "docs(prd): document debt collector module (PRD-0700, FR-14)"
```

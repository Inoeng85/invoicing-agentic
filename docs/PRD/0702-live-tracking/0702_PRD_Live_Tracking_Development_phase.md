# PRD-0702 — Live Tracking Kolektor · Development Phase (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kolektor membagikan lokasi lewat link `/t/:token` di browser HP; freelancer melihat posisi terakhir & jejak kolektor menuju pin rumah klien di peta Leaflet yang di-refresh tiap 15 detik.

**Architecture:** Data lokasi di SQLite (`CollectorLocation` + kolom `last*`/`trackingToken` di `CollectionAssignment`, `latitude/longitude` di `Client`). Aturan (BR-10–12) di `@invoicing/domain` (`geo.ts`, `collector-tracking.ts`, perubahan `collections.ts`/`clients.ts`). Web: dua controller baru + tiga island `clientEntry` (TrackingSharer, TrackingMap, LocationPicker) yang memuat Leaflet **secara dinamis hanya di browser**.

**Tech Stack:** Prisma 6 + SQLite, Remix 3 (`remix/ui` `clientEntry`/`ref`/`on`), Leaflet 1.9.4 (ESM build), OpenStreetMap tiles, `node:test`, `remix/test`.

**Spec:** [0702_PRD_Live_Tracking.md](./0702_PRD_Live_Tracking.md)

## Global Constraints

- Kerja di branch baru `feat/0702-live-tracking` dari `main` (setelah perubahan UI tertunda di `main` di-commit oleh pemilik repo).
- `nvm use` (Node ≥ 24.3); npm workspaces; verifikasi per task: `npm run typecheck && npm run test:domain && npm test`.
- Migration: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url file:<tmp> --script` lalu `migrate deploy` + `generate` (cwd `packages/database`) — `migrate dev` macet di non-TTY.
- Token: `randomBytes(24).toString('base64url')`.
- Validasi lokasi (BR-12): `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, `accuracyM` 0–1000 (> 1000 → 422 `location_inaccurate`), `recordedAt` ≤ now + 5 menit dan ≥ `assignedAt`.
- Kolektor mengirim tiap ≥ 30 detik atau pindah > 50 m; peta freelancer poll tiap 15 detik; body lokasi ≤ 1024 byte; rate-limit 12/menit per token.
- Leaflet **tidak boleh** di-import statis di modul yang ikut dirender server (Leaflet membaca `window` saat import) — hanya via `loadLeaflet()` di dalam `ref(...)`.
- Teks yang berasal dari data pengguna (nama klien/kolektor) masuk ke Leaflet hanya sebagai `HTMLElement` dengan `textContent`, **tidak pernah** sebagai string HTML (Leaflet tooltip/popup string = `innerHTML`).
- Atribusi `© OpenStreetMap contributors` wajib tampil di setiap peta.
- Halaman `/t/:token`: `noindex`, tanpa nominal/nomor invoice.
- Web test yang menyentuh DB mengimpor `@invoicing/domain/test-setup` lebih dulu (sudah di `controller.test.ts`).
- Commit per task, conventional commits, `git add` file spesifik.

## Review Focus

1. **Kolektor membuka link setelah penugasan berakhir** (lunas/diganti) → halaman "Link tidak aktif" (404) dan POST lokasi 410; island berhenti mengirim. (Task 3 domain + Task 5 web.)
2. **Reassign ke kolektor lain** → link kolektor lama mati dan jejaknya terhapus; peta menampilkan kolektor baru tanpa jejak lama. (Task 3.)
3. **Nama klien/kolektor berisi `<img onerror>`** → tampil sebagai teks di tooltip peta, tidak dieksekusi. (Task 6: tooltip memakai `textContent`; test render memastikan nama di-escape di HTML server.)
4. **Klien tanpa pin** → peta tetap jalan (hanya marker kolektor), jarak tidak ditampilkan. (Task 2 `distanceToClientM: null`; Task 6 render.)
5. **Isian lat/lng hanya satu terisi atau teks** di form klien → error "Koordinat tidak valid", data lama tidak berubah. (Task 7.)

---

### Task 1: Schema + migration

**Files:**
- Modify: `packages/database/prisma/schema.prisma`, `packages/database/src/index.ts`
- Create: `packages/database/prisma/migrations/20260930140000_live_tracking/migration.sql` (generated)

**Interfaces:**
- Produces: `Client.latitude/longitude: number | null`; `CollectionAssignment.trackingToken: string | null`, `lastLatitude/lastLongitude/lastAccuracyM: number | null`, `lastLocationAt: Date | null`; delegate `prisma.collectorLocation`; type export `CollectorLocation`.

- [ ] **Step 1: Schema** — di `model Client` tambah setelah `active`:

```prisma
  latitude  Float?
  longitude Float?
```

Di `model CollectionAssignment` tambah setelah `activities`:

```prisma
  trackingToken  String?             @unique @map("tracking_token")
  lastLatitude   Float?              @map("last_latitude")
  lastLongitude  Float?              @map("last_longitude")
  lastAccuracyM  Float?              @map("last_accuracy_m")
  lastLocationAt DateTime?           @map("last_location_at")
  locations      CollectorLocation[]
```

Di akhir file:

```prisma
model CollectorLocation {
  id           String               @id @default(cuid())
  assignmentId String               @map("assignment_id")
  assignment   CollectionAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  latitude     Float
  longitude    Float
  accuracyM    Float?               @map("accuracy_m")
  recordedAt   DateTime             @map("recorded_at")
  receivedAt   DateTime             @default(now()) @map("received_at")

  @@index([assignmentId, recordedAt])
  @@map("collector_locations")
}
```

- [ ] **Step 2: Generate SQL** (cwd `packages/database`):

```bash
SH=$(mktemp -d)/shadow.db; D=prisma/migrations/20260930140000_live_tracking; mkdir -p $D
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "file:$SH" --script > $D/migration.sql
```

Expected: `ALTER TABLE "clients" ADD COLUMN "latitude"`/`"longitude"`, redefinisi atau `ALTER` untuk `collection_assignments` (kolom baru + `CREATE UNIQUE INDEX ... tracking_token`), `CREATE TABLE "collector_locations"`.

- [ ] **Step 3:** `npx prisma migrate deploy && npx prisma generate`; tambahkan `CollectorLocation,` ke daftar `export type` di `packages/database/src/index.ts`.
- [ ] **Step 4:** `npm run typecheck && npm run test:domain && npm test` → semua pass (skema baru additive).
- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/20260930140000_live_tracking packages/database/src/index.ts
git commit -m "feat(database): add collector location tracking and client coordinates"
```

---

### Task 2: Domain `geo.ts` + `collector-tracking.ts`

**Files:**
- Create: `packages/domain/src/geo.ts`, `packages/domain/src/geo.test.ts`, `packages/domain/src/collector-tracking.ts`, `packages/domain/src/collector-tracking.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: Task 1 schema; fixtures `makeUser/makeClient/makeInvoice/makeCollector`; `assignCollector`.
- Produces (exported dari `@invoicing/domain`):
  - `interface GeoPoint { latitude: number; longitude: number }`
  - `distanceMeters(a: GeoPoint, b: GeoPoint): number`
  - `assertValidCoordinates(point: GeoPoint): void` (400 `invalid_location`)
  - `MAX_LOCATION_ACCURACY_M = 1000`
  - `createTrackingLink(userId: string, invoiceId: string): Promise<string>`
  - `revokeTrackingLink(userId: string, invoiceId: string): Promise<void>`
  - `getTrackingSession(token: string): Promise<TrackingSession>` — `{ collectorName: string; freelancerName: string; client: { name: string; address: string | null; latitude: number | null; longitude: number | null } }`
  - `recordCollectorLocation(token: string, input: { latitude: number; longitude: number; accuracyM?: number | null; recordedAt: Date }): Promise<void>`
  - `getTrackingView(userId: string, invoiceId: string): Promise<TrackingView>` — `{ client: {name, address, latitude, longitude}; collector: { id: string; name: string; photoUpdatedAt: Date | null } | null; assignmentActive: boolean; trackingActive: boolean; last: { latitude: number; longitude: number; accuracyM: number | null; at: Date } | null; trail: Array<{ latitude: number; longitude: number; recordedAt: Date }>; distanceToClientM: number | null }`

- [ ] **Step 1: Failing tests** — `packages/domain/src/geo.test.ts`:

```ts
import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { assertValidCoordinates, distanceMeters } from './geo.ts'

const JAKARTA = { latitude: -6.2088, longitude: 106.8456 }
const BANDUNG = { latitude: -6.9175, longitude: 107.6191 }

describe('geo', () => {
  it('Jakarta–Bandung is about 116 km as the crow flies', () => {
    let km = distanceMeters(JAKARTA, BANDUNG) / 1000
    assert.ok(km > 114 && km < 118, `got ${km}`)
  })

  it('same point is 0 m', () => {
    assert.equal(distanceMeters(JAKARTA, JAKARTA), 0)
  })

  it('rejects out-of-range or non-finite coordinates', () => {
    for (let point of [
      { latitude: 91, longitude: 0 },
      { latitude: 0, longitude: -181 },
      { latitude: Number.NaN, longitude: 0 },
    ]) {
      assert.throws(() => assertValidCoordinates(point), (e: unknown) => (e as { code?: string }).code === 'invalid_location')
    }
    assertValidCoordinates(JAKARTA)
  })
})
```

`packages/domain/src/collector-tracking.test.ts`:

```ts
import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { prisma } from '@invoicing/database'

import { assignCollector } from './collections.ts'
import {
  createTrackingLink,
  getTrackingSession,
  getTrackingView,
  recordCollectorLocation,
  revokeTrackingLink,
} from './collector-tracking.ts'
import { makeClient, makeCollector, makeInvoice, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

const HOME = { latitude: -6.2, longitude: 106.8 }
const NEARBY = { latitude: -6.21, longitude: 106.81 }

async function assigned() {
  let user = await makeUser()
  let client = await makeClient(user.id)
  await prisma.client.update({ where: { id: client.id }, data: HOME })
  let invoice = await makeInvoice(user.id, client.id)
  let collector = await makeCollector(user.id)
  await assignCollector(user.id, invoice.id, collector.id)
  return { user, client, invoice, collector }
}

describe('tracking links (FR-14i-1, BR-10)', () => {
  it('creates a link only for an active assignment', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await rejectsWith(createTrackingLink(user.id, invoice.id), 'no_active_assignment')
  })

  it('session exposes destination but no invoice money or number', async () => {
    let { user, invoice, client, collector } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    let session = await getTrackingSession(token)
    assert.equal(session.collectorName, collector.name)
    assert.equal(session.freelancerName, 'Studio Test')
    assert.deepEqual(session.client, { name: client.name, address: null, ...HOME })
    assert.equal(JSON.stringify(session).includes('totalCents'), false)
    assert.equal(JSON.stringify(session).includes(invoice.number!), false)
  })

  it('regenerating replaces the old token; revoke kills it', async () => {
    let { user, invoice } = await assigned()
    let first = await createTrackingLink(user.id, invoice.id)
    let second = await createTrackingLink(user.id, invoice.id)
    assert.notEqual(first, second)
    await rejectsWith(getTrackingSession(first), 'tracking_not_found')
    await revokeTrackingLink(user.id, invoice.id)
    await rejectsWith(getTrackingSession(second), 'tracking_not_found')
  })

  it('other users cannot manage the link', async () => {
    let { invoice } = await assigned()
    let other = await makeUser()
    await rejectsWith(createTrackingLink(other.id, invoice.id), 'not_found')
    await rejectsWith(revokeTrackingLink(other.id, invoice.id), 'not_found')
  })
})

describe('recordCollectorLocation (FR-14i-3, BR-12)', () => {
  it('stores the point and updates last position', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { ...NEARBY, accuracyM: 12, recordedAt: new Date() })
    let view = await getTrackingView(user.id, invoice.id)
    assert.equal(view.last?.latitude, NEARBY.latitude)
    assert.equal(view.last?.accuracyM, 12)
    assert.equal(view.trail.length, 1)
    assert.ok(view.distanceToClientM !== null && view.distanceToClientM > 1000 && view.distanceToClientM < 2000)
  })

  it('validates coordinates, accuracy and time', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await rejectsWith(recordCollectorLocation(token, { latitude: 99, longitude: 0, recordedAt: new Date() }), 'invalid_location')
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, accuracyM: 1500, recordedAt: new Date() }),
      'location_inaccurate',
    )
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date(Date.now() + 10 * 60_000) }),
      'invalid_location',
    )
    await rejectsWith(
      recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date(Date.now() - 24 * 3_600_000) }),
      'invalid_location',
    )
  })

  it('unknown or revoked token → tracking_ended', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    await revokeTrackingLink(user.id, invoice.id)
    await rejectsWith(recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() }), 'tracking_ended')
    await rejectsWith(recordCollectorLocation('nope', { ...NEARBY, recordedAt: new Date() }), 'tracking_ended')
  })
})

describe('getTrackingView (FR-14i-4)', () => {
  it('is scoped to the owner', async () => {
    let { invoice } = await assigned()
    let other = await makeUser()
    await rejectsWith(getTrackingView(other.id, invoice.id), 'not_found')
  })

  it('without client pin there is no distance', async () => {
    let { user, invoice, client } = await assigned()
    await prisma.client.update({ where: { id: client.id }, data: { latitude: null, longitude: null } })
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
    let view = await getTrackingView(user.id, invoice.id)
    assert.equal(view.distanceToClientM, null)
    assert.equal(view.trackingActive, true)
  })

  it('trail only contains points from today', async () => {
    let { user, invoice } = await assigned()
    let token = await createTrackingLink(user.id, invoice.id)
    let assignment = await prisma.collectionAssignment.findFirstOrThrow({ where: { invoiceId: invoice.id } })
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await prisma.collectorLocation.create({ data: { assignmentId: assignment.id, ...HOME, recordedAt: yesterday } })
    await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
    assert.equal((await getTrackingView(user.id, invoice.id)).trail.length, 1)
  })
})
```

- [ ] **Step 2:** `npm run test:domain` → FAIL (`./geo.ts` / `./collector-tracking.ts` missing).

- [ ] **Step 3: Implement** — `packages/domain/src/geo.ts`:

```ts
import { DomainError } from './errors.ts'

export interface GeoPoint {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_M = 6_371_000

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  let rad = (deg: number) => (deg * Math.PI) / 180
  let dLat = rad(b.latitude - a.latitude)
  let dLng = rad(b.longitude - a.longitude)
  let h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function assertValidCoordinates(point: GeoPoint): void {
  let { latitude, longitude } = point
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new DomainError('Koordinat tidak valid', 'invalid_location')
  }
}
```

`packages/domain/src/collector-tracking.ts`:

```ts
import { randomBytes } from 'node:crypto'

import { prisma } from '@invoicing/database'

import { DomainError } from './errors.ts'
import { assertValidCoordinates, distanceMeters, type GeoPoint } from './geo.ts'

export const MAX_LOCATION_ACCURACY_M = 1000
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

async function requireOwnedInvoice(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)
}

export async function createTrackingLink(userId: string, invoiceId: string): Promise<string> {
  await requireOwnedInvoice(userId, invoiceId)
  let token = randomBytes(24).toString('base64url')
  let updated = await prisma.collectionAssignment.updateMany({
    where: { invoiceId, userId, endedAt: null },
    data: { trackingToken: token },
  })
  if (updated.count === 0) throw new DomainError('Belum ada kolektor', 'no_active_assignment', 409)
  return token
}

export async function revokeTrackingLink(userId: string, invoiceId: string): Promise<void> {
  await requireOwnedInvoice(userId, invoiceId)
  await prisma.collectionAssignment.updateMany({
    where: { invoiceId, userId, endedAt: null },
    data: { trackingToken: null },
  })
}

export async function getTrackingSession(token: string) {
  let assignment = await prisma.collectionAssignment.findFirst({
    where: { trackingToken: token, endedAt: null },
    select: {
      collector: { select: { name: true } },
      user: { select: { profile: { select: { legalName: true } } } },
      invoice: { select: { client: { select: { name: true, address: true, latitude: true, longitude: true } } } },
    },
  })
  if (!assignment) throw new DomainError('Link tracking tidak aktif', 'tracking_not_found', 404)
  return {
    collectorName: assignment.collector.name,
    freelancerName: assignment.user.profile?.legalName ?? 'Freelancer',
    client: assignment.invoice.client,
  }
}

export type TrackingSession = Awaited<ReturnType<typeof getTrackingSession>>

export async function recordCollectorLocation(
  token: string,
  input: GeoPoint & { accuracyM?: number | null; recordedAt: Date },
): Promise<void> {
  assertValidCoordinates(input)
  let accuracyM = input.accuracyM ?? null
  if (accuracyM !== null && !(Number.isFinite(accuracyM) && accuracyM >= 0)) {
    throw new DomainError('Akurasi tidak valid', 'invalid_location')
  }
  if (accuracyM !== null && accuracyM > MAX_LOCATION_ACCURACY_M) {
    throw new DomainError('Lokasi kurang akurat', 'location_inaccurate', 422)
  }
  let recordedMs = input.recordedAt.getTime()
  if (!Number.isFinite(recordedMs) || recordedMs > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new DomainError('Waktu lokasi tidak valid', 'invalid_location')
  }

  await prisma.$transaction(async (tx) => {
    let assignment = await tx.collectionAssignment.findFirst({
      where: { trackingToken: token, endedAt: null },
      select: { id: true, assignedAt: true },
    })
    if (!assignment) throw new DomainError('Penugasan sudah selesai', 'tracking_ended', 410)
    if (recordedMs < assignment.assignedAt.getTime()) {
      throw new DomainError('Waktu lokasi tidak valid', 'invalid_location')
    }
    await tx.collectorLocation.create({
      data: {
        assignmentId: assignment.id,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyM,
        recordedAt: input.recordedAt,
      },
    })
    await tx.collectionAssignment.update({
      where: { id: assignment.id },
      data: {
        lastLatitude: input.latitude,
        lastLongitude: input.longitude,
        lastAccuracyM: accuracyM,
        lastLocationAt: input.recordedAt,
      },
    })
  })
}

export async function getTrackingView(userId: string, invoiceId: string) {
  let invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: {
      client: { select: { name: true, address: true, latitude: true, longitude: true } },
      collectionAssignments: {
        orderBy: { assignedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          endedAt: true,
          trackingToken: true,
          lastLatitude: true,
          lastLongitude: true,
          lastAccuracyM: true,
          lastLocationAt: true,
          collector: { select: { id: true, name: true, photoUpdatedAt: true } },
        },
      },
    },
  })
  if (!invoice) throw new DomainError('Invoice tidak ditemukan', 'not_found', 404)

  let latest = invoice.collectionAssignments[0] ?? null
  let active = latest && latest.endedAt === null ? latest : null
  let startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  let trail = active
    ? await prisma.collectorLocation.findMany({
        where: { assignmentId: active.id, recordedAt: { gte: startOfToday } },
        orderBy: { recordedAt: 'asc' },
        select: { latitude: true, longitude: true, recordedAt: true },
      })
    : []

  let last =
    latest?.lastLocationAt && latest.lastLatitude !== null && latest.lastLongitude !== null
      ? {
          latitude: latest.lastLatitude,
          longitude: latest.lastLongitude,
          accuracyM: latest.lastAccuracyM,
          at: latest.lastLocationAt,
        }
      : null
  let { client } = invoice
  let clientPoint =
    client.latitude !== null && client.longitude !== null
      ? { latitude: client.latitude, longitude: client.longitude }
      : null

  return {
    client,
    collector: latest?.collector ?? null,
    assignmentActive: active !== null,
    trackingActive: Boolean(active?.trackingToken),
    last,
    trail,
    distanceToClientM: last && clientPoint ? Math.round(distanceMeters(last, clientPoint)) : null,
  }
}

export type TrackingView = Awaited<ReturnType<typeof getTrackingView>>
```

Export di `packages/domain/src/index.ts`:

```ts
export { assertValidCoordinates, distanceMeters, type GeoPoint } from './geo.ts'
export {
  MAX_LOCATION_ACCURACY_M,
  createTrackingLink,
  revokeTrackingLink,
  getTrackingSession,
  recordCollectorLocation,
  getTrackingView,
  type TrackingSession,
  type TrackingView,
} from './collector-tracking.ts'
```

- [ ] **Step 4:** `npm run test:domain && npm run typecheck` → pass.
- [ ] **Step 5: Commit** — `feat(domain): tracking links, collector locations and tracking view (FR-14i, BR-10, BR-12)` (`git add` 5 file di atas).

---

### Task 3: Penutupan penugasan membersihkan tracking (BR-11) + lokasi klien (FR-14j)

**Files:**
- Modify: `packages/domain/src/collections.ts` (reassign di `assignCollector`, `unassignCollector`, `closeActiveAssignmentInTx`), `packages/domain/src/clients.ts`, `packages/domain/src/index.ts`
- Modify (tests): `packages/domain/src/collector-tracking.test.ts`
- Create: `packages/domain/src/clients-location.test.ts`

**Interfaces:**
- Consumes: Task 2 `createTrackingLink`, `recordCollectorLocation`, `getTrackingView`, `getTrackingSession`; `assertValidCoordinates`.
- Produces: `setClientLocation(userId: string, clientId: string, location: GeoPoint | null): Promise<Client>`.

- [ ] **Step 1: Failing tests** — tambahkan ke `collector-tracking.test.ts` (import `markInvoicePaid, cancelInvoice` dari `./invoices.ts`, `unassignCollector` dari `./collections.ts`):

```ts
describe('ending an assignment clears tracking (BR-11)', () => {
  let cases: Array<[string, (ctx: Awaited<ReturnType<typeof assigned>>) => Promise<unknown>]> = [
    ['paid', ({ user, invoice }) => markInvoicePaid(user.id, invoice.id)],
    ['cancelled', ({ user, invoice }) => cancelInvoice(user.id, invoice.id)],
    ['unassigned', ({ user, invoice }) => unassignCollector(user.id, invoice.id)],
    [
      'reassigned',
      async ({ user, invoice }) => assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id),
    ],
  ]
  for (let [reason, end] of cases) {
    it(`${reason}: token dies, trail deleted, last position kept`, async () => {
      let ctx = await assigned()
      let token = await createTrackingLink(ctx.user.id, ctx.invoice.id)
      await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
      let assignment = await prisma.collectionAssignment.findFirstOrThrow({ where: { trackingToken: token } })
      await end(ctx)
      await rejectsWith(getTrackingSession(token), 'tracking_not_found')
      await rejectsWith(recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() }), 'tracking_ended')
      assert.equal(await prisma.collectorLocation.count({ where: { assignmentId: assignment.id } }), 0)
      let closed = await prisma.collectionAssignment.findUniqueOrThrow({ where: { id: assignment.id } })
      assert.equal(closed.trackingToken, null)
      assert.equal(closed.lastLatitude, NEARBY.latitude)
    })
  }

  it('reassign shows the new collector without the old trail', async () => {
    let ctx = await assigned()
    let token = await createTrackingLink(ctx.user.id, ctx.invoice.id)
    await recordCollectorLocation(token, { ...NEARBY, recordedAt: new Date() })
    let next = await makeCollector(ctx.user.id)
    await assignCollector(ctx.user.id, ctx.invoice.id, next.id)
    let view = await getTrackingView(ctx.user.id, ctx.invoice.id)
    assert.equal(view.collector?.id, next.id)
    assert.equal(view.trail.length, 0)
    assert.equal(view.last, null)
    assert.equal(view.trackingActive, false)
  })
})
```

`packages/domain/src/clients-location.test.ts`:

```ts
import './test-setup.ts'

import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getClient, setClientLocation } from './clients.ts'
import { makeClient, makeUser } from './test-fixtures.ts'

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => (error as { code?: string }).code === code)
}

describe('setClientLocation (FR-14j)', () => {
  it('stores and clears the pin', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    await setClientLocation(user.id, client.id, { latitude: -6.2, longitude: 106.8 })
    let stored = await getClient(user.id, client.id)
    assert.deepEqual([stored.latitude, stored.longitude], [-6.2, 106.8])
    await setClientLocation(user.id, client.id, null)
    let cleared = await getClient(user.id, client.id)
    assert.deepEqual([cleared.latitude, cleared.longitude], [null, null])
  })

  it('rejects invalid coordinates and other users', async () => {
    let user = await makeUser()
    let other = await makeUser()
    let client = await makeClient(user.id)
    await rejectsWith(setClientLocation(user.id, client.id, { latitude: Number.NaN, longitude: 106 }), 'invalid_location')
    await rejectsWith(setClientLocation(other.id, client.id, { latitude: -6, longitude: 106 }), 'not_found')
  })
})
```

- [ ] **Step 2:** `npm run test:domain` → FAIL (token still valid after end; `setClientLocation` missing).

- [ ] **Step 3: Implement** — di `packages/domain/src/collections.ts`:

Ubah import tipe menjadi:

```ts
import {
  prisma,
  type AssignmentEndReason,
  type CollectionOutcome as PrismaCollectionOutcome,
  type Prisma,
} from '@invoicing/database'
```

Tambahkan helper setelah `findActiveAssignmentInTx`:

```ts
// Every way an assignment ends goes through here so its tracking link and location trail go too (BR-11).
async function endAssignmentInTx(
  tx: Tx,
  assignmentId: string,
  data: { endReason: AssignmentEndReason; commissionCents?: number | null },
) {
  await tx.collectorLocation.deleteMany({ where: { assignmentId } })
  return tx.collectionAssignment.update({
    where: { id: assignmentId },
    data: { ...data, endedAt: new Date(), trackingToken: null },
  })
}
```

Ganti tiga lokasi penutupan:
- `assignCollector`: `await tx.collectionAssignment.update({ where: { id: current.id }, data: { endedAt: new Date(), endReason: 'reassigned' } })` → `await endAssignmentInTx(tx, current.id, { endReason: 'reassigned' })`
- `unassignCollector`: return `endAssignmentInTx(tx, current.id, { endReason: 'unassigned' })`
- `closeActiveAssignmentInTx`: 

```ts
  await endAssignmentInTx(tx, current.id, {
    endReason: reason,
    commissionCents: reason === 'paid' ? computeCommissionCents(totalCents, current.rateSnapshot) : null,
  })
```

Di `packages/domain/src/clients.ts` tambahkan:

```ts
import { assertValidCoordinates, type GeoPoint } from './geo.ts'

export async function setClientLocation(userId: string, clientId: string, location: GeoPoint | null) {
  await getClient(userId, clientId)
  if (location) assertValidCoordinates(location)
  return prisma.client.update({
    where: { id: clientId },
    data: { latitude: location?.latitude ?? null, longitude: location?.longitude ?? null },
  })
}
```

dan tambahkan `setClientLocation,` ke blok export clients di `index.ts`.

- [ ] **Step 4:** `npm run test:domain && npm run typecheck` → pass (termasuk semua test PRD-0700 lama).
- [ ] **Step 5: Commit** — `feat(domain): clear tracking when assignments end and store client pins (BR-11, FR-14j)`.

---

### Task 4: Leaflet setup (dependency, assets, CSS, loader)

**Files:**
- Modify: `apps/web/package.json` (via npm), `package-lock.json`, `apps/web/app/assets.ts:16`, `apps/web/app/styles/app.css`
- Create: `apps/web/app/actions/public/leaflet.ts`, `apps/web/app/types/leaflet-esm.d.ts`

**Interfaces:**
- Produces: `loadLeaflet(): Promise<LeafletModule>`, `type LeafletModule = typeof import('leaflet')`, `OSM_TILES`, `OSM_ATTRIBUTION`, `textElement(text: string): HTMLElement`.

- [ ] **Step 1:** `npm install leaflet@1.9.4 -w @invoicing/web && npm install -D @types/leaflet@1.9.22 -w @invoicing/web`.
- [ ] **Step 2:** `apps/web/app/assets.ts`: `allowPackages: ['remix', 'leaflet'],`.
- [ ] **Step 3:** `apps/web/app/styles/app.css` — setelah `@import 'tailwindcss';` tambahkan `@import 'leaflet/dist/leaflet.css';`. Run `npm run css:build -w @invoicing/web` → Expected: sukses, `public/app.css` memuat `.leaflet-container`.
- [ ] **Step 4:** `apps/web/app/types/leaflet-esm.d.ts`:

```ts
declare module 'leaflet/dist/leaflet-src.esm.js' {
  export * from 'leaflet'
}
```

`apps/web/app/actions/public/leaflet.ts`:

```ts
export type LeafletModule = typeof import('leaflet')

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Leaflet touches `window` at import time, so it may only load in the browser — never during SSR.
export async function loadLeaflet(): Promise<LeafletModule> {
  return (await import('leaflet/dist/leaflet-src.esm.js')) as LeafletModule
}

// Leaflet treats string tooltip content as HTML; user-provided names must go in as text nodes.
export function textElement(text: string): HTMLElement {
  let span = document.createElement('span')
  span.textContent = text
  return span
}
```

- [ ] **Step 5: Verify asset resolution** — `npm run dev:web` (background), lalu `curl -s -o /dev/null -w '%{http_code}' http://localhost:44100/assets/npm/leaflet/dist/leaflet-src.esm.js` → Expected `200`. Jika bukan 200: **ruling** — muat Leaflet UMD dari `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` lewat `<script>` di head halaman peta dan ubah `loadLeaflet()` menjadi menunggu `window.L`; ledger ruling tersebut.
- [ ] **Step 6:** `npm run typecheck && npm test` → pass. Commit `build(web): add leaflet for tracking maps` (package.json, package-lock.json, assets.ts, app.css, leaflet.ts, leaflet-esm.d.ts).

---

### Task 5: Halaman kolektor `/t/:token` + endpoint lokasi + island TrackingSharer

**Files:**
- Modify: `apps/web/app/routes.ts`, `apps/web/app/router.ts` (rate-limit prefix + map), `apps/web/app/actions/controller.test.ts`
- Create: `apps/web/app/actions/tracking/controller.tsx`, `apps/web/app/actions/public/tracking-sharer.tsx`, `apps/web/app/actions/public/tracking-map.tsx`

**Interfaces:**
- Consumes: `getTrackingSession`, `recordCollectorLocation`, `isDomainError`; `loadLeaflet`, `OSM_*`, `textElement`.
- Produces: `routes.collectorTracking.page` (`/t/:token`), `routes.collectorTracking.location` (`/t/:token/location`); island `TrackingMap` (props below, reused Task 6); island `TrackingSharer`.

`TrackingMap` props (serializable):

```ts
export interface TrackingMapData {
  client: { name: string; latitude: number | null; longitude: number | null }
  collector: { name: string; photoUrl: string | null } | null
  last: { latitude: number; longitude: number; at: string } | null
  trail: Array<{ latitude: number; longitude: number }>
  distanceToClientM: number | null
}
export interface TrackingMapProps {
  initial: TrackingMapData
  dataUrl: string | null // null = static map (no polling)
  pollMs: number
  heightClass: string
}
```

- [ ] **Step 1: Failing web tests** — tambahkan ke `controller.test.ts` (import `createTrackingLink, revokeTrackingLink` dari `@invoicing/domain`):

```ts
  it('collector tracking page shows the destination without invoice money', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id, { totalCents: 123_456_700 })
    let collector = await makeCollector(user.id)
    await assignCollector(user.id, invoice.id, collector.id)
    let token = await createTrackingLink(user.id, invoice.id)

    let page = await fetchResponse(routes.collectorTracking.page.href({ token }))
    assert.equal(page.status, 200)
    let html = await page.text()
    assert.match(html, new RegExp(client.name))
    assert.match(html, /Mulai berbagi lokasi/)
    assert.match(html, /noindex/)
    assert.ok(!html.includes('1.234.567') && !html.includes(invoice.number!), 'no invoice money or number')

    await revokeTrackingLink(user.id, invoice.id)
    let dead = await fetchResponse(routes.collectorTracking.page.href({ token }))
    assert.equal(dead.status, 404)
  })

  it('accepts collector locations and rejects dead links and big bodies', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let token = await createTrackingLink(user.id, invoice.id)
    let href = routes.collectorTracking.location.href({ token })
    let post = (body: string) =>
      fetchResponse(href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) },
        body,
      })
    let point = JSON.stringify({ latitude: -6.2, longitude: 106.8, accuracyM: 10, recordedAt: new Date().toISOString() })

    assert.equal((await post(point)).status, 204)
    assert.equal((await post(JSON.stringify({ latitude: 200, longitude: 0, recordedAt: new Date().toISOString() }))).status, 400)
    assert.equal((await post('x'.repeat(2000))).status, 413)
    await revokeTrackingLink(user.id, invoice.id)
    assert.equal((await post(point)).status, 410)
  })
```

- [ ] **Step 2:** `npm test` → FAIL (`routes.collectorTracking` undefined).

- [ ] **Step 3: Routes & router** — `apps/web/app/routes.ts` tambahkan:

```ts
  collectorTracking: {
    page: get('/t/:token'),
    location: post('/t/:token/location'),
  },
```

`apps/web/app/router.ts`: di `publicInvoiceRateLimit`, ubah kondisi menjadi `if (path.startsWith('/i/') || path.startsWith('/t/')) {`; import & map:

```ts
import trackingController from './actions/tracking/controller.tsx'
```

```ts
router.map(routes.collectorTracking, trackingController)
```

- [ ] **Step 4: Island `TrackingMap`** — `apps/web/app/actions/public/tracking-map.tsx`:

```tsx
import { clientEntry, ref, type Handle } from 'remix/ui'

import { loadLeaflet, OSM_ATTRIBUTION, OSM_TILES, textElement } from './leaflet.ts'

export interface TrackingMapData {
  client: { name: string; latitude: number | null; longitude: number | null }
  collector: { name: string; photoUrl: string | null } | null
  last: { latitude: number; longitude: number; at: string } | null
  trail: Array<{ latitude: number; longitude: number }>
  distanceToClientM: number | null
}

export interface TrackingMapProps {
  initial: TrackingMapData
  dataUrl: string | null
  pollMs: number
  heightClass: string
}

const INDONESIA: [number, number] = [-2.5, 118]

function ago(iso: string): string {
  let minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  return minutes === 0 ? 'baru saja' : `${minutes} menit lalu`
}

function statusText(data: TrackingMapData): string {
  if (!data.last) return 'Kolektor belum mulai berbagi lokasi.'
  let parts = [`Diperbarui ${ago(data.last.at)}`]
  if (data.distanceToClientM !== null) parts.push(`±${(data.distanceToClientM / 1000).toFixed(1)} km ke rumah klien (garis lurus)`)
  return parts.join(' · ')
}

export const TrackingMap = clientEntry(import.meta.url, function TrackingMap(handle: Handle<TrackingMapProps>) {
  let data = handle.props.initial
  let failed = false

  async function mount(node: HTMLElement, signal: AbortSignal) {
    let L = await loadLeaflet()
    if (signal.aborted) return
    let map = L.map(node)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)
    let layer = L.layerGroup().addTo(map)
    let fitted = false

    let draw = () => {
      layer.clearLayers()
      let points: Array<[number, number]> = []
      let { client, last, trail, collector } = data
      if (client.latitude !== null && client.longitude !== null) {
        let home: [number, number] = [client.latitude, client.longitude]
        L.circleMarker(home, { radius: 9, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 })
          .bindTooltip(textElement(`Rumah ${client.name}`), { permanent: true, direction: 'top' })
          .addTo(layer)
        points.push(home)
      }
      if (trail.length > 1) {
        L.polyline(trail.map((p) => [p.latitude, p.longitude] as [number, number]), { color: '#2563eb', weight: 3, opacity: 0.6 }).addTo(layer)
      }
      if (last) {
        let here: [number, number] = [last.latitude, last.longitude]
        let marker = collector?.photoUrl
          ? L.marker(here, {
              icon: L.divIcon({
                className: '',
                iconSize: [36, 36],
                html: `<img src="${encodeURI(collector.photoUrl)}" alt="" style="width:36px;height:36px;border-radius:9999px;object-fit:cover;border:3px solid #2563eb" />`,
              }),
            })
          : L.circleMarker(here, { radius: 10, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9 })
        marker.bindTooltip(textElement(collector?.name ?? 'Kolektor'), { direction: 'top' }).addTo(layer)
        points.push(here)
      }
      if (!fitted) {
        if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 })
        else map.setView(INDONESIA, 5)
        fitted = true
      }
    }
    draw()

    let { dataUrl, pollMs } = handle.props
    if (!dataUrl) return
    let timer = setInterval(async () => {
      try {
        let response = await fetch(dataUrl, { signal, headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(String(response.status))
        data = (await response.json()) as TrackingMapData
        failed = false
        draw()
      } catch {
        if (signal.aborted) return
        failed = true
      }
      handle.update()
    }, pollMs)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      map.remove()
    })
  }

  return () => (
    <div class="space-y-2">
      <div
        class={`${handle.props.heightClass} w-full overflow-hidden rounded-xl border`}
        mix={[ref((node, signal) => void mount(node as HTMLElement, signal))]}
      />
      <p class="text-sm text-muted-foreground" aria-live="polite">
        {statusText(data)}
        {failed ? ' · gagal memperbarui, mencoba lagi…' : ''}
      </p>
    </div>
  )
})
```

(`photoUrl` selalu URL internal `/collectors/:id/photo?v=…` yang dibangun server — bukan input pengguna; `encodeURI` tetap dipakai sebagai pagar.)

- [ ] **Step 5: Island `TrackingSharer`** — `apps/web/app/actions/public/tracking-sharer.tsx`:

```tsx
import { clientEntry, on, type Handle } from 'remix/ui'

type SharerState = 'idle' | 'sharing' | 'stopped' | 'denied' | 'unavailable' | 'ended'

interface TrackingSharerProps {
  locationUrl: string
  minIntervalMs: number
  minDistanceM: number
}

// Equirectangular approximation — plenty for a "moved more than ~50 m" throttle.
function roughDistanceM(a: GeolocationCoordinates, b: GeolocationCoordinates): number {
  let rad = Math.PI / 180
  let x = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad)
  let y = (b.latitude - a.latitude) * rad
  return Math.sqrt(x * x + y * y) * 6_371_000
}

const MESSAGES: Record<SharerState, string> = {
  idle: 'Lokasi belum dibagikan.',
  sharing: 'Lokasi sedang dibagikan. Biarkan halaman ini tetap terbuka.',
  stopped: 'Berbagi lokasi dihentikan.',
  denied: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser, lalu coba lagi.',
  unavailable: 'Sinyal GPS belum tersedia. Mencoba lagi…',
  ended: 'Penugasan sudah selesai. Terima kasih — berbagi lokasi dihentikan.',
}

export const TrackingSharer = clientEntry(import.meta.url, function TrackingSharer(handle: Handle<TrackingSharerProps>) {
  let state: SharerState = 'idle'
  let watchId: number | null = null
  let lastSent: { coords: GeolocationCoordinates; at: number } | null = null
  let lastSentLabel = ''

  function stop(next: SharerState) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    state = next
    handle.update()
  }

  async function send(position: GeolocationPosition) {
    let { coords } = position
    let now = Date.now()
    if (lastSent && now - lastSent.at < handle.props.minIntervalMs && roughDistanceM(lastSent.coords, coords) <= handle.props.minDistanceM) {
      return
    }
    lastSent = { coords, at: now }
    try {
      let response = await fetch(handle.props.locationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyM: coords.accuracy,
          recordedAt: new Date(position.timestamp).toISOString(),
        }),
      })
      if (response.status === 410) return stop('ended')
      if (response.ok) {
        lastSentLabel = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        state = 'sharing'
        handle.update()
      }
    } catch {
      // Offline for a moment — the next position will retry.
    }
  }

  function start() {
    if (!('geolocation' in navigator)) return stop('unavailable')
    state = 'sharing'
    watchId = navigator.geolocation.watchPosition(
      (position) => void send(position),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) return stop('denied')
        state = 'unavailable'
        handle.update()
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    )
    handle.update()
  }

  return () => (
    <div class="space-y-3">
      <p class="text-sm" aria-live="polite">
        {MESSAGES[state]}
        {state === 'sharing' && lastSentLabel ? ` Terakhir terkirim ${lastSentLabel}.` : ''}
      </p>
      {state === 'sharing' || state === 'unavailable' ? (
        <button type="button" class="btn btn-outline w-full" mix={[on('click', () => stop('stopped'))]}>
          Hentikan
        </button>
      ) : state === 'ended' ? null : (
        <button type="button" class="btn btn-default w-full" mix={[on('click', start)]}>
          Mulai berbagi lokasi
        </button>
      )}
    </div>
  )
})
```

- [ ] **Step 6: Controller** — `apps/web/app/actions/tracking/controller.tsx`:

```tsx
import { createController } from 'remix/router'
import { getTrackingSession, isDomainError, recordCollectorLocation } from '@invoicing/domain'
import { rateLimitKey } from '@invoicing/platform'

import { APP_NAME } from '../../lib/brand.ts'
import { Document } from '../document.tsx'
import { TrackingMap } from '../public/tracking-map.tsx'
import { TrackingSharer } from '../public/tracking-sharer.tsx'
import { routes } from '../../routes.ts'

const MAX_LOCATION_BODY_BYTES = 1024
const noindex = <meta name="robots" content="noindex, nofollow" />

function json(status: number, body?: unknown): Response {
  return body === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export default createController(routes.collectorTracking, {
  actions: {
    async page(context) {
      let token = context.params.token
      let session
      try {
        session = await getTrackingSession(token)
      } catch (error) {
        if (!isDomainError(error)) throw error
        return context.render(
          <Document title={`Link tidak aktif — ${APP_NAME}`} head={noindex}>
            <main class="mx-auto max-w-md space-y-2 p-6 text-center">
              <h1 class="text-lg font-semibold">Link tracking tidak aktif</h1>
              <p class="text-sm text-muted-foreground">Penugasan sudah selesai atau link sudah diganti. Hubungi pemberi tugas.</p>
            </main>
          </Document>,
          { status: 404 },
        )
      }
      let { client } = session
      return context.render(
        <Document title={`Menuju ${client.name} — ${APP_NAME}`} head={noindex}>
          <main class="mx-auto max-w-md space-y-4 p-4">
            <header class="space-y-1">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tujuan penagihan</p>
              <h1 class="text-lg font-semibold">{client.name}</h1>
              {client.address ? <p class="text-sm text-muted-foreground">{client.address}</p> : null}
            </header>
            {client.latitude !== null && client.longitude !== null ? (
              <TrackingMap
                initial={{ client, collector: null, last: null, trail: [], distanceToClientM: null }}
                dataUrl={null}
                pollMs={0}
                heightClass="h-64"
              />
            ) : null}
            <section class="card gap-3 p-4">
              <p class="text-sm">
                Halo {session.collectorName}. Dengan menekan tombol di bawah, lokasi HP kamu akan dibagikan ke{' '}
                <strong>{session.freelancerName}</strong> selama halaman ini terbuka, untuk memantau perjalanan
                penagihan ini. Data lokasi dihapus saat penugasan selesai.
              </p>
              <TrackingSharer locationUrl={routes.collectorTracking.location.href({ token })} minIntervalMs={30_000} minDistanceM={50} />
            </section>
          </main>
        </Document>,
      )
    },

    async location(context) {
      let token = context.params.token
      if (!rateLimitKey(`tracking:${token}`, 12, 60_000)) return json(429, { error: 'rate_limit' })
      let length = Number(context.request.headers.get('Content-Length'))
      if (!length || length > MAX_LOCATION_BODY_BYTES) return json(413, { error: 'too_large' })
      let body: { latitude?: unknown; longitude?: unknown; accuracyM?: unknown; recordedAt?: unknown }
      try {
        body = (await context.request.json()) as typeof body
      } catch {
        return json(400, { error: 'invalid_json' })
      }
      try {
        await recordCollectorLocation(token, {
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          accuracyM: body.accuracyM === undefined || body.accuracyM === null ? null : Number(body.accuracyM),
          recordedAt: new Date(String(body.recordedAt)),
        })
      } catch (error) {
        if (!isDomainError(error)) throw error
        return json(error.status, { error: error.code })
      }
      return json(204)
    },
  },
})
```

- [ ] **Step 7:** `npm test && npm run typecheck` → pass. Commit `feat(web): collector tracking page and location endpoint (FR-14i-2/3)`.

---

### Task 6: Peta freelancer + link tracking di panel

**Files:**
- Modify: `apps/web/app/routes.ts`, `apps/web/app/router.ts`, `apps/web/app/ui/collection-panel.tsx`, `apps/web/app/actions/invoices/controller.tsx` (`show`), `apps/web/app/ui/invoice-detail.tsx` (NOTICES), `apps/web/app/actions/controller.test.ts`
- Create: `apps/web/app/actions/invoice-tracking/controller.tsx`, `apps/web/app/actions/public/copy-button.tsx`, `apps/web/app/ui/tracking-data.ts`

**Interfaces:**
- Consumes: `getTrackingView`, `createTrackingLink`, `revokeTrackingLink`, `TrackingMap`, `TrackingMapData`, `appUrl()` (`ui/invoice-table.tsx`).
- Produces: `routes.invoiceTracking.{page,data,createLink,revokeLink}`; `toTrackingMapData(view: TrackingView): TrackingMapData`; `CollectionPanelOptions.trackingUrl: string | null`.

- [ ] **Step 1: Failing web tests**:

```ts
  it('freelancer tracking map and JSON are owner-only', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id)
    await updateCollector(user.id, collector.id, { name: 'Budi <img src=x onerror=alert(1)>' })
    await assignCollector(user.id, invoice.id, collector.id)
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { latitude: -6.2, longitude: 106.8, recordedAt: new Date() })

    let page = await fetchResponse(routes.invoiceTracking.page.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })
    assert.equal(page.status, 200)
    let html = await page.text()
    assert.ok(!html.includes('<img src=x onerror'), 'collector name is escaped')
    assert.match(html, /OpenStreetMap|Diperbarui/)

    let data = await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })
    assert.equal(data.status, 200)
    assert.equal(data.headers.get('Cache-Control'), 'no-store')
    let body = (await data.json()) as { last: { latitude: number } | null }
    assert.equal(body.last?.latitude, -6.2)

    let other = await makeUser()
    assert.equal((await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }), { headers: sessionHeaders(other.id) })).status, 404)
    assert.equal((await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }))).status, 302)
  })

  it('creates and revokes the tracking link from the collection panel', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let csrf = { method: 'POST', headers: sessionHeaders(user.id), body: new URLSearchParams({ _csrf: createCsrfToken(user.id) }) }

    let created = await fetchResponse(routes.invoiceTracking.createLink.href({ invoiceId: invoice.id }), csrf)
    assert.match(created.headers.get('Location') ?? '', /notice=tracking_link_created/)
    let detail = await (await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })).text()
    assert.match(detail, /\/t\/[A-Za-z0-9_-]{32}/)
    assert.match(detail, /Lihat peta/)

    let revoked = await fetchResponse(routes.invoiceTracking.revokeLink.href({ invoiceId: invoice.id }), {
      ...csrf,
      body: new URLSearchParams({ _csrf: createCsrfToken(user.id) }),
    })
    assert.match(revoked.headers.get('Location') ?? '', /notice=tracking_link_revoked/)
    let after = await (await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })).text()
    assert.ok(!/\/t\/[A-Za-z0-9_-]{32}/.test(after))
  })
```

(import `createTrackingLink, recordCollectorLocation` dari `@invoicing/domain`.)

- [ ] **Step 2:** `npm test` → FAIL (`routes.invoiceTracking` undefined).

- [ ] **Step 3: Routes** — `apps/web/app/routes.ts`:

```ts
  invoiceTracking: {
    page: get('/invoices/:invoiceId/tracking'),
    data: get('/invoices/:invoiceId/tracking.json'),
    createLink: post('/invoices/:invoiceId/tracking/link'),
    revokeLink: post('/invoices/:invoiceId/tracking/link/revoke'),
  },
```

`router.ts`: `import invoiceTrackingController from './actions/invoice-tracking/controller.tsx'` + `router.map(routes.invoiceTracking, invoiceTrackingController)`.

- [ ] **Step 4: `apps/web/app/ui/tracking-data.ts`**:

```ts
import type { TrackingView } from '@invoicing/domain'

import type { TrackingMapData } from '../actions/public/tracking-map.tsx'
import { routes } from '../routes.ts'

export function toTrackingMapData(view: TrackingView): TrackingMapData {
  let { collector } = view
  return {
    client: { name: view.client.name, latitude: view.client.latitude, longitude: view.client.longitude },
    collector: collector
      ? {
          name: collector.name,
          photoUrl: collector.photoUpdatedAt
            ? `${routes.collectorActions.photo.href({ collectorId: collector.id })}?v=${collector.photoUpdatedAt.getTime()}`
            : null,
        }
      : null,
    last: view.last ? { latitude: view.last.latitude, longitude: view.last.longitude, at: view.last.at.toISOString() } : null,
    trail: view.trail.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    distanceToClientM: view.distanceToClientM,
  }
}
```

- [ ] **Step 5: Controller** — `apps/web/app/actions/invoice-tracking/controller.tsx`:

```tsx
import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import { createTrackingLink, getInvoice, getTrackingView, isDomainError, revokeTrackingLink } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { requireUserId } from '../../lib/auth.ts'
import { icon } from '../../ui/icons.tsx'
import { AppLayout, loadShellUser } from '../../ui/layout.tsx'
import { toTrackingMapData } from '../../ui/tracking-data.ts'
import { TrackingMap } from '../public/tracking-map.tsx'
import { routes } from '../../routes.ts'

function backToPanel(invoiceId: string, query: string): never {
  throw redirect(`${routes.invoices.show.href({ invoiceId })}?${query}#penagihan`, 303)
}

export default createController(routes.invoiceTracking, {
  actions: {
    async page(context) {
      let userId = requireUserId(context.request)
      let invoiceId = context.params.invoiceId
      let [user, invoice, view] = await Promise.all([
        loadShellUser(userId),
        getInvoice(userId, invoiceId),
        getTrackingView(userId, invoiceId),
      ])
      let title = `Tracking ${invoice.number ?? 'invoice'}`
      return context.render(
        <AppLayout title={title} user={user} active="invoices">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href={routes.invoices.show.href({ invoiceId })}>{invoice.number ?? 'Invoice'}</a>
            {icon('chevron-right')}
            <span class="text-foreground">Tracking kolektor</span>
          </nav>
          <div class="space-y-1">
            <h1 class="text-xl font-bold">Tracking kolektor</h1>
            <p class="text-sm text-muted-foreground">
              {view.collector ? `${view.collector.name} → rumah ${view.client.name}` : 'Belum ada kolektor untuk invoice ini.'}
              {view.assignmentActive && !view.trackingActive ? ' · link tracking belum dibuat atau sudah dicabut.' : ''}
              {view.client.latitude === null ? ' · pin rumah klien belum diatur.' : ''}
            </p>
          </div>
          <TrackingMap
            initial={toTrackingMapData(view)}
            dataUrl={view.assignmentActive ? routes.invoiceTracking.data.href({ invoiceId }) : null}
            pollMs={15_000}
            heightClass="h-[60vh]"
          />
        </AppLayout>,
      )
    },

    async data(context) {
      let userId = requireUserId(context.request)
      try {
        let view = await getTrackingView(userId, context.params.invoiceId)
        return new Response(JSON.stringify(toTrackingMapData(view)), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
      } catch (error) {
        if (isDomainError(error) && error.status === 404) return new Response('Not Found', { status: 404 })
        throw error
      }
    },

    async createLink(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      try {
        await createTrackingLink(userId, invoiceId)
      } catch (error) {
        if (!isDomainError(error)) throw error
        backToPanel(invoiceId, `code=${encodeURIComponent(error.code)}`)
      }
      backToPanel(invoiceId, 'notice=tracking_link_created')
    },

    async revokeLink(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      await revokeTrackingLink(userId, invoiceId)
      backToPanel(invoiceId, 'notice=tracking_link_revoked')
    },
  },
})
```

- [ ] **Step 6: CopyButton island** — `apps/web/app/actions/public/copy-button.tsx`:

```tsx
import { clientEntry, on, type Handle } from 'remix/ui'

export const CopyButton = clientEntry(
  import.meta.url,
  function CopyButton(handle: Handle<{ text: string; label: string }>) {
    let copied = false
    return () => (
      <button
        type="button"
        class="btn btn-outline btn-sm"
        mix={[
          on('click', async () => {
            try {
              await navigator.clipboard.writeText(handle.props.text)
              copied = true
            } catch {
              copied = false
            }
            await handle.update()
          }),
        ]}
      >
        {copied ? 'Tersalin' : handle.props.label}
      </button>
    )
  },
)
```

- [ ] **Step 7: Panel** — `collection-panel.tsx`: tambah `trackingUrl: string | null` ke `CollectionPanelOptions`; import `CopyButton`; di dalam blok `{isOpen && active ? (<> … </>) : null}`, **sebelum** form "Lepas kolektor", sisipkan:

```tsx
            <div class="space-y-2 border-t pt-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Live tracking</p>
              {trackingUrl ? (
                <div class="flex gap-2">
                  <input class="input font-mono text-xs" readonly value={trackingUrl} aria-label="Link tracking kolektor" />
                  <CopyButton text={trackingUrl} label="Salin" />
                </div>
              ) : (
                <p class="text-sm text-muted-foreground">Buat link lalu kirim ke kolektor (mis. via WhatsApp).</p>
              )}
              <div class="flex flex-wrap gap-2">
                <form method="post" action={routes.invoiceTracking.createLink.href({ invoiceId: invoice.id })}>
                  <CsrfInput userId={userId} />
                  <button type="submit" class="btn btn-outline btn-sm">
                    {trackingUrl ? 'Buat ulang link' : 'Buat link tracking'}
                  </button>
                </form>
                {trackingUrl ? (
                  <form method="post" action={routes.invoiceTracking.revokeLink.href({ invoiceId: invoice.id })}>
                    <CsrfInput userId={userId} />
                    <button type="submit" class="btn btn-ghost btn-sm text-destructive">
                      Cabut link
                    </button>
                  </form>
                ) : null}
                <a class="btn btn-link btn-sm" href={routes.invoiceTracking.page.href({ invoiceId: invoice.id })}>
                  Lihat peta
                </a>
              </div>
            </div>
```

dan destrukturisasi `trackingUrl` dari `options`. Tambah ke `ERROR_MESSAGES`: `no_active_assignment` sudah ada.

- [ ] **Step 8: Wiring** — `invoices/controller.tsx` `show`: tambahkan ke `collectionPanel({...})`:

```ts
            trackingUrl: collection.active?.trackingToken
              ? `${appUrl()}${routes.collectorTracking.page.href({ token: collection.active.trackingToken })}`
              : null,
```

`invoice-detail.tsx` NOTICES tambah:

```ts
  tracking_link_created: { variant: 'success', title: 'Link tracking dibuat — kirim ke kolektor' },
  tracking_link_revoked: { variant: 'info', title: 'Link tracking dicabut' },
```

- [ ] **Step 9:** `npm test && npm run typecheck` → pass. Commit `feat(web): freelancer tracking map and tracking link controls (FR-14i-1/4)`.

---

### Task 7: Pin lokasi klien (FR-14j)

**Files:**
- Modify: `apps/web/app/actions/clients/controller.tsx` (`edit`, `update`, `ClientFormPage`), `apps/web/app/actions/controller.test.ts`
- Create: `apps/web/app/actions/public/location-picker.tsx`

**Interfaces:**
- Consumes: `setClientLocation`, `loadLeaflet`, `OSM_*`.
- Produces: island `LocationPicker` props `{ latitude: number | null; longitude: number | null }` — renders inputs `name="latitude"` / `name="longitude"`.

- [ ] **Step 1: Failing web tests**:

```ts
  it('saves, clears and validates the client pin from the edit form', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let submit = (fields: Record<string, string>) =>
      fetchResponse(routes.clients.update.href({ clientId: client.id }), {
        method: 'POST',
        headers: sessionHeaders(user.id),
        body: new URLSearchParams({ _csrf: createCsrfToken(user.id), _method: 'PUT', name: client.name, email: client.email, ...fields }),
      })

    let edit = await (await fetchResponse(routes.clients.edit.href({ clientId: client.id }), { headers: sessionHeaders(user.id) })).text()
    assert.match(edit, /name="latitude"/)

    assert.equal((await submit({ latitude: '-6.2', longitude: '106.8' })).status, 303)
    let saved = await getClient(user.id, client.id)
    assert.deepEqual([saved.latitude, saved.longitude], [-6.2, 106.8])

    let invalid = await submit({ latitude: '-6.2', longitude: '' })
    assert.equal(invalid.status, 422)
    assert.match(await invalid.text(), /Koordinat tidak valid/)
    let unchanged = await getClient(user.id, client.id)
    assert.deepEqual([unchanged.latitude, unchanged.longitude], [-6.2, 106.8])

    assert.equal((await submit({ latitude: '', longitude: '' })).status, 303)
    assert.equal((await getClient(user.id, client.id)).latitude, null)
  })
```

(import `getClient` dari `@invoicing/domain`.)

- [ ] **Step 2:** `npm test` → FAIL (no `name="latitude"`).

- [ ] **Step 3: Island** — `apps/web/app/actions/public/location-picker.tsx`:

```tsx
import { clientEntry, on, ref, type Handle } from 'remix/ui'

import { loadLeaflet, OSM_ATTRIBUTION, OSM_TILES } from './leaflet.ts'

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
}

const INDONESIA: [number, number] = [-2.5, 118]

export const LocationPicker = clientEntry(import.meta.url, function LocationPicker(handle: Handle<LocationPickerProps>) {
  let latitude = handle.props.latitude === null ? '' : String(handle.props.latitude)
  let longitude = handle.props.longitude === null ? '' : String(handle.props.longitude)
  let setMarker: ((lat: number, lng: number) => void) | null = null
  let clearMarker: (() => void) | null = null

  async function mount(node: HTMLElement, signal: AbortSignal) {
    let L = await loadLeaflet()
    if (signal.aborted) return
    let map = L.map(node)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)
    let marker: ReturnType<typeof L.circleMarker> | null = null
    setMarker = (lat, lng) => {
      marker?.remove()
      marker = L.circleMarker([lat, lng], { radius: 9, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 }).addTo(map)
    }
    clearMarker = () => {
      marker?.remove()
      marker = null
    }
    let lat = Number.parseFloat(latitude)
    let lng = Number.parseFloat(longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarker(lat, lng)
      map.setView([lat, lng], 16)
    } else {
      map.setView(INDONESIA, 5)
    }
    map.on('click', (event) => {
      latitude = event.latlng.lat.toFixed(6)
      longitude = event.latlng.lng.toFixed(6)
      setMarker?.(event.latlng.lat, event.latlng.lng)
      handle.update()
    })
    signal.addEventListener('abort', () => map.remove())
  }

  return () => (
    <div class="field space-y-2">
      <span class="label">Lokasi rumah klien</span>
      <div class="h-64 w-full overflow-hidden rounded-xl border" mix={[ref((node, signal) => void mount(node as HTMLElement, signal))]} />
      <p class="field-description">Klik peta untuk menaruh pin, atau isi koordinat manual. Dipakai di peta tracking kolektor.</p>
      <div class="grid grid-cols-2 gap-2">
        <input class="input" name="latitude" inputmode="decimal" placeholder="Latitude" aria-label="Latitude" value={latitude} />
        <input class="input" name="longitude" inputmode="decimal" placeholder="Longitude" aria-label="Longitude" value={longitude} />
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        mix={[
          on('click', () => {
            latitude = ''
            longitude = ''
            clearMarker?.()
            handle.update()
          }),
        ]}
      >
        Hapus pin
      </button>
    </div>
  )
})
```

- [ ] **Step 4: Controller** — `clients/controller.tsx`:
  - import `setClientLocation` dan `LocationPicker` (`../public/location-picker.tsx`).
  - Tambah helper:

```ts
function readLocation(formData: FormData): { latitude: number; longitude: number } | null {
  let lat = String(formData.get('latitude') ?? '').trim()
  let lng = String(formData.get('longitude') ?? '').trim()
  if (!lat && !lng) return null
  // A half-filled pair becomes NaN so the domain rejects it with the same message as garbage input.
  return { latitude: lat ? Number(lat) : Number.NaN, longitude: lng ? Number(lng) : Number.NaN }
}
```

  - `update`: baca `formData` sekali (`let formData = await context.request.formData(); let values = readClientValues(formData)`), lalu **sebelum** `updateClient` validasi lokasi via `setClientLocation` dalam urutan: `await setClientLocation(userId, clientId, readLocation(formData))` lalu `updateClient(...)` — keduanya di dalam `try` yang sama sehingga lokasi invalid → `error = caught.message` dan tidak ada yang tersimpan (validasi `setClientLocation` terjadi sebelum write).
  - `ClientFormPage` props: `client?: { id: string; name: string; latitude?: number | null; longitude?: number | null }`; di dalam form setelah `{clientFields(values, 'cf')}`:

```tsx
            {client ? <LocationPicker latitude={client.latitude ?? null} longitude={client.longitude ?? null} /> : null}
```

- [ ] **Step 5:** `npm test && npm run typecheck` → pass. Commit `feat(web): client home pin picker (FR-14j)`.

---

### Task 8: Verifikasi browser + dokumen

**Files:**
- Modify: `docs/PRD/README.md`, `docs/PRD/0702-live-tracking/0702_PRD_Live_Tracking.md` (status), `docs/invoicing/legal/LEGAL-REVIEW-CHECKLIST.md`, `docs/invoicing/brd/MVP-SCOPE-LOCK.md` (BR-10–12)

- [ ] **Step 1: Manual browser check** (dev server `npm run dev`, Chrome):
  1. Edit klien → klik peta → Simpan → buka lagi, pin ada.
  2. Invoice terkirim + kolektor → panel: "Buat link tracking" → link tampil, "Salin" menjadi "Tersalin".
  3. Buka link di tab lain (DevTools → Sensors → lokasi Jakarta) → "Mulai berbagi lokasi" → izinkan → "Terakhir terkirim HH:MM".
  4. "Lihat peta" → marker kolektor + pin klien + jarak; ganti lokasi sensor → dalam ≤ 45 detik marker berpindah tanpa reload.
  5. Tandai invoice lunas → tab kolektor: pesan "Penugasan sudah selesai".
  6. Atribusi OSM tampil di semua peta; tidak ada error console.
- [ ] **Step 2: Docs** — README PRD baris `| 14 | **0702** | [0702-live-tracking](./0702-live-tracking/) | G7 | FR-14i/j live tracking | 0701 |`; spec status `Implemented` + link development phase; MVP-SCOPE-LOCK tabel BR tambah BR-10/11/12 (teks dari spec); legal checklist tambah baris `| L-7 | FR-14i live tracking: persetujuan kolektor, tujuan, retensi (hapus saat penugasan selesai) — klausul di PRIVACY.md | [ ] |`.
- [ ] **Step 3:** `npm run typecheck && npm run test:domain && npm test && npm run gate` → semua pass. Commit `docs(prd): document live tracking (PRD-0702)`.

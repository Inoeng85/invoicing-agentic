# PRD-0702 — Live Tracking Kolektor

| Meta | Nilai |
|------|-------|
| ID | **0702** |
| Induk | [0700 Debt Collector](../0700-debt-collector/0700_PRD_Debt_Collector.md) |
| Gate | G7 (domain + web tests) |
| FR | **FR-14i** (tracking), **FR-14j** (pin lokasi klien) |
| Status | Implemented |
| Development phase | [0702_PRD_Live_Tracking_Development_phase.md](./0702_PRD_Live_Tracking_Development_phase.md) |

## Ringkasan

Freelancer dapat memantau posisi terakhir kolektor di peta saat kolektor menuju rumah klien. Kolektor membagikan lokasinya lewat **link tracking tanpa login** yang dibuka di browser HP. Lokasi rumah klien ditentukan freelancer dengan **pin manual** di peta. Peta memakai **Leaflet + OpenStreetMap**. Pembaruan memakai **polling**.

## Keputusan desain

| # | Keputusan | Alasan |
|---|-----------|--------|
| D-01 | Kolektor tetap **bukan user**; akses lewat link token per penugasan (`/t/:token`) | Konsisten dengan PRD-0700 D-01 & non-goal multi-user; pola sama dengan `/i/:token` |
| D-02 | Satu token per penugasan aktif; regenerasi mengganti token (link lama langsung mati) | Link bocor bisa dibatalkan tanpa melepas kolektor |
| D-03 | Token dikosongkan & jejak lokasi **dihapus** saat penugasan berakhir (`paid`/`cancelled`/`reassigned`/`unassigned`), dalam transaksi yang sama dengan penutupan assignment | Minimisasi data lokasi pribadi (UU PDP); posisi terakhir tetap sebagai catatan |
| D-04 | Posisi terkirim **hanya selama halaman kolektor terbuka** (`navigator.geolocation.watchPosition`) | Batasan web — tracking background butuh aplikasi native (di luar scope) |
| D-05 | Kolektor wajib menekan "Mulai berbagi lokasi" setelah membaca teks persetujuan; browser juga meminta izin lokasi | Persetujuan eksplisit subjek data |
| D-06 | **Polling**: HP kirim tiap ≥ 30 detik atau pindah > 50 m; peta freelancer ambil data tiap 15 detik | Jeda 15–45 detik tidak relevan untuk perjalanan ke rumah klien; tanpa infrastruktur baru |
| D-07 | Lokasi klien = pin manual (`Client.latitude/longitude`), bukan geocoding | Akurat, tanpa layanan eksternal, alamat klien tidak dikirim ke pihak ketiga |
| D-08 | Leaflet (npm) + tile `tile.openstreetmap.org` dengan atribusi OSM; marker `circleMarker`/`divIcon` | Tanpa API key; tanpa aset gambar ikon |
| D-09 | Halaman kolektor tidak memuat nominal invoice, nomor invoice, atau data bisnis selain nama freelancer | Kolektor cukup tahu tujuan |
| D-10 | Jarak ke klien = garis lurus (haversine), bukan rute jalan | YAGNI; tanpa layanan routing |

## Requirement

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-14i-1 | Buat / salin / cabut link tracking | Di panel Penagihan Debt Collector untuk penugasan aktif; cabut → link lama 404 |
| FR-14i-2 | Halaman kolektor `/t/:token` | Nama klien, alamat, peta pin tujuan, teks persetujuan, tombol Mulai/Hentikan; tanpa nominal |
| FR-14i-3 | Kirim lokasi | `POST /t/:token/location` JSON; valid → 204; link mati → 410 |
| FR-14i-4 | Peta freelancer `/invoices/:invoiceId/tracking` | Pin klien, posisi terakhir kolektor (foto bila ada), jejak hari ini, "Diperbarui X menit lalu", jarak garis lurus; auto-refresh 15 detik |
| FR-14i-5 | Akhir penugasan | Token null, jejak terhapus, posisi terakhir tetap tampil di peta sebagai "terakhir terlihat" |
| FR-14j-1 | Pin lokasi klien | Halaman edit klien: klik peta atau isi lat/lng; tombol hapus pin |

## Business rules

- **BR-10 — Tracking hanya untuk penugasan aktif.** Link tracking hanya bisa dibuat untuk assignment dengan `endedAt = null` pada invoice `sent`/`overdue`. Lokasi hanya diterima selama assignment masih aktif dan token cocok.
- **BR-11 — Data lokasi minimal.** Saat assignment berakhir, token dikosongkan dan semua `CollectorLocation` milik assignment itu dihapus. Hanya `last*` yang dipertahankan.
- **BR-12 — Validasi lokasi.** `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, `accuracyM` ≥ 0 dan ≤ 1000 (lebih buruk dibuang dengan 422 `location_inaccurate`), `recordedAt` ≤ sekarang + 5 menit dan ≥ `assignedAt`.

## Desain

### 1. Model data

```prisma
model Client {
  // … kolom yang ada
  latitude  Float?
  longitude Float?
}

model CollectionAssignment {
  // … kolom yang ada
  trackingToken  String?            @unique @map("tracking_token")
  lastLatitude   Float?             @map("last_latitude")
  lastLongitude  Float?             @map("last_longitude")
  lastAccuracyM  Float?             @map("last_accuracy_m")
  lastLocationAt DateTime?          @map("last_location_at")
  locations      CollectorLocation[]
}

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

### 2. Domain

**File baru `packages/domain/src/collector-tracking.ts`:**

| Fungsi | Perilaku |
|--------|----------|
| `createTrackingLink(userId, invoiceId)` | Assignment aktif wajib (409 `no_active_assignment`); token `randomBytes(24).toString('base64url')`; mengganti token lama; return token |
| `revokeTrackingLink(userId, invoiceId)` | `trackingToken = null` (idempoten) |
| `getTrackingSession(token)` | Token tidak ada / assignment berakhir → 404 `tracking_not_found`; return `{ collectorName, freelancerName, client: { name, address, latitude, longitude } }` saja |
| `recordCollectorLocation(token, input)` | Validasi BR-12 (400 `invalid_location`, 422 `location_inaccurate`); token tidak aktif → 410 `tracking_ended`; dalam transaksi: insert `CollectorLocation` + update `last*` |
| `getTrackingView(userId, invoiceId)` | Scoped `userId` (404 `not_found`); return `{ client: {name, address, latitude, longitude}, collector: {id, name, photoUpdatedAt} \| null, trackingActive, last: {latitude, longitude, accuracyM, at} \| null, trail: Array<{latitude, longitude, recordedAt}> }` — `trail` = lokasi assignment aktif sejak 00:00 waktu server |
| `distanceMeters(a, b)` | Haversine, murni |

**Perubahan `collections.ts`:** setiap jalur penutupan assignment (`assignCollector` reassign, `unassignCollector`, `closeActiveAssignmentInTx`) juga men-set `trackingToken = null` dan `deleteMany` `CollectorLocation` untuk assignment tersebut (BR-11).

**Perubahan `clients.ts`:** `setClientLocation(userId, clientId, location: { latitude, longitude } | null)` dengan validasi rentang yang sama.

### 3. Web — halaman kolektor

| Method | Path | Perilaku |
|--------|------|----------|
| GET | `/t/:token` | Publik, `noindex`, rate-limit bersama `/i/`; 404 halaman "Link tidak aktif" bila session tidak ada |
| POST | `/t/:token/location` | JSON `{ latitude, longitude, accuracyM, recordedAt }`; body > 1 KB ditolak 413 sebelum parse; 204 / 400 / 410 / 422; rate-limit per token 12/menit |

Island `TrackingSharer` (`app/actions/public/tracking-sharer.tsx`): state `idle → requesting → sharing → stopped | denied | unavailable | ended`; kirim bila ≥ 30 detik sejak kiriman terakhir atau jarak > 50 m; pada 410 → berhenti & tampilkan "Penugasan sudah selesai".

### 4. Web — peta freelancer

| Method | Path | Perilaku |
|--------|------|----------|
| GET | `/invoices/:invoiceId/tracking` | Halaman peta (auth) |
| GET | `/invoices/:invoiceId/tracking.json` | `getTrackingView` sebagai JSON (auth, scoped); `Cache-Control: no-store` |
| POST | `/invoices/:invoiceId/tracking/link` | CSRF; buat/regenerasi link → redirect detail `?notice=tracking_link_created#penagihan` |
| POST | `/invoices/:invoiceId/tracking/link/revoke` | CSRF; cabut → `?notice=tracking_link_revoked#penagihan` |

Island `TrackingMap` (`app/actions/public/tracking-map.tsx`): Leaflet map; pin klien (bila ada); marker kolektor; polyline jejak; fit bounds; poll `tracking.json` tiap 15 detik; label "Diperbarui X menit lalu" & jarak ke klien.

Panel Penagihan Debt Collector (penugasan aktif): tombol "Buat link tracking" / "Buat ulang", input readonly link + tombol "Salin", "Cabut link", "Lihat peta".

### 5. Web — pin klien

Halaman edit klien: island `LocationPicker` (reuse Leaflet) mengisi input `latitude`/`longitude`; tombol "Hapus pin"; disimpan lewat form edit klien yang ada.

### 6. Teknis

- Dependency baru `leaflet` di `@invoicing/web`; `allowPackages` di `app/assets.ts` ditambah `'leaflet'`; CSS Leaflet di-import di `app/styles/app.css`.
- Atribusi tile: "© OpenStreetMap contributors" wajib tampil.

## Keamanan & legal

- Token 24 byte acak, unik, mati otomatis saat penugasan berakhir atau dicabut.
- Endpoint lokasi: batas body 1 KB, rate-limit per token, validasi BR-12.
- `tracking.json` & halaman peta scoped `userId`; `/t/:token` tidak memuat nominal/nomor invoice.
- Legal L-7: persetujuan pelacakan lokasi kolektor, tujuan pemrosesan, dan retensi (hapus saat penugasan berakhir) — perlu klausul di [PRIVACY.md](../../invoicing/legal/PRIVACY.md).

## Testing

| Level | Cakupan |
|-------|---------|
| Unit | `distanceMeters` (jarak Jakarta–Bandung ≈ 118 km ± 2 km; titik sama = 0) |
| Domain | buat link hanya untuk assignment aktif; regenerasi membatalkan token lama; cabut → session 404; lokasi valid tersimpan + `last*` terupdate; BR-12 (lat/lng di luar rentang, akurasi > 1000 m, waktu masa depan); token mati → `tracking_ended`; penutupan assignment (paid / reassign / unassign / cancel) → token null + jejak terhapus + `last*` tetap; `getTrackingView` lintas user 404; trail hanya hari ini; `setClientLocation` validasi & hapus |
| Web | `/t/:token` render tanpa nominal & nomor invoice, token mati → 404; POST lokasi → 204, link mati → 410, body > 1 KB → 413; `tracking.json` pemilik 200 / user lain 404 / anonim → login; halaman peta render; panel menampilkan tombol link tracking; buat & cabut link via POST (CSRF) |
| Manual (browser) | izin lokasi, `watchPosition`, polling peta, klik pin klien — tidak bisa dites di server |

## Out of scope

Peta gabungan semua kolektor, rute/navigasi jalan, tracking background / aplikasi native, geocoding otomatis, riwayat jejak setelah penugasan berakhir.

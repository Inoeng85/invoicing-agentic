---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0701 — Foto Profil Kolektor

| Meta | Nilai |
|------|-------|
| ID | **0701** |
| Induk | [0700 Debt Collector](../0700-debt-collector/0700-prd-debt-collector.md) |
| Gate | G7 (web tests) |
| FR | **FR-14h** |
| Status | Implemented |
| Development phase | [0701-prd-foto-kolektor-development-phase.md](0701-prd-foto-kolektor-development-phase.md) |

## Ringkasan

Freelancer dapat mengunggah foto asli kolektor. Foto tampil sebagai avatar di panel **Penagihan** pada detail invoice (kolektor aktif + riwayat). Tanpa foto, avatar menampilkan inisial nama.

## Keputusan desain

| # | Keputusan | Alasan |
|---|-----------|--------|
| D-01 | Foto disimpan sebagai **BLOB di SQLite** | Ikut volume & backup DB yang ada; nol infra baru (ADR-0001 single host) |
| D-02 | Tabel terpisah `DebtCollectorPhoto` (PK `collectorId`) + kolom `DebtCollector.photoUpdatedAt` | Query kolektor tidak pernah menarik bytes; `photoUpdatedAt` = penanda ada foto + cache-busting `?v=` |
| D-03 | Tanpa resize/kompres; maks **1.000.000 byte** | Tanpa dependency native; avatar dirender `object-cover` |
| D-04 | Tipe dideteksi dari **magic bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF????WEBP`), bukan MIME dari browser | Klien bisa memalsukan MIME; SVG/HTML tertolak → tidak ada vektor XSS |
| D-05 | Upload lewat route POST multipart tersendiri | `formMethodOverride` hanya membaca `x-www-form-urlencoded`; form edit (PUT) tidak bisa multipart |
| D-06 | `Content-Length` wajib dan ≤ 1.100.000 dicek **sebelum** body diparse | Menolak upload besar tanpa membuffer seluruh body |
| D-07 | Foto disajikan hanya lewat route ber-auth, scoped `userId`; header `nosniff`, `Cache-Control: private` | Foto kolektor adalah data pribadi; tidak pernah di `/i/:token` |
| D-08 | Web saja — tidak ada endpoint API | YAGNI |

## Requirement

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-14h-1 | Upload foto di halaman edit kolektor | JPG/PNG/WebP ≤ 1 MB tersimpan; notice "Foto tersimpan" |
| FR-14h-2 | Ganti & hapus foto | Upload ulang mengganti; "Hapus foto" kembali ke inisial |
| FR-14h-3 | Validasi | > 1 MB → "Foto maksimal 1 MB"; tipe lain → "Format foto harus JPG, PNG, atau WebP"; tanpa file → "Pilih file foto dulu" |
| FR-14h-4 | Tampilan panel Penagihan | Kolektor aktif: avatar + nama + email/telepon + komisi; riwayat: avatar kecil |
| FR-14h-5 | Keamanan | Foto user lain → 404; anonim → redirect login; tidak tampil di halaman publik |

## Desain

### Data

```prisma
model DebtCollector {
  // … kolom yang ada
  photoUpdatedAt DateTime?           @map("photo_updated_at")
  photo          DebtCollectorPhoto?
}

model DebtCollectorPhoto {
  collectorId String        @id @map("collector_id")
  collector   DebtCollector @relation(fields: [collectorId], references: [id], onDelete: Cascade)
  bytes       Bytes
  mimeType    String        @map("mime_type")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@map("debt_collector_photos")
}
```

### Domain (`packages/domain/src/collector-photos.ts`)

| Fungsi | Perilaku |
|--------|----------|
| `MAX_COLLECTOR_PHOTO_BYTES = 1_000_000` | Batas byte file |
| `detectImageType(bytes)` | `'image/jpeg' \| 'image/png' \| 'image/webp' \| null` dari magic bytes |
| `setCollectorPhoto(userId, collectorId, bytes)` | > batas → 400 `photo_too_large`; tipe null → 400 `photo_invalid_type`; kolektor bukan milik user → 404 `collector_not_found`; upsert foto + set `photoUpdatedAt` dalam satu transaksi |
| `removeCollectorPhoto(userId, collectorId)` | Hapus foto (idempoten) + `photoUpdatedAt = null` |
| `getCollectorPhoto(userId, collectorId)` | `{ bytes, mimeType, updatedAt }`; tidak ada / bukan milik user → 404 `photo_not_found` |

### Web

| Method | Path | Perilaku |
|--------|------|----------|
| GET | `/collectors/:collectorId/photo` | Bytes foto, `Content-Type` tersimpan, `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=86400`; 404 bila tidak ada |
| POST | `/collectors/:collectorId/photo` | Multipart field `photo` + `_csrf`; cek `Content-Length` dulu; redirect ke edit dengan `?notice=` |
| POST | `/collectors/:collectorId/photo/delete` | CSRF; hapus; redirect ke edit `?notice=photo_removed` |

- `ui/collector-avatar.tsx` — `collectorAvatar(collector, sizeClass)`: `<img>` bila `photoUpdatedAt`, selain itu lingkaran inisial (`initials()` dari kit).
- Halaman edit kolektor: kartu "Foto" di atas form data (form terpisah, `enctype="multipart/form-data"`), preview avatar, input file `accept="image/jpeg,image/png,image/webp"`, tombol "Hapus foto" bila ada.
- Panel Penagihan: blok kolektor aktif memakai avatar `size-10` + nama + kontak + komisi; riwayat memakai avatar `size-6`.

## Testing

| Level | Cakupan |
|-------|---------|
| Domain | deteksi JPEG/PNG/WebP; PNG diberi nama apa pun tetap PNG; SVG/teks/kosong ditolak; > 1 MB ditolak; lintas user 404; hapus → `photo_not_found`; `listCollectors` tidak membawa bytes |
| Web | upload → 303 `photo_saved` → GET foto 200 + tipe + `nosniff` + bytes sama; `Content-Length` terlalu besar → `photo_too_large`; panel render `<img>` saat ada foto & inisial saat tidak; anonim GET foto → login |

## Out of scope

Resize/crop, foto di list `/invoices` atau `/collectors`, endpoint API, foto klien.

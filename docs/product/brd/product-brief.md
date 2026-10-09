---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Product Brief — PuraPuraLupa (Komando)

**Versi:** 1.2 · **Tanggal:** 2026-09-30 · **Segmen:** Freelancer/solo · **Mata uang:** IDR  
**Arsitektur:** [../ARCHITECTURE.md](../../architecture/README.md) · [architecture-alignment.md](architecture-alignment.md)

## Visi

Satu tempat untuk freelancer di Indonesia membuat invoice profesional, mengirim ke klien, dan melacak pembayaran—tanpa spreadsheet atau template manual.

## Persona utama

- **Freelancer kreatif/teknis** — butuh invoice cepat setelah milestone.
- **Konsultan part-time** — klien berulang, minim duplikasi data.

## Masalah

Formatting memakan waktu, nomor invoice tidak konsisten, status “sudah bayar?” tersebar di chat/email, tidak ada sumber kebenaran untuk klien dan riwayat tagihan.

## MVP (8–12 minggu produk)

Daftar → profil bisnis → klien → invoice (line items + PPN opsional) → PDF + link publik → kirim email → tandai lunas → dashboard outstanding → **kolektor penagihan + foto** (FR-14 / FR-14h).

## Batas MVP (eksplisit out)

e-Faktur DJP, payment gateway, multi-user tim, multi-currency, akuntansi penuh, recurring otomatis.

## North Star

**Invoice terkirim per user aktif per minggu** — proxy nilai produk (user benar-benar pakai untuk tagih klien).

## Metrik pendukung

| Metrik | Target validasi awal |
|--------|----------------------|
| Time-to-first-invoice (sent) | Median < 15 menit |
| Activation (≥1 klien + ≥1 invoice, 7 hari) | ≥ 60% |
| Collection rate (paid/sent, 30 hari) | Track only |

## Keputusan produk terkunci

Must have: FR-01 s/d FR-08 (lihat [mvp-scope-lock.md](mvp-scope-lock.md)).

## Arsitektur produk (selaras MVP)

- **Web** (`apps/web`): pengalaman freelancer — seluruh wireframe MVP.  
- **API** (`apps/api`): JSON REST dengan parity FR (health, auth, profile, clients, invoices, public).  
- **Domain** (`packages/domain`): business rules BR-01–BR-06, PPN, lifecycle invoice.  

Indeks: [../brd-definition-of-done.md](../brd-definition-of-done.md)

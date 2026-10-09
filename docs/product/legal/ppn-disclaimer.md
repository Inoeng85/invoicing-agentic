---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Disclaimer PPN & Faktur Pajak (MVP)

**Versi:** 1.0 · **Untuk:** UI produk, PDF footer opsional, halaman bantuan

---

## Teks singkat (UI — di bawah toggle PPN)

**Bahasa Indonesia:**

> Perhitungan PPN pada aplikasi ini hanya bersifat **bantu hitung**. Invoice yang dihasilkan **bukan** Faktur Pajak elektronik resmi Direktorat Jenderal Pajak (e-Faktur/Coretax). Kewajiban pelaporan dan penerbitan faktur pajak resmi tetap mengikuti peraturan perpajakan yang berlaku dan tanggung jawab Anda sebagai Wajib Pajak.

**English (optional FR-13):**

> VAT calculation is for convenience only. Generated invoices are not official Indonesian tax invoices (e-Faktur). Tax compliance remains your responsibility.

---

## Teks panjang (halaman `/help/ppn` atau modal “Pelajari lebih lanjut”)

1. **Fitur PPN MVP** menambahkan baris PPN (default 11%) pada subtotal setelah diskon per baris, sesuai toggle per invoice.
2. Aplikasi **tidak** terhubung ke sistem DJP, **tidak** menerbitkan NSFP, dan **tidak** menggantikan konsultasi pajak.
3. Field NPWP pada profil dan klien **opsional** dan hanya untuk informasi pada dokumen commercial invoice.
4. Jika Anda PKP atau wajib menerbitkan faktur pajak resmi, gunakan sistem yang disyaratkan regulator atau konsultasikan dengan konsultan pajak.

---

## PDF footer (opsional, jika PPN aktif)

`PPN dihitung dengan tarif [X]% untuk keperluan informasi. Bukan e-Faktur DJP.`

---

## Marketing — jangan ucapkan (MVP)

- “Compliant e-Faktur”
- “Integrasi DJP”
- “Faktur pajak resmi”

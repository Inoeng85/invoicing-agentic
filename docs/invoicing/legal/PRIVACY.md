# Kebijakan Privasi (Draft MVP)

**Terakhir diperbarui:** 29 September 2026  
**Status:** Draft — wajib review legal counsel sebelum produksi

---

## 1. Pengenalan

Kebijakan ini menjelaskan bagaimana **[Nama Produk]** (“kami”) memproses data pribadi pengguna freelancer (“Anda”) dan data kontak klien yang Anda masukkan (“Data Klien”).

## 2. Data yang kami kumpulkan

| Kategori | Contoh | Sumber |
|----------|--------|--------|
| Akun | Email, hash password | Anda |
| Profil bisnis | Nama, alamat, NPWP opsional, rekening, logo | Anda |
| Data Klien | Nama, email, alamat klien | Anda (pengendali terhadap klien) |
| Invoice | Line items, jumlah, status, token link publik | Anda |
| Teknis | Log IP, user agent, timestamp (keamanan) | Otomatis |

Kami **tidak** menjual data pribadi.

## 3. Tujuan pemrosesan

- Menyediakan layanan invoicing (buat, kirim, lacak).
- Mengirim email invoice atas instruksi Anda.
- Keamanan (rate limit link publik, deteksi abuse).
- Dukungan pelanggan jika Anda menghubungi kami.

## 4. Dasar pemrosesan (Indonesia / best practice)

- **Pelaksanaan kontrak** layanan dengan Anda.
- **Penting untuk kepentingan sah** keamanan sistem.
- **Instruksi Anda** untuk memproses Data Klien demi mengirim invoice.

Anda bertanggung jawab memiliki **dasar hukum** (mis. persetujuan atau relasi kontrak) untuk memasukkan email dan data klien.

## 5. Penyimpanan & lokasi

Data disimpan pada infrastruktur cloud dengan region **[SG/Jakarta — tentukan saat deploy]**. Retensi:

- Akun aktif: selama langganan/ penggunaan.
- Setelah hapus akun: hapus atau anonimkan dalam **30 hari** (backup rolling hingga **90 hari** kecuali diwajibkan hukum).

## 6. Berbagi dengan pihak ketiga

| Pihak | Tujuan |
|-------|--------|
| Penyedia email (mis. Resend/SES) | Kirim invoice |
| Penyedia hosting/DB | Operasional |
| Prosesor pembayaran | **Tidak** (MVP) |

Perjanjian pemrosesan data (DPA) dengan sub-processor direkomendasikan sebelum launch.

## 7. Link publik invoice

Token unik memungkinkan siapa pun yang memiliki link melihat invoice read-only. Anda dapat **mencabut** link. Jangan bagikan link di tempat publik jika tidak dimaksudkan.

## 8. Hak Anda

Mengakses, memperbaiki, mengunduh (export CSV fase 2), dan **menghapus akun** melalui pengaturan. Permintaan: **[email privasi]**.

## 9. Keamanan

Password di-hash; sesi httpOnly; enkripsi in transit (TLS); enkripsi at rest sesuai kemampuan provider DB.

## 10. Perubahan kebijakan

Kami akan memberi tahu via email atau in-app untuk perubahan material.

## 11. Kontak

**[Nama entitas legal]** · **[Alamat]** · **[privacy@domain]**

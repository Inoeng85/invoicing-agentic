# Stakeholder Validation — MoSCoW MVP

**Requirement lock:** [MVP-SCOPE-LOCK.md](./MVP-SCOPE-LOCK.md) · **Implementasi rencana:** [ARCHITECTURE-ALIGNMENT.md](./ARCHITECTURE-ALIGNMENT.md)

**Metode:** 3 sesi semi-structured (30 menit) dengan freelancer representatif  
**Tanggal:** 2026-09-29  
**Facilitator:** Product  
**Output:** Konfirmasi Must have FR-01–FR-08; Should have ditunda ke sprint 2 kecuali FR-09 (duplicate) naik jika waktu.

---

## Panduan wawancara (referensi)

1. Ceritakan invoice terakhir: tools, waktu, pain.
2. Prioritas: PDF vs email vs tracking vs PPN.
3. Validasi layar: Dashboard → Klien → Editor → Kirim.
4. Deal-breaker jika tidak ada di MVP?
5. Apakah e-Faktur wajib hari pertama? (ekspektasi)

---

## Peserta 1 — Desainer freelance (P1)

**Profil:** 2–5 klien/bulan, invoice setelah milestone, IDR, transfer bank.

| Topik | Feedback | Dampak scope |
|-------|----------|--------------|
| Must | PDF rapi + kirim email + link untuk klien korporat | Konfirm FR-04, FR-05, FR-06 |
| Must | Tandai lunas manual cukup | Konfirm FR-07; payment gateway Won't |
| Should | Duplicate invoice bulan lalu | FR-09 → Should (bukan block MVP) |
| Won't MVP | e-Faktur | Setuju out of scope |
| Pain | Salah total karena hitung PPN manual | Konfirm FR-03 Must |

**Keputusan P1:** Setuju lock FR-01–FR-08.

---

## Peserta 2 — Developer konsultan (P2)

**Profil:** invoice recurring ke 1–2 klien tetap, butuh nomor urut konsisten.

| Topik | Feedback | Dampak scope |
|-------|----------|--------------|
| Must | Nomor invoice otomatis `INV-YYYY-###` | Bagian FR-02 / BR-02 |
| Must | Dashboard outstanding | Konfirm FR-08 |
| Should | Export CSV untuk arsip pajak pribadi | FR-11 Should |
| Could | OAuth Google signup | Nice-to-have teknis |
| Won't | Multi-user untuk asisten | Won't MVP |

**Keputusan P2:** Setuju lock FR-01–FR-08; minta FR-09 duplicate di sprint 2 awal.

---

## Peserta 3 — Penulis/konten (P3)

**Profil:** invoice sederhana, sering forward PDF via WA.

| Topik | Feedback | Dampak scope |
|-------|----------|--------------|
| Must | Download PDF + share manual WA | Konfirm FR-04 |
| Must | Klien tanpa buat akun | Konfirm FR-06 |
| Should | Reminder overdue otomatis | Fase 2 (out of MVP) |
| Legal | Perlu tahu PPN bukan e-Faktur | [../legal/PPN-DISCLAIMER.md](../legal/PPN-DISCLAIMER.md) |

**Keputusan P3:** Setuju lock FR-01–FR-08.

---

## Sintesis

| Area | Hasil |
|------|--------|
| **Must have** | Unanimous: FR-01–FR-08 — **LOCKED** |
| **Naik prioritas post-MVP** | FR-09 duplicate (2/3 minta) |
| **Turun / ditunda** | Recurring, reminder, payment link → fase 2–3 |
| **Risiko scope creep** | e-Faktur — semua setuju Won't MVP |

**MoSCoW MVP ditandatangani produk:** 2026-09-29

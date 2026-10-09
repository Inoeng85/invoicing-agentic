# Legal review checklist (pre-production · G6)

Dokumen draft:

- [TERMS.md](TERMS.md)
- [PRIVACY.md](PRIVACY.md)
- [PPN-DISCLAIMER.md](PPN-DISCLAIMER.md)

## Review

| # | Item | Pass |
|---|------|------|
| L-1 | Terms mencakup batas layanan MVP (bukan e-Faktur, bukan payment gateway) | [ ] |
| L-2 | Privacy: data invoice/klien, retention, kontak | [ ] |
| L-3 | PPN disclaimer visible di UI invoice (sudah di web) | [ ] |
| L-4 | Cookie/session (`invoicing_session`) disebut di privacy | [ ] |
| L-5 | Counsel sign-off | [ ] |
| L-6 | FR-14 debt collector: freelancer membagikan data debitur (klien) ke kolektor pihak ketiga di luar aplikasi — tinjau UU PDP (freelancer sebagai pengendali data), termasuk foto kolektor (data pribadi, disimpan di DB) dan klausul di [TERMS.md](TERMS.md) / [PRIVACY.md](PRIVACY.md) | [ ] |
| L-7 | FR-14i live tracking: persetujuan kolektor atas pelacakan lokasi, tujuan pemrosesan, dan retensi (jejak dihapus saat penugasan selesai) — klausul di [PRIVACY.md](PRIVACY.md) | [ ] |

Update baris Legal di [MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) setelah L-1…L-7. FR-14 / FR-14h = **Must** MVP (2026-09-30).

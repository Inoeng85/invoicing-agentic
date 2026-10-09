---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Legal review checklist (pre-production · G6)

Dokumen draft:

- [terms.md](terms.md)
- [privacy.md](privacy.md)
- [ppn-disclaimer.md](ppn-disclaimer.md)

## Review

| # | Item | Pass |
|---|------|------|
| L-1 | Terms mencakup batas layanan MVP (bukan e-Faktur, bukan payment gateway) | [ ] |
| L-2 | Privacy: data invoice/klien, retention, kontak | [ ] |
| L-3 | PPN disclaimer visible di UI invoice (sudah di web) | [ ] |
| L-4 | Cookie/session (`invoicing_session`) disebut di privacy | [ ] |
| L-5 | Counsel sign-off | [ ] |
| L-6 | FR-14 debt collector: freelancer membagikan data debitur (klien) ke kolektor pihak ketiga di luar aplikasi — tinjau UU PDP (freelancer sebagai pengendali data), termasuk foto kolektor (data pribadi, disimpan di DB) dan klausul di [terms.md](terms.md) / [privacy.md](privacy.md) | [ ] |
| L-7 | FR-14i live tracking: persetujuan kolektor atas pelacakan lokasi, tujuan pemrosesan, dan retensi (jejak dihapus saat penugasan selesai) — klausul di [privacy.md](privacy.md) | [ ] |

Update baris Legal di [mvp-scope-lock.md](../brd/mvp-scope-lock.md) setelah L-1…L-7. FR-14 / FR-14h = **Must** MVP (2026-09-30).

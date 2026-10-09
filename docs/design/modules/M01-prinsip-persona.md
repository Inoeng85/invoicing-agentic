# M01 — Prinsip & persona

**Module design** · sumber [DESIGN-GUIDELINES](../DESIGN-GUIDELINES.md) §1–§3  
**Contoh halaman:** [01-dashboard-collect](../examples/01-dashboard-collect.html)

## Audiens

| Audiens | Pakai module untuk |
|---------|---------------------|
| Product / PM | Konsistensi acceptance & UAT |
| Design / FE | Wireframe → implementasi Tailwind |
| QA | Ekspektasi UI per FR |
| Legal | Copy PPN & batas klaim produk |

**Out of scope:** Figma kit penuh, dark mode di app (FR-12), bilingual PDF (FR-13).

## Prinsip

1. **Cepat sampai invoice terkirim** — North Star: status *sent*.
2. **Satu sumber kebenaran** — status, total IDR, riwayat klien tidak diduplikasi.
3. **Profesional tapi ringan** — layak ke klien korporat, tanpa ERP.
4. **Jujur soal pajak** — PPN = kalkulator ([PPN-DISCLAIMER](../../product/legal/PPN-DISCLAIMER.md)).
5. **Server-first, form-native** — HTML form + SSR.
6. **Mobile usable, desktop first**.

## Persona

| Persona | Implikasi UI |
|---------|----------------|
| Freelancer kreatif/teknis | CTA “Invoice baru”, due default +30 hari |
| Konsultan part-time | CRUD klien, pick-list di editor |
| Klien penerima (FR-06) | Public view bersih, PDF, status bayar |

**Time-to-first-invoice (sent):** register → profil → 1 klien → 1 draft → kirim ≤ 15 menit median.

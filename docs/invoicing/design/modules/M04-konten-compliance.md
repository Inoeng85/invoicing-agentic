# M04 — Konten & compliance

**Module design** · sumber [DESIGN-GUIDELINES](../DESIGN-GUIDELINES.md) §7–§8  
**Contoh:** [03-invoice-ppn](../examples/03-invoice-ppn.html) · [04-kirim-pdf-publik](../examples/04-kirim-pdf-publik.html)

## Bahasa & format

| Aspek | Aturan |
|-------|--------|
| Bahasa UI | Bahasa Indonesia |
| Mata uang | IDR, titik ribuan (`Rp 1.110.000`) |
| Nomor | `INV-{YYYY}-{SEQ}`; draft: “(auto saat kirim)” |
| Email | Error “Email klien wajib untuk kirim” |
| Tone | Profesional, singkat |

**Jangan** klaim e-Faktur / DJP.

## PPN (FR-03 / BR-04)

Teks wajib di bawah toggle:

> PPN hanya kalkulator. Bukan e-Faktur DJP.

Basis PPN = subtotal setelah diskon baris. Teks panjang: [PPN-DISCLAIMER.md](../../legal/PPN-DISCLAIMER.md).

## Legal

- Settings: [Syarat](../../legal/TERMS.md) · [Privasi](../../legal/PRIVACY.md)
- Public: “Powered by PuraPuraLupa · Privasi”
- PDF: footer disclaimer jika PPN aktif

## Edge case UI

| Situasi | Pola |
|---------|------|
| Email gagal (FR-05) | Error jelas; status tetap draft |
| Kirim sukses | Redirect detail; `sent` + `sent_at` |
| Token dicabut (BR-05) | 404 “Link tidak valid atau dicabut” |
| Empty | “Belum ada klien” + CTA tambah |

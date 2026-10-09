# M03 — Token & komponen

**Module design** · sumber [DESIGN-GUIDELINES](../design-guidelines.md) §5–§6, §13\
**CSS:** `packages/design-tokens/tokens.css` + `components.css` · prototype `docs/design/prototype/assets/ui.css`

## Token semantik

| Token | Light | Pemakaian |
|-------|-------|-----------|
| `--primary` | `#2563eb` | CTA, link aktif |
| `--page` | `#f8fafc` | Background body |
| `--card` / `--border` | white / slate-200 | Kartu, form, tabel |
| `--foreground` | `#0f172a` | Judul, angka |
| `--muted-foreground` | `#64748b` | Meta, hint |
| `--success` / `--warning` / `--destructive` | emerald / amber / red | Lunas / overdue / error |

## Tipografi

Page title `text-xl font-bold` · section `text-lg font-semibold` · label `text-sm` · metrik `text-2xl font-bold` · angka IDR `tabular-nums`. Font: system UI.

## Resep class

`.btn` + `btn-{default|outline|ghost|destructive|success}` · `.input` `.select` `.textarea` `.field` · `.card-*` · `.badge-{draft|sent|overdue|paid|cancelled}` · `.alert-*` · `.table` · `.tabs-list` / `.tabs-trigger` · `.dialog` · `.nav-link`

## Hierarki tombol

| Level | Copy | Kapan |
|-------|------|--------|
| Primary | Simpan, Kirim ke klien | Satu CTA per section |
| Secondary | Preview, Unduh PDF | Non-destruktif |
| Destructive | Nonaktifkan, Hapus draft | Konfirmasi |
| Ghost | Edit, Kembali | Navigasi dalam alur |

**FR-05:** “Kirim ke klien” disabled jika draft invalid atau klien tanpa email.

## Status invoice

| Status | Class | Copy UI | Copy publik |
|--------|-------|---------|-------------|
| `draft` | `badge-draft` | Draft | — |
| `sent` | `badge-sent` | Terkirim | Menunggu pembayaran |
| `overdue` | `badge-overdue` | Jatuh tempo | Lewat jatuh tempo |
| `paid` | `badge-paid` | Lunas | Lunas |
| `cancelled` | `badge-cancelled` | Dibatalkan | — |

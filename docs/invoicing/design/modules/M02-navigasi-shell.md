# M02 — Navigasi & app shell

**Module design** · sumber [DESIGN-GUIDELINES](../DESIGN-GUIDELINES.md) §4  
**Contoh:** [01](../examples/01-dashboard-collect.html) · [05](../examples/05-auth-pengaturan.html)

Backbone: **Setup → Client → Invoice → Send → Collect → Report** ([USER-STORY-MAP](../../brd/USER-STORY-MAP.md)).

## Nav authenticated (opsi A — stacked top nav)

| Label | Route | FR |
|-------|-------|-----|
| Dashboard | `/` | FR-08 |
| Klien | `/clients` | FR-01 |
| Invoice | `/invoices` | FR-08 list · FR-02–07 |
| Pengaturan | `/settings` | Profil |

Pola: header `h-14` + `nav-link` + `aria-current="page"`. Wordmark **Invoicing** + “Freelancer Indonesia”. CTA **Invoice baru** (`btn-default btn-sm`).

## Tanpa nav app

| Route | Aktor | Shell |
|-------|-------|--------|
| `/login`, `/register` | Freelancer | Split auth ([05](../examples/05-auth-pengaturan.html)) |
| `/i/:token` | Klien | Brand freelancer, bukan app ([04](../examples/04-kirim-pdf-publik.html)) |
| `/invoices/new` | Freelancer | Focus header (kembali + aksi) ([03](../examples/03-invoice-ppn.html)) |

## Footer

- App: `© 2026 Invoicing · Dibuat untuk freelancer Indonesia`
- Publik: `Powered by Invoicing · Privasi`

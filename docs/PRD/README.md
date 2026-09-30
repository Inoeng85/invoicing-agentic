# Indeks PRD — urutan prioritas development

**Konvensi ID:** `XXYY` — `XX` = feature/epic, `YY` = subfeature (00 = induk bila satu epic).

**Format file:** `docs/PRD/{xxyy-namafeature}/{xxyy}_PRD_{Nama}.md` · `{xxyy}_PRD_{Nama}_Development_phase.md`

**Sumber:** [invoicing/brd](../invoicing/brd/) · [Platform dev phase](../0000_platform_setup/PRD_platform_setup_development_phase.md) · [DEVELOPMENT-PHASES](../invoicing/engineering/DEVELOPMENT-PHASES.md)

| Pri | ID | Folder | Gate | FR / scope | Depends |
|-----|-----|--------|------|------------|---------|
| 0 | **0000** | [0000-platform-setup](./0000-platform-setup/) | PG-0…PG-3 | Tooling, CI, staging/prod | — |
| 1 | **0100** | [0100-foundation](./0100-foundation/) | G0 | Monorepo, health, DB | 0000 PG-0 |
| 2 | **0101** | [0101-auth-profil](./0101-auth-profil/) | G1 | Register, login, settings | 0100 |
| 3 | **0200** | [0200-klien](./0200-klien/) | G2 | FR-01 | 0101 |
| 4 | **0300** | [0300-invoice-draft](./0300-invoice-draft/) | G3 (partial) | FR-02, BR-01, BR-06 | 0200 |
| 5 | **0301** | [0301-ppn-kalkulator](./0301-ppn-kalkulator/) | G3 | FR-03, BR-04 | 0300 |
| 6 | **0400** | [0400-pdf-invoice](./0400-pdf-invoice/) | G4 (partial) | FR-04 | 0301 |
| 7 | **0401** | [0401-kirim-email](./0401-kirim-email/) | G4 | FR-05, BR-02, G-13 | 0400 |
| 8 | **0402** | [0402-link-publik](./0402-link-publik/) | G4 | FR-06, BR-05 | 0401 |
| 9 | **0500** | [0500-tandai-lunas](./0500-tandai-lunas/) | G5 (partial) | FR-07 | 0402 |
| 10 | **0501** | [0501-dashboard](./0501-dashboard/) | G5 | FR-08, BR-03 | 0500 |
| 11 | **0600** | [0600-release-readiness](./0600-release-readiness/) | G6 | UAT, legal, CI, PG formal | 0501 + PG-2 |
| 12 | **0700** | [0700-debt-collector](./0700-debt-collector/) | G7 | FR-14, BR-07–BR-09 (**Must** MVP) | 0501 |
| 13 | **0701** | [0701-foto-kolektor](./0701-foto-kolektor/) | G7 | FR-14h foto kolektor (**Must** MVP) | 0700 |

**Canonical platform (detail penuh):** tetap di [0000_platform_setup/prd_platform_setup.md](../0000_platform_setup/prd_platform_setup.md).

**BRD produk:** [invoicing/BRD.md](../invoicing/BRD.md).

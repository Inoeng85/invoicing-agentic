# PRD-0402 — Link Publik Invoice (FR-06)

| Meta | Nilai |
|------|-------|
| ID | **0402** (subfeature **04**) |
| Prioritas dev | **8** |
| Gate | **G4** |
| FR | **FR-06** |
| BR | **BR-05** |
| Gap | **G-02** |
| Development phase | [0402_PRD_Link_Publik_Development_phase.md](./0402_PRD_Link_Publik_Development_phase.md) |

## Ringkasan

Klien melihat invoice tanpa login via token URL; read-only; selaras preview; link dapat dicabut.

## Requirement

| ID | Requirement |
|----|-------------|
| FR-06 | Public read-only view |
| BR-05 | Public link revocable → 404 when revoked |
| FR-06a | API `GET /api/public/invoices/:token` |
| FR-06b | Web `/i/:token` |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | Valid token → 200 + data (no auth) |
| AC-02 | Revoked token → 404 |
| AC-03 | Gate G4.3 public + revoke |
| AC-04 | No PII beyond invoice scope |

## Dependensi

- **0401** (token issued on send)

## Referensi

- [USER-STORIES-UAT.md](../../invoicing/brd/USER-STORIES-UAT.md)

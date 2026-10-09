---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# PRD-0500 — Tandai Lunas (FR-07)

| Meta | Nilai |
|------|-------|
| ID | **0500** |
| Prioritas dev | **9** |
| Gate | **G5** (partial) |
| FR | **FR-07** |
| Development phase | [0500-prd-tandai-lunas-development-phase.md](0500-prd-tandai-lunas-development-phase.md) |

## Ringkasan

Pengguna menandai invoice terkirim sebagai **paid** secara manual dengan timestamp `paid_at`.

## Requirement

| ID | Requirement |
|----|-------------|
| FR-07 | Manual `paid` + `paid_at` |
| FR-07a | Hanya dari status `sent` (dan overdue) |

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | API + web action mark paid |
| AC-02 | Gate G5.1 paid transition |
| AC-03 | Public view reflects paid label (read-only) |

## Dependensi

- **0402** G4

## Business rules

- Tidak auto-reconcile payment gateway (Won't MVP)

## Referensi

- [mvp-scope-lock.md](../../brd/mvp-scope-lock.md) FR-07

# PRD-0600 — Release Readiness (G6)

| Meta | Nilai |
|------|-------|
| ID | **0600** |
| Prioritas dev | **11** (setelah fitur Must MVP) |
| Gate | **G6** |
| Development phase | [0600_PRD_Release_Readiness_Development_phase.md](0600_PRD_Release_Readiness_Development_phase.md) |
| Sumber | [DEVELOPMENT-PHASES.md](../../../engineering/DEVELOPMENT-PHASES.md) Phase 6 · [MVP-SCOPE-LOCK.md](../../brd/MVP-SCOPE-LOCK.md) sign-off |

## Ringkasan

Mengunci kesiapan rilis MVP: trace UAT ke FR, CI/release checks, legal checklist, gap produk (G-01, G-02, G-05, G-13), dan platform PG-1/PG-2/PG-3 formal.

## Tujuan

| ID | Tujuan |
|----|--------|
| T-01 | Semua FR Must (0100–0501) lulus gate otomatis + UAT |
| T-02 | `npm run release:check` pass |
| T-03 | Legal draft reviewed ([LEGAL-REVIEW-CHECKLIST.md](../../legal/LEGAL-REVIEW-CHECKLIST.md)) |
| T-04 | Staging/prod deploy path verified (LAUNCH-LANE) |

## Scope (in)

- UAT matrix [USER-STORIES-UAT.md](../../brd/USER-STORIES-UAT.md)
- Revoke/cancel flows (G-01), public link (G-02), email errors (G-13)
- CI GitHub atau documented fallback `ci:local`
- Resend production (G-04)
- Sign-off table MVP-SCOPE-LOCK

## Scope (out)

- FR-09, FR-11 (Should/Could)
- e-Faktur, payment gateway

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | G0–G5 gate + pending manual UAT closed |
| AC-02 | G6.1 CI green or approved waiver with `ci:local` evidence |
| AC-03 | Engineering sign-off on MVP-SCOPE-LOCK |
| AC-04 | PG-2 staging UAT complete; PG-3 prod checklist |

## Dependensi

- **0501** G5
- **0000** PG-1 minimum; PG-2/3 for launch

## Referensi

- [LAUNCH-LANE.md](../../../operations/LAUNCH-LANE.md)
- [STAKEHOLDER-VALIDATION.md](../../brd/STAKEHOLDER-VALIDATION.md)

# PRD-0000 — Platform Setup · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0000** |
| Versi | 1.3 (ringkas; detail task per baris di canonical) |
| **Canonical penuh** | [../../0000_platform_setup/PRD_platform_setup_development_phase.md](PRD_platform_setup_development_phase.md) |

**Format task ID:** `0000yy-[kanonik]-[slug]` — kanonik: `stack` · `db` · `be` · `fe` · `infra` · `docs`

## Ringkasan fase

| Fase | Milestone | Gate | Task (jumlah) |
|------|-----------|------|----------------|
| Phase 0 | M0 | **PG-0** | 9 (baseline lokal) |
| Phase 1 | M1 | **PG-1** | 3 (CI + protection) |
| Phase 2 | M2 | **PG-2** | 16 (staging, env, email, tokens) |
| Phase 3 | M3 | **PG-3** | 10 (prod, backup, ops) |

## Urutan eksekusi (canonical)

**Phase 0:** pin Node → single lockfile → repo hygiene → canonical SQLite → `.env.example` → db scripts → `setup` → `verify` → dev runbook

**Phase 1:** branch protection → fix `ci.yml` → pipeline `verify`

**Phase 2:** ADR + conventions → dev deps → DB strategy → env validation → logging → email adapter → seed → doctor → hosting → TLS/CORS → staging CD → Resend staging → CI perf → design tokens → web CSS build

**Phase 3:** backup/restore → secret rotation → gate summary → prod CD → rollback → rate limit → alerting → email domain prod → design serve → ops runbook

## Gate pass (DoD platform)

| Gate | Pass jika |
|------|-----------|
| PG-0 | `npm run setup && npm run verify` exit 0 di Node 24.3+ |
| PG-1 | CI job `verify` hijau + required check on `main` (fallback dokumentasi: `npm run ci:local`) |
| PG-2 | Staging URL live; health ready 200; email smoke staging |
| PG-3 | Prod deploy + backup tested; legal/ops checklist linked |

## Status verifikasi (2026-09-30)

- PG-0: **lulus**
- PG-1: partial (repo siap; runner/billing atau protection formal pending)
- PG-2 / PG-3: operator checklist ([STAGING-PROVISION](./), [PRODUCTION-PROVISION](./))

## Pemetaan ke PRD produk

Selesaikan **PG-0** sebelum **0100**. Target **PG-2** sebelum UAT manual G1–G5 di staging. **0600** mensyaratkan PG-1 formal + PG-2/3 sesuai LAUNCH-LANE.

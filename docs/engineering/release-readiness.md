---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Release Readiness — Phase 6 (G6)

**Urutan lengkap:** [launch-lane.md](../operations/launch-lane.md)

## Otomatis (lokal)

```sh
npm run release:check   # = verify + checklist
npm run verify          # typecheck, tests, CSS, gate G0–G5
```

## Gate G6

| ID | Kriteria | Status |
|----|----------|--------|
| G6.1 | CI hijau di GitHub | Billing Actions harus OK · fallback lokal: `npm run ci:local` |
| G6.2 | `npm run gate` / verify Phase 0–5 | Otomatis via `npm run verify` |
| G6.3 | Sign-off engineering | [mvp-scope-lock.md](../product/brd/mvp-scope-lock.md) |

## Sebelum production

1. UAT: [user-stories-uat.md](../product/brd/user-stories-uat.md)
2. Legal: [legal/](../product/legal)
3. Gap Must: [architecture-alignment.md §6](../product/brd/architecture-alignment.md#6-register-gap-dokumen--kode) — G-01/02/05/13 di kode · **G-04** Resend di host
4. UAT trace: [uat-gate-trace.md](uat-gate-trace.md)
5. Legal: [legal-review-checklist.md](../product/legal/legal-review-checklist.md)
6. Ops: [runbook-ops.md](../operations/runbook-ops.md)
7. Tag `v0.1.0-rc.1` → workflow `deploy-production.yml`

## Traceability

| Gate produk | Script |
|-------------|--------|
| G0–G5 | `scripts/gates/run-all.ts` |
| Platform PG | PRD-0000 development phase |

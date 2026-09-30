# Release Readiness — Phase 6 (G6)

**Urutan lengkap:** [LAUNCH-LANE.md](../../0000_platform_setup/LAUNCH-LANE.md)

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
| G6.3 | Sign-off engineering | [MVP-SCOPE-LOCK.md](../brd/MVP-SCOPE-LOCK.md) |

## Sebelum production

1. UAT: [USER-STORIES-UAT.md](../brd/USER-STORIES-UAT.md)
2. Legal: [legal/](../legal/)
3. Gap Must: [ARCHITECTURE-ALIGNMENT.md §6](../brd/ARCHITECTURE-ALIGNMENT.md#6-register-gap-dokumen--kode) — G-01/02/05/13 di kode · **G-04** Resend di host
4. UAT trace: [UAT-GATE-TRACE.md](./UAT-GATE-TRACE.md)
5. Legal: [LEGAL-REVIEW-CHECKLIST.md](../legal/LEGAL-REVIEW-CHECKLIST.md)
6. Ops: [RUNBOOK-OPS.md](../../0000_platform_setup/RUNBOOK-OPS.md)
7. Tag `v0.1.0-rc.1` → workflow `deploy-production.yml`

## Traceability

| Gate produk | Script |
|-------------|--------|
| G0–G5 | `scripts/gates/run-all.ts` |
| Platform PG | PRD-0000 development phase |

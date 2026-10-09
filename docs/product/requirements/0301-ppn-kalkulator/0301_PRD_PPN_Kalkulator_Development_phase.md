# PRD-0301 — PPN · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0301** |
| Gate | **G3** |

## Task

| Task | Output |
|------|--------|
| 030101-domain-compute-invoice-totals | PPN toggle + rate |
| 030102-domain-tests-fr03 | 3 test scenarios |
| 030103-db-invoice-ppn-fields | `ppnEnabled`, `ppnRate`, stored totals |
| 030104-be-persist-totals | API save computed totals |
| 030105-fe-ppn-toggle | UI toggle + preview totals |
| 030106-infra-gate-g3 | G3.1 + G3.2 |

## Urutan

Domain logic + tests → DB fields → API → UI → gate

## Gate G3

| Check | Metode | Pass |
|-------|--------|------|
| G3.1 | `npm run test:domain` | 3/3 PPN tests |
| G3.2 | Gate Phase 3 | Draft + PPN amount |
| G3.3 | UAT checklist | Manual |

## DoD

- [ ] Rounding policy documented (IDR integer)
- [ ] Totals on read match stored after update

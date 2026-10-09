# Checklist task — Agentic

Generated: 2026-10-01T18:06:10.476Z

## Ringkasan

| Metrik | Nilai |
|--------|-------|
| Total | 138 |
| Done | 12 |
| Running | 0 |
| Assigned (prompt) | 0 |
| Ready (giliran) | 0 |
| Waiting | 0 |
| Blocked | 126 |

**Berikutnya:** gate 0000-P2

## Legenda

- **assigned** — autopilot menugaskan task; prompt di `.agentic/trigger/AGENT_PROMPT.md` (Agent Cursor belum jalan)
- **running** — `in_progress` di plan (agent benar-benar mengerjakan)
- **ready** — giliran task terkecil belum selesai, tidak terblokir
- **waiting** — belum giliran (antrian dalam phase)
- **blocked** — ada gate/blocker
- **done** — QA pass / selesai

## Phase 0000-P0 — Local baseline

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 1 | `000001-stack-pin-node-runtime` | **done** | audit | defined | complete | pass | — |
| 2 | `000002-stack-single-npm-lockfile` | **done** | audit | defined | complete | pass | — |
| 3 | `000003-stack-repo-hygiene` | **done** | audit | defined | complete | pass | — |
| 4 | `000001-db-canonical-sqlite-path` | **done** | done | defined | complete | pass | — |
| 5 | `000004-stack-env-example` | **done** | audit | defined | complete | pass | — |
| 6 | `000002-db-root-scripts` | **done** | audit | defined | complete | pass | — |
| 7 | `000005-stack-setup-script` | **done** | audit | defined | complete | pass | — |
| 8 | `000006-stack-verify-script` | **done** | audit | defined | complete | pass | — |
| 9 | `000001-docs-dev-runbook` | **done** | audit | defined | complete | pass | — |
## Phase 0000-P1 — Continuous Integration

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 10 | `000001-infra-github-repo-protection` | **done** | audit | defined | complete | pass | — |
| 11 | `000002-infra-ci-workflow-fix` | **done** | audit | defined | complete | pass | — |
| 12 | `000003-infra-ci-verify-pipeline` | **done** | audit | defined | complete | pass | — |
## Phase 0000-P2 — Staging

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 13 | `000002-docs-adr-platform-decisions` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued) |
| 14 | `000003-docs-branch-commit-convention` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 15 | `000007-stack-pin-dev-dependencies` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 16 | `000004-db-postgres-strategy` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 17 | `000001-be-env-validation` | **blocked** | intake | defined | complete | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued) |
| 18 | `000002-be-structured-logging-request-id` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 19 | `000003-be-email-adapter-selection` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 20 | `000003-db-seed-demo` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 21 | `000008-stack-doctor-script` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 22 | `000005-infra-hosting-provision` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 23 | `000006-infra-domain-tls-cors` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 24 | `000007-infra-staging-cd` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 25 | `000008-infra-email-provider-staging` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 26 | `000004-infra-ci-performance` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 27 | `000001-fe-shared-design-tokens` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
| 28 | `000002-fe-web-css-token-build` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P1; Intake phase 0000-P2 belum selesai (queued); Development berurutan: menunggu 000002-docs-adr-platform-decisions selesai |
## Phase 0000-P3 — Production readiness

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 29 | `000005-db-backup-restore` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued) |
| 30 | `000009-infra-secret-rotation` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 31 | `000010-infra-ci-gate-summary` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 32 | `000011-infra-production-cd` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 33 | `000012-infra-rollback` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 34 | `000013-infra-proxy-rate-limit-ready` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 35 | `000014-infra-alerting-log-retention` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 36 | `000015-infra-email-domain-production` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 37 | `000003-fe-design-serve` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
| 38 | `000004-docs-ops-runbook` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0000-P2; Intake phase 0000-P3 belum selesai (queued); Development berurutan: menunggu 000005-db-backup-restore selesai |
## Phase 0100-P1 — Epic 0100 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 39 | `010001-stack-workspace-packages` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued) |
| 40 | `010002-db-prisma-schema-baseline` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
| 41 | `010003-db-migrate-scripts` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
| 42 | `010004-be-health-live` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
| 43 | `010005-be-health-ready` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
| 44 | `010006-domain-system-status` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
| 45 | `010007-infra-gate-phase0` | **blocked** | intake | defined | pending | pending | Intake phase 0100-P1 belum selesai (queued); Development berurutan: menunggu 010001-stack-workspace-packages selesai |
## Phase 0101-P1 — Epic 0101 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 46 | `010101-db-user-business-profile` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued) |
| 47 | `010102-domain-auth-password` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 48 | `010103-be-register-login` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 49 | `010104-be-auth-middleware` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 50 | `010105-be-profile-crud` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 51 | `010106-fe-login-register` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 52 | `010107-fe-settings` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 53 | `010108-fe-dashboard-guard` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
| 54 | `010109-infra-gate-phase1` | **blocked** | intake | defined | pending | pending | Intake phase 0101-P1 belum selesai (queued); Development berurutan: menunggu 010101-db-user-business-profile selesai |
## Phase 0200-P1 — Epic 0200 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 55 | `020001-db-client-model` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued) |
| 56 | `020002-domain-client-validation` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued); Development berurutan: menunggu 020001-db-client-model selesai |
| 57 | `020003-be-client-crud` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued); Development berurutan: menunggu 020001-db-client-model selesai |
| 58 | `020004-fe-clients-list` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued); Development berurutan: menunggu 020001-db-client-model selesai |
| 59 | `020005-fe-client-form` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued); Development berurutan: menunggu 020001-db-client-model selesai |
| 60 | `020006-infra-gate-phase2` | **blocked** | intake | defined | pending | pending | Intake phase 0200-P1 belum selesai (queued); Development berurutan: menunggu 020001-db-client-model selesai |
## Phase 0300-P1 — Epic 0300 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 61 | `030001-db-invoice-line-items` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued) |
| 62 | `030002-domain-draft-totals-base` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued); Development berurutan: menunggu 030001-db-invoice-line-items selesai |
| 63 | `030003-be-invoice-draft-crud` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued); Development berurutan: menunggu 030001-db-invoice-line-items selesai |
| 64 | `030004-fe-invoice-editor` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued); Development berurutan: menunggu 030001-db-invoice-line-items selesai |
| 65 | `030005-fe-invoice-list-draft` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued); Development berurutan: menunggu 030001-db-invoice-line-items selesai |
| 66 | `030006-domain-br01-guards` | **blocked** | intake | defined | pending | pending | Intake phase 0300-P1 belum selesai (queued); Development berurutan: menunggu 030001-db-invoice-line-items selesai |
## Phase 0301-P1 — Epic 0301 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 67 | `030101-domain-compute-invoice-totals` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued) |
| 68 | `030102-domain-tests-fr03` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued); Development berurutan: menunggu 030101-domain-compute-invoice-totals selesai |
| 69 | `030103-db-invoice-ppn-fields` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued); Development berurutan: menunggu 030101-domain-compute-invoice-totals selesai |
| 70 | `030104-be-persist-totals` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued); Development berurutan: menunggu 030101-domain-compute-invoice-totals selesai |
| 71 | `030105-fe-ppn-toggle` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued); Development berurutan: menunggu 030101-domain-compute-invoice-totals selesai |
| 72 | `030106-infra-gate-g3` | **blocked** | intake | defined | pending | pending | Intake phase 0301-P1 belum selesai (queued); Development berurutan: menunggu 030101-domain-compute-invoice-totals selesai |
## Phase 0400-P1 — Epic 0400 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 73 | `040001-domain-pdf-layout-data` | **blocked** | intake | defined | pending | pending | Intake phase 0400-P1 belum selesai (queued) |
| 74 | `040002-be-pdf-generate` | **blocked** | intake | defined | pending | pending | Intake phase 0400-P1 belum selesai (queued); Development berurutan: menunggu 040001-domain-pdf-layout-data selesai |
| 75 | `040003-be-pdf-download-route` | **blocked** | intake | defined | pending | pending | Intake phase 0400-P1 belum selesai (queued); Development berurutan: menunggu 040001-domain-pdf-layout-data selesai |
| 76 | `040004-fe-download-button` | **blocked** | intake | defined | pending | pending | Intake phase 0400-P1 belum selesai (queued); Development berurutan: menunggu 040001-domain-pdf-layout-data selesai |
| 77 | `040005-infra-gate-pdf` | **blocked** | intake | defined | pending | pending | Intake phase 0400-P1 belum selesai (queued); Development berurutan: menunggu 040001-domain-pdf-layout-data selesai |
## Phase 0401-P1 — Epic 0401 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 78 | `040101-domain-invoice-numbering` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued) |
| 79 | `040102-db-sent-fields` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
| 80 | `040103-be-send-invoice` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
| 81 | `040104-be-email-adapter` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
| 82 | `040105-fe-send-action` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
| 83 | `040106-infra-email-smoke` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
| 84 | `040107-infra-gate-g4-send` | **blocked** | intake | defined | pending | pending | Intake phase 0401-P1 belum selesai (queued); Development berurutan: menunggu 040101-domain-invoice-numbering selesai |
## Phase 0402-P1 — Epic 0402 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 85 | `040201-db-token-revoked-flag` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued) |
| 86 | `040202-be-public-invoice-api` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued); Development berurutan: menunggu 040201-db-token-revoked-flag selesai |
| 87 | `040203-be-revoke-link` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued); Development berurutan: menunggu 040201-db-token-revoked-flag selesai |
| 88 | `040204-fe-public-page` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued); Development berurutan: menunggu 040201-db-token-revoked-flag selesai |
| 89 | `040205-fe-revoke-ui` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued); Development berurutan: menunggu 040201-db-token-revoked-flag selesai |
| 90 | `040206-infra-gate-g4-public` | **blocked** | intake | defined | pending | pending | Intake phase 0402-P1 belum selesai (queued); Development berurutan: menunggu 040201-db-token-revoked-flag selesai |
## Phase 0500-P1 — Epic 0500 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 91 | `050001-db-paid-fields` | **blocked** | intake | defined | pending | pending | Intake phase 0500-P1 belum selesai (queued) |
| 92 | `050002-domain-paid-transition` | **blocked** | intake | defined | pending | pending | Intake phase 0500-P1 belum selesai (queued); Development berurutan: menunggu 050001-db-paid-fields selesai |
| 93 | `050003-be-mark-paid` | **blocked** | intake | defined | pending | pending | Intake phase 0500-P1 belum selesai (queued); Development berurutan: menunggu 050001-db-paid-fields selesai |
| 94 | `050004-fe-mark-paid-button` | **blocked** | intake | defined | pending | pending | Intake phase 0500-P1 belum selesai (queued); Development berurutan: menunggu 050001-db-paid-fields selesai |
| 95 | `050005-infra-gate-g5-paid` | **blocked** | intake | defined | pending | pending | Intake phase 0500-P1 belum selesai (queued); Development berurutan: menunggu 050001-db-paid-fields selesai |
## Phase 0501-P1 — Epic 0501 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 96 | `050101-domain-overdue-compute` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued) |
| 97 | `050102-be-invoice-list-filters` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued); Development berurutan: menunggu 050101-domain-overdue-compute selesai |
| 98 | `050103-be-outstanding-aggregate` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued); Development berurutan: menunggu 050101-domain-overdue-compute selesai |
| 99 | `050104-fe-dashboard` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued); Development berurutan: menunggu 050101-domain-overdue-compute selesai |
| 100 | `050105-fe-outstanding-widget` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued); Development berurutan: menunggu 050101-domain-overdue-compute selesai |
| 101 | `050106-infra-gate-g5-dashboard` | **blocked** | intake | defined | pending | pending | Intake phase 0501-P1 belum selesai (queued); Development berurutan: menunggu 050101-domain-overdue-compute selesai |
## Phase 0600-P1 — Epic 0600 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 102 | `060001-docs-uat-trace-matrix` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued) |
| 103 | `060002-product-gap-g01-revoke-cancel` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 104 | `060003-product-gap-g02-public-hardening` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 105 | `060004-product-gap-g05-legal-copy` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 106 | `060005-product-gap-g13-email-errors` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 107 | `060006-infra-release-check-script` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 108 | `060007-infra-ci-g6` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 109 | `060008-ops-staging-uat-run` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 110 | `060009-ops-prod-launch` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
| 111 | `060010-docs-signoff-mvp-scope` | **blocked** | intake | defined | pending | pending | Intake phase 0600-P1 belum selesai (queued); Development berurutan: menunggu 060001-docs-uat-trace-matrix selesai |
## Phase 0700-P1 — Epic 0700 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 112 | `0700-task-01` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued) |
| 113 | `0700-task-02` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 114 | `0700-task-03` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 115 | `0700-task-04` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 116 | `0700-task-05` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 117 | `0700-task-06` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 118 | `0700-task-07` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 119 | `0700-task-08` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
| 120 | `0700-task-09` | **blocked** | intake | defined | pending | pending | Intake phase 0700-P1 belum selesai (queued); Development berurutan: menunggu 0700-task-01 selesai |
## Phase 0701-P1 — Epic 0701 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 121 | `0701-task-01` | **blocked** | intake | defined | pending | pending | Intake phase 0701-P1 belum selesai (queued) |
| 122 | `0701-task-02` | **blocked** | intake | defined | pending | pending | Intake phase 0701-P1 belum selesai (queued); Development berurutan: menunggu 0701-task-01 selesai |
| 123 | `0701-task-03` | **blocked** | intake | defined | pending | pending | Intake phase 0701-P1 belum selesai (queued); Development berurutan: menunggu 0701-task-01 selesai |
| 124 | `0701-task-04` | **blocked** | intake | defined | pending | pending | Intake phase 0701-P1 belum selesai (queued); Development berurutan: menunggu 0701-task-01 selesai |
| 125 | `0701-task-05` | **blocked** | intake | defined | pending | pending | Intake phase 0701-P1 belum selesai (queued); Development berurutan: menunggu 0701-task-01 selesai |
## Phase 0702-P1 — Live tracking — fondasi API & model

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 126 | `0702-task-01` | **blocked** | intake | defined | pending | pending | Intake phase 0702-P1 belum selesai (queued) |
| 127 | `0702-task-02` | **blocked** | intake | defined | pending | pending | Intake phase 0702-P1 belum selesai (queued); Development berurutan: menunggu 0702-task-01 selesai |
| 128 | `0702-task-03` | **blocked** | intake | defined | pending | pending | Intake phase 0702-P1 belum selesai (queued); Development berurutan: menunggu 0702-task-01 selesai |
## Phase 0702-P2 — Live tracking — UI & integrasi

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 129 | `0702-task-04` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0702-P1; Intake phase 0702-P2 belum selesai (queued) |
| 130 | `0702-task-05` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0702-P1; Intake phase 0702-P2 belum selesai (queued); Development berurutan: menunggu 0702-task-04 selesai |
| 131 | `0702-task-06` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0702-P1; Intake phase 0702-P2 belum selesai (queued); Development berurutan: menunggu 0702-task-04 selesai |
| 132 | `0702-task-07` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0702-P1; Intake phase 0702-P2 belum selesai (queued); Development berurutan: menunggu 0702-task-04 selesai |
| 133 | `0702-task-08` | **blocked** | intake | defined | pending | pending | Gate phase: menunggu release Human QA 0702-P1; Intake phase 0702-P2 belum selesai (queued); Development berurutan: menunggu 0702-task-04 selesai |
## Phase 0800-P1 — Epic 0800 — seluruh task

| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |
|---|------|-----|-------|------|-----|-----|-------------------|
| 134 | `080001-docs-parse-manifest` | **blocked** | intake | defined | pending | pending | Intake phase 0800-P1 belum selesai (queued) |
| 135 | `080002-stack-run-ledger` | **blocked** | intake | defined | pending | pending | Intake phase 0800-P1 belum selesai (queued); Development berurutan: menunggu 080001-docs-parse-manifest selesai |
| 136 | `080003-docs-worker-skills` | **blocked** | intake | defined | pending | pending | Intake phase 0800-P1 belum selesai (queued); Development berurutan: menunggu 080001-docs-parse-manifest selesai |
| 137 | `080004-docs-policy-default` | **blocked** | intake | defined | pending | pending | Intake phase 0800-P1 belum selesai (queued); Development berurutan: menunggu 080001-docs-parse-manifest selesai |
| 138 | `080005-stack-dry-run-intake` | **blocked** | intake | defined | pending | pending | Intake phase 0800-P1 belum selesai (queued); Development berurutan: menunggu 080001-docs-parse-manifest selesai |

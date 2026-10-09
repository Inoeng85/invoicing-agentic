# Launch lane — urutan penutupan gate

Satu alur dari repo siap → staging → production. **Tanpa Docker** · **SQLite** ([ADR-0001](../architecture/decisions/adr-0001-sqlite-postgresql.md)).

## 0. Repo siap (developer)

```sh
npm run setup
npm run verify          # gate G0–G6
npm run ci:local        # paritas CI (PG-1 fallback)
npm run release:check   # G6 checklist
```

## 1. PG-1 — CI & `develop`

- [ ] Perbaiki billing GitHub Actions (job `verify` hijau) **atau** terima `ci:local` sebagai gate sementara
- [ ] `./scripts/apply-branch-protection.sh Inoeng85/invoicing-agentic verify`

## 2. PG-2 — Staging

Ikuti [staging-provision-checklist.md](staging-provision-checklist.md):

- Railway · volume · `npm run start` atau dua service
- `npm run host:check` dengan env staging
- Deploy workflow · `npm run staging:smoke`
- Resend + `npm run email:smoke`
- UAT web: [uat-gate-trace.md](../engineering/uat-gate-trace.md)

## 3. G6 — Release readiness

- [ ] UAT manual · legal [legal-review-checklist.md](../product/legal/legal-review-checklist.md)
- [ ] Sign-off [mvp-scope-lock.md](../product/brd/mvp-scope-lock.md)

## 4. PG-3 — Production

[production-provision-checklist.md](production-provision-checklist.md) → tag `v0.1.0-rc.1` → approve deploy → smoke.

## Referensi cepat

| Script | Gate |
|--------|------|
| `npm run verify` | G0–G6, PG-0 |
| `npm run ci:local` | PG-1 |
| `npm run host:check` | PG-2/3 env |
| `npm run staging:smoke` | PG-2/3 health |
| `npm run email:smoke` | G-04 |

# Launch lane — urutan penutupan gate

Satu alur dari repo siap → staging → production. **Tanpa Docker** · **SQLite** ([ADR-0001](./adr/ADR-0001-sqlite-postgresql.md)).

## 0. Repo siap (developer)

```sh
npm run setup
npm run verify          # gate G0–G6
npm run ci:local        # paritas CI (PG-1 fallback)
npm run release:check   # G6 checklist
```

## 1. PG-1 — CI & `main`

- [ ] Perbaiki billing GitHub Actions (job `verify` hijau) **atau** terima `ci:local` sebagai gate sementara
- [ ] `./scripts/apply-branch-protection.sh Inoeng85/invoicing-agentic verify`

## 2. PG-2 — Staging

Ikuti [STAGING-PROVISION-CHECKLIST.md](./STAGING-PROVISION-CHECKLIST.md):

- Railway · volume · `npm run start` atau dua service
- `npm run host:check` dengan env staging
- Deploy workflow · `npm run staging:smoke`
- Resend + `npm run email:smoke`
- UAT web: [UAT-GATE-TRACE.md](../invoicing/engineering/UAT-GATE-TRACE.md)

## 3. G6 — Release readiness

- [ ] UAT manual · legal [LEGAL-REVIEW-CHECKLIST.md](../invoicing/legal/LEGAL-REVIEW-CHECKLIST.md)
- [ ] Sign-off [MVP-SCOPE-LOCK.md](../invoicing/brd/MVP-SCOPE-LOCK.md)

## 4. PG-3 — Production

[PRODUCTION-PROVISION-CHECKLIST.md](./PRODUCTION-PROVISION-CHECKLIST.md) → tag `v0.1.0-rc.1` → approve deploy → smoke.

## Referensi cepat

| Script | Gate |
|--------|------|
| `npm run verify` | G0–G6, PG-0 |
| `npm run ci:local` | PG-1 |
| `npm run host:check` | PG-2/3 env |
| `npm run staging:smoke` | PG-2/3 health |
| `npm run email:smoke` | G-04 |

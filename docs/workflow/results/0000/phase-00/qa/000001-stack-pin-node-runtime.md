# QA report — 000001-stack-pin-node-runtime

| Field | Nilai |
|-------|-------|
| Task ID | 000001-stack-pin-node-runtime |
| Feature | [0000-platform-stack](../../../../features/0000-platform-stack.md) |
| Phase | 0000-P0 |
| **Hasil** | `pass` |
| Selesai | 2026-10-01T15:29:00+07:00 |

## Uji terkecil (dari plan / PRD verifikasi)

Tidak ada `skills/qa.md` pada task ini. Uji mengikuti Tujuan plan dan verifikasi PRD PS-01 / PS-02. `npm ci` dijalankan dengan `--dry-run --ignore-scripts` agar `node_modules` daemon tidak terhapus; gerbang engine tetap dievaluasi.

| # | Perintah / langkah | Expected | Actual | OK |
|---|-------------------|----------|--------|-----|
| 1 | `nvm use` lalu `node -v` di root `Agentic/` | `v24.x` sesuai `.nvmrc` | `v24.3.0` (npm `11.4.2`); `.nvmrc` dan `.node-version` = `24.3.0` | ya |
| 2 | `engines.node` root, `apps/web`, `apps/api`, `packages/*` + `.npmrc` | `>=24.3.0` dan `engine-strict=true` | Semua enam `package.json` `{"node":">=24.3.0"}`; `.npmrc` = `engine-strict=true` | ya |
| 3 | `nvm exec 20.20.2 npm ci --dry-run --ignore-scripts --no-audit --no-fund` | Exit ≠ 0 dengan pesan engine | Exit 1 · `EBADENGINE` / `notsup` · Required `{"node":">=24.3.0"}` · Actual `v20.20.2` | ya |
| 4 | `nvm exec 24.3.0 npm ci --dry-run --ignore-scripts --no-audit --no-fund` | Exit 0 | Exit 0 · `added 185 packages in 720ms` | ya |

## Fix dalam session

Tidak ada — baseline pin sudah benar.

## Log / bukti

```text
nvm use → Found .nvmrc <24.3.0> · Now using node v24.3.0 (npm v11.4.2)
node -v → v24.3.0

Node 20.20.2:
npm error code EBADENGINE
npm error engine Unsupported engine
npm error notsup Required: {"node":">=24.3.0"}
npm error notsup Actual:   {"node":"v20.20.2","npm":"11.12.1"}
EXIT20:1

Node 24.3.0:
added 185 packages in 720ms
EXIT24:0
```

## Catatan untuk Audit

PS-01 dan PS-02 lulus uji lokal. Sertakan dalam review phase 0000-P0.

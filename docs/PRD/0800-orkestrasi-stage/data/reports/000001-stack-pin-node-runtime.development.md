# Development report — 000001-stack-pin-node-runtime

| Field | Nilai |
|-------|-------|
| Task ID | 000001-stack-pin-node-runtime |
| Feature | [0000-platform-stack](../../../../agentic/development/features/0000-platform-stack.md) |
| Phase | 0000-P0 |
| Selesai | 2026-10-01T14:52:54+07:00 |
| Commit / PR | `4bbc062` (Platform setup Phase 0, 2026-09-29) |

## Ringkasan

PS-01 dan PS-02 sudah ada di baseline: Node minimum `>=24.3.0` di `engines` root, `apps/web`, `apps/api`, dan `packages/*`; `.nvmrc` dan `.node-version` berisi `24.3.0`; `.npmrc` berisi `engine-strict=true`. Session ini memasang Node tersebut lewat `nvm install && nvm use` dan menguji gerbang engine.

## File diubah

- Tidak ada perubahan produk. Pin sudah di commit `4bbc062`:
  - `.nvmrc`
  - `.node-version`
  - `.npmrc`
  - `package.json` (`engines.node`)
  - `apps/web/package.json`, `apps/api/package.json`
  - `packages/database/package.json`, `packages/domain/package.json`, `packages/platform/package.json`

## Verifikasi dijalankan

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install && nvm use
node -v

# Node 20.20.2 (shell awal)
npm install --dry-run --ignore-scripts --no-audit --no-fund

# Node 24.3.0 setelah nvm use
npm install --dry-run --ignore-scripts --no-audit --no-fund
```

## Exit / hasil

- `node -v` → `v24.3.0` (npm `11.4.2`)
- Node `v20.20.2` → `EBADENGINE` / `notsup`, required `{"node":">=24.3.0"}`
- Node `v24.3.0` → dry-run exit 0
- `npm ci` penuh tidak diulang: dry-run sudah membuktikan `engine-strict` tanpa menghapus `node_modules`. Hasil PRD 2026-09-30: Node 24 `npm ci` sukses.

## Catatan untuk QA

Uji `npm ci` di Node di bawah 24.3 harus gagal dengan pesan engine, dan `npm ci` di Node 24.3.0 harus sukses. `nvm use` di root `Agentic/` membaca `.nvmrc` → `24.3.0`.

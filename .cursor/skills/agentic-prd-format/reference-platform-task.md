# Template — task platform (PRD-0000 development phase)

Gunakan struktur ini di `docs/product/requirements/0000-platform-setup/PRD_platform_setup_development_phase.md` untuk setiap task baru.

## Blok dokumen (urutan wajib)

1. **H1** + meta (versi selaras `prd_platform_setup.md`, verifikasi terakhir)
2. **Scope** satu baris (platform only)
3. **Format ID task** (tabel bagian `xxxx` / `yy` / kanonik)
4. **Ringkasan fase** (Phase 0–3, jumlah task, status gate)
5. **Urutan eksekusi (canonical)** — daftar task ID backtick per fase; **sama** dengan PRD §7.1
6. **Pemetaan baseline PRD → task** (B-01…B-12)
7. **## Phase N — {judul}** per fase:
   - **Tujuan fase** (paragraf)
   - Tabel **Task | Status | Verifikasi** (ringkas)
   - `### {task-id}` untuk setiap task (detail di bawah)
8. **## Matriks task ↔ PS** (semua task ↔ PS-xx)

## Skeleton satu task

```markdown
### 000006-stack-verify-script

**Status:** Done · 2026-09-30

| PS | Depends | Output |
|----|---------|--------|
| PS-18, PS-43 | 000005-stack-setup-script | `scripts/verify.ts`, npm script `verify` |

**Tahapan**
1. {{langkah numerik}}
2. {{…}}

**Verifikasi:** {{command}} · {{expected signal}}

**Hasil:** {{faktual singkat; link commit opsional}}
```

## Aturan

- **PS** di kolom task = requirement platform dari `prd_platform_setup.md` §3
- **Depends** = task ID lain (bukan PS)
- **Status** baris fase vs **Status** task: fase boleh agregat (`9/9 task done`); task pakai Done / Partial / Todo
- Setelah menambah task: update jumlah di **Ringkasan fase**, urutan canonical, dan **Matriks task ↔ PS**
- Mirror `docs/product/requirements/0000-platform-setup/0000_PRD_Platform_Setup_Development_phase.md`: hanya ringkasan + link canonical — **tanpa** copy-paste semua `### task`

## Meta baris verifikasi (contoh)

```markdown
| Verifikasi terakhir | 2026-09-30 · PG-0 lulus · PG-1 partial · commit `abc1234` |
```

# PRD-0800 — Orkestrasi Stage Agent dan Manusia · Development Phase

| Meta | Nilai |
|------|-------|
| ID | **0800** |
| Gate | **TG-0** |
| Task ID prefix | `0800yy-[area]-[slug]` |
| Spec | [0800_PRD_Orkestrasi_Stage.md](0800_PRD_Orkestrasi_Stage.md) |

## Ringkasan fase

**Tujuan:** Ledger dan CLI yang menahan stage sampai artefak valid, dengan satu dry-run yang berhenti untuk manusia sebelum ada diff produk.

| Task | Area | Output |
|------|------|--------|
| 080001-docs-parse-manifest | docs | Parser satu Development phase → manifes task (OR-01) |
| 080002-stack-run-ledger | stack | CLI `status` / `complete` / `ask` / `answer`; tolak `running` tanpa acuan dan rencana; tolak `complete` bila hasil tidak memetakan butir rencana (OR-02, OR-08, OR-09, OR-11, OR-12, OR-16…OR-19) |
| 080003-docs-worker-skills | docs | Skill implementer/tester dan skill auditor: baca acuan, tulis rencana, baru bertindak, lalu tulis hasil (OR-03…OR-07, OR-13, OR-17) |
| 080004-docs-policy-default | docs | Policy YAML default dan penimpaan per task Review Focus (OR-08, OR-10) |
| 080005-stack-dry-run-intake | stack | Satu task contoh berhenti di `waiting_human` tanpa diff produk (OR-14, OR-15) |

## Urutan eksekusi

`080001` → `080002` → `080003` → `080004` → `080005`

## Gate TG-0 — pass criteria

| Check | Metode | Pass jika |
|-------|--------|-----------|
| TG-0.1 | Uji parser pada satu Development phase yang ada | Manifes memuat Files, Produces, perintah uji; heading tanpa Files gagal dengan nama heading |
| TG-0.2 | `complete` pada stage `test` tanpa `test.json`, atau `rencana.md` tanpa heading "Akan dilakukan" | Exit nonzero; `state.json` tidak berpindah stage |
| TG-0.3 | Dry-run 080005 | Status `waiting_human`; diff kode produk kosong |
| TG-0.4 | `npm run gate` | Kriteria dan hasil G0–G7 tidak berubah oleh file epic ini |

## Definition of Done

- [ ] OR-01…OR-19 terpenuhi atau tercatat blokernya di run ledger
- [ ] Policy default di spec tersimpan sebagai file yang dibaca CLI
- [ ] Dua skill pekerja: satu stage per sesi; auditor tanpa tulis kode produk
- [ ] TG-0.1…TG-0.4 pass
- [ ] Tidak ada perubahan `scripts/gates/` untuk G0–G7

## Bloker

- Tidak menunggu lulusnya epic produk 0702. Dry-run hanya **membaca** satu Development phase dan berhenti sebelum mengubah kode fitur.
- Jangan menggabungkan task 0800 ke dalam `npm run gate` produk.

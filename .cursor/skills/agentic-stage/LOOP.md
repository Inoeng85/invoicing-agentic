# Fase di dalam satu stage

Setiap skill menjalankan tepat satu fase per sesi, lalu berhenti.

Urutan fase: `acuan` → `rencana` → `aksi` → `hasil`.

| Fase | Siapa | Berkas yang harus sudah ada | Berkas yang ditulis sesi ini | Sesi berakhir dengan |
|------|--------|------------------------------|------------------------------|----------------------|
| acuan | orchestrator | — | `{stage}/acuan.md` | `phase: rencana`, `status: ready`, `nextSkill` pelaku stage |
| rencana | pelaku stage | `acuan.md` | `{stage}/rencana.md` | `phase: rencana`, `status: ready`, `nextSkill: agentic-orchestrator` |
| aksi | pelaku stage | `acuan.md` dan `rencana.md`, `status: running` | kerja stage (kode, uji, atau putusan) | `phase: hasil`, `nextSkill` tetap skill ini, `hasil.md` belum ditulis |
| hasil | pelaku stage | kerja stage selesai | `{stage}/hasil.md` plus bukti mesin stage | `phase: hasil`, `status: running`, `nextSkill: agentic-orchestrator` |

Pelaku tidak mengubah `status` menjadi `passed`. Orchestrator yang memajukan stage setelah hasil valid.

## Masuk sesi

1. Baca `.agentic/runs/{epic}/task-{nn}/state.json`.
2. `nextSkill` bukan skill ini → berhenti. Sebut `nextSkill`, stage, dan phase. Jangan menulis berkas stage.
3. `status` adalah `waiting_human` → berhenti. Tampilkan `waiting.question`. Jangan mengarang jawaban.
4. Fase yang dikerjakan hanya `state.phase`. Jangan menulis berkas fase sesudahnya di sesi yang sama.

## Keluar sesi

Laporkan: epic, task, stage, phase, status, `nextSkill`, dan path berkas yang baru ditulis.

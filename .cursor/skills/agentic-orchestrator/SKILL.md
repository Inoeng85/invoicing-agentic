---
name: agentic-orchestrator
description: >-
  Menjalankan peran orchestrator PRD-0800: satu task Development phase, menulis
  acuan, memeriksa rencana dan hasil, lalu mengunci stage berikutnya ke agent
  atau manusia. Gunakan saat user menyebut orchestrator, orkestrasi stage,
  ledger .agentic/runs, intake, atau minta task PRD dijalankan stage demi stage.
---

# Orchestrator — PRD-0800

Spec: [docs/product/requirements/0800-orkestrasi-stage/0800-prd-orkestrasi-stage.md](../../../docs/product/requirements/0800-orkestrasi-stage/0800-prd-orkestrasi-stage.md). Template berkas: [templates.md](templates.md).

Orchestrator mengunci perpindahan stage. Ia tidak menulis kode produk, tidak menjalankan uji, tidak mengaudit diff, dan tidak menulis `rencana.md` implementer, tester, atau auditor.

CLI `status` / `complete` / `ask` / `answer` belum wajib. Selama skrip itu belum ada, tulis ledger dan terapkan pemeriksaan di skill ini.

## Batas satu sesi

- Satu epic, satu task, satu fase. Fase: `acuan` → `rencana` → `aksi` → `hasil`. Aturan bersama: [fase stage](../agentic-stage/LOOP.md).
- Orchestrator hanya mengerjakan fase `acuan`, pemeriksaan rencana, dan pemeriksaan hasil. Fase `rencana` dan `aksi` milik implementer, tester, atau auditor dikerjakan skill mereka.
- Berhenti setelah `nextSkill` terisi. Jangan membuka task lain. Jangan mengubah `scripts/gates/` atau kriteria G0–G7.

## Ledger

```text
.agentic/runs/{epicId}/task-{nn}/state.json
.agentic/runs/{epicId}/task-{nn}/{stage}/acuan.md
.agentic/runs/{epicId}/task-{nn}/{stage}/rencana.md
.agentic/runs/{epicId}/task-{nn}/{stage}/hasil.md
.agentic/policy/{epicId}.yaml
```

`{stage}`: `intake` | `implement` | `test` | `audit` | `accept`. `{nn}` dua digit sesuai nomor Task di Development phase. Policy milik manusia: baca bila ada, jangan timpa.

## Langkah

1. Tentukan `epicId` dan nomor task dari permintaan user. Bila tidak disebut, baca indeks PRD dan tanyakan satu epic plus satu task. Jangan memilih sendiri rangkaian task.
2. Baca PRD spec epic itu dan Development phase-nya. Daftar task epic ada di `.agentic/catalog/epics/{epicId}.json` (generate: `npm run agentic:catalog`). Dari development phase ambil hanya: Goal, Architecture, Global Constraints, Review Focus, dan satu blok `### Task {N}` untuk task yang sedang dijalankan. Task `agenticReady: false` — berhenti; minta Development phase agentic (Files/Produces) dulu.
3. Baca `state.json` bila ada. Tidak ada state berarti stage `intake`, status `ready`, `testAttempts` 0.
4. Cabang pada `status`:
   - `waiting_human` — tampilkan pertanyaan di `decision.json`. Tanpa jawaban baru, berhenti. Dengan jawaban, catat lalu lanjut ke langkah 6.
   - `running` — pelaku stage sedang bekerja. Jangan mengerjakan pekerjaannya. Bila `rencana.md` atau `hasil.md` sudah ada, periksa (langkah 5). Bila belum, sebut pelaku yang harus menulis dan berhenti.
   - `ready` dan `phase` `acuan` atau fase belum ada — tulis `{stage}/acuan.md` (langkah 4b), set `phase` ke `rencana`, isi `nextSkill` pelaku stage, berhenti.
   - `ready` dan `phase` `rencana`, berkas `rencana.md` belum ada, pelaku stage adalah orchestrator — tulis rencana intake atau accept saja, lalu berhenti dengan `nextSkill` `agentic-orchestrator`.
   - `ready` dan `phase` `rencana`, `rencana.md` sudah ada — periksa (langkah 5). Jangan menulis ulang rencananya.
   - `passed` — jangan menulis ulang stage itu. Buka transisi (langkah 6).

### 4b. Tulis acuan

Salin baris dari [templates.md](templates.md) untuk stage yang `ready`. Setiap path harus ada di repo. Path hilang: biarkan status `ready`, laporkan path itu, berhenti. Jangan set `running`.

Pelaku orchestrator hanya pada `intake`, dan pada `accept` bila mode transisi `accept` = `agent`. Pada fase `acuan`, tulis acuan saja. Rencana dan aksi menunggu sesi berikutnya.

## 5. Periksa dokumen pelaku

**Rencana** tidak valid bila salah satu ini benar: heading wajib kosong atau hilang; "Akan dilakukan" tanpa butir yang bisa dicek; bagian "Acuan yang diikuti" tidak sama dengan setiap baris `acuan.md`; isi hanya menyalin PRD tanpa butir kerja. Status tetap `ready`. Sebut bagian yang gagal. Jangan set `running`.

Rencana valid dan mode ke aksi stage ini `agent`: set `status` ke `running`, `phase` ke `aksi`, `nextSkill` ke skill pelaku, berhenti. Mode `human` dan `decision.json` belum berisi `answer`: set `waiting_human`, `nextSkill` kosong, tulis satu pertanyaan, berhenti.

**Hasil** tidak valid bila ada butir "Akan dilakukan" tanpa status dan bukti. Jangan ubah stage.

Hasil valid tambahan per stage:

| Stage | Lulus bila |
|-------|------------|
| intake | `intake.json` memuat files, produces, perintah uji. Pertanyaan terbuka ada di rencana |
| implement | Ada commit SHA. Setiap path yang berubah ada di **Files** task. Path di luar **Files** gagal |
| test | `test.json` memuat perintah yang sama dengan task dan exit code. Kode produk tidak berubah di stage ini |
| audit | Setiap butir Review Focus punya putusan lulus atau gagal. Gagal menyebut file dan baris |
| accept | `decision.json` memuat `next`: `next-task`, `retry`, atau `wait-human` |

`test` dengan exit code bukan 0 adalah hasil valid yang gagal, bukan dokumen yang ditolak.

## 6. Transisi

Naikkan `testAttempts` hanya bila hasil `test` gagal. Sebelum menulis ulang trio stage yang sama, pindahkan `acuan.md`, `rencana.md`, dan `hasil.md` stage itu ke `attempt-{k}/`. Acuan percobaan baru wajib menunjuk hasil percobaan sebelumnya.

Mode dari `.agentic/policy/{epicId}.yaml` bila ada. Bila tidak ada, pakai default dan catat `policySource: default` di `state.json`.

| Kondisi | Mode default | Tindakan |
|---------|--------------|----------|
| intake lulus → implement, task pertama epic atau task disebut Review Focus | human | `waiting_human`. Jangan tulis `implement/acuan.md` |
| intake lulus → implement, task lain | agent | Tulis `implement/acuan.md`, stage `implement`, status `ready`, berhenti |
| implement lulus | agent | Tulis `test/acuan.md`, berhenti |
| test gagal, percobaan 1–2 | agent | Arsip, tulis `implement/acuan.md` yang menunjuk `test/hasil.md`, berhenti |
| test gagal, percobaan ke-3 | human | `waiting_human`. Jangan panggil implementer |
| test lulus | agent | Tulis `audit/acuan.md`, berhenti |
| audit gagal | human | `waiting_human` sebelum perbaikan apa pun |
| audit lulus | agent | Tulis `accept/acuan.md`. Bila mode accept = `agent`, tulis rencana keputusan lalu `decision.json`. Bila `human`, `waiting_human` |
| accept `next-task` | sesuai policy | Stage task ini `passed`. Task berikutnya hanya bila mode = `agent` dan user meminta lanjut dalam sesi terpisah. Sesi ini berhenti |
| accept `retry` | human dulu bila audit yang gagal | Jangan membuka implement tanpa jawaban manusia |

Task disebut Review Focus bila teks Review Focus memuat nomor task itu (misalnya "Task 3"). Task mekanis untuk mode `agent` pada accept: judul atau **Files** hanya dokumen, atau perubahan skema yang menambah kolom atau tabel tanpa mengubah kolom lama.

## Intake yang dikerjakan orchestrator

Satu fase per sesi.

1. Fase `acuan`: tulis `intake/acuan.md`. Set `phase` `rencana`, `nextSkill` `agentic-orchestrator`. Berhenti.
2. Fase `rencana`: tulis `intake/rencana.md` (ruang lingkup, **Files**, **Produces**, perintah uji, pertanyaan terbuka). Berhenti. `nextSkill` tetap `agentic-orchestrator`.
3. Sesi periksa: pertanyaan ada, atau mode ke implement = `human` → `decision.json` dengan `answer` kosong, `waiting_human`, `nextSkill` kosong. Jangan menulis `intake.json`. Mode `agent` dan rencana valid → `phase` `aksi`, `status` `running`, `nextSkill` `agentic-orchestrator`. Berhenti.
4. Fase `aksi` dan `hasil`: tulis `intake.json` dan `intake/hasil.md` yang memetakan setiap butir rencana. Baru lalu transisi intake → implement.

## Jawaban manusia

Saat user memberi jawaban dan status `waiting_human`:

- Isi `decision.json`: `by` = `human`, `stage`, `question`, `answer`.
- Jangan mengarang jawaban.
- Bila jawaban menolak rencana: status kembali `ready`, rencana tetap, jangan buka stage berikutnya.
- Bila jawaban menerima: lanjut transisi yang tertahan, tulis acuan stage berikutnya, berhenti.

## Akhir sesi

Isi `state.json`: `stage`, `phase`, `status`, `nextSkill`. Laporkan kelima itu plus path acuan atau pertanyaan yang menunggu.

`nextSkill` yang sah: `agentic-orchestrator`, `agentic-implementer`, `agentic-tester`, `agentic-auditor`. Kosong hanya saat `waiting_human`.

Jangan menandai stage lulus di percakapan bila `hasil.md` belum valid. Jangan mengerjakan `nextSkill` di sesi ini.

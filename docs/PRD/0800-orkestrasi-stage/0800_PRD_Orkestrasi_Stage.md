# PRD-0800 — Orkestrasi Stage Agent dan Manusia

| Meta | Nilai |
|------|-------|
| ID | **0800** |
| Induk | — (tooling development, bukan epic produk invoice) |
| Gate | **TG-0** (tool gate lokal; bukan G0–G7) |
| FR | — (bukan requirement produk) |
| BR | — |
| Status | Draft |
| Development phase | [0800_PRD_Orkestrasi_Stage_Development_phase.md](./0800_PRD_Orkestrasi_Stage_Development_phase.md) |

## Ringkasan

Pemilik repo memberi PRD dan Development phase. Agent mengerjakan development, uji, dan audit **per task**, satu stage pada satu waktu. Perpindahan stage dikunci oleh orchestrator: stage berikutnya hanya mulai bila artefak stage sebelumnya valid, dan policy transisi itu mengizinkan **agent** atau **manusia**.

Manusia masuk untuk klarifikasi dan untuk menerima stage yang berisiko. Agent lain mengambil stage mekanis (uji, audit baca-saja, ulang implementasi yang gagal uji dalam batas percobaan). Riwayat chat bukan sumber keadaan. Keadaan ada di ledger file dan git SHA.

Sebelum bertindak, tiap stage membaca `acuan.md` (daftar dokumen dan bagian) dan menulis `rencana.md` (apa yang akan dilakukan). Sesudah bertindak, `hasil.md` memetakan setiap butir rencana ke bukti.

## Latar belakang

Development phase (contoh PRD-0702) sudah memuat Goal, Global Constraints, Review Focus, dan task dengan Files, Produces, langkah, serta perintah verifikasi. `npm run gate` sudah mengunci epic produk (G0–G7).

Yang belum terkunci adalah eksekusi di dalam satu task. Satu sesi agent dapat menandai langkah selesai, melewati audit, atau lanjut ke task berikutnya tanpa bukti dan tanpa kesempatan manusia mengklarifikasi.

## Tujuan

| ID | Tujuan | Ukuran keberhasilan |
|----|--------|---------------------|
| T-01 | Setiap task berjalan stage demi stage | Tidak ada stage `implement` yang mulai tanpa `intake.json` terkunci |
| T-02 | Handoff eksplisit | Setiap transisi punya mode `agent` atau `human` di policy epic |
| T-03 | Manusia mengklarifikasi di titik yang ditahan | Status `waiting_human` memuat satu pertanyaan dan stage yang tertahan; kerja berhenti sampai ada jawaban |
| T-04 | Audit terpisah dari penulis kode | Auditor tidak menulis kode produk; implementer tidak menulis `audit.md` |
| T-05 | Epic produk tetap di gate yang ada | Selesainya seluruh task 0800 tidak mengubah kriteria `npm run gate` |
| T-06 | Setiap stage punya acuan dan rencana sebelum bertindak | Stage tidak berstatus `running` sebelum `acuan.md` dan `rencana.md` stage itu lengkap |

## Keputusan desain

| # | Keputusan | Alasan |
|---|-----------|--------|
| D-01 | Ledger di `.agentic/runs/{epic}/task-NN/`, bukan riwayat chat | Stage harus bisa dilanjut di sesi baru |
| D-02 | Lima stage per task: `intake` → `implement` → `test` → `audit` → `accept` | Memisahkan tulis kode, bukti uji, dan pemeriksaan |
| D-03 | Empat peran: orchestrator, implementer, tester, auditor | Satu wewenang per peran; manusia bukan peran kelima di dalam agent, manusia menjawab saat status `waiting_human` |
| D-04 | Implementer tidak memajukan stage | Lulus hanya lewat artefak yang dicek orchestrator |
| D-05 | Auditor konteks terpisah, baca-saja terhadap kode | Audit oleh penulis yang sama tanpa batas tulis tidak mengunci apa pun |
| D-06 | Policy per transisi, per epic | Task mekanis boleh agent-to-agent; task di Review Focus wajib agent-to-human |
| D-07 | PRD dan Development phase tetap rencana kanonik | Orchestrator mem-parse task; task tidak disalin ke tiket lain |
| D-08 | `npm run gate` tetap gerbang epic produk | TG-0 hanya mengunci alat orkestrasi |
| D-09 | Uji gagal: agent mengulang implementasi paling banyak 2 kali; percobaan ke-3 menunggu manusia | Batas ulang mencegah loop tanpa klarifikasi |
| D-10 | Audit gagal selalu menunggu manusia sebelum ada perbaikan | Temuan berisiko tidak langsung ditambal oleh agent yang sama |
| D-11 | `intake` → `implement` menunggu manusia untuk task pertama epic dan untuk task yang disebut di Review Focus | Kontrol di awal dan di risiko yang sudah ditulis di rencana |
| D-12 | `accept` → task berikutnya: manusia untuk task Review Focus; agent untuk task mekanis (dokumen, skema additive) | Mode campuran sesuai permintaan handoff |
| D-13 | Tiap stage memakai tiga dokumen berurutan: `acuan.md`, lalu `rencana.md`, lalu `hasil.md` | Acuan mengunci bacaan; rencana menyatakan apa yang akan dilakukan sebelum ada aksi; hasil membuktikan rencana |
| D-14 | Acuan adalah daftar rujukan path dan bagian, bukan salinan PRD | Dokumen kanonik tetap di `docs/PRD/`; run hanya menunjuk bagian yang berlaku untuk stage itu |
| D-15 | Percobaan ulang mengarsip trio dokumen ke `attempt-{k}/` lalu menulis trio baru | Rencana gagal tetap terbaca; acuan percobaan baru wajib menyebut hasil percobaan sebelumnya |

## Requirement

ID `OR-` adalah requirement **alat**, bukan `FR-` produk dan bukan `PS-` platform.

| ID | Requirement | Acceptance |
|----|-------------|------------|
| OR-01 | Parser Development phase menghasilkan manifes task | Untuk satu file `*_Development_phase.md`, keluaran memuat id task, judul, daftar path pada **Files**, **Produces**, dan perintah verifikasi. Heading task yang tidak punya **Files** gagal parse dengan pesan yang menyebut heading itu |
| OR-02 | Orchestrator menolak `complete` tanpa artefak stage | Memanggil selesai pada `test` tanpa `test.json`, atau dengan exit code hilang, keluar dengan status gagal dan tidak mengubah stage |
| OR-03 | Stage `implement` hanya boleh mengubah path di task | Ledger mencatat file yang berubah. Path di luar **Files** membuat stage gagal dan tidak masuk `test` |
| OR-04 | Stage `test` menjalankan perintah yang tertulis di task | `test.json` menyimpan perintah, exit code, dan cuplikan log. Perintah yang berbeda dari task ditolak |
| OR-05 | Tester tidak mengubah kode produk | Diff produk kosong setelah stage `test`. Yang boleh tertulis hanya `test.json` dan log di folder run |
| OR-06 | Auditor menulis putusan per butir Review Focus | `audit.md` memuat tiap butir Review Focus dengan putusan lulus atau gagal, plus rujukan file dan baris bila gagal. Butir yang tidak dinilai membuat `accept` tertolak |
| OR-07 | Auditor tidak menulis kode produk | Sesi audit tidak punya jalur tulis ke kode produk. Diff produk kosong setelah audit |
| OR-08 | Policy menentukan pelaku transisi | File policy epic memuat tiap transisi (`intake→implement`, `implement→test`, `test gagal→implement`, `test lulus→audit`, `audit gagal→implement`, `accept→task berikutnya`) dengan nilai `agent` atau `human` |
| OR-09 | Mode `human` menahan kerja | Bila policy transisi = `human` dan `decision.json` belum berisi jawaban manusia, stage berjalan berhenti di `waiting_human`. Pertanyaan, opsi bila ada, dan id stage yang tertahan tersimpan. Tidak ada stage berikutnya yang mulai |
| OR-10 | Jawaban manusia tertelusur | Jawaban di `decision.json` memuat pelaku `human`, teks jawaban, dan stage. Pesan commit task mengutip jawaban itu |
| OR-11 | Batas ulang uji | Setelah dua `test` gagal pada task yang sama, percobaan ketiga tidak memanggil implementer. Status menjadi `waiting_human` |
| OR-12 | Audit gagal menahan perbaikan | `audit.md` dengan putusan gagal mengubah status ke `waiting_human`. Implementer tidak dipanggil ulang sampai ada jawaban manusia |
| OR-13 | Satu sesi pekerja satu stage | Skill pekerja membaca `state.json`, mengerjakan hanya stage `ready`, menulis artefak stage itu, lalu berhenti. Skill tidak membuka task lain |
| OR-14 | Dry-run membuktikan berhenti untuk manusia | Pada satu task contoh, run berhenti di `intake` dengan `waiting_human` sebelum ada diff kode produk |
| OR-15 | Gate produk tidak berubah | `npm run gate` dan kriteria G0–G7 tidak dimodifikasi oleh epic ini |
| OR-16 | Orchestrator menulis `acuan.md` sebelum pelaku stage mulai | Berkas ada, setiap baris punya path yang ada di repo dan nama bagian. Path hilang membuat stage tetap `ready`, bukan `running` |
| OR-17 | Pelaku stage menulis `rencana.md` sebelum aksi stage | Lima heading wajib terisi: Akan dilakukan, Tidak akan dilakukan, Acuan yang diikuti, Selesai bila, Perlu manusia bila. "Akan dilakukan" minimal satu butir yang bisa dicek. Aksi stage (edit kode, perintah uji, putusan audit, keputusan lanjut) ditolak bila rencana belum ada |
| OR-18 | `hasil.md` memetakan setiap butir "Akan dilakukan" | Tiap butir punya status selesai atau tidak, plus bukti (path, SHA, exit code, atau kutipan). Butir rencana yang tidak disebut membuat `complete` gagal |
| OR-19 | "Acuan yang diikuti" di rencana sama dengan daftar `acuan.md` | Rujukan yang tidak ada di `acuan.md`, atau baris acuan yang tidak disebut rencana, membuat rencana tidak valid |

## Desain

### Stage

| Stage | Pelaku | Acuan yang wajib dirujuk | Rencana menyatakan | Hasil membuktikan |
|-------|--------|---------------------------|-------------------|-------------------|
| intake | orchestrator | PRD spec; Development phase: Goal, Architecture, Global Constraints, Review Focus, dan hanya blok Task ini; policy epic | Ruang lingkup task, file, produces, perintah uji, pertanyaan terbuka | `intake.json` sesuai butir rencana; pertanyaan terbuka ikut ke `decision` bila ada |
| implement | implementer | `intake` hasil + rencana; blok Task; Global Constraints; jawaban manusia bila ada | File yang akan diubah, perilaku yang akan ditambah, uji yang akan ditulis lebih dulu, pesan commit yang direncanakan | Commit SHA; daftar file dibanding **Files** |
| test | tester | `implement` hasil + rencana; perintah uji di task | Perintah persis yang akan dijalankan, syarat lulus, pernyataan bahwa kode produk tidak diubah | `test.json`: perintah, exit code, log |
| audit | auditor | PRD (acceptance task); Review Focus; `implement` hasil; `test` hasil; diff SHA | Butir yang akan diperiksa dan cara memeriksanya | `audit.md`: lulus atau gagal per butir, dengan file dan baris |
| accept | orchestrator, atau manusia bila policy `human` | Semua `hasil.md` stage sebelumnya; policy transisi `accept` | Keputusan yang diusulkan: lanjut, ulang, atau tanya manusia, dengan alasan | `decision.json` |

Urutan task mengikuti urutan heading di Development phase. Epic produk yang sedang dikerjakan selesai untuk alat ini bila task terakhir `accept` dan, terpisah, `npm run gate` fase itu lulus.

### Ledger

```text
.agentic/runs/{epicId}/task-{nn}/
  state.json
  intake/acuan.md
  intake/rencana.md
  intake/hasil.md          # merujuk intake.json
  implement/acuan.md
  implement/rencana.md
  implement/hasil.md       # SHA + daftar file
  test/acuan.md
  test/rencana.md
  test/hasil.md            # merujuk test.json dan test.log
  audit/acuan.md
  audit/rencana.md
  audit/hasil.md           # merujuk audit.md
  accept/acuan.md
  accept/rencana.md
  accept/hasil.md          # merujuk decision.json
  attempt-{k}/…            # trio tahap yang diulang, sebelum trio baru ditulis
```

Bukti mesin (`intake.json`, `test.json`, `audit.md`, `decision.json`, `test.log`) tetap di folder stage yang sama. `hasil.md` menunjuk berkas itu; `complete` membaca keduanya.

### Isi wajib `rencana.md`

Heading berikut wajib, berurutan, dan tidak kosong:

```text
# Rencana — {stage} — {epic} task {nn}
## Akan dilakukan
## Tidak akan dilakukan
## Acuan yang diikuti
## Selesai bila
## Perlu manusia bila
```

"Akan dilakukan" berisi butir kerja yang belum terjadi. "Perlu manusia bila" berisi satu pertanyaan, atau kalimat "Tidak ada." Orchestrator menolak rencana yang menyalin ulang PRD tanpa butir kerja.

### Isi wajib `acuan.md`

| # | Path | Bagian | Dipakai untuk |
|---|------|--------|----------------|

Orchestrator yang menulis berkas ini. Pelaku stage tidak menambah atau menghapus baris.

`state.status`: `ready` · `running` · `waiting_human` · `passed` · `failed`.

`state.phase`: `acuan` · `rencana` · `aksi` · `hasil`. Satu sesi skill hanya mengerjakan satu fase. `state.nextSkill` menyebut skill yang boleh sesi berikutnya: `agentic-orchestrator`, `agentic-implementer`, `agentic-tester`, atau `agentic-auditor`. Kosong saat `waiting_human`.

Policy epic (milik manusia), satu file per epic yang diorkestrasi:

```text
.agentic/policy/{epicId}.yaml
```

Contoh isian wajib: setiap transisi pada OR-08 bernilai `agent` atau `human`. Task id yang disebut Review Focus dapat menimpa `accept→task berikutnya` dan `intake→implement` menjadi `human`.

### Peran

| Peran | Boleh menulis | Tidak boleh |
|-------|----------------|-------------|
| Orchestrator | `state.json`; `acuan.md` tiap stage; validasi rencana dan hasil | Mengubah kode produk; menulis `rencana.md` pelaku lain; menyatakan lulus tanpa hasil |
| Implementer | `implement/rencana.md` sebelum edit; kode di **Files**; `implement/hasil.md` sesudah commit | Menulis `acuan.md`; menulis dokumen audit; membuka task lain; mengedit sebelum rencana valid |
| Tester | `test/rencana.md` sebelum perintah; `test.json`, `test.log`, `test/hasil.md` sesudahnya | Mengedit kode produk; menulis acuan |
| Auditor | `audit/rencana.md` sebelum memeriksa; `audit.md` dan `audit/hasil.md` sesudahnya | Commit kode; menulis acuan |
| Manusia | Jawaban di `decision.json` saat `waiting_human`; boleh menolak `rencana.md` sebelum stage `running` | — (bukan proses agent) |

### Perintah

Antarmuka minimum, dijalankan dari root repo Agentic:

| Perintah | Perilaku |
|----------|----------|
| `status` | Menampilkan epic, task, stage, status, pertanyaan terbuka bila `waiting_human` |
| `complete` | Menutup stage berjalan hanya bila artefak stage itu valid |
| `ask` | Menulis `waiting_human` dengan satu pertanyaan |
| `answer` | Mencatat jawaban manusia dan, bila policy mengizinkan, membuka stage berikutnya |

`complete` pada stage tidak valid keluar nonzero dan tidak mengubah `state.json`.

### Data yang tidak masuk database produk

Tidak ada model Prisma dan tidak ada tabel baru. Ledger adalah file di `.agentic/`. Folder run boleh diabaikan git bila berisi log lokal; policy YAML yang disepakati masuk git.

## Policy default (bila file policy belum menimpa)

| Dari | Ke | Mode |
|------|----|------|
| intake | implement | `human` untuk task pertama epic dan task yang disebut Review Focus; selain itu `agent` |
| implement | test | `agent` |
| test gagal, percobaan 1–2 | implement | `agent`, dengan log uji sebagai masukan |
| test gagal, percobaan ke-3 | — | `human` |
| test lulus | audit | `agent` |
| audit gagal | implement | `human` dulu |
| accept | task berikutnya | `human` bila task ada di Review Focus; `agent` untuk task mekanis (dokumen, skema additive) |

## Non-goals

- Fitur produk invoice, kolektor, atau perubahan FR/BR di MVP.
- Mengganti atau memperlonggar G0–G7.
- Platform multi-agent umum di luar satu repo dan satu Development phase.
- Satu sesi yang mengerjakan seluruh Development phase sampai selesai.
- Tester yang memperbaiki kode agar uji hijau.
- Menyalin task ke pelacak tiket terpisah.
- UI web untuk ledger pada versi ini.

## Dependensi

| PRD / artefak | Butuh |
|---------------|--------|
| Development phase target | File rencana bergaya agentic sudah ada (Files, Produces, perintah uji, Review Focus) |
| PRD-0000 | Repo bisa menjalankan Node dan skrip dari root |
| Gate produk | Tidak diblokir oleh 0800; tetap dipakai saat epic produk diorkestrasi selesai |

Epic produk pertama yang dipakai sebagai bukti OR-14 dipilih saat development phase 0800 dijalankan. PRD-0800 tidak mengubah kode fitur itu.

## Dokumen terkait

- [0800_PRD_Orkestrasi_Stage_Development_phase.md](./0800_PRD_Orkestrasi_Stage_Development_phase.md)
- Skill peran: [.cursor/skills/agentic-orchestrator/SKILL.md](../../../.cursor/skills/agentic-orchestrator/SKILL.md), [agentic-implementer](../../../.cursor/skills/agentic-implementer/SKILL.md), [agentic-tester](../../../.cursor/skills/agentic-tester/SKILL.md), [agentic-auditor](../../../.cursor/skills/agentic-auditor/SKILL.md). Fase bersama: [.cursor/skills/agentic-stage/LOOP.md](../../../.cursor/skills/agentic-stage/LOOP.md)
- [docs/PRD/README.md](../README.md) — indeks tooling, terpisah dari prioritas produk
- [DEVELOPMENT-PHASES.md](../../invoicing/engineering/DEVELOPMENT-PHASES.md) — gate produk yang tidak diubah epic ini
- Contoh rencana yang di-parse: [0702_PRD_Live_Tracking_Development_phase.md](../0702-live-tracking/0702_PRD_Live_Tracking_Development_phase.md)

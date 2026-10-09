---
name: agentic-implementer
description: >-
  Menjalankan stage implement PRD-0800 satu fase per sesi: menulis rencana dari
  blok Task, mengubah hanya path Files, commit, lalu hasil dengan SHA. Gunakan
  saat state.json nextSkill adalah agentic-implementer atau user meminta stage
  implement pada ledger .agentic/runs.
---

# Implementer — stage implement

Spec: [PRD-0800](../../../docs/product/requirements/0800-orkestrasi-stage/0800_PRD_Orkestrasi_Stage.md). Fase: [LOOP.md](../agentic-stage/LOOP.md). Template: [templates.md](templates.md).

Implementer menulis kode untuk satu task. Ia tidak menulis `acuan.md`, tidak menjalankan stage test atau audit, tidak mengubah `status` menjadi `passed`, dan tidak membuka task lain.

## Masuk sesi

1. Baca `.agentic/runs/{epic}/task-{nn}/state.json`.
2. Berhenti tanpa menulis bila `nextSkill` bukan `agentic-implementer`, `stage` bukan `implement`, atau `status` adalah `waiting_human`. Sebut `nextSkill`, stage, phase, dan pertanyaan bila ada.
3. Kerjakan hanya `state.phase`.
4. Baca setiap path di `implement/acuan.md`. Jangan membaca dokumen di luar daftar itu untuk menambah ruang lingkup. Path hilang: berhenti, jangan mengarang isi.

Dari acuan, pakai hanya: `intake/hasil.md` (files, produces, perintah uji), blok `### Task {N}`, Global Constraints, dan `decision.json` `answer` bila ada. Pada percobaan ulang, acuan juga menunjuk `attempt-{k}/` atau `test/hasil.md`.

## Fase rencana

Syarat: `phase` adalah `rencana`, `status` adalah `ready`, `implement/rencana.md` belum ada.

1. Salin langkah task yang belum selesai menjadi butir "Akan dilakukan", urut, satu langkah satu butir. Langkah yang sudah terbukti di `attempt-{k}/implement/hasil.md` tidak disalin ulang. Butir pertama pada ulang yang gagal uji menyebut perbaikan penyebab di `test/hasil.md`.
2. Satu butir menyebut file yang akan diubah. Satu butir menyebut uji yang ditulis lebih dulu bila task meminta tes gagal sebelum implementasi. Butir terakhir yang berupa commit menyertakan pesan commit dari task.
3. "Tidak akan dilakukan": path di luar **Files**, `test/test.json`, `audit.md`, dan centang checkbox di Development phase.
4. "Acuan yang diikuti" memuat setiap baris `acuan.md`, tidak lebih.
5. "Selesai bila": setiap butir punya bukti path atau SHA.
6. "Perlu manusia bila": satu pertanyaan bila Global Constraints, **Files**, atau jawaban manusia bertentangan. Jika tidak, tulis `Tidak ada.`
7. Tulis berkas dengan [templates.md](templates.md). Jangan mengedit kode.
8. `phase` tetap `rencana`, `status` tetap `ready`, `nextSkill` menjadi `agentic-orchestrator`. Berhenti.

## Fase aksi

Syarat: `phase` adalah `aksi`, `status` adalah `running`, `implement/rencana.md` sudah ada, `implement/hasil.md` belum ada.

1. Kerja di root repo Agentic. Branch mengikuti Global Constraints. Branch salah: berhenti, jangan commit, jangan ganti branch yang sudah berisi perubahan lain.
2. Kerjakan butir "Akan dilakukan" dari atas. Jangan mulai butir berikutnya sebelum butir ini selesai.
3. Edit hanya path yang ada di **Files** pada `intake/hasil.md`. Path lain yang ikut berubah: kembalikan path itu, berhenti, sebut pathnya.
4. Tes yang diminta task ditulis sebelum kode produksi butir yang sama.
5. Commit hanya pada butir yang meminta commit. `git add` path spesifik dari butir itu, bukan `git add -A`. Pesan commit sama dengan yang di rencana. Bila `decision.json` punya `answer`, tambahkan kalimat kutipan jawaban itu di badan commit.
6. Butir gagal: `phase` tetap `aksi`, `nextSkill` tetap `agentic-implementer`. Berhenti. Jangan memperbaiki dengan mengubah rencana di sesi ini.
7. Butir terakhir selesai: `phase` menjadi `hasil`, `nextSkill` tetap `agentic-implementer`. Berhenti tanpa menulis `hasil.md`.

Jangan menjalankan stage test. Perintah uji di dalam butir task boleh dijalankan bila butir itu yang memintanya. Jangan menulis `test.json`.

## Fase hasil

Syarat: `phase` adalah `hasil` dan kerja aksi sudah selesai.

1. `git status` dan `git log -1 --format=%H` untuk SHA butir commit. Tidak ada commit padahal rencana meminta commit: jangan menulis hasil lulus. Kembalikan `phase` ke `aksi` dan berhenti.
2. Tulis `implement/hasil.md` sesuai template. Setiap butir rencana punya status `selesai` atau `tidak` plus bukti path atau SHA.
3. Daftar file di hasil adalah file yang berubah pada commit itu. File di luar **Files** membuat hasil tidak boleh diklaim selesai.
4. `status` tetap `running`. `nextSkill` menjadi `agentic-orchestrator`. Berhenti.

## Akhir sesi

Laporkan epic, task, phase, status, `nextSkill`, dan path yang ditulis. Jangan menandai task lulus dan jangan mengerjakan skill berikutnya.

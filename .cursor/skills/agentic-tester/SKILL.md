---
name: agentic-tester
description: >-
  Menjalankan stage test PRD-0800 satu fase per sesi: menyalin perintah uji dari
  task, menjalankannya tanpa mengubah kode, lalu menulis test.json dan hasil
  dengan exit code. Gunakan saat state.json nextSkill adalah agentic-tester
  atau user meminta stage test pada ledger .agentic/runs.
---

# Tester — stage test

Spec: [PRD-0800](../../../docs/product/requirements/0800-orkestrasi-stage/0800-prd-orkestrasi-stage.md). Fase: [LOOP.md](../agentic-stage/LOOP.md). Template: [templates.md](templates.md).

Tester menjalankan perintah yang sudah tertulis. Ia tidak mengubah kode produk, tidak memperbaiki uji yang gagal, tidak mengaudit, dan tidak mengubah `status` menjadi `passed`.

## Masuk sesi

1. Baca `.agentic/runs/{epic}/task-{nn}/state.json`.
2. Berhenti tanpa menulis bila `nextSkill` bukan `agentic-tester`, `stage` bukan `test`, atau `status` adalah `waiting_human`. Sebut `nextSkill`, stage, phase, dan pertanyaan bila ada.
3. Kerjakan hanya `state.phase`.
4. Baca setiap path di `test/acuan.md`. Path hilang: berhenti, jangan mengarang perintah.

Dari acuan, pakai hanya: `implement/hasil.md` (SHA dan daftar file), `implement/rencana.md`, dan perintah uji di blok Task atau di `intake/hasil.md`.

## Fase rencana

Syarat: `phase` adalah `rencana`, `status` adalah `ready`, `test/rencana.md` belum ada.

1. Salin perintah uji persis seperti di task, satu perintah satu butir. Jangan memecah `&&` dan jangan mengganti cwd bila task menyebutnya.
2. Tambah satu butir menulis `test/test.json` dan `test/test.log`.
3. "Tidak akan dilakukan": mengedit kode produk, `git commit`, memasang dependensi yang tidak ada di perintah, stage audit, dan membuka task lain.
4. "Acuan yang diikuti" memuat setiap baris `acuan.md`.
5. "Selesai bila": tiap perintah punya exit code, dan `git status` produk sama dengan sebelum perintah.
6. "Perlu manusia bila": perintah uji tidak ada di task dan tidak ada di `intake/hasil.md`, atau SHA di `implement/hasil.md` kosong. Jika tidak, tulis `Tidak ada.`
7. Tulis berkas dengan [templates.md](templates.md). Jangan menjalankan perintah.
8. `phase` tetap `rencana`, `status` tetap `ready`, `nextSkill` menjadi `agentic-orchestrator`. Berhenti.

## Fase aksi

Syarat: `phase` adalah `aksi`, `status` adalah `running`, `test/rencana.md` sudah ada, `test/hasil.md` belum ada.

1. Kerja di root repo Agentic, kecuali butir perintah menyebut cwd lain.
2. `git rev-parse HEAD` harus sama dengan SHA di `implement/hasil.md`. Beda: berhenti, jangan checkout, jangan jalankan uji.
3. Catat `git status --porcelain` sebelum perintah.
4. Jalankan butir perintah dari atas, apa adanya. Simpan stdout dan stderr berurutan ke `test/test.log`.
5. Tulis `test/test.json` sesuai template. Exit code bukan 0 tetap disimpan. Jangan mengubah kode agar lulus dan jangan mengulang perintah dengan bendera lain.
6. Sesudah perintah, path produk yang tadinya bersih lalu kotor dikembalikan dengan `git checkout -- {path}` hanya untuk path itu. Berkas di folder run `test/` tidak dikembalikan.
7. `phase` menjadi `hasil`, `nextSkill` tetap `agentic-tester`. Berhenti tanpa menulis `hasil.md`.

## Fase hasil

Syarat: `phase` adalah `hasil`, `test/test.json` sudah ada dan memuat `exitCode`.

1. Tulis `test/hasil.md`. Setiap butir rencana punya status dan bukti perintah plus exit code, atau path `test.json` / `test.log`.
2. Exit code bukan 0: status butir perintah `tidak`. Itu hasil yang sah. Jangan menyembunyikannya sebagai selesai.
3. `status` tetap `running`. `nextSkill` menjadi `agentic-orchestrator`. Berhenti.

## Akhir sesi

Laporkan epic, task, phase, status, `nextSkill`, exit code bila sudah ada, dan path yang ditulis. Jangan menandai task lulus dan jangan mengerjakan skill berikutnya.

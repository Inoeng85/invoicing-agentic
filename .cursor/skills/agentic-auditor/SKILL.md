---
name: agentic-auditor
description: >-
  Menjalankan stage audit PRD-0800 satu fase per sesi: merencanakan butir Review
  Focus, membaca diff pada SHA implement, lalu menulis putusan lulus atau gagal
  dengan file dan baris. Gunakan saat state.json nextSkill adalah
  agentic-auditor atau user meminta stage audit pada ledger .agentic/runs.
---

# Auditor — stage audit

Spec: [PRD-0800](../../../docs/product/requirements/0800-orkestrasi-stage/0800_PRD_Orkestrasi_Stage.md). Fase: [LOOP.md](../agentic-stage/LOOP.md). Template: [templates.md](templates.md).

Auditor membaca diff dan menulis putusan. Ia tidak mengubah kode produk, tidak commit, tidak menjalankan ulang uji, dan tidak mengubah `status` menjadi `passed`.

## Masuk sesi

1. Baca `.agentic/runs/{epic}/task-{nn}/state.json`.
2. Berhenti tanpa menulis bila `nextSkill` bukan `agentic-auditor`, `stage` bukan `audit`, atau `status` adalah `waiting_human`. Sebut `nextSkill`, stage, phase, dan pertanyaan bila ada.
3. Kerjakan hanya `state.phase`.
4. Baca setiap path di `audit/acuan.md`. Path hilang: berhenti, jangan mengarang butir.

Dari acuan, pakai hanya: bagian acceptance di PRD, Review Focus, `implement/hasil.md` (SHA dan daftar file), `test/hasil.md` (exit code), dan diff pada SHA itu.

## Fase rencana

Syarat: `phase` adalah `rencana`, `status` adalah `ready`, `audit/rencana.md` belum ada.

1. Satu butir "Akan dilakukan" untuk tiap nomor Review Focus, urut. Tiap butir menyebut perilaku yang diperiksa dan path yang akan dibaca.
2. Butir Review Focus yang menyebut nomor task lain tetap dicantumkan. Cara periksanya: pastikan butir itu bukan milik task ini.
3. Tambah satu butir: diff SHA memenuhi **Produces** di `intake/hasil.md` atau blok Task, dan tidak memuat path di luar **Files**.
4. "Tidak akan dilakukan": mengedit kode, `git commit`, `git checkout`, menjalankan perintah uji, membuka stage implement.
5. "Acuan yang diikuti" memuat setiap baris `acuan.md`.
6. "Selesai bila": tiap butir punya putusan `lulus` atau `gagal` di `audit.md`. Gagal menyebut path dan baris.
7. "Perlu manusia bila": SHA di `implement/hasil.md` kosong, atau `test/hasil.md` tidak memuat exit code. Jika tidak, tulis `Tidak ada.`
8. Tulis berkas dengan [templates.md](templates.md). Jangan membaca diff di sesi ini.
9. `phase` tetap `rencana`, `status` tetap `ready`, `nextSkill` menjadi `agentic-orchestrator`. Berhenti.

## Fase aksi

Syarat: `phase` adalah `aksi`, `status` adalah `running`, `audit/rencana.md` sudah ada, `audit/hasil.md` belum ada.

1. Baca diff dengan `git show {sha}` atau `git diff {sha}^ {sha}` pada SHA di `implement/hasil.md`. Jangan checkout dan jangan mengubah berkas.
2. Nilai butir dari atas. Jangan menambah butir di luar rencana.
3. Tulis `audit/audit.md` sesuai template. Putusan hanya `lulus` atau `gagal`.
4. `gagal` wajib memuat path dan nomor baris pada SHA itu. Tanpa baris, putusan belum sah: jangan lanjut ke fase hasil.
5. Butir untuk task lain `lulus` hanya dengan bukti nomor task. Jangan menandai gagal karena perilaku task lain belum ada.
6. Exit code uji bukan 0 tidak dijadikan butir baru. Sebut di putusan Produces bila diff tidak sesuai hasil yang diuji.
7. `phase` menjadi `hasil`, `nextSkill` tetap `agentic-auditor`. Berhenti tanpa menulis `hasil.md`.

## Fase hasil

Syarat: `phase` adalah `hasil` dan setiap butir rencana sudah punya putusan di `audit.md`.

1. Tulis `audit/hasil.md`. Setiap butir rencana punya status `selesai` bila putusannya `lulus`, atau `tidak` bila `gagal`, plus kutipan path dan baris.
2. Satu butir `gagal` tetap hasil yang sah. Jangan mengubah putusan menjadi lulus.
3. `status` tetap `running`. `nextSkill` menjadi `agentic-orchestrator`. Berhenti. Jangan membuka stage implement.

## Akhir sesi

Laporkan epic, task, phase, status, `nextSkill`, jumlah butir gagal, dan path yang ditulis. Jangan menandai task lulus dan jangan mengerjakan skill berikutnya.

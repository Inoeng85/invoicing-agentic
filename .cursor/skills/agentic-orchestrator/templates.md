# Template ledger orchestrator

## state.json

```json
{
  "epic": "0702",
  "task": "01",
  "taskTitle": "Schema + migration",
  "stage": "intake",
  "phase": "acuan",
  "status": "ready",
  "nextSkill": "agentic-orchestrator",
  "testAttempts": 0,
  "policySource": "default",
  "reviewFocus": false,
  "firstTask": true,
  "waiting": null
}
```

`status`: `ready` | `running` | `waiting_human` | `passed` | `failed`.

Saat menahan manusia, `waiting` = `{ "stage": "intake", "question": "…" }` dan `decision.json` di folder task punya `answer` kosong.

## decision.json

```json
{
  "by": "human",
  "stage": "intake",
  "question": "Apakah shadow database sementara diterima untuk migration ini?",
  "options": [],
  "answer": null,
  "next": null
}
```

`next`, bila accept selesai: `next-task` | `retry` | `wait-human`. `by` pada keputusan agent = `agent`.

## acuan.md

```markdown
# Acuan — {stage} — {epic} task {nn}

| # | Path | Bagian | Dipakai untuk |
|---|------|--------|----------------|
| 1 | docs/product/requirements/{folder}/{file}.md | {heading} | {satu kalimat} |
```

Baris wajib per stage. Ganti path dengan file epic yang sedang dijalankan. Lewati baris "jawaban manusia" bila `decision.json` tidak punya `answer`.

**intake**

| Path | Bagian | Dipakai untuk |
|------|--------|----------------|
| PRD spec epic | heading requirement task ini | batas perilaku |
| Development phase | Goal | hasil yang terlihat pengguna |
| Development phase | Architecture | lapisan yang boleh disentuh |
| Development phase | Global Constraints | perintah, branch, larangan |
| Development phase | Review Focus | risiko yang membuat task ini human atau tidak |
| Development phase | Task {N} saja | Files, Produces, langkah, perintah uji |
| `.agentic/policy/{epic}.yaml` atau PRD-0800 bagian Policy default | transisi intake→implement | pelaku stage berikutnya |

**implement**

| Path | Bagian | Dipakai untuk |
|------|--------|----------------|
| `intake/rencana.md` | Akan dilakukan | ruang lingkup yang dikunci |
| `intake/hasil.md` | seluruh | files, produces, perintah uji |
| Development phase | Task {N} | Files dan langkah |
| Development phase | Global Constraints | larangan implementasi |
| `decision.json` | answer | klarifikasi manusia, bila ada |
| `attempt-{k}/implement/hasil.md` atau `test/hasil.md` | seluruh | penyebab ulang, bila ada |

**test**

| Path | Bagian | Dipakai untuk |
|------|--------|----------------|
| `implement/rencana.md` | Akan dilakukan | apa yang dijanjikan |
| `implement/hasil.md` | SHA dan daftar file | commit yang diuji |
| Development phase | Task {N} | perintah uji persis |

**audit**

| Path | Bagian | Dipakai untuk |
|------|--------|----------------|
| PRD spec | acceptance task ini | perilaku yang harus ada |
| Development phase | Review Focus | butir putusan |
| `implement/hasil.md` | SHA | diff yang diperiksa |
| `test/hasil.md` | exit code | bukti uji |

**accept**

| Path | Bagian | Dipakai untuk |
|------|--------|----------------|
| `intake/hasil.md` | seluruh | ruang lingkup |
| `implement/hasil.md` | seluruh | bukti kode |
| `test/hasil.md` | seluruh | bukti uji |
| `audit/hasil.md` | seluruh | putusan |
| policy atau Policy default | accept→task berikutnya | agent atau human |

## rencana.md

```markdown
# Rencana — {stage} — {epic} task {nn}

## Akan dilakukan

- [ ] {satu butir yang bisa dicek, belum terjadi}

## Tidak akan dilakukan

- {di luar stage atau di luar Files}

## Acuan yang diikuti

- {path} — {bagian} — {dipakai untuk}

## Selesai bila

- {kondisi terukur}

## Perlu manusia bila

Tidak ada.
```

"Acuan yang diikuti" memuat setiap baris `acuan.md`, tidak lebih.

## hasil.md

```markdown
# Hasil — {stage} — {epic} task {nn}

| Butir rencana | Status | Bukti |
|---------------|--------|-------|
| {teks butir} | selesai | {path, SHA, exit code, atau kutipan} |
```

## intake.json

```json
{
  "epic": "0702",
  "task": "01",
  "title": "Schema + migration",
  "files": ["packages/database/prisma/schema.prisma"],
  "produces": ["Client.latitude"],
  "verify": "npm run typecheck && npm run test:domain && npm test",
  "openQuestions": []
}
```

## policy yaml

Hanya bila user meminta berkas policy ditulis. Jangan menimpa berkas yang sudah ada.

```yaml
transitions:
  intake_to_implement: human
  implement_to_test: agent
  test_fail_to_implement: agent
  test_pass_to_audit: agent
  audit_fail_to_implement: human
  accept_to_next: human
```

Task di Review Focus boleh menimpa `intake_to_implement` dan `accept_to_next` menjadi `human` lewat kunci `tasks.{nn}`.

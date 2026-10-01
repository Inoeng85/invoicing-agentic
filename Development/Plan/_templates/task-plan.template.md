# Plan task — {{TASK_ID}}

| Field | Nilai |
|-------|-------|
| **Task ID** | {{TASK_ID}} |
| **Task** | {{TASK_TITLE}} |
| **Phase** | {{EPIC}} / phase-{{PHASE_NN}} |
| **Status plan** | `draft` · `defined` · `needs_human_clarify` |

## Penjelasan

<!-- Apa yang diminta PRD / Development phase untuk task ini; tanpa asumsi baru. -->

## Tujuan

<!-- Hasil yang dapat diverifikasi; taut ke Produces / acceptance. -->

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `{{FEATURE_ID}}` | [agentic/development/features/{{FEATURE_ID}}.md](../../../agentic/development/features/{{FEATURE_ID}}.md) |

<!-- Agent Plan wajib buat/maintain feature doc: semua path file untuk 1 session Development. -->

## Development

| Status | `pending` · `in_progress` · `complete` |
| Laporan | — |
| Commit/PR | — |

<!-- Agent Development mengisi section ini + link laporan saat task selesai. -->

## QA

| Status | `pending` · `in_progress` · `pass` · `fail` · `needs_clarify` |
| Laporan | — |
| Fix dalam session | — |

<!-- Agent QA: uji terkecil dari skills/qa.md; boleh fix dalam feature doc; update saat selesai. -->

## Skill yang digunakan

Setiap skill **wajib** punya dokumen terpisah di folder `skills/` task ini (lihat template di `agentic/skill/feature/`).

| Skill | File plan | Agent eksekutor |
|-------|-----------|-----------------|
| Backend | [skills/backend.md](./skills/backend.md) | Agent Development |
| Frontend | [skills/frontend.md](./skills/frontend.md) | Agent Development |
| QA | [skills/qa.md](./skills/qa.md) | Agent QA (verifikasi) + Development (uji lokal) |
| Infra | [skills/infra.md](./skills/infra.md) | Agent Development |
| Docs | [skills/docs.md](./skills/docs.md) | Agent Development |

Hapus baris skill yang tidak dipakai. Tambah baris hanya jika Plan mendokumentasikan skill baru di `agentic/skill/feature/`.

## Acuan PRD

- Development phase: `{{DEV_PHASE_PATH}}`
- Task heading: `### Task {{N}}: …`
- **Files:** (salin atau ringkas dari PRD)
- **Produces:** (salin atau ringkas dari PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md` dengan langkah dan definisi selesai
- [ ] Agent Development dapat mulai tanpa bertanya ulang ke PRD

## Ambigu / Human Clarify

<!-- Isi bila status `needs_human_clarify`: pertanyaan, opsi, path decision. Kosongkan bila defined. -->

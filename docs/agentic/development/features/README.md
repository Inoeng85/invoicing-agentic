# Feature — dokumen Agent Development

Satu **feature** = satu **session** agent. Feature mengelompokkan semua file yang disentuh (backend, frontend, docs, infra) untuk satu cakupan produk yang koheren.

| Artefak | Path |
|---------|------|
| Definisi feature | `docs/agentic/development/features/{feature-id}.md` |
| Plan task | `docs/development/Plan/{epic}/phase-{nn}/tasks/{task-id}/plan.md` |
| Laporan dev | `docs/development/Result/{epic}/phase-{nn}/development/{task-id}.md` |

**Aturan session**

1. Satu session hanya **satu feature** + **satu task** (task id dari plan).
2. Baca plan task lengkap sebelum edit kode.
3. Hanya ubah path yang tercantum di feature doc dan **Files** task PRD.
4. Selesai session: tulis laporan + update section **Development** di `plan.md` task.

Template: [FEATURE.template.md](FEATURE.template.md).

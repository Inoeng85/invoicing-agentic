# Laporan audit phase — {epic} phase-{nn}

| Field | Nilai |
|-------|-------|
| Phase ID | {phase-id} |
| Epic | {epic} |
| Task dalam phase | {task-ids} |
| **Hasil** | `pass` · `fail` · `needs_clarify` |
| Commit lokal | `{git-sha}` · `{commit-message}` |
| Selesai | {ISO-8601} |

## Ringkasan

(1–3 paragraf: apakah phase siap Human QA.)

## Code review

| Task | Temuan | Severity |
|------|--------|----------|
| {task-id} | … | low/med/high |

## Uji backend

```bash
# perintah
```

- Exit code: …
- Catatan: …

## Uji web (frontend)

```bash
# perintah
```

- Exit code: …
- Catatan: …

## Integration & lainnya

```bash
# gate / smoke / e2e
```

- Exit code: …
- Catatan: …

## Update dokumen

| Dokumen | Path | Diupdate |
|---------|------|----------|
| Plan audit | docs/workflow/plans/.../audit.md | ya/tidak |
| PRD development phase | … | ya/tidak |
| PRD epic | … | ya/tidak |

## Human Clarify (jika needs_clarify)

- Pertanyaan: …
- Blokir: …

## Keputusan

- [ ] Phase siap **Human QA**
- [ ] Perlu **Human Clarify**
- [ ] Perlu kembali **Development** / **QA** (jelaskan task)

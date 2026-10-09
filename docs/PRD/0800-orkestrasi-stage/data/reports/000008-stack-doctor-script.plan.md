# Plan task — 000008-stack-doctor-script

| Field | Nilai |
|-------|-------|
| **Task ID** | 000008-stack-doctor-script |
| **Task** | stack doctor script |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

stack doctor script (PRD epic 0000).

- Buat `scripts/doctor.ts`.
- Cek: versi Node, satu lockfile, `.env` ada, env wajib (pakai modul 000001-be), DB reachable, port 44100/44101 bebas.
- Output PASS/FAIL per cek; exit ≠ 0 bila ada FAIL.
- Tautkan dari troubleshooting runbook.

## Tujuan

matikan DB / ubah Node → doctor FAIL dengan pesan tepat.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-platform-stack` | [docs/agentic/development/features/0000-platform-stack.md](../../../../agentic/development/features/0000-platform-stack.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Docs | [skills/docs.md](../../../../development/Plan/0000/phase-02/tasks/000008-stack-doctor-script/skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-19
- **Verifikasi:** matikan DB / ubah Node → doctor FAIL dengan pesan tepat.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

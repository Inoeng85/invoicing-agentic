# Plan task — 000001-infra-github-repo-protection

| Field | Nilai |
|-------|-------|
| **Task ID** | 000001-infra-github-repo-protection |
| **Task** | infra github repo protection |
| **Phase** | 0000 / phase-01 (0000-P1) |
| **Status plan** | `defined` |

## Penjelasan

infra github repo protection (PRD epic 0000).

- Aktifkan branch protection `main`: PR wajib, 1 approval (self-review OK untuk solo), larang force push.
- Wajibkan status check CI (diaktifkan setelah 000003-infra hijau pertama kali).
- Set default merge = squash.

## Tujuan

push langsung ke `main` ditolak.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-github-repo-protection` | [agentic/development/features/0000-infra-github-repo-protection.md](../../../../../../agentic/development/features/0000-infra-github-repo-protection.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](./skills/infra.md) |
| Docs | [skills/docs.md](./skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-05 (branch protection)
- **Verifikasi:** push langsung ke `main` ditolak.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

# Plan task — 000012-infra-rollback

| Field | Nilai |
|-------|-------|
| **Task ID** | 000012-infra-rollback |
| **Task** | infra rollback |
| **Phase** | 0000 / phase-03 (0000-P3) |
| **Status plan** | `defined` |

## Penjelasan

infra rollback (PRD epic 0000).

- Mekanisme redeploy build/release sebelumnya di host.
- Kebijakan migrasi: forward-only; rollback schema hanya bila `down` aman dan terdokumentasi.
- Uji rollback satu kali di staging.

## Tujuan

rollback staging kembali ke versi sebelumnya dan health ready.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-rollback` | [docs/workflow/features/0000-infra-rollback.md](../../../../../features/0000-infra-rollback.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-30
- **Verifikasi:** rollback staging kembali ke versi sebelumnya dan health ready.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

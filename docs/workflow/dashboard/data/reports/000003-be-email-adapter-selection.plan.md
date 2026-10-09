# Plan task — 000003-be-email-adapter-selection

| Field | Nilai |
|-------|-------|
| **Task ID** | 000003-be-email-adapter-selection |
| **Task** | be email adapter selection |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

be email adapter selection (PRD epic 0000).

- Saat boot, baca `EMAIL_PROVIDER` (`log` | `resend`).
- `log`: pertahankan adapter default.
- `resend`: daftarkan adapter via `setEmailSender` memakai `EMAIL_API_KEY`, `EMAIL_FROM`.
- Jangan mengubah `sendInvoice` atau alur kirim.

## Tujuan

local/CI tetap log · staging dengan `resend` mengirim email uji.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-be-email-adapter-selection` | [docs/workflow/features/0000-be-email-adapter-selection.md](../../../features/0000-be-email-adapter-selection.md) |

## Development

| Status | `pending` |

## QA

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Backend | [skills/backend.md](../../../plans/0000/phase-02/tasks/000003-be-email-adapter-selection/skills/backend.md) |
| QA | [skills/qa.md](../../../plans/0000/phase-02/tasks/000003-be-email-adapter-selection/skills/qa.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-40
- **Verifikasi:** local/CI tetap log · staging dengan `resend` mengirim email uji.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

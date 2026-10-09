# Plan task — 000008-infra-email-provider-staging

| Field | Nilai |
|-------|-------|
| **Task ID** | 000008-infra-email-provider-staging |
| **Task** | infra email provider staging |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

infra email provider staging (PRD epic 0000).

- Buat akun/workspace Resend; API key staging terpisah.
- Set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` di secret staging.
- Batasi penerima ke allowlist QA (fitur provider atau domain uji).

## Tujuan

kirim invoice demo di staging → email tiba di inbox QA; alamat di luar allowlist tidak menerima.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-email-provider-staging` | [docs/workflow/features/0000-infra-email-provider-staging.md](../../../../../features/0000-infra-email-provider-staging.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-38, PS-39 (staging)
- **Verifikasi:** kirim invoice demo di staging → email tiba di inbox QA; alamat di luar allowlist tidak menerima.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

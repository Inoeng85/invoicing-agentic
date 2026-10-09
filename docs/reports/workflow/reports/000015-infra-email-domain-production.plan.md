# Plan task — 000015-infra-email-domain-production

| Field | Nilai |
|-------|-------|
| **Task ID** | 000015-infra-email-domain-production |
| **Task** | infra email domain production |
| **Phase** | 0000 / phase-03 (0000-P3) |
| **Status plan** | `defined` |

## Penjelasan

infra email domain production (PRD epic 0000).

- Tambahkan DNS SPF, DKIM, DMARC untuk domain pengirim.
- Verifikasi domain di Resend; API key production terpisah.
- Set `EMAIL_FROM` production ke domain terverifikasi.

## Tujuan

email uji production lolos SPF/DKIM (cek header) dan tidak masuk spam.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-email-domain-production` | [docs/workflow/features/0000-infra-email-domain-production.md](../../../workflow/features/0000-infra-email-domain-production.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](../../../workflow/plans/0000/phase-03/tasks/000015-infra-email-domain-production/skills/infra.md) |
| Docs | [skills/docs.md](../../../workflow/plans/0000/phase-03/tasks/000015-infra-email-domain-production/skills/docs.md) |

## Acuan PRD

- Development phase: `docs/product/requirements/0000-platform-setup/prd-platform-setup-development-phase.md`
- **Produces:** PS-39 (prod)
- **Verifikasi:** email uji production lolos SPF/DKIM (cek header) dan tidak masuk spam.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

# Plan task — 000006-infra-domain-tls-cors

| Field | Nilai |
|-------|-------|
| **Task ID** | 000006-infra-domain-tls-cors |
| **Task** | infra domain tls cors |
| **Phase** | 0000 / phase-02 (0000-P2) |
| **Status plan** | `defined` |

## Penjelasan

infra domain tls cors (PRD epic 0000).

- Tetapkan domain staging web dan API (sesuai ADR-0003).
- Aktifkan TLS (host atau reverse proxy).
- Set `APP_URL` = URL web HTTPS; `CORS_ORIGIN` = origin web.

## Tujuan

`https://<staging-web>/i/:token` dari email uji bisa dibuka · request web → API lolos CORS.

## Feature

| Feature ID | Dokumen |
|------------|---------|
| `0000-infra-domain-tls-cors` | [docs/agentic/development/features/0000-infra-domain-tls-cors.md](../../../../../../agentic/development/features/0000-infra-domain-tls-cors.md) |

## Development

| Status | `pending` |

## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
| Infra | [skills/infra.md](skills/infra.md) |
| Docs | [skills/docs.md](skills/docs.md) |

## Acuan PRD

- Development phase: `docs/0000_platform_setup/PRD_platform_setup_development_phase.md`
- **Produces:** PS-31
- **Verifikasi:** `https://<staging-web>/i/:token` dari email uji bisa dibuka · request web → API lolos CORS.
- **Files:**
— (lihat Development phase / Tahapan di PRD)

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa `[TBD]`
- [ ] Setiap skill aktif punya file `skills/{skill}.md`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—

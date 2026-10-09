# ADR-0002 — Host staging & production

| Status | Accepted |
|--------|----------|
| Tanggal | 2026-09-30 |
| Konteks | Q-02 · PS-27 |

## Keputusan

**Railway** sebagai host awal (tim kecil, Postgres managed + secret store + TLS).

Alternatif setara: Fly.io — dokumentasi deploy tetap generic Node 24.

## Konsekuensi

- Dua service: `@invoicing/web` dan `@invoicing/api`.
- Secret disuntikkan runtime (bukan image).
- Runbook: [RUNBOOK-STAGING.md](../../operations/RUNBOOK-STAGING.md).

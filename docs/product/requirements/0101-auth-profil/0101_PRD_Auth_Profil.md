# PRD-0101 — Auth & Profil Bisnis

| Meta | Nilai |
|------|-------|
| ID | **0101** |
| Prioritas dev | **2** |
| Gate | **G1** |
| Development phase | [0101_PRD_Auth_Profil_Development_phase.md](0101_PRD_Auth_Profil_Development_phase.md) |
| FR | (prasyarat FR-01–08) auth + profil |

## Latar belakang

Pengguna UMKM perlu akun terpisah, session aman, dan profil bisnis (nama, logo, rekening, footer) untuk invoice dan PDF.

## Tujuan

| ID | Tujuan | Ukuran keberhasilan |
|----|--------|---------------------|
| T-01 | Registrasi & login | User + `BusinessProfile` terbuat saat register |
| T-02 | Session | Cookie web + Bearer API; endpoint terproteksi → 401 tanpa session |
| T-03 | Settings | `/settings` update profil persist |

## Scope (in)

- Register / login (API + web)
- Password hashing (scrypt)
- Session signed token
- Halaman `/login`, `/register`, dashboard require auth
- Profil bisnis: fields selaras ARCHITECTURE & PDF (logo URL, bank, dll.)

## Scope (out)

- Multi-user / RBAC
- OAuth social login

## Acceptance criteria

| ID | Kriteria |
|----|----------|
| AC-01 | Gate G1.1: register 200 + profile 200 |
| AC-02 | Manual G1.2: login web → dashboard |
| AC-03 | Manual G1.3: update `/settings` persist |
| AC-04 | FR-10 partial: default due +30 hari & footer default (jika di scope settings) |

## Business rules

- Satu user = satu business profile (MVP)
- Session expiry & secret dari env (`SESSION_SECRET`, PRD-0000)

## Dependensi

- **0100** G0

## Referensi

- [USER-STORIES-UAT.md](../../brd/USER-STORIES-UAT.md)
- [WIREFRAMES.md](../../brd/WIREFRAMES.md) (auth/settings)

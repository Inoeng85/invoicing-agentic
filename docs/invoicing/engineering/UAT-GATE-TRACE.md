# UAT ↔ Gate traceability (Phase 6)

Sumber UAT: [USER-STORIES-UAT.md](../brd/USER-STORIES-UAT.md)  
Otomatis: `npm run gate` · `npm run test:domain`

| UAT / FR | Otomatis | Manual (web) |
|----------|----------|--------------|
| US-01 / G1 | Gate Phase 1 register + profile API | US-01-1…3 login web, duplikat, password |
| US-02 / G1 | — | US-02-1 profil `/settings` |
| US-03 / FR-01 | Gate Phase 2 client CRUD API | US-03-1…4 picker, nonaktif |
| US-04–05 / FR-02–03 | Gate Phase 3 draft + PPN | US-04 multi-line, US-05 toggle UI |
| US-06 / BR-01–02 | Gate Phase 6 cancel (API) | US-06 edit draft locked UI |
| FR-04 PDF | Gate Phase 4 PDF 200 | Preview layout |
| FR-05 send | Gate Phase 4 send | Email inbox (staging Resend) |
| FR-06 public | Gate Phase 4 + revoke 404 | `/i/:token` read-only |
| BR-05 revoke | Gate Phase 6 revoke | Tombol cabut link |
| FR-07 paid | Gate Phase 5 mark paid | — |
| FR-08 dashboard | Gate Phase 5 dashboard | Filter status UI |

**Demo seed (staging UAT):** `dewi.kartika@studio-kartika.demo` / `DemoStudio123!` (`npm run db:seed`).

**Sign-off UAT:** centang manual di USER-STORIES-UAT setelah staging web tersedia (PG-2).

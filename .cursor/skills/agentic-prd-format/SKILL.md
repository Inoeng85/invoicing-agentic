---
name: agentic-prd-format
description: >-
  Menulis, memformat, atau merevisi PRD produk di docs/PRD/ dan development phase
  platform di docs/0000_platform_setup/PRD_platform_setup_development_phase.md
  untuk monorepo Agentic (PuraPuraLupa). Gunakan saat user minta PRD baru, task
  development phase, PS-xx, PG-x gate, atau selaraskan indeks docs/PRD/README.md.
---

# Skill — Format PRD Agentic

## Kapan dipakai

- Buat atau rapikan **PRD fitur** di `docs/PRD/{xxyy-slug}/`
- Buat atau rapikan **Development phase** (task + gate) untuk fitur
- Buat atau rapikan **platform setup** (PRD-0000, PS-xx, PG-0…PG-3)
- Tambah baris di `docs/PRD/README.md` setelah epic baru

## Lokasi canonical

| Jenis | PRD ringkas | Development phase penuh |
|-------|-------------|-------------------------|
| **Platform** | `docs/PRD/0000-platform-setup/0000_PRD_Platform_Setup.md` | **`docs/0000_platform_setup/PRD_platform_setup_development_phase.md`** (canonical) |
| | `docs/0000_platform_setup/prd_platform_setup.md` (PS, milestone §7) | Mirror ringkas: `docs/PRD/0000-platform-setup/0000_PRD_Platform_Setup_Development_phase.md` |
| **Fitur produk** | `docs/PRD/{folder}/{xxyy}_PRD_{Nama}.md` | `{xxyy}_PRD_{Nama}_Development_phase.md` (folder sama) |

**Aturan mirror platform:** detail task per baris hanya di `0000_platform_setup/PRD_platform_setup_development_phase.md`. File di `docs/PRD/0000-platform-setup/` = ringkasan + link ke canonical — jangan fork task list.

## Konvensi ID & penamaan

| Unsur | Pola | Contoh |
|-------|------|--------|
| Epic ID | `XXYY` — `XX` epic, `YY` sub (00 = induk) | `0700`, `0701` |
| Folder | `{xxyy-kebab-case}` | `0701-foto-kolektor` |
| File PRD | `{xxyy}_PRD_{PascalOrSnake}.md` | `0701_PRD_Foto_Kolektor.md` |
| File dev phase | `{xxyy}_PRD_{Nama}_Development_phase.md` | suffix **`Development_phase`** (huruf D besar) |
| Requirement fitur | `FR-xx`, sub `FR-xx-n` | `FR-14h-1` |
| Requirement platform | `PS-xx` | `PS-23` |
| Gate produk | `G0`…`G7` | `npm run gate` Phase N |
| Gate platform | `PG-0`…`PG-3` | M0…M3 |
| Task fitur | `{xxyy}{nn}-{area}-{slug}` | `010004-be-health-live` |
| Task platform | `{xxxx}{yy}-{kanonik}-{slug}` | `000006-stack-verify-script` |

**Kanonik platform (task):** `stack` · `db` · `be` · `fe` · `infra` · `docs` — `yy` dihitung **per kanonik**, bukan global.

**Area task fitur (umum):** `stack` · `db` · `domain` · `be` · `fe` · `infra` · `docs`

## Workflow: PRD fitur baru

1. Tentukan ID berikutnya dari [docs/PRD/README.md](../../docs/PRD/README.md) (Pri, Depends, Gate).
2. Salin [template-prd-feature.md.tmpl](./template-prd-feature.md.tmpl) → folder epic.
3. Isi meta, FR/BR, keputusan `D-xx`, acceptance, desain (data/domain/web/API).
4. Cross-link wajib: [MVP-SCOPE-LOCK.md](../../docs/invoicing/brd/MVP-SCOPE-LOCK.md), [ARCHITECTURE-ALIGNMENT §3](../../docs/invoicing/brd/ARCHITECTURE-ALIGNMENT.md), gate di [DEVELOPMENT-PHASES.md](../../docs/invoicing/engineering/DEVELOPMENT-PHASES.md).
5. Brand UI: **PuraPuraLupa (Komando)** — npm tetap `@invoicing/*`.
6. Tambah baris tabel di `docs/PRD/README.md`.
7. Jika FR/BR baru: update `MVP-SCOPE-LOCK.md` + alignment §3–§4 (user/product approval implied).

## Workflow: Development phase fitur

Pilih **satu** gaya (jangan campur struktur dalam satu file):

### Gaya A — Ringkas (gate & urutan)

Untuk epic kecil atau fase awal (contoh: `0100_PRD_Foundation_Development_phase.md`).

Salin [template-dev-phase-compact.md.tmpl](./template-dev-phase-compact.md.tmpl):

- Meta (ID, Gate, prefix task)
- Tabel task → output
- Urutan eksekusi (satu baris `→`)
- Gate pass criteria (tabel Check | Metode | Pass jika)
- Definition of Done (checkbox)
- Bloker (depends PG / PRD lain)

### Gaya B — Agentic implementation plan

Untuk eksekusi agent step-by-step (contoh: `0701_PRD_Foto_Kolektor_Development_phase.md`).

Salin [template-dev-phase-agentic.md.tmpl](./template-dev-phase-agentic.md.tmpl):

- Blok `> For agentic workers:` + sub-skill jika dipakai tim
- **Goal**, **Architecture**, **Tech Stack**, link **Spec**
- **Global Constraints** (branch, Node, verify command, commit policy)
- **Review Focus** (5 bullet risiko)
- **Task N:** `**Files:**` · `**Produces:**` · checklist `- [ ]` · snippet kode opsional · commit message contoh

Aturan task agentic:

- TDD: test/checkbox **before** implement bila relevan
- Satu task ≈ satu commit conventional (`feat(domain): …`, `docs(prd): …`)
- Verifikasi akhir task: `npm run test:domain`, `npm run typecheck`, `npm test`, atau `npm run gate` sesuai scope

## Workflow: Platform PRD & development phase

1. Requirement baru → tambah **PS-xx** di `docs/0000_platform_setup/prd_platform_setup.md` (§3+) dan pemetaan §7.2.
2. Task baru → tambah di **`PRD_platform_setup_development_phase.md`** mengikuti [reference-platform-task.md](./reference-platform-task.md).
3. Update **Ringkasan fase**, **Urutan eksekusi canonical**, **Pemetaan baseline B-xx → task**, **Matriks task ↔ PS** (§ akhir).
4. Sinkronkan versi meta di mirror `docs/PRD/0000-platform-setup/` (versi + status PG, bukan duplikasi task).
5. Urutan canonical Phase 0–3 **harus identik** antara `prd_platform_setup.md` §7.1 dan development phase — ubah keduanya jika reorder.

## Aturan penulisan (semua PRD)

- **Bahasa:** Indonesia; ID requirement tetap `FR-`, `BR-`, `PS-`, `G-`, `PG-`, `D-`
- **Heading H1:** `# PRD-{ID} — {Judul}` · platform dev phase: `# PRD-0000 — Platform Setup · Development Phase`
- **Meta:** tabel `| Meta | Nilai |` di bawah H1 (versi, gate, link sibling doc)
- **Status task platform:** `Done` · `Done*` · `Partial` · `Todo` · catatan `push ⏳` / verifikasi tanggal
- **Tidak** masukkan secret, token, atau `.env` nyata
- Scope platform PRD: **tanpa** fitur FR invoice/kolektor kecuali hanya menyebut dependensi ke PRD produk

## Checklist sebelum selesai

- [ ] Path folder & nama file sesuai konvensi `XXYY`
- [ ] PRD ↔ Development phase saling link di meta
- [ ] `docs/PRD/README.md` updated (Pri, Gate, Depends)
- [ ] FR/BR/PS traceable ke MVP-SCOPE-LOCK atau prd_platform_setup
- [ ] Gate pass criteria jelas (command + exit 0 / status HTTP)
- [ ] Platform: task ID unik; PS mapping ada di matriks akhir
- [ ] Tidak duplikasi canonical platform task list di folder `docs/PRD/0000-platform-setup/`

## Referensi

- Indeks: [docs/PRD/README.md](../../docs/PRD/README.md)
- Contoh PRD fitur: [0701_PRD_Foto_Kolektor.md](../../docs/PRD/0701-foto-kolektor/0701_PRD_Foto_Kolektor.md)
- Contoh dev phase agentic: [0701_PRD_Foto_Kolektor_Development_phase.md](../../docs/PRD/0701-foto-kolektor/0701_PRD_Foto_Kolektor_Development_phase.md)
- Contoh dev phase ringkas: [0100_PRD_Foundation_Development_phase.md](../../docs/PRD/0100-foundation/0100_PRD_Foundation_Development_phase.md)
- Platform canonical: [PRD_platform_setup_development_phase.md](../../docs/0000_platform_setup/PRD_platform_setup_development_phase.md)
- Template platform task: [reference-platform-task.md](./reference-platform-task.md)

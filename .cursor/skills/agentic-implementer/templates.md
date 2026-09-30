# Template implementer

## rencana.md

```markdown
# Rencana — implement — {epic} task {nn}

## Akan dilakukan

- [ ] Tulis uji gagal di `{path tes}` untuk {perilaku}
- [ ] Ubah `{path}` agar {perilaku}
- [ ] Commit path di atas dengan pesan `{pesan dari task}`

## Tidak akan dilakukan

- Path di luar **Files** task
- `test/test.json`, `audit.md`, dan checkbox Development phase
- Stage test dan audit

## Acuan yang diikuti

- `{path}` — {bagian} — {dipakai untuk}

## Selesai bila

- Setiap butir punya path atau SHA di `implement/hasil.md`
- Diff commit hanya memuat path **Files**

## Perlu manusia bila

Tidak ada.
```

Satu baris "Acuan yang diikuti" untuk setiap baris `implement/acuan.md`.

## hasil.md

```markdown
# Hasil — implement — {epic} task {nn}

| Butir rencana | Status | Bukti |
|---------------|--------|-------|
| {teks butir} | selesai | `{path}` pada `{sha}` |

SHA: `{sha penuh}`

File yang berubah:

- `{path}`
```

Status `tidak` wajib menyebut butir yang berhenti dan perintah atau error singkatnya. Jangan mengosongkan baris butir.

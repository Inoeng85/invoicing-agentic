# Template auditor

## rencana.md

```markdown
# Rencana — audit — {epic} task {nn}

## Akan dilakukan

- [ ] Periksa Review Focus {n}: {perilaku}. Baca `{path}`
- [ ] Periksa diff `{sha}` terhadap **Produces** dan batas **Files**

## Tidak akan dilakukan

- Mengubah kode, commit, atau checkout
- Menjalankan ulang perintah uji
- Menambah butir di luar Review Focus dan Produces

## Acuan yang diikuti

- `{path}` — {bagian} — {dipakai untuk}

## Selesai bila

- Setiap butir punya putusan `lulus` atau `gagal` di `audit.md`
- Putusan `gagal` menyebut path dan baris

## Perlu manusia bila

Tidak ada.
```

## audit.md

```markdown
# Audit — {epic} task {nn}

SHA: `{sha}`

| Butir | Putusan | Bukti |
|-------|---------|-------|
| Review Focus {n}: {perilaku} | lulus | `{path}` tidak memuat {penyimpangan} |
| Produces dan Files | gagal | `{path}:{baris}` {apa yang menyimpang} |
```

Putusan hanya `lulus` atau `gagal`. Baris `gagal` tanpa path dan nomor baris belum selesai.

## hasil.md

```markdown
# Hasil — audit — {epic} task {nn}

| Butir rencana | Status | Bukti |
|---------------|--------|-------|
| {teks butir} | selesai | `lulus` di `audit/audit.md` |
| {teks butir} | tidak | `gagal` `{path}:{baris}` |

SHA: `{sha}`
```

Status `selesai` hanya untuk putusan `lulus`. Putusan `gagal` memakai status `tidak`.

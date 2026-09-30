# Template tester

## rencana.md

```markdown
# Rencana — test — {epic} task {nn}

## Akan dilakukan

- [ ] Jalankan `{perintah persis dari task}` di `{cwd}`
- [ ] Tulis `test/test.json` dan `test/test.log` untuk perintah itu

## Tidak akan dilakukan

- Mengubah kode produk atau membuat commit
- Mengganti perintah, menambah bendera, atau memasang paket di luar perintah
- Menulis `audit.md` atau membuka task lain

## Acuan yang diikuti

- `{path}` — {bagian} — {dipakai untuk}

## Selesai bila

- `test.json` memuat perintah yang sama dan exit code
- Status git produk sama dengan sebelum perintah

## Perlu manusia bila

Tidak ada.
```

## test.json

```json
{
  "sha": "{sha dari implement/hasil.md}",
  "cwd": "{cwd}",
  "command": "{perintah persis}",
  "exitCode": 0,
  "log": "test/test.log"
}
```

`exitCode` angka, bukan string. Beberapa perintah di rencana menjadi butir terpisah; `command` pada berkas ini adalah perintah pertama yang dijalankan, dan perintah berikutnya dicatat sebagai array `commands` dengan `command` serta `exitCode` masing-masing. Log semuanya tetap satu `test.log`, berurutan.

## hasil.md

```markdown
# Hasil — test — {epic} task {nn}

| Butir rencana | Status | Bukti |
|---------------|--------|-------|
| Jalankan `{perintah}` | selesai | exit `{kode}` di `test/test.json` |
| Tulis test.json dan test.log | selesai | `test/test.json`, `test/test.log` |

SHA yang diuji: `{sha}`
```

Status `tidak` pada perintah yang exit code-nya bukan 0. Jangan menulis `selesai` untuk perintah yang gagal.

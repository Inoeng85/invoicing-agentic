# Branch protection — `develop`

`develop` adalah branch default dan integrasi repository [Inoeng85/invoicing-agentic](https://github.com/Inoeng85/invoicing-agentic). Semua pekerjaan dilakukan di `feat/*`, lalu digabungkan ke `develop` melalui pull request. Lihat [kontribusi](../engineering/contributing.md).

## Proteksi saat ini

- Pull request wajib, termasuk untuk admin (`enforce_admins=true`).
- Jumlah approval minimum: 0 untuk solo developer.
- Force push dan penghapusan branch dilarang.
- Repository mengizinkan squash merge.
- Required status check belum diaktifkan; aktifkan `verify` setelah CI berhasil.

## Mengaktifkan required check

Jalankan dari root repository setelah job CI `verify` hijau:

```sh
./scripts/apply-branch-protection.sh Inoeng85/invoicing-agentic verify
```

Script menggunakan `develop` sebagai default. Argumen ketiga dapat menentukan branch lain bila diperlukan.

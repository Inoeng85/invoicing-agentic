# Branch protection — `main` (Phase 1)

**Remote:** https://github.com/Inoeng85/invoicing-agentic

## Prasyarat akun (verifikasi 2026-09-30)

Repo **public** (2026-09-30). Jika billing Actions terkunci, perbaiki billing dulu. Repo **private** + **GitHub Free** dulu mengembalikan **403** — *Upgrade to GitHub Pro or make this repository public*. Tanpa salah satu opsi ini, rule `main` + required check **tidak bisa** dipasang via API/UI penuh.

## Jika CI `startup_failure` (0 jobs)

1. **Settings → Actions → General** — pilih *Allow all actions and reusable workflows* (sudah `enabled: true` di repo ini).
2. Jika tetap gagal: coba **public** repo sementara atau **GitHub Pro** (sama dengan syarat branch protection).
3. Buka tab **Actions** → banner *Approve workflows* jika ada.
4. Setelah runner jalan, required check = job **`verify`** (workflow CI).

Setelah **push pertama** dan workflow CI **hijau** sekali:

1. GitHub → **Settings** → **Branches** → **Add rule** untuk `main`
2. Aktifkan:
   - **Require a pull request before merging**
   - **Require status checks to pass** → pilih job **`verify`** (workflow CI)
   - **Do not allow bypassing the above settings**
   - **Block force pushes**
3. Default merge: **Squash merge**

Atau jalankan script (setelah CI hijau):

```sh
chmod +x scripts/apply-branch-protection.sh
./scripts/apply-branch-protection.sh Inoeng85/invoicing-agentic verify
```

Manual `gh api` (ganti `OWNER/REPO`):

```sh
gh api repos/OWNER/REPO/branches/main/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[checks][][context]=verify \
  -f enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f restrictions=null \
  -F required_linear_history=false \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

> Nama context check bisa `Verify` / `verify` tergantung label job di GitHub UI — sesuaikan setelah run CI pertama.

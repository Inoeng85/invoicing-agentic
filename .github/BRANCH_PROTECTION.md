# Branch protection — `main` (Phase 1)

**Remote:** https://github.com/Inoeng85/invoicing-agentic

## Jika CI `startup_failure` (0 jobs)

1. **Settings → Actions → General** — pilih *Allow all actions and reusable workflows*.
2. Pastikan **Actions** enabled untuk repo private (akun Free: kuota menit Actions).
3. Buka tab **Actions** → jika ada banner *Approve workflows*, setujui workflow baru.
4. Workflow minimal `CI smoke` juga gagal → masalah akun/billing, bukan isi `ci.yml`.

Setelah **push pertama** dan workflow CI **hijau** sekali:

1. GitHub → **Settings** → **Branches** → **Add rule** untuk `main`
2. Aktifkan:
   - **Require a pull request before merging**
   - **Require status checks to pass** → pilih job **`verify`** (workflow CI)
   - **Do not allow bypassing the above settings**
   - **Block force pushes**
3. Default merge: **Squash merge**

Atau via CLI (ganti `OWNER/REPO`):

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

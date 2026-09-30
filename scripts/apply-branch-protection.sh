#!/usr/bin/env bash
# PG-1 — apply branch protection after CI job `verify` is green once.
set -euo pipefail

REPO="${1:-Inoeng85/invoicing-agentic}"
CHECK="${2:-verify}"

echo "Applying protection to $REPO main (required check: $CHECK)"
gh api "repos/$REPO/branches/main/protection" -X PUT \
  -f required_status_checks[strict]=true \
  -f "required_status_checks[checks][][context]=$CHECK" \
  -f enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=null \
  -F required_linear_history=false \
  -F allow_force_pushes=false \
  -F allow_deletions=false

echo "Done. Confirm in GitHub → Settings → Branches."

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v gh >/dev/null 2>&1; then
  echo "[deploy-latest] GitHub CLI (gh) is required. Install it first: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "[deploy-latest] gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "main" ]]; then
  echo "[deploy-latest] Please run this script from the main branch. Current branch: $current_branch" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[deploy-latest] Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "[deploy-latest] Fetching latest origin/main..."
git fetch origin main --quiet

local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse origin/main)"

if [[ "$local_sha" != "$remote_sha" ]]; then
  echo "[deploy-latest] Local main differs from origin/main. Pushing main..."
  git push origin main
else
  echo "[deploy-latest] main is already up to date with origin/main."
fi

echo "[deploy-latest] Triggering GitHub Packages canary publish workflow..."
gh workflow run publish-github-packages.yml --ref main -f releaseType=canary

sleep 2
run_url="$(gh run list --workflow publish-github-packages.yml --branch main --event workflow_dispatch --limit 1 --json url --jq '.[0].url')"

if [[ -z "$run_url" || "$run_url" == "null" ]]; then
  echo "[deploy-latest] Workflow dispatched. Check runs: gh run list --workflow publish-github-packages.yml"
  exit 0
fi

echo "[deploy-latest] Workflow run: $run_url"
echo "[deploy-latest] Watching workflow until completion..."
gh run watch "$run_url" --exit-status

echo "[deploy-latest] Latest and greatest canary packages published successfully."

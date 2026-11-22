#!/usr/bin/env bash
# Build the site from the sample content and run the Playwright tests inside Playwright's own image,
# exactly as CI does, so screenshots match. Extra arguments go to `playwright test`
# (e.g. --update-snapshots).
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('@playwright/test/package.json').version")
docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD":/work -w /work "mcr.microsoft.com/playwright:v${VERSION}-noble" \
  bash -c 'npm run build:fixtures && npx playwright test "$@"' _ "$@"

#!/usr/bin/env bash
# Preview the site with real content at https://schrodlm.github.io/site-preview/.
#
#   scripts/preview.sh [--no-publish] <vault-dir> <converter-config>
#
# See "Previewing with real content" in docs/development.md. Everything happens in a temporary
# folder, so nothing generated ever lands in this repo or in the vault.
set -euo pipefail

CONVERTER='git+https://github.com/schrodlm/obsidian-md-converter@v0.3.0'
PREVIEW_REMOTE=${PREVIEW_REMOTE:-git@github.com:schrodlm/site-preview.git}
BASE=/site-preview/

publish=1
if [[ ${1:-} == --no-publish ]]; then
  publish=0
  shift
fi
if [[ $# -ne 2 ]]; then
  echo "usage: $0 [--no-publish] <vault-dir> <converter-config>" >&2
  exit 2
fi
vault=$(realpath "$1")
config=$(realpath "$2")
site=$(realpath "$(dirname "$0")/..")

if [[ $(node --version) != v$(cat "$site/.nvmrc").* ]]; then
  echo "Node.js $(cat "$site/.nvmrc") is needed (see .nvmrc); this is $(node --version)." >&2
  exit 1
fi

tmp=$(mktemp -d -t site-preview.XXXXXX)
if [[ $publish -eq 1 ]]; then trap 'rm -rf "$tmp"' EXIT; fi
echo "Working in $tmp"

# Both sides are taken as committed, so the preview shows what a push would.
mkdir "$tmp/vault" "$tmp/site"
git -C "$vault" archive HEAD | tar -x -C "$tmp/vault"
git -C "$site" archive HEAD | tar -x -C "$tmp/site"

echo "Converting the vault"
python3 -m venv "$tmp/venv"
"$tmp/venv/bin/pip" install --quiet "$CONVERTER"
"$tmp/venv/bin/obsidian-md-converter" --config "$config" --force \
  --obsidian-root "$tmp/vault" --output-root "$tmp/content"

echo "Building the site below $BASE"
cd "$tmp/site"
npm ci --silent
SITE_BASE=$BASE CONTENT_DIR="$tmp/content" npm run build
# The site in progress may not have its CV page yet; the preview then has no PDF.
if [[ -f dist/cv/index.html ]]; then
  npx playwright install --only-shell chromium
  SITE_BASE=$BASE npm run --silent pdf
fi

if [[ $publish -eq 0 ]]; then
  echo "Built into $tmp/site/dist; not published."
  exit 0
fi

echo "Publishing to $PREVIEW_REMOTE"
cd dist
# GitHub Pages would otherwise run Jekyll over the branch and drop the _astro/ folder.
touch .nojekyll
git init --quiet --initial-branch gh-pages
git add --all --force
git -c user.name='Site preview' -c user.email=preview@localhost -c commit.gpgsign=false \
  commit --quiet --no-verify -m "Preview $(git -C "$site" rev-parse --short HEAD) with vault $(git -C "$vault" rev-parse --short HEAD)"
git push --quiet --force "$PREVIEW_REMOTE" gh-pages
echo "Published; GitHub Pages serves it at https://schrodlm.github.io$BASE in a minute or two."

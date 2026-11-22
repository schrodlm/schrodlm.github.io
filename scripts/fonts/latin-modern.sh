#!/usr/bin/env bash
# Subset Latin Modern Roman 10 (regular, italic and bold) to Latin and Latin Extended, as WOFF2,
# for the printed CV. Its fonts are under the GUST Font License; the licence and what was changed
# are in src/assets/fonts/latin-modern/LICENSE.md.
#
# Takes the folder of Latin Modern's OpenType files, from the `lm` package on CTAN or from TeX's
# fonts-lmodern package, and needs fontTools with brotli. Run from the repository root:
#
#   scripts/fonts/latin-modern.sh [/usr/share/texmf/fonts/opentype/public/lm]
#
# It writes src/assets/fonts/latin-modern/*.woff2, which are committed and served as they are;
# the build never runs this script.
set -euo pipefail
SRC=${1:-/usr/share/texmf/fonts/opentype/public/lm}
OUT=src/assets/fonts/latin-modern
# Latin, Latin Extended, and the punctuation, arrows and symbols a CV uses.
UNICODES='U+0000-024F,U+0259,U+02B0-02FF,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20AC,U+2116,U+2122,U+2190-2193,U+2212'
mkdir -p "$OUT"
for style in regular italic bold; do
  python3 -m fontTools.subset "$SRC/lmroman10-$style.otf" \
    --unicodes="$UNICODES" \
    --layout-features='*' \
    --flavor=woff2 \
    --output-file="$OUT/latin-modern-roman-$style.woff2"
done

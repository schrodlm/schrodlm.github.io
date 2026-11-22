#!/usr/bin/env python3
"""Generate Garden Braille, the font the site draws its braille art in.

The garden's drawings are braille characters, each a cell of 2 × 4 dots. In an ordinary braille
font the dots sit further apart across a cell boundary than inside a cell, so a drawing shows its
character grid. In this font every dot of every glyph sits on one even grid: the dot pitch is the
same inside a cell and between cells, across and down, so a drawing reads as one field of dots.

Metrics, in font units (2048 to the em):

    pitch     512  (a quarter em)   the distance between neighbouring dots, across and down
    advance  1024  (half an em)     two pitches: a cell is two dots wide
    line     2048  (one em)         four pitches: ascent 1536 + descent 512, no line gap
    dot       256  (an eighth em)   the dot's diameter, half the pitch

At font-size 16px a cell is exactly 8 × 16 px, with 2 px dots on a 4 px grid that fall on whole
pixels. Set the art at line-height 1 and with no letter spacing; any even font size keeps each
cell a whole number of pixels wide.

The font holds only the braille block, U+2800 to U+28FF, and no hinting.

Licence: mine. Every outline is drawn by this script; no other font goes into it.

Requires fontTools with brotli (for WOFF2). Run from the repository root:

    python3 scripts/fonts/braille-font.py

It writes src/assets/fonts/garden-braille.woff2, which is committed and served as it is; the build
never runs this script. The output is reproducible: the same script always writes the same bytes.
"""
import math
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

OUT = Path('src/assets/fonts/garden-braille.woff2')
FAMILY = 'Garden Braille'

UPM = 2048
PITCH = UPM // 4
ADVANCE = 2 * PITCH
ASCENT = 3 * PITCH
DESCENT = PITCH
RADIUS = PITCH // 4

# A fixed timestamp (2026-11-22, in seconds since 1904) keeps the output reproducible.
TIMESTAMP = 3_878_150_400

# The Unicode braille bit of each dot, by column (0–1) and row (0–3, from the top).
BITS = {(0, 0): 0x01, (0, 1): 0x02, (0, 2): 0x04, (1, 0): 0x08,
        (1, 1): 0x10, (1, 2): 0x20, (0, 3): 0x40, (1, 3): 0x80}


def dot_centre(column, row):
    """The centre of a dot: in the middle of its pitch square, rows counted down from the ascent."""
    return PITCH // 2 + column * PITCH, ASCENT - PITCH // 2 - row * PITCH


def draw_dot(pen, cx, cy):
    """A circle as eight quadratic segments: eight off-curve points, clockwise as TrueType wants."""
    reach = RADIUS / math.cos(math.pi / 8)
    points = []
    for i in range(8):
        angle = -(i + 0.5) * math.pi / 4
        points.append((round(cx + reach * math.cos(angle)), round(cy + reach * math.sin(angle))))
    pen.qCurveTo(*points, None)
    pen.closePath()


def glyph(bits):
    pen = TTGlyphPen(None)
    for (column, row), bit in BITS.items():
        if bits & bit:
            draw_dot(pen, *dot_centre(column, row))
    return pen.glyph()


def main():
    cmap = {0x2800 + bits: f'uni{0x2800 + bits:04X}' for bits in range(256)}
    glyphs = {'.notdef': TTGlyphPen(None).glyph(), **{name: glyph(code - 0x2800) for code, name in cmap.items()}}

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(list(glyphs))
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    glyf = fb.font['glyf']
    fb.setupHorizontalMetrics({name: (ADVANCE, getattr(glyf[name], 'xMin', 0)) for name in glyphs})
    fb.setupHorizontalHeader(ascent=ASCENT, descent=-DESCENT, lineGap=0)
    fb.setupNameTable({
        'copyright': 'Copyright Matěj Schrödl',
        'familyName': FAMILY,
        'styleName': 'Regular',
        'uniqueFontIdentifier': f'{FAMILY} Regular',
        'fullName': f'{FAMILY} Regular',
        'psName': 'GardenBraille-Regular',
        'version': 'Version 1.000',
        'description': 'Braille with every dot on one even grid, across and between cells.',
        'licenseDescription': 'Mine: drawn from scratch by scripts/fonts/braille-font.py '
                              'for schrodlm.github.io.',
    })
    fb.setupOS2(
        sTypoAscender=ASCENT, sTypoDescender=-DESCENT, sTypoLineGap=0,
        usWinAscent=ASCENT, usWinDescent=DESCENT,
        fsSelection=0x40 | 0x80,  # Regular, USE_TYPO_METRICS
        achVendID='NONE', version=4,
    )
    fb.setupPost()
    fb.font['head'].created = TIMESTAMP
    fb.font['head'].modified = TIMESTAMP
    fb.font.recalcTimestamp = False

    fb.font.flavor = 'woff2'
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fb.save(OUT)
    print('wrote', OUT, OUT.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()

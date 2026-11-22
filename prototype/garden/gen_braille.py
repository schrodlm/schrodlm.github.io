"""GardenHome, with the flowers drawn in Unicode braille instead of ASCII.

Starts from the published board (ref/GardenHome.dc.html) and swaps only the drawing medium:
the garden band, its hover spots and the post-list marks. Everything else is kept byte for byte.
"""
import re
import urllib.parse

SRC = 'ref/GardenHome.dc.html'
OUT = 'jungle/project/GardenHomeBraille.dc.html'

# Noto Sans Symbols 2 draws braille at 0.7em advance with dots 0.268em apart across and 0.25em
# apart down. A letter-spacing of -0.164em and a line-height of 1em put every dot on one even
# grid, so the characters' edges vanish. The font is fetched as a subset of the braille block only.
BRAILLE_TEXT = ''.join(chr(c) for c in range(0x2800, 0x2900))
FONT_LINK = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2'
             '&amp;text=' + urllib.parse.quote(BRAILLE_TEXT) + '&amp;display=block">')
BRAILLE = "'Noto Sans Symbols 2', 'Apple Braille', 'Segoe UI Symbol', 'DejaVu Sans', sans-serif"
# The size is 110/7 px so the glyph advance (0.7em) is exactly 11 px: Chrome on Linux and Windows
# rounds advances to whole pixels, and at 15 px (10.5) every cell would come out half a pixel wide.
PX = 110 / 7
DOTS = f"font-family: {BRAILLE}; font-size: {PX:.4f}px; line-height: {PX:.4f}px; letter-spacing: -0.164em;"
MARK_DOTS = DOTS.replace(f'{PX:.4f}px', f'{120 / 7:.4f}px')   # advance 12 px

JS = r'''
  // ---- braille: every character is a 2 × 4 block of dots ----

  // A dot bitmap W × H characters big. Each dot keeps a colour and a weight; a heavier part
  // (a petal over a stem) wins the dot, and the heaviest colour in a cell colours its character.
  dots(W, H) {
    const DW = W * 2, DH = H * 4, col = new Int16Array(DW * DH).fill(-1), wt = new Float32Array(DW * DH), pal = [], at = {};
    const put = (x, y, c, w) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= DW || y >= DH) return;
      const i = y * DW + x;
      if (w >= wt[i]) { if (at[c] === undefined) { at[c] = pal.length; pal.push(c); } col[i] = at[c]; wt[i] = w; }
    };
    return { W, H, DW, DH, col, wt, pal, put };
  }

  // Encode the bitmap into rows of coloured runs, the same shape toRows() gives the ASCII band.
  braille(d) {
    const BITS = [[0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]];
    const rows = [];
    for (let cy = 0; cy < d.H; cy++) {
      const runs = []; let t = '', cur = null;
      for (let cx = 0; cx < d.W; cx++) {
        let bits = 0, best = -1, bs = 0; const score = {};
        for (const [dx, dy, bit] of BITS) {
          const i = (cy * 4 + dy) * d.DW + cx * 2 + dx, k = d.col[i];
          if (k < 0) continue;
          bits |= bit; score[k] = (score[k] || 0) + d.wt[i];
          if (score[k] > bs) { bs = score[k]; best = k; }
        }
        const key = bits ? d.pal[best] : '';
        if (cur === null) cur = key;
        else if (key !== cur) { runs.push({ t, c: cur || 'transparent' }); t = ''; cur = key; }
        t += String.fromCharCode(0x2800 + bits);
      }
      runs.push({ t, c: cur || 'transparent' });
      rows.push({ runs });
    }
    return rows;
  }

  line(d, x0, y0, x1, y1, c, w) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
    for (let i = 0; i <= n; i++) d.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c, w);
  }

  disc(d, cx, cy, r, c, w) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + 0.3) d.put(x, y, c, w);
  }

  ring(d, cx, cy, r, c, w) {
    const n = Math.ceil(r * 9);
    for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; d.put(cx + r * Math.cos(a), cy + r * Math.sin(a), c, w); }
  }

  oval(d, cx, cy, a, b, ang, c, w) {
    const R = Math.max(a, b) + 1, co = Math.cos(ang), si = Math.sin(ang);
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++)
      for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
        const u = (x - cx) * co + (y - cy) * si, v = -(x - cx) * si + (y - cy) * co;
        if ((u / a) * (u / a) + (v / b) * (v / b) <= 1.08) d.put(x, y, c, w);
      }
  }

  // A tapered blade along a quadratic curve: thin at the foot, widest a third of the way, a point at the tip.
  blade(d, x0, y0, qx, qy, x1, y1, width, c, w) {
    const n = Math.ceil((Math.hypot(qx - x0, qy - y0) + Math.hypot(x1 - qx, y1 - qy)) * 3) + 2;
    for (let i = 0; i <= n; i++) {
      const s = i / n, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, e = s * s;
      const x = a * x0 + b * qx + e * x1, y = a * y0 + b * qy + e * y1;
      const tx = 2 * (1 - s) * (qx - x0) + 2 * s * (x1 - qx), ty = 2 * (1 - s) * (qy - y0) + 2 * s * (y1 - qy), tl = Math.hypot(tx, ty) || 1;
      const half = width * Math.sqrt(s) * (1 - s) / 0.385 / 2;
      for (let q = -half; q <= half + 0.01; q += 0.5) d.put(x - ty / tl * q, y + tx / tl * q, c, w);
    }
  }

  // The stem as a curve: the ASCII bend, k/h to the 1.6, but continuous, one dot per row.
  stem(p, x, g, wind) {
    const amp = (p.h >= 7 ? 1.6 : 1.1) * p.stiff, L = p.h * 4, bend = (amp * wind + (p.lean || 0) * 0.8) * 2;
    const at = (k) => [x + bend * Math.pow(Math.max(0, k) / L, 1.6), g - 1 - k];
    return { at, L, ang: Math.atan(bend * 1.6 / L) };
  }

  // One dot per row; where the curve steps a column over, the step is joined, so the stem reads unbroken.
  drawStem(d, s, c, w) {
    let px = Math.round(s.at(0)[0]);
    for (let k = 0; k <= s.L; k++) {
      const [x, y] = s.at(k), rx = Math.round(x);
      if (Math.abs(rx - px) === 1 && k > 0) d.put(rx, y + 1, c, w);
      else if (Math.abs(rx - px) > 1) this.line(d, px, y + 1, rx, y, c, w);
      d.put(rx, y, c, w); px = rx;
    }
  }

  // A leaf: a slim blade arching up and out from the stem; fern pairs are single strokes, like the ASCII \\ /.
  leaf(d, sx, sy, side, size, wind, c) {
    if (size < 4) { this.line(d, sx + side, sy - 0.5, sx + side * size + wind * 0.4, sy - size * 0.9, c, 1.5); return; }
    this.blade(d, sx, sy, sx + side * size * 0.9, sy + 0.4, sx + side * size * 1.1 + wind * 0.7, sy - size * 1.1, 1.3, c, 1.5);
  }

  // Each head type from heads(), drawn at dot resolution around the stem's tip, tilted with it.
  head(d, p, tx, ty, ang, k) {
    k = k || 1;
    const P = p.petal[1], C = p.center ? p.center[1] : p.petal[1], co = Math.cos(ang), si = Math.sin(ang);
    const T = (u, v) => [tx + k * (u * co - v * si), ty + k * (u * si + v * co)];
    const disc = (u, v, r, c, w) => { const [x, y] = T(u, v); this.disc(d, x, y, r * k, c, w); };
    const oval = (u, v, a, b, an, c, w) => { const [x, y] = T(u, v); this.oval(d, x, y, a * k, b * k, an + ang, c, w); };
    const ray = (u0, v0, u1, v1, c, w) => { const [a, b] = T(u0, v0), [e, f] = T(u1, v1); this.line(d, a, b, e, f, c, w); };
    const name = p.head.name;
    if (name === 'sunburst') {
      for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI; ray(Math.cos(a) * 3, -6 + Math.sin(a) * 3, Math.cos(a) * 6.2, -6 + Math.sin(a) * 6.2, P, 3); }
      disc(0, -6, 2, C, 3.2);
    } else if (name === 'star') {
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * 2 * Math.PI; oval(Math.cos(a) * 3.8, -6 + Math.sin(a) * 3.8, 2.6, 1.5, a, P, 3); }
      disc(0, -6, 1.3, C, 3.2);
    } else if (name === 'globe') {
      const [x, y] = T(0, -6); this.ring(d, x, y, 5 * k, P, 3); this.ring(d, x, y, 4 * k, P, 3);
      disc(0, -6, 1.8, C, 3.2);
    } else if (name === 'asterisk') {
      for (let i = 0; i < 6; i++) { const a = i / 6 * 2 * Math.PI + Math.PI / 2; ray(Math.cos(a) * 1.2, -6 + Math.sin(a) * 1.2, Math.cos(a) * 6, -6 + Math.sin(a) * 6, P, 3); }
      for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * 2 * Math.PI + Math.PI / 2; const [x, y] = T(Math.cos(a) * 4.5, -6 + Math.sin(a) * 4.5); d.put(x, y, P, 3); }
    } else if (name === 'tulip') {
      // a cup with a rounded base and three pointed tepals
      for (let v = 0; v <= 11; v += 0.5) {
        const half = 4.2 * Math.sqrt(Math.min(1, v / 3.5));
        for (let u = -half; u <= half + 0.01; u += 0.5) {
          const k = Math.abs(u) / 4.2, tip = 7.5 + 3.5 * Math.max(0, 1 - Math.abs(k - 0) * 3.2, 1 - Math.abs(k - 0.9) * 3.2);
          if (v <= tip) { const [x, y] = T(u, -v); d.put(x, y, P, 3); }
        }
      }
      disc(0, -4.5, 1.1, C, 3.2);
    } else if (name === 'cluster') {
      // a raceme: florets on short stalks, alternating sides up a spike, smallest at the tip
      ray(0, 0, 0, -13, '#2B7349', 1);
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? -1 : 1, v = -1.5 - i * 2.2;
        ray(0, v + 0.8, side * 1.6, v - 0.2, '#2B7349', 1);
        disc(side * 3, v - 0.6, i < 3 ? 1.5 : i < 5 ? 1.2 : 0.8, i === 1 || i === 4 ? C : P, 3);
      }
      disc(0, -14.5, 1.05, P, 3);
    } else if (name === 'nodding cup') {
      // the stem hooks over and the cup hangs from it, mouth down
      const side = p.lean ? p.lean : 1;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI, b = (i + 1) / 12 * Math.PI; ray(side * (1 - Math.cos(a)) * 2.6, -Math.sin(a) * 4, side * (1 - Math.cos(b)) * 2.6, -Math.sin(b) * 4, '#2B7349', 1); }
      const bx = side * 5.2;
      for (let v = 0; v <= 7; v += 0.5) {
        const half = 1.4 + 1.6 * Math.pow(v / 7, 0.8) + 1.4 * Math.pow(v / 7, 4);
        for (let u = -half; u <= half + 0.01; u += 0.5) { if (v > 6 && Math.abs(Math.sin(u * 1.4)) < 0.35) continue; const [x, y] = T(bx + u, v - 0.5); d.put(x, y, P, 3); }
      }
      disc(bx, 8.6, 0.8, C, 3.2);
    } else if (name === 'pollen cup') {
      for (let v = 0; v <= 4.5; v += 0.5) { const half = Math.sqrt(Math.max(0, 4.5 * 4.5 - (4.5 - v) * (4.5 - v))); for (let u = -half; u <= half + 0.01; u += 0.5) { const [x, y] = T(u, -v); d.put(x, y, P, 3); } }
      [[-3, -7], [0, -8], [3, -7], [-1.5, -10.5], [1.6, -11], [-4.2, -10], [4, -9.8], [0, -13]].forEach(([u, v]) => { const [x, y] = T(u, v); d.put(x, y, P, 3); });
    } else if (name === 'orchid') {
      oval(0, -10, 1.4, 3, 0, P, 3);
      oval(-4, -7, 1.4, 3.2, -1.1, P, 3);
      oval(4, -7, 1.4, 3.2, 1.1, P, 3);
      oval(0, -3.4, 2.8, 2, 0, P, 3);
      const [x, y] = T(0, -6.4); d.put(x, y, P, 3);
    } else {
      disc(0, -5.5, 4.4, P, 3);
      disc(0, -5.5, 1.9, C, 3.2);
    }
  }

  // A post's flower: stem, leaves and head, all bending in the one wind.
  flower(d, p, x, g, wind) {
    const s = this.stem(p, x, g, wind);
    this.drawStem(d, s, '#2B7349', 1);
    for (const l of p.leaves) {
      const [sx, sy] = s.at(l.k * 4 + 1);
      if (l.both) { this.leaf(d, sx, sy, -1, 3, wind, '#3F8A52'); this.leaf(d, sx, sy, 1, 3, wind, '#3F8A52'); }
      else this.leaf(d, sx, sy, l.side, 4.5, wind, '#3F8A52');
    }
    const [tx, ty] = s.at(s.L);
    this.head(d, p, tx, ty, s.ang);
  }

  // The unattributed plants: ferns, buds, small florets and grass tufts.
  filler(d, f, x, g, wind) {
    const p = f.p, s = this.stem(p, x, g, wind), kind = p.fern ? 'fern' : p.head.rows[0];
    if (kind === 'fern') {
      this.drawStem(d, s, '#3F8A52', 1);
      for (let k = 3; k < s.L - 1; k += 3) {
        const [sx, sy] = s.at(k), len = 1 + 3 * (1 - k / s.L);
        this.line(d, sx, sy, sx - len + wind * 0.4, sy - len * 0.6, '#3F8A52', 1.5);
        this.line(d, sx, sy, sx + len + wind * 0.4, sy - len * 0.6, '#3F8A52', 1.5);
      }
      const [tx, ty] = s.at(s.L); d.put(tx + 1, ty, '#3F8A52', 1.5); d.put(tx + 1.5, ty + 1, '#3F8A52', 1.5);
      return;
    }
    if (kind === '*') {
      // A grass tuft: three slim blades fanned from one foot, the middle one the plant's height.
      for (let i = -1; i <= 1; i++) {
        const hgt = s.L * (i ? 0.7 : 1), tip = wind * 1.4 * hgt / 12, out = i * hgt * 0.35;
        const qx = x + out * 0.3, qy = g - 1 - hgt * 0.6, ex = x + out + tip, ey = g - 1 - hgt;
        let px = x, py = g - 1;
        for (let k = 1; k <= 8; k++) { const t = k / 8, bx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * qx + t * t * ex, by = (1 - t) * (1 - t) * (g - 1) + 2 * (1 - t) * t * qy + t * t * ey; this.line(d, px, py, bx, by, '#5E8E4A', 1); px = bx; py = by; }
      }
      return;
    }
    this.drawStem(d, s, '#3F8A52', 1);
    for (const l of p.leaves) { const [sx, sy] = s.at(l.k * 4 + 1); this.leaf(d, sx, sy, l.side, 2.5, wind, '#3F8A52'); }
    const [tx, ty] = s.at(s.L), c = p.petal[1];
    if (kind === '@') this.oval(d, tx + Math.sin(s.ang) * 2, ty - 2.2, 1.3, 2.3, s.ang, c, 3);
    else if (kind === 'o') this.ring(d, tx + Math.sin(s.ang) * 2, ty - 2, 1.6, c, 3);
    else { for (let i = 0; i < 6; i++) { const a = i / 6 * 2 * Math.PI; d.put(tx + Math.cos(a) * 2.2, ty - 2.6 + Math.sin(a) * 2.2, c, 3); } d.put(tx, ty - 2.6, '#A87400', 4); }
  }

  // The flower's head, small enough for one character row, as a mark beside a title.
  mark(slug) {
    const p = this.specimen(slug), P = p.petal[1], C = p.center ? p.center[1] : P;
    const m = {
      sunburst: ['P.PP.P', '.PCCP.', '.PCCP.', 'P.PP.P'],
      star: ['..PP..', 'PPCCPP', '..CC..', '.P..P.'],
      globe: ['.PPPP.', 'P.CC.P', 'P.CC.P', '.PPPP.'],
      asterisk: ['P.PP.P', '.PPPP.', '.PPPP.', 'P.PP.P'],
      tulip: ['P.PP.P', 'PPCCPP', 'PPCCPP', '.PPPP.'],
      cluster: ['.P..P.', 'PPCCPP', '.PCCP.', '..PP..'],
      'nodding cup': ['.PPPP.', 'PPPPPP', 'P.CC.P', '..CC..'],
      'pollen cup': ['P..P.P', '.P.P..', 'PPPPPP', '.PPPP.'],
      orchid: ['..PP..', 'PP..PP', '.PPPP.', '..PP..'],
      eye: ['.PPPP.', 'PPCCPP', 'PPCCPP', '.PPPP.']
    }[p.head.name];
    const d = this.dots(3, 1);
    m.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch !== '.') d.put(x, y, ch === 'C' ? C : P, ch === 'C' ? 4 : 3); }));
    return this.braille(d)[0].runs;
  }

  posts() { POSTS }

  // The garden: the home page's band of plants, with each post standing in it as its own flower.
  gardenPlan() {
    if (this._garden) return this._garden;
    const r = this.rng('garden'), W = 190, H = 16, posts = this.posts();
    const span = 132, start = Math.floor((W - span) / 2);
    const xs = posts.map((p, i) => start + Math.round((i + 0.5) * span / posts.length));
    const small = [['@'], ['o'], ['*'], ['(@)']], cols = ['#C24E39', '#A87400', '#8A4F98', '#2A7099'];
    const fillers = [];
    let x = 2 + Math.floor(r() * 3);
    while (x < W - 2) {
      if (!xs.some((px) => Math.abs(px - x) < 5)) {
        const fern = r() < 0.4, h = 2 + Math.floor(r() * 4), leaves = [];
        for (let k = 1; k < h; k++) if (fern || r() < 0.3) leaves.push(fern ? { k, both: true } : { k, side: r() < 0.5 ? -1 : 1 });
        fillers.push({ x, p: { h, stiff: 0.8 + r() * 0.4, leaves, fern, head: { rows: small[Math.floor(r() * small.length)] }, petal: ['', cols[Math.floor(r() * cols.length)]], center: null } });
      }
      x += 4 + Math.floor(r() * 5);
    }
    const grass = [], soil = [];
    for (let i = 0; i < W; i++) { if (r() < 0.35) grass.push({ x: i, ch: [',', "'", '"', '`'][Math.floor(r() * 4)] }); soil.push(['_', '.', '_', ',', '_'][Math.floor(r() * 5)]); }
    this._garden = { W, H, xs, fillers, grass, soil };
    return this._garden;
  }

  garden() {
    const G = this.gardenPlan(), d = this.dots(G.W, G.H), wind = this.wind(), g = G.H * 4 - 3;
    G.soil.forEach((ch, i) => {
      const x = i * 2;
      if (ch === '_') { d.put(x, g, '#7A5C42', 1); d.put(x + 1, g, '#7A5C42', 1); }
      else if (ch === ',') { d.put(x, g, '#7A5C42', 1); d.put(x + 1, g + 1, '#7A5C42', 1); }
      else { d.put(x + 1, g, '#7A5C42', 1); d.put(x, g + 2, '#7A5C42', 1); }
    });
    for (const gr of G.grass) {
      const hgt = { ',': 2.5, "'": 3.5, '"': 4.5, '`': 3 }[gr.ch], x = gr.x * 2 + 0.5, tip = wind * 0.5;
      this.line(d, x, g - 1, x + tip + (gr.ch === ',' ? 1 : 0), g - hgt, '#5E8E4A', 1);
      if (gr.ch === '"') this.line(d, x + 1, g - 1, x + 1.5 + tip, g - hgt + 1.5, '#5E8E4A', 1);
    }
    for (const f of G.fillers) this.filler(d, f, f.x * 2, g, wind);
    this.posts().forEach((p, i) => this.flower(d, this.specimen(p.slug), G.xs[i] * 2, g, wind));
    return this.braille(d);
  }

  // Invisible links over each post's flower; hovering one shows its label on the placard.
  // Placed in per cent of the band, so they stay on their flowers whatever width the braille font draws at.
  spots() {
    const G = this.gardenPlan(), CH = 110 / 7;
    return this.posts().map((p, i) => {
      const s = this.specimen(p.slug), tall = s.h + 4;
      return {
        aria: p.title + ', ' + s.latin,
        left: ((G.xs[i] - 4) / G.W * 100).toFixed(3) + '%', top: ((G.H - 1 - tall) * CH).toFixed(2) + 'px',
        width: (9 / G.W * 100).toFixed(3) + '%', height: (tall * CH).toFixed(2) + 'px',
        enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 })
      };
    });
  }
'''


def main():
    src = open(SRC, encoding='utf-8').read()

    # 1. the braille font, beside the page's own fonts
    src = src.replace('&amp;display=swap">', '&amp;display=swap">\n' + FONT_LINK, 1)

    # 2. the garden band: braille rows instead of ASCII ones
    old_band = "font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; line-height: 15px;\">\n<div style=\"position: relative;\"><div aria-hidden=\"true\">"
    assert src.count(old_band) == 1
    src = src.replace(old_band, f'{DOTS}">\n<div style="position: relative;"><div aria-hidden="true">')
    a = src.index(DOTS); b = src.index('</sc-for></div>', a)
    src = src[:a] + src[a:b].replace('height: 15px;', f'height: {PX:.4f}px;') + src[b:]

    # 3. the post-list marks
    old_mark = "<span aria-hidden=\"true\" style=\"font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; width: 32px; white-space: pre;\">"
    assert src.count(old_mark) == 1
    src = src.replace(old_mark, f'<span aria-hidden="true" style="{MARK_DOTS} width: 32px; white-space: pre;">')

    # 4. the logic: keep the reference's specimens, wind, roots and trails; swap mark, garden and spots
    posts = re.search(r'  posts\(\) \{ (return \[.*?\];) \}', src).group(1)
    head, rest = src.split('  // The flower\'s most telling row', 1)
    rest = rest[rest.index('  // The museum label'):]
    src = head + rest
    a = src.index('  posts() {')
    b = src.index('  renderVals() {')
    src = src[:a] + JS.strip('\n').replace('{ POSTS }', '{ ' + posts + ' }') + '\n\n' + src[b:]
    src = src.replace('<title>Garden home</title>', '<title>Garden home, braille</title>')
    open(OUT, 'w', encoding='utf-8').write(src)
    print('wrote', OUT, len(src), 'bytes')


if __name__ == '__main__':
    main()

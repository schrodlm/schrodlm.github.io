"""The replikace note page with every drawn element in braille: its flower, the hanging vine and its
insects, the heading tendrils, the specimen card's flower, the neighbourhood plate and the soil footer.
Prose, captions and labels stay real text. Writes NoteBraille."""
import json

# The woodcut note's data: replikace, its real neighbours from graph.json, and the notes two steps away.
_wn = open('gen_woodcut_note.py', encoding='utf-8').read()
exec(_wn[:_wn.index('JS = BLOOM_JS')])

from gen_braille import JS as HOME_JS, FONT_LINK, DOTS, PX  # noqa: E402

CORE_JS = HOME_JS[:HOME_JS.index('  posts() { POSTS }')]   # dots, braille, primitives, flower heads, mark
PCW, PCH = 83, 19          # the plate in braille cells: 83 × 0.536em by 19 × 1em is about 702 × 300 at 15.8 px
PLATE_EM = round(PCW * 0.536, 3)

JS = CORE_JS + r'''
  mix(hex, k) {
    const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)), b = [241, 236, 223];
    return '#' + a.map((v, i) => Math.round(v * k + b[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
  }

  // The note's own flower standing in a little soil, for the title and the specimen card.
  flowerRows(slug) {
    const p = this.specimen(slug), H = p.h + 5, W = 15, d = this.dots(W, H), g = H * 4 - 3, wind = this.wind();
    for (let x = 6; x < 25; x++) { if (x % 4 !== 3) d.put(x, g, '#7A5C42', 1); if (x % 5 === 2) d.put(x, g + 2, '#7A5C42', 1); }
    for (const x of [8, 11, 19, 22]) this.line(d, x, g - 1, x + wind * 0.5, g - 3.5, '#5E8E4A', 1);
    this.flower(d, p, 15, g, wind);
    return this.braille(d);
  }

  // ---- the vine beside the text: one curve hanging from the top, swaying from its foot up ----

  vinePlan() {
    if (this._vp) return this._vp;
    const r = this.rng('long-vine'), DH = 72 * 4, ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    const leaves = [], blooms = [], curls = [];
    let y = 5, side = r() < 0.5 ? -1 : 1;
    while (y < DH - 12) {
      const roll = r();
      if (roll < 0.11 && y > 24) blooms.push({ y, side, c: ['#C24E39', '#8A4F98', '#A87400', '#2A7099'][Math.floor(r() * 4)] });
      else if (roll < 0.2) curls.push({ y, side });
      else leaves.push({ y, side, size: 3.6 + r() * 2.6, c: ['#2B7349', '#3F8A52', '#5E8E4A'][Math.floor(r() * 3)] });
      side = -side; y += 6 + Math.floor(r() * 8);
    }
    blooms.push({ y: DH - 6, side: 0, c: '#C24E39' });
    this._vp = { DH, ph, leaves, blooms, curls };
    return this._vp;
  }

  vineX(y) {
    const V = this.vinePlan(), sway = (this.wind() - 0.45) * 2.6 * Math.pow(y / V.DH, 1.4);
    return 16 + 4.2 * Math.sin(y * 0.021 + V.ph[0]) + 2.4 * Math.sin(y * 0.057 + V.ph[1]) + 1.2 * Math.sin(y * 0.13 + V.ph[2]) + sway;
  }

  vineRows() {
    const V = this.vinePlan(), d = this.dots(16, 72), t = this.state.tick;
    let px = Math.round(this.vineX(0));
    for (let y = 0; y < V.DH - 4; y++) {
      const x = Math.round(this.vineX(y));
      if (Math.abs(x - px) === 1 && y > 0) d.put(x, y - 1, '#3F8A52', 1);
      d.put(x, y, '#3F8A52', 1); px = x;
    }
    const tips = [];
    for (const l of V.leaves) {
      const sx = this.vineX(l.y), s = l.side, z = l.size;
      const ang = s * 0.8, cx = sx + s * (1.2 + z * 0.45), cy = l.y + 1.2 + z * 0.42;
      d.put(sx + s, l.y, l.c, 1.5);
      this.oval(d, cx, cy, z * 0.62, 1.15, ang, l.c, 1.5);
      tips.push([cx, cy - 3]);
    }
    for (const c of V.curls) {
      const sx = this.vineX(c.y);
      for (let a = 0; a < 5.4; a += 0.25) { const rr = 2.6 - a * 0.4; d.put(sx + c.side * (2 + rr * Math.cos(a)), c.y + 1 + rr * Math.sin(a) * c.side, '#5E8E4A', 1.2); }
    }
    for (const b of V.blooms) {
      const bx = this.vineX(b.y) + b.side * 3.2, by = b.y + 1;
      if (b.side) this.line(d, this.vineX(b.y), b.y, bx, by, '#3F8A52', 1);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 2 * Math.PI; d.put(bx + Math.cos(a) * 2.1, by + Math.sin(a) * 2.1, b.c, 3); }
      d.put(bx, by, '#A87400', 3.5);
    }
    // The butterfly rests on a leaf and every ~40 s flutters to another; a ladybug climbs the stem;
    // now and then a bee hovers around a bloom. Same timings as the ASCII vine.
    const rest = tips.filter((_, i) => i % 3 === 1 && V.leaves[i].y > 20), cycle = 160, i = Math.floor(t / cycle), p = t % cycle;
    const a = rest[i % rest.length], b = rest[(i + 1) % rest.length];
    let fx, fy, open;
    if (p < 140) { fx = a[0]; fy = a[1]; open = (t % 12) < 8; }
    else { const k = (p - 140) / 20; fx = a[0] + (b[0] - a[0]) * k; fy = a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 12; open = t % 2 === 1; }
    this.butterfly(d, fx, fy, open);
    const span = 2 * (V.DH - 8), q = Math.floor(t * 0.32) % span, ly = 4 + (q < V.DH - 8 ? V.DH - 9 - q : q - (V.DH - 8));
    const lx = this.vineX(ly);
    this.disc(d, lx, ly, 1.3, '#C24E39', 6); d.put(lx, ly + (q < V.DH - 8 ? -2 : 2), '#1F2B23', 6);
    const bl = V.blooms[Math.floor(t / 240) % V.blooms.length];
    if ((t % 240) < 60) {
      const bx = this.vineX(bl.y) + bl.side * 3.2 + Math.sin(t * 0.35) * 6, by = bl.y - 5 + Math.sin(t * 0.22) * 3;
      d.put(bx - 1, by, '#A87400', 6); d.put(bx, by, '#1F2B23', 6); d.put(bx + 1, by, '#A87400', 6); d.put(bx + 2, by, '#1F2B23', 6);
      d.put(bx, by - 1 - (t % 2), '#8C7C66', 6); d.put(bx + 1, by - 1 - ((t + 1) % 2), '#8C7C66', 6);
    }
    return this.braille(d);
  }

  butterfly(d, x, y, open) {
    const W = '#8A4F98';
    for (let k = -1; k <= 1; k++) d.put(x, y + k, '#1F2B23', 6);
    for (const s of [-1, 1]) {
      if (open) for (const [u, v] of [[1, -1], [2, -2], [3, -2], [3, -1], [2, -1], [1, 1], [2, 1], [2, 2]]) d.put(x + s * u, y + v, W, 6);
      else for (const [u, v] of [[1, -1], [1, -2], [2, -2], [1, 1]]) d.put(x + s * u, y + v, W, 6);
    }
  }

  // ---- a heading's tendril: one fine wavy line of dots with the odd leaf and bloom ----

  tendril(seed) {
    this._td = this._td || {};
    if (this._td[seed]) return this._td[seed];
    const r = this.rng(seed), W = 140, d = this.dots(W, 1), ph = r() * 6.28, ph2 = r() * 6.28;
    let last = 0;
    for (let x = 0; x < W * 2; x++) {
      const y = 1.6 + 1.25 * Math.sin(x * 0.19 + ph + 0.8 * Math.sin(x * 0.031 + ph2));
      if (x > 6 && x - last > 9 && r() < 0.06) {
        last = x;
        if (r() < 0.22) { this.disc(d, x + 1, 1.5, 1.05, '#C24E39', 3); x += 2; continue; }
        const up = y > 1.6 ? -1 : 1;
        d.put(x + 1, y + up, '#2B7349', 2); d.put(x + 2, y + up, '#2B7349', 2); d.put(x + 2, y + 2 * up, '#2B7349', 2);
      }
      d.put(x, y, '#3F8A52', 1);
    }
    this._td[seed] = this.braille(d)[0].runs;
    return this._td[seed];
  }

  // ---- the soil under the footer: grass, mushrooms, a ground line, roots and stones ----

  soil() {
    if (this._soil) return this._soil;
    const r = this.rng('roots'), W = 190, d = this.dots(W, 8), DW = W * 2, g = 6;
    for (let x = 0; x < DW; x++) { if (x % 5 !== 4 || r() < 0.4) d.put(x, g, '#7A5C42', 1); if (r() < 0.2) d.put(x, g + 1, '#7A5C42', 1); }
    for (let x = 0; x < DW; x++) if (r() < 0.16) { const h = 1.5 + r() * 3.5, l = (r() - 0.5) * 2; this.line(d, x, g - 1, x + l, g - h, '#5E8E4A', 1); }
    const caps = [];
    for (let i = 0; i < 9; i++) {
      let mx = 8 + Math.floor(r() * (DW - 16));
      while (caps.some((c) => Math.abs(c - mx) < 12)) mx = (mx + 13) % (DW - 16) + 8;
      caps.push(mx);
      const big = r() < 0.4, top = big ? g - 5 : g - 4;
      [[-1, 0, 1], [-2, -1, 0, 1, 2], [-3, -2, -1, 0, 1, 2, 3]].slice(0, big ? 3 : 2).forEach((row, k) => row.forEach((u) => d.put(mx + u, top + k, '#C24E39', 3)));
      for (let y = top + (big ? 3 : 2); y < g; y++) d.put(mx, y, '#A99D84', 3);
    }
    let x0 = 6;
    while (x0 < DW - 6) {
      let x = x0, dx = 0;
      const depth = 10 + Math.floor(r() * 18);
      for (let y = g + 1; y < g + depth && y < 32; y++) {
        dx = Math.max(-0.8, Math.min(0.8, dx + (r() - 0.5) * 0.7)); x += dx;
        d.put(x, y, '#5C4636', 1.5);
        if (r() < 0.12) { const s = r() < 0.5 ? -1 : 1; this.line(d, x, y, x + s * 3, y + 2.5, '#7A5C42', 1); }
      }
      x0 += 12 + Math.floor(r() * 20);
    }
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(r() * DW), y = g + 3 + Math.floor(r() * (29 - g));
      d.put(x, y, '#8C7C66', 1); if (r() < 0.3) { d.put(x + 1, y, '#8C7C66', 1); d.put(x, y + 1, '#8C7C66', 1); d.put(x + 1, y + 1, '#8C7C66', 1); }
    }
    this._soil = this.braille(d);
    return this._soil;
  }

  // ---- the neighbourhood plate ----

  // How large a neighbour's flower is drawn: by how linked it is, like the woodcut's tiers.
  plateK(n) { return n.role === 'self' ? 1.35 : n.stub ? 0.55 : Math.min(1.05, 0.6 + Math.sqrt(n.deg) * 0.14); }

  // A flower's reach in css px, used to keep vines and captions clear of it.
  reach(n) { return n.role === 'self' ? 40 : 26 * this.plateK(n); }

  // The note in the middle as its own flower, the notes it links to on the right on solid vines
  // ending in a leaf-tip, the notes that link here on the left on dotted vines, and notes two steps
  // away as faint small blooms above and below. Hovering a caption brings its vine up in its colour.
  notePlate() {
    const D = this.nd(), W = PCW_, H = PCH_, d = this.dots(W, H), DW = W * 2, DH = H * 4, sx = DW / D.PW, sy = DH / D.PH, hov = this.state.hover;
    const RULE = '#A99D84', grain = this.rng('note-paper');
    for (let k = 0; k < 45; k++) d.put(7 + grain() * (DW - 14), 7 + grain() * (DH - 14), '#D9CFB9', 0.5);
    for (let x = 1; x < DW - 1; x++) { d.put(x, 1, RULE, 1); d.put(x, DH - 2, RULE, 1); if (x % 2 === 0 && x > 3 && x < DW - 4) { d.put(x, 3, RULE, 1); d.put(x, DH - 4, RULE, 1); } }
    for (let y = 1; y < DH - 1; y++) { d.put(1, y, RULE, 1); d.put(DW - 2, y, RULE, 1); if (y % 2 === 0 && y > 3 && y < DH - 4) { d.put(3, y, RULE, 1); d.put(DW - 4, y, RULE, 1); } }
    for (const [cx, cy] of [[1, 1], [DW - 2, 1], [1, DH - 2], [DW - 2, DH - 2]])
      for (const [ex, ey] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) d.put(cx + ex, cy + ey, ex || ey ? '#C24E39' : '#A87400', 4);

    const self = D.nodes[0], x0 = self.x * sx, y0 = self.y * sy;
    D.nodes.slice(1).forEach((n, i) => {
      const x1 = n.x * sx, y1 = n.y * sy, len = Math.hypot(x1 - x0, y1 - y0);
      const bow = (n.y < self.y ? -1 : 1) * n.side * 0.12 * len;
      const qx = (x0 + x1) / 2 - (y1 - y0) / len * bow, qy = (y0 + y1) / 2 + (x1 - x0) / len * bow;
      const pt = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1];
      const hot = hov === i, solid = n.role !== 'in', sp = this.specimen('notes/' + n.slug);
      const c = hot ? sp.petal[1] : solid ? '#2B7349' : '#7E9A73', w = hot ? 2.5 : 1;
      const ra = this.reach(self) * sx + 1.5, rb = this.reach(n) * sx + 1.5;
      let last = '', k = 0;
      for (let s = 0; s <= 600; s++) {
        const [x, y] = pt(s / 600), key = Math.round(x) + ',' + Math.round(y);
        if (key === last) continue;
        last = key; k++;
        if (Math.hypot(x - x0, y - y0) < ra || Math.hypot(x - x1, y - y1) < rb) continue;
        if (solid || hot || k % 2 === 0) d.put(x, y, c, w);
      }
      // A leaf-tip where a link arrives: at the neighbour for links out, at the note for links in.
      const leaf = (t, back) => {
        const [lx, ly] = pt(t), [bx, by] = pt(t + back * 5 / len), nx = -(ly - by), ny = lx - bx, nl = Math.hypot(nx, ny) || 1;
        this.blade(d, bx, by, (bx + lx) / 2 + nx / nl * 1.1, (by + ly) / 2 + ny / nl * 1.1, lx, ly, 1.5, hot ? c : solid ? '#3F8A52' : '#7E9A73', w + 0.5);
      };
      if (n.role !== 'in') leaf(1 - (rb + 0.5) / len, -1);
      if (n.role !== 'out') leaf((ra + 0.5) / len, 1);
    });
    for (const n of D.far) {
      const sp = this.specimen('notes/' + n.slug), c = this.mix(sp.petal[1], 0.5), x = n.x * sx, y = n.y * sy;
      const pat = this.rng('bloom:' + n.slug)() < 0.5 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
      for (const [u, v] of pat) d.put(x + u, y + v, u || v ? c : this.mix(sp.center ? sp.center[1] : sp.petal[1], 0.5), 2);
    }
    for (const n of D.nodes) {
      const sp = this.specimen('notes/' + n.slug), k = this.plateK(n), x = n.x * sx, y = n.y * sy;
      if (n.stub && n.role !== 'self') { this.oval(d, x, y - 0.5, 1.2, 2.2, 0, sp.petal[1], 3); this.line(d, x, y + 1.5, x, y + 3.5, '#5E8E4A', 2); continue; }
      this.head(d, sp, x, y + 5.5 * k, 0, k);
    }
    return this.braille(d);
  }

  // Captions face outward from each flower; their positions are in % so they track the plate as it
  // scales. Each also has a number, used on narrow screens where the captions move below the plate.
  noteCaps() {
    const D = this.nd(), pct = (v, of) => (100 * v / of).toFixed(2) + '%';
    return D.nodes.slice(1).map((n, k) => {
      const r = this.reach(n) * 1.15 + 7;
      return { no: k + 1, title: n.title, how: n.role === 'out' ? 'links to' : n.role === 'in' ? 'linked from' : 'both ways',
        enter: () => this.setState({ hover: k }), leave: () => this.setState({ hover: -1 }),
        style: (n.side > 0 ? 'left: ' + pct(n.x + r, D.PW) + '; text-align: left;' : 'right: ' + pct(D.PW - n.x + r, D.PW) + '; text-align: right;')
          + ' top: ' + pct(n.y, D.PH) + '; max-width: ' + pct((n.side > 0 ? D.PW - n.x : n.x) - r - 24, D.PW) + ';',
        numStyle: 'left: ' + pct(n.x + (n.side > 0 ? r - 2 : -r - 6), D.PW) + '; top: ' + pct(n.y, D.PH) + ';' };
    });
  }

  farSpots() {
    const D = this.nd(), pct = (v, of) => (100 * v / of).toFixed(2) + '%';
    return D.far.map((n) => ({ title: n.title, style: 'left: ' + pct(n.x - 7, D.PW) + '; top: ' + pct(n.y - 7, D.PH) + ';' }));
  }
'''.replace('PCW_', str(PCW)).replace('PCH_', str(PCH)) + f"\n  nd() {{ return {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}; }}\n"

CSS = PAGE_CSS + (
    '.wc-cap{position:absolute;transform:translateY(-50%);font-family:' + MONO.replace("'", '"') + ';font-size:12px;line-height:14px;'
    'padding:1px 3px;background:rgba(241,236,223,0.88);text-decoration:none}\n'
    '.wc-cap:hover,.wc-cap:focus{text-decoration:underline}\n'
    '.wc-num{display:none;position:absolute;transform:translateY(-50%);font-family:' + MONO.replace("'", '"') + ';font-size:11px;color:#535F52}\n'
    '.wc-key{display:none}\n'
    '@media (max-width: 600px){.wc-cap,.wc-head{display:none}.wc-num{display:block}.wc-key{display:block}}\n')

# The plate's braille is sized from the column's width (container query units), so it scales down on a
# phone. Its box is the braille itself, not a fixed aspect ratio: Chrome rounds glyph advances to whole
# pixels at some sizes, and the captions, placed in % of that box, then still sit on their flowers.
PLATE_DOTS = DOTS.replace(f'font-size: {PX:.4f}px; line-height: {PX:.4f}px;', f'font-size: calc(100cqw / {PLATE_EM}); line-height: 1;')
cap = 'hint-placeholder-count="8"'
plate_html = f'''<section aria-label="Neighbourhood" style="margin-top: 64px;">
{trail_heading("Sousedství", "trailC", 0)}
<figure style="margin: 0;">
<div style="width: 100%; max-width: {PW}px; container-type: inline-size;"><div style="position: relative; width: fit-content;">
<div aria-hidden="true" style="{PLATE_DOTS}"><sc-for list="{{{{plate}}}}" as="row" hint-placeholder-count="20"><div style="white-space: pre; height: 1em;"><sc-for list="{{{{row.runs}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></div></sc-for></div>
<span class="wc-head" aria-hidden="true" style="position: absolute; left: 3%; top: 5%; font-family: {MONO}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">linked from</span>
<span class="wc-head" aria-hidden="true" style="position: absolute; right: 3%; top: 5%; font-family: {MONO}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">links to</span>
<sc-for list="{{{{caps}}}}" as="c" {cap}><a class="wc-cap" href="#" onMouseEnter="{{{{c.enter}}}}" onMouseLeave="{{{{c.leave}}}}" onFocus="{{{{c.enter}}}}" onBlur="{{{{c.leave}}}}" style="{{{{c.style}}}}">{{{{c.title}}}}</a><span class="wc-num" aria-hidden="true" style="{{{{c.numStyle}}}}">{{{{c.no}}}}</span></sc-for>
<sc-for list="{{{{far}}}}" as="s" hint-placeholder-count="12"><a href="#" title="{{{{s.title}}}}" aria-label="{{{{s.title}}}}" style="position: absolute; {{{{s.style}}}} width: 14px; height: 14px;"></a></sc-for>
<span aria-hidden="true" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, 34px); font-family: {MONO}; font-size: 12px; font-weight: 600; color: {CANOPY}; background: rgba(241,236,223,0.88); padding: 0 3px;">replikace</span>
</div></div>
<ol class="wc-key" style="margin: 14px 0 0; padding: 0; list-style: none; font-size: 15px;">
<sc-for list="{{{{caps}}}}" as="c" {cap}><li style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px;"><span style="font-family: {MONO}; font-size: 12px; color: {MUTED}; flex: 0 0 16px;">{{{{c.no}}}}</span><span style="min-width: 0;"><a href="#">{{{{c.title}}}}</a> <span style="font-family: {MONO}; font-size: 11px; color: {MUTED}; white-space: nowrap;">· {{{{c.how}}}}</span></span></li></sc-for>
</ol>
<figcaption style="margin-top: 10px; font-family: {MONO}; font-size: 12px; line-height: 1.6; color: {MUTED};">Solid vines ending in a leaf lead to notes this one links to; dotted vines come from notes that link here. The faint blooms above and below are two steps away.</figcaption>
</figure>
</section>'''

VINE = (f'<div class="wide" aria-hidden="true" style="position: absolute; top: 0; left: calc(50% + 404px); pointer-events: none; {DOTS}">'
        f'{rows_loop("vine", 72)}</div>')

inner = note_body + plate_html + f'<div style="margin-top: 56px;">{specimen_card("card", "flower")}</div>'
body = VINE + '\n' + nav('notes') + '\n' + '<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">\n' + inner + '\n</main>\n' + FOOTER
# Every drawn element switches from Plex to the braille dots; the prose and labels are untouched.
art13 = f'font-family: {MONO}; font-size: 13px; line-height: 15px;'
trail14 = f'white-space: pre; font-family: {MONO}; font-size: 14px;'
assert body.count(art13) == 3 and body.count(trail14) == 3, (body.count(art13), body.count(trail14))
body = body.replace(art13, DOTS).replace(trail14, 'white-space: pre; ' + DOTS).replace('white-space: pre; height: 15px;', f'white-space: pre; height: {PX:.4f}px;')

vals = (f"    const card = this.label('notes/{FOCUS}', 'N-' + this.specimen('notes/{FOCUS}').seed.slice(0, 3).toUpperCase(), 'replikace', 'from the notes');\n"
        f"    const flower = this.flowerRows('notes/{FOCUS}');\n"
        f"    return {{ flower, card, vine: this.vineRows(), roots: this.soil(), trailA: this.tendril('a-rep'), trailB: this.tendril('b-rep'), trailC: this.tendril('c-rep'), plate: this.notePlate(), caps: this.noteCaps(), far: this.farSpots() }};")
src = page('replikace', body, component(JS, vals), 2400, CSS, 'cs')
src = src.replace('&amp;display=swap">', '&amp;display=swap">\n' + FONT_LINK, 1)
open('jungle/project/NoteBraille.dc.html', 'w', encoding='utf-8').write(src)
print('NoteBraille', len(nodes) - 1, 'neighbours', len(far), 'far', len(src), 'bytes')

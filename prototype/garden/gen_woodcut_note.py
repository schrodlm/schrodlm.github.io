"""The note page in the woodcut style: replikace, with a small engraved plate of its neighbourhood at
the end of the note, before its specimen card. Writes GraphWoodcutNote."""
import json
import math

from woodcut_sprites import BLOOM_JS

_gg = open('gen_graph.py', encoding='utf-8').read()
exec(_gg[:_gg.index('# ---- variant A')])
exec(_gg[_gg.index('# ---- note pages'):_gg.index('def radial')])   # FOCUS, near_slugs, second, note_body

PW, PH = 702, 300
CX, CY = PW // 2, PH // 2
outs = [s for s in OUT[FOCUS] if s not in INN[FOCUS]]
ins = [s for s in INN[FOCUS] if s not in OUT[FOCUS]]
both = [s for s in OUT[FOCUS] if s in INN[FOCUS]]
title = lambda s: NODES[IDX[s]]['title']

# The notes it links to stand in an arc on the right, the notes that link here on the left (a note
# linked both ways joins the shorter side). Captions face outward, toward the plate's edge.
right = sorted(outs, key=title)
left = sorted(ins, key=title)
(left if len(left) <= len(right) else right).extend(both)
nodes = [{'slug': FOCUS, 'title': title(FOCUS), 'x': CX, 'y': CY, 'deg': DEG[IDX[FOCUS]], 'stub': NODES[IDX[FOCUS]]['stub'], 'role': 'self'}]
for side, col in ((1, right), (-1, left)):
    n = len(col)
    for k, s in enumerate(col):
        y = CY + (k - (n - 1) / 2) * 64
        bulge = 1 - ((y - CY) / 130) ** 2
        x = CX + side * (112 + 30 * bulge)
        role = 'both' if s in both else 'out' if s in outs else 'in'
        nodes.append({'slug': s, 'title': title(s), 'x': round(x), 'y': round(y), 'deg': DEG[IDX[s]], 'stub': NODES[IDX[s]]['stub'], 'role': role, 'side': side})

# Second-degree notes: faint small blooms on an arc above and below, each near the side of the
# neighbour it hangs from.
parent = {}
for s in sorted(second):
    ps = [p for p in near_slugs if IDX[p] in ADJ[IDX[s]]]
    parent[s] = ps[0]
ordered = sorted(second, key=lambda s: (next(n for n in nodes if n['slug'] == parent[s])['side'], next(n for n in nodes if n['slug'] == parent[s])['y'], s))
top, bottom = ordered[::2], ordered[1::2]
far = []
for group, sgn in ((top, -1), (bottom, 1)):
    m = len(group)
    for k, s in enumerate(group):
        a = math.pi * (0.2 + 0.6 * (k + 0.5) / m)
        x = CX - math.cos(a) * 96
        y = CY + sgn * math.sin(a) * 124
        far.append({'slug': s, 'title': title(s), 'x': round(x), 'y': round(y), 'deg': DEG[IDX[s]], 'stub': NODES[IDX[s]]['stub']})

DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'far': far}

JS = BLOOM_JS + r'''
  cfg() { return { cell: 3 }; }
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  // The note's neighbourhood as a small woodcut plate: the note in the middle as a large flower, the
  // notes it links to on the right on solid vines ending in a leaf-tip, the notes that link here on
  // the left on dotted vines, and notes two steps away as faint small blooms above and below.
  notePlate() {
    if (this._np) return this._np;
    const D = this.nd(), C = 3, w = Math.round(D.PW / C), h = Math.round(D.PH / C);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    };
    const SOLID = this.rgb('#2B7349'), DOT = this.rgb('#7E9A73'), RULE = this.rgb('#A99D84'), PAPER = this.rgb('#E6DECB');
    const grain = this.rng('note-paper');
    for (let k = 0; k < w * h * 0.012; k++) set(grain() * w, grain() * h, PAPER);
    for (let x = 2; x < w - 2; x++) { set(x, 2, RULE); if (x % 2 === 0) { set(x, 4, RULE); set(x, h - 5, RULE); } set(x, h - 3, RULE); }
    for (let y = 2; y < h - 2; y++) { set(2, y, RULE); if (y % 2 === 0) { set(4, y, RULE); set(w - 5, y, RULE); } set(w - 3, y, RULE); }
    for (const [cx, cy] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]])
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) set(cx + dx, cy + dy, dx || dy ? this.rgb('#C24E39') : this.rgb('#A87400'));

    const self = D.nodes[0], x0 = self.x / C, y0 = self.y / C;
    for (const n of D.nodes.slice(1)) {
      const x1 = n.x / C, y1 = n.y / C, len = Math.hypot(x1 - x0, y1 - y0);
      const bow = (n.y < self.y ? -1 : 1) * n.side * 0.12 * len;
      const qx = (x0 + x1) / 2 - (y1 - y0) / len * bow, qy = (y0 + y1) / 2 + (x1 - x0) / len * bow;
      const pt = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1];
      const solid = n.role !== 'in', ra = this.reach(self) * 1.15 / C + 3, rb = this.reach(n) / C + 2.5;
      let last = '', k = 0;
      for (let s = 0; s <= 400; s++) {
        const [x, y] = pt(s / 400), key = Math.round(x) + ',' + Math.round(y);
        if (key === last) continue;
        last = key; k++;
        if (Math.hypot(x - x0, y - y0) < ra || Math.hypot(x - x1, y - y1) < rb) continue;
        if (solid || k % 2 === 0) set(x, y, solid ? SOLID : DOT);
      }
      // A leaf-tip where a link arrives: at the neighbour for links out, at the note for links in.
      const tip = (t, toward) => {
        const [lx, ly] = pt(t), [ax, ay] = pt(toward), a = Math.atan2(ay - ly, ax - lx);
        for (const side of [-1, 1]) for (let s = 1; s <= 2; s++)
          set(lx - Math.cos(a + side * 0.75) * s, ly - Math.sin(a + side * 0.75) * s, solid ? SOLID : DOT);
      };
      const tb = 1 - (rb + 0.5) / len, ta = (ra + 0.5) / len;
      if (n.role !== 'in') tip(tb, 1);
      if (n.role !== 'out') tip(ta, 0);
    }
    const paint = (cells) => {
      const own = new Set(cells.map(([x, y]) => x + ',' + y));
      for (const [x, y] of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (!own.has(X + ',' + Y) && X >= 0 && Y >= 0 && X < w && Y < h) d[(Y * w + X) * 4 + 3] = 0;
      }
      for (const [x, y, c] of cells) set(x, y, c);
    };
    // Far notes: the small sprite, its colour washed halfway into the paper.
    const sand = this.rgb('#F1ECDF');
    for (const n of D.far) {
      const cells = this.bloom({ ...n, deg: 1 }, 'rest', Math.round(n.x / C), Math.round(n.y / C));
      paint(cells.map(([x, y, c]) => [x, y, c.map((v, i) => Math.round(v * 0.45 + sand[i] * 0.55))]));
    }
    for (const n of D.nodes.slice(1)) paint(this.bloom(n, 'open', Math.round(n.x / C), Math.round(n.y / C)));
    paint(this.bloom(self, 'focus', Math.round(x0), Math.round(y0)));
    ctx.putImageData(img, 0, 0);
    this._np = cv.toDataURL();
    return this._np;
  }

  // Captions face outward from each flower; their positions are in % so they track the plate as it
  // scales. Each also has a number, used on narrow screens where the captions move below the plate.
  noteCaps() {
    const D = this.nd(), pct = (v, of) => (100 * v / of).toFixed(2) + '%';
    return D.nodes.slice(1).map((n, k) => {
      const r = this.reach(n) * 1.15 + 7;
      return { no: k + 1, title: n.title, how: n.role === 'out' ? 'links to' : n.role === 'in' ? 'linked from' : 'both ways',
        mark: n.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + n.slug),
        style: (n.side > 0 ? 'left: ' + pct(n.x + r, D.PW) + '; text-align: left;' : 'right: ' + pct(D.PW - n.x + r, D.PW) + '; text-align: right;')
          + ' top: ' + pct(n.y, D.PH) + '; max-width: ' + pct((n.side > 0 ? D.PW - n.x : n.x) - r - 24, D.PW) + ';',
        numStyle: 'left: ' + pct(n.x + (n.side > 0 ? r - 2 : -r - 6), D.PW) + '; top: ' + pct(n.y, D.PH) + ';' };
    });
  }

  farSpots() {
    const D = this.nd(), pct = (v, of) => (100 * v / of).toFixed(2) + '%';
    return D.far.map((n) => ({ title: n.title, style: 'left: ' + pct(n.x - 7, D.PW) + '; top: ' + pct(n.y - 7, D.PH) + ';' }));
  }
''' + f"\n  nd() {{ return {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}; }}\n"

CSS = PAGE_CSS + (
    '.wc-cap{position:absolute;transform:translateY(-50%);font-family:' + MONO.replace("'", '"') + ';font-size:12px;line-height:14px;'
    'padding:1px 3px;background:rgba(241,236,223,0.88);text-decoration:none}\n'
    '.wc-cap:hover{text-decoration:underline}\n'
    '.wc-num{display:none;position:absolute;transform:translateY(-50%);font-family:' + MONO.replace("'", '"') + ';font-size:11px;color:#535F52}\n'
    '.wc-key{display:none}\n'
    '@media (max-width: 600px){.wc-cap,.wc-head{display:none}.wc-num{display:block}.wc-key{display:block}}\n')

cap = 'hint-placeholder-count="8"'
plate_html = f'''<section aria-label="Neighbourhood" style="margin-top: 64px;">
{trail_heading("Sousedství", "trailC", 0)}
<figure style="margin: 0;">
<div style="position: relative; width: 100%; max-width: {PW}px; aspect-ratio: {PW} / {PH};">
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated;">
<span class="wc-head" aria-hidden="true" style="position: absolute; left: 3%; top: 5%; font-family: {MONO}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">linked from</span>
<span class="wc-head" aria-hidden="true" style="position: absolute; right: 3%; top: 5%; font-family: {MONO}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">links to</span>
<sc-for list="{{{{caps}}}}" as="c" {cap}><a class="wc-cap" href="#" style="{{{{c.style}}}}">{{{{c.title}}}}</a><span class="wc-num" aria-hidden="true" style="{{{{c.numStyle}}}}">{{{{c.no}}}}</span></sc-for>
<sc-for list="{{{{far}}}}" as="s" hint-placeholder-count="12"><a href="#" title="{{{{s.title}}}}" aria-label="{{{{s.title}}}}" style="position: absolute; {{{{s.style}}}} width: 14px; height: 14px;"></a></sc-for>
<span aria-hidden="true" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, 26px); font-family: {MONO}; font-size: 12px; font-weight: 600; color: {CANOPY}; background: rgba(241,236,223,0.88); padding: 0 3px;">replikace</span>
</div>
<ol class="wc-key" style="margin: 14px 0 0; padding: 0; list-style: none; font-size: 15px;">
<sc-for list="{{{{caps}}}}" as="c" {cap}><li style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px;"><span style="font-family: {MONO}; font-size: 12px; color: {MUTED}; flex: 0 0 16px;">{{{{c.no}}}}</span><span style="min-width: 0;"><a href="#">{{{{c.title}}}}</a> <span style="font-family: {MONO}; font-size: 11px; color: {MUTED}; white-space: nowrap;">· {{{{c.how}}}}</span></span></li></sc-for>
</ol>
<figcaption style="margin-top: 10px; font-family: {MONO}; font-size: 12px; line-height: 1.6; color: {MUTED};">Solid vines ending in a leaf lead to notes this one links to; dotted vines come from notes that link here. The faint blooms above and below are two steps away.</figcaption>
</figure>
</section>'''

inner = note_body + plate_html + f'<div style="margin-top: 56px;">{specimen_card("card", "flower")}</div>'
body = VINE_MARKUP + '\n' + nav('notes') + '\n' + '<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">\n' + inner + '\n</main>\n' + FOOTER
vals = (f"    const card = this.label('notes/{FOCUS}', 'N-' + this.specimen('notes/{FOCUS}').seed.slice(0, 3).toUpperCase(), 'replikace', 'from the notes');\n"
        f"    return {{ flower: this.specimenRows('notes/{FOCUS}'), card, vine: this.vine(), bugs: this.bugs(), roots: this.roots(), trailA: this.trail('a-rep'), trailB: this.trail('b-rep'), trailC: this.trail('c-rep'), plate: this.notePlate(), caps: this.noteCaps(), far: this.farSpots() }};")
src = page('replikace', body, component(JS_VINE + JS, vals), 2400, CSS, 'cs')
open('jungle/project/GraphWoodcutNote.dc.html', 'w', encoding='utf-8').write(src)
print('GraphWoodcutNote', len(nodes) - 1, 'neighbours', len(far), 'far')

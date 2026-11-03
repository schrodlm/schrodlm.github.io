"""Graph view, readable meadows: every community of notes is its own dithered meadow, laid out side by side."""
import json
import math

_gsrc = open('gen_graph.py', encoding='utf-8').read()
exec(_gsrc[:_gsrc.index('# ---- variant A')])
from meadow_comm import louvain

PW = 1170
GAP = 26           # clear sand between two meadows' boxes
NAME_H = 24        # band at a meadow's top edge for its name

# ---- meadows: communities found by modularity; tiny clumps share one hedgerow meadow
linked = [i for i in range(len(NODES)) if ADJ[i]]
comms = louvain(linked, EDGES)
meadows, clumps = [], []
for g in comms:
    (meadows if len(g) >= 5 else clumps).append(g)
inner = lambda i, g: len([j for j in ADJ[i] if j in g])

# Which connected piece each note is in, so meadows that grow together sit together.
piece, seen = {}, set()
for i in linked:
    if i in seen:
        continue
    st = [i]; seen.add(i)
    while st:
        x = st.pop(); piece[x] = i
        for y in ADJ[x]:
            if y not in seen:
                seen.add(y); st.append(y)
piece_size = collections.Counter(piece.values())

TONES = ['#3F8A52', '#2A7099', '#A87400', '#7A5C42', '#8A4F98', '#5E8E4A']


def box_for(n):
    w = int(74 * math.sqrt(n) + 120)
    h = int(50 * math.sqrt(n) + 70) + NAME_H
    return w, h


specs = []
for k, g in enumerate(meadows):
    gs = set(g)
    hub = max(g, key=lambda i: (inner(i, gs), DEG[i], -len(NODES[i]['title'])))
    w, h = box_for(len(g))
    specs.append({'ids': g, 'hub': hub, 'name': NODES[hub]['title'], 'w': w, 'h': h, 'piece': piece[g[0]]})
if clumps:
    ids = [i for c in clumps for i in c]
    w, h = box_for(len(ids))
    specs.append({'ids': ids, 'hub': None, 'name': 'small clumps', 'w': w, 'h': h, 'piece': -1, 'clumps': clumps})

# Order: the big connected field first, so its meadows sit side by side, then the rest by size.
specs.sort(key=lambda s: (s['piece'] == -1, -piece_size.get(s['piece'], 0), s['piece'], -len(s['ids'])))
for k, s in enumerate(specs):
    s['tone'] = TONES[k % len(TONES)]

# Justified rows, like a gallery wall: each meadow wants an area proportional to its notes; a row
# takes meadows while every one of them stays comfortably wide, then the row is stretched to the
# full width, so meadows tile the plate with even gaps and no holes.
PER_NOTE, BASE = 5600, 24000
area = lambda s: PER_NOTE * len(s['ids']) + BASE
rows, cur = [], []
rowH = lambda r: sum(area(t) for t in r) / (PW - GAP * (len(r) - 1))
for s in specs:
    if cur and (rowH(cur) >= 250 or rowH(cur + [s]) > 330):
        rows.append(cur); cur = []
    cur.append(s)
if rows and rowH(cur) < 200 and rowH(rows[-1] + cur) <= 360:
    rows[-1] += cur
else:
    rows.append(cur)
y = 0
for row in rows:
    avail = PW - GAP * (len(row) - 1)
    H_ = max(200, sum(area(t) for t in row) / avail)
    x = 0
    for t in row:
        t['x'], t['y'], t['w'], t['h'] = round(x), round(y), round(area(t) / sum(area(q) for q in row) * avail), round(H_)
        x += t['w'] + GAP
    row[-1]['w'] = PW - row[-1]['x']
    y += H_ + GAP
PH = round(y - GAP) + 4

# Each meadow lays out its own notes.
pos = {}
for k, s in enumerate(specs):
    ix, iy, iw, ih = s['x'] + 30, s['y'] + NAME_H + 14, s['w'] - 60, s['h'] - NAME_H - 28
    if 'clumps' in s:
        cs = s['clumps']; cols = 3
        cw, ch = iw / cols, ih / math.ceil(len(cs) / cols)
        for j, c in enumerate(cs):
            cx, cy = ix + (j % cols) * cw, iy + (j // cols) * ch
            lay = force(c, cw, ch, 'clump-%d' % j, iters=200, gravity=0.6, spread=0.6)
            for i, (px, py) in lay.items():
                pos[i] = (cx + cw * 0.15 + px * 0.7, cy + ch * 0.15 + py * 0.7)
    else:
        lay = force(s['ids'], iw, ih, 'meadow-%d' % k, iters=400, gravity=0.3, spread=1.1)
        for i, (px, py) in lay.items():
            pos[i] = (ix + px, iy + py)

MEADOW_OF = {i: k for k, s in enumerate(specs) for i in s['ids']}
nodes = []
for i, n in enumerate(NODES):
    x, y = pos.get(i, (-1, -1))
    m = MEADOW_OF.get(i, -1)
    nodes.append({'slug': n['slug'], 'title': n['title'], 'x': round(x), 'y': round(y), 'deg': DEG[i],
                  'ideg': inner(i, set(specs[m]['ids'])) if m >= 0 else 0, 'stub': n['stub'], 'wild': not ADJ[i], 'm': m})
mead = [{'x': s['x'], 'y': s['y'], 'w': s['w'], 'h': s['h'], 'name': s['name'], 'n': len(s['ids']),
         'tone': s['tone'], 'hub': s['hub'] if s['hub'] is not None else -1} for s in specs]
DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'edges': EDGES, 'out': OUT, 'inn': INN, 'meadows': mead}

JS = r'''
  // The garden map as meadows. Every community of notes is a soft dithered patch of ground in a
  // light garden tone, its name at its edge; inside, notes are little dithered blossoms in their
  // flower's petal colour. Links inside a meadow are fine stippled vines; links between meadows
  // appear only when a note is hovered or kept, together with its neighbours.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  mix(a, b, t) { return [0, 1, 2].map((k) => Math.round(a[k] * (1 - t) + b[k] * t)); }

  focus() { const h = this.state.hover, s = this.state.sel; return h >= 0 ? h : s; }

  near(f) {
    const D = this.data(), out = new Set();
    if (f >= 0) for (const [a, b] of D.edges) { if (a === f) out.add(b); if (b === f) out.add(a); }
    return out;
  }

  // The ground: built once. A density field around each meadow's notes, dithered with a 4×4 Bayer
  // matrix, so each meadow is an organic patch that thins out to bare sand at its edge.
  ground() {
    if (this._ground) return this._ground;
    const D = this.data(), C = 3, w = Math.ceil(D.PW / C), h = Math.ceil(D.PH / C);
    const SAND = this.rgb('#F1ECDF'), B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const px = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { px[i * 4] = SAND[0]; px[i * 4 + 1] = SAND[1]; px[i * 4 + 2] = SAND[2]; px[i * 4 + 3] = 255; }
    D.meadows.forEach((m, k) => {
      const ids = D.nodes.map((n, i) => i).filter((i) => D.nodes[i].m === k);
      const tone = this.rgb(m.tone), dot = this.mix(SAND, tone, 0.32), deep = this.mix(SAND, tone, 0.5);
      const x0 = Math.floor(m.x / C), x1 = Math.ceil((m.x + m.w) / C), y0 = Math.floor((m.y + 20) / C), y1 = Math.ceil((m.y + m.h) / C);
      const S = 27 / C, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        let f = 0;
        for (const i of ids) {
          const n = D.nodes[i], dx = x - n.x / C, dy = y - n.y / C;
          f += Math.exp(-(dx * dx + dy * dy) / (2 * S * S));
        }
        // a soft oval vignette keeps each patch inside its own plot of sand
        const q = Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
        const vig = Math.max(0, Math.min(1, (1.25 - q) * 2.2));
        const v = Math.min(1, f * 0.55) * vig;
        const th = B[(y & 3) * 4 + (x & 3)];
        if (v * 16 * 0.5 > th + 0.5) {
          const c = (v > 0.85 && th < 1) ? deep : dot, o = (y * w + x) * 4;
          px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
        }
      }
    });
    this._ground = { w, h, C, px };
    return this._ground;
  }

  plate() {
    const D = this.data(), f = this.focus();
    if (this._plateKey === f && this._plate) return this._plate;
    const G = this.ground(), C = G.C, w = G.w, h = G.h;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    d.set(G.px);
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const SAND = this.rgb('#F1ECDF');
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    };
    // when a note is in focus, the rest of the plate steps back: a sand wash over everything
    if (f >= 0) for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      for (let k = 0; k < 3; k++) d[o + k] = Math.round(d[o + k] * 0.45 + SAND[k] * 0.55);
    }
    const lit = this.near(f);
    const VINE = this.rgb('#7E9874'), VINE_ON = this.rgb('#2B7349');
    // a vine: a gently bowed curve; at rest stippled and fine, in focus solid and two cells wide
    const vine = (A, Bn, on, density, col) => {
      const ax = A.x / C, ay = A.y / C, bx = Bn.x / C, by = Bn.y / C;
      const len = Math.hypot(bx - ax, by - ay) || 1, bow = Math.min(18, len * 0.12);
      const mx = (ax + bx) / 2 - (by - ay) / len * bow, my = (ay + by) / 2 + (bx - ax) / len * bow;
      const n = Math.ceil(len * 1.4);
      for (let k = 0; k <= n; k++) {
        const t = k / n, u = 1 - t;
        const x = Math.round(u * u * ax + 2 * u * t * mx + t * t * bx), y = Math.round(u * u * ay + 2 * u * t * my + t * t * by);
        if (on) { set(x, y, col); }
        else if (B[(y & 3) * 4 + (x & 3)] < density) set(x, y, col);
      }
    };
    if (f < 0) {
      for (const [a, b] of D.edges) if (D.nodes[a].m === D.nodes[b].m) vine(D.nodes[a], D.nodes[b], false, 4, VINE);
    } else {
      for (const [a, b] of D.edges) if (a === f || b === f) vine(D.nodes[a], D.nodes[b], true, 16, VINE_ON);
    }
    // blossoms: a dithered five-petal flower, bigger with more links, centre in its centre colour
    D.nodes.forEach((n, i) => {
      if (n.wild) return;
      const dim = f >= 0 && i !== f && !lit.has(i);
      const sp = this.specimen('notes/' + n.slug);
      let col = this.rgb(n.stub ? '#5E8E4A' : sp.petal[1]);
      if (dim) col = this.mix(col, SAND, 0.8);
      const R = (n.deg >= 10 ? 4.4 : n.deg >= 6 ? 3.6 : n.deg >= 3 ? 2.8 : 2.0) + (i === f ? 1.2 : 0);
      const cx = Math.round(n.x / C), cy = Math.round(n.y / C);
      const petals = 5, pr = R * 0.55, rot = (n.slug.length % 5) * 0.4;
      for (let y = Math.floor(cy - R - 2); y <= cy + R + 2; y++) for (let x = Math.floor(cx - R - 2); x <= cx + R + 2; x++) {
        const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
        let inside = r <= R * 0.45;
        for (let p = 0; p < petals && !inside; p++) {
          const a = rot + p * 2 * Math.PI / petals, px = Math.cos(a) * R * 0.62, py = Math.sin(a) * R * 0.62;
          if (Math.hypot(dx - px, dy - py) <= pr) inside = true;
        }
        if (inside) set(x, y, col);
        // a ring of stipple round the note in focus
        if (i === f && r > R + 1.2 && r <= R + 2.6 && B[(y & 3) * 4 + (x & 3)] < 10) set(x, y, this.rgb('#1F2B23'));
      }
      if (!dim && !n.stub && sp.center && R >= 2.8) {
        const cc = this.rgb(sp.center[1]);
        set(cx, cy, cc); if (R >= 3.6) { set(cx + 1, cy, cc); set(cx, cy + 1, cc); set(cx + 1, cy + 1, cc); }
      }
    });
    ctx.putImageData(img, 0, 0);
    this._plateKey = f;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  short(t, max) { return t.length > max ? t.slice(0, max - 1) + '…' : t; }

  // Meadow names sit at the top edge of their patch.
  names() {
    const D = this.data(), f = this.focus(), lit = this.near(f);
    const fm = f >= 0 ? D.nodes[f].m : -1;
    const touched = new Set([fm]);
    lit.forEach((i) => touched.add(D.nodes[i].m));
    return D.meadows.map((m, k) => {
      const tail = ' · ' + m.n, room = Math.floor((m.w - 40) / 7.25) - tail.length;
      return { t: this.short(m.name, room), n: tail, left: (m.x + 20) + 'px', top: (m.y + 4) + 'px',
        color: this.mix(this.rgb(m.tone), [31, 43, 35], 0.35).join(','), op: f < 0 || touched.has(k) ? '1' : '0.45' };
    });
  }

  labels() {
    const D = this.data(), f = this.focus(), lit = this.near(f);
    const boxes = [], out = [];
    const hit = (b) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    // meadow names are fixed obstacles
    D.meadows.forEach((m) => {
      const tail = ' · ' + m.n, room = Math.floor((m.w - 40) / 7.25) - tail.length;
      boxes.push({ x: m.x + 18, y: m.y + 2, w: (this.short(m.name, room).length + tail.length) * 7.25 + 6, h: 20 });
    });
    // every visible blossom is an obstacle too, so no label hides a flower
    D.nodes.forEach((n, i) => { if (!n.wild && (f < 0 || i === f || lit.has(i))) boxes.push({ x: n.x - 6, y: n.y - 6, w: 12, h: 12 }); });
    let want;
    if (f < 0) {
      // at rest: each meadow's hub, then its best-linked notes, as many as fit inside the meadow
      want = D.nodes.map((n, i) => ({ n, i })).filter(({ n }) => !n.wild && (n.ideg >= 3 || n.deg >= 5 || D.meadows[n.m].n <= 7 || D.meadows[n.m].hub < 0))
        .sort((a, b) => (D.meadows[b.n.m].hub === b.i) - (D.meadows[a.n.m].hub === a.i) || b.n.ideg - a.n.ideg || b.n.deg - a.n.deg);
    } else {
      want = [{ n: D.nodes[f], i: f }].concat([...lit].map((i) => ({ n: D.nodes[i], i })).sort((a, b) => b.n.deg - a.n.deg));
    }
    for (const { n, i } of want) {
      const isF = i === f, fs = isF ? 13 : 12, cw = isF ? 7.9 : 7.25;
      const t = this.short(n.title, isF ? 44 : (f >= 0 ? 26 : 30)), w = t.length * cw + 8, h = 17;
      const tries = [[n.x + 9, n.y - 9], [n.x - 9 - w, n.y - 9], [n.x - w / 2, n.y - 26], [n.x - w / 2, n.y + 9],
        [n.x + 9, n.y - 22], [n.x + 9, n.y + 4], [n.x - 9 - w, n.y - 22], [n.x - 9 - w, n.y + 4], [n.x - w / 2, n.y - 40], [n.x - w / 2, n.y + 24], [n.x - w + 8, n.y - 27], [n.x - w + 8, n.y + 10], [n.x - 8, n.y - 27], [n.x - 8, n.y + 10]];
      const m = D.meadows[n.m];
      const inBox = (b) => f >= 0 || (b.x >= m.x + 4 && b.x + b.w <= m.x + m.w - 4 && b.y >= m.y + 20 && b.y + b.h <= m.y + m.h);
      const ok = (b) => b.x >= 0 && b.x + b.w <= D.PW && b.y >= 0 && b.y + b.h <= D.PH && !hit(b);
      const cand = tries.map(([x, y]) => ({ x, y, w, h }));
      // a hub may step outside its meadow if it must: it is the one label a meadow cannot lose
      const spot = cand.find((b) => ok(b) && inBox(b)) || ((f < 0 && m.hub === i) || i === f ? cand.find(ok) : null);
      if (!spot) continue;
      boxes.push(spot);
      const hub = f < 0 && m.hub === i;
      out.push({ t, left: Math.round(spot.x) + 'px', top: Math.round(spot.y) + 'px', size: fs + 'px',
        color: isF ? '#2B7349' : (f >= 0 ? '#1F2B23' : (hub ? '#1F2B23' : '#535F52')), weight: isF ? '600' : (hub ? '500' : '400'),
        bg: f >= 0 ? 'rgba(241,236,223,0.92)' : 'rgba(241,236,223,0.7)' });
    }
    return out;
  }

  spots() {
    const D = this.data();
    return D.nodes.map((n, i) => ({ n, i })).filter(({ n }) => !n.wild).map(({ n, i }) => ({
      aria: n.title, left: (n.x - 10) + 'px', top: (n.y - 10) + 'px',
      enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 }),
      pick: () => this.setState({ sel: this.state.sel === i ? -1 : i }) }));
  }

  wildflowers() {
    return this.data().nodes.filter((n) => n.wild).map((n) => ({ title: n.title, mark: n.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + n.slug) }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug), m = D.meadows[n.m];
    const near = (list) => list.map((slug) => { const x = D.nodes.find((q) => q.slug === slug); return { title: x ? x.title : slug, mark: x ? this.mark('notes/' + x.slug) : [] }; });
    // the card hangs just below the note's meadow (or above it, for the last row), so it never
    // hides the meadow it is about; it takes the side with fewer of the note's neighbours
    const nb = [...this.near(s)].map((i) => D.nodes[i].y);
    const room = m.y + m.h + 280 < D.PH, above = m.y > 0;
    const below = room && (!above || nb.filter((y) => y > m.y + m.h).length <= nb.filter((y) => y < m.y).length);
    const left = Math.max(0, Math.min(D.PW - 920, n.x - 320)) + 'px';
    return { show: true, left, top: below ? (m.y + m.h + 2) + 'px' : 'auto', bottom: below ? 'auto' : (D.PH - m.y + 2) + 'px',
      close: () => this.setState({ sel: -1 }), title: n.title, latin: n.stub ? 'a seedling, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      meadow: 'grows in the meadow of ' + m.name, outs: near(D.out[n.slug] || []), ins: near(D.inn[n.slug] || []) };
  }
'''
JS += f"\n  data() {{ return this._d || (this._d = {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}); }}\n"

mark_loop = (f'<span aria-hidden="true" style="width: 34px; flex: none; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>')
near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 8px; align-items: baseline;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for>')
n_mead = len(specs)
field = [s for s in specs if s['piece'] == specs[0]['piece']]
field_n = sum(len(s['ids']) for s in field)
WORDS = {2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'}
n_linked = len(linked)
body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">Every note, and how they connect</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">The garden map</h1>
<p style="margin: 0 0 26px; color: {MUTED}; max-width: 72ch;">My notes grow in {n_mead} meadows, one for each patch of notes that link mostly among themselves. Each flower is a note, sized by its links. The first {WORDS.get(len(field), len(field))} meadows grow into each other, one field of {field_n} notes. Hover a flower to see what it links to, even across meadows; click it to keep it.</p>
<div style="overflow-x: auto;"><div style="position: relative; width: {PW}px; height: {PH}px;">
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; image-rendering: pixelated;">
<sc-for list="{{{{names}}}}" as="m" hint-placeholder-count="12"><span aria-hidden="true" style="position: absolute; left: {{{{m.left}}}}; top: {{{{m.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: 12px; line-height: 16px; letter-spacing: 0.02em; color: rgb({{{{m.color}}}}); opacity: {{{{m.op}}}}; pointer-events: none;"><span style="font-weight: 600;">{{{{m.t}}}}</span><span style="opacity: 0.75;">{{{{m.n}}}}</span></span></sc-for>
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="8"><span aria-hidden="true" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: {{{{l.size}}}}; line-height: 17px; padding: 0 4px; background: {{{{l.bg}}}}; color: {{{{l.color}}}}; font-weight: {{{{l.weight}}}}; pointer-events: none;">{{{{l.t}}}}</span></sc-for>
<sc-for list="{{{{spots}}}}" as="s" hint-placeholder-count="20"><button type="button" aria-label="{{{{s.aria}}}}" onMouseEnter="{{{{s.enter}}}}" onMouseLeave="{{{{s.leave}}}}" onFocus="{{{{s.enter}}}}" onBlur="{{{{s.leave}}}}" onClick="{{{{s.pick}}}}" style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer;"></button></sc-for>
<div aria-live="polite"><sc-if value="{{{{panel.show}}}}" hint-placeholder-val="{{{{false}}}}"><div style="position: absolute; left: {{{{panel.left}}}}; top: {{{{panel.top}}}}; bottom: {{{{panel.bottom}}}}; width: 920px; box-sizing: border-box; display: flex; gap: 18px 28px; align-items: flex-end; padding: 20px 24px; background: #F7F2E4; border: 1px solid #D8CFBA; box-shadow: 0 6px 0 -2px rgba(92,70,54,0.10);">
<button type="button" aria-label="Close" onClick="{{{{panel.close}}}}" style="position: absolute; right: 8px; top: 6px; border: 0; background: transparent; font-family: {MONO}; font-size: 16px; color: {MUTED}; cursor: pointer;">×</button>
<div aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop("panel.flower", 12)}</div>
<div style="flex: 0 1 190px; min-width: 0;"><div style="font-family: {SERIF}; font-style: italic; font-size: 15px; color: {MUTED};">{{{{panel.latin}}}}</div><a href="#" style="font-family: {MONO}; font-size: 22px; font-weight: 600;">{{{{panel.title}}}}</a><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-top: 4px;">{{{{panel.meadow}}}}</div></div>
<div style="flex: 1 1 0; align-self: flex-start; min-width: 0; font-size: 14px; line-height: 1.5;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">links to</div>{near('outs')}</div>
<div style="flex: 1 1 0; align-self: flex-start; min-width: 0; font-size: 14px; line-height: 1.5;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">linked from</div>{near('ins')}</div>
</div></sc-if>
</div>
</div></div>
<h2 style="margin: 44px 0 14px; font-family: {MONO}; font-size: 15px; font-weight: 600; color: {MUTED};">wildflowers, not linked yet · {len(NODES) - n_linked}</h2>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px 24px; font-size: 15px;"><sc-for list="{{{{wild}}}}" as="m" hint-placeholder-count="12"><div style="display: flex; gap: 8px; align-items: baseline; min-width: 0;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for></div>
</main>
{FOOTER}'''
vals = "    return { plate: this.plate(), names: this.names(), labels: this.labels(), spots: this.spots(), panel: this.panel(), wild: this.wildflowers(), roots: this.roots() };"
comp = component(JS, vals).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, sel: -1 };')
height = PH + 1150
src = page('Graph meadows', body, comp, height, PAGE_CSS)
open('jungle/project/GraphMeadows.dc.html', 'w', encoding='utf-8').write(src)
print('GraphMeadows.dc.html', height, 'PH', PH, 'meadows', [(s['name'][:20], len(s['ids']), s['x'], s['y'], s['w'], s['h']) for s in specs])

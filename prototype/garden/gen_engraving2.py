"""Graph view, engraved (round 2): the garden map as a botanical plate, with a calmer centre and the
unlinked notes growing on the plate as wildflowers. Writes GraphEngraving2 (2-px cells, hatched shade)
and GraphEngraving3 (3-px cells, cross-hatched shade, heavier outlines)."""
import json
import math
import random

_src = open('gen_graph.py', encoding='utf-8').read()
exec(_src[:_src.index('# ---- variant A')])

PW, PH = 1170, 1040
MARGIN = 40
CLUSTER_GAP = 40

# ---- the backbone: per cluster, the maximum spanning tree weighted towards hub-to-hub links. It is
# what the plate draws at rest; the remaining links (the ones that close loops) stay faint until hover.
linked = [i for i in range(len(NODES)) if ADJ[i]]
parent = {i: i for i in linked}


def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]
        i = parent[i]
    return i


BACKBONE = set()
for a, b in sorted(EDGES, key=lambda e: (-DEG[e[0]] * DEG[e[1]], e)):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb
        BACKBONE.add((a, b))

seen, comps = set(), []
for i in linked:
    if i in seen:
        continue
    st, comp = [i], []
    seen.add(i)
    while st:
        a = st.pop(); comp.append(a)
        for b in ADJ[a]:
            if b not in seen:
                seen.add(b); st.append(b)
    comps.append(sorted(comp))
comps.sort(key=lambda c: -len(c))


def wforce(ids, w, h, seed, iters=600, gravity=0.5, spread=0.8):
    """Fruchterman-Reingold where backbone links pull fully and loop-closing links only lightly, and
    hubs push harder, so the centre of a cluster opens up."""
    r = random.Random(seed)
    pos = {i: [r.uniform(0.2, 0.8) * w, r.uniform(0.2, 0.8) * h] for i in ids}
    k = spread * math.sqrt(w * h / max(1, len(ids)))
    temp = w / 8
    ids = list(ids)
    es = [(a, b, 1.0 if (a, b) in BACKBONE else 0.8) for a, b in EDGES if a in pos and b in pos]
    for _ in range(iters):
        disp = {i: [0.0, 0.0] for i in ids}
        for ai in range(len(ids)):
            a = ids[ai]
            for bi in range(ai + 1, len(ids)):
                b = ids[bi]
                dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
                d = math.hypot(dx, dy) or 0.01
                f = k * k / d
                disp[a][0] += dx / d * f; disp[a][1] += dy / d * f
                disp[b][0] -= dx / d * f; disp[b][1] -= dy / d * f
        for a, b, wt in es:
            dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
            d = math.hypot(dx, dy) or 0.01
            f = d * d / k * wt
            disp[a][0] -= dx / d * f; disp[a][1] -= dy / d * f
            disp[b][0] += dx / d * f; disp[b][1] += dy / d * f
        for i in ids:
            g = gravity * (1 + DEG[i] / 3)  # hubs are drawn to the middle, leaves settle round them
            disp[i][0] += (w / 2 - pos[i][0]) * g
            disp[i][1] += (h / 2 - pos[i][1]) * g
            d = math.hypot(*disp[i]) or 0.01
            pos[i][0] += disp[i][0] / d * min(d, temp)
            pos[i][1] += disp[i][1] / d * min(d, temp)
        temp *= 0.99
    return pos


def relax(pos, ids, rounds=300):
    """Keep flowers apart by a gap that grows with both flowers' links, so hubs get room."""
    for _ in range(rounds):
        moved = False
        for ai in range(len(ids)):
            for bi in range(ai + 1, len(ids)):
                a, b = ids[ai], ids[bi]
                gap = 22 + 6 * (math.sqrt(DEG[a]) + math.sqrt(DEG[b]))
                dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
                d = math.hypot(dx, dy)
                if d < gap:
                    if d < 0.01:
                        dx, dy, d = 1.0, 0.0, 1.0
                    push = (gap - d) / 2
                    pos[a][0] += dx / d * push; pos[a][1] += dy / d * push
                    pos[b][0] -= dx / d * push; pos[b][1] -= dy / d * push
                    moved = True
        if not moved:
            break


placed, rects = {}, []
for ci, comp in enumerate(comps):
    n = len(comp)
    if n == 2:
        a, b = comp
        local = {a: [0.0, 0.0], b: [54.0, 18.0 * (1 if ci % 2 else -1)]}
    else:
        side = 60 * math.sqrt(n)
        local = wforce(comp, side * 1.2, side, 'engraving2-%d' % ci)
        # Normalise to the box, then open up.
        xs = [p[0] for p in local.values()]; ys = [p[1] for p in local.values()]
        sx = side * 1.2 / max(1, max(xs) - min(xs)); sy = side / max(1, max(ys) - min(ys))
        s = min(sx, sy)
        local = {i: [(p[0] - min(xs)) * s, (p[1] - min(ys)) * s] for i, p in local.items()}
        relax(local, comp)
    best = None
    for shrink in (1.0, 0.94, 0.88, 0.82, 0.76, 0.7, 0.64):
        xs = [p[0] * shrink for p in local.values()]; ys = [p[1] * shrink for p in local.values()]
        x0, y0, cw, chh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
        tx, ty = (PW * 0.36, PH * 0.5) if ci == 0 else (PW * 0.5, PH * 0.5)
        for gy in range(MARGIN, int(PH - MARGIN - chh) + 1, 6):
            for gx in range(MARGIN + 10, int(PW - MARGIN - 10 - cw) + 1, 6):
                r = (gx - CLUSTER_GAP, gy - CLUSTER_GAP, gx + cw + CLUSTER_GAP, gy + chh + CLUSTER_GAP)
                if any(r[0] < o[2] and r[2] > o[0] and r[1] < o[3] and r[3] > o[1] for o in rects):
                    continue
                d = math.hypot(gx + cw / 2 - tx, (gy + chh / 2 - ty) * 1.3)
                if best is None or d < best[0]:
                    best = (d, gx, gy)
        if best:
            break
    if best is None:
        raise SystemExit('cluster %d of %d does not fit' % (ci, n))
    print('cluster', n, round(cw), round(chh), shrink)
    _, gx, gy = best
    rects.append((gx, gy, gx + cw, gy + chh))
    for i, p in local.items():
        placed[i] = (p[0] * shrink - x0 + gx, p[1] * shrink - y0 + gy)

# ---- wildflowers: the unlinked notes grow in the open ground, each as far from everything else as
# it can get (farthest-point sampling), so they settle into the margins and the gaps between beds.
wild = [i for i in range(len(NODES)) if not ADJ[i]]
pts = list(placed.values())
cands = [(x, y) for x in range(MARGIN + 26, PW - MARGIN - 26, 8) for y in range(MARGIN + 24, PH - MARGIN - 20, 8)
         if not any(o[0] - 18 < x < o[2] + 18 and o[1] - 18 < y < o[3] + 18 for o in rects)]
for i in sorted(wild, key=lambda i: NODES[i]['slug']):
    best = max(cands, key=lambda c: min(math.hypot(c[0] - p[0], (c[1] - p[1]) * 1.2) for p in pts))
    placed[i] = best
    pts.append(best)

nodes = []
for i, nd in enumerate(NODES):
    x, y = placed[i]
    nodes.append({'slug': nd['slug'], 'title': nd['title'], 'x': round(x), 'y': round(y), 'deg': DEG[i], 'stub': nd['stub'], 'wild': not ADJ[i]})
lead = {max(c, key=lambda i: DEG[i]) for c in comps if len(c) >= 5}
edges = [[a, b, 1 if (a, b) in BACKBONE else 0] for a, b in EDGES]
DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'edges': edges, 'out': OUT, 'inn': INN, 'lead': sorted(lead)}

JS = r'''
  // The garden map as an engraved plate. Each linked note is a flower seen from above: petals outlined
  // and stippled inside, their count and size growing with its links; notes not written yet are buds.
  // Each unlinked note is a wildflower standing on its own stem in the open ground. At rest the plate
  // draws only the backbone of vines (the strongest tree through each bed); the other vines are a
  // faint trace until a flower is hovered, when all its vines are drawn solid and its neighbours open.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  focus() { return this.state.hover >= 0 ? this.state.hover : this.state.sel; }

  near(f) {
    const D = this.data(), s = new Set();
    if (f >= 0) for (const [a, b] of D.edges) { if (a === f) s.add(b); if (b === f) s.add(a); }
    return s;
  }

  // A flower's petal reach in css px, before it opens.
  reach(n) { return (n.wild ? 5 : n.stub ? 5 : 3.2 + Math.min(12, Math.sqrt(n.deg) * 3.3)) * this.cfg().size; }

  plate() {
    const D = this.data(), f = this.focus(), K = this.cfg();
    if (this._plateKey === f && this._plate) return this._plate;
    const C = K.cell, w = Math.round(D.PW / C), h = Math.round(D.PH / C);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const bay = (x, y) => B[((y | 0) & 3) * 4 + ((x | 0) & 3)];
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    };
    const near = this.near(f), on = (i) => f < 0 || i === f || near.has(i);
    const VINE = this.rgb('#86A07A'), VINE_ON = this.rgb('#2B7349'), PALE = this.rgb('#CBC1A8'), GHOST = this.rgb('#D6CDB7');
    const LEAF = this.rgb('#3F8A52'), SHADE = this.rgb('#D6CBB3'), MOSS = this.rgb('#5E8E4A'), PAPER = this.rgb('#E6DECB');
    const RULE = this.rgb('#A99D84'), INKC = this.rgb('#1F2B23');

    // Paper: a sparse, fixed speckle, like the grain of an old plate.
    const grain = this.rng('paper');
    for (let k = 0; k < w * h * 0.012; k++) set(grain() * w, grain() * h, PAPER);
    // The plate mark: a neat double rule with a small bloom in each corner.
    const m1 = Math.round(6 / C * 2), m2 = m1 + Math.max(2, Math.round(5 / C));
    for (let x = m1; x < w - m1; x++) { set(x, m1, RULE); set(x, h - 1 - m1, RULE); }
    for (let y = m1; y < h - m1; y++) { set(m1, y, RULE); set(w - 1 - m1, y, RULE); }
    for (let x = m2; x < w - m2; x++) if (x % 2 === 0) { set(x, m2, RULE); set(x, h - 1 - m2, RULE); }
    for (let y = m2; y < h - m2; y++) if (y % 2 === 0) { set(m2, y, RULE); set(w - 1 - m2, y, RULE); }
    for (const [cx, cy] of [[m1, m1], [w - 1 - m1, m1], [m1, h - 1 - m1], [w - 1 - m1, h - 1 - m1]]) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) set(cx + dx, cy + dy, dx || dy ? this.rgb('#C24E39') : this.rgb('#A87400'));
    }

    // Engraved shade: diagonal hatching (or cross-hatching) in a crescent to the lower right.
    D.nodes.forEach((n, i) => {
      if (!on(i) || n.deg < 4) return;
      const R = (this.reach(n) + 4) / C, cx = n.x / C, cy = n.y / C, ox = cx + R * 0.35, oy = cy + R * 0.4;
      for (let y = Math.floor(oy - R); y <= Math.ceil(oy + R); y++)
        for (let x = Math.floor(ox - R); x <= Math.ceil(ox + R); x++) {
          if (Math.hypot(x - ox, y - oy) > R || Math.hypot(x - cx, y - cy) < R * 0.75) continue;
          const t2 = Math.hypot(x - ox, y - oy) < R * 0.6;
          const p = K.hatch === 'cross' ? ((x + y) % 4 === 0 && (x - y + 400) % 4 === 0) || ((x + y) % 4 === 2 && (x - y + 400) % 4 === 2) || (x + y) % 4 === 0 && t2 : (x + y) % 3 === 0;
          if (p) set(x, y, SHADE);
        }
    });

    // Vines: quadratic curves bowing to one side. Backbone vines are stippled one cell in two; the
    // loop-closing ones are a faint trace; any vine of the focused flower is solid.
    const vine = (a, b, mode, bone) => {
      const A = D.nodes[a], Bn = D.nodes[b];
      const x0 = A.x / C, y0 = A.y / C, x1 = Bn.x / C, y1 = Bn.y / C;
      const len = Math.hypot(x1 - x0, y1 - y0) || 1, r = this.rng('vine:' + a + ':' + b);
      const bow = (r() < 0.5 ? -1 : 1) * (0.1 + r() * 0.1) * len;
      const qx = (x0 + x1) / 2 - (y1 - y0) / len * bow, qy = (y0 + y1) / 2 + (x1 - x0) / len * bow;
      const ra = (this.reach(A) + 3) / C, rb = (this.reach(Bn) + 3) / C;
      const steps = Math.ceil(len * 1.6);
      let last = '', k = 0;
      const pt = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1];
      const col = mode === 'on' ? VINE_ON : mode === 'dim' ? PALE : bone ? VINE : GHOST;
      const every = mode === 'on' ? 1 : mode === 'dim' ? (bone ? 3 : 0) : bone ? 2 : K.ghost;
      if (!every) return;
      for (let s = 0; s <= steps; s++) {
        const [x, y] = pt(s / steps), px = Math.round(x), py = Math.round(y);
        const key = px + ',' + py;
        if (key === last) continue;
        last = key; k++;
        if (Math.hypot(x - x0, y - y0) < ra || Math.hypot(x - x1, y - y1) < rb) continue;
        // Softer near a hub, so its vines don't gather into a knot.
        const hub = (A.deg >= 6 && Math.hypot(x - x0, y - y0) < ra + 16 / C) || (Bn.deg >= 6 && Math.hypot(x - x1, y - y1) < rb + 16 / C);
        // Long vines thin out toward their middle, like tendrils reaching across the bed.
        const t = s / steps, mid = len * C > 110 && mode === 'rest' ? 1 + Math.round(3 * Math.max(0, 1 - Math.abs(t - 0.5) * 3.2)) : 1;
        if (k % (every * mid * (hub && mode !== 'on' ? 2 : 1)) === 0) set(px, py, col);
      }
      // A small leaf on longer backbone vines, angled off the stem.
      if (bone && len * C > 70 && mode !== 'dim' && (mode === 'on' || r() < 0.55)) {
        const t = 0.35 + r() * 0.3, [lx, ly] = pt(t), [ax, ay] = pt(t + 0.01);
        const tan = Math.atan2(ay - ly, ax - lx), side = r() < 0.5 ? -1 : 1, ang = tan + side * 0.7;
        const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy * side, vy = ux * side, lc = mode === 'on' ? VINE_ON : LEAF;
        const L = Math.max(3, Math.round(K.leaf / C));
        for (let s = 1; s <= L; s++) {
          set(lx + ux * s, ly + uy * s, lc);
          if (s > 1 && s < L) set(lx + ux * s + vx * 0.9, ly + uy * s + vy * 0.9, lc);
        }
      }
    };
    for (const [a, b, bone] of D.edges) if (!(f >= 0 && (a === f || b === f))) vine(a, b, f >= 0 ? 'dim' : 'rest', bone);
    if (f >= 0) for (const [a, b, bone] of D.edges) if (a === f || b === f) vine(a, b, 'on', bone);

    D.nodes.forEach((n, i) => {
      const sp = this.specimen('notes/' + n.slug), cx = n.x / C, cy = n.y / C;
      const mode = f < 0 ? 'rest' : i === f ? 'focus' : near.has(i) ? 'open' : 'dim';
      const petal = this.rgb(sp.petal[1]), centre = this.rgb(sp.center ? sp.center[1] : '#1F2B23');
      if (n.wild) {
        // A wildflower seen from the side: a short stem with a leaf, and a small bloom or a seed-head.
        const g = mode === 'dim' ? PALE : MOSS, big = mode === 'focus' ? 1.5 : 1;
        const stem = Math.max(4, Math.round(10 * big / C));
        for (let k = 0; k <= stem; k++) set(cx + (k > stem * 0.6 ? 0 : 0), cy + k, g);
        const lk = Math.round(stem * 0.6), side = this.rng('leaf:' + n.slug)() < 0.5 ? -1 : 1;
        set(cx + side, cy + lk, g); set(cx + side * 2, cy + lk - 1, g);
        if (n.stub) {
          // A seed-head: a ring of dots.
          const R = 4.5 * big / C;
          for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; set(cx + Math.cos(t) * R, cy - R * 0.4 + Math.sin(t) * R, mode === 'dim' ? PALE : this.rgb('#8C7C66')); }
          set(cx, cy - R * 0.4, mode === 'dim' ? PALE : this.rgb('#7A5C42'));
        } else {
          const R = Math.max(2, 4.5 * big / C);
          for (let y = -Math.ceil(R); y <= Math.ceil(R); y++) for (let x = -Math.ceil(R); x <= Math.ceil(R); x++) {
            const r = Math.hypot(x, y * 1.3);
            if (r <= R && (r <= R * 0.45 || ((x + y) & 1) === 0 || r > R * 0.75)) set(cx + x, cy - R * 0.5 + y, mode === 'dim' ? PALE : (r <= R * 0.35 ? centre : petal));
          }
        }
        return;
      }
      if (n.stub) {
        // A bud: a closed green calyx with the petal colour just showing at its tip.
        const g = mode === 'dim' ? PALE : MOSS, tip = mode === 'dim' ? PALE : petal, s = (mode === 'rest' ? 1 : 1.3) * Math.max(1, 2 / C * 1.3);
        for (let y = -4; y <= 4; y++) for (let x = -3; x <= 3; x++) {
          const e = (x / (1.2 * s)) ** 2 + ((y + 0.3) / (2.1 * s)) ** 2;
          if (e <= 1) set(cx + x, cy + y, y <= -1 * s ? tip : g);
        }
        set(cx, cy + 3 * s, g); set(cx, cy + 4 * s, g);
        return;
      }
      const P = n.deg <= 2 ? 4 : Math.min(8, 4 + Math.floor(n.deg / 2));
      const open = mode === 'rest' ? 0.85 : mode === 'dim' ? 0.75 : 1.15;
      const L = (this.reach(n) * open + (mode === 'focus' ? 3 : 0)) / C;
      const W = Math.max(0.9, Math.min(L * 0.3, L * Math.sin(Math.PI / P) * 0.8));
      const rot = this.rng('rot:' + n.slug)() * Math.PI * 2, seg = Math.PI * 2 / P;
      const cr = (1.2 + Math.min(2.4, n.deg / 4)) / C;
      const R = Math.ceil(L + 1);
      for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++)
        for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
          const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
          if (r > L + 0.5) continue;
          let a = Math.atan2(dy, dx) - rot;
          a = ((a % seg) + seg) % seg - seg / 2;
          const u = r * Math.cos(a), v = r * Math.sin(a);
          const e = ((u - L * 0.58) / (L * 0.46)) ** 2 + (v / W) ** 2;
          if (r <= cr) { set(x, y, mode === 'dim' ? PALE : centre); continue; }
          if (e > 1) continue;
          if (mode === 'dim') { if (e > 0.5 && bay(x, y) < 8) set(x, y, PALE); continue; }
          if (e > K.outline || L < 2.6) set(x, y, petal);
          else if (bay(x, y) < (mode === 'rest' ? 4 : 7) + (u / L) * 6) set(x, y, petal);
        }
      if (mode !== 'dim' && L >= 3) set(cx, cy, INKC);
    });
    ctx.putImageData(img, 0, 0);
    this._plateKey = f;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  labels() {
    const D = this.data(), f = this.focus(), near = this.near(f), lead = new Set(D.lead);
    // Captions sit beside their flower where they fit cleanly, most important first; at rest one that
    // would touch another flower or caption is left out. Wildflowers are captioned only when hovered.
    const want = D.nodes.map((n, i) => ({ n, i })).filter(({ n, i }) => f >= 0 ? (i === f || near.has(i)) : (!n.wild && (n.deg >= 7 || lead.has(i))))
      .sort((a, b) => (b.i === f) - (a.i === f) || b.n.deg - a.n.deg);
    const boxes = [], out = [];
    const flowers = D.nodes.map((n, i) => ({ n, i })).filter(({ i }) => f < 0 || i === f || near.has(i)).map(({ n, i }) => {
      const r = this.reach(n) * 0.8 + 2;
      return { x: n.x - r, y: n.y - r, w: 2 * r, h: 2 * r, i };
    });
    const over = (b, o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y;
    const inside = (b) => b.x >= 14 && b.x + b.w <= D.PW - 14 && b.y >= 12 && b.y + b.h <= D.PH - 12;
    for (const { n, i } of want) {
      const big = i === f, max = big ? 52 : 34;
      const t = n.title.length > max ? n.title.slice(0, max - 1) + '…' : n.title;
      const cw = big ? 7.4 : 6.8, w = t.length * cw + 8, h = 14, r = this.reach(n) * (f >= 0 ? 1.15 : 0.85) + (big ? 8 : 5);
      const tries = [[n.x + r, n.y - 7], [n.x - r - w, n.y - 7], [n.x - w / 2, n.y + r - 1], [n.x - w / 2, n.y - r - h + 1]]
        .map(([x, y]) => ({ x, y, w, h })).filter(inside);
      let spot = tries.find((b) => !boxes.some((o) => over(b, o)) && !flowers.some((o) => o.i !== i && over(b, o)));
      // A hub's caption may lie over one small flower rather than go missing; on hover, over any.
      if (!spot && (f >= 0 || n.deg >= 9)) spot = tries.filter((b) => !boxes.some((o) => over(b, o)))
        .map((b) => ({ b, k: flowers.filter((o) => o.i !== i && over(b, o)).length })).filter((c) => f >= 0 || c.k <= (n.deg >= 12 ? 2 : 1)).sort((p, q) => p.k - q.k).map((c) => c.b)[0];
      if (!spot) continue;
      boxes.push(spot);
      out.push({ t, left: Math.round(spot.x) + 'px', top: Math.round(spot.y) + 'px',
        color: big ? '#2B7349' : (f >= 0 ? '#1F2B23' : '#3E4A40'), weight: big ? '600' : '400', size: big ? '12px' : '11px', style: n.wild && !big ? 'italic' : 'normal' });
    }
    return out;
  }

  spots() {
    const D = this.data();
    return D.nodes.map((n, i) => ({
      aria: n.title, left: (n.x - 11) + 'px', top: (n.y - 11) + 'px',
      enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 }),
      pick: () => this.setState({ sel: this.state.sel === i ? -1 : i }) }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug);
    const near = (list) => list.map((slug) => { const m = D.nodes.find((x) => x.slug === slug); return { title: m ? m.title : slug, mark: m ? (m.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + m.slug)) : [] }; });
    const outs = near(D.out[n.slug] || []), ins = near(D.inn[n.slug] || []);
    return { show: true, title: n.title, latin: n.stub ? 'a bud, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      outs, ins, lone: n.wild, linked: !n.wild };
  }
'''

CAP = f"font-family: {MONO}; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: {MUTED};"
mark_loop = (f'<span aria-hidden="true" style="width: 34px; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>')
near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 8px; align-items: baseline;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for>')


def board(name, cfg, tab):
    js = JS + f"\n  cfg() {{ return {json.dumps(cfg)}; }}\n"
    js += f"\n  data() {{ return this._d || (this._d = {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}); }}\n"
    body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">Every note, and how they connect</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">The garden map</h1>
<p style="margin: 0 0 24px; color: {MUTED}; max-width: 70ch;">All my notes as one garden. Each note is a flower and each vine a link; buds are notes not written yet, and the wildflowers on their own stems are notes nothing links to yet. Hover a flower to see its neighbours; click it to keep it.</p>
<div style="overflow-x: auto;"><figure style="margin: 0; width: {PW}px;">
<div style="display: flex; justify-content: space-between; padding: 0 4px 8px; {CAP}"><span>Tab. {tab}</span><span>Hortus notarum</span><span>schrodlm.github.io</span></div>
<div style="position: relative; width: {PW}px; height: {PH}px; overflow: hidden;">
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; image-rendering: pixelated;">
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="8"><span aria-hidden="true" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: {{{{l.size}}}}; font-style: {{{{l.style}}}}; line-height: 14px; letter-spacing: 0.01em; padding: 0 2px; background: rgba(241,236,223,0.82); color: {{{{l.color}}}}; font-weight: {{{{l.weight}}}}; pointer-events: none;">{{{{l.t}}}}</span></sc-for>
<sc-for list="{{{{spots}}}}" as="s" hint-placeholder-count="20"><button type="button" aria-label="{{{{s.aria}}}}" onMouseEnter="{{{{s.enter}}}}" onMouseLeave="{{{{s.leave}}}}" onFocus="{{{{s.enter}}}}" onBlur="{{{{s.leave}}}}" onClick="{{{{s.pick}}}}" style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer;"></button></sc-for>
</div>
<figcaption style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 28px; padding: 10px 12px 0; font-family: {SERIF}; font-style: italic; font-size: 14px; color: {MUTED};"><span>Hortus notarum: {len(linked)} flowers on {len(EDGES)} vines, and {len(wild)} wildflowers.</span><span style="font-family: {MONO}; font-style: normal; font-size: 12px;"><span style="color: {HIBISCUS};">*</span> a note · <span style="color: {MOSS};">,</span> a bud, not written yet · <span style="color: {ORCHID};">o</span><span style="color: {MOSS};">|</span> a wildflower, not linked yet</span></figcaption>
</figure></div>
<div aria-live="polite" style="margin-top: 24px; min-height: 120px;">
<sc-if value="{{{{panel.show}}}}" hint-placeholder-val="{{{{false}}}}"><div style="display: flex; flex-wrap: wrap; gap: 24px 40px; align-items: flex-end; padding: 22px 26px; background: #F7F2E4; border: 1px solid #D8CFBA;">
<div aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop("panel.flower", 12)}</div>
<div style="flex: 1 1 260px; min-width: 0;"><div style="font-family: {SERIF}; font-style: italic; font-size: 15px; color: {MUTED};">{{{{panel.latin}}}}</div><a href="#" style="font-family: {MONO}; font-size: 22px; font-weight: 600;">{{{{panel.title}}}}</a></div>
<sc-if value="{{{{panel.linked}}}}" hint-placeholder-val="{{{{true}}}}">
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">links to</div>{near('outs')}</div>
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">linked from</div>{near('ins')}</div>
</sc-if>
<sc-if value="{{{{panel.lone}}}}" hint-placeholder-val="{{{{false}}}}"><div style="flex: 2 1 440px; min-width: 0; font-size: 15px; color: {MUTED};">A wildflower: nothing links here yet, and it links nowhere.</div></sc-if>
</div></sc-if>
</div>
</main>
{FOOTER}'''
    vals = "    return { plate: this.plate(), labels: this.labels(), spots: this.spots(), panel: this.panel(), roots: this.roots() };"
    comp = component(js, vals).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, sel: -1 };')
    height = PH + 700
    open('jungle/project/%s.dc.html' % name, 'w', encoding='utf-8').write(page('Graph, engraved', body, comp, height, PAGE_CSS))
    print(name, height)


board('GraphEngraving2', {'cell': 2, 'hatch': 'diag', 'outline': 0.5, 'ghost': 8, 'leaf': 8, 'size': 1}, 'II')
board('GraphEngraving3', {'cell': 3, 'hatch': 'cross', 'outline': 0.3, 'ghost': 4, 'leaf': 10, 'size': 1.3}, 'III')

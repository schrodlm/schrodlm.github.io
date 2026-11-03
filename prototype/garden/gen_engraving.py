"""Graph view, engraved: the garden map as a plate from an old botanical book, printed in the garden's tones."""
import json
import math
import random

_src = open('gen_graph.py', encoding='utf-8').read()
exec(_src[:_src.index('# ---- variant A')])

PW, PH = 1170, 980
MARGIN = 34

# ---- layout: each cluster laid out on its own, then the clusters set on the plate like specimens on
# a herbarium sheet, the largest in the middle and the rest around it, each with room to breathe.
linked = [i for i in range(len(NODES)) if ADJ[i]]
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

SPACE = 56          # px of plate per sqrt(node)
MIN_GAP = 30        # flowers never closer than this
CLUSTER_GAP = 34    # clear sand between clusters


def relax(pos, ids, gap, rounds=60):
    for _ in range(rounds):
        moved = False
        for ai in range(len(ids)):
            for bi in range(ai + 1, len(ids)):
                a, b = ids[ai], ids[bi]
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


placed = {}
rects = []
for ci, comp in enumerate(comps):
    n = len(comp)
    if n == 2:
        a, b = comp
        local = {a: [0.0, 0.0], b: [52.0, 18.0 * (1 if ci % 2 else -1)]}
    else:
        side = SPACE * math.sqrt(n)
        w, h = (side * 1.25, side * 1.05) if ci == 0 else (side, side * 0.9)
        local = force(comp, w, h, 'engraving-%d' % ci, iters=500, gravity=0.06 if ci == 0 else 0.15, spread=1.1)
        local = {i: list(p) for i, p in local.items()}
        relax(local, comp, 46 if ci == 0 else 36, rounds=250)
    best = None
    for shrink in (1.0, 0.9, 0.8, 0.7, 0.6):
        xs = [p[0] * shrink for p in local.values()]; ys = [p[1] * shrink for p in local.values()]
        x0, y0, cw, chh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
        # The free spot nearest the plate's centre; the big cluster sits left of it, where the eye starts.
        tx, ty = (PW * 0.32, PH * 0.5) if ci == 0 else (PW * 0.5, PH * 0.5)
        for gy in range(MARGIN, int(PH - MARGIN - chh) + 1, 6):
            for gx in range(MARGIN + 20, int(PW - MARGIN - 20 - cw) + 1, 6):
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
    local = {i: [p[0] * shrink, p[1] * shrink] for i, p in local.items()}
    _, gx, gy = best
    rects.append((gx, gy, gx + cw, gy + chh))
    for i, p in local.items():
        placed[i] = (p[0] - x0 + gx, p[1] - y0 + gy)

nodes = []
for i, nd in enumerate(NODES):
    x, y = placed.get(i, (-1, -1))
    nodes.append({'slug': nd['slug'], 'title': nd['title'], 'x': round(x), 'y': round(y), 'deg': DEG[i], 'stub': nd['stub'], 'wild': not ADJ[i]})
# Captions at rest: the hubs, and the leading note of every cluster of five or more.
lead = {max(c, key=lambda i: DEG[i]) for c in comps if len(c) >= 5}
DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'edges': EDGES, 'out': OUT, 'inn': INN, 'lead': sorted(lead)}
N_FLOWERS = len(linked)
N_VINES = len(EDGES)

JS = r'''
  // The garden map as an engraved plate. Every note is a small flower drawn in its specimen's colours,
  // petals stippled inside a solid outline; its petal count and size grow with its links, and notes
  // not written yet are buds. Links are fine stippled vines on a gentle curve, with a leaf here and
  // there on the longer ones. Hovering a note draws its vines solid and opens its neighbours fully.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  focus() { return this.state.hover >= 0 ? this.state.hover : this.state.sel; }

  near(f) {
    const D = this.data(), s = new Set();
    if (f >= 0) for (const [a, b] of D.edges) { if (a === f) s.add(b); if (b === f) s.add(a); }
    return s;
  }

  // The petal reach of a flower in plate cells (2 px each), before it opens.
  reach(n) { return n.stub ? 2.5 : 2 + Math.min(6, Math.sqrt(n.deg) * 1.65); }

  plate() {
    const D = this.data(), f = this.focus();
    if (this._plateKey === f && this._plate) return this._plate;
    const C = 2, w = Math.round(D.PW / C), h = Math.round(D.PH / C);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const bay = (x, y) => B[(y & 3) * 4 + (x & 3)];
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    };
    const near = this.near(f), on = (i) => f < 0 || i === f || near.has(i);
    const VINE = this.rgb('#8DA381'), VINE_ON = this.rgb('#2B7349'), PALE = this.rgb('#C8BDA3');
    const LEAF = this.rgb('#3F8A52'), SHADE = this.rgb('#D2C7AE'), MOSS = this.rgb('#5E8E4A');

    // Stippled shading: a faint engraved shadow to the lower right of every flower.
    D.nodes.forEach((n, i) => {
      if (n.wild || !on(i)) return;
      const R = this.reach(n) + 1.6, cx = n.x / C + 1.6, cy = n.y / C + 1.8;
      for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++)
        for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
          const t = Math.hypot(x - cx, y - cy) / R;
          if (t <= 1 && bay(x, y) < (1 - t) * 4) set(x, y, SHADE);
        }
    });

    // Vines: quadratic curves bowing to one side, stippled one cell in two; solid when lit.
    const vine = (a, b, mode) => {
      const A = D.nodes[a], Bn = D.nodes[b];
      const x0 = A.x / C, y0 = A.y / C, x1 = Bn.x / C, y1 = Bn.y / C;
      const len = Math.hypot(x1 - x0, y1 - y0) || 1, r = this.rng('vine:' + a + ':' + b);
      const bow = (r() < 0.5 ? -1 : 1) * (0.1 + r() * 0.1) * len;
      const qx = (x0 + x1) / 2 - (y1 - y0) / len * bow, qy = (y0 + y1) / 2 + (x1 - x0) / len * bow;
      const ra = this.reach(A) + 1.5, rb = this.reach(Bn) + 1.5;
      const steps = Math.ceil(len * 1.6);
      let last = '', k = 0;
      const pt = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1];
      const col = mode === 'on' ? VINE_ON : mode === 'dim' ? PALE : VINE;
      for (let s = 0; s <= steps; s++) {
        const [x, y] = pt(s / steps), px = Math.round(x), py = Math.round(y);
        const key = px + ',' + py;
        if (key === last) continue;
        last = key; k++;
        if (Math.hypot(x - x0, y - y0) < ra || Math.hypot(x - x1, y - y1) < rb) continue;
        if (mode === 'on' || (mode === 'rest' && k % 2 === 0) || (mode === 'dim' && k % 3 === 0)) set(px, py, col);
      }
      // A small leaf on longer vines, angled off the stem.
      if (len > 44 && mode !== 'dim' && (mode === 'on' || r() < 0.5)) {
        const t = 0.35 + r() * 0.3, [lx, ly] = pt(t), [ax, ay] = pt(t + 0.01);
        const tan = Math.atan2(ay - ly, ax - lx), side = r() < 0.5 ? -1 : 1, ang = tan + side * 0.75;
        const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux, lc = mode === 'on' ? VINE_ON : LEAF;
        for (let s = 1; s <= 4; s++) {
          set(lx + ux * s, ly + uy * s, lc);
          if (s === 2 || s === 3) set(lx + ux * s + vx * side * 0.9, ly + uy * s + vy * side * 0.9, lc);
        }
      }
      if (len > 90 && mode !== 'dim' && r() < 0.4) {
        const t = 0.15 + r() * 0.1, [lx, ly] = pt(1 - t), [ax, ay] = pt(1 - t + 0.01);
        const ang = Math.atan2(ay - ly, ax - lx) + 0.8, ux = Math.cos(ang), uy = Math.sin(ang);
        for (let s = 1; s <= 3; s++) set(lx + ux * s, ly + uy * s, mode === 'on' ? VINE_ON : LEAF);
      }
    };
    for (const [a, b] of D.edges) {
      const lit = f >= 0 && (a === f || b === f);
      if (!lit) vine(a, b, f >= 0 ? 'dim' : 'rest');
    }
    if (f >= 0) for (const [a, b] of D.edges) if (a === f || b === f) vine(a, b, 'on');

    // Flowers.
    D.nodes.forEach((n, i) => {
      if (n.wild) return;
      const sp = this.specimen('notes/' + n.slug), cx = n.x / C, cy = n.y / C;
      const mode = f < 0 ? 'rest' : i === f ? 'focus' : near.has(i) ? 'open' : 'dim';
      const petal = this.rgb(sp.petal[1]), centre = this.rgb(sp.center ? sp.center[1] : '#1F2B23');
      if (n.stub) {
        // A bud: a closed green calyx with the petal colour just showing at its tip.
        const g = mode === 'dim' ? PALE : MOSS, tip = mode === 'dim' ? PALE : petal, s = mode === 'rest' ? 1 : 1.25;
        for (let y = -3; y <= 3; y++) for (let x = -2; x <= 2; x++) {
          const e = (x / (1.3 * s)) ** 2 + ((y + 0.4) / (2.2 * s)) ** 2;
          if (e <= 1) set(cx + x, cy + y, y <= -1 * s ? tip : (e > 0.4 || bay(cx + x | 0, cy + y | 0) < 9 ? g : g));
        }
        set(cx, cy + 3 * s, g); set(cx, cy + 4 * s, g);
        return;
      }
      const P = Math.min(8, 4 + Math.floor(n.deg / 2));
      const open = mode === 'rest' ? 0.85 : mode === 'dim' ? 0.75 : 1.15;
      const L = this.reach(n) * open + (mode === 'focus' ? 1.5 : 0), W = Math.max(0.9, Math.min(L * 0.3, L * Math.sin(Math.PI / P) * 0.8));
      const rot = this.rng('rot:' + n.slug)() * Math.PI * 2, seg = Math.PI * 2 / P;
      const cr = 0.6 + Math.min(1.2, n.deg / 8);
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
          // Engraved: a solid outline, the inside stippled, denser toward the tip.
          const tipward = u / L;
          if (e > 0.5 || L < 2.6) set(x, y, petal);
          else if (bay(x, y) < (mode === 'rest' ? 4 : 7) + tipward * 6) set(x, y, petal);
        }
    });
    ctx.putImageData(img, 0, 0);
    this._plateKey = f;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  labels() {
    const D = this.data(), f = this.focus(), near = this.near(f), lead = new Set(D.lead);
    // Captions sit beside their flower where they fit (right, left, below, above), most important
    // first; they keep off other flowers, and one that fits nowhere is left out.
    const want = D.nodes.map((n, i) => ({ n, i })).filter(({ n, i }) => !n.wild && (f >= 0 ? (i === f || near.has(i)) : (n.deg >= 7 || lead.has(i))))
      .sort((a, b) => (b.i === f) - (a.i === f) || b.n.deg - a.n.deg);
    const boxes = [], out = [];
    const flowers = D.nodes.map((n, i) => ({ n, i })).filter(({ n, i }) => !n.wild && (f < 0 || i === f || near.has(i))).map(({ n, i }) => {
      const r = this.reach(n) * 1.3;
      return { x: n.x - r, y: n.y - r, w: 2 * r, h: 2 * r, i };
    });
    const hit = (b, self) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)
      || flowers.some((o) => o.i !== self && b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    for (const { n, i } of want) {
      const big = i === f, max = big ? 52 : 34;
      const t = n.title.length > max ? n.title.slice(0, max - 1) + '…' : n.title;
      const cw = big ? 7.4 : 6.8, w = t.length * cw + 8, h = 14, r = this.reach(n) * 2 * (f >= 0 ? 1.15 : 0.85) + (big ? 8 : 5);
      const tries = [[n.x + r, n.y - 7], [n.x - r - w, n.y - 7], [n.x - w / 2, n.y + r - 1], [n.x - w / 2, n.y - r - h + 1],
        [n.x + r - 2, n.y + 3], [n.x + r - 2, n.y - 17], [n.x - r - w + 2, n.y + 3], [n.x - r - w + 2, n.y - 17]];
      const inside = (b) => b.x >= 8 && b.x + b.w <= D.PW - 8 && b.y >= 6 && b.y + b.h <= D.PH - 6;
      let spot = tries.map(([x, y]) => ({ x, y, w, h })).find((b) => inside(b) && !hit(b, i));
      // A hub's caption may lie across its neighbours' petals rather than go missing.
      if (!spot && (big || n.deg >= 9)) {
        const over = (b, o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y;
        spot = tries.map(([x, y]) => ({ x, y, w, h })).filter((b) => inside(b) && !boxes.some((o) => over(b, o)))
          .map((b) => ({ b, k: flowers.filter((o) => o.i !== i && over(b, o)).length })).sort((p, q) => p.k - q.k).map((c) => c.b)[0];
      }
      if (!spot && big) spot = { x: n.x + r, y: n.y - 7, w, h };
      if (!spot) continue;
      boxes.push(spot);
      out.push({ t, left: Math.round(spot.x) + 'px', top: Math.round(spot.y) + 'px',
        color: big ? '#2B7349' : (f >= 0 ? '#1F2B23' : '#3E4A40'), weight: big ? '600' : '400', size: big ? '12px' : '11px' });
    }
    return out;
  }

  spots() {
    const D = this.data();
    return D.nodes.map((n, i) => ({ n, i })).filter(({ n }) => !n.wild).map(({ n, i }) => ({
      aria: n.title, left: (n.x - 11) + 'px', top: (n.y - 11) + 'px',
      enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 }),
      pick: () => this.setState({ sel: this.state.sel === i ? -1 : i }) }));
  }

  wildflowers() {
    return this.data().nodes.filter((n) => n.wild).map((n) => ({ title: n.title, mark: n.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + n.slug) }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug);
    const near = (list) => list.map((slug) => { const m = D.nodes.find((x) => x.slug === slug); return { title: m ? m.title : slug, mark: m ? (m.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + m.slug)) : [] }; });
    return { show: true, title: n.title, latin: n.stub ? 'a bud, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      outs: near(D.out[n.slug] || []), ins: near(D.inn[n.slug] || []) };
  }
'''
JS += f"\n  data() {{ return this._d || (this._d = {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}); }}\n"

CAP = f"font-family: {MONO}; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: {MUTED};"
mark_loop = (f'<span aria-hidden="true" style="width: 34px; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>')
near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 8px; align-items: baseline;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for>')
body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">Every note, and how they connect</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">The garden map</h1>
<p style="margin: 0 0 24px; color: {MUTED}; max-width: 70ch;">All my notes as one garden. Each note is a flower, each vine a link; buds are notes not written yet. Hover a flower to see its neighbours; click it to keep it.</p>
<div style="overflow-x: auto;"><figure style="margin: 0; width: {PW + 22}px; padding: 10px; box-sizing: border-box; border: 1px solid #B9AD93; background: #F1ECDF;">
<div style="border: 1px solid #D3C8AF; padding: 0;">
<div style="display: flex; justify-content: space-between; padding: 8px 12px 0; {CAP}"><span>Tab. I</span><span>Hortus notarum</span><span>schrodlm.github.io</span></div>
<div style="position: relative; width: {PW - 2}px; height: {PH}px; overflow: hidden;">
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; image-rendering: pixelated;">
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="8"><span aria-hidden="true" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: {{{{l.size}}}}; line-height: 14px; letter-spacing: 0.01em; padding: 0 2px; background: rgba(241,236,223,0.8); color: {{{{l.color}}}}; font-weight: {{{{l.weight}}}}; text-shadow: 0 0 2px #F1ECDF, 0 0 2px #F1ECDF, 0 0 3px #F1ECDF; pointer-events: none;">{{{{l.t}}}}</span></sc-for>
<sc-for list="{{{{spots}}}}" as="s" hint-placeholder-count="20"><button type="button" aria-label="{{{{s.aria}}}}" onMouseEnter="{{{{s.enter}}}}" onMouseLeave="{{{{s.leave}}}}" onFocus="{{{{s.enter}}}}" onBlur="{{{{s.leave}}}}" onClick="{{{{s.pick}}}}" style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer;"></button></sc-for>
</div>
<figcaption style="text-align: center; padding: 2px 12px 12px; font-family: {SERIF}; font-style: italic; font-size: 14px; color: {MUTED};">Hortus notarum: {N_FLOWERS} flowers on {N_VINES} vines, drawn from the notes as they grow.</figcaption>
</div></figure></div>
<div aria-live="polite" style="margin-top: 24px; min-height: 120px;">
<sc-if value="{{{{panel.show}}}}" hint-placeholder-val="{{{{false}}}}"><div style="display: flex; flex-wrap: wrap; gap: 24px 40px; align-items: flex-end; padding: 22px 26px; background: #F7F2E4; border: 1px solid #D8CFBA;">
<div aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop("panel.flower", 12)}</div>
<div style="flex: 1 1 260px; min-width: 0;"><div style="font-family: {SERIF}; font-style: italic; font-size: 15px; color: {MUTED};">{{{{panel.latin}}}}</div><a href="#" style="font-family: {MONO}; font-size: 22px; font-weight: 600;">{{{{panel.title}}}}</a></div>
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">links to</div>{near('outs')}</div>
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">linked from</div>{near('ins')}</div>
</div></sc-if>
</div>
<h2 style="margin: 40px 0 14px; font-family: {MONO}; font-size: 15px; font-weight: 600; color: {MUTED};">wildflowers, not linked yet</h2>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px 24px; font-size: 15px;"><sc-for list="{{{{wild}}}}" as="m" hint-placeholder-count="12"><div style="display: flex; gap: 8px; align-items: baseline; min-width: 0;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for></div>
</main>
{FOOTER}'''
vals = "    return { plate: this.plate(), labels: this.labels(), spots: this.spots(), panel: this.panel(), wild: this.wildflowers(), roots: this.roots() };"
comp = component(JS, vals).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, sel: -1 };')
height = PH + 1250
src = page('Graph, engraved', body, comp, height, PAGE_CSS)
open('jungle/project/GraphEngraving.dc.html', 'w', encoding='utf-8').write(src)
print('GraphEngraving.dc.html', height, [len(c) for c in comps])

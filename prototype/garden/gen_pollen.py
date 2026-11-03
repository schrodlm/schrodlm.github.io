"""Graph view, pollen clouds: the garden map as soft dithered clouds of pollen, with vines only on hover."""
import json
import math

_src = open('gen_graph.py', encoding='utf-8').read()
exec(_src[:_src.index('# ---- variant A')])

PW, PH = 1170, 800
linked = [i for i in range(len(NODES)) if ADJ[i]]
pos = force(linked, PW - 80, PH - 70, 'garden-map-pollen', iters=500, gravity=0.3, spread=1.35)

# Ease the crowded middle apart so every seed has room to breathe (a few rounds of overlap removal).
MIN = 30
for _ in range(80):
    moved = False
    for ai in range(len(linked)):
        a = linked[ai]
        for b in linked[ai + 1:]:
            dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
            d = math.hypot(dx, dy) or 0.01
            if d < MIN:
                push = (MIN - d) / 2
                pos[a][0] += dx / d * push; pos[a][1] += dy / d * push
                pos[b][0] -= dx / d * push; pos[b][1] -= dy / d * push
                moved = True
    for i in linked:
        pos[i][0] = min(PW - 80, max(0, pos[i][0])); pos[i][1] = min(PH - 70, max(0, pos[i][1]))
    if not moved:
        break

# One named hub per clump of five or more notes (its best-linked note), plus every big hub.
_seen, HUBS = set(), set()
for i in linked:
    if i in _seen:
        continue
    st, comp = [i], []
    _seen.add(i)
    while st:
        x = st.pop(); comp.append(x)
        for y in ADJ[x]:
            if y not in _seen:
                _seen.add(y); st.append(y)
    if len(comp) >= 5:
        HUBS.add(max(comp, key=lambda j: DEG[j]))
HUBS |= {i for i in linked if DEG[i] >= 8}

nodes = []
for i, n in enumerate(NODES):
    x, y = pos.get(i, (-1, -1))
    nodes.append({'slug': n['slug'], 'title': n['title'], 'x': round(x + 40), 'y': round(y + 40), 'deg': DEG[i], 'stub': n['stub'], 'wild': not ADJ[i], 'hub': i in HUBS})
DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'edges': EDGES, 'out': OUT, 'inn': INN}

JS = r'''
  // The garden map as pollen: at rest every cluster is a soft dithered cloud in its notes' colours,
  // with a crisp seed for each note and no lines at all. Hovering a seed grows its vines out to its
  // neighbours, brightens them and lets the rest of the meadow fall back into the haze.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  mix(a, b, t) { return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)); }

  hue(n) { return n.stub ? '#5E8E4A' : this.specimen('notes/' + n.slug).petal[1]; }

  // The pollen field, computed once: per cell, how much pollen of each colour drifts there.
  field() {
    if (this._field) return this._field;
    const D = this.data(), C = 3, w = Math.round(D.PW / C), h = Math.round(D.PH / C);
    const pal = ['#C24E39', '#8A4F98', '#A87400', '#2A7099', '#B5476E', '#5E8E4A'];
    const ch = pal.map(() => new Float32Array(w * h));
    D.nodes.forEach((n) => {
      if (n.wild) return;
      const k = pal.indexOf(this.hue(n)), s = 5.2 + Math.min(5, n.deg * 0.45), amp = 0.55 + Math.min(0.6, n.deg * 0.06);
      const cx = n.x / C, cy = n.y / C, R = Math.ceil(s * 3);
      for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(h - 1, Math.ceil(cy + R)); y++) {
        for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(w - 1, Math.ceil(cx + R)); x++) {
          const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          ch[k][y * w + x] += amp * Math.exp(-d2 / (2 * s * s));
        }
      }
    });
    this._field = { w, h, C, pal: pal.map((c) => this.rgb(c)), ch };
    return this._field;
  }

  grain(x, y) { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 13; h = Math.imul(h, 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  focus() { const h0 = this.state.hover, s0 = this.state.sel; return h0 >= 0 ? h0 : s0; }

  // How far the vines have grown, 0..1. Fully grown whenever motion is off or the frame is frozen.
  growth() {
    if (this.reduce || this.props.motion === false || this.state.hoverAt == null || this.state.hover < 0) return 1;
    return Math.min(1, (this.state.tick - this.state.hoverAt + 1) / 4);
  }

  plate() {
    const D = this.data(), focus = this.focus(), grow = this.growth();
    const key = focus + '/' + grow;
    if (this._plateKey === key && this._plate) return this._plate;
    const F = this.field(), { w, h, C } = F;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const SAND = this.rgb('#F1ECDF'), GLOW = this.rgb('#ECE0C2');
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    };
    const near = new Set();
    if (focus >= 0) for (const [a, b] of D.edges) { if (a === focus) near.add(b); if (b === focus) near.add(a); }
    // Tints of each colour: a breath of pollen, a drift, and (rarely) a thick dusting.
    const haze = focus >= 0 ? 0.55 : 1;
    const tints = F.pal.map((c) => [SAND, this.mix(SAND, c, 0.16 * haze + 0.04), this.mix(SAND, c, 0.36 * haze + 0.06), this.mix(SAND, c, 0.5 * haze + 0.06)]);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x, th = B[(y & 3) * 4 + (x & 3)], th2 = B[((y + 2) & 3) * 4 + ((x + 1) & 3)];
        let tot = 0, k1 = 0, v1 = 0, k2 = 0, v2 = 0;
        for (let k = 0; k < 6; k++) {
          const v = F.ch[k][i]; tot += v;
          if (v > v1) { k2 = k1; v2 = v1; k1 = k; v1 = v; } else if (v > v2) { k2 = k; v2 = v; }
        }
        // golden-hour light: a warm wash from the upper left, very faint
        if (tot < 0.05) {
          // a stray pollen grain now and then, drifting past the clouds' edge
          if (tot > 0.012 && this.grain(x, y) < 0.035) set(x, y, tints[k1][2]);
          continue;
        }
        const t = Math.min(2.6, Math.pow(tot, 0.75) * 1.45);
        const lv = Math.floor(t) + ((t - Math.floor(t)) * 16 > th ? 1 : 0);
        const mixp = Math.max(0, Math.min(1, (v2 / (v1 + v2 || 1) - 0.22) / 0.28)) * 8;
        const kk = th2 < mixp ? k2 : k1;
        if (lv > 0) set(x, y, tints[kk][Math.min(3, lv)]);
      }
    }
    // Vines, only around the focus: a gently curving dithered stem from the focus to each neighbour,
    // grown to `grow` of its length, with a leaf every so often.
    if (focus >= 0) {
      const VINE = this.rgb('#2B7349'), LEAF = this.rgb('#3F8A52');
      const F0 = D.nodes[focus];
      let side = 1;
      for (const j of near) {
        const N = D.nodes[j];
        const x0 = F0.x / C, y0 = F0.y / C, x1 = N.x / C, y1 = N.y / C;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
        const bend = Math.min(10, len * 0.12) * side; side = -side;
        const mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend;
        const steps = Math.ceil(len * 1.4), stop = Math.floor(steps * grow);
        let lx = -1, ly = -1;
        for (let s = 0; s <= stop; s++) {
          const t = s / steps, u = 1 - t;
          const x = Math.round(u * u * x0 + 2 * u * t * mx + t * t * x1), y = Math.round(u * u * y0 + 2 * u * t * my + t * t * y1);
          if (x === lx && y === ly) continue;
          lx = x; ly = y;
          if (Math.hypot(x - x0, y - y0) < 5 || Math.hypot(x - x1, y - y1) < 3.5) continue;
          set(x, y, VINE);
          if (s % 9 === 4 && s > 10 && s < steps - 8) { const sd = (s % 18 === 4) ? 1 : -1; set(x + Math.round(nx * sd), y + Math.round(ny * sd), LEAF); }
        }
      }
    }
    // Seeds: a crisp dot for every note; hubs get a centre. Around the focus, neighbours ring brighter.
    D.nodes.forEach((n, i) => {
      if (n.wild) return;
      const cx = Math.round(n.x / C), cy = Math.round(n.y / C), sp = this.specimen('notes/' + n.slug);
      const isF = i === focus, isN = near.has(i), dim = focus >= 0 && !isF && !isN;
      let col = this.rgb(this.hue(n));
      if (dim) col = this.mix(col, SAND, 0.55);
      const big = isF || (isN && grow >= 1) || n.deg >= 8;
      if (isF || (isN && grow >= 1)) {
        const r = isF ? 3 : 2;
        for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
          const dd = Math.hypot(x, y);
          if (dd <= r + 0.5) set(cx + x, cy + y, SAND);
        }
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (Math.hypot(x, y) <= r - 0.4) set(cx + x, cy + y, col);
      } else if (big) {
        for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (x * y === 0 || !dim) set(cx + x, cy + y, col);
        if (sp.center && !dim && !n.stub) set(cx, cy, this.rgb(sp.center[1]));
      } else {
        set(cx, cy, col); set(cx + 1, cy, col); set(cx, cy + 1, col); set(cx + 1, cy + 1, col);
      }
    });
    ctx.putImageData(img, 0, 0);
    this._plateKey = key;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  labels() {
    const D = this.data(), focus = this.focus(), grow = this.growth();
    const near = new Set();
    if (focus >= 0) for (const [a, b] of D.edges) { if (a === focus) near.add(b); if (b === focus) near.add(a); }
    // At rest only the hubs are named, floating centred above their seed; with a focus, the focus and
    // its neighbours. Most important first; a label that fits nowhere is left out, never overlapped.
    const want = D.nodes.map((n, i) => ({ n, i }))
      .filter(({ n, i }) => !n.wild && (focus >= 0 ? (i === focus || (near.has(i) && grow >= 1)) : n.hub))
      .sort((a, b) => (b.i === focus) - (a.i === focus) || (focus >= 0 ? a.n.title.length - b.n.title.length : b.n.deg - a.n.deg));
    const boxes = [], out = [];
    if (focus >= 0) for (const i of [focus, ...near]) { const n = D.nodes[i]; boxes.push({ x: n.x - 7, y: n.y - 7, w: 14, h: 14 }); }
    const hit = (b) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    for (const { n, i } of want) {
      const isF = i === focus, size = isF ? 7.8 : 7.2;
      const t = n.title.length > 32 ? n.title.slice(0, 31) + '…' : n.title, w = t.length * size + 4, h = 16;
      const tries = focus >= 0
        ? [[n.x + 9, n.y - 8], [n.x - 9 - w, n.y - 8], [n.x - w / 2, n.y - 24], [n.x - w / 2, n.y + 9],
           [n.x + 12, n.y - 24], [n.x - 12 - w, n.y - 24], [n.x + 12, n.y + 9], [n.x - 12 - w, n.y + 9], [n.x - w / 2, n.y - 40], [n.x - w / 2, n.y + 25]]
        : [[n.x - w / 2, n.y - 22], [n.x - w / 2, n.y + 8], [n.x + 9, n.y - 8], [n.x - 9 - w, n.y - 8]];
      const spot = tries.map(([x, y]) => ({ x, y, w, h })).find((b) => b.x >= 0 && b.x + b.w <= D.PW && b.y >= 0 && !hit(b));
      if (!spot) continue;
      boxes.push(spot);
      out.push({ t, left: Math.round(spot.x) + 'px', top: Math.round(spot.y) + 'px',
        color: isF ? '#2B7349' : (focus >= 0 ? '#1F2B23' : '#3A463D'), weight: isF ? '600' : (focus >= 0 ? '500' : '400'), size: isF ? '13px' : '12px' });
    }
    return out;
  }

  spots() {
    return this.data().nodes.map((n, i) => ({ n, i })).filter(({ n }) => !n.wild).map(({ n, i }) => ({
      aria: n.title, left: (n.x - 10) + 'px', top: (n.y - 10) + 'px',
      enter: () => this.setState({ hover: i, hoverAt: this.state.tick }), leave: () => this.setState({ hover: -1 }),
      pick: () => this.setState({ sel: this.state.sel === i ? -1 : i }) }));
  }

  wildflowers() {
    return this.data().nodes.filter((n) => n.wild).map((n) => ({ title: n.title, mark: n.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + n.slug) }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug);
    const near = (list) => list.map((slug) => { const m = D.nodes.find((x) => x.slug === slug); return { title: m ? m.title : slug, mark: m ? this.mark('notes/' + m.slug) : [] }; });
    return { show: true, title: n.title, latin: n.stub ? 'a seedling, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      outs: near(D.out[n.slug] || []), ins: near(D.inn[n.slug] || []) };
  }
'''
JS += f"\n  data() {{ return this._d || (this._d = {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}); }}\n"

mark_loop = (f'<span aria-hidden="true" style="width: 34px; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>')
near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 8px; align-items: baseline;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for>')
HALO = 'text-shadow: 0 0 2px #F1ECDF, 0 0 4px #F1ECDF, 0 0 6px #F1ECDF, 0 0 8px #F1ECDF;'
body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">Every note, and how they connect</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">The garden map</h1>
<p style="margin: 0 0 24px; color: {MUTED}; max-width: 70ch;">My notes seen from above, like a meadow late in the day. Each seed is a note; the pollen drifts where notes cluster. Hover a seed to grow its vines to the notes it links with; click to keep it.</p>
<div style="overflow-x: auto;"><div style="position: relative; width: {PW}px; height: {PH}px;">
<div aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(ellipse 42% 52% at 38% 46%, rgba(234,205,140,0.34), rgba(234,205,140,0.12) 55%, rgba(234,205,140,0) 88%);"></div>
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; image-rendering: pixelated;">
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="8"><span aria-hidden="true" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: {{{{l.size}}}}; line-height: 16px; padding: 0 2px; color: {{{{l.color}}}}; font-weight: {{{{l.weight}}}}; {HALO} pointer-events: none;">{{{{l.t}}}}</span></sc-for>
<sc-for list="{{{{spots}}}}" as="s" hint-placeholder-count="20"><button type="button" aria-label="{{{{s.aria}}}}" onMouseEnter="{{{{s.enter}}}}" onMouseLeave="{{{{s.leave}}}}" onFocus="{{{{s.enter}}}}" onBlur="{{{{s.leave}}}}" onClick="{{{{s.pick}}}}" style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer;"></button></sc-for>
</div></div>
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
mount = "    this.reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n"
comp = component(JS, vals, mount).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, hoverAt: null, sel: -1 };')
height = PH + 1150
src = page('Graph, pollen clouds', body, comp, height, PAGE_CSS)
open('jungle/project/GraphPollen.dc.html', 'w', encoding='utf-8').write(src)
print('GraphPollen.dc.html', height)

"""Graph view, dithered: the whole-garden map drawn as an ordered-dither plate in the garden's tones."""
import json
import math

_src = open('gen_graph.py', encoding='utf-8').read()
exec(_src[:_src.index('# ---- variant A')])

PW, PH = 1170, 780
linked = [i for i in range(len(NODES)) if ADJ[i]]
pos = force(linked, PW - 60, PH - 40, 'garden-map-dither', iters=450, gravity=0.35, spread=1.25)
nodes = []
for i, n in enumerate(NODES):
    x, y = pos.get(i, (-1, -1))
    nodes.append({'slug': n['slug'], 'title': n['title'], 'x': round(x + 30), 'y': round(y + 20), 'deg': DEG[i], 'stub': n['stub'], 'wild': not ADJ[i]})
DATA = {'PW': PW, 'PH': PH, 'nodes': nodes, 'edges': EDGES, 'out': OUT, 'inn': INN}

JS = r'''
  // The garden map as a plate: ordered-dither pixels in the garden's tones. Every note is a disc in
  // its flower's petal colour with a dithered halo that grows with its links; links are stippled
  // vines. Hovering a note draws its vines solid, lights its neighbours and fades the rest.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  plate() {
    const D = this.data(), h0 = this.state.hover, s0 = this.state.sel, focus = h0 >= 0 ? h0 : s0;
    const key = focus;
    if (this._plateKey === key && this._plate) return this._plate;
    const C = 3, w = Math.round(D.PW / C), h = Math.round(D.PH / C);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const set = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    };
    const lit = new Set();
    if (focus >= 0) for (const [a, b] of D.edges) if (a === focus || b === focus) { lit.add(a); lit.add(b); }
    const VINE = this.rgb('#8FA582'), VINE_ON = this.rgb('#2B7349'), PALE = this.rgb('#D3C9B3');
    const line = (x0, y0, x1, y1, on, dim) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
        const th = B[(y & 3) * 4 + (x & 3)];
        if (on) { set(x, y, VINE_ON); set(x, y + 1, VINE_ON); }
        else if (th < (dim ? 4 : 9)) set(x, y, dim ? PALE : VINE);
      }
    };
    for (const [a, b] of D.edges) {
      const A = D.nodes[a], Bn = D.nodes[b], on = focus >= 0 && (a === focus || b === focus);
      if (!on) line(A.x / C, A.y / C, Bn.x / C, Bn.y / C, false, focus >= 0);
    }
    if (focus >= 0) for (const [a, b] of D.edges) {
      if (a !== focus && b !== focus) continue;
      const A = D.nodes[a], Bn = D.nodes[b];
      line(A.x / C, A.y / C, Bn.x / C, Bn.y / C, true, false);
    }
    D.nodes.forEach((n, i) => {
      if (n.wild) return;
      const dim = focus >= 0 && !lit.has(i) && i !== focus;
      const sp = this.specimen('notes/' + n.slug);
      const col = this.rgb(dim ? '#D3C9B3' : (n.stub ? '#5E8E4A' : sp.petal[1]));
      const R = 1.2 + Math.min(3.2, n.deg / 3.5) + (i === focus ? 1.2 : 0);
      const halo = R * (n.deg >= 6 ? 3 : 2.2);
      const cx = n.x / C, cy = n.y / C;
      for (let y = Math.floor(cy - halo); y <= Math.ceil(cy + halo); y++) {
        for (let x = Math.floor(cx - halo); x <= Math.ceil(cx + halo); x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= R) set(x, y, col);
          else if (dist <= halo && !dim) {
            const v = (1 - (dist - R) / (halo - R)) * 0.55;
            if (v * 17 > B[(y & 3) * 4 + (x & 3)]) set(x, y, col);
          }
        }
      }
      if (sp.center && !dim && !n.stub && R >= 2.5) set(cx, cy, this.rgb(sp.center[1]));
    });
    ctx.putImageData(img, 0, 0);
    this._plateKey = key;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  labels() {
    const D = this.data(), h0 = this.state.hover, s0 = this.state.sel, focus = h0 >= 0 ? h0 : s0;
    const near = new Set();
    if (focus >= 0) for (const [a, b] of D.edges) { if (a === focus) near.add(b); if (b === focus) near.add(a); }
    // Place each label beside its flower where it fits (right, left, above, below), most important
    // first; a label that fits nowhere is left out rather than drawn over another.
    const want = D.nodes.map((n, i) => ({ n, i })).filter(({ n, i }) => !n.wild && (focus >= 0 ? (i === focus || near.has(i)) : n.deg >= 8))
      .sort((a, b) => (b.i === focus) - (a.i === focus) || b.n.deg - a.n.deg);
    const boxes = [], out = [];
    const hit = (b) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    for (const { n, i } of want) {
      const t = n.title.length > 30 ? n.title.slice(0, 29) + '…' : n.title, w = t.length * 7.3 + 8, h = 17;
      const tries = [[n.x + 10, n.y - 9], [n.x - 10 - w, n.y - 9], [n.x - w / 2, n.y - 28], [n.x - w / 2, n.y + 11]];
      const spot = tries.map(([x, y]) => ({ x, y, w, h })).find((b) => b.x >= 0 && b.x + b.w <= D.PW && !hit(b));
      if (!spot) continue;
      boxes.push(spot);
      out.push({ t, left: Math.round(spot.x) + 'px', top: Math.round(spot.y) + 'px', color: i === focus ? '#2B7349' : (focus >= 0 ? '#1F2B23' : '#535F52'), weight: i === focus ? '600' : '400' });
    }
    return out;
  }

  spots() {
    return this.data().nodes.filter((n) => !n.wild).map((n) => {
      const i = this.data().nodes.indexOf(n);
      return { aria: n.title, left: (n.x - 10) + 'px', top: (n.y - 10) + 'px',
        enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 }),
        pick: () => this.setState({ sel: this.state.sel === i ? -1 : i }) };
    });
  }

  wildflowers() {
    return this.data().nodes.filter((n) => n.wild).map((n) => ({ title: n.title, mark: n.stub ? [{ t: ',', c: '#5E8E4A' }] : this.mark('notes/' + n.slug) }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false, idle: true };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug);
    const near = (list) => list.map((slug) => { const m = D.nodes.find((x) => x.slug === slug); return { title: m ? m.title : slug, mark: m ? this.mark('notes/' + m.slug) : [] }; });
    return { show: true, idle: false, title: n.title, latin: n.stub ? 'a seedling, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      outs: near(D.out[n.slug] || []), ins: near(D.inn[n.slug] || []) };
  }
'''
JS += f"\n  data() {{ return this._d || (this._d = {json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))}); }}\n"

mark_loop = (f'<span aria-hidden="true" style="width: 34px; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>')
near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 8px; align-items: baseline;">{mark_loop}<a href="#">{{{{m.title}}}}</a></div></sc-for>')
body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">Every note, and how they connect</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">The garden map</h1>
<p style="margin: 0 0 24px; color: {MUTED}; max-width: 70ch;">All my notes as one garden. Each note is a flower, each vine a link. Hover a flower to see its neighbours; click it to keep it.</p>
<div style="overflow-x: auto;"><div style="position: relative; width: {PW}px; height: {PH}px;">
<img alt="" aria-hidden="true" src="{{{{plate}}}}" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; image-rendering: pixelated;">
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="8"><span aria-hidden="true" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: nowrap; font-family: {MONO}; font-size: 12px; line-height: 16px; padding: 0 3px; background: rgba(241,236,223,0.85); color: {{{{l.color}}}}; font-weight: {{{{l.weight}}}}; pointer-events: none;">{{{{l.t}}}}</span></sc-for>
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
comp = component(JS, vals).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, sel: -1 };')
height = PH + 1150
src = page('Graph, dithered', body, comp, height, PAGE_CSS)
open('jungle/project/GraphDither.dc.html', 'w', encoding='utf-8').write(src)
print('GraphDither.dc.html', height)

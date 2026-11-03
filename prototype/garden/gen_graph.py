"""Graph-view prototypes: the whole-garden map (two variants) and the note-level graph (two variants)."""
import collections
import json
import math
import random

# Reuse the garden prototype's shared pieces (JS drawing code, nav, footer, vine, page shell).
_src = open('gen_garden2.py', encoding='utf-8').read()
exec(_src[:_src.index('# ---------------------------------------------------------------- Garden home')])

G = json.load(open('graph.json', encoding='utf-8'))
NODES = G['nodes']
IDX = {n['slug']: i for i, n in enumerate(NODES)}
EDGES = sorted({tuple(sorted((IDX[a], IDX[b]))) for a, b in G['edges']})
ADJ = collections.defaultdict(set)
for a, b in EDGES:
    ADJ[a].add(b); ADJ[b].add(a)
DEG = [len(ADJ[i]) for i in range(len(NODES))]
OUT = collections.defaultdict(list); INN = collections.defaultdict(list)
for a, b in G['edges']:
    OUT[a].append(b); INN[b].append(a)

CW, CH = 7.8, 15
W, H = 150, 54


def force(ids, w, h, seed, iters=420, gravity=0.5, spread=0.9):
    """A small deterministic Fruchterman-Reingold layout in a w×h pixel box."""
    r = random.Random(seed)
    pos = {i: [r.uniform(0.2, 0.8) * w, r.uniform(0.2, 0.8) * h] for i in ids}
    k = spread * math.sqrt(w * h / max(1, len(ids)))
    temp = w / 8
    ids = list(ids)
    for it in range(iters):
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
        for a, b in EDGES:
            if a in disp and b in disp:
                dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
                d = math.hypot(dx, dy) or 0.01
                f = d * d / k
                disp[a][0] -= dx / d * f; disp[a][1] -= dy / d * f
                disp[b][0] += dx / d * f; disp[b][1] += dy / d * f
        for i in ids:
            disp[i][0] += (w / 2 - pos[i][0]) * gravity
            disp[i][1] += (h / 2 - pos[i][1]) * gravity
            d = math.hypot(*disp[i]) or 0.01
            pos[i][0] += disp[i][0] / d * min(d, temp)
            pos[i][1] += disp[i][1] / d * min(d, temp)
        temp *= 0.985
    xs = [pos[i][0] for i in ids]; ys = [pos[i][1] for i in ids]
    sx = (w - 16) / max(1, max(xs) - min(xs)); sy = (h - 16) / max(1, max(ys) - min(ys))
    return {i: [8 + (pos[i][0] - min(xs)) * sx, 8 + (pos[i][1] - min(ys)) * sy] for i in ids}


def snap(pos, taken, ox=0, oy=0, gap=2, maxx=W - 3, maxy=200):
    """Place each node on its own grid cell, nudging outward when a cell is taken."""
    out = {}
    for i in sorted(pos, key=lambda i: -DEG[i]):
        cx, cy = ox + int(pos[i][0] / CW), oy + int(pos[i][1] / CH)
        for rad in range(0, 12):
            spots = [(cx + dx, cy + dy) for dx in range(-rad * 2, rad * 2 + 1) for dy in range(-rad, rad + 1)
                     if max(abs(dx) // 2, abs(dy)) == rad]
            free = [s for s in spots if 1 <= s[0] <= maxx and 1 <= s[1] <= maxy and all((s[0] + d, s[1]) not in taken for d in range(-gap, gap + 1))]
            if free:
                x, y = free[0]
                out[i] = (x, y); taken.add((x, y))
                break
    return out


# ---- variant A: one map of the whole garden
linked = [i for i in range(len(NODES)) if ADJ[i]]
posA = snap(force(linked, W * CW - 40, H * CH - 30, 'garden-map'), set(), 2, 1, maxy=H - 2)
wildA = [i for i in range(len(NODES)) if not ADJ[i]]
HA = H + 2 + math.ceil(len(wildA) / 5) * 2 + 1
framesA = [{'x': 1, 'y': H + 1, 'w': W - 2, 'h': HA - H - 1, 'title': f'wildflowers, not linked yet · {len(wildA)}'}]
for k, i in enumerate(wildA):
    posA[i] = (4 + (k % 5) * 29, H + 3 + (k // 5) * 2)

# ---- variant B: beds (clusters), each laid out on its own
comps, seen = [], set()
for i in range(len(NODES)):
    if i in seen or not ADJ[i]:
        continue
    st, c = [i], []
    seen.add(i)
    while st:
        x = st.pop(); c.append(x)
        for y in ADJ[x]:
            if y not in seen:
                seen.add(y); st.append(y)
    comps.append(c)
comps.sort(key=len, reverse=True)
beds = []
big = comps[0]
lab = {i: i for i in big}
order = sorted(big)
for _ in range(12):
    for i in order:
        cnt = collections.Counter(lab[j] for j in ADJ[i] if j in lab)
        if cnt:
            best = max(cnt.values())
            lab[i] = min(l for l, v in cnt.items() if v == best)
groups = collections.defaultdict(list)
for i in big:
    groups[lab[i]].append(i)
small = []
for grp in sorted(groups.values(), key=len, reverse=True):
    (beds if len(grp) >= 6 else small).append(grp)
for c in comps[1:]:
    (beds if len(c) >= 6 else small).append(c)
leftovers = [i for g in small for i in g]
if leftovers:
    beds.append(leftovers)
wild = [i for i in range(len(NODES)) if not ADJ[i]]
frames, posB, taken, BED_OF = [], {}, set(), {}
x0, y0, rowh = 1, 1, 0
for bed in beds:
    n = len(bed)
    bw = min(W - 2, max(26, int(math.sqrt(n) * 11)))
    bh = max(8, int(math.sqrt(n) * 4.2))
    if x0 + bw > W - 1:
        x0, y0, rowh = 1, y0 + rowh + 1, 0
    hub = max(bed, key=lambda i: DEG[i]) if bed is not leftovers else None
    name = ('bed of ' + NODES[hub]['title']) if hub is not None else 'small clusters'
    frames.append({'x': x0, 'y': y0, 'w': bw, 'h': bh, 'title': f'{name} · {n}'})
    lay = force(bed, (bw - 4) * CW, (bh - 3) * CH, 'bed-' + str(len(frames)), iters=300)
    posB.update(snap(lay, taken, x0 + 2, y0 + 2, gap=1, maxx=x0 + bw - 3, maxy=y0 + bh - 2))
    for i in bed:
        BED_OF[i] = len(frames)
    x0 += bw + 2
    rowh = max(rowh, bh)
y0 += rowh + 1
cols = 5
wh = 2 + math.ceil(len(wild) / cols) * 2
frames.append({'x': 1, 'y': y0, 'w': W - 2, 'h': wh, 'title': f'wildflowers, not linked yet · {len(wild)}'})
for k, i in enumerate(wild):
    posB[i] = (4 + (k % cols) * 29, y0 + 2 + (k // cols) * 2)
HB = y0 + wh + 1


def node_data(pos, bed_of=None):
    bed_of = bed_of or {}
    return [{'slug': n['slug'], 'title': n['title'], 'x': pos[i][0], 'y': pos[i][1], 'deg': DEG[i], 'stub': n['stub'],
             'bed': bed_of.get(i, 0), 'wild': not ADJ[i]} for i, n in enumerate(NODES)]


JS_MAP = r'''
  // The garden map: every note is its flower's glyph, every link a faint vine.
  // Hover a flower to light up its vines and name its neighbours; click to keep it.
  glyph(n) {
    if (n.stub) return [{ t: ',', c: '#5E8E4A' }];
    const p = this.specimen('notes/' + n.slug);
    const m = this.mark('notes/' + n.slug);
    if (n.deg >= 8) return m;
    const core = m.find((r) => /[@o*]/.test(r.t)) || m[0];
    return [core];
  }

  mapRows() {
    const D = this.data(), nodes = D.nodes, h = this.state.hover, s = this.state.sel;
    const focus = h >= 0 ? h : s;
    const g = this.grid(D.W, D.H);
    for (const f of D.frames) {
      for (let x = f.x; x < f.x + f.w; x++) { g.put(x, f.y, '-', '#C9BFA8'); g.put(x, f.y + f.h - 1, '-', '#C9BFA8'); }
      for (let y = f.y; y < f.y + f.h; y++) { g.put(f.x, y, '|', '#C9BFA8'); g.put(f.x + f.w - 1, y, '|', '#C9BFA8'); }
      for (const [cx, cy] of [[f.x, f.y], [f.x + f.w - 1, f.y], [f.x, f.y + f.h - 1], [f.x + f.w - 1, f.y + f.h - 1]]) g.put(cx, cy, '+', '#C9BFA8');
      const t = ' ' + f.title + ' ';
      for (let i = 0; i < t.length && f.x + 3 + i < f.x + f.w - 2; i++) g.put(f.x + 3 + i, f.y, t[i], '#535F52');
    }
    const lit = new Set();
    for (const [a, b] of D.edges) {
      const on = focus >= 0 && (a === focus || b === focus);
      if (on) { lit.add(a); lit.add(b); }
      if (!on && nodes[a].bed !== nodes[b].bed) continue;
      let x0 = nodes[a].x, y0 = nodes[a].y; const x1 = nodes[b].x, y1 = nodes[b].y;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, step = 0;
      const ch = dx > -dy * 2.2 ? '-' : -dy > dx * 2.2 ? '|' : (sx === sy ? '\\' : '/');
      while (!(x0 === x1 && y0 === y1)) {
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
        if (x0 === x1 && y0 === y1) break;
        step++;
        if (on) g.put(x0, y0, ch, '#3F8A52');
        else if (step % 2 === 0 && g.chars[y0] && g.chars[y0][x0] === ' ') g.put(x0, y0, '.', '#BDB39C');
      }
    }
    nodes.forEach((n, i) => {
      const gl = this.glyph(n), dim = focus >= 0 && !lit.has(i) && i !== focus;
      const x = n.x - Math.floor(gl.length / 2);
      gl.forEach((r, k) => g.put(x + k, n.y, r.t, dim ? '#B8AE98' : r.c));
    });
    const label = (i, color) => {
      const n = nodes[i], t = n.title.length > 26 ? n.title.slice(0, 25) + '…' : n.title;
      for (let k = 0; k < t.length; k++) g.put(n.x + 2 + k, n.y, t[k], color);
    };
    nodes.forEach((n, i) => { if (n.wild && i !== focus) label(i, '#535F52'); });
    if (focus < 0) nodes.forEach((n, i) => { if (n.deg >= 9) label(i, '#535F52'); });
    else { lit.forEach((i) => { if (i !== focus) label(i, '#1F2B23'); }); label(focus, '#2B7349'); }
    return this.toRows(g);
  }

  spots() {
    return this.data().nodes.map((n, i) => ({
      aria: n.title, left: Math.round((n.x - 1) * 7.8) + 'px', top: Math.round((n.y - 0.3) * 15) + 'px',
      enter: () => this.setState({ hover: i }), leave: () => this.setState({ hover: -1 }),
      pick: () => this.setState({ sel: this.state.sel === i ? -1 : i })
    }));
  }

  panel() {
    const D = this.data(), s = this.state.sel;
    if (s < 0) return { show: false, idle: true };
    const n = D.nodes[s], spec = this.specimen('notes/' + n.slug);
    const near = (list) => list.map((slug) => { const m = D.nodes.find((x) => x.slug === slug); return { title: m ? m.title : slug, mark: m ? this.glyph(m) : [] }; });
    return { show: true, idle: false, title: n.title, latin: n.stub ? 'a seedling, not written yet' : spec.latin, flower: this.specimenRows('notes/' + n.slug),
      outs: near(D.out[n.slug] || []), ins: near(D.inn[n.slug] || []) };
  }
'''


def map_board(title, eyebrow, intro, nodes, frames, hh):
    data = {'W': W, 'H': hh, 'nodes': nodes, 'edges': EDGES, 'frames': frames, 'out': OUT, 'inn': INN}
    js = JS_MAP + f"\n  data() {{ return this._d || (this._d = {json.dumps(data, ensure_ascii=False, separators=(',', ':'))}); }}\n"
    vals = "    return { map: this.mapRows(), spots: this.spots(), panel: this.panel(), roots: this.roots(), state: { tick: this.state.tick } };"
    near = lambda var: (f'<sc-for list="{{{{panel.{var}}}}}" as="m" hint-placeholder-count="4"><div style="display: flex; gap: 10px; align-items: baseline;">'
                        f'<span aria-hidden="true" style="width: 28px; white-space: pre; font-family: {MONO};"><sc-for list="{{{{m.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>'
                        f'<a href="#">{{{{m.title}}}}</a></div></sc-for>')
    body = f'''{nav('notes')}
<main style="max-width: 1220px; margin: 0 auto; padding: 48px 24px 40px;">
<div style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};">{eyebrow}</div>
<h1 style="margin: 6px 0 6px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">{title}</h1>
<p style="margin: 0 0 28px; color: {MUTED}; max-width: 70ch;">{intro}</p>
<div style="overflow-x: auto;"><div style="position: relative; width: {round(W * CW)}px; font-family: {MONO}; font-size: 13px; line-height: 15px;">
<div aria-hidden="true">{rows_loop("map", 50)}</div>
<sc-for list="{{{{spots}}}}" as="s" hint-placeholder-count="20"><button type="button" aria-label="{{{{s.aria}}}}" onMouseEnter="{{{{s.enter}}}}" onMouseLeave="{{{{s.leave}}}}" onFocus="{{{{s.enter}}}}" onBlur="{{{{s.leave}}}}" onClick="{{{{s.pick}}}}" style="position: absolute; left: {{{{s.left}}}}; top: {{{{s.top}}}}; width: 24px; height: 18px; padding: 0; border: 0; background: transparent; cursor: pointer;"></button></sc-for>
</div></div>
<div aria-live="polite" style="margin-top: 28px; min-height: 120px;">
<sc-if value="{{{{panel.idle}}}}" hint-placeholder-val="{{{{true}}}}"><p style="margin: 0; font-family: {MONO}; font-size: 13px; color: {MUTED};">Every note is a flower, and every vine a link. Hover a flower to see its neighbours; click it to keep it here.</p></sc-if>
<sc-if value="{{{{panel.show}}}}" hint-placeholder-val="{{{{false}}}}"><div style="display: flex; flex-wrap: wrap; gap: 24px 40px; align-items: flex-end; padding: 22px 26px; background: #F7F2E4; border: 1px solid #D8CFBA;">
<div aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop("panel.flower", 12)}</div>
<div style="flex: 1 1 260px; min-width: 0;"><div style="font-family: {SERIF}; font-style: italic; font-size: 15px; color: {MUTED};">{{{{panel.latin}}}}</div><a href="#" style="font-family: {MONO}; font-size: 22px; font-weight: 600;">{{{{panel.title}}}}</a></div>
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">links to</div>{near('outs')}</div>
<div style="flex: 1 1 220px; min-width: 0; font-size: 15px;"><div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin-bottom: 6px;">linked from</div>{near('ins')}</div>
</div></sc-if>
</div>
</main>
{FOOTER}'''
    comp = component(js, vals).replace('state = { tick: 0, hover: -1 };', 'state = { tick: 0, hover: -1, sel: -1 };')
    return page(title, body, comp, hh * 15 + 760, PAGE_CSS)


boards = {}
boards['GraphMap.dc.html'] = ('Graph · A · the garden map', map_board(
    'The garden map', 'Every note, and how they connect',
    'All my notes as one garden. The big ones are labelled; the rest name themselves when you hover them.',
    node_data(posA), framesA, HA), HA * 15 + 760)
boards['GraphBeds.dc.html'] = ('Graph · B · garden beds', map_board(
    'Garden beds', 'Every note, bed by bed',
    'Notes that link to each other grow in the same bed, named after its biggest flower. Notes with no links yet wait among the wildflowers.',
    node_data(posB, BED_OF), frames, HB), HB * 15 + 760)

# ---- note pages: replikace, with its neighbourhood two ways
FOCUS = 'replikace'
fi = IDX[FOCUS]
near_slugs = sorted(set(OUT[FOCUS]) | set(INN[FOCUS]), key=lambda s: NODES[IDX[s]]['title'])
second = sorted({NODES[j]['slug'] for s in near_slugs for j in ADJ[IDX[s]]} - set(near_slugs) - {FOCUS})
note_body = f'''<div style="font-family: {MONO}; font-size: 13px; color: {MUTED};"><a href="#" style="color: {MUTED};">notes</a> / distributed systems</div>
<div style="position: relative;"><div class="titleflower" aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop("flower", 12)}</div><h1 style="margin: 10px 0 8px; font-family: {MONO}; font-size: 34px; line-height: 1.2; font-weight: 600; color: {INK};">replikace</h1></div>
<div style="font-family: {MONO}; font-size: 13px; color: {MUTED}; margin-bottom: 32px;">česky · 4 min · #distributed_system · <span style="font-family: {SERIF}; font-style: italic;">{{{{card.latin}}}}</span></div>
{p("Replikace je proces udržování identických kopií dat nebo služeb na více uzlech současně. V distribuovaném systému se jedná o formu <strong>fyzické redundance</strong>.")}
{trail_heading("Motivace", "trailA")}
<ul style="margin: 0 0 20px; padding-left: 22px; display: flex; flex-direction: column; gap: 8px;">
<li><strong>Spolehlivost:</strong> při selhání jednoho uzlu data nezmizí a systém může dál poskytovat službu z jiné kopie.</li>
<li><strong>Dostupnost:</strong> minimalizuje riziko single point of failure.</li>
<li><strong>Výkon:</strong> paralelní zpracování požadavků a data fyzicky blíže uživateli.</li>
</ul>
{trail_heading("Hlavní problém: nekonzistence", "trailB")}
{p('Jakmile existuje více kopií, zpráva o změně stavu putuje k ostatním uzlům rychlostí sítě, nikoliv okamžitě. <a href="#">Konzistence</a> je pak klíčová vlastnost: silnější konzistence znamená vyšší latenci a nižší dostupnost (<a href="#">CAP theorem</a>).')}
'''


def radial():
    """Variant C: the note in the middle, its neighbours on a ring, their neighbours as faint dots."""
    RW, RH = 92, 25
    cx, cy = RW // 2, RH // 2
    pos = {FOCUS: (cx, cy)}
    for k, s in enumerate(near_slugs):
        a = -math.pi / 2 + 2 * math.pi * k / len(near_slugs)
        pos[s] = (cx + int(round(math.cos(a) * 21)), cy + int(round(math.sin(a) * 9)))
    r = random.Random('second')
    faint = []
    for k, s in enumerate(second):
        a = -math.pi / 2 + 2 * math.pi * (k + 0.5) / max(1, len(second))
        faint.append((cx + int(round(math.cos(a) * 34)), cy + int(round(math.sin(a) * 12)), s))
    labels = []
    for s in near_slugs:
        x, y = pos[s]
        t = NODES[IDX[s]]['title']
        t = t if len(t) <= 22 else t[:21] + '…'
        lx = x + 2 if x >= cx else x - 1 - len(t)
        labels.append({'slug': s, 'title': t, 'x': x, 'y': y, 'left': f'{round((lx) * CW)}px', 'top': f'{round(y * CH)}px',
                       'dir': 'out' if s in OUT[FOCUS] else 'in'})
    return {'W': RW, 'H': RH, 'center': [cx, cy], 'labels': labels, 'faint': faint}


RAD = radial()
JS_RADIAL = f'''
  // The note's neighbourhood: its flower in the middle, the notes it touches on a ring,
  // and their own neighbours as faint dots further out.
  radial() {{
    const R = {json.dumps(RAD, ensure_ascii=False)}, g = this.grid(R.W, R.H), [cx, cy] = R.center;
    for (const [x, y] of R.faint.map((f) => [f[0], f[1]])) g.put(x, y, '.', '#B8AE98');
    for (const l of R.labels) {{
      let x0 = cx, y0 = cy; const x1 = l.x, y1 = l.y;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      const ch = dx > -dy * 2.2 ? '~' : -dy > dx * 2.2 ? '|' : (sx === sy ? '\\\\' : '/');
      while (true) {{
        const e2 = 2 * err;
        if (e2 >= dy) {{ err += dy; x0 += sx; }}
        if (e2 <= dx) {{ err += dx; y0 += sy; }}
        if (x0 === x1 && y0 === y1) break;
        if (Math.abs(x0 - cx) > 2 || y0 !== cy) g.put(x0, y0, ch, l.dir === 'out' ? '#3F8A52' : '#5E8E4A');
      }}
      const m = this.mark('notes/' + l.slug), core = m.find((r) => /[@o*]/.test(r.t)) || m[0];
      g.put(l.x, l.y, core.t, core.c);
    }}
    const mk = this.mark('notes/{FOCUS}');
    mk.forEach((r, k) => g.put(cx - 1 + k, cy, r.t, r.c));
    return this.toRows(g);
  }}
  radialLabels() {{ return {json.dumps(RAD['labels'], ensure_ascii=False)}; }}
'''
radial_html = f'''<section aria-label="Neighbourhood" style="margin-top: 64px;">
{trail_heading("Sousedství", "trailC", 0)}
<div style="overflow-x: auto;"><div style="position: relative; width: {round(RAD['W'] * CW)}px; font-family: {MONO}; font-size: 13px; line-height: 15px;">
<div aria-hidden="true">{rows_loop("radial", 25)}</div>
<sc-for list="{{{{labels}}}}" as="l" hint-placeholder-count="9"><a href="#" style="position: absolute; left: {{{{l.left}}}}; top: {{{{l.top}}}}; white-space: pre; font-size: 13px; line-height: 15px;">{{{{l.title}}}}</a></sc-for>
<span style="position: absolute; left: {round((RAD['center'][0] + 3) * CW)}px; top: {RAD['center'][1] * CH}px; font-weight: 600; color: {CANOPY};">replikace</span>
</div></div>
<p style="margin: 10px 0 0; font-family: {MONO}; font-size: 12px; color: {MUTED};">Dark vines lead to notes this one links to, light vines come from notes that link here. Dots are their neighbours, two steps away.</p>
</section>'''


def tree_rows(slugs, up):
    rows = []
    n = len(slugs)
    for k, s in enumerate(slugs):
        last = k == n - 1
        rows.append({'title': NODES[IDX[s]]['title'], 'slug': s, 'twig': (',--' if up and k == 0 else "'--" if (not up and last) else '|--')})
    return rows


branches, roots_ = sorted(OUT[FOCUS], key=lambda s: NODES[IDX[s]]['title']), sorted(INN[FOCUS], key=lambda s: NODES[IDX[s]]['title'])
JS_TREE = f'''
  // Branches and roots: the notes this one links to grow up as branches, the notes that link
  // here hang below as roots.
  treeRows(list) {{ return list.map((r) => ({{ ...r, mark: this.mark('notes/' + r.slug) }})); }}
  branches() {{ return this.treeRows({json.dumps(tree_rows(branches, True), ensure_ascii=False)}); }}
  rootsOf() {{ return this.treeRows({json.dumps(tree_rows(roots_, False), ensure_ascii=False)}); }}
'''
row = lambda listname: (f'<sc-for list="{{{{{listname}}}}}" as="b" hint-placeholder-count="5"><div style="display: flex; gap: 10px; align-items: baseline; height: 26px;">'
                        f'<span aria-hidden="true" style="white-space: pre; color: {FERN};">      {{{{b.twig}}}} </span>'
                        f'<span aria-hidden="true" style="white-space: pre; width: 30px;"><sc-for list="{{{{b.mark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span>'
                        f'<a href="#" style="font-family: {SERIF}; font-size: 16px;">{{{{b.title}}}}</a></div></sc-for>')
tree_html = f'''<section aria-label="Branches and roots" style="margin-top: 64px;">
{trail_heading("Větve a kořeny", "trailC", 0)}
<div style="font-family: {MONO}; font-size: 13px; line-height: 15px;">
<div style="color: {MUTED}; font-size: 12px; margin: 4px 0 8px;">links to</div>
{row("branches")}
<div style="display: flex; gap: 10px; align-items: baseline; height: 30px;"><span aria-hidden="true" style="white-space: pre; color: {FERN};">      |   </span></div>
<div style="display: flex; gap: 10px; align-items: baseline; height: 30px;"><span aria-hidden="true" style="white-space: pre; color: {FERN};">     \\|/  </span><span aria-hidden="true" style="white-space: pre;"><sc-for list="{{{{selfMark}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></span><span style="font-weight: 600; color: {CANOPY}; font-size: 15px;">replikace</span></div>
<div style="display: flex; gap: 10px; align-items: baseline; height: 30px;"><span aria-hidden="true" style="white-space: pre; color: {EARTH};">     /|\\  </span></div>
<div style="color: {MUTED}; font-size: 12px; margin: 4px 0 8px;">linked from</div>
{row("rootsList").replace(FERN, EARTH)}
</div>
</section>'''

for name, title, extra_html, extra_js, extra_vals in [
    ('GraphNoteRadial.dc.html', 'Graph · C · a note’s neighbourhood', radial_html, JS_RADIAL, "radial: this.radial(), labels: this.radialLabels()"),
    ('GraphNoteTree.dc.html', 'Graph · D · branches and roots', tree_html, JS_TREE, "branches: this.branches(), rootsList: this.rootsOf(), selfMark: this.mark('notes/" + FOCUS + "')"),
]:
    inner = note_body + extra_html + f'<div style="margin-top: 56px;">{specimen_card("card", "flower")}</div>'
    body = VINE_MARKUP + '\n' + nav('notes') + '\n' + '<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">\n' + inner + '\n</main>\n' + FOOTER
    vals = (f"    const card = this.label('notes/{FOCUS}', 'N-' + this.specimen('notes/{FOCUS}').seed.slice(0, 3).toUpperCase(), 'replikace', 'from the notes');\n"
            f"    return {{ flower: this.specimenRows('notes/{FOCUS}'), card, vine: this.vine(), bugs: this.bugs(), roots: this.roots(), trailA: this.trail('a-rep'), trailB: this.trail('b-rep'), trailC: this.trail('c-rep'), {extra_vals} }};")
    boards[name] = (title, page(title.split(' · ')[-1], body, component(JS_VINE + extra_js, vals), 2300, PAGE_CSS, 'cs'), 2300)

for name, (_, src, _) in boards.items():
    open('jungle/project/' + name, 'w', encoding='utf-8').write(src)
print('boards:', list(boards), '| bed frames:', [f['title'] for f in frames], '| map rows', H, 'beds rows', HB)
print('near', near_slugs, '| second', len(second))

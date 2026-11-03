"""Shared pieces of the garden prototypes (drawing code, specimens, nav, footer, vine, page shell)."""
import json
import random

OUT = 'jungle/project/'
INK, MUTED, CANOPY, RIVER = '#1F2B23', '#535F52', '#2B7349', '#1D5A8F'
FERN, MOSS, MANGO, HIBISCUS, ORCHID, LAGOON = '#3F8A52', '#5E8E4A', '#A87400', '#C24E39', '#8A4F98', '#2A7099'
EARTH, BARK = '#7A5C42', '#5C4636'
MONO = "'IBM Plex Mono', ui-monospace, monospace"
SERIF = "'Literata', Georgia, serif"

JS_BASE = r'''
  rng(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  grid(w, h) {
    const chars = [], cols = [];
    for (let y = 0; y < h; y++) { chars.push(new Array(w).fill(' ')); cols.push(new Array(w).fill('')); }
    const put = (x, y, ch, c) => { if (x >= 0 && x < w && y >= 0 && y < h && ch !== ' ') { chars[y][x] = ch; cols[y][x] = c; } };
    return { chars, cols, put, w, h };
  }

  toRows(g) {
    const rows = [];
    for (let y = 0; y < g.h; y++) {
      const runs = []; let t = '', cur = null;
      for (let x = 0; x < g.w; x++) {
        const ch = g.chars[y][x];
        const key = ch === ' ' ? '' : g.cols[y][x];
        if (cur === null) cur = key;
        else if (key !== cur) { runs.push({ t, c: cur || 'transparent' }); t = ''; cur = key; }
        t += ch;
      }
      runs.push({ t, c: cur || 'transparent' });
      rows.push({ runs });
    }
    return rows;
  }

  // The home page's wind: one gust for every plant, so they all lean the same way.
  wind() {
    const t = this.state.tick * 0.25;
    return 0.75 * Math.sin(t * 0.55) + 0.35 * Math.sin(t * 0.21) + 0.45;
  }

  // ---- specimens: every post and note grows its own flower from its seed ----

  heads() {
    return [
      { rows: ['\\|/', '-@-', '/|\\'], genus: 'Radiantia', name: 'sunburst' },
      { rows: [' * ', '*o*', ' * '], genus: 'Stellaria', name: 'star' },
      { rows: ['.-.', '(o)', "'-'"], genus: 'Globularia', name: 'globe' },
      { rows: ['\\ /', '-*-', '/ \\'], genus: 'Asteriscus', name: 'asterisk' },
      { rows: [' ^ ', '/@\\'], genus: 'Tulipa', name: 'tulip' },
      { rows: ['o@o', '@o@'], genus: 'Racemosa', name: 'cluster' },
      { rows: [' , ', '(@)'], genus: 'Nutans', name: 'nodding cup' },
      { rows: ['.:.', '(*)'], genus: 'Pollinaria', name: 'pollen cup' },
      { rows: ['{*}'], genus: 'Orchidea', name: 'orchid' },
      { rows: ['(@)'], genus: 'Ocellus', name: 'eye' }
    ];
  }

  specimen(slug) {
    this._spec = this._spec || {};
    if (this._spec[slug]) return this._spec[slug];
    const r = this.rng('flower:' + slug), heads = this.heads();
    const petals = [['hibiscus', '#C24E39'], ['orchid', '#8A4F98'], ['mango', '#A87400'], ['lagoon', '#2A7099'], ['rose', '#B5476E']];
    const centers = [['mango', '#A87400'], ['ink', '#1F2B23'], ['hibiscus', '#C24E39']];
    const head = heads[Math.floor(r() * heads.length)];
    const petal = petals[Math.floor(r() * petals.length)];
    let center = centers[Math.floor(r() * centers.length)];
    if (center[1] === petal[1]) center = centers[1];
    const h = 6 + Math.floor(r() * 5), stiff = 0.7 + r() * 0.6, habit = r();
    const lean = habit < 0.33 ? -1 : habit > 0.66 ? 1 : 0;
    const style = ['fern', 'alternate', 'sparse'][Math.floor(r() * 3)];
    const leaves = [];
    for (let k = 1; k < h; k++) {
      if (style === 'fern' && r() < 0.7) leaves.push({ k, both: true });
      else if (style === 'alternate' && k % 2 === 1) leaves.push({ k, side: k % 4 === 1 ? -1 : 1 });
      else if (style === 'sparse' && r() < 0.25) leaves.push({ k, side: r() < 0.5 ? -1 : 1 });
    }
    const words = slug.split(/[-/]/).filter((w) => w.length >= 4 && !/^[0-9]+$/.test(w) && w !== 'notes' && w !== 'posts');
    const word = words.length ? words[Math.floor(r() * words.length)] : (slug.replace(/[^a-z]/g, '') || 'anonym');
    const species = word.replace(/[aeiouy]+$/, '') + ['ensis', 'ica', 'alis', 'ia'][Math.floor(r() * 4)];
    let fnv = 2166136261;
    for (let i = 0; i < slug.length; i++) { fnv ^= slug.charCodeAt(i); fnv = Math.imul(fnv, 16777619); }
    const seed = (fnv >>> 0).toString(16).padStart(8, '0');
    const hasCenter = head.rows.join('').match(/[@o]/) !== null;
    this._spec[slug] = { slug, head, petal, center: hasCenter ? center : null, h, stiff, lean, style, leaves, latin: head.genus + ' ' + species, seed };
    return this._spec[slug];
  }

  // Draw a plant standing at column x with its stem's foot on row base, bending in the wind.
  drawPlant(g, p, x, base, wind) {
    const amp = (p.h >= 7 ? 1.6 : 1.1) * p.stiff;
    const off = (k) => Math.round((amp * wind + (p.lean || 0) * 0.8) * Math.pow(k / p.h, 1.6));
    for (let k = 0; k < p.h; k++) {
      const d = k === 0 ? 0 : off(k) - off(k - 1);
      g.put(x + off(k), base - k, d > 0 ? '/' : d < 0 ? '\\' : '|', '#2B7349');
    }
    for (const l of p.leaves) {
      const y = base - l.k, sx = x + off(l.k);
      if (l.both) { g.put(sx - 1, y, '\\', '#3F8A52'); g.put(sx + 1, y, '/', '#3F8A52'); }
      else g.put(sx + l.side, y, l.side < 0 ? '\\' : '/', '#3F8A52');
    }
    const topX = x + off(p.h);
    if (p.fern) { g.put(topX, base - p.h, "'", '#3F8A52'); return; }
    const rows = p.head.rows;
    rows.forEach((line, i) => {
      const half = Math.floor(line.length / 2);
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        g.put(topX - half + j, base - p.h - (rows.length - 1) + i, ch, (ch === '@' || ch === 'o') && p.center ? p.center[1] : p.petal[1]);
      }
    });
  }

  // A specimen alone, with a little soil under it.
  specimenRows(slug) {
    const p = this.specimen(slug), H = p.h + p.head.rows.length + 2, W = 15, g = this.grid(W, H);
    for (let x = 3; x < 12; x++) { g.put(x, H - 1, x % 2 ? '_' : '.', '#7A5C42'); if (x % 3 === 0) g.put(x, H - 2, ',', '#5E8E4A'); }
    this.drawPlant(g, p, 7, H - 2, this.wind());
    return this.toRows(g);
  }

  // The flower's most telling row, as a small mark beside a title.
  mark(slug) {
    const p = this.specimen(slug), rows = p.head.rows;
    const row = (rows.find((r) => /[@o*]/.test(r)) || rows[0]).trim();
    return row.split('').map((ch) => ({ t: ch, c: (ch === '@' || ch === 'o') && p.center ? p.center[1] : p.petal[1] }));
  }

  // The museum label: what the seed grew into.
  label(slug, no, title, date) {
    const p = this.specimen(slug);
    const key = (k) => k + ' ' + '.'.repeat(Math.max(2, 9 - k.length));
    const habit = p.lean < 0 ? 'leaning west' : p.lean > 0 ? 'leaning east' : 'upright';
    const leaves = p.leaves.length === 0 ? 'bare stem' : (p.style === 'fern' ? 'fern pairs' : p.style) + ' × ' + p.leaves.length;
    return {
      no, title, date, slug, latin: p.latin,
      lines: [
        { k: key('head'), v: p.head.name + '   ' + p.head.rows.map((r) => r.trim()).join(' ') },
        { k: key('petals'), v: p.petal[0] + (p.center ? ', ' + p.center[0] + ' centre' : '') },
        { k: key('stem'), v: p.h + ' rows, ' + habit },
        { k: key('leaves'), v: leaves },
        { k: key('seed'), v: '0x' + p.seed }
      ]
    };
  }

  // ---- the home page's soil and trailing vines, unchanged ----

  roots() {
    if (this._roots) return this._roots;
    const r = this.rng('roots');
    const W = 190, H = 8;
    const g = this.grid(W, H);
    for (let x = 0; x < W; x++) {
      if (r() < 0.4) g.put(x, 0, [',', "'", '"', 'v'][Math.floor(r() * 4)], '#5E8E4A');
      g.put(x, 1, '_', '#7A5C42');
    }
    for (let i = 0; i < 9; i++) {
      const mx = 4 + Math.floor(r() * (W - 8));
      g.put(mx - 1, 0, '(', '#C24E39'); g.put(mx, 0, '^', '#C24E39'); g.put(mx + 1, 0, ')', '#C24E39');
    }
    let x0 = 4;
    while (x0 < W - 4) {
      let x = x0;
      const len = 3 + Math.floor(r() * 4);
      for (let y = 2; y < 2 + len && y < H; y++) {
        const d = r() < 0.3 ? -1 : r() > 0.7 ? 1 : 0;
        g.put(x, y, d < 0 ? '/' : d > 0 ? '\\' : '|', '#5C4636');
        if (r() < 0.25) g.put(x + (r() < 0.5 ? -1 : 1), y, r() < 0.5 ? '~' : '.', '#7A5C42');
        x += d;
      }
      x0 += 6 + Math.floor(r() * 10);
    }
    for (let i = 0; i < 40; i++) g.put(Math.floor(r() * W), 2 + Math.floor(r() * (H - 2)), r() < 0.5 ? '.' : 'o', '#8C7C66');
    this._roots = this.toRows(g);
    return this._roots;
  }

  trail(seed) {
    this._trails = this._trails || {};
    if (this._trails[seed]) return this._trails[seed];
    const r = this.rng(seed);
    const runs = [];
    let t = '';
    for (let i = 0; i < 140; i++) {
      const p = r();
      if (i > 2 && p < 0.07) { if (t) runs.push({ t, c: '#3F8A52' }); t = ''; runs.push({ t: r() < 0.5 ? '&' : '%', c: '#2B7349' }); }
      else if (i > 2 && p < 0.085) { if (t) runs.push({ t, c: '#3F8A52' }); t = ''; runs.push({ t: '@', c: '#C24E39' }); }
      else t += r() < 0.8 ? '~' : '-';
    }
    if (t) runs.push({ t, c: '#3F8A52' });
    this._trails[seed] = runs;
    return runs;
  }
'''


def rows_loop(listname, count=8, line=15):
    return (f'<sc-for list="{{{{{listname}}}}}" as="row" hint-placeholder-count="{count}"><div style="white-space: pre; height: {line}px;">'
            f'<sc-for list="{{{{row.runs}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></div></sc-for>')


def trail_heading(text, listname, top=56, tag='h2'):
    return (f'<div style="display: flex; align-items: baseline; gap: 14px; margin: {top}px 0 16px;">'
            f'<{tag} style="margin: 0; font-family: {MONO}; font-size: 20px; font-weight: 600; color: {CANOPY}; white-space: nowrap;">{text}</{tag}>'
            f'<div aria-hidden="true" style="flex: 1; min-width: 0; overflow: hidden; white-space: pre; font-family: {MONO}; font-size: 14px;">'
            f'<sc-for list="{{{{{listname}}}}}" as="r" hint-placeholder-count="1"><span style="color: {{{{r.c}}}}">{{{{r.t}}}}</span></sc-for></div></div>')


def h3(text):
    return f'<h3 style="margin: 36px 0 10px; font-family: {MONO}; font-size: 17px; font-weight: 600; color: {CANOPY};">{text}</h3>'


def p(t):
    return f'<p style="margin: 0 0 16px;">{t}</p>'


def nav(active, top=30, between=False):
    items = ['notes', 'posts', 'projects', 'courses', 'about', 'cv']
    links = ''.join(
        f'<a href="#" aria-current="page" style="color: {INK}; text-decoration: none; font-weight: 600;">[&gt;{i}]</a>\n' if i == active
        else f'<a href="#" style="color: {CANOPY}; text-decoration: none;">[{i}]</a>\n' for i in items)
    jc = ' justify-content: space-between;' if between else ''
    return (f'<nav aria-label="Main" style="max-width: 1040px; margin: 0 auto; padding: {top}px 24px 0; display: flex; flex-wrap: wrap; align-items: baseline;{jc} gap: 12px 24px; font-family: {MONO}; position: relative;">\n'
            f'<a href="#" style="color: {INK}; text-decoration: none; font-weight: 600; font-size: 18px;">Matěj Schrödl</a>\n'
            f'<div style="display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px;">\n{links}</div>\n</nav>')


FOOTER = f'''<footer style="margin-top: 24px;">
<div aria-hidden="true" style="overflow: hidden; font-family: {MONO}; font-size: 13px; line-height: 15px; display: flex; justify-content: center;">
<div>{rows_loop("roots")}</div>
</div>
<div style="background: #E5DDCA; padding: 20px 24px 28px;">
<div style="max-width: 1040px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 24px; font-family: {MONO}; font-size: 13px; color: {BARK};">
<span>Matěj Schrödl · grown in Obsidian</span>
<div style="display: flex; gap: 20px;"><a href="#" style="color: {BARK};">GitHub</a><a href="#" style="color: {BARK};">RSS</a><a href="#" style="color: {BARK};">CV</a></div>
</div>
</div>
</footer>'''


def specimen_card(var, rows_var, wide=True):
    """The museum label for one specimen: its flower, its Latin name and how its seed grew it."""
    direction = 'row' if wide else 'column'
    return f'''<section aria-label="This page's flower" style="display: flex; flex-direction: {direction}; flex-wrap: wrap; gap: 18px 32px; align-items: flex-end; padding: 24px 28px; background: #F7F2E4; border: 1px solid #D8CFBA;">
<div aria-hidden="true" style="font-family: {MONO}; font-size: 13px; line-height: 15px;">{rows_loop(rows_var, 12)}</div>
<div style="flex: 1 1 280px; min-width: 0; font-family: {MONO}; font-size: 13px; line-height: 1.65;">
<div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: {MUTED};">Specimen No. {{{{{var}.no}}}} · Herbarium schrodlmensis</div>
<div style="font-family: {SERIF}; font-style: italic; font-size: 24px; line-height: 1.3; color: {INK}; margin: 4px 0 2px;">{{{{{var}.latin}}}}</div>
<div style="color: {MUTED}; margin-bottom: 12px;">grown from “{{{{{var}.slug}}}}” · planted {{{{{var}.date}}}}</div>
<sc-for list="{{{{{var}.lines}}}}" as="l" hint-placeholder-count="5"><div style="display: flex; gap: 10px;"><span style="color: {MUTED}; white-space: pre;">{{{{l.k}}}}</span><span style="color: {INK}; white-space: pre-wrap;">{{{{l.v}}}}</span></div></sc-for>
</div>
</section>'''


def component(methods, vals, mount=''):
    return f'''class Component extends DCLogic {{
  state = {{ tick: 0, hover: -1 }};

  componentDidMount() {{
{mount}    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    this.timer = setInterval(() => {{
      if (this.props.motion === false) return;
      this.setState({{ tick: this.state.tick + 1 }});
    }}, 250);
  }}

  componentWillUnmount() {{ clearInterval(this.timer); }}
{JS_BASE}{methods}
  renderVals() {{
{vals}
  }}
}}'''


def page(title, body, js, height, css='', lang='en'):
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&amp;family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400;1,7..72,600&amp;display=swap">
<style>
body{{margin:0;background:#F1ECDF}}
a{{color:{RIVER}}}a:hover{{color:#15466F}}
{css}</style>
</helmet>
<div style="background: #F1ECDF; color: {INK}; font-family: {SERIF}; font-size: 17px; line-height: 1.65; position: relative; overflow: hidden;">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"motion":{{"editor":"boolean","default":true,"section":"Flora"}},"$preview":{{"width":1280,"height":{height}}}}}'>
{js}
</script>
</body>
</html>
'''


def long_vine():
    r = random.Random('long-vine')
    W, H = 16, 72
    cells = {}
    put = lambda x, y, ch, c: cells.__setitem__((x, y), (ch, c)) if 0 <= x < W and 0 <= y < H else None
    x, path, rest, blooms = 8, [], [], []
    for y in range(H - 1):
        d = 0 if r.random() < 0.65 else (-1 if r.random() < 0.5 else 1)
        x = max(3, min(W - 4, x + d))
        path.append(x)
        put(x, y, '/' if d < 0 else ('\\' if d > 0 else '|'), FERN)
        if y > 1 and r.random() < 0.3:
            side = -1 if r.random() < 0.5 else 1
            put(x + side, y, r.choice('&%'), r.choice([CANOPY, FERN]))
            if y > 4 and r.random() < 0.5:
                put(x + side * 2, y, r.choice('&%'), MOSS)
            if y > 5:
                rest.append((x + side * 2, y - 1))
        if y > 4 and r.random() < 0.05:
            side = -1 if r.random() < 0.5 else 1
            put(x + side, y, '@', r.choice([HIBISCUS, ORCHID, MANGO, LAGOON]))
            blooms.append((x + side, y))
    put(x, H - 1, '@', HIBISCUS)
    path.append(x)
    rows = []
    for y in range(H):
        runs, t, cur = [], '', None
        for xx in range(W):
            ch, c = cells.get((xx, y), (' ', ''))
            key = c if ch != ' ' else ''
            if cur is None:
                cur = key
            elif key != cur:
                runs.append({'t': t, 'c': cur or 'transparent'}); t, cur = '', key
            t += ch
        runs.append({'t': t, 'c': cur or 'transparent'})
        rows.append({'runs': runs})
    return rows, path, rest, blooms


VINE_ROWS, VINE_PATH, VINE_REST, VINE_BLOOMS = long_vine()

JS_VINE = f'''
  // One long vine beside the text. A butterfly rests on it and every ~40 s flutters to another
  // leaf; a ladybug climbs up and down the stem; now and then a bee hovers around a bloom.
  vine() {{ return {json.dumps(VINE_ROWS, separators=(',', ':'))}; }}

  bugs() {{
    const t = this.state.tick, rest = {json.dumps(VINE_REST)}, path = {json.dumps(VINE_PATH)}, blooms = {json.dumps(VINE_BLOOMS)};
    const CW = 7.8, CH = 15, cycle = 160, i = Math.floor(t / cycle), p = t % cycle;
    const a = rest[i % rest.length], b = rest[(i + 1) % rest.length];
    let fx, fy, fw;
    if (p < 140) {{ fx = a[0]; fy = a[1]; fw = (t % 12) < 8 ? '}}{{' : '||'; }}
    else {{ const k = (p - 140) / 20; fx = a[0] + (b[0] - a[0]) * k; fy = a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 3; fw = t % 2 ? '}}{{' : ')('; }}
    const span = 2 * (path.length - 1), q = Math.floor(t * 0.08) % span, ly = q < path.length ? path.length - 1 - q : q - path.length + 1;
    const bl = blooms[Math.floor(t / 240) % blooms.length];
    const bx = bl[0] + Math.sin(t * 0.35) * 3, by = bl[1] - 1 + Math.sin(t * 0.22) * 1.5;
    return {{
      fly: {{ left: Math.round(fx * CW) + 'px', top: Math.round(fy * CH) + 'px', w: fw }},
      lady: {{ left: Math.round((path[ly] - 1) * CW) + 'px', top: (ly * CH) + 'px' }},
      bee: {{ show: (t % 240) < 60, left: Math.round(bx * CW) + 'px', top: Math.round(by * CH) + 'px', w: (t % 2 ? '~' : '-') + '8>' }}
    }};
  }}
'''

VINE_MARKUP = (f'<div class="wide" aria-hidden="true" style="position: absolute; top: 0; left: calc(50% + 404px); pointer-events: none; font-family: {MONO}; font-size: 13px; line-height: 15px;">'
               f'<div style="position: relative;">{rows_loop("vine", 40)}'
               f'<span style="position: absolute; left: {{{{bugs.fly.left}}}}; top: {{{{bugs.fly.top}}}}; white-space: pre; color: {ORCHID};">{{{{bugs.fly.w}}}}</span>'
               f'<span style="position: absolute; left: {{{{bugs.lady.left}}}}; top: {{{{bugs.lady.top}}}}; white-space: pre;"><span style="color: {HIBISCUS};">(</span><span style="color: {INK};">:</span><span style="color: {HIBISCUS};">)</span></span>'
               f'<sc-if value="{{{{bugs.bee.show}}}}" hint-placeholder-val="{{{{false}}}}"><span style="position: absolute; left: {{{{bugs.bee.left}}}}; top: {{{{bugs.bee.top}}}}; white-space: pre; color: {MANGO};">{{{{bugs.bee.w}}}}</span></sc-if>'
               f'</div></div>')

PAGE_CSS = ('.wide{display:block}\n@media (max-width: 1100px){.wide{display:none}}\n'
            '.titleflower{position:absolute;left:-170px;top:-24px}\n@media (max-width: 1100px){.titleflower{position:static;margin:4px 0 6px}}\n')

boards = {}

# ---------------------------------------------------------------- Garden home

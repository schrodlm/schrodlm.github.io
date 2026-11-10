"""The courses section: its front page and one home page per university, each with the faculty's
emblem cut as a woodcut pixel plate (3 px cells, Bayer-dithered, on an offscreen canvas). Two emblem
treatments per faculty, switched by the `emblem` Tweak prop: a pixel seal set from the faculty's
initials, or a small plate of its building. Courses are listed from their front matter, as the site
would generate them. Writes CoursesHome, UniFIT and UniMFF."""
import glob
import html
import json
import os
import re

from gen_garden2 import (OUT, INK, MUTED, CANOPY, RIVER, MONO, SERIF, BARK, FOOTER, nav, component, page)

VAULT = '/home/schrodlm/dev/second-brain/uni/courses/'

# ---------------------------------------------------------------- content (read only)


def read(name):
    text = open(os.path.join(VAULT, name), encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith('#') or line[0] in ' \t-':
            continue
        k, _, v = line.partition(':')
        v = v.strip().strip('"')
        if v:
            meta[k.strip()] = v
    return meta, m.group(2)


def num(v):
    if v is None:
        return None
    f = float(v)
    return int(f) if f == int(f) else f


def wiki(s, known):
    def link(m):
        t = m.group(1)
        return f'<a href="#">{html.escape(t)}</a>' if t in known else html.escape(t)
    return re.sub(r'\[\[([^\]|]+)\]\]', link, s)


def prose(body, known, stop=None, drop_links=()):
    """The owner's text as paragraphs. TODO lines are left out; the hand-kept course list (from `stop`
    on) is replaced by the generated one; list items that only link a university become its entry."""
    if stop and stop in body:
        body = body[:body.index(stop)]
    out = []
    for block in re.split(r'\n\s*\n', body.strip()):
        lines = [l for l in block.splitlines() if l.strip() and not l.strip().startswith('TODO')]
        if not lines:
            continue
        if all(l.lstrip().startswith('- ') for l in lines):
            items = [l.lstrip()[2:] for l in lines if not any(f'[[{d}]]' == l.lstrip()[2:].strip() for d in drop_links)]
            if items:
                out.append('<ul>' + ''.join(f'<li>{wiki(i, known)}</li>' for i in items) + '</ul>')
            continue
        out.append(f'<p style="margin: 0 0 16px;">{wiki(" ".join(l.strip() for l in lines), known)}</p>')
    return '\n'.join(out)


COURSES = []
for path in sorted(glob.glob(VAULT + '*.md')):
    meta, body = read(os.path.basename(path))
    if meta.get('layout') != 'course':
        continue
    code = meta.get('course_code')
    name = meta['title'].split(' - ', 1)[1] if ' - ' in meta['title'] else meta['title']
    COURSES.append({
        'code': code, 'name': name, 'uni': meta['university'], 'year': int(meta['year']), 'sem': int(meta['semester']),
        'difficulty': num(meta.get('difficulty')), 'usefulness': num(meta.get('usefulness')),
        'teaching': num(meta.get('teaching_quality')),
        'worth': None if 'worth_it' not in meta else meta['worth_it'] == 'true', 'page': True})

KNOWN = {'FIT ČVUT', 'MFF'} | {f"{c['code']} - {c['name']}" for c in COURSES}
_, FRONT = read('front_page.md')
_, FIT_MD = read('FIT ČVUT.md')
_, MFF_MD = read('MFF.md')
FRONT_HTML = prose(FRONT, KNOWN, drop_links=('FIT ČVUT', 'MFF'))
FIT_HTML = prose(FIT_MD, KNOWN, stop='## Semestry')
MFF_HTML = prose(MFF_MD, KNOWN)

UNIS = {
    'FIT': {'key': 'fit', 'title': 'FIT ČVUT', 'degree': "bachelor's", 'meta': "bachelor's · software engineering · 2021–2025", 'years': '2021–2025',
            'full': 'Fakulta informačních technologií, České vysoké učení technické v Praze',
            'place': 'Dejvice, Praha 6', 'house': 'after the ČVUT buildings in Dejvice', 'html': FIT_HTML,
            # FIT's own note lists courses by semester; the ones without a review page show unlinked.
            'extra': [{'code': '[code]', 'name': '[a course from my FIT note, no review page yet]', 'uni': 'FIT',
                       'year': 2022, 'sem': 3, 'difficulty': None, 'usefulness': None, 'teaching': None, 'worth': None, 'page': False}]},
    'MFF': {'key': 'mff', 'title': 'MFF', 'degree': "master's", 'meta': "master's · System Programming · since 2025", 'years': 'since 2025',
            'full': 'Matematicko-fyzikální fakulta, Univerzita Karlova',
            'place': 'Malostranské náměstí, Praha 1', 'house': 'after the faculty on Malostranské náměstí', 'html': MFF_HTML, 'extra': []},
}


def term(c):
    return f"{c['year']}/{(c['year'] + 1) % 100:02d}", 'winter' if c['sem'] % 2 else 'summer'


def ratings(c):
    parts = [f'{k} {c[f]}' for k, f in (('difficulty', 'difficulty'), ('usefulness', 'usefulness'), ('teaching', 'teaching')) if c[f] is not None]
    return ' · '.join(parts) if parts else ('not rated yet' if c['page'] else 'no review page')


def verdict(c):
    if c['worth'] is True:
        return f'<span class="vd" style="color: {CANOPY};">[+] worth it</span>'
    if c['worth'] is False:
        return f'<span class="vd" style="color: {INK};">[–] not worth it</span>'
    return f'<span class="vd" style="color: {MUTED};">{"[ ] no verdict" if c["page"] else ""}</span>'


# ---------------------------------------------------------------- shared markup

LBL = f'font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: {MUTED};'
CSS = '''.plw{display:block}.pln{display:none}
@media (max-width: 760px){.plw{display:none}.pln{display:block}.capr{display:none}}
.crow{display:grid;grid-template-columns:84px minmax(0,1fr) auto;column-gap:16px;row-gap:2px;align-items:baseline;padding:11px 8px;margin:0 -8px;border-top:1px solid #E2D9C4}
.crow:hover{background:#ECE5D3}
.crow .cc{grid-column:1;grid-row:1}.crow .cn{grid-column:2;grid-row:1}.crow .vd{grid-column:3;grid-row:1;white-space:nowrap}.crow .cr{grid-column:2/4;grid-row:2}
@media (max-width: 560px){.crow{grid-template-columns:minmax(0,1fr) auto}.crow .cc{grid-column:1;grid-row:1}.crow .vd{grid-column:2;grid-row:1}.crow .cn{grid-column:1/3;grid-row:2}.crow .cr{grid-column:1/3;grid-row:3}}
.irow{display:grid;grid-template-columns:84px minmax(0,1fr) auto;column-gap:16px;align-items:baseline;padding:5px 0}
@media (max-width: 560px){.irow{grid-template-columns:minmax(0,1fr) auto}.irow .cn{grid-column:1/3;grid-row:2}}
.uni{flex:1 1 300px;min-width:0;max-width:342px}
@media (max-width: 760px){.uni{max-width:none}}
'''


def ruler(top=56, text='', tag='h2', size=20):
    """A section heading with a quiet ruler beside it, instead of the posts' flowering vine."""
    ticks = ("|''''" * 60)
    return (f'<div style="display: flex; align-items: baseline; gap: 14px; margin: {top}px 0 14px;">'
            f'<{tag} style="margin: 0; font-family: {MONO}; font-size: {size}px; font-weight: 600; color: {CANOPY}; white-space: nowrap;">{text}</{tag}>'
            f'<div aria-hidden="true" style="flex: 1; min-width: 0; overflow: hidden; white-space: pre; font-family: {MONO}; font-size: 12px; color: #B9AD93; letter-spacing: -0.5px;">{ticks}</div></div>')


def course_row(c):
    name = (f'<a class="cn" href="#" style="font-size: 18px; line-height: 1.4;">{html.escape(c["name"])}</a>' if c['page']
            else f'<span class="cn" style="font-size: 18px; line-height: 1.4; color: {MUTED};">{html.escape(c["name"])}</span>')
    return (f'<li class="crow"><span class="cc" style="font-family: {MONO}; font-size: 13px; color: {MUTED};">{html.escape(c["code"])}</span>'
            f'{name}<span style="font-family: {MONO}; font-size: 12px;">{verdict(c)}</span>'
            f'<span class="cr" style="font-family: {MONO}; font-size: 12px; color: {MUTED};">{ratings(c)}</span></li>')


def course_list(uni):
    U = UNIS[uni]
    cs = sorted([c for c in COURSES if c['uni'] == uni] + U['extra'], key=lambda c: (c['year'], c['sem'], not c['page'], c['code']))
    out, years = [], {}
    for c in cs:
        years.setdefault(term(c)[0], []).append(c)
    for y, group in years.items():
        n = (group[0]['sem'] + 1) // 2
        out.append(f'<div style="display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; margin: 36px 0 4px;">'
                   f'<h3 style="margin: 0; font-family: {MONO}; font-size: 17px; font-weight: 600; color: {CANOPY};">{y}</h3>'
                   f'<span style="font-family: {MONO}; font-size: 12px; color: {MUTED};">year {n} of the {U["degree"]}</span></div>')
        sems = {}
        for c in group:
            sems.setdefault(c['sem'], []).append(c)
        for s, rows in sems.items():
            out.append(f'<div style="{LBL} margin: 14px 0 2px;">{term(rows[0])[1]} semester · semester {s}</div>'
                       f'<ul style="list-style: none; margin: 0; padding: 0; border-bottom: 1px solid #E2D9C4;">' + ''.join(course_row(c) for c in rows) + '</ul>')
    return '\n'.join(out)


def plate_figure(uni, cap_left):
    """The emblem at the top of a university page: wide on a desktop, the card-sized cut on a phone,
    so the pixels stay exactly 3 px everywhere."""
    k = UNIS[uni]['key']
    return f'''<figure style="margin: 18px 0 30px;">
<div style="display: flex; justify-content: space-between; gap: 12px; padding: 0 2px 8px; {LBL} font-size: 10px; letter-spacing: 0.18em;"><span>{cap_left}</span><span class="capr">{UNIS[uni]['place']}</span></div>
<div class="plw" style="position: relative; width: 711px; height: 300px; overflow: hidden;">
<img alt="" aria-hidden="true" src="{{{{plates.{k}Wide}}}}" style="position: absolute; left: 0; top: 0; width: 711px; height: 300px; image-rendering: pixelated;">
</div>
<div class="pln" style="width: 342px; max-width: 100%;"><img alt="" aria-hidden="true" src="{{{{plates.{k}}}}}" style="display: block; width: 342px; height: 288px; image-rendering: pixelated;"></div>
<figcaption style="padding: 8px 2px 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 16px; font-family: {SERIF}; font-style: italic; font-size: 14px; color: {MUTED};"><span>{UNIS[uni]['full']}</span><span style="font-family: {MONO}; font-style: normal; font-size: 11px;">{{{{cap.{k}}}}}</span></figcaption>
</figure>'''


# ---------------------------------------------------------------- the plates (board JS)

FONT5 = {
    'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#', 'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
    'F': '#####|#....|#....|####.|#....|#....|#....', 'I': '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', 'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..', 'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
}
FONT3 = {
    'A': '.#.|#.#|###|#.#|#.#', 'B': '##.|#.#|##.|#.#|##.', 'C': '.##|#..|#..|#..|.##', 'D': '##.|#.#|#.#|#.#|##.',
    'E': '###|#..|##.|#..|###', 'F': '###|#..|##.|#..|#..', 'G': '.##|#..|#.#|#.#|.##', 'H': '#.#|#.#|###|#.#|#.#',
    'I': '###|.#.|.#.|.#.|###', 'K': '#.#|#.#|##.|#.#|#.#', 'L': '#..|#..|#..|#..|###', 'M': '#.#|###|###|#.#|#.#',
    'N': '##.|#.#|#.#|#.#|#.#', 'O': '.#.|#.#|#.#|#.#|.#.', 'P': '##.|#.#|##.|#..|#..', 'R': '##.|#.#|##.|#.#|#.#',
    'S': '.##|#..|.#.|..#|##.', 'T': '###|.#.|.#.|.#.|.#.', 'U': '#.#|#.#|#.#|#.#|###', 'V': '#.#|#.#|#.#|#.#|.#.',
    'Y': '#.#|#.#|.#.|.#.|.#.', 'Z': '###|..#|.#.|#..|###', '0': '###|#.#|#.#|#.#|###', '1': '.#.|##.|.#.|.#.|###',
    '2': '##.|..#|.#.|#..|###', '3': '##.|..#|.#.|..#|##.', '4': '#.#|#.#|###|..#|..#', '7': '###|..#|.#.|.#.|.#.',
    '8': '###|#.#|###|#.#|###', '9': '###|#.#|###|..#|##.', '·': '...|...|.#.|...|...',
}

JS = r'''
  // ---- woodcut plates, cut at 3 px: a plate is drawn once into an offscreen canvas, one canvas
  // pixel per cell, and shown as a pixelated image.
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  pal() {
    if (this._pal) return this._pal;
    const h = { ink: '#1F2B23', rule: '#A99D84', shade: '#DDD3BD', dust: '#C9BDA3', paper: '#E6DECB', cream: '#F7F2E4',
      bark: '#5C4636', earth: '#7A5C42', moss: '#5E8E4A', fern: '#3F8A52', canopy: '#2B7349', sage: '#9DB38E',
      lagoon: '#2A7099', hib: '#C24E39', rose: '#B5476E', trace: '#7FA3BD', mango: '#A87400', ochre: '#E9D9AE', copper: '#7FA68A', copperDk: '#4E7F62' };
    this._pal = {};
    for (const k in h) this._pal[k] = this.rgb(h[k]);
    return this._pal;
  }

  mk(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const P = {
      w, h,
      bay: (x, y) => B[(((y | 0) % 4 + 4) % 4) * 4 + (((x | 0) % 4 + 4) % 4)],
      ox: 0, oy: 0, clip: null,
      set(x, y, c) {
        x = Math.round(x) + P.ox; y = Math.round(y) + P.oy;
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        if (P.clip && (x < P.clip[0] || y < P.clip[1] || x > P.clip[2] || y > P.clip[3])) return;
        const i = (y * w + x) * 4;
        if (!c) { d[i + 3] = 0; return; }
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      },
      rect(x, y, rw, rh, c) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) P.set(i, j, c); },
      // A Bayer tone: lv of 16 cells in each 4x4 block take the colour.
      tone(x, y, rw, rh, c, lv) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (P.bay(i, j) < lv) P.set(i, j, c); },
      hatch(x, y, rw, rh, c, k) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if ((i + j) % (k || 3) === 0) P.set(i, j, c); },
      hl(x0, x1, y, c, ev) { for (let x = x0; x <= x1; x++) if (!ev || x % ev === 0) P.set(x, y, c); },
      vl(x, y0, y1, c, ev) { for (let y = y0; y <= y1; y++) if (!ev || y % ev === 0) P.set(x, y, c); },
      fill(x0, y0, x1, y1, fn) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = fn(x, y); if (c) P.set(x, y, c); } },
      done() { ctx.putImageData(img, 0, 0); return cv.toDataURL(); }
    };
    return P;
  }

  font(f) { return f === 3 ? FONT3 : FONT5; }

  textW(s, f, k) { k = k || 1; return [...s].length * ((f === 3 ? 3 : 5) + 1) * k - k; }

  // Chunky pixel type; a caron is cut above Č.
  text(P, s, x, y, c, f, k) {
    k = k || 1;
    const G = this.font(f), gw = f === 3 ? 3 : 5;
    let cx = x;
    for (const ch0 of s) {
      const ch = ch0 === 'Č' ? 'C' : ch0, g = G[ch];
      if (g) {
        g.split('|').forEach((row, j) => { for (let i = 0; i < gw; i++) if (row[i] === '#') P.rect(cx + i * k, y + j * k, k, k, c); });
        if (ch0 === 'Č') { const m = Math.floor(gw / 2); P.rect(cx + (m - 1) * k, y - 3 * k, k, k, c); P.rect(cx + (m + 1) * k, y - 3 * k, k, k, c); P.rect(cx + m * k, y - 2 * k, k, k, c); }
      }
      cx += (gw + 1) * k;
    }
  }

  // Upright letters set round an arc, centred on angle a0 (radians), reading left to right. Each
  // letter steps on along the arc until it clears the last one, so the steep ends don't crowd.
  arcText(P, s, cx, cy, r, a0, dir, c) {
    const chars = [...s], n = chars.length, pt = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    let offs = [];
    for (let pass = 0, shift = 0; pass < 3; pass++) {
      offs = [0];
      for (let i = 1; i < n; i++) {
        let o = offs[i - 1];
        const [px, py] = pt(a0 + dir * (offs[i - 1] - shift));
        o += 3.6 / r;
        for (;;) { const [x, y] = pt(a0 + dir * (o - shift)), ax = Math.abs(Math.round(x) - Math.round(px)), ay = Math.abs(Math.round(y) - Math.round(py)); if (ax >= 4 || ay >= 6) break; o += 0.004; }
        offs.push(o);
      }
      shift = offs[n - 1] / 2;
      offs = offs.map((o) => o - shift);
      if (pass < 2) { const s0 = shift; offs = offs.map((o) => o + s0); shift = s0; }
    }
    chars.forEach((ch, i) => {
      const [x, y] = pt(a0 + dir * offs[i]);
      this.text(P, ch, Math.round(x - 1), Math.round(y - 2), c, 3, 1);
    });
  }

  // The plate mark of the graph view: paper grain, a double rule, a small cross in each corner.
  frame(P, seed, grain) {
    const c = this.pal(), w = P.w, h = P.h, g = this.rng('paper:' + seed);
    if (grain) for (let k = 0; k < w * h * 0.012; k++) P.set(7 + g() * (w - 14), 7 + g() * (h - 14), c.paper);
    const m1 = 4, m2 = 6;
    P.hl(m1, w - 1 - m1, m1, c.rule); P.hl(m1, w - 1 - m1, h - 1 - m1, c.rule);
    P.vl(m1, m1, h - 1 - m1, c.rule); P.vl(w - 1 - m1, m1, h - 1 - m1, c.rule);
    P.hl(m2, w - 1 - m2, m2, c.rule, 2); P.hl(m2, w - 1 - m2, h - 1 - m2, c.rule, 2);
    P.vl(m2, m2, h - 1 - m2, c.rule, 2); P.vl(w - 1 - m2, m2, h - 1 - m2, c.rule, 2);
    for (const [x, y] of [[m1, m1], [w - 1 - m1, m1], [m1, h - 1 - m1], [w - 1 - m1, h - 1 - m1]])
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(x + dx, y + dy, dx || dy ? c.hib : c.mango);
  }

  plate(uni, kind, W, H) {
    this._plates = this._plates || {};
    const key = [uni, kind, W, H].join(':');
    if (this._plates[key]) return this._plates[key];
    const P = this.mk(W, H);
    if (kind === 'mark') {
      this.frame(P, key, true);
      (uni === 'fit' ? this.sealFIT(P) : this.sealMFF(P));
    } else {
      // Scenes are cut inside the plate mark, then the mark is ruled over them. The wide plate fits
      // the whole site; the card is centred on the buildings, at the same scale.
      P.clip = [7, 7, W - 8, H - 8];
      this.isoPlate(P, uni);
      P.clip = null;
      this.frame(P, key, false);
    }
    return (this._plates[key] = P.done());
  }

  // ---- (i) the seals: the faculty's initials in pixel type, in a frame of my own ----

  // FIT: the initials on a chip, its pins running out as traces across the plate.
  sealFIT(P) {
    const c = this.pal(), W = P.w, H = P.h, cx = Math.floor(W / 2), cy = Math.floor(H / 2), S = 48, x0 = cx - S / 2, y0 = cy - S / 2;
    const r = this.rng('fit-traces'), pins = 7, gap = 6, p0 = Math.round((S - (pins - 1) * gap) / 2) - 1;
    // Traces first, so the chip sits on top of them.
    const via = (x, y) => { for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) P.set(x + dx, y + dy, c.lagoon); };
    for (let i = 0; i < pins; i++) {
      const py = y0 + p0 + i * gap + 1;
      for (const side of [-1, 1]) {
        if ((i + (side > 0 ? 1 : 0)) % 2 && i !== 3) continue;
        const start = side < 0 ? x0 - 5 : x0 + S + 4, end = side < 0 ? 12 + Math.floor(r() * 10) : W - 13 - Math.floor(r() * 10);
        const jog = Math.round(start + side * (4 + r() * Math.max(4, Math.abs(end - start) * 0.5)));
        const dy = i < pins / 2 ? -1 : 1, steps = i === 3 ? 0 : 2 + Math.floor(r() * 3);
        let x = start, y = py;
        while (side < 0 ? x > jog : x < jog) { P.set(x, y, c.trace); x += side; }
        for (let k = 0; k < steps; k++) { P.set(x, y, c.trace); x += side; y += dy; }
        while (side < 0 ? x > end : x < end) { P.set(x, y, c.trace); x += side; }
        if (Math.abs(end - start) > 8) via(x, y);
      }
      // Pins on top and bottom are short stubs with a pad.
      const px = x0 + p0 + i * gap + 1;
      for (const side of [-1, 1]) {
        const ys = side < 0 ? y0 - 5 : y0 + S + 4, len = 2 + (i % 2) * 2;
        for (let k = 0; k <= len; k++) P.set(px, ys + side * k, c.trace);
        if (i % 2) via(px, ys + side * (len + 2));
      }
    }
    // A woodcut shadow, hatched, to the lower right.
    P.fill(x0 + 3, y0 + 3, x0 + S + 2, y0 + S + 2, (x, y) => (x + y) % 3 === 0 ? c.dust : null);
    // Pins.
    for (let i = 0; i < pins; i++) {
      const o = p0 + i * gap;
      P.rect(x0 - 4, y0 + o, 4, 3, c.rule); P.rect(x0 + S, y0 + o, 4, 3, c.rule);
      P.rect(x0 + o, y0 - 4, 3, 4, c.rule); P.rect(x0 + o, y0 + S, 3, 4, c.rule);
      P.set(x0 - 4, y0 + o + 1, c.ink); P.set(x0 + S + 3, y0 + o + 1, c.ink); P.set(x0 + o + 1, y0 - 4, c.ink); P.set(x0 + o + 1, y0 + S + 3, c.ink);
    }
    // The body, cut in ink with its corners rounded; a cream rule inside; the pin-one dot.
    P.fill(x0, y0, x0 + S - 1, y0 + S - 1, (x, y) => {
      const ex = Math.min(x - x0, x0 + S - 1 - x), ey = Math.min(y - y0, y0 + S - 1 - y);
      return ex + ey < 2 ? null : c.ink;
    });
    for (let k = 4; k < S - 4; k++) { P.set(x0 + k, y0 + 3, c.cream); P.set(x0 + k, y0 + S - 4, c.cream); P.set(x0 + 3, y0 + k, c.cream); P.set(x0 + S - 4, y0 + k, c.cream); }
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) P.set(x0 + 7 + dx, y0 + 7 + dy, c.cream);
    // Letters knocked out of the block.
    const fw = this.textW('FIT', 5, 2);
    this.text(P, 'FIT', cx - Math.floor(fw / 2), cy - 6, c.cream, 5, 2);
    P.hl(cx - Math.floor(fw / 2), cx - Math.floor(fw / 2) + fw - 1, cy + 10, c.lagoon);
    const t1 = this.textW('ČVUT', 3, 1), t2 = this.textW('PRAHA', 3, 1);
    this.text(P, 'ČVUT', cx - Math.floor(t1 / 2), y0 + 11, c.cream, 3, 1);
    this.text(P, 'PRAHA', cx - Math.floor(t2 / 2), cy + 13, c.cream, 3, 1);
  }

  // MFF: a round seal, the university's Latin name round its rim, a wave on squared paper behind.
  sealMFF(P) {
    const c = this.pal(), W = P.w, H = P.h, cx = Math.floor(W / 2), cy = Math.floor(H / 2), R = 35, Ri = 19;
    // Squared paper and a slow wave across the plate, faint, behind the seal.
    for (let y = 12; y < H - 12; y += 6) for (let x = 12; x < W - 12; x += 6) P.set(x, y, c.dust);
    let ly = null;
    if (W > 150) for (let x = 10; x < W - 10; x++) {
      const y = Math.round(cy + 8 * Math.sin((x - cx) / 10 + 0.6));
      if (ly !== null) for (let k = Math.min(ly, y); k <= Math.max(ly, y); k++) if (x % 2 === 0 || k !== y) P.set(x, k, c.rose);
      ly = y;
    }
    P.hl(10, W - 11, cy, c.dust, 2);
    // Shadow, then the disc: a double rim, a band for the inscription, a beaded inner ring.
    P.fill(cx - R, cy - R, cx + R + 3, cy + R + 3, (x, y) => {
      const d = Math.hypot(x - cx - 2.5, y - cy - 2.5);
      return d <= R + 0.5 && Math.hypot(x - cx, y - cy) > R + 0.5 && (x + y) % 3 === 0 ? c.dust : null;
    });
    P.fill(cx - R - 1, cy - R - 1, cx + R + 1, cy + R + 1, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R + 0.5) return null;
      if (d > R - 1.5) return c.ink;
      if (d > R - 2.5) return c.cream;
      if (d > R - 3.5) return c.ink;
      if (d <= Ri + 0.5 && d > Ri - 0.5) return c.ink;
      if (d <= Ri + 2.3 && d > Ri + 1.3) return (Math.round(Math.atan2(y - cy, x - cx) * 28) % 2) ? c.rule : c.cream;
      return c.cream;
    });
    this.arcText(P, 'UNIVERSITAS', cx, cy, R - 8.5, -Math.PI / 2, 1, c.ink);
    this.arcText(P, 'CAROLINA', cx, cy, R - 8.5, Math.PI / 2, -1, c.ink);
    for (const sx of [-1, 1]) {
      const x = cx + sx * (R - 8), y = cy;
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(x + dx, y + dy, dx || dy ? c.hib : c.mango);
    }
    // The initials, a star above, and a small wave beneath.
    const fw = this.textW('MFF', 5, 2);
    this.text(P, 'MFF', cx - Math.floor(fw / 2), cy - 7, c.ink, 5, 2);
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(cx + dx, cy - 12 + dy, dx || dy ? c.hib : c.mango);
    for (let x = -8; x <= 8; x++) P.set(cx + x, cy + 11 + Math.round(1.3 * Math.sin(x / 1.5)), c.hib);
  }

  // ---- (ii) the buildings, in one isometric projection ----
  // World units are metres: x runs to the lower right, y to the lower left, z up. Both faculties are
  // cut in the same fixed 2:1 projection at the same scale, seen from their plaza corner, so the
  // front (+y), the right end (+x) and the roof show. Depth toward the viewer is x + y + z.
  isoS() { return 0.75; }

  isoMats() {
    if (this._isoM) return this._isoM;
    const h = (x) => this.rgb(x), m = (l, md, d, hatch, base, k) => ({ l: h(l), m: h(md), d: h(d), hatch: hatch || 0.8, base: base || 0, k: k === undefined ? 1 : k });
    this._isoM = {
      brick: m('#C8714F', '#A9502F', '#6E3424', 0.85, 0.08, 0.9),
      white: m('#F7F2E4', '#DDD3BD', '#A99D84', 0.8, 0.0, 0.8),
      roof: m('#EEE7D6', '#D3C9B1', '#A99D84', 0.9, 0.05, 0.8),
      plaza: m('#E9E2D0', '#CFC6B0', '#A99D84', 0.9, 0.12, 0.7),
      grass: m('#9DB38E', '#5E8E4A', '#3F8A52', 0.9, 0.35, 0.6),
      soil: m('#B59A7A', '#7A5C42', '#5C4636', 0.7, 0.2, 0.7),
      leaf: m('#9DB38E', '#3F8A52', '#2B7349', 0.95, 0.15, 0.85),
      bark: m('#7A5C42', '#5C4636', '#3E2F24', 0.95, 0.3, 0.6),
      render: m('#F6F3EC', '#E0DCD1', '#9C988C', 0.82, 0.0, 0.85),
      ochre: m('#F2E6C8', '#DCC79A', '#A08A5C', 0.82, 0.05, 0.9),
      slate: m('#7D8384', '#555B5E', '#33383A', 0.95, 0.35, 0.6),
      stone: m('#F7F2E4', '#E3D9BF', '#A99D84', 0.8, 0.02, 0.9),
      copper: m('#A6C4A8', '#7FA68A', '#4E7F62', 0.9, 0.15, 0.8),
      tile: m('#C9765A', '#9A4A34', '#6E3424', 0.9, 0.2, 0.75),
      cobble: m('#EEE5D6', '#D9C7B2', '#A99D84', 0.95, 0.12, 0.5),
      red: m('#D86A52', '#C24E39', '#8E3527', 0.95, 0.2, 0.7)
    };
    return this._isoM;
  }

  v3add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

  // A flat patch o + U·u + V·v; tex(tag, a, b, pt) may return null (a hole) or {c} / {mat} / {t}.
  quad(o, U, V, n, mat, tag, tex) {
    const A = Math.hypot(...U), B = Math.hypot(...V);
    return { A, B, mat, tag, tex, n, fn: (a, b) => [o[0] + U[0] * a / A + V[0] * b / B, o[1] + U[1] * a / A + V[1] * b / B, o[2] + U[2] * a / A + V[2] * b / B],
      corners: [o, this.v3add(o, U), this.v3add(o, V), this.v3add(this.v3add(o, U), V)] };
  }
  // A triangle (a, p, q), sampled as a collapsed patch.
  tri(a, p, q, n, mat, tag, tex) {
    const U = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], V = [q[0] - a[0], q[1] - a[1], q[2] - a[2]], A = Math.hypot(...U), B = Math.hypot(...V);
    return { A, B, mat, tag, tex, n, fn: (s, t) => { const u = s / A, v = t / B; return [a[0] + U[0] * u * (1 - v) + V[0] * v, a[1] + U[1] * u * (1 - v) + V[1] * v, a[2] + U[2] * u * (1 - v) + V[2] * v]; }, corners: [a, p, q] };
  }
  box(x, y, z, w, d, h, mat, tex, id) {
    const s = [this.quad([x, y, z + h], [w, 0, 0], [0, d, 0], [0, 0, 1], mat, 'top', tex),
      this.quad([x + w, y + d, z], [0, -d, 0], [0, 0, h], [1, 0, 0], mat, 'px', tex),
      this.quad([x, y + d, z], [w, 0, 0], [0, 0, h], [0, 1, 0], mat, 'py', tex)];
    if (id && id < 0) s.forEach((q) => (q.group = -id));
    return s;
  }
  // A surface of revolution about a vertical axis: radius r(h) for h in [0, 1] from z0 to z1.
  rev(cx, cy, z0, z1, r, mat, tex) {
    const H = z1 - z0, R = Math.max(...[0, 0.25, 0.5, 0.75, 1].map(r)), A = 2 * Math.PI * R;
    const at = (a, b) => { const th = a / R, hh = b / H, rr = r(hh); return [cx + rr * Math.cos(th), cy + rr * Math.sin(th), z0 + b]; };
    const s = { A, B: H, mat, tag: 'rev', tex, fn: at, corners: [[cx - R, cy - R, z0], [cx + R, cy + R, z0], [cx - R, cy - R, z1], [cx + R, cy + R, z1], [cx + R, cy - R, z1], [cx - R, cy + R, z0]] };
    s.nfn = (a, b) => { const th = a / R, hh = b / H, e = 0.02, dr = (r(Math.min(1, hh + e)) - r(Math.max(0, hh - e))) / (2 * e * H); return [Math.cos(th), Math.sin(th), -dr]; };
    return s;
  }

  // The cutter: z-buffered samples, one per cell, then ink. Outlines where a surface meets nothing
  // or another group; Bayer tone from the light; hatching on the shaded faces.
  isoRender(P, surfs, OX, OY) {
    const S = this.isoS(), W = P.w, H = P.h, N = W * H, dep = new Float32Array(N).fill(-1e9), gid = new Int32Array(N).fill(-1), col = new Array(N), soft = new Uint8Array(N);
    const L = [-0.25, 0.75, 0.6], LN = Math.hypot(...L);
    surfs.forEach((s, si) => {
      const g = s.group !== undefined ? s.group : si + 1;
      const na = Math.max(1, Math.ceil(s.A * S * 2.4)), nb = Math.max(1, Math.ceil(s.B * S * 2.4));
      for (let i = 0; i <= na; i++) for (let j = 0; j <= nb; j++) {
        const a = s.A * i / na, b = s.B * j / nb, p = s.fn(a, b), n = s.nfn ? s.nfn(a, b) : s.n;
        if (n[0] + n[1] + n[2] <= 1e-6) continue;
        const cx = Math.floor(OX + (p[0] - p[1]) * S), cy = Math.floor(OY + ((p[0] + p[1]) / 2 - p[2]) * S);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        const k = cy * W + cx, dd = p[0] + p[1] + p[2];
        if (dd < dep[k]) continue;
        let r = s.tex ? s.tex(s.tag, a, b, p, cx, cy) : undefined;
        if (r === null) continue;
        r = r || {};
        const mat = r.mat || s.mat, lam = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (Math.hypot(...n) * LN));
        let c = r.c;
        if (!c) {
          const t = Math.max(0, Math.min(1, r.t !== undefined ? r.t : mat.base + mat.k * (1 - lam))), bb = P.bay(cx, cy);
          if (t > mat.hatch - 0.1 && Math.floor(a * S + 0.5) % 3 === 0 && s.tag !== 'top' && !r.noHatch) c = mat.d;
          else c = t < 0.5 ? (t * 32 > bb + 0.5 ? mat.m : mat.l) : ((t - 0.5) * 32 > bb + 0.5 ? mat.d : mat.m);
        }
        dep[k] = dd; gid[k] = g; col[k] = c; soft[k] = s.soft ? 1 : 0;
      }
    });
    const INK = this.rgb('#1F2B23');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x;
      if (gid[k] < 0) continue;
      const other = (X, Y) => X < 0 || Y < 0 || X >= W || Y >= H || gid[Y * W + X] < 0 || (gid[Y * W + X] !== gid[k] && dep[Y * W + X] < dep[k]);
      P.set(x, y, !soft[k] && (other(x - 1, y) || other(x + 1, y) || other(x, y - 1) || other(x, y + 1)) ? INK : col[k]);
    }
  }

  // Centre a set of surfaces' projected bounds in the plate.
  isoFit(surfs, W, H, dy) {
    const S = this.isoS();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const s of surfs) for (const p of s.corners) { const X = (p[0] - p[1]) * S, Y = ((p[0] + p[1]) / 2 - p[2]) * S; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
    return [Math.round(W / 2 - (x0 + x1) / 2), Math.round(H / 2 - (y0 + y1) / 2 + (dy || 0))];
  }

  // A hipped roof over the box x0..x1, y0..y1 from the eaves at z0 to a ridge at z1 along x.
  hip(x0, y0, x1, y1, z0, z1, mat, tex, id) {
    const ym = (y0 + y1) / 2, r = (y1 - y0) / 2, a = [x0 + r, ym, z1], b = [x1 - r, ym, z1];
    const front = this.quad([x0, y1, z0], [x1 - x0, 0, 0], [r, -r, z1 - z0], [0, 1, 1 / ((z1 - z0) / r)], mat, 'roof', (tag, s, t, p) => {
      const u = s / (x1 - x0), v = t / Math.hypot(r, r, z1 - z0);
      const lim = (r * v) / (x1 - x0);
      if (u < lim || u > 1 - lim) return null;
      return tex ? tex('roof', s, t, p) : undefined;
    });
    front.fn = (s, t) => { const v = t / front.B; return [x0 + r * v + s * (1 - 2 * r * v / (x1 - x0)), y1 - r * v, z0 + (z1 - z0) * v]; };
    const end = this.tri([x1, y1, z0], [x1, y0, z0], b, [(z1 - z0) / r, 0, 1], mat, 'hipEnd', tex);
    const out = [front, end];
    if (id) out.forEach((q) => (q.group = id));
    return out;
  }

  // A crown of leaves on a trunk.
  isoTree(x, y, r, h, seed) {
    const M = this.isoMats(), g = this.rng('itree:' + seed), lob = [0.92 + g() * 0.1, 0.8 + g() * 0.25, 0.95, 0.85 + g() * 0.2];
    return [...this.box(x - 0.3, y - 0.3, 0, 0.6, 0.6, h - r * 0.6, M.bark),
      this.rev(x, y, h - r * 0.9, h + r * 0.9, (t) => r * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * lob[Math.min(3, Math.floor(t * 4))], M.leaf)];
  }

  // FIT: the new ČVUT building, Thákurova 9. Terracotta end wings with punched windows; between them
  // the white centre in a shallow chevron with ribbon windows; the white pylon free on the plaza;
  // the brick stepped plinth; the plaza and a lawn corner.
  fitScene() {
    const M = this.isoMats(), c = this.pal(), glass = this.rgb('#2E3B40'), warm = this.rgb('#E4B455'), s = [];
    const H = 34, storey = H / 9;
    const hash = (i, j, k) => { let v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
    const brickTex = (seed) => (tag, a, b) => {
      if (tag === 'top') return { mat: M.roof, t: 0.15 };
      const st = Math.floor(b / storey), fr = b / storey - st, col = Math.floor(a / 3.4), fc = a / 3.4 - col;
      if (b > H - 0.6) return { t: 0.75 };
      if (st >= 1 && fr > 0.35 && fr < 0.8 && fc > 0.3 && fc < 0.8 && hash(st, col, seed) > 0.25) return { c: hash(col, st, seed + 9) > 0.9 ? warm : glass, g: 1 };
      if (st === 0 && fc > 0.2 && fc < 0.9 && fr > 0.1) return { c: glass, g: 1 };
      return undefined;
    };
    const ribbon = (tag, a, b) => {
      if (tag === 'top') return { mat: M.roof };
      const st = Math.floor(b / storey), fr = b / storey - st;
      if (b > H - 0.9) return { t: 0.1 };
      if (st === 0) return { c: (a % 3) < 0.5 ? c.cream : glass, g: 2 };
      if (fr > 0.5 && fr < 0.88) return { c: glass };
      return undefined;
    };
    // The ground: one slab of plaza, a lawn in its near corner.
    const tile = this.box(-26, -14, -2, 146, 70, 2, M.plaza, (tag, a, b, p) => {
      if (tag !== 'top') return { mat: M.soil };
      const lawn = p[1] > 44 - (p[0] - 60) * 0.3 && p[0] > 60;
      if (lawn) return { mat: M.grass, g: 3 };
      return (p[0] % 6) < 0.35 || (p[1] % 6) < 0.35 ? { t: 0.45 } : { t: 0.1 };
    });
    tile.forEach((q) => (q.ground = true));
    s.push(...tile);
    // The stepped brick plinth.
    for (let k = 0; k < 3; k++) s.push(...this.box(8 + k * 2, 14, k * 0.7, 66 - k * 4, 11 - k * 2, 0.7, M.brick, (tag, a) => (tag === 'top' ? { t: 0.3 } : { t: 0.75 }), -5));
    // Left wing, right wing.
    s.push(...this.box(0, 0, 0, 14, 20, H, M.brick, brickTex(1), 10));
    s.push(...this.box(66, 0, 0, 24, 22, H + 1, M.brick, brickTex(2), 11));
    // The centre: two faces in a shallow chevron, and its roof.
    const A = [14, 17], V = [38, 9], B = [66, 17];
    s.push(this.quad([A[0], A[1], 0], [V[0] - A[0], V[1] - A[1], 0], [0, 0, H], [8, 24, 0], M.white, 'f1', ribbon));
    s.push(this.quad([V[0], V[1], 0], [B[0] - V[0], B[1] - V[1], 0], [0, 0, H], [-8, 28, 0], M.white, 'f2', ribbon));
    const roof = this.quad([14, 0, H], [52, 0, 0], [0, 17, 0], [0, 0, 1], M.roof, 'top', (tag, a, b, p) => {
      const front = p[0] < 38 ? 17 - (p[0] - 14) * 8 / 24 : 9 + (p[0] - 38) * 8 / 28;
      return p[1] > front ? null : undefined;
    });
    s.push(roof);
    s.push(...this.box(30, 3, H, 10, 6, 2.5, M.roof, null, 20), ...this.box(74, 4, H + 1, 8, 8, 2, M.roof, null, 21));
    // The pylon: a slender white slab standing free on the plinth, taller than the block.
    s.push(...this.box(29, 21, 0, 5, 3, 66, M.white, (tag, a, b) => (tag !== 'top' && b % 9 < 0.3 ? { t: 0.6 } : undefined), 30));
    // A lamp post and trees.
    s.push(...this.box(48, 30, 0, 0.4, 0.4, 9, M.bark, null));
    [[-14, 10, 6, 13, 'a'], [-18, 28, 5, 11, 'b'], [-6, 34, 4.5, 10, 'c'], [100, 6, 5, 12, 'd'], [104, 22, 4.5, 10, 'e']].forEach(([x, y, r, h, k]) => s.push(...this.isoTree(x, y, r, h, k)));
    return { surfs: s, focus: s.filter((q) => !q.ground) };
  }

  // MFF: Malostranské náměstí 25 at dusk. The thirteen-bay grey-white palace under a dark hipped roof
  // with chimneys on the ridge, lit windows and a stone portal; St Nicholas behind it on the left,
  // its belfry and green dome; arcaded houses; the cobbled square, its curving rails and a tram.
  mffScene() {
    const M = this.isoMats(), c = this.pal(), glass = this.rgb('#2B3336'), warm = this.rgb('#E4B455'), s = [];
    const hash = (i, j, k) => { let v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
    // Rails: two tracks along the houses, curving out across the square toward the viewer.
    if (!this._rails) {
      const pts = [];
      for (const off of [0, 1.5, 4.5, 6]) {
        for (let x = -50; x <= -14; x += 0.2) pts.push([x, 15 + off]);
        const R = 26 - off;
        for (let a = -Math.PI / 2; a <= 0; a += 0.004) pts.push([-14 + R * Math.cos(a), 41 + R * Math.sin(a)]);
      }
      const grid = new Set();
      for (const [x, y] of pts) grid.add(Math.round(x * 1.5) + ',' + Math.round(y * 1.5));
      this._rails = grid;
    }
    const rails = this._rails;
    s.push(...this.box(-52, -38, -2, 128, 82, 2, M.cobble, (tag, a, b, p) => {
      if (tag !== 'top') return { mat: M.soil };
      if (rails.has(Math.round(p[0] * 1.5) + ',' + Math.round(p[1] * 1.5))) return { c: c.bark };
      return (hash(Math.floor(p[0] * 0.9), Math.floor(p[1] * 0.9), 3) > 0.9) ? { t: 0.55 } : { t: 0.08 };
    }).map((q) => Object.assign(q, { ground: true })));
    // The palace: 60 m, thirteen bays, five rows of windows.
    const PX = 60, PY = 14, PH = 20, bay = PX / 13, rows = [[1.2, 2.4], [5.6, 2.2], [9.4, 2.2], [13.2, 2.2], [16.8, 1.6]];
    const palaceTex = (tag, a, b) => {
      if (tag === 'top') return null;
      if (b > PH - 0.7) return { t: 0.8 };
      if (Math.abs(b - 4.6) < 0.25) return { t: 0.6 };
      const span = tag === 'py' ? PX : PY, nb = tag === 'py' ? 13 : 3, bw = span / nb, i = Math.floor(a / bw), fc = a / bw - i;
      if (tag === 'py' && i === 1 && b < 5) {
        if (fc > 0.12 && fc < 0.88 && b < 4.6) return fc > 0.25 && fc < 0.75 && b < 3.9 ? { c: glass, g: 41 } : { mat: M.stone, t: 0.15, g: 41 };
        return undefined;
      }
      for (const [z0, hh] of rows) if (b > z0 && b < z0 + hh && fc > 0.36 && fc < 0.68) {
        const on = tag === 'py' && z0 > 3 && hash(i, z0, 7) > 0.66;
        return { c: on ? warm : glass, g: 40 };
      }
      return undefined;
    };
    s.push(...this.box(0, 0, 0, PX, PY, PH, M.render, palaceTex, 40));
    s.push(...this.hip(0, 0, PX, PY, PH, PH + 7, M.slate, (tag, a, b) => (Math.floor(b * 0.6 * 2) % 3 === 0 ? { t: 0.85 } : undefined), 42));
    for (let i = 0; i < 10; i++) { const ch = this.box(9 + i * 4.7, 6, PH + 5.5, 1.6, 2, 3.4 + (i % 3) * 0.6, M.render, (tag) => (tag === 'top' ? { c: c.ink } : tag === 'px' ? { t: 0.8 } : { t: 0.05 })); ch.forEach((q) => (q.soft = true)); s.push(...ch); }
    // Arcaded houses in front of the church, facing the square.
    const houseTex = (seed) => (tag, a, b) => {
      if (tag === 'top') return null;
      const i = Math.floor(a / 3.6), fc = a / 3.6 - i;
      if (b < 4) { const u = (fc - 0.5) * 3.6; return Math.hypot(u, Math.max(0, b - 2.2)) < 1.4 && b < 3.6 ? { c: hash(i, seed, 1) > 0.4 ? warm : glass, g: 60 + seed } : undefined; }
      const st = Math.floor((b - 4) / 3.4), fr = (b - 4) / 3.4 - st;
      if (b < 15 && fc > 0.35 && fc < 0.65 && fr > 0.3 && fr < 0.8) return { c: hash(i, st, seed) > 0.8 ? warm : glass, g: 60 + seed };
      return undefined;
    };
    s.push(...this.box(-48, -2, 0, 22, 12, 16, M.ochre, houseTex(1), 61), ...this.hip(-48, -2, -26, 10, 16, 21, M.slate, null, 62));
    s.push(...this.box(-26, 0, 0, 22, 10, 15, M.render, houseTex(2), 63), ...this.hip(-26, 0, -4, 10, 15, 19, M.slate, null, 64));
    // St Nicholas: the church body, its red roof, the drum and dome, and the belfry by the square.
    s.push(...this.box(-34, -28, 0, 22, 18, 15, M.stone, (tag) => (tag === 'top' ? null : undefined)));
    s.push(this.quad([-34, -10, 15], [22, 0, 0], [0, -9, 5], [0, 9, 9], M.tile, 'roof'));
    s.push(this.tri([-12, -10, 15], [-12, -28, 15], [-12, -19, 20], [1, 0, 0], M.tile, 'gable'));
    const dx = -22, dy = -19;
    s.push(this.rev(dx, dy, 20, 33, () => 7.5, M.stone, (tag, a, b) => {
      const k = (a / (2 * Math.PI * 7.5)) * 16, f = k - Math.floor(k);
      if (b < 1 || b > 12) return { t: 0.6 };
      if (f < 0.12) return { t: 0.55 };
      return f > 0.4 && f < 0.7 && b > 3 && b < 9.5 ? { c: glass, g: 71 } : undefined;
    }));
    s.push(this.rev(dx, dy, 33, 43, (t) => 8.2 * Math.sqrt(Math.max(0, 1 - t * t)), M.copper, (tag, a) => ((a / (2 * Math.PI * 8.2)) * 16 % 1 < 0.14 ? { t: 0.9 } : undefined)));
    s.push(this.rev(dx, dy, 43, 49.5, () => 1.8, M.stone, (tag, a, b) => (b > 1 && b < 3.6 && (a * 2) % 2 < 0.8 ? { c: glass } : undefined)));
    s.push(this.rev(dx, dy, 49.5, 52, (t) => 2.2 * (1 - t) + 0.3, M.copper));
    s.push(...this.box(dx - 0.2, dy - 0.2, 52, 0.4, 0.4, 3, M.slate, null, 72));
    const tx = -36, ty = -6;
    s.push(...this.box(tx, ty, 0, 7, 7, 36, M.stone, (tag, a, b) => {
      if (tag === 'top') return null;
      if (Math.abs(b - 22) < 0.4 || b > 35.4) return { t: 0.7 };
      const fc = a / 7;
      return fc > 0.36 && fc < 0.62 && ((b > 23 && b < 30) || (b > 10 && b < 16)) ? { c: glass, g: 73 } : undefined;
    }, 73));
    s.push(...this.box(tx + 0.8, ty + 0.8, 36, 5.4, 5.4, 7, M.stone, (tag, a, b) => {
      if (tag === 'top') return null;
      const u = a - 2.7, v = b - 3.6;
      if (tag === 'py' && Math.hypot(u, v) < 1.9) return Math.hypot(u, v) > 1.2 ? { c: c.ink, g: 74 } : { c: c.mango, g: 74 };
      return b > 6.4 ? { t: 0.7 } : undefined;
    }, 74));
    s.push(this.rev(tx + 3.5, ty + 3.5, 43, 53, (t) => [3.2, 3.5, 2.8, 1.8, 2.2, 2.0, 1.2, 0.8, 0.5, 0.4][Math.min(9, Math.floor(t * 10))], M.copper));
    s.push(...this.box(tx + 3.3, ty + 3.3, 53, 0.4, 0.4, 3.5, M.slate, null));
    // The tram, at the stop in front of the arcades.
    s.push(...this.box(-44, 15.2, 0.3, 15, 2.6, 3.4, M.red, (tag, a, b) => {
      if (tag === 'top') return { mat: M.slate };
      if (b > 1.3 && b < 1.6) return { c: c.cream, g: 80 };
      if (b > 1.6 && b < 2.7) return (tag === 'py' ? (a % 2.5) < 0.4 : a < 0.4) ? { c: c.cream, g: 80 } : { c: tag === 'py' ? warm : glass, g: 80 };
      if (b > 2.7) return { c: c.cream, g: 80 };
      return undefined;
    }, 80));
    s.push(...this.box(-38, 16, 3.7, 3, 0.6, 1.2, M.slate, null));
    s.slice(-6).forEach((q) => (q.tram = true));
    return { surfs: s, focus: s.filter((q) => !q.ground && !q.tram) };
  }

  isoPlate(P, uni) {
    const W = P.w, H = P.h, wide = W > 150, c = this.pal();
    // A wash of sky behind: day over Dejvice, dusk over Malá Strana.
    for (let y = 7; y < H - 7; y++) {
      const t = (y - 7) / (H * 0.7), lv = Math.round((uni === 'fit' ? 3 : 5) * Math.pow(Math.max(0, 1 - t), 1.4)), lv2 = uni === 'fit' ? 0 : Math.round(2 * Math.pow(Math.max(0, 1 - t * 1.6), 2));
      for (let x = 0; x < W; x++) { const b = P.bay(x, y); if (b < lv2) P.set(x, y, this.rgb('#24406B')); else if (b < lv) P.set(x, y, c.lagoon); }
    }
    const sc = uni === 'fit' ? this.fitScene() : this.mffScene();
    const [OX, OY] = this.isoFit(sc.focus, W, H, wide ? 4 : 3);
    this.isoRender(P, sc.surfs, OX, OY);
  }

  emblem() {

 return this.props.emblem === 'building' ? 'building' : 'mark'; }

  plates() {
    const k = this.emblem();
    return { fit: this.plate('fit', k, 114, 96), mff: this.plate('mff', k, 114, 96), fitWide: this.plate('fit', k, 237, 100), mffWide: this.plate('mff', k, 237, 100) };
  }

  cap() {
    return this.emblem() === 'mark'
      ? { fit: 'a pixel seal set from its initials, not the official logo', mff: 'a pixel seal set from its initials, not the official logo' }
      : { fit: 'the new ČVUT building, Thákurova 9, Dejvice', mff: 'Malostranské náměstí 25, beside St Nicholas' };
  }
'''

JS = JS.replace('FONT3', json.dumps(FONT3, ensure_ascii=False)).replace('FONT5', json.dumps(FONT5))

PROPS_OLD = '{"motion":{"editor":"boolean","default":true,"section":"Flora"}'
PROPS_NEW = '{"emblem":{"editor":"enum","default":"mark","options":["mark","building"],"section":"Emblem"},"motion":{"editor":"boolean","default":true,"section":"Emblem"}'


def write(name, title, body, vals, height):
    comp = component(JS, vals)
    out = page(title, body, comp, height, CSS).replace(PROPS_OLD, PROPS_NEW)
    open(OUT + name + '.dc.html', 'w', encoding='utf-8').write(out)
    # The canvas shows the building treatment as its own board.
    b = out.replace('"emblem":{"editor":"enum","default":"mark"', '"emblem":{"editor":"enum","default":"building"')
    open(OUT + name + 'Building.dc.html', 'w', encoding='utf-8').write(b)
    print('wrote', name, '+ Building', len(out))


# ---------------------------------------------------------------- 1. the courses front page


def uni_card(uni):
    U = UNIS[uni]
    n = len([c for c in COURSES if c['uni'] == uni])
    span = U['meta'].split(' · ', 1)
    return f'''<div class="uni">
<a href="#" aria-label="{U['title']}" style="display: block; width: 342px; max-width: 100%; height: 288px; overflow: hidden;"><img alt="" aria-hidden="true" src="{{{{plates.{U['key']}}}}}" style="display: block; width: 342px; height: 288px; image-rendering: pixelated;"></a>
<div style="padding: 14px 2px 0;">
<a href="#" style="font-family: {MONO}; font-size: 22px; font-weight: 600; text-decoration: none;">{U['title']} <span aria-hidden="true">→</span></a>
<div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin: 4px 0 6px;">{U['degree']} · {U['years']} · {n} {'course' if n == 1 else 'courses'}</div>
<div style="font-size: 15px; line-height: 1.5; color: {MUTED}; font-style: italic;">{U['full']}</div>
</div></div>'''


def index_rows():
    out = []
    for c in sorted(COURSES, key=lambda c: (c['year'], c['sem'], c['code'])):
        y, s = term(c)
        out.append(f'<li class="irow"><span style="font-family: {MONO}; font-size: 13px; color: {MUTED};">{c["code"]}</span>'
                   f'<a class="cn" href="#" style="font-size: 16px; line-height: 1.4;">{html.escape(c["name"])}</a>'
                   f'<span style="font-family: {MONO}; font-size: 12px; color: {MUTED}; white-space: nowrap;">{c["uni"]} · {y} {s}</span></li>')
    return ''.join(out)


home = f'''{nav('courses')}
<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">
<h1 style="margin: 0 0 22px; font-family: {MONO}; font-size: 36px; line-height: 1.2; font-weight: 600; color: {INK};">Courses</h1>
{FRONT_HTML}
<div style="display: flex; flex-wrap: wrap; gap: 36px 28px; margin: 44px 0 0;">
{uni_card('FIT')}
{uni_card('MFF')}
</div>
{ruler(72, 'All courses')}
<div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin: -4px 0 8px;">every course with a page · oldest first</div>
<ul style="list-style: none; margin: 0; padding: 0;">{index_rows()}</ul>
</main>
{FOOTER}'''

VALS = "    return { plates: this.plates(), cap: this.cap(), roots: this.roots() };"
write('CoursesHome', 'Courses', home, VALS, 1500)


# ---------------------------------------------------------------- 2–3. the university pages


def uni_page(uni, name, plate_no, height):
    U = UNIS[uni]
    body = f'''{nav('courses')}
<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">
<div style="font-family: {MONO}; font-size: 13px; color: {MUTED};"><a href="#" style="color: {MUTED};">courses</a> / {U['degree']}</div>
{plate_figure(uni, plate_no)}
<h1 style="margin: 0 0 8px; font-family: {MONO}; font-size: 36px; line-height: 1.2; font-weight: 600; color: {INK};">{U['title']}</h1>
<div style="font-family: {MONO}; font-size: 13px; color: {MUTED}; margin-bottom: 30px;">{' · '.join(f'<span style="white-space: nowrap;">{x}</span>' for x in U['meta'].split(' · '))}</div>
{U['html']}
{ruler(56, 'Courses')}
<div style="font-family: {MONO}; font-size: 12px; color: {MUTED}; margin: -4px 0 0;">by semester, from each course's page · scores out of 5</div>
{course_list(uni)}
</main>
{FOOTER}'''
    write(name, U['title'], body, VALS, height)


uni_page('FIT', 'UniFIT', 'Pl. I · FIT ČVUT', 1460)
uni_page('MFF', 'UniMFF', 'Pl. II · MFF UK', 1800)

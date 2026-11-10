"""The projects section: the projects list, a neutral project page (rentczecher) and one devlog.
Reads the vault (read only) and writes ProjectsIndex, ProjectPage and DevlogEntry."""
import glob
import html
import json
import math
import os
import re

exec(open('gen_garden2.py', encoding='utf-8').read())

VAULT_PROJECTS = '/home/schrodlm/dev/second-brain/publish/projects'
VAULT_LOGS = '/home/schrodlm/dev/second-brain/logs'
PAPER, RULE, TINT = '#F7F2E4', '#D8CFBA', '#E3E8D6'
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


# ---------------------------------------------------------------- reading the vault

def front(src):
    """Split a file into its frontmatter (a flat dict, lists allowed) and its body."""
    m = re.match(r'---\n(.*?)\n---\n?(.*)', src, re.S)
    meta, key = {}, None
    for line in m.group(1).split('\n'):
        if re.match(r'\s+- ', line) and key:
            if not isinstance(meta[key], list):
                meta[key] = []
            meta[key].append(line.strip()[2:].strip())
        elif ':' in line:
            key, _, v = line.partition(':')
            key = key.strip()
            meta[key] = v.strip()
    return meta, m.group(2)


def load_projects():
    out = []
    for f in sorted(glob.glob(VAULT_PROJECTS + '/*.md')):
        meta, body = front(open(f, encoding='utf-8').read())
        meta['body'] = body
        meta['logs'] = load_logs(meta.get('github', ''))
        out.append(meta)
    return out


def load_logs(repo):
    logs = []
    for f in glob.glob(f'{VAULT_LOGS}/{repo}/*.md') if repo else []:
        meta, body = front(open(f, encoding='utf-8').read())
        name = os.path.basename(f)[:-3]
        meta['title'] = re.sub(r'^\d{4}-\d{2}-\d{2}\s+', '', name)
        meta['file'] = name
        meta['session'] = int(meta['session'])
        pr = meta.get('pr') or []
        meta['pr'] = pr if isinstance(pr, list) else [pr]
        meta['sections'] = sections(body)
        s = meta['sections'].get('Summary', '').strip()
        first = re.match(r'(.+?[.!?])(\s|$)', s, re.S)
        meta['first'] = first.group(1) if first else s
        logs.append(meta)
    return sorted(logs, key=lambda l: l['session'])


def sections(body):
    """A devlog body as {heading: text}, plus the References line under '__refs'."""
    out, cur = {}, None
    for line in body.split('\n'):
        h = re.match(r'## (.+)', line)
        if h:
            cur = h.group(1).strip(); out[cur] = ''
        elif line.startswith('**References:**'):
            out['__refs'] = line[len('**References:**'):].strip()
        elif cur and line.strip() != '---':
            out[cur] += line + '\n'
    return out


# ---------------------------------------------------------------- markdown, just enough of it

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', lambda m: f'<code style="font-family: {MONO}; font-size: 0.86em; background: {TINT}; padding: 1px 5px; border-radius: 3px;">{m.group(1)}</code>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\w*])\*([^*]+?)\*(?![\w*])', r'<em>\1</em>', t)
    t = re.sub(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', lambda m: f'<a href="#">{m.group(2) or m.group(1)}</a>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    return t


def md_list(items, marker=None, gap=8):
    """A list whose markers are mono glyphs in a fixed column, so the item text lines up."""
    if marker is None:
        lis = ''.join(f'<li>{inline(i)}</li>' for i in items)
        return f'<ul style="margin: 0 0 18px; padding-left: 22px; display: flex; flex-direction: column; gap: {gap}px;">{lis}</ul>'
    rows = ''.join(
        f'<li style="display: flex; gap: 12px;"><span aria-hidden="true" style="flex: 0 0 auto; width: 28px; font-family: {MONO}; font-size: 14px; color: {CANOPY}; white-space: pre; padding-top: 2px;">{marker}</span><span style="flex: 1; min-width: 0;">{inline(i)}</span></li>'
        for i in items)
    return f'<ul style="list-style: none; margin: 0 0 18px; padding: 0; display: flex; flex-direction: column; gap: {gap}px;">{rows}</ul>'


def blocks(text):
    """Paragraphs and lists of a markdown fragment, as ('p', text) and ('ul', [items])."""
    out = []
    for chunk in re.split(r'\n\s*\n', text.strip()):
        lines = [l for l in chunk.split('\n') if l.strip()]
        if not lines:
            continue
        if all(re.match(r'\s*- ', l) for l in lines):
            out.append(('ul', [re.sub(r'^\s*- ', '', l).strip() for l in lines]))
        else:
            out.append(('p', ' '.join(l.strip() for l in lines)))
    return out


# ---------------------------------------------------------------- the plate slot: woodcut pixel plates

# The woodcut toolkit (palette, 3 px canvas, Bayer tones, pixel type, the double-ruled plate frame) is a
# snapshot of gen_unis.py's JS, kept in gen_projects_wood.js, so the plates cut the same way as the
# university buildings.
WOOD_JS = open('gen_projects_wood.js', encoding='utf-8').read().split('\n', 1)[1]

PLATE_JS = r'''
  // ---- project plates: placeholders, each holding its slot until I cut the project's own ----

  sprite(P, rows, x, y, map) {
    const c = this.pal();
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (map[r[i]]) P.set(x + i, y + j, c[map[r[i]]]); });
  }

  projPlate(kind, W, H, lit) {
    this._pp = this._pp || {};
    const key = [kind, W, H, lit].join(':');
    if (this._pp[key]) return this._pp[key];
    const P = this.mk(W, H);
    this.frame(P, kind + W, true);
    if (kind === 'rentczecher') this.dusk(P, lit);
    else if (kind === 'goob') this.render3d(P);
    else if (kind === 'ascii') this.asciiArt(P);
    else this.rotorPlate(P, lit * Math.PI / 48);
    return (this._pp[key] = P.done());
  }

  // rentczecher: a row of Prague tenement houses at dusk. One by one, a window lights up as a
  // listing is found, the newest with a pin above it; the watchdog sits on the pavement.
  dusk(P, lit) {
    const c = this.pal(), W = P.w, H = P.h, wide = W > 150, small = H <= 64, G = H - Math.round(H * 0.2), fh = small ? 7 : 8;
    // The sky: a dusk wash, cool above and warm toward the roofs, with a moon.
    P.fill(7, 7, W - 8, G - 1, (x, y) => {
      const t = (y - 7) / (G - 8);
      if (P.bay(x, y) < Math.max(0, 5 - t * 9)) return c.trace;
      if (P.bay(x + 2, y + 1) < Math.max(0, (t - 0.45) * 13)) return c.ochre;
      return null;
    });
    const mx = wide ? 20 : 13, my = wide ? 19 : 14, mr = wide ? 5 : 4;
    P.fill(mx - mr, my - mr, mx + mr, my + mr, (x, y) => {
      const d = Math.hypot(x - mx, y - my), d2 = Math.hypot(x - mx - 2.5, y - my + 1.5);
      if (d > mr + 0.3 || d2 < mr - 0.6) return null;
      return d > mr - 0.8 ? c.mango : c.cream;
    });
    const g = this.rng('stars' + W);
    for (let k = 0; k < (wide ? 9 : 5); k++) P.set(10 + g() * (W - 20), 9 + g() * (H * 0.18), c.cream);
    this.birds(P, wide ? [[44, 14], [50, 11]] : [[30, 11]]);
    // The houses, side by side: each its own height, wash, roof and rhythm of windows.
    const r = this.rng('houses' + W), wins = [];
    const washes = [[c.cream, c.ochre], [c.ochre, c.cream], [c.cream, c.shade], [c.ochre, c.dust], [c.cream, c.sage]];
    let x = wide ? 38 : 26;
    const xEnd = W - (wide ? 18 : 9);
    let n = 0;
    while (x < xEnd - 14) {
      const hw = Math.min(xEnd - x, (wide ? 24 : 21) + Math.floor(r() * 9)), bays = Math.max(2, Math.floor((hw - 4) / 6));
      const maxF = Math.floor((G - 30) / fh), floors = Math.min(maxF, (small ? 2 : 3) + Math.floor(r() * 2)), gf = 9;
      const top = G - gf - floors * fh - 3, wash = washes[(n + Math.floor(r() * 2)) % washes.length], x1 = x + hw - 1;
      // Facade with a two-tone wash, outlined, a cornice of two rules.
      P.fill(x, top, x1, G - 1, (xx, yy) => (P.bay(xx, yy) < 4 ? wash[1] : wash[0]));
      P.vl(x, top, G - 1, c.ink); P.vl(x1, top, G - 1, c.ink);
      P.hl(x - 1, x1 + 1, top, c.ink); P.hl(x, x1, top + 1, c.rule); P.hl(x, x1, top + 2, c.dust, 2);
      // A string course over the shop floor.
      P.hl(x, x1, G - gf, c.ink); P.hl(x + 1, x1 - 1, G - gf + 1, c.rule);
      // Roof: a mansard with dormers, a gable, or (once) a corner turret with a copper dome.
      const kind = n === 2 ? 'dome' : (r() < 0.55 ? 'mansard' : 'gable'), cx = Math.round((x + x1) / 2);
      if (kind === 'mansard') {
        const rh = 7;
        P.fill(x, top - rh, x1, top - 1, (xx, yy) => {
          const inset = Math.round((top - yy) * 0.45);
          if (xx < x + inset || xx > x1 - inset) return null;
          if (yy === top - rh || xx === x + inset || xx === x1 - inset) return c.ink;
          return ((yy + (xx >> 1)) % 3 === 0) ? c.earth : (P.bay(xx, yy) < 5 ? c.hib : c.dust);
        });
        for (let b = 0; b < bays; b += 2) { const dx = x + 4 + b * 6; P.fill(dx, top - 5, dx + 2, top - 2, (xx, yy) => (yy === top - 5 ? c.ink : (xx === dx + 1 ? c.ink : c.cream))); }
        P.rect(x1 - 6, top - rh - 3, 2, 3, c.ink);
      } else if (kind === 'gable') {
        const gh = Math.min(10, Math.floor(hw / 3));
        P.fill(x + 2, top - gh, x1 - 2, top - 1, (xx, yy) => {
          const half = Math.round((yy - (top - gh)) * (hw / 2 - 2) / gh);
          if (Math.abs(xx - cx) > half) return null;
          if (Math.abs(xx - cx) >= half - 0.5 || yy === top - 1) return c.ink;
          return P.bay(xx, yy) < 3 ? wash[1] : wash[0];
        });
        P.fill(cx - 1, top - Math.round(gh * 0.55), cx + 1, top - Math.round(gh * 0.55) + 2, () => c.ink);
        P.rect(x + 4, top - 5, 2, 4, c.ink);
      } else {
        const dt = top - 4, dr = Math.max(3, Math.min(7, Math.floor(hw / 3), dt - 12));
        P.fill(cx - dr, dt, cx + dr, top - 1, (xx, yy) => (xx === cx - dr || xx === cx + dr ? c.ink : (P.bay(xx, yy) < 3 ? wash[1] : wash[0])));
        P.fill(cx - dr, dt - dr, cx + dr, dt - 1, (xx, yy) => {
          const d = Math.hypot(xx - cx, (yy - dt) * 1.15);
          if (d > dr + 0.4) return null;
          if (d > dr - 0.7) return c.copperDk;
          const t = (xx - cx) / dr * 0.8 + 0.5;
          return P.bay(xx, yy) < 2 + t * 12 ? c.copperDk : c.copper;
        });
        P.vl(cx, dt - dr - 4, dt - dr - 1, c.ink); P.hl(cx - 1, cx + 1, dt - dr - 3, c.ink);
      }
      // Windows: dark at dusk, waiting to be found.
      const off = x + Math.round((hw - bays * 6) / 2) + 2;
      for (let f = 0; f < floors; f++) {
        const wy = top + 5 + f * fh;
        for (let b = 0; b < bays; b++) {
          const wx = off + b * 6;
          P.hl(wx - 1, wx + 3, wy - 1, c.ink);
          P.fill(wx, wy, wx + 2, wy + 4, (xx, yy) => (xx === wx + 1 && yy !== wy + 2 ? c.ink : (P.bay(xx, yy) < 9 ? c.ink : c.lagoon)));
          if (fh > 7) P.hl(wx - 1, wx + 3, wy + 5, c.rule);
          wins.push([wx, wy]);
        }
      }
      // Shop floor: a door and a shop window.
      const dx = n % 2 ? x1 - 7 : x + 3;
      P.fill(dx, G - 7, dx + 3, G - 1, (xx, yy) => (yy === G - 7 ? c.ink : (P.bay(xx, yy) < 10 ? c.ink : c.bark)));
      const sx0 = n % 2 ? x + 3 : x + 9, sx1 = n % 2 ? x1 - 10 : x1 - 3;
      if (sx1 - sx0 > 4) P.fill(sx0, G - 6, sx1, G - 2, (xx, yy) => (yy === G - 6 || yy === G - 2 || xx === sx0 || xx === sx1 ? c.ink : (P.bay(xx, yy) < 6 ? c.ochre : c.lagoon)));
      x = x1 + 1; n++;
    }
    // The listings found so far, lit warm in a fixed order across the street.
    const order = wins.map((w, i) => [this.rng('win' + i)(), w]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
    order.slice(0, lit).forEach(([wx, wy], i) => {
      P.fill(wx - 1, wy - 1, wx + 3, wy + 5, (xx, yy) => (xx >= wx && xx <= wx + 2 && yy >= wy && yy <= wy + 4 ? (xx === wx + 1 && yy !== wy + 2 ? c.bark : (P.bay(xx, yy) < 13 ? c.mango : c.ochre)) : (xx === wx - 1 || xx === wx + 3) && yy > wy && yy < wy + 4 && P.bay(xx, yy) < 8 ? c.ochre : null));
      if (i === lit - 1) this.sprite(P, ['.hhh.', 'hccch', 'hccch', '.hhh.', '..h..'], wx - 1, wy - 7, { h: 'hib', c: 'cream' });
    });
    // The street: a kerb, cobbles, a lamp, and the watchdog sitting in front, keeping an eye out.
    P.hl(7, W - 8, G, c.ink);
    P.fill(7, G + 1, W - 8, H - 8, (xx, yy) => ((xx + (yy % 2) * 2) % 4 === 0 ? c.rule : null));
    P.hl(7, W - 8, G + 3, c.dust, 2);
    const lx = wide ? 33 : 23, lt = G - (small ? 17 : 24);
    P.fill(lx - 5, lt - 2, lx + 5, lt + 8, (xx, yy) => (Math.hypot(xx - lx, (yy - lt - 2) * 0.9) < 5.5 && P.bay(xx, yy) < 4 ? c.ochre : null));
    P.vl(lx, lt + 4, G + 2, c.ink); P.rect(lx - 1, lt, 3, 4, c.ink); P.set(lx, lt + 1, c.mango); P.set(lx, lt + 2, c.mango); P.set(lx, lt - 1, c.ink);
    P.hl(lx - 1, lx + 1, G + 2, c.ink);
    const dog = [
      '..........k...k........',
      '..........kk.kk........',
      '.........kkkkkkk.......',
      '.........kkkcckkk......',
      '.........kkkkkkkkkkk...',
      '.........kkkkkkkkkkkk..',
      '..........kkkkkkkk.....',
      '..........hhhhhh.......',
      '.........kkkkkkk.......',
      '........kkkkkkkk.......',
      '.......kkkkkkkkk.......',
      '......kkkkkkkkkk.......',
      '.....kkkkkkkkkkk.......',
      '....kkkkkkkkkkkkk......',
      'kk..kkkkkkkkkkkkk......',
      '.kkkkkkkkkkkkkkkk......',
      '..kkkkkkkkkkkkkkkk.....',
      '....kkkkkkkk.kkk.kk....',
    ];
    const big = !small, dg = big ? dog : dog.filter((_, j) => j % 3 !== 1).map((row) => row.split('').filter((_, i) => i % 3 !== 1).join(''));
    this.sprite(P, dg, wide ? 9 : 7, H - 9 - dg.length, { k: 'ink', c: 'cream', h: 'hib' });
  }

  // Goob the Renderer: the classic test scene, a lit sphere and a cube on a checkered floor.
  render3d(P) {
    const c = this.pal(), W = P.w, H = P.h, hor = Math.round(H * 0.5), cx = W / 2;
    P.fill(7, hor, W - 8, H - 8, (x, y) => {
      const z = 30 / (y - hor + 3), u = Math.floor((x - cx) * z / 9 + 100), v = Math.floor(z * 1.2);
      const dark = ((u + v) & 1) === 0, fade = Math.min(1, (y - hor) / 14);
      return dark ? (P.bay(x, y) < 3 + fade * 13 ? c.dust : null) : null;
    });
    P.hl(7, W - 8, hor, c.rule);
    // Sun, top left.
    const lx = 22, ly = 16;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(lx + dx, ly + dy, c.mango);
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2], [2, -2], [-2, 2]]) P.set(lx + dx, ly + dy, c.mango);
    // Sphere, Lambert-shaded with a highlight, and its shadow.
    const sx = Math.round(W * 0.36), sr = Math.round(H * 0.22), sy = hor + 6 - sr;
    P.fill(sx - sr, hor + 3, sx + sr + 8, hor + 12, (x, y) => (Math.hypot((x - sx - 5) / (sr + 2), (y - hor - 7) / 3.2) < 1 && (x + y) % 2 === 0 ? c.ink : null));
    P.fill(sx - sr, sy - sr, sx + sr, sy + sr, (x, y) => {
      const dx = (x - sx) / sr, dy = (y - sy) / sr, d = dx * dx + dy * dy;
      if (d > 1) return null;
      if (d > 0.86) return c.ink;
      const nz = Math.sqrt(1 - d), l = Math.max(0, -dx * 0.55 - dy * 0.6 + nz * 0.58);
      if (l > 0.93) return c.cream;
      return P.bay(x, y) < l * 17 ? c.trace : c.lagoon;
    });
    // A cube, its three faces cut in three tones.
    const bx = Math.round(W * 0.62), bs = Math.round(H * 0.3), by = hor + 9 - bs, d = Math.round(bs * 0.45);
    P.fill(bx, by, bx + bs, by + bs, (x, y) => (x === bx || x === bx + bs || y === by || y === by + bs ? c.ink : ((x + y) % 4 === 0 ? c.rule : c.cream)));
    for (let k = 1; k <= d; k++) {
      const oy = Math.round(k * 0.6);
      P.hl(bx + k, bx + bs + k, by - oy, k === d ? c.ink : ((k % 2) ? c.shade : c.cream));
      for (let y = by - oy; y <= by + bs - oy; y++) P.set(bx + bs + k, y, (k === d || (y + k) % 2 === 0) ? c.ink : c.bark);
    }
    P.vl(bx + d, by - Math.round(d * 0.6), by - Math.round(d * 0.6), c.ink);
    for (let k = 0; k <= d; k++) { P.set(bx + k, by - Math.round(k * 0.6), c.ink); P.set(bx + bs + k, by + bs - Math.round(k * 0.6), c.ink); }
    this.text(P, 'TGA', W - 8 - 4 - this.textW('TGA', 3, 1), 11, c.rule, 3, 1);
  }

  // ASCII Art Generator: a picture on the left, the same picture set in characters on the right.
  asciiArt(P) {
    const c = this.pal(), W = P.w, H = P.h, cy = 12, ch = H - 24, pw = Math.round((W - 40) / 2);
    const scene = (u, v) => {
      const sun = Math.hypot(u - 0.66, v - 0.36);
      if (sun < 0.17) return 1;
      const hill = 0.62 + 0.12 * Math.sin(u * 6.5 + 1) - 0.06 * Math.sin(u * 13);
      if (v > hill) return 0.12 + 0.18 * (1 - (v - hill) * 2);
      return 0.5 + 0.35 * (1 - v) - (sun < 0.2 ? -0.15 : 0);
    };
    const x0 = 13, x1 = x0 + pw, rx0 = W - 13 - pw;
    P.fill(x0, cy, x1, cy + ch, (x, y) => {
      if (x === x0 || x === x1 || y === cy || y === cy + ch) return c.ink;
      const u = (x - x0) / pw, v = (y - cy) / ch, s = scene(u, v);
      const hill = 0.62 + 0.12 * Math.sin(u * 6.5 + 1) - 0.06 * Math.sin(u * 13);
      if (Math.hypot(u - 0.66, v - 0.36) < 0.17) return P.bay(x, y) < 12 ? c.mango : c.ochre;
      if (v > hill) return P.bay(x, y) < 6 + (v - hill) * 30 ? c.canopy : c.fern;
      return P.bay(x, y) < (1 - v) * 9 ? c.rose : (P.bay(x, y) < 12 ? c.ochre : c.cream);
    });
    // The arrow.
    const ax = Math.round(W / 2), ay = cy + Math.round(ch / 2);
    P.hl(ax - 5, ax + 4, ay, c.ink); P.set(ax + 3, ay - 1, c.ink); P.set(ax + 3, ay + 1, c.ink); P.set(ax + 2, ay - 2, c.ink); P.set(ax + 2, ay + 2, c.ink);
    // The characters: one 3×5 glyph per 4×6 cell, picked by brightness.
    const G = ['...|...|...|...|...', '...|...|...|...|.#.', '...|.#.|...|.#.|...', '...|...|###|...|...', '...|###|...|###|...',
      '...|.#.|###|.#.|...', '#.#|.#.|###|.#.|#.#', '#.#|###|#.#|###|#.#', '#.#|..#|.#.|#..|#.#', '###|#.#|###|#..|###'];
    P.fill(rx0, cy, rx0 + pw, cy + ch, (x, y) => (x === rx0 || x === rx0 + pw || y === cy || y === cy + ch ? c.ink : c.cream));
    for (let gy = cy + 2; gy + 5 < cy + ch; gy += 6) for (let gx = rx0 + 2; gx + 3 < rx0 + pw; gx += 4) {
      const u = (gx + 1.5 - rx0) / pw, v = (gy + 2.5 - cy) / ch, s = scene(u, v), sun = s > 0.95;
      const k = sun ? 9 : Math.max(1, Math.min(9, Math.round((1 - s) * 10)));
      const col = sun ? c.mango : (s < 0.32 ? c.canopy : (v > 0.4 ? c.rose : c.ink));
      G[k].split('|').forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') P.set(gx + i, gy + j, col); });
    }
  }

  line(P, x0, y0, x1, y1, c, ev) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) if (!ev || i % ev === 0) P.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }

  // Analysis of Rotor Models: machine code feeds the rotor, which emits a BTOR2 circuit; the model
  // checker unrolls it frame by frame until, at k = 7, the bad state is reached (sat).
  rotorPlate(P, turn) {
    const c = this.pal(), W = P.w, H = P.h, wide = W > 150, top = 12, bot = H - 12;
    // The machine code: a column of RISC-U words in hex.
    const g = this.rng('riscu'), hx = '0123456789ABCDEF', cols = wide ? 2 : 1, x0 = wide ? 14 : 11;
    const lines = Math.floor((bot - top + 2) / 7);
    for (let col = 0; col < cols; col++) for (let j = 0; j < lines; j++) {
      let w = ''; for (let k = 0; k < 4; k++) w += hx[Math.floor(g() * 16)];
      this.text(P, w, x0 + col * 19, top + j * 7, j % 3 === 1 ? c.lagoon : c.ink, 3, 1);
    }
    const codeR = x0 + cols * 19 - 4;
    P.vl(codeR + 2, top, top + lines * 7 - 3, c.rule);
    // The rotor: a toothed wheel, turning when motion is on.
    const r = wide ? 17 : 9, gx = codeR + 6 + r + (wide ? 8 : 3), gy = Math.round((top + bot) / 2), teeth = wide ? 12 : 8;
    this.line(P, codeR + 4, gy, gx - r - 3, gy, c.ink, 2);
    const inGear = (x, y) => {
      const d = Math.hypot(x - gx, y - gy), a = Math.atan2(y - gy, x - gx) - turn, f = ((a / (Math.PI * 2) * teeth) % 1 + 1) % 1;
      return d <= (f < 0.45 ? r + (wide ? 3.2 : 2.4) : r) + 0.3;
    };
    P.fill(gx - r - 4, gy - r - 4, gx + r + 4, gy + r + 4, (x, y) => {
      if (!inGear(x, y)) return null;
      if (!inGear(x - 1, y) || !inGear(x + 1, y) || !inGear(x, y - 1) || !inGear(x, y + 1)) return c.ink;
      const d = Math.hypot(x - gx, y - gy), a = Math.atan2(y - gy, x - gx) - turn;
      if (d < r * 0.3) return d < r * 0.13 + 0.5 ? c.ink : c.cream;
      if (d < r * 0.3 + 1) return c.ink;
      if (d > r - 1.2 && d < r - 0.2) return c.ink;
      if (Math.abs(Math.sin(a * 2)) < (wide ? 0.09 : 0.14)) return c.ink;
      return (x + y) % 3 === 0 ? c.bark : (P.bay(x, y) < 5 ? c.earth : c.cream);
    });
    // The unrolled model: frames k = 0 … 7 stacked, the front one drawn as a BTOR2 graph.
    const K = wide ? 6 : 4, off = wide ? 5 : 3, fx0 = gx + r + (wide ? 14 : 7), fx1 = W - 12;
    const fw = fx1 - fx0 - (K - 1) * off, fh = bot - top - (K - 1) * off;
    this.line(P, gx + r + 3, gy, fx0 - 1, gy, c.ink, 2);
    for (let k = 0; k < K; k++) {
      const fx = fx0 + k * off, fy = top + (K - 1 - k) * off, front = k === K - 1;
      P.fill(fx, fy, fx + fw, fy + fh, (x, y) => (x === fx || y === fy || x === fx + fw || y === fy + fh ? c.ink : (front ? c.cream : ((x + y) % 3 === 0 ? c.rule : c.shade))));
    }
    const fx = fx0 + (K - 1) * off, fy = top, s = wide ? 2 : 1;
    this.text(P, 'K=7', fx + 3, fy + 3, c.ink, 3, 1);
    // Nodes: two states, their next functions, and the bad property.
    const st = [[fx + 4 * s + 2, fy + Math.round(fh * 0.38)], [fx + 4 * s + 2, fy + Math.round(fh * 0.72)]];
    const nx = fx + Math.round(fw * 0.5), bx = fx + fw - 6 * s - 3, by = fy + Math.round(fh * 0.55);
    for (const [x, y] of st) {
      this.line(P, x + 3 * s, y, nx - 2 * s - 1, y, c.ink);
      this.line(P, nx + 2 * s + 1, y, bx - 3 * s - 1, by, c.ink);
      for (let k = 0; k <= nx - x; k += 2) P.set(x + k, y + 3 * s + 2, c.rule);
      P.fill(x - 2 * s, y - 2 * s, x + 2 * s, y + 2 * s, (xx, yy) => (Math.abs(xx - x) === 2 * s || Math.abs(yy - y) === 2 * s ? c.ink : c.lagoon));
      P.fill(nx - 2 * s, y - 2 * s, nx + 2 * s, y + 2 * s, (xx, yy) => { const d = Math.hypot(xx - nx, yy - y); return d > 2 * s + 0.5 ? null : (d > 2 * s - 0.6 ? c.ink : c.cream); });
    }
    const br = 3 * s + 1;
    P.fill(bx - br, by - br, bx + br, by + br, (x, y) => { const d = Math.abs(x - bx) + Math.abs(y - by); return d > br ? null : (d > br - 1 ? c.ink : (P.bay(x, y) < 13 ? c.hib : c.rose)); });
    for (let k = 1; k <= (wide ? 2 : 1); k++) for (let a = 0; a < 16; a++) if (a % 2 === k % 2) P.set(bx + Math.round((br + 2 * k) * Math.cos(a * Math.PI / 8)), by + Math.round((br + 2 * k) * Math.sin(a * Math.PI / 8)), c.hib);
    this.text(P, 'SAT', fx + fw - 14, fy + 3, c.hib, 3, 1);
  }

  // The session trail: the project's sessions as stepping stones across a stream; the watchdog
  // stands on this one. Stones sit at equal steps, so links can lie over them.
  trailPlate(W, n, cur) {
    this._tr = this._tr || {};
    const key = W + ':' + n + ':' + cur;
    if (this._tr[key]) return this._tr[key];
    const c = this.pal(), H = 32, P = this.mk(W, H), x0 = 14, x1 = W - 15, step = (x1 - x0) / (n - 1), wy = 20, jit = this.rng('stones' + W);
    this.frame(P, 'trail' + W, true);
    P.fill(7, wy - 3, W - 8, H - 8, (x, y) => {
      if (y === wy - 3) return (x % 7 < 4) ? c.trace : null;
      if ((y - wy + 3) % 3 === 1 && (x + y * 3) % 9 < 4) return c.cream;
      return P.bay(x, y) < 2 + (y - wy) * 2 ? c.lagoon : (P.bay(x + 1, y) < 7 ? c.trace : null);
    });
    for (let i = 0; i < n; i++) {
      const cx = Math.round(x0 + i * step), here = i === cur, past = i < cur, rx = here ? (step > 6 ? 4 : 3) : (step > 6 ? 2 + Math.round(jit() * 0.7) : 1), ry = step > 6 ? 2 : 1.6;
      P.fill(cx - rx - 1, wy - ry - 1, cx + rx + 1, wy + ry + 2, (x, y) => {
        const d = Math.hypot((x - cx) / (rx + 0.5), (y - wy) / (ry + 0.5));
        if (d > 1.05 && y === wy + ry + 1 && Math.abs(x - cx) <= rx) return c.cream;
        if (d > 1.05) return null;
        if (d > 0.72) return (past || here) ? c.ink : c.rule;
        if (here) return P.bay(x, y) < 10 ? c.mango : c.ochre;
        if (!past) return c.cream;
        return (y < wy) ? c.cream : (P.bay(x, y) < 8 ? c.rule : c.dust);
      });
    }
    // Reeds on both banks.
    for (const bx of [9, 11, W - 12, W - 10]) for (let k = 0; k < 6; k++) P.set(bx + (k > 3 ? 1 : 0), wy + 2 - k, k > 4 ? c.earth : c.fern);
    // The watchdog, sitting on this session's stone.
    const dog = ['.k.k...', '.kkk...', 'kckkkk.', '.kkk...', '.hhh...', 'kkkk...', 'kkkkk..', 'kkkkk..', 'k.k.k..'];
    const dx = Math.round(x0 + cur * step) - 2;
    this.sprite(P, dog, dx, wy - 2 - dog.length + 1, { k: 'ink', c: 'cream', h: 'hib' });
    return (this._tr[key] = P.done());
  }

  // The field-journal postmark: the project round the rim, the date below, the session in the middle,
  // with the wavy cancellation lines running off to the left. Inked unevenly, as a stamp is.
  stamp(top, bottom, mid) {
    if (this._stamp) return this._stamp;
    const c = this.pal(), W = 104, H = 66, P = this.mk(W, H), cx = W - 33, cy = 33, R = 30, wear = this.rng('wear');
    const ink = c.lagoon;
    for (let k = 0; k < 4; k++) {
      const y0 = cy - 9 + k * 6;
      for (let x = 2; x < cx - R - 1; x++) if (wear() > 0.12) P.set(x, y0 + Math.round(1.6 * Math.sin(x / 3.2 + k)), ink);
    }
    P.fill(cx - R - 1, cy - R - 1, cx + R + 1, cy + R + 1, (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      if (wear() < 0.08) return null;
      if (d <= R + 0.5 && d > R - 0.9) return ink;
      if (d <= R - 2.4 && d > R - 3.3) return ink;
      return null;
    });
    const line = (t, y, k) => { const w = this.textW(t, 3, k); this.text(P, t, cx - Math.floor(w / 2), y, ink, 3, k); };
    line(top, cy - 15, 1);
    line(bottom, cy + 11, 1);
    for (const y of [cy - 8, cy + 8]) { const hw = Math.floor(Math.sqrt((R - 3) * (R - 3) - (y - cy) * (y - cy))); P.hl(cx - hw + 1, cx + hw - 1, y, ink); }
    const mw = this.textW(mid, 3, 2);
    this.text(P, mid, cx - Math.floor(mw / 2) + 3, cy - 5, ink, 3, 2);
    this.text(P, 'NO', cx - Math.floor(mw / 2) - 6, cy - 1, ink, 3, 1);
    // Knock the wear out of the solid parts too.
    for (let k = 0; k < 120; k++) P.set(cx - R + wear() * R * 2, cy - R + wear() * R * 2, null);
    return (this._stamp = P.done());
  }

  // Small hand-cut markers for the devlog's sections.
  icon(kind) {
    this._ic = this._ic || {};
    if (this._ic[kind]) return this._ic[kind];
    const c = this.pal(), P = this.mk(11, 11);
    const art = {
      done: ['...........', '..........k', '.........kk', '........kk.', 'k......kk..', 'kk....kk...', '.kk..kk....', '..kkkk.....', '...kk......', '...........', '...........'],
      decisions: ['.....k.....', '..kkkkkkk..', '..kgggggk.k', '..kkkkkkk..', '.....k.....', '.kkkkkkk...', 'k.ehhhhek..', '.kkkkkkk...', '.....k.....', '.....k.....', '...kkkkk...'],
      problems: ['.....k.....', '....kkk....', '....kmk....', '...kmmmk...', '...kmkmk...', '..kmmkmmk..', '..kmmkmmk..', '.kmmmmmmmk.', '.kmmmkmmmk.', 'kkkkkkkkkkk', '...........'],
      learned: ['...kkkkk...', '..kmmmmmk..', '.kmmcmmmmk.', '.kmcmmmmmk.', '.kmmmmmmmk.', '..kmmmmmk..', '...kmmmk...', '...kkkkk...', '...keeek...', '...kkkkk...', '....kkk....'],
      next: ['...........', '.k.........', '.kkkk......', '.kggkkkk...', '.kgggggkk..', '.kggkkkk...', '.kkkk......', '.k.........', '.k.........', '.k.........', 'kkk........']
    }[kind];
    this.sprite(P, art, 0, 0, { k: 'ink', g: 'fern', h: 'hib', e: 'earth', m: 'mango', c: 'cream' });
    return (this._ic[kind] = P.done());
  }

  // Windows light one by one, about every 2.5 s, then the street starts again; at rest, five are lit.
  rotorWide() { return { wide: this.projPlate('rotor', 237, 92, this.state.tick % 96), narrow: this.projPlate('rotor', 114, 84, 0) }; }

  litCount(max) { return Math.min(max, (5 + Math.floor(this.state.tick / 10)) % (max + 5)); }

  plates() {
    const lit = this.litCount(14);
    return {
      rcWide: this.projPlate('rentczecher', 237, 92, lit), rcNarrow: this.projPlate('rentczecher', 114, 84, lit),
      rc: this.projPlate('rentczecher', 114, 64, lit), goob: this.projPlate('goob', 114, 64, 0),
      ascii: this.projPlate('ascii', 114, 64, 0), rotor: this.projPlate('rotor', 114, 64, 0)
    };
  }
'''

PLATE_KEY = {'rentczecher': 'rc', 'Goob the Renderer': 'goob', 'ASCII Art Generator': 'ascii', 'Analysis of Rotor Models': 'rotor'}
LBL = f'font-family: {MONO}; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: {MUTED};'
PLATE_CSS = '.plw{display:block}.pln{display:none}\n@media (max-width: 760px){.plw{display:none}.pln{display:block}.capr{display:none}}\n'


# ---------------------------------------------------------------- shared bits

def date_long(d):
    y, m, dd = d.split('-')
    return f'{int(dd)} {MONTHS[int(m) - 1]} {y}'


def status_tag(status):
    done = status.strip().lower() == 'finished'
    glyph, col = ('[x]', MUTED) if done else ('[~]', CANOPY)
    return f'<span style="white-space: nowrap; color: {col};">{glyph} {html.escape(status)}</span>'


def pr_links(prs):
    return ', '.join(f'<a href="{u}">#{u.rstrip("/").split("/")[-1]}</a>' for u in prs if u)


def crumb(parts):
    return (f'<div style="font-family: {MONO}; font-size: 13px; color: {MUTED};">'
            + ' / '.join(f'<a href="#" style="color: {MUTED};">{p}</a>' if i < len(parts) - 1 else p for i, p in enumerate(parts) if p)
            + '</div>')


def h1(text, top=10):
    return f'<h1 style="margin: {top}px 0 8px; font-family: {MONO}; font-size: 36px; line-height: 1.2; font-weight: 600; color: {INK};">{text}</h1>'


def write(name, title, body, methods, vals, height, css=''):
    src = page(title, body, component(WOOD_JS + PLATE_JS + methods, vals), height, PLATE_CSS + css)
    open(OUT + name, 'w', encoding='utf-8').write(src)
    print('wrote', OUT + name)


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


PROJECTS = load_projects()
for pr in PROJECTS:
    pr['latest'] = max(l['date'] for l in pr['logs']) if pr['logs'] else None
ORDER = sorted(PROJECTS, key=lambda p: (p['status'] == 'finished', -(int(p['latest'].replace('-', '')) if p['latest'] else 0), p['name'].lower()))
RC = next(p for p in PROJECTS if p['name'] == 'rentczecher')
LOGS = RC['logs']
for l in LOGS:
    l['seed'] = 'devlogs/' + slugify(l['file'])

# ================================================================ 1. the projects list

CSS_INDEX = '''.cards{display:grid;grid-template-columns:repeat(2,342px);justify-content:space-between;gap:52px 28px}
@media (max-width: 760px){.cards{grid-template-columns:minmax(0,342px);justify-content:start}}
.card .pl{transition:transform .2s ease}.card:hover .pl{transform:translateY(-2px)}
@media (prefers-reduced-motion: reduce){.card .pl{transition:none}.card:hover .pl{transform:none}}
'''
ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']


def index_entry(i, p):
    log = (f'last devlog <span style="color: {INK};">{p["latest"]}</span> · {len(p["logs"])} sessions'
           if p['logs'] else 'no devlogs yet')
    k = PLATE_KEY[p['name']]
    return f'''<article class="card" style="min-width: 0;">
<div style="display: flex; justify-content: space-between; padding: 0 2px 7px; {LBL}"><span>Pl. {ROMAN[i]}</span><span>placeholder plate</span></div>
<!-- PLATE SLOT: {html.escape(p['name'])}'s own woodcut plate goes here. This one is a placeholder. -->
<a href="#" aria-hidden="true" tabindex="-1" class="pl" style="display: block; width: 342px; max-width: 100%; height: 192px; overflow: hidden;"><img alt="" src="{{{{plates.{k}}}}}" style="display: block; width: 342px; height: 192px; image-rendering: pixelated;"></a>
<div style="padding: 14px 2px 0;">
<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2px 14px;">
<h2 style="margin: 0; font-family: {MONO}; font-size: 20px; line-height: 1.3; font-weight: 600;"><a href="#" style="text-decoration: none;">{html.escape(p['name'])}</a></h2>
<span style="font-family: {MONO}; font-size: 12px;">{status_tag(p['status'])}</span>
</div>
<p style="margin: 6px 0 8px; font-size: 16px; line-height: 1.5;">{html.escape(p['description'])}</p>
<div style="font-family: {MONO}; font-size: 12px; line-height: 1.7; color: {MUTED};"><div style="color: {INK};">{html.escape(p['language'])}</div><div>{log}</div></div>
</div>
</article>'''


n_prog = sum(1 for p in PROJECTS if p['status'] != 'finished')
index_body = f'''{nav('projects')}
<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">
{h1('Projects', 0)}
<div style="font-family: {MONO}; font-size: 13px; color: {MUTED}; margin-bottom: 28px;">{len(PROJECTS)} projects · {n_prog} in progress · {len(PROJECTS) - n_prog} finished</div>
<p style="margin: 0 0 48px; color: {MUTED}; font-style: italic;">[A line about my projects, written by me]</p>
<div class="cards">
{''.join(index_entry(i, p) for i, p in enumerate(ORDER))}
</div>
</main>
{FOOTER}'''

write('ProjectsIndex.dc.html', 'Projects', index_body, '',
      "    return { roots: this.roots(), plates: this.plates() };", 1800, CSS_INDEX)

# ================================================================ 2. the project page

meta_body = RC['body']
reviewed = re.search(r'\*\*file last reviewed:\*\*\s*(\d+)\.(\d+)\.(\d+)', meta_body)
reviewed = f'{reviewed.group(3)}-{reviewed.group(2)}-{reviewed.group(1)}' if reviewed else None
meta_body = re.sub(r'\*\*file last reviewed:\*\*.*\n', '', meta_body)

# Split the write-up into its intro and its ## sections, keeping the milestones apart.
parts = re.split(r'^## (.+)$', meta_body, flags=re.M)
intro, secs = parts[0], list(zip(parts[1::2], parts[2::2]))
MILESTONE_HEADS = ('Milestones', 'Core', 'Current Tasks', 'Prepared tasks', 'Technical goals')


def render_blocks(text):
    out = ''
    for kind, v in blocks(text):
        out += md_list(v) if kind == 'ul' else p(inline(v))
    return out


def milestones(text):
    items = []
    for line in text.split('\n'):
        m = re.match(r'\s*- \[( |x|-)\]\s*(.*)', line)
        if m:
            t = m.group(2).strip()
            cur = bool(re.search(r'\bIN PROGRESS\b', t))
            t = re.sub(r'\s*-?\s*IN PROGRESS\s*$', '', t).strip()
            items.append({'done': m.group(1) in 'x-', 'cur': cur, 't': t})
    return items


def progress_list(items):
    done = sum(1 for i in items if i['done'])
    bar = ''.join(
        f'<span style="color: {CANOPY};">#</span>' if i['done'] else
        f'<span style="color: {INK};">&gt;</span>' if i['cur'] else
        f'<span style="color: #A9A08B;">·</span>' for i in items)
    rows = ''
    for i in items:
        if i['done']:
            glyph, gcol, tcol, bg = '[x]', CANOPY, MUTED, 'transparent'
        elif i['cur']:
            glyph, gcol, tcol, bg = '[&gt;]', INK, INK, TINT
        else:
            glyph, gcol, tcol, bg = '[ ]', '#8C8574', INK, 'transparent'
        tag = (f' <span style="display: inline-block; margin-left: 6px; padding: 0 7px; font-family: {MONO}; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: {INK}; border: 1px solid {INK}; border-radius: 2px; vertical-align: 2px;">IN PROGRESS</span>'
               if i['cur'] else '')
        rows += (f'<li style="display: flex; gap: 12px; padding: 7px 10px; margin: 0 -10px; background: {bg}; border-radius: 3px;">'
                 f'<span style="flex: 0 0 auto; width: 30px; font-family: {MONO}; font-size: 14px; color: {gcol}; white-space: pre; padding-top: 2px;">{glyph}</span>'
                 f'<span style="flex: 1; min-width: 0; color: {tcol};">{inline(i["t"])}{tag}</span></li>')
    return (f'<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; margin: 0 0 14px; font-family: {MONO}; font-size: 16px;">'
            f'<span aria-hidden="true" style="letter-spacing: 3px; white-space: pre;">[{bar}]</span>'
            f'<span style="color: {MUTED}; font-size: 13px;">{done} of {len(items)} done</span></div>'
            f'<ul aria-label="Milestones" style="list-style: none; margin: 0 0 18px; padding: 0; display: flex; flex-direction: column; gap: 2px;">{rows}</ul>')


def journal(logs):
    """Every devlog, newest first, grouped by month, threaded on a commit-graph line."""
    out, month = '', None
    newest = sorted(logs, key=lambda l: (l['date'], l['session']), reverse=True)
    for k, l in enumerate(newest):
        y, m, _ = l['date'].split('-')
        if (y, m) != month:
            month = (y, m)
            out += (f'<div style="display: flex; gap: 14px; font-family: {MONO}; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: {MUTED}; margin: {0 if k == 0 else 10}px 0 0;">'
                    f'<span aria-hidden="true" style="width: 14px; text-align: center; color: {FERN};">|</span><span style="padding: 4px 0;">{MONTHS[int(m) - 1]} {y}</span></div>')
        last = k == len(newest) - 1
        thread = '' if last else ''.join(f'<div style="height: 15px;">|</div>' for _ in range(9))
        out += f'''<div style="display: flex; gap: 14px;">
<div aria-hidden="true" style="position: relative; width: 14px; flex: 0 0 auto; font-family: {MONO}; font-size: 13px; line-height: 15px; text-align: center;"><div style="padding-top: 5px; color: {CANOPY}; font-weight: 600;">*</div><div style="position: absolute; left: 0; right: 0; top: 22px; bottom: -2px; overflow: hidden; color: {FERN};">{thread}</div></div>
<div style="flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 0 18px; padding: 2px 0 16px;">
<div style="flex: 0 0 132px; font-family: {MONO}; font-size: 13px; color: {MUTED}; padding-top: 4px; white-space: nowrap;">{l['date']} <span style="color: {INK};">#{l['session']}</span></div>
<div style="flex: 1 1 320px; min-width: 0;"><a href="#" style="font-size: 18px; line-height: 1.45;">{html.escape(l['title'])}</a>
<div style="font-size: 15px; line-height: 1.55; color: {MUTED}; margin-top: 2px;">{inline(l['first'])}</div></div>
</div></div>'''
    return out


writeup = render_blocks(intro)
ms_html = ''
for i, (head, text) in enumerate(secs):
    if head.strip() in MILESTONE_HEADS and milestones(text):
        ms_items = milestones(text)
        ms_html += trail_heading('Milestones', 'trailM', 64).replace('<h2 ', '<h2 id="milestones" ') + progress_list(ms_items)
    else:
        writeup += trail_heading(html.escape(head.strip()), f'trail{i}', 56) + render_blocks(text)

repo = f'github.com/schrodlm/{RC["github"]}'
ms_done = sum(1 for m in ms_items if m['done'])
CSS_PROJECT = ''
project_body = f'''{nav('projects')}
<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">
{crumb(['projects', RC['name']])}
<figure style="margin: 18px 0 28px;">
<div style="display: flex; justify-content: space-between; gap: 12px; padding: 0 2px 8px; {LBL}"><span>Pl. I · {RC['name']}</span><span class="capr">placeholder plate · Prague houses at dusk</span></div>
<!-- PLATE SLOT: rentczecher's own woodcut plate goes here. This one is a placeholder; a window lights as each listing is found. -->
<div class="plw" style="width: 711px; height: 276px; overflow: hidden;"><img alt="" aria-hidden="true" src="{{{{plates.rcWide}}}}" style="display: block; width: 711px; height: 276px; image-rendering: pixelated;"></div>
<div class="pln" style="width: 342px; max-width: 100%;"><img alt="" aria-hidden="true" src="{{{{plates.rcNarrow}}}}" style="display: block; width: 342px; height: 252px; image-rendering: pixelated;"></div>
</figure>
{h1(html.escape(RC['name']), 0)}
<p style="margin: 0 0 14px; font-size: 20px; line-height: 1.5;">{html.escape(RC['description'])}</p>
<div style="display: flex; flex-wrap: wrap; gap: 2px 18px; font-family: {MONO}; font-size: 13px; line-height: 1.8; color: {MUTED};"><span style="color: {INK};">{html.escape(RC['language'])}</span>{status_tag(RC['status'])}<a href="https://{repo}">{repo}</a></div>
<nav aria-label="On this page" style="display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 36px 0 0; padding: 12px 0; border-top: 1px solid {RULE}; border-bottom: 1px solid {RULE}; font-family: {MONO}; font-size: 13px; color: {MUTED};">
<a href="#milestones">milestones {ms_done}/{len(ms_items)}</a><a href="#journal">field journal · {len(LOGS)}</a><a href="#posts">posts · 0</a><span style="margin-left: auto;">reviewed {reviewed}</span>
</nav>
<div style="margin-top: 40px;">{writeup}</div>
{ms_html}
{trail_heading('Field journal', 'trailJ', 64).replace('<h2 ', '<h2 id="journal" ')}
<p style="margin: -4px 0 22px; font-family: {MONO}; font-size: 13px; color: {MUTED};">{len(LOGS)} working sessions, newest first · {LOGS[0]['date']} to {LOGS[-1]['date']}</p>
{journal(LOGS)}
{trail_heading('Posts', 'trailP', 64).replace('<h2 ', '<h2 id="posts" ')}
<p style="margin: 0; color: {MUTED}; font-style: italic;">[No posts linked to this project yet]</p>
</main>
{FOOTER}'''

trail_ids = [f'trail{i}' for i in range(len(secs))] + ['trailM', 'trailJ', 'trailP']
trails = ', '.join(f"{t}: this.trail('rc-{t}')" for t in trail_ids)
write('ProjectPage.dc.html', 'rentczecher', project_body, '',
      f"    return {{ roots: this.roots(), plates: this.plates(), {trails} }};", 4300, CSS_PROJECT)

# ================================================================ 3. one devlog

LOG = next(l for l in LOGS if l['file'] == '2026-10-14 Is it legal to release this')
S = LOG['sections']
prev = next((l for l in LOGS if l['session'] == LOG['session'] - 1), None)
nxt = next((l for l in LOGS if l['session'] == LOG['session'] + 1), None)

SECTION_MARKS = [('Done', '[x]'), ('Decisions', '-&gt;'), ('Problems and surprises', '!'), ('Learned', '+'), ('Next', '[ ]')]


def items_of(name):
    return [b for kind, v in blocks(S.get(name, '')) if kind == 'ul' for b in v]


def anchor(name):
    return re.sub(r'[^a-z]+', '-', name.lower()).strip('-')


skim = ''.join(f'<a href="#{anchor(n)}">{n.split()[0].lower()} {len(items_of(n))}</a>' for n, _ in SECTION_MARKS)
ICON_KEY = {'Done': 'done', 'Decisions': 'decisions', 'Problems and surprises': 'problems', 'Learned': 'learned', 'Next': 'next'}


def log_sections(icons=False):
    out = ''
    for name, mark in SECTION_MARKS:
        its = items_of(name)
        ic = (f'<img alt="" aria-hidden="true" src="{{{{icons.{ICON_KEY[name]}}}}}" style="width: 33px; height: 33px; image-rendering: pixelated; align-self: center; margin: -6px 0 -6px -2px;">'
              if icons else '')
        out += (f'<section aria-labelledby="{anchor(name)}" style="margin-top: 52px;">'
                f'<h2 id="{anchor(name)}" style="display: flex; align-items: baseline; gap: 10px; margin: 0 0 16px; font-family: {MONO}; font-size: 20px; font-weight: 600; color: {CANOPY};">{ic}{name}'
                f'<span style="font-size: 13px; font-weight: 400; color: {MUTED};">{len(its)}</span>'
                f'<span aria-hidden="true" style="flex: 1; min-width: 0; overflow: hidden; white-space: pre; font-size: 13px; font-weight: 400; color: #B9B09A;">{"." * 120}</span></h2>'
                f'{md_list(its, mark, 12)}</section>')
    return out


def seq_link(l, side):
    if not l:
        return f'<div style="flex: 1 1 260px;"></div>'
    arrow = f'&lt;- session {l["session"]}' if side == 'prev' else f'session {l["session"]} -&gt;'
    align = 'left' if side == 'prev' else 'right'
    return (f'<a href="#" style="flex: 1 1 260px; display: block; text-align: {align}; padding: 16px 18px; background: {PAPER}; border: 1px solid {RULE}; text-decoration: none;">'
            f'<div style="font-family: {MONO}; font-size: 12px; color: {MUTED};">{arrow} · {l["date"]}</div>'
            f'<div style="margin-top: 4px; font-size: 17px; line-height: 1.4; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px;">{html.escape(l["title"])}</div></a>')


# ---- the three ways to give a devlog something of its own

def band():
    """A slim plate of the project's street: one lit window per session so far, the pin on this one."""
    return f'''<figure style="margin: 0 0 26px;">
<!-- BAND: a slim version of the project's own plate. Windows lit = sessions so far; the pin = this session. -->
<div class="plw" style="width: 711px; height: 180px; overflow: hidden;"><img alt="" aria-hidden="true" src="{{{{band.wide}}}}" style="display: block; width: 711px; height: 180px; image-rendering: pixelated;"></div>
<div class="pln" style="width: 342px; max-width: 100%; height: 180px; overflow: hidden;"><img alt="" aria-hidden="true" src="{{{{band.narrow}}}}" style="display: block; width: 342px; height: 180px; image-rendering: pixelated;"></div>
<figcaption style="display: flex; justify-content: space-between; gap: 12px; padding: 7px 2px 0; {LBL}"><span>Pl. I · {RC['name']}</span><span>{LOG['session']} of {len(LOGS)} windows lit</span></figcaption>
</figure>'''


def trail():
    """Every session as a stepping stone; each stone is a link, this one carries the watchdog."""
    n, cur = len(LOGS), LOG['session'] - 1

    def links(W, scale):
        x0, x1 = 14, W - 15
        step = (x1 - x0) / (n - 1)
        out = ''
        for i, l in enumerate(LOGS):
            cx = round(x0 + i * step) * 3
            here = ' aria-current="page"' if i == cur else ''
            out += (f'<a href="#" class="stone"{here} title="#{l["session"]} · {l["date"]} · {html.escape(l["title"])}" aria-label="Session {l["session"]}: {html.escape(l["title"])}" '
                    f'style="position: absolute; left: {cx - 12}px; top: 30px; width: 24px; height: 48px;"></a>')
        return out

    def months(W):
        x0, x1 = 14, W - 15
        step = (x1 - x0) / (n - 1)
        out, seen = '', set()
        for i, l in enumerate(LOGS):
            m = l['date'][:7]
            if m in seen:
                continue
            seen.add(m)
            out += f'<span style="position: absolute; left: {round(x0 + i * step) * 3 - 4}px; top: 0;">{MONTHS[int(m[5:]) - 1][:3].lower()}</span>'
        return out

    return f'''<nav aria-label="Sessions of {RC['name']}" style="margin: 0 0 30px;">
<div style="display: flex; justify-content: space-between; gap: 12px; padding: 0 2px 6px; {LBL}"><span>field journal</span><span>session {LOG['session']} of {n}</span></div>
<!-- TRAIL: one stone per session, each a link; the watchdog stands on this one. -->
<div class="plw" style="position: relative; width: 711px; height: 114px;"><img alt="" aria-hidden="true" src="{{{{trail.wide}}}}" style="position: absolute; left: 0; top: 0; width: 711px; height: 96px; image-rendering: pixelated;">{links(237, 3)}
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 98px; font-family: {MONO}; font-size: 11px; color: {MUTED};">{months(237)}</div></div>
<div class="pln" style="position: relative; width: 342px; max-width: 100%; height: 114px;"><img alt="" aria-hidden="true" src="{{{{trail.narrow}}}}" style="position: absolute; left: 0; top: 0; width: 342px; height: 96px; image-rendering: pixelated;">{links(114, 3)}
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 98px; font-family: {MONO}; font-size: 11px; color: {MUTED};">{months(114)}</div></div>
</nav>'''


def postmark():
    return (f'<!-- POSTMARK: a woodcut date stamp for this session. -->'
            f'<img class="stamp" alt="" aria-hidden="true" src="{{{{stamp}}}}" style="width: 312px; height: 198px; image-rendering: pixelated;">')


VARIANT_CSS = {
    'plain': '',
    'band': '',
    'trail': '.stone{border-radius:50%}.stone:hover,.stone:focus-visible{outline:2px solid #1D5A8F;outline-offset:-4px}\n',
    'stamp': '.stamp{position:absolute;right:-48px;top:24px}\n@media (max-width: 1100px){.stamp{right:-8px}}\n@media (max-width: 760px){.stamp{position:static;display:block;margin:0 0 10px -8px;width:208px!important;height:132px!important}}\n.hstamp{padding-right:200px}\n@media (max-width: 760px){.hstamp{padding-right:0}}\n',
}


def devlog(variant):
    refs = inline(S.get('__refs', ''))
    head_pad = ' class="hstamp"' if variant == 'stamp' else ''
    body = f'''{VINE_MARKUP}
{nav('projects')}
<main style="max-width: 760px; margin: 0 auto; padding: {'48' if variant == 'band' else '80'}px 24px 80px; position: relative;">
{band() if variant == 'band' else ''}
{postmark() if variant == 'stamp' else ''}
<div{head_pad}>
{crumb(['projects', RC['name'], 'field journal', ''])}
{h1(html.escape(LOG['title']))}
<div style="font-family: {MONO}; font-size: 13px; color: {MUTED}; margin-bottom: 32px; display: flex; flex-wrap: wrap; gap: 2px 8px;">
<span style="color: {INK};">{LOG['date']}</span><span>· session <span style="color: {INK};">{LOG['session']}</span> of {len(LOGS)}</span><span>· PR {pr_links(LOG['pr'])}</span>
</div>
</div>
{trail() if variant == 'trail' else ''}
<p class="lede" style="margin: 0 0 30px; font-size: 21px; line-height: 1.6;">{inline(S['Summary'].strip())}</p>
<div style="display: flex; gap: 16px; padding: 16px 20px; background: {PAPER}; border: 1px solid {RULE}; margin-bottom: 18px;">
<span style="flex: 0 0 auto; font-family: {MONO}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: {MUTED}; padding-top: 4px;">Goal</span>
<span style="flex: 1; min-width: 0;">{inline(S['Goal'].strip())}</span>
</div>
<nav aria-label="Sections" style="display: flex; flex-wrap: wrap; gap: 4px 20px; font-family: {MONO}; font-size: 13px; color: {MUTED};"><span>in this session:</span>{skim}</nav>
{log_sections(variant == 'stamp')}
<div style="margin-top: 52px; padding-top: 18px; border-top: 1px solid {RULE}; font-size: 15px; line-height: 1.7; color: {MUTED};">
<span style="font-family: {MONO}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin-right: 8px;">References</span>{refs}
</div>
<nav aria-label="Previous and next session" style="display: flex; flex-wrap: wrap; gap: 14px; margin-top: 56px;">
{seq_link(prev, 'prev')}{seq_link(nxt, 'next')}
</nav>
<div style="margin-top: 22px; font-family: {MONO}; font-size: 13px;"><a href="#">back to {RC['name']}'s field journal</a></div>
</main>
{FOOTER}'''
    d = LOG['date']
    mon = MONTHS[int(d[5:7]) - 1][:3].upper()
    extra = {
        'plain': '',
        'band': f"band: {{ wide: this.projPlate('rentczecher', 237, 60, {LOG['session']}), narrow: this.projPlate('rentczecher', 114, 60, {LOG['session']}) }}, ",
        'trail': f"trail: {{ wide: this.trailPlate(237, {len(LOGS)}, {LOG['session'] - 1}), narrow: this.trailPlate(114, {len(LOGS)}, {LOG['session'] - 1}) }}, ",
        'stamp': f"stamp: this.stamp({json.dumps(RC['name'].upper())}, '{int(d[8:])} {mon} {d[:4]}', '{LOG['session']}'), icons: {{ done: this.icon('done'), decisions: this.icon('decisions'), problems: this.icon('problems'), learned: this.icon('learned'), next: this.icon('next') }}, ",
    }[variant]
    name = {'plain': 'DevlogEntry', 'band': 'DevlogBand', 'trail': 'DevlogTrail', 'stamp': 'DevlogStamp'}[variant]
    write(f'{name}.dc.html', LOG['title'], body, JS_VINE,
          f"    return {{ {extra}vine: this.vine(), bugs: this.bugs(), roots: this.roots() }};",
          3700, PAGE_CSS + VARIANT_CSS[variant] + '@media (max-width: 600px){.lede{font-size:19px!important}}\n')


for v in ('plain', 'band', 'trail', 'stamp'):
    devlog(v)

# ---- a scratch board for the Rotor plate at header size (not a deliverable; for the screenshot only)
os.makedirs('scratch_proj', exist_ok=True)
rotor_body = f'''<main style="max-width: 760px; margin: 0 auto; padding: 40px 24px;">
<div class="plw"><img alt="" src="{{{{rw.wide}}}}" style="display: block; width: 711px; height: 276px; image-rendering: pixelated;"></div>
<div class="pln"><img alt="" src="{{{{rw.narrow}}}}" style="display: block; width: 342px; height: 252px; image-rendering: pixelated;"></div>
<div style="margin-top: 24px;"><img alt="" src="{{{{plates.rotor}}}}" style="display: block; width: 342px; height: 192px; image-rendering: pixelated;"></div>
<p style="font-family: {MONO}; font-size: 12px; color: {MUTED};">machine code → rotor → BTOR2 model, unrolled k = 0 … 7 → sat @ k=7</p>
</main>'''
_out = OUT
OUT = 'scratch_proj/'
write('RotorPlate.dc.html', 'Rotor plate', rotor_body, '', "    return { rw: this.rotorWide(), plates: this.plates() };", 700)
OUT = _out

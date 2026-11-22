// The project plates: one picture per project, and a neutral one for a project without its own.
// Each drawing takes a plate of any size and cuts itself to fit, a little richer when it is wide.
import { c, rng, text, textW, sprite, line, birds, frame } from './woodcut.mjs';

function dusk(P, lit) {
  const W = P.w, H = P.h, wide = W > 150, small = H <= 64, G = H - Math.round(H * 0.2), fh = small ? 7 : 8;
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
  const g = rng('stars' + W);
  for (let k = 0; k < (wide ? 9 : 5); k++) P.set(10 + g() * (W - 20), 9 + g() * (H * 0.18), c.cream);
  birds(P, wide ? [[44, 14], [50, 11]] : [[30, 11]]);
  // The houses, side by side: each its own height, wash, roof and rhythm of windows.
  const r = rng('houses' + W), wins = [];
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
  const order = wins.map((w, i) => [rng('win' + i)(), w]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
  order.slice(0, lit).forEach(([wx, wy], i) => {
    P.fill(wx - 1, wy - 1, wx + 3, wy + 5, (xx, yy) => (xx >= wx && xx <= wx + 2 && yy >= wy && yy <= wy + 4 ? (xx === wx + 1 && yy !== wy + 2 ? c.bark : (P.bay(xx, yy) < 13 ? c.mango : c.ochre)) : (xx === wx - 1 || xx === wx + 3) && yy > wy && yy < wy + 4 && P.bay(xx, yy) < 8 ? c.ochre : null));
    if (i === lit - 1) sprite(P, ['.hhh.', 'hccch', 'hccch', '.hhh.', '..h..'], wx - 1, wy - 7, { h: 'hib', c: 'cream' });
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
  sprite(P, dg, wide ? 9 : 7, H - 9 - dg.length, { k: 'ink', c: 'cream', h: 'hib' });
}

// Goob the Renderer: the classic test scene, a lit sphere and a cube on a checkered floor.
function render3d(P) {
  const W = P.w, H = P.h, hor = Math.round(H * 0.5), cx = W / 2;
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
  text(P, 'TGA', W - 8 - 4 - textW('TGA'), 11, c.rule);
}

// ASCII Art Generator: a picture on the left, the same picture set in characters on the right.
function asciiArt(P) {
  const W = P.w, H = P.h, cy = 12, ch = H - 24, pw = Math.round((W - 40) / 2);
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
    const u = (x - x0) / pw, v = (y - cy) / ch;
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

// A small toothed wheel, the rotor itself.
function gear(P, gx, gy, r, teeth) {
  const inGear = (x, y) => {
    const d = Math.hypot(x - gx, y - gy), f = ((Math.atan2(y - gy, x - gx) / (Math.PI * 2) * teeth) % 1 + 1) % 1;
    return d <= (f < 0.45 ? r + 2 : r) + 0.3;
  };
  P.fill(gx - r - 3, gy - r - 3, gx + r + 3, gy + r + 3, (x, y) => {
    if (!inGear(x, y)) return null;
    if (!inGear(x - 1, y) || !inGear(x + 1, y) || !inGear(x, y - 1) || !inGear(x, y + 1)) return c.ink;
    const d = Math.hypot(x - gx, y - gy);
    if (d < r * 0.35) return d < 1.2 ? c.ink : c.cream;
    if (d < r * 0.35 + 1) return c.ink;
    return (x + y) % 3 === 0 ? c.bark : (P.bay(x, y) < 5 ? c.earth : c.cream);
  });
}

// Analysis of Rotor Models: Rotor turns a RISC-V program into an SMT formula, the formula goes to
// the solvers, and the benchmark is a cactus plot of how long each solver took, instance by
// instance, up to the timeout. On a wide plate the machine code and the rotor come first.
function rotor(P) {
  const W = P.w, H = P.h, wide = W > 150, top = 12, bot = H - 12;
  let x = 13;
  if (wide) {
    // The machine code: two columns of RISC-V words in hex.
    const g = rng('riscv'), hx = '0123456789ABCDEF', lines = Math.floor((bot - top + 2) / 7);
    for (let col = 0; col < 2; col++) for (let j = 0; j < lines; j++) {
      let w = ''; for (let k = 0; k < 4; k++) w += hx[Math.floor(g() * 16)];
      text(P, w, x + col * 19, top + j * 7, j % 3 === 1 ? c.lagoon : c.ink);
    }
    x += 38;
    P.vl(x - 2, top, top + lines * 7 - 3, c.rule);
    const gy = Math.round((top + bot) / 2);
    line(P, x, gy, x + 4, gy, c.ink, 2);
    gear(P, x + 15, gy, 8, 8);
    line(P, x + 26, gy, x + 30, gy, c.ink, 2);
    x += 32;
  }
  // The formula: a sheet of SMT-LIB with a turned-down corner, its terms nested in brackets.
  const sw = wide ? 50 : 40, sx0 = x, sx1 = x + sw, sy0 = top, sy1 = bot, ear = 5;
  P.fill(sx0, sy0, sx1, sy1, (xx, yy) => {
    if (xx - sx0 + (sy1 - sy0) - (yy - sy0) > sw + (sy1 - sy0) - ear) {
      // The turned corner, top right.
      if (xx - (sx1 - ear) + (sy0 + ear - yy) === ear) return c.ink;
      return xx > sx1 - ear && yy < sy0 + ear && xx - (sx1 - ear) < yy - sy0 + 1 ? c.dust : null;
    }
    if (xx === sx0 || xx === sx1 || yy === sy0 || yy === sy1) return c.ink;
    return (xx + yy) % 5 === 0 ? c.shade : c.cream;
  });
  P.vl(sx1 - ear, sy0, sy0 + ear, c.ink); P.hl(sx1 - ear, sx1, sy0 + ear, c.ink);
  text(P, '(ASSERT', sx0 + 3, sy0 + 3, c.hib);
  const terms = rng('smt:' + W + 'x' + H);
  let depth = 1;
  for (let y = sy0 + 11; y + 5 < sy1 - (wide ? 8 : 2); y += 6) {
    const ix = sx0 + 3 + depth * 4;
    text(P, '(', ix, y, c.ink);
    const len = Math.max(3, Math.min(sx1 - 6 - ix - 6, 4 + Math.floor(terms() * 18)));
    P.fill(ix + 4, y + 1, ix + 4 + len, y + 3, (xx, yy) => (yy === y + 2 || P.bay(xx, yy) < 6 ? (depth % 2 ? c.lagoon : c.ink) : null));
    if (terms() < 0.45 || depth > 2) { text(P, ')', Math.min(ix + 6 + len, sx1 - 4), y, c.ink); depth = Math.max(1, depth - 1); } else depth++;
  }
  if (wide) text(P, '(CHECK-SAT)', sx0 + 3, sy1 - 7, c.hib);
  // On to the solvers.
  const px0 = sx1 + (wide ? 14 : 7);
  if (wide) {
    const gy = Math.round((top + bot) / 2);
    line(P, sx1 + 2, gy, px0 - 5, gy, c.ink, 2); P.set(px0 - 5, gy, c.ink);
    P.set(px0 - 6, gy - 1, c.ink); P.set(px0 - 6, gy + 1, c.ink);
  }
  // The cactus plot: instances solved along, seconds up, one curve per solver, the timeout dashed.
  const px1 = W - 13, py0 = top + 2, py1 = bot - 1, to = py0 + 4;
  for (let gx = px0 + 8; gx < px1; gx += 8) for (let yy = to + 2; yy < py1; yy += 2) P.set(gx, yy, c.shade);
  P.vl(px0, py0, py1, c.ink); P.hl(px0, px1, py1, c.ink);
  for (let yy = py1 - 6; yy > to; yy -= 6) P.set(px0 - 1, yy, c.ink);
  for (let xx = px0 + 8; xx < px1; xx += 8) P.set(xx, py1 + 1, c.ink);
  P.hl(px0 + 1, px1, to, c.hib, 2);
  const span = px1 - px0 - 2, rise = py1 - to - 2;
  [[0.58, c.mango, 4.2], [0.78, c.fern, 4.6], [0.96, c.lagoon, 5]].forEach(([solved, col, bend], i) => {
    const n = Math.round(span * solved);
    let last = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n, yy = Math.round(py1 - 2 - i - (rise - 2) * (Math.exp(bend * t) - 1) / (Math.exp(bend) - 1));
      const pt = [px0 + 2 + k, Math.max(to + 1, yy)];
      if (last) line(P, last[0], last[1], pt[0], pt[1], col);
      last = pt;
    }
    // Each solver's last solved instance gets a mark; past it, the timeout.
    P.fill(last[0] - 1, last[1] - 1, last[0] + 1, last[1] + 1, (xx, yy) => (xx === last[0] || yy === last[1] ? col : null));
  });
  if (wide) text(P, 'TO', px1 - 8, to - 6, c.hib);
}

// The neutral plate, for a project without its own: open country under a pale sky, a path
// winding off over the hills, a signpost where it starts.
function neutral(P) {
  const W = P.w, H = P.h, wide = W > 150, hz = Math.round(H * 0.46);
  P.fill(7, 7, W - 8, hz + 6, (x, y) => (P.bay(x, y) < Math.max(0, 4 - (y - 7) / (hz - 7) * 5) ? c.trace : null));
  const sx = W - (wide ? 42 : 28), sy = wide ? 22 : 18, sr = wide ? 5 : 4;
  P.fill(sx - sr - 3, sy - sr - 3, sx + sr + 3, sy + sr + 3, (x, y) => {
    const d = Math.hypot(x - sx, y - sy);
    if (d <= sr - 0.7) return P.bay(x, y) < 8 ? c.ochre : c.cream;
    if (d <= sr + 0.3) return c.mango;
    return d <= sr + 3 && P.bay(x, y) < 4 ? c.ochre : null;
  });
  birds(P, wide ? [[48, 18], [55, 14], [62, 19]] : [[30, 15], [37, 12]]);
  // Three ridges of hills, paler as they go back.
  const ridge = (base, amp, f, ph) => (x) => base - amp * (0.6 * Math.sin(x / W * f + ph) + 0.4 * Math.sin(x / W * f * 2.3 + ph * 1.7));
  const far = ridge(hz, 4, 7, 1), mid = ridge(hz + 9, 5, 5, 3), near = ridge(hz + 20, 4, 4, 5);
  P.fill(7, 7, W - 8, H - 8, (x, y) => {
    if (y >= near(x)) return y === Math.ceil(near(x)) ? c.canopy : (P.bay(x, y) < 4 + (y - near(x)) * 0.4 ? c.moss : c.fern);
    if (y >= mid(x)) return y === Math.ceil(mid(x)) ? c.canopy : (P.bay(x, y) < 6 ? c.fern : c.sage);
    if (y >= far(x)) return y === Math.ceil(far(x)) ? c.copperDk : (P.bay(x, y) < 5 ? c.copper : c.sage);
    return null;
  });
  // The path: wide at the front, narrowing as it winds up toward the far ridge.
  const px = (t) => W * (0.42 + 0.16 * Math.sin(t * 5.2)), ty = (t) => H - 8 - t * (H - 8 - far(W * 0.5) - 2);
  for (let k = 0; k <= 400; k++) {
    const t = k / 400, y = Math.round(ty(t)), half = (1 - t) * (wide ? 6 : 5) + 0.6, x = px(t);
    for (let xx = Math.round(x - half); xx <= Math.round(x + half); xx++) {
      const edge = Math.abs(xx - x) > half - 1;
      P.set(xx, y, edge ? c.earth : (P.bay(xx, y) < 6 ? c.dust : c.ochre));
    }
  }
  // The signpost.
  const gx = Math.round(px(0.06)) + (wide ? 14 : 11), gb = H - 11;
  P.vl(gx, gb - 12, gb, c.bark); P.vl(gx + 1, gb - 12, gb, c.earth);
  P.fill(gx - 6, gb - 12, gx + 6, gb - 9, (x, y) => (x === gx + 6 && y !== gb - 12 && y !== gb - 9 ? null : (y === gb - 12 || y === gb - 9 || x === gx - 6 ? c.ink : c.ochre)));
  P.set(gx + 7, gb - 11, c.ink); P.set(gx + 7, gb - 10, c.ink); P.set(gx + 6, gb - 12, c.ink); P.set(gx + 6, gb - 9, c.ink);
}

// The drawings, by the project's slug, each with the seed of its paper grain. rentczecher's
// street is shown at rest, with five listings found.
const DRAWINGS = {
  rentczecher: ['rentczecher', (P) => dusk(P, 5)],
  'goob-the-renderer': ['goob', render3d],
  'analysis-of-rotor-models': ['rotor', rotor],
  clascii: ['ascii', asciiArt],
  neutral: ['neutral', neutral],
};

export const projectSlugs = Object.keys(DRAWINGS);

// Cuts a project's picture into a plate: paper grain, the plate mark, then the picture.
export function project(P, slug) {
  const [grain, draw] = DRAWINGS[slug];
  frame(P, grain + P.w);
  draw(P);
}


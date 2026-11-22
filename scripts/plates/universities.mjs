// The university plates: each faculty's building, front on, drawn from photos. FIT's is the new
// ČVUT building in Dejvice, MFF's the palace on Malostranské náměstí beside St Nicholas. Each is
// cut wide for the university's page and as a smaller crop for the courses home's card.
import { c, rgb, rng, frame } from './woodcut.mjs';

// A round-headed tree: a few overlapping lobes, outlined, lit from the upper left.
function tree(P, cx, base, r, seed, tall) {
  const g = rng('tree:' + seed), trunk = tall || Math.max(3, Math.round(r * 0.6)), cy = base - trunk - r + 1;
  const lobes = [[0, 0, r]];
  for (let k = 0; k < 5; k++) { const a = g() * Math.PI * 2; lobes.push([Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.5 - 1, r * (0.5 + g() * 0.3)]); }
  const inside = (x, y) => lobes.some(([lx, ly, lr]) => Math.hypot(x - cx - lx, (y - cy - ly) * 1.1) <= lr);
  P.rect(cx, cy + 2, r > 5 ? 2 : 1, base - cy - 2, c.bark);
  P.fill(Math.floor(cx - r * 1.8), Math.floor(cy - r * 1.5), Math.ceil(cx + r * 1.8), Math.ceil(cy + r * 1.5), (x, y) => {
    if (!inside(x, y)) return null;
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return c.canopy;
    const t = ((x - cx) + (y - cy) * 1.2) / (r * 2) + 0.5;
    return P.bay(x, y) < 3 + t * 12 ? c.fern : c.sage;
  });
}

// Sky: a Bayer wash of blue, densest at the top.
function sky(P, y0, y1, lv0, col) {
  for (let y = y0; y <= y1; y++) {
    const lv = Math.round(lv0 * Math.pow(1 - (y - y0) / (y1 - y0), 1.3));
    for (let x = 0; x < P.w; x++) if (P.bay(x, y) < lv) P.set(x, y, col);
  }
}

// A woodcut cloud: a bumpy cream mass, outlined, its underside stippled.
function cloud(P, cx, cy, w, h, seed) {
  const g = rng('cloud:' + seed), lobes = [];
  for (let k = 0; k < 6; k++) lobes.push([cx - w / 2 + (k + 0.5) * w / 6, cy - (g() * h * 0.6) * Math.sin((k + 0.5) / 6 * Math.PI), h * (0.45 + g() * 0.3)]);
  const inside = (x, y) => y <= cy + h * 0.35 && lobes.some(([lx, ly, lr]) => Math.hypot((x - lx) / 1.4, y - ly) <= lr);
  P.fill(Math.floor(cx - w), Math.floor(cy - h * 2), Math.ceil(cx + w), Math.ceil(cy + h), (x, y) => {
    if (!inside(x, y)) return null;
    if (!inside(x, y - 1) || !inside(x - 1, y) || !inside(x + 1, y)) return c.dust;
    if (!inside(x, y + 1)) return c.dust;
    return y > cy && P.bay(x, y) < 5 ? c.shade : c.cream;
  });
}

// Linear interpolation through a list of [f, v] points.
function lerp(pts, f) {
  for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return b === a ? vb : va + (vb - va) * (f - a) / (b - a); }
  return pts[pts.length - 1][1];
}

// FIT: the new ČVUT building at Thákurova 9, seen from the plaza. Two terracotta end wings with
// punched windows; between them the white centre in a shallow chevron, banded with ribbon
// windows; the freestanding white pylon in front, taller than the block; a brick stepped plinth.
function dejvice(P) {
  const W = P.w, H = P.h, wide = W > 150;
  const bx0 = wide ? 74 : 20, bw = wide ? 112 : 80, base = wide ? 68 : 62, bh = wide ? 37 : 31, k = bh / 273;
  const brick = rgb('#B65A3C'), brickDk = rgb('#8E4430'), glass = rgb('#2E3B40');
  const X = (f) => bx0 + f * bw, Y = (py) => base - (535 - py) * k;
  const TOP = [[0, 292], [0.08, 281], [0.18, 290], [0.385, 334], [0.74, 284], [0.7401, 263], [0.78, 258], [1, 304]];
  const BOT = [[0, 535], [0.18, 532], [0.385, 517], [0.74, 532], [1, 538]];
  sky(P, 7, base - 8, 4, c.lagoon);
  if (wide) { cloud(P, 46, 22, 34, 7, 'a'); cloud(P, 205, 30, 26, 5, 'b'); }
  else { cloud(P, 22, 22, 18, 5, 'a'); }
  // The old campus far off to the right.
  if (wide) {
    P.fill(196, base - 14, 222, base, (x, y) => (y === base - 14 || x === 196 ? c.rule : (P.bay(x, y) < 6 ? c.dust : c.shade)));
    for (let x = 199; x < 220; x += 4) P.rect(x, base - 11, 2, 2, c.rule), P.rect(x, base - 6, 2, 2, c.rule);
  }
  // The block, column by column.
  const bx1 = Math.round(X(1));
  for (let x = Math.round(X(0)); x <= bx1; x++) {
    const f = (x - bx0) / bw, topF = Y(lerp(TOP, f)), botF = Y(lerp(BOT, f)), top = Math.round(topF), bot = Math.round(botF);
    const face = f < 0.08 ? 'lside' : f < 0.18 ? 'lwing' : f < 0.385 ? 'cl' : f < 0.74 ? 'cr' : f < 0.78 ? 'rfront' : 'rwing';
    for (let y = top; y <= bot; y++) {
      const t = (y + 0.5 - topF) / Math.max(1, botF - topF);
      let col;
      if (face === 'cl' || face === 'cr') {
        const s = t * 9, st = Math.floor(s), fr = s - st;
        if (y === top) col = c.ink;
        else if (st >= 8) col = (Math.round(x) % 4 === 0 ? c.cream : glass);
        else if (fr > 0.40 && fr < 0.86) col = glass;
        else col = face === 'cl' ? (P.bay(x, y) < 4 ? c.dust : c.cream) : (fr > 0.86 && fr < 0.98 && P.bay(x, y) < 3 ? c.dust : c.cream);
      } else {
        const shade = face === 'lside' || face === 'rfront';
        col = y === top ? c.ink : (P.bay(x, y) < (shade ? 9 : 3) ? brickDk : brick);
      }
      P.set(x, y, col);
    }
    // A rule where two faces meet.
    for (const e of [0.08, 0.18, 0.385, 0.74, 0.78]) if (Math.abs(f - e) < 0.5 / bw) for (let y = top; y <= bot; y++) P.set(x, y, e === 0.385 ? c.dust : c.ink);
  }
  P.vl(Math.round(X(0)), Math.round(Y(292)), Math.round(Y(535)), c.ink); P.vl(bx1, Math.round(Y(304)), Math.round(Y(538)), c.ink);
  // Punched windows in the brick wings: a loose grid, some left out.
  const punch = (f0, f1, cols, rows, sz, seed) => {
    const g = rng('punch:' + seed);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (g() < 0.22) continue;
      const f = f0 + (i + 0.5) * (f1 - f0) / cols, x = Math.round(X(f)) - (sz >> 1);
      const top = Y(lerp(TOP, f)), bot = Y(lerp(BOT, f)), y = Math.round(top + (j + 0.7) * (bot - top) / (rows + 0.6));
      P.rect(x, y, sz, sz, g() < 0.12 ? c.ochre : glass);
    }
  };
  punch(0.09, 0.17, 2, 9, 2, 'l');
  punch(0.79, 0.99, wide ? 4 : 3, 8, wide ? 3 : 2, 'r');
  punch(0.01, 0.07, 1, 9, 1, 's');
  // The stepped brick plinth across the front, then the grey plaza and the lawn.
  for (let s = 0; s < 3; s++) {
    const fa = 0.14 - s * 0.03, fb = 0.80 + s * 0.02, y = base + 1 + s;
    P.hl(Math.round(X(fa)), Math.round(X(fb)), y, s % 2 ? brickDk : brick);
  }
  const pz1 = H - 8;
  P.fill(7, base + 4, W - 8, pz1, (x, y) => (P.bay(x, y) < 5 ? c.dust : c.shade));
  P.hl(7, W - 8, base + 4, c.rule);
  P.fill(7, pz1 - 6, W - 8, H - 8, (x, y) => {
    const edge = Math.round(H - 8 - (x / W - 0.25) * (wide ? 16 : 12));
    if (y < edge) return null;
    if (y === edge) return c.canopy;
    return P.bay(x, y) < 6 ? c.fern : c.moss;
  });
  // The pylon: a slender white slab, freestanding, taller than the building.
  const px = Math.round(X(0.3)), pw = wide ? 7 : 5, ptop = wide ? 9 : 10, pbot = base + 3;
  P.fill(px, ptop, px + pw - 1, pbot, (x, y) => {
    if (x === px || x === px + pw - 1 || y === ptop) return c.ink;
    if (x >= px + pw - 3) return (x + y) % 3 === 0 ? c.rule : c.shade;
    return (y - ptop) % 9 === 8 ? c.shade : c.cream;
  });
  P.hl(px - 1, px + pw, pbot + 1, c.rule);
  // A lamp post on the plaza.
  const lx = Math.round(X(0.47));
  P.vl(lx, base - 13, base + 6, c.ink); P.hl(lx - 1, lx + 1, base - 13, c.ink);
  // Trees: a tall group to the left, a few to the right.
  if (wide) {
    tree(P, 20, base + 3, 11, 'f1', 10); tree(P, 44, base + 3, 9, 'f2', 9); tree(P, 64, base + 3, 7, 'f3', 6);
    tree(P, 192, base + 3, 7, 'f4', 5); tree(P, 214, base + 3, 6, 'f5', 5);
  } else {
    tree(P, 12, base + 3, 7, 'f1', 6); tree(P, 104, base + 3, 5, 'f4', 4);
  }
}

// MFF: Malostranské náměstí at dusk. The faculty is the long plain grey-white palace on the
// right, thirteen bays under a dark hipped roof with chimneys along the ridge; St Nicholas's
// belfry and green dome rise behind it on the left; arcaded houses close the square on the left,
// and the tram rails curve across the cobbles.
function malaStrana(P) {
  const G = 68, wide = P.w > 150;
  const slate = rgb('#4A4F52'), slateLt = rgb('#6B6F6E'), grey = rgb('#D9D6CC'), stone = rgb('#BDB6A6');
  const roofRed = rgb('#9A4A34'), navy = rgb('#24406B');
  const warm = rgb('#E4B455'), lit = (x, y) => (P.bay(x, y) < 3 ? c.mango : warm);
  const glass = (x, y) => (P.bay(x, y) < 12 ? c.ink : slate);
  // Prague blue at dusk.
  for (let y = 7; y <= 50; y++) {
    const t = (y - 7) / 43, lv1 = Math.round(11 * Math.pow(1 - t, 1.2)), lv2 = Math.round(4 * Math.pow(1 - t, 2));
    for (let x = 0; x < 240; x++) { const b = P.bay(x, y); if (b < lv2) P.set(x, y, navy); else if (b < lv1) P.set(x, y, c.lagoon); }
  }
  // Petřín behind, a low dark hill.
  P.fill(40, 40, 112, 52, (x, y) => (y >= 46 - 5 * Math.sin((x - 40) / 72 * Math.PI) ? (P.bay(x, y) < 10 ? c.canopy : c.moss) : null));
  // The belfry: stages narrowing up to a green-copper cupola, a clock on the upper stage.
  const tx = 104;
  const stage = (x0, x1, y0, y1) => P.fill(x0, y0, x1, y1, (x, y) => (x === x0 || x === x1 || y === y0 ? c.ink : (x > x1 - 3 && (x + y) % 3 === 0 ? c.dust : c.cream)));
  stage(tx - 6, tx + 6, 35, G); stage(tx - 5, tx + 5, 28, 35); stage(tx - 4, tx + 4, 21, 28);
  P.hl(tx - 7, tx + 7, 35, c.ink); P.hl(tx - 6, tx + 6, 28, c.ink);
  for (const ax of [tx - 3, tx + 2]) P.fill(ax, 29, ax + 1, 34, (x, y) => (y === 29 && x === ax + 1 ? null : c.ink));
  P.fill(tx - 1, 38, tx + 1, 45, (x, y) => (y === 38 && x !== tx ? null : c.ink));
  for (const [ddx, ddy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) P.set(tx + ddx, 24 + ddy, c.ink);
  P.set(tx, 24, c.mango);
  [[9, 20], [9, 19], [7, 18], [5, 17], [5, 16], [7, 15], [5, 14], [3, 13], [1, 12], [1, 11]].forEach(([wd, y]) => {
    for (let x = tx - (wd >> 1); x <= tx + (wd >> 1); x++) P.set(x, y, x === tx - (wd >> 1) || x === tx + (wd >> 1) ? c.copperDk : (x > tx + 1 && P.bay(x, y) < 8 ? c.copperDk : c.copper));
  });
  P.vl(tx, 8, 10, c.ink); P.hl(tx - 1, tx + 1, 9, c.ink);
  // The church between belfry and palace: body, drum, the great dome and its lantern.
  const dx = 122;
  P.fill(110, 38, 132, G, (x, y) => (y === 38 ? c.ink : ((x + y) % 4 === 0 ? c.dust : c.cream)));
  P.fill(108, 36, 134, 40, (x, y) => (y >= 40 - Math.min(x - 108, 134 - x) * 0.6 ? (y === 36 ? c.ink : (P.bay(x, y) < 9 ? roofRed : c.hib)) : null));
  P.fill(dx - 9, 26, dx + 9, 37, (x, y) => {
    if (x === dx - 9 || x === dx + 9 || y === 26) return c.ink;
    const k = (x - dx + 90) % 4;
    if (k === 0) return c.dust;
    if (k === 2 && y > 28 && y < 35) return c.ink;
    return x > dx + 4 && (x + y) % 3 === 0 ? c.dust : c.cream;
  });
  P.fill(dx - 11, 17, dx + 11, 26, (x, y) => {
    const d = Math.hypot((x - dx) / 11, (y - 26) / 8.5);
    if (d > 1.03) return null;
    if (d > 0.93 || y === 26) return c.copperDk;
    if (Math.abs(x - dx) % 4 === 0 && d < 0.85) return c.copperDk;
    const t = (x - dx) / 11 * 0.7 + 0.45 - (26 - y) / 8.5 * 0.3;
    return P.bay(x, y) < 1 + t * 13 ? c.copperDk : c.copper;
  });
  P.fill(dx - 2, 12, dx + 2, 17, (x, y) => (x === dx - 2 || x === dx + 2 ? c.ink : (x === dx && y > 13 ? c.ink : c.cream)));
  P.rect(dx - 1, 10, 3, 2, c.copperDk); P.vl(dx, 7, 9, c.ink); P.hl(dx - 1, dx + 1, 8, c.ink);
  // A small green spire beside the dome.
  P.fill(132, 28, 134, 38, (x, y) => (x === 133 || y > 33 ? c.copperDk : c.copper)); P.vl(133, 25, 27, c.copperDk);
  // Houses in front of the church.
  const house = (x0, x1, roofY, faceY, tone, rows, seed, arcade) => {
    const g = rng('house:' + seed);
    P.fill(x0, roofY, x1, faceY - 1, (x, y) => {
      const inset = Math.round((faceY - y) * 0.7);
      if (x < x0 + inset - 1 || x > x1 - inset + 1) return null;
      return y === roofY || x === x0 + inset - 1 || x === x1 - inset + 1 ? c.ink : (P.bay(x, y) < 10 ? slate : slateLt);
    });
    P.fill(x0, faceY, x1, G, (x, y) => (x === x0 || x === x1 || y === faceY ? c.ink : (P.bay(x, y) < tone ? stone : c.cream)));
    const n = Math.floor((x1 - x0 - 2) / 4);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = x0 + 2 + i * 4 + Math.floor(((x1 - x0 - 2) - n * 4) / 2), y = faceY + 2 + r * 4;
      if (y + 2 > G - (arcade ? 7 : 3)) continue;
      P.fill(x, y, x + 1, y + 2, g() < 0.18 ? lit : glass);
    }
    if (arcade) for (let x = x0 + 2; x + 4 < x1; x += 6) P.fill(x, G - 6, x + 4, G - 1, (xx, y) => {
      const top = G - 4;
      if (y < top && Math.hypot(xx - x - 2, y - top) > 2.4) return null;
      return Math.hypot(xx - x - 2, y - top) > 1.6 && y < top ? c.ink : (P.bay(xx, y) < 7 ? c.mango : c.ochre);
    });
  };
  house(8, 34, 43, 48, 7, 5, 'a', true); house(34, 52, 46, 50, 2, 4, 'b', true); house(52, 74, 46, 50, 9, 4, 'c', true);
  house(74, 98, 50, 54, 3, 3, 'd', true); house(98, 111, 47, 52, 1, 3, 'e', false); house(111, 129, 53, 56, 6, 3, 'f', false);
  // The faculty: hipped roof, chimneys, and the long grey-white facade.
  const x0 = 129, x1 = 198, eave = 38, ridge = 31;
  P.fill(x0 - 1, ridge, x1 + 4, eave - 1, (x, y) => {
    const inset = Math.round((eave - y) * 0.9);
    if (x < x0 - 1 + inset || x > x1 + 4 - inset) return null;
    if (y === ridge || x === x0 - 1 + inset || x === x1 + 4 - inset) return c.ink;
    return P.bay(x, y) < 11 ? slate : slateLt;
  });
  for (let x = x0 + 8; x < x1 - 4; x += 6) { const h = 2 + ((x * 7) % 3); P.fill(x, ridge - h, x + 1, ridge - 1, (xx, y) => (y === ridge - h ? c.ink : (xx === x ? c.cream : c.dust))); }
  for (let x = x0 + 6; x < x1 - 2; x += 10) { P.rect(x, eave - 3, 2, 2, c.dust); }
  P.fill(x1 + 1, eave, x1 + 4, G, (x, y) => (x === x1 + 4 ? c.ink : ((x + y) % 3 === 0 ? c.rule : c.dust)));
  P.fill(x0, eave, x1, G, (x, y) => (x === x0 || x === x1 ? c.ink : (P.bay(x, y) < 5 ? grey : c.cream)));
  P.hl(x0 - 1, x1 + 4, eave, c.ink); P.hl(x0, x1, eave + 1, c.dust); P.hl(x0, x1, 61, c.dust);
  const bays = 13, bw = (x1 - x0) / bays, rows = [[40, 2], [45, 3], [51, 3], [57, 3], [63, 3]], g = rng('mff-win');
  rows.forEach(([y, h], r) => {
    for (let b = 0; b < bays; b++) {
      if (r === 4 && b === 1) continue;
      const x = Math.round(x0 + (b + 0.5) * bw) - 1;
      const on = r < 4 && g() < 0.3;
      P.fill(x, y, x + 1, y + h - 1, on ? lit : glass);
      P.hl(x - 1, x + 2, y + h, c.dust);
    }
  });
  // The stone portal at the left of the ground floor.
  const pd = Math.round(x0 + 1.5 * bw) - 1;
  P.fill(pd - 2, 59, pd + 3, G, (x, y) => (x === pd - 2 || x === pd + 3 || y === 59 ? stone : (y === 60 ? stone : c.ink)));
  // The tall house beyond the street on the right.
  P.fill(215, 24, 229, G, (x, y) => (x === 215 || y === 24 ? c.ink : ((x + y) % 3 === 0 ? c.rule : (P.bay(x, y) < 8 ? stone : grey))));
  P.fill(215, 19, 229, 23, (x, y) => (y >= 24 - (x - 215) * 0.9 ? (P.bay(x, y) < 11 ? slate : slateLt) : null));
  for (let y = 28; y < G - 3; y += 7) for (let x = 219; x < 228; x += 5) P.fill(x, y, x + 1, y + 2, glass);
  // The cobbled square, and two tracks curving away across it.
  P.hl(0, 240, G, c.ink);
  P.fill(0, G + 1, 240, 92, (x, y) => {
    const sp = y < G + 6 ? 3 : 4;
    return ((x + (y % 2) * 2) % sp === 0 && y % 2 === 0) ? c.rule : (P.bay(x, y) < 2 ? rgb('#D9B9A0') : null);
  });
  const rail = (b0, b1, b2) => {
    let last = null;
    for (let s = 0; s <= 400; s++) {
      const t = s / 400, x = (1 - t) * (1 - t) * b0[0] + 2 * (1 - t) * t * b1[0] + t * t * b2[0], y = (1 - t) * (1 - t) * b0[1] + 2 * (1 - t) * t * b1[1] + t * t * b2[1];
      const k = Math.round(x) + ',' + Math.round(y); if (k === last) continue; last = k; P.set(x, y, c.bark);
    }
  };
  [[0, 3], [7, 5], [17, 8], [24, 10]].forEach(([dxb, ye]) => rail([80 + dxb, 92], [72 + dxb * 0.5, G + ye], [4, G + ye]));
  // The tram, at the stop in front of the arcades.
  if (wide) tramDraw(P, 14, G - 9);
}

// A Prague tram: red below, a cream band, windows, a pantograph.
function tramDraw(P, ox, oy) {
  const L = 1, R = 30;
  const set = (x, y, col) => P.set(ox + x, oy + y, col);
  for (const [x, y] of [[12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [13, 1], [18, 1], [14, 2], [17, 2], [15, 3], [16, 3]]) set(x, y, c.ink);
  for (let y = 4; y <= 13; y++) for (let x = L; x <= R; x++) {
    const ex = Math.min(x - L, R - x);
    let col;
    if (y === 4 && ex < 2) continue;
    if (y === 5 && ex < 1) continue;
    if (y === 4 || x === L || x === R || (y === 5 && ex < 2)) col = c.ink;
    else if (y === 5) col = c.hib;
    else if (y >= 6 && y <= 8) col = (ex > 1 && (x - L) % 5 !== 0) ? (P.bay(x, y) < 6 ? c.mango : c.ochre) : c.cream;
    else if (y === 9) col = c.cream;
    else if (y === 13) col = c.ink;
    else if ((x === 9 || x === 22) && y < 13) col = c.ink;
    else col = c.hib;
    set(x, y, col);
  }
  for (const wx of [6, 25]) { for (let x = wx - 2; x <= wx + 2; x++) set(x, 14, c.ink); }
}

// Cuts a university's building into a plate. The scene is cut inside the plate mark, then the
// mark is ruled over it (no paper grain: the sky and the square cover the paper). MFF's square is
// drawn at the wide size; a narrow plate shows the part with the church and the faculty.
const DRAWINGS = {
  'fit-cvut': dejvice,
  mff: (P) => {
    if (P.w < 150) { P.ox = -84; P.oy = -4; }
    malaStrana(P);
    P.ox = 0; P.oy = 0;
  },
};

export const universitySlugs = Object.keys(DRAWINGS);

export function university(P, slug) {
  P.clip = [7, 7, P.w - 8, P.h - 8];
  DRAWINGS[slug](P);
  P.clip = null;
  frame(P);
}

// The woodcut toolkit: the palette, a plate to cut into (one pixel per 3 px cell), ordered Bayer
// tones, a small pixel type, the double-ruled plate mark, and a PNG writer. The drawings in
// projects.mjs and universities.mjs are cut with these; draw.mjs writes the plates.
import { deflateSync } from 'node:zlib';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// The garden's tones (the design brief's palette), and the paper tones a plate is printed with.
export const c = Object.fromEntries(
  Object.entries({
    // The brief's colours.
    ink: '#1F2B23', bark: '#5C4636', earth: '#7A5C42', moss: '#5E8E4A', fern: '#3F8A52', canopy: '#2B7349',
    lagoon: '#2A7099', hib: '#C24E39', rose: '#B5476E', mango: '#A87400',
    // The plate's paper and its washes: the rule of the plate mark, shade and dust for stipple,
    // grain and cream for the paper itself, sage, trace, ochre and copper as pale tints.
    rule: '#A99D84', shade: '#DDD3BD', dust: '#C9BDA3', paper: '#E6DECB', cream: '#F7F2E4', sage: '#9DB38E',
    trace: '#7FA3BD', ochre: '#E9D9AE', copper: '#7FA68A', copperDk: '#4E7F62',
  }).map(([k, v]) => [k, hex(v)]),
);

// A pigment mixed for one drawing only (a brick, a slate roof), outside the shared palette.
export const rgb = hex;

// A seeded random stream, so every plate is cut the same way each time.
export function rng(seed) {
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

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// A blank plate, w × h cells, transparent where nothing is cut so the page's sand shows through.
// `bay(x, y)` is the 4×4 Bayer threshold (0–15) of a cell: a fill that takes a colour where
// bay < lv covers lv of every 16 cells, evenly. `ox`/`oy` shift what is drawn; `clip` bounds it.
export function plate(w, h) {
  const d = new Uint8Array(w * h * 4);
  const P = {
    w, h, data: d,
    bay: (x, y) => BAYER[(((y | 0) % 4 + 4) % 4) * 4 + (((x | 0) % 4 + 4) % 4)],
    ox: 0, oy: 0, clip: null,
    set(x, y, col) {
      x = Math.round(x) + P.ox; y = Math.round(y) + P.oy;
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      if (P.clip && (x < P.clip[0] || y < P.clip[1] || x > P.clip[2] || y > P.clip[3])) return;
      const i = (y * w + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    },
    rect(x, y, rw, rh, col) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) P.set(i, j, col); },
    hl(x0, x1, y, col, ev) { for (let x = x0; x <= x1; x++) if (!ev || x % ev === 0) P.set(x, y, col); },
    vl(x, y0, y1, col, ev) { for (let y = y0; y <= y1; y++) if (!ev || y % ev === 0) P.set(x, y, col); },
    // Calls fn for every cell of the box; a colour it returns is cut, null leaves the cell alone.
    fill(x0, y0, x1, y1, fn) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const col = fn(x, y); if (col) P.set(x, y, col); } },
  };
  return P;
}

// A 3×5 pixel type, for the few words and figures cut into a plate (a file type, hex, a formula).
const FONT = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
  E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
  I: '###|.#.|.#.|.#.|###', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###', M: '#.#|###|###|#.#|#.#',
  N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##',
  R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###',
  V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.',
  Z: '###|..#|.#.|#..|###',
  0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
  4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
  8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
  '·': '...|...|.#.|...|...', '=': '...|###|...|###|...', '-': '...|...|###|...|...',
  '(': '.#.|#..|#..|#..|.#.', ')': '.#.|..#|..#|..#|.#.',
};

export const textW = (s) => [...s].length * 4 - 1;

export function text(P, s, x, y, col) {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch];
    if (g) g.split('|').forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') P.set(cx + i, y + j, col); });
    cx += 4;
  }
}

// A small hand-cut figure from rows of letters; `map` names each letter's colour, '.' is bare.
export function sprite(P, rows, x, y, map) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (map[r[i]]) P.set(x + i, y + j, c[map[r[i]]]); });
}

export function line(P, x0, y0, x1, y1, col, ev) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) if (!ev || i % ev === 0) P.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col);
}

export function birds(P, pts) {
  for (const [x, y] of pts) { P.set(x - 1, y - 1, c.ink); P.set(x, y, c.ink); P.set(x + 1, y - 1, c.ink); }
}

// The plate mark: a double rule (the inner one dotted) with a small cross at each corner, and,
// given a seed, faint paper grain. The picture is cut inside the inner rule, 7 cells from the edge.
export function frame(P, grainSeed) {
  const w = P.w, h = P.h;
  if (grainSeed) {
    const g = rng('paper:' + grainSeed);
    for (let k = 0; k < w * h * 0.012; k++) P.set(7 + g() * (w - 14), 7 + g() * (h - 14), c.paper);
  }
  const m1 = 4, m2 = 6;
  P.hl(m1, w - 1 - m1, m1, c.rule); P.hl(m1, w - 1 - m1, h - 1 - m1, c.rule);
  P.vl(m1, m1, h - 1 - m1, c.rule); P.vl(w - 1 - m1, m1, h - 1 - m1, c.rule);
  P.hl(m2, w - 1 - m2, m2, c.rule, 2); P.hl(m2, w - 1 - m2, h - 1 - m2, c.rule, 2);
  P.vl(m2, m2, h - 1 - m2, c.rule, 2); P.vl(w - 1 - m2, m2, h - 1 - m2, c.rule, 2);
  for (const [x, y] of [[m1, m1], [w - 1 - m1, m1], [m1, h - 1 - m1], [w - 1 - m1, h - 1 - m1]])
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(x + dx, y + dy, dx || dy ? c.hib : c.mango);
}

// ---- PNG: 8-bit RGBA, unfiltered rows, one image pixel per cell.

const CRC = new Uint32Array(256).map((_, n) => {
  let k = n;
  for (let i = 0; i < 8; i++) k = k & 1 ? 0xEDB88320 ^ (k >>> 1) : k >>> 1;
  return k >>> 0;
});

function crc32(buf) {
  let k = 0xFFFFFFFF;
  for (const b of buf) k = CRC[(k ^ b) & 0xFF] ^ (k >>> 8);
  return (k ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'latin1');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function png(P) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(P.w, 0); ihdr.writeUInt32BE(P.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits per channel, RGBA
  const raw = Buffer.alloc((P.w * 4 + 1) * P.h);
  const pixels = Buffer.from(P.data.buffer, P.data.byteOffset, P.data.length);
  for (let y = 0; y < P.h; y++) pixels.copy(raw, y * (P.w * 4 + 1) + 1, y * P.w * 4, (y + 1) * P.w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

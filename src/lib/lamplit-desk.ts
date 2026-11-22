// The CV's plate: a desk at night, lit by an oil lamp, and me in silhouette writing this CV with a
// quill, under the caption "me, writing this". The lamp throws rays across the wall; two books, an
// inkwell and a sheet headed "CV" lie on the desk. I am a dark figure hunched over the sheet, with
// only a warm rim of lamplight on my profile, hair, shoulder and hand.
//
// It is pixel art, one image pixel per 2 px cell, ordered (Bayer) dithering in warm ramps, inside a
// double-ruled plate mark; where nothing is cut the page's sand shows through. A frame is drawn as
// RGBA pixels with no DOM, so the same code draws the animation in the browser and the still the
// build writes as a PNG (pages/cv/lamplit-desk.png.ts). Ported from the "CV · A · lamplit desk,
// silhouette" prototype.
//
// The animation goes line by line: dip the quill, write the line, sit back and read it. The still
// is the finished sheet, the flame at rest.

export const DESK_WIDTH = 380;
export const DESK_HEIGHT = 180;
export const DESK_FPS = 10;
/** The frame number of the still: the sheet written, the flame at rest. */
export const STILL = -1;

type Rgb = readonly [number, number, number];

const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (hexes: string[]): Rgb[] => hexes.map(hex);

// Dark to bright: the lamplit wall and desk, the paper, the lamp's brass, the quill, the silhouette.
const BG = ramp(['#0B0705', '#130B07', '#1C0F09', '#28140B', '#371A0D', '#4A220F', '#612C12', '#7C3914', '#9A4917', '#B85E1E', '#D27A2A', '#E69A3E', '#F3B95C', '#FAD488', '#FEEBB8', '#FFF8E6']);
const PAPER = ramp(['#3A281C', '#55392A', '#734E37', '#936646', '#B38157', '#CC9C6B', '#E0B884', '#EFD09F', '#F8E3BC', '#FFF1D8']);
const BRASS = ramp(['#1A0E05', '#2E1A08', '#4A2B0C', '#6B4110', '#8F5A14', '#B5781C', '#D69A30', '#EDBB52', '#F8D987']);
const FEATHER = ramp(['#1A0D08', '#2B140B', '#40200F', '#5A2E14', '#773E19', '#97511F', '#B86826', '#D48535', '#E8A64C', '#F5C674', '#FCE2A6']);
const SILHOUETTE = ramp(['#050302', '#080504', '#0C0705', '#110A07']);
const INK = hex('#160C08');
const WHITE = hex('#FBF6EA');
const BLACK = hex('#0A0604');
const RULE = hex('#A99D84');
const HIBISCUS = hex('#C24E39');
const MANGO = hex('#A87400');

import { rng } from './random';

const W = DESK_WIDTH;
const H = DESK_HEIGHT;
// The picture inside the plate mark, the lamp's flame, and the desk's front edge.
const X0 = 12;
const Y0 = 12;
const X1 = 367;
const Y1 = 167;
const FX = 64;
const FY = 112;
const DESK = 126;
/** Frames in one line's cycle. */
const CYCLE = 100;
/** The frame the still is posed at: the last line written, read over. The animation starts here. */
export const STILL_POSE = 3 * CYCLE + 92;
/** The quill's direction, from the nib up the shaft. */
const QUILL: readonly [number, number] = [0.53, -0.848];

type Pixels = Uint8ClampedArray<ArrayBuffer>;
type Point = [number, number];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;

/** The colour of tone v on a ramp, dithered by the cell's Bayer threshold. */
const tone = (colours: Rgb[], v: number, x: number, y: number) =>
  colours[Math.max(0, Math.min(colours.length - 1, Math.floor(v + bayer(x, y) - 0.5)))]!;

function paint(d: Pixels, x: number, y: number, c: Rgb) {
  const i = (y * W + x) * 4;
  d[i] = c[0];
  d[i + 1] = c[1];
  d[i + 2] = c[2];
  d[i + 3] = 255;
}

function inside(px: number, py: number, poly: readonly Point[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** The distance from p to the segment AB, and how far along it the nearest point lies (0 to 1). */
function toSegment(px: number, py: number, a: Point, b: Point): [number, number] {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy || 1)));
  return [Math.hypot(px - a[0] - vx * t, py - a[1] - vy * t), t];
}

type Box = [number, number, number, number];

/** The box round some points, grown by a margin: no point further than that from them lies outside. */
function around(points: readonly Point[], margin: number): Box {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs) - margin, Math.min(...ys) - margin, Math.max(...xs) + margin, Math.max(...ys) + margin];
}

const within = (px: number, py: number, box: Box) => px >= box[0] && px <= box[2] && py >= box[1] && py <= box[3];

interface Glyph {
  x: number;
  cols: { top: number; asc: number }[];
}
interface Line {
  col: number;
  y0: number;
  len: number;
  h: number;
  glyphs: Glyph[];
}

/**
 * The lines on the sheet: a heading, then text, each a row of handwritten glyphs. I sit to the
 * right of the sheet, facing left, so the top of the page is to the left, a line runs up the
 * picture from its start at y0, and the next line lies to the right of it, nearer me.
 */
const LINES: Line[] = (() => {
  const g = rng('cv-sheet');
  const rows = [
    { col: 205, y0: 163, len: 22, h: 3 },
    { col: 212, y0: 163, len: 29, h: 2 },
    { col: 218, y0: 163, len: 30, h: 2 },
    { col: 224, y0: 163, len: 25, h: 2 },
  ];
  return rows.map((row) => {
    const glyphs: Glyph[] = [];
    let x = 0;
    let run = 0;
    while (x < row.len) {
      const w = g() < 0.5 ? 2 : 3;
      const cols = [];
      for (let c = 0; c < w; c++) cols.push({ top: g() < 0.55 ? 1 : 0, asc: g() < 0.12 ? 1 : 0 });
      glyphs.push({ x, cols });
      x += w + 1;
      run++;
      if (run > 2 && g() < 0.3) {
        x += 2;
        run = 0;
      }
    }
    return { ...row, glyphs };
  });
})();

interface Pose {
  f: number;
  line: number;
  written: number;
  nib: Point;
  lean: number;
  nod: number;
  flame: number;
  breath: number;
}

/** The pose at frame f: where the nib is, how far I lean, the nod, the flame. */
function pose(frame: number): Pose {
  const still = frame < 0;
  const f = still ? STILL_POSE : frame;
  const p = f % CYCLE;
  const line = Math.floor(f / CYCLE) % LINES.length;
  const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const L = LINES[line]!;
  let nib: Point;
  let lean = 0;
  let written = 0;
  let nod = 0;
  if (p < 14) {
    // Dip: lean over to the inkwell, dip twice, come back to the line.
    const go = ease(p / 4);
    const back = ease((p - 10) / 4);
    const at = p < 10 ? go : 1 - back;
    const dip = p >= 4 && p < 10 ? Math.abs(Math.sin(((p - 4) / 6) * Math.PI * 2)) * 3 : 0;
    const ink: Point = [172, 133 + dip];
    const home: Point = [L.col + 1, L.y0 + 1];
    nib = [home[0] + (ink[0] - home[0]) * at, home[1] + (ink[1] - home[1]) * at - Math.sin(at * Math.PI) * 10];
    lean = at;
  } else if (p < 86) {
    const q = (p - 14) / 72;
    written = Math.floor(q * L.glyphs.length + 0.001);
    const g = L.glyphs[Math.min(written, L.glyphs.length - 1)];
    const gu = (g ? g.x : 0) + (q * L.glyphs.length - written) * 3;
    nib = [L.col + 1 - Math.abs(Math.sin(f * 1.7)) * 1.4, L.y0 - gu + Math.sin(f * 2.3) * 0.7];
    nod = Math.sin(f * 0.9) * 0.018;
  } else {
    written = L.glyphs.length;
    const last = L.glyphs[L.glyphs.length - 1]!;
    const lift = ease((p - 86) / 4);
    nib = [L.col + 1 + lift * 3, L.y0 - last.x - 3 - lift * 2];
    // I sit back a touch and tilt my head, reading what I wrote.
    nod = -0.07 * Math.sin(ease((p - 86) / 14) * Math.PI);
  }
  const n = (k: number) => Math.sin(f * k) * 0.5 + Math.sin(f * k * 2.7 + 1) * 0.5;
  return {
    f,
    line,
    written: still ? 99 : written,
    nib,
    lean,
    nod,
    flame: still ? 0 : n(0.9),
    breath: still ? 0.5 : 0.5 + 0.5 * Math.sin(f * 0.21),
  };
}

const bases = new Map<number, Pixels>();

/**
 * The parts that hold still, at one of five levels of the light's breathing: the wall and its
 * rays, the desk, the books, the inkwell, the sheet with its "CV", and the lamp's body.
 */
function base(level: number): Pixels {
  const cached = bases.get(level);
  if (cached) return cached;
  const d: Pixels = new Uint8ClampedArray(W * H * 4);
  const put = (x: number, y: number, c: Rgb) => {
    if (x >= 0 && y >= 0 && x < W && y < H) paint(d, x, y, c);
  };
  const glow = 1 + (level - 2) * 0.035;
  const rays = [[-1.02, 0.05], [-0.74, 0.035], [-0.45, 0.05], [-0.2, 0.03], [0.06, 0.04], [-1.3, 0.03]] as const;
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) {
      const dx = x - FX;
      const dy = y - FY;
      const dist = Math.hypot(dx, dy);
      if (y < DESK) {
        // The wall: a hot pool round the lamp, and a broad warm wash reaching the far side, so
        // the writer stands out against it.
        let v = 1.2 + (12.5 * glow) / (1 + (dist / 46) * (dist / 46)) + (5.2 * glow) / (1 + (dist / 165) * (dist / 165));
        const a = Math.atan2(dy, dx);
        for (const [ra, rw] of rays) {
          const k = 1 - Math.abs(a - ra) / rw;
          if (k > 0 && dist > 18) v += 2.4 * k * Math.exp(-dist / 190) * glow;
        }
        const seam = (x + Math.floor(y / 61) * 13) % 34;
        if (seam === 0) v -= 1.2;
        else if (seam === 1) v += 0.35;
        v += 0.35 * Math.sin(x * 0.9 + Math.sin(y * 0.07 + x) * 2);
        put(x, y, tone(BG, v, x, y));
      } else {
        const ld = Math.hypot(dx * 0.8, (y - FY) * 1.6);
        let v = 1.0 + (10.5 * glow) / (1 + (ld / 52) * (ld / 52)) + 1.6 / (1 + (ld / 160) * (ld / 160));
        if (y === DESK) v = 0.6;
        if ((y - DESK) % 9 === 4) v -= 0.7;
        v += 0.3 * Math.sin(x * 0.21 + y * 1.3);
        if (y >= Y1 - 3) v -= 1.6;
        put(x, y, tone(BG, v, x, y));
      }
    }
  }
  // The sheet, in gentle perspective, lit warm from the left.
  const sheet: Point[] = [[184, 129], [268, 128], [278, 167], [178, 167]];
  for (let y = 128; y <= Y1; y++) {
    for (let x = 174; x <= 282; x++) {
      if (!inside(x + 0.5, y + 0.5, sheet)) continue;
      const ld = Math.hypot(x - FX, (y - FY) * 1.4);
      let v = 2.2 + 7.4 / (1 + (ld / 150) * (ld / 150)) - (y > 160 ? 0.4 : 0);
      const edge = !inside(x - 0.5, y + 0.5, sheet) || !inside(x + 1.5, y + 0.5, sheet) || !inside(x + 0.5, y - 0.5, sheet);
      if (edge) v -= 1.2;
      put(x, y, tone(PAPER, v, x, y));
    }
  }
  // "CV" at the head of the sheet, set the way I read it from my seat.
  const big = { C: ['.###', '#...', '#...', '#...', '.###'], V: ['#..#', '#..#', '#..#', '.##.', '.##.'] };
  for (const [letter, yb] of [['C', 163], ['V', 153]] as const) {
    big[letter].forEach((row, j) => {
      for (let i = 0; i < 4; i++) {
        if (row[i] !== '#') continue;
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) put(187 + j * 2 + a, yb - i * 2 - b, INK);
      }
    });
  }
  for (let y = 163; y > 133; y -= 1) if (y % 7 !== 6) put(199, y, PAPER[3]!);
  // Two books lying on the desk, their page edges catching the lamp.
  const books: [number, number, number, number, Rgb][] = [
    [98, 148, 151, 160, BG[7]!],
    [103, 144, 143, 151, BG[6]!],
  ];
  for (const [bx0, bx1, by0, by1, cover] of books) {
    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        const ld = Math.hypot(x - FX, (y - FY) * 1.2);
        const lit = 1 / (1 + (ld / 70) * (ld / 70));
        let c: Rgb;
        if (y === by0 || y === by1 || x === bx1) c = BG[1]!;
        else if (x < bx0 + 3) c = tone(PAPER, 3 + lit * 6 - (y % 2 ? 0.6 : 0), x, y);
        else if (y === by0 + 1) c = cover;
        else c = tone(BG, 2.2 + lit * 6.5 - (x - bx0) * 0.05, x, y);
        put(x, y, c);
      }
    }
  }
  // The inkwell: a squat dark glass pot, a gold rim of lamplight on its left.
  const ix = 172;
  const ib = 160;
  for (let y = 136; y <= ib; y++) {
    for (let x = ix - 13; x <= ix + 13; x++) {
      const t = y - 136;
      const r = t < 4 ? 4.5 : t < 6 ? 6 : 11.5 - Math.max(0, (t - 18) * 0.9);
      if (Math.abs(x - ix + 0.5) > r) continue;
      const o = (x - ix + 0.5) / r;
      let v = 1.2 + Math.max(0, -o) * 3.2;
      if (o < -0.72 && t > 6) v = 6.2 - (t > 18 ? 1.5 : 0);
      if (o < -0.5 && o > -0.62 && t > 8 && t < 17) v = 7.4;
      if (t === 0) v = 0.4;
      put(x, y, tone(BRASS, v * 0.8, x, y));
    }
  }
  for (let x = ix - 4; x <= ix + 3; x++) put(x, 136, INK);
  for (let x = ix - 13; x <= ix + 14; x++) put(x, ib + 1, BG[1]!);
  // The lamp: a brass foot and font, the glass chimney glowing; the flame is drawn per frame.
  const lx = FX;
  for (let y = 128; y <= 162; y++) {
    const t = y - 128;
    const r = t < 6 ? 11 : t < 8 ? 8 : t < 24 ? 18 - Math.abs(t - 15) * 0.55 : t < 30 ? 7 : 16;
    for (let x = lx - 20; x <= lx + 20; x++) {
      const o = (x - lx + 0.5) / r;
      if (Math.abs(o) > 1) continue;
      let v = 4 + (1 - Math.abs(o + 0.25)) * 4 - (t > 8 ? 1 : 0);
      if (t < 6 || t >= 30) v += 1;
      if (Math.abs(o) > 0.88) v -= 2;
      put(x, y, tone(BRASS, v, x, y));
    }
  }
  for (let y = 58; y < 128; y++) {
    const t = (y - 58) / 70;
    const r = t < 0.25 ? 6 : 6 + Math.sin(Math.min(1, (t - 0.25) / 0.75) * Math.PI * 0.92) * 10.5;
    for (let x = Math.floor(lx - r); x <= lx + r; x++) {
      const o = (x - lx + 0.5) / r;
      if (Math.abs(o) > 1) continue;
      const fd = Math.hypot(x - lx, (y - FY) * 0.8);
      let v = 15.2 - fd * 0.2 - Math.abs(o) * 2.5;
      if (Math.abs(o) > 0.84) v = 11.5 - (t < 0.25 ? 2 : 0);
      if (o < -0.45 && o > -0.62 && t > 0.3) v = Math.max(v, 14.6);
      put(x, y, tone(BG, v, x, y));
    }
  }
  for (let x = lx - 7; x <= lx + 7; x++) {
    put(x, 57, BRASS[6]!);
    put(x, 56, BRASS[3]!);
  }
  bases.set(level, d);
  return d;
}

/** The figure's masks: 1 skin, 2 hair, 3 shirt; the hand is kept apart so the quill can pass under it. */
function figure(S: Point, HC: Point, P: Pose) {
  const body = new Uint8Array(W * H);
  const hand = new Uint8Array(W * H);
  const th = -0.42 + P.nod;
  const co = Math.cos(th);
  const si = Math.sin(th);
  // From the picture into the head's own frame, tilted with the nod.
  const toHead = (sx: number, sy: number): Point => {
    const x = sx - HC[0];
    const y = sy - HC[1];
    return [x * co + y * si, -x * si + y * co];
  };
  const face: Point[] = [[-12, -18], [-14.6, -12], [-16.2, -7.4], [-16.0, -5.0], [-14.4, -3.4], [-15.6, -0.6], [-18.8, 3.0], [-22.4, 6.6], [-21.8, 8.0], [-19.4, 8.8], [-16.8, 9.3],
    [-15.6, 10.6], [-17.0, 12.1], [-15.4, 13.2], [-16.4, 14.5], [-14.2, 16.0], [-15.4, 18.4], [-13.0, 21.3], [-8, 22.6], [-2.5, 21], [4, 17], [8.5, 12], [11, 5], [10.5, -5], [4, -14], [-4, -18.5]];
  const hair: Point[] = [[-14.2, -15.8], [-14.8, -20.6], [-10.6, -25.8], [-3.5, -28.8], [4.6, -29], [11.8, -26.2], [17.4, -20], [21, -11.5], [22, -2], [20.4, 7], [17, 13.8], [12, 17], [9.8, 11.5], [8.4, 4.2], [5.4, -3.5], [1, -9.6], [-5.4, -13.2], [-10.8, -14.2]];
  const curl = (lx: number, ly: number) => Math.sin(lx * 1.25 + Math.sin(ly * 1.1) * 2.4) + Math.sin(ly * 1.45 - lx * 0.5);
  const torso: Point[] = [[S[0] - 20, S[1] - 11], [S[0] - 24, S[1] + 8], [S[0] - 27, S[1] + 34], [S[0] - 25, 172], [S[0] + 40, 172], [S[0] + 38, S[1] + 34],
    [S[0] + 32, S[1] + 10], [S[0] + 21, S[1] - 9], [S[0] + 7, S[1] - 19], [S[0] - 6, S[1] - 24]];
  // The arm: shoulder to elbow resting on the desk, forearm along it to the hand at the nib.
  const u = QUILL;
  const nib = P.nib;
  const grip: Point = [nib[0] + 10 * u[0], nib[1] + 10 * u[1]];
  const wrist: Point = [grip[0] + 9, grip[1] + 3];
  const Lu = 48;
  const Lf = 50;
  const sh: Point = [S[0] - 4, S[1] + 2];
  let dx = wrist[0] - sh[0];
  let dy = wrist[1] - sh[1];
  let dd = Math.hypot(dx, dy);
  if (dd > Lu + Lf - 1) {
    const k = (Lu + Lf - 1) / dd;
    dx *= k;
    dy *= k;
    dd = Lu + Lf - 1;
  }
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.max(-1, Math.min(1, (Lu * Lu + dd * dd - Lf * Lf) / (2 * Lu * dd))));
  const elbow: Point = [sh[0] + Lu * Math.cos(a - b), sh[1] + Lu * Math.sin(a - b)];
  const neckA: Point = [HC[0] + 4, HC[1] + 15];
  const neckB: Point = [S[0] - 9, S[1] - 13];
  const fist: Point = [grip[0] + 5, grip[1] + 1.6];
  const knuckles = ([[-5, -3.6], [-2, -5.2], [1.6, -5.6]] as const).map(([kx, ky]): Point => [fist[0] + kx, fist[1] + ky]);
  const finger: [Point, Point] = [[grip[0] + 1.6, grip[1] + 2.4], [nib[0] + 4.4 * u[0] + 1.6, nib[1] + 4.4 * u[1] + 1.3]];
  const thumb: [Point, Point] = [[grip[0] + 6, grip[1] - 4], [grip[0] - 1.2, grip[1] - 1.3]];
  // Each part is only tested inside the box it can reach, which keeps a frame cheap enough to animate.
  const faceBox = around(face, 0);
  const hairBox = around(hair, 0);
  const neckBox = around([neckA, neckB], 6.4);
  const torsoBox = around(torso, 0);
  const upperArmBox = around([sh, elbow], 9);
  const forearmBox = around([elbow, wrist], 7.4);
  const handBox = around([[fist[0] - 7.6, fist[1] - 5.6], [fist[0] + 7.6, fist[1] + 5.6], ...knuckles, ...finger, ...thumb], 2.4);
  for (let y = Y0; y <= Y1; y++) {
    for (let x = 150; x <= X1; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const i = y * W + x;
      let m = 0;
      if (Math.abs(px - HC[0]) < 38 && Math.abs(py - HC[1]) < 38) {
        const [lx, ly] = toHead(px, py);
        if (within(lx, ly, faceBox) && inside(lx, ly, face)) m = 1;
        else {
          const hx = lx + curl(lx, ly) * 0.9;
          const hy = ly + curl(ly, lx) * 0.55;
          if (within(hx, hy, hairBox) && inside(hx, hy, hair)) m = 2;
        }
      }
      if (!m && within(px, py, neckBox) && toSegment(px, py, neckA, neckB)[0] < 6.4) m = 1;
      if (!m && py > S[1] - 26 && within(px, py, torsoBox) && inside(px, py, torso)) m = 3;
      if (!m && within(px, py, upperArmBox)) {
        const [du, t] = toSegment(px, py, sh, elbow);
        if (du < 9 - t * 1.5) m = 3;
      }
      if (!m && within(px, py, forearmBox)) {
        const [df, t] = toSegment(px, py, elbow, wrist);
        if (df < 7.4 - t * 2.4) m = t > 0.5 ? 1 : 3;
      }
      if (m) body[i] = m;
      if (!within(px, py, handBox)) continue;
      // The hand: a loose fist, knuckles, the index finger along the quill, the thumb over it.
      const ex = (px - fist[0]) / 7.6;
      const ey = (py - fist[1]) / 5.6;
      if (
        ex * ex + ey * ey <= 1 ||
        knuckles.some(([kx, ky]) => Math.hypot(px - kx, py - ky) < 2.1) ||
        toSegment(px, py, ...finger)[0] < 2.3 ||
        toSegment(px, py, ...thumb)[0] < 2.4
      )
        hand[i] = 1;
    }
  }
  return { body, hand };
}

/**
 * Paints a mask as a silhouette: near-black, with a warm rim where its edge faces the lamp; the
 * hair lets a little light through its fringe.
 */
function silhouette(d: Pixels, mask: Uint8Array) {
  const curl = (x: number, y: number) => Math.sin(x * 1.1 + Math.sin(y * 0.9) * 2.2) + Math.sin(y * 1.3 - x * 0.4);
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) {
      const m = mask[y * W + x];
      if (!m) continue;
      let ox = 0;
      let oy = 0;
      let open = 0;
      for (let j = -2; j <= 2; j++) {
        for (let k = -2; k <= 2; k++) {
          if (!j && !k) continue;
          const xx = x + k;
          const yy = y + j;
          if (xx < X0 || xx > X1 || yy < Y0 || yy > Y1) continue;
          if (!mask[yy * W + xx]) {
            const w = 1 / (j * j + k * k);
            ox += k * w;
            oy += j * w;
            open += w;
          }
        }
      }
      let v = -1;
      if (open > 0) {
        const tx = FX - x;
        const ty = FY - 6 - y;
        const tl = Math.hypot(tx, ty) || 1;
        const ol = Math.hypot(ox, oy) || 1;
        const facing = Math.max(0, (ox * tx + oy * ty) / (ol * tl));
        const lit = Math.max(0, (facing - 0.2) / 0.8);
        const ring1 = !mask[y * W + x - 1] || !mask[y * W + x + 1] || !mask[(y - 1) * W + x] || !mask[(y + 1) * W + x];
        const rim = 11.2 - tl / 70;
        if (lit > 0) v = ring1 ? rim * Math.pow(lit, 0.6) - (m === 2 ? 1.2 : 0) : (rim - 4.2) * lit - (m === 2 ? 1 : 0);
        if (m === 2 && lit > 0.2 && curl(x * 0.8, y * 1.1) > 0.5) v = Math.max(v, rim - 3.4);
        const up = Math.max(0, -oy / ol);
        if (ring1 && up > 0.45) v = Math.max(v, 3.2 + up * 1.6);
      }
      if (v > 3) paint(d, x, y, tone(BG, v, x, y));
      else paint(d, x, y, SILHOUETTE[Math.max(0, Math.min(SILHOUETTE.length - 1, Math.floor(Math.max(0, v) * 0.8 + bayer(x, y) * 1.5)))]!);
    }
  }
}

type Put = (x: number, y: number, c: Rgb) => void;

/** The quill: a gently curved shaft, an inked nib, a long vane glowing in the lamplight. */
function quill(put: Put, nib: Point) {
  const u = QUILL;
  const len = 74;
  const perp = [-u[1], u[0]] as const;
  for (let s = 0; s <= len; s += 0.35) {
    const t = s / len;
    const bend = t * t * 5;
    const cx = nib[0] + u[0] * s + perp[0] * bend;
    const cy = nib[1] + u[1] * s + perp[1] * bend;
    if (t > 0.22) {
      const vt = (t - 0.22) / 0.78;
      const w = 6 * Math.pow(Math.sin(Math.min(1, vt * 1.08) * Math.PI), 0.7);
      for (let k = -w; k <= w * 0.75; k += 0.5) {
        const px = cx + perp[0] * k - u[0] * Math.abs(k) * 0.55;
        const py = cy + perp[1] * k - u[1] * Math.abs(k) * 0.55;
        const side = k < 0 ? 1 : 0;
        const stripe = Math.floor(s * 1.1 + Math.abs(k) * 0.4) % 3 === 0 ? -1.2 : 0;
        const edge = Math.abs(k) > w - 0.9 ? 1.4 : 0;
        put(px, py, tone(FEATHER, (side ? 6.8 : 3.8) + stripe + edge + vt * 1.2, Math.round(px), Math.round(py)));
      }
    }
    put(cx, cy, s < 6 ? INK : s < 14 ? FEATHER[9]! : FEATHER[10]!);
  }
}

// The caption's chunky pixel face, only the letters it needs: rows of '#' and '.', on a 9-row body.
const FACE: Record<string, string[]> = {
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#', '.....', '.....'],
  e: ['....', '....', '.##.', '#..#', '####', '#...', '.###', '....', '....'],
  ',': ['..', '..', '..', '..', '..', '.#', '.#', '#.', '..'],
  ' ': ['..', '..', '..', '..', '..', '..', '..', '..', '..'],
  w: ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.', '.....', '.....'],
  r: ['...', '...', '#.#', '##.', '#..', '#..', '#..', '...', '...'],
  i: ['#', '.', '#', '#', '#', '#', '#', '.', '.'],
  t: ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#', '...', '...'],
  n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#', '....', '....'],
  g: ['....', '....', '.###', '#..#', '#..#', '.###', '...#', '...#', '.##.'],
  h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#', '....', '....'],
  s: ['....', '....', '.###', '#...', '.##.', '...#', '###.', '....', '....'],
};
export const CAPTION = 'me, writing this';

/** The caption's cells across the top, and the dark outline round them, the same in every frame. */
const CAPTION_CELLS = (() => {
  const K = 3;
  const gap = 1;
  const glyphs = [...CAPTION].map((ch) => FACE[ch]!);
  const width = glyphs.reduce((w, g) => w + (g[0]!.length + gap) * K, 0) - gap * K;
  const y0 = 17;
  const cells = new Set<string>();
  let cx = Math.round((W - width) / 2);
  for (const g of glyphs) {
    g.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '#') continue;
        for (let a = 0; a < K; a++) for (let b = 0; b < K + 1; b++) cells.add(`${cx + i * K + b},${y0 + j * K + a}`);
      }
    });
    cx += (g[0]!.length + gap) * K;
  }
  const letters = [...cells].map((s) => s.split(',').map(Number) as Point);
  const outline: Point[] = [];
  for (const [x, y] of letters) {
    for (let oy = -2; oy <= 2; oy++) {
      for (let ox = -2; ox <= 2; ox++) {
        if (Math.abs(ox) + Math.abs(oy) <= 3 && !cells.has(`${x + ox},${y + oy}`)) outline.push([x + ox, y + oy]);
      }
    }
  }
  return { letters, outline };
})();

/** The caption across the top, white with a dark outline, like a meme's. */
function caption(put: Put) {
  for (const [x, y] of CAPTION_CELLS.outline) put(x, y, BLACK);
  for (const [x, y] of CAPTION_CELLS.letters) put(x, y, WHITE);
}

/** Frame f of the plate, as RGBA pixels, DESK_WIDTH × DESK_HEIGHT; STILL is the still. */
export function deskFrame(f: number): Pixels {
  const P = pose(f);
  const level = Math.max(0, Math.min(4, Math.round(P.breath * 4)));
  const d: Pixels = new Uint8ClampedArray(base(level));
  const put: Put = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= X0 && y >= Y0 && x <= X1 && y <= Y1) paint(d, x, y, c);
  };
  // The flame, flickering, and a curl of smoke.
  const fh = 13 + P.flame * 1.6;
  const sway = P.flame * 0.9;
  for (let y = Math.floor(FY - fh); y <= FY + 4; y++) {
    const t = (FY + 4 - y) / (fh + 4);
    const r = 3.6 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (1 - t * 0.35);
    for (let x = Math.floor(FX - 5); x <= FX + 5; x++) {
      const o = (x - FX - sway * t * t + 0.5) / Math.max(0.6, r);
      if (Math.abs(o) > 1) continue;
      put(x, y, Math.abs(o) < 0.5 && t < 0.75 ? BG[15]! : Math.abs(o) < 0.8 ? BG[14]! : BG[12]!);
    }
  }
  for (let x = FX - 3; x <= FX + 3; x++) put(x, FY + 5, BRASS[2]!);
  for (let k = 0; k < 7; k++) {
    const age = (P.f * 0.7 + k * 7.3) % 46;
    const sx = FX + Math.sin(age * 0.19 + k * 0.7) * (1.5 + age * 0.12);
    const sy = 54 - age * 0.9;
    if (bayer(Math.round(sx), Math.round(sy)) * 46 < 40 - age) put(sx, sy, BG[age < 20 ? 5 : 4]!);
  }
  // The ink on the sheet: the lines written, and the one being written, glyph by glyph.
  LINES.forEach((L, li) => {
    const n = li < P.line ? L.glyphs.length : li > P.line ? 0 : Math.min(P.written, L.glyphs.length);
    for (let k = 0; k < n; k++) {
      const g = L.glyphs[k]!;
      g.cols.forEach((c, ci) => {
        const y = L.y0 - g.x - ci;
        put(L.col, y, INK);
        if (c.top || L.h > 2) put(L.col - 1, y, INK);
        if (c.asc || (L.h > 2 && ci === 0)) put(L.col - 2, y, INK);
      });
    }
  });
  // The writer, as one silhouette: head and hair, neck, a hunched back, the arm and hand. The
  // quill, lit by the lamp, goes between the figure and the hand.
  const lean = P.lean;
  const shoulder: Point = [300 - lean * 18, 114 + lean * 5];
  const head: Point = [270 - lean * 17, 83 + lean * 7];
  const masks = figure(shoulder, head, P);
  silhouette(d, masks.body);
  quill(put, P.nib);
  silhouette(d, masks.hand);
  caption(put);
  // The plate mark: a double rule, the inner one dotted, with a small cross at each corner.
  for (let x = 6; x <= W - 7; x++) {
    paint(d, x, 6, RULE);
    paint(d, x, H - 7, RULE);
  }
  for (let y = 6; y <= H - 7; y++) {
    paint(d, 6, y, RULE);
    paint(d, W - 7, y, RULE);
  }
  for (let x = 9; x <= W - 10; x += 3 - (x % 3)) {
    paint(d, x, 9, RULE);
    paint(d, x, H - 10, RULE);
  }
  for (let y = 9; y <= H - 10; y += 3 - (y % 3)) {
    paint(d, 9, y, RULE);
    paint(d, W - 10, y, RULE);
  }
  const petals = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]] as const;
  for (const [x, y] of [[6, 6], [W - 7, 6], [6, H - 7], [W - 7, H - 7]] as const) {
    for (const [ox, oy] of petals) paint(d, x + ox, y + oy, ox || oy ? HIBISCUS : MANGO);
  }
  return d;
}

// Draws the desk (model.ts) as a woodcut plate: a tiny software renderer (perspective, a z-buffer, a
// fixed sun) whose output is Bayer-dithered tone in each part's garden colour, cross-hatched shade,
// crisp outlines, and an id buffer that says which part each cell shows, for picking. It is pure, so
// the build draws the resting frame with it and the page draws every moving one.
import { DESK_TOP, INKS, model, type Part, type Poly, type Vec } from './model.ts';

/** Everything that moves. Each number runs from 0 to 1 and is eased as it is drawn. */
export interface DeskState {
  /** The tower turning into view on load. */
  turn: number;
  /** The side panel lifting away. */
  lift: number;
  /** Every part separating, like an assembly diagram. */
  exp: number;
  /** How far each part has slid out, by key. */
  outs: Record<string, number>;
  hover: string | null;
  sel: string | null;
  /** How far a drag has turned the view from where it rests, in radians. */
  dyaw: number;
  dpitch: number;
}

/** Where the desk rests once it has loaded: turned into view, its side panel gone. */
export const REST: DeskState = { turn: 1, lift: 1, exp: 0, outs: {}, hover: null, sel: null, dyaw: 0, dpitch: 0 };
/** Where it starts when it may move: turned away, the panel on. */
export const START: DeskState = { ...REST, turn: 0, lift: 0 };

/** A plate's size in cells, and the camera that frames the desk in it. */
interface View {
  w: number;
  h: number;
  /** The focal length, in cells. */
  f: number;
  /** The point it looks at, in millimetres. */
  target: Vec;
}

export const VIEWS = {
  /** The whole desk, for a wide screen. */
  wide: { w: 344, h: 200, f: 880, target: [-60, 200, -10] },
  /** The tower and the monitor, closer, for a phone. */
  narrow: { w: 114, h: 100, f: 470, target: [-400, 250, 40] },
} as const satisfies Record<string, View>;

export interface Frame {
  w: number;
  h: number;
  /** RGBA, one pixel per cell. */
  pixels: Uint8ClampedArray<ArrayBuffer>;
  /** Which part each cell shows, by its index in the model, or -1 for paper. */
  ids: Int16Array;
  /** Each pickable part's bounding box on the plate, in cells: [x0, y0, x1, y1]. */
  boxes: Record<string, [number, number, number, number]>;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]!;

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i]! * (1 - t) + b[i]! * t)) as RGB;

const ease = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/** A seeded random stream, so the plate is cut the same way each time. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- textures
// A face's marks, from its tag and its (u, v) in mm. 0 none, 1 dark, 2 paper, 3 the part's accent,
// 4 a hole (nothing drawn, so what is behind shows), 5 shadow, 10+k a fixed colour from FIX.

const LAP_ROWS = Array.from({ length: 40 }, (_, k) => rng(`lap${k}`)());

// The monitor shows this site: sand, the nav, a title, lines of text and a flower.
function screen(u: number, v: number, w: number, h: number): number {
  const m = 9;
  if (u < m || u > w - m || v < m + 6 || v > h - m) return 1;
  const x = u - m, y = h - m - v, W = w - 2 * m;
  if (y < 20) {
    if (y > 7 && y < 14) {
      if (x > 40 && x < 150) return 10;
      for (let k = 0; k < 6; k++) { const a = W - 330 + k * 52; if (x > a && x < a + 38) return 12; }
    }
    return 11;
  }
  if (y > 46 && y < 66 && x > 40 && x < 330) return 12;
  for (let k = 0; k < 7; k++) {
    const top = 90 + k * 26;
    if (y > top && y < top + 9) { const len = [520, 470, 500, 300, 510, 480, 260][k]!; return x > 40 && x < 40 + len ? 15 : 11; }
  }
  const fx = W - 150, fy = 160, r = Math.hypot(x - fx, y - fy);
  if (r < 12) return 16;
  if (r < 48) { const a = Math.atan2(y - fy, x - fx), k = ((a / 6.283 * 7) % 1 + 1) % 1; if (Math.abs(k - 0.5) < 0.32 * (1 - r / 60)) return 13; }
  if (Math.abs(x - fx) < 3 && y > fy + 46 && y < fy + 120) return 14;
  return 11;
}

function texture(tag: string, u: number, v: number, w: number, h: number, x: number, y: number): number {
  switch (tag) {
    case 'glass': return bay(x, y) < 9 ? 4 : (x + y * 2) % 23 === 0 ? 2 : 0;
    case 'mesh': return u % 9 < 4 && v % 9 < 4 ? 1 : 0;
    case 'grain': { if (u < 3.2) return 1; const g = Math.sin(v * 0.035 + u * 0.9) + Math.sin(v * 0.11 + u * 2.1) * 0.5; return g > 1.38 ? 1 : 0; }
    case 'wood': { const g = Math.sin(v * 0.06 + Math.sin(u * 0.004) * 4) + 0.6 * Math.sin(u * 0.013 + v * 0.02); return g > 1.3 && x & 1 ? 1 : 0; }
    case 'fins': return Math.floor(v / 9) % 2 === 0 ? 1 : 0;
    case 'fanside': return v > 4 && v < 136 && u > 4 && u < 21 ? 1 : 0;
    case 'fan': {
      const r = Math.hypot(u - 70, v - 70);
      if (r > 67) return 0;
      if (r > 62) return 1;
      if (r < 16) return r > 13 ? 1 : 0;
      const a = Math.atan2(v - 70, u - 70) + r * 0.022, k = ((a / (2 * Math.PI) * 7) % 1 + 1) % 1;
      return k < 0.2 ? 1 : 2;
    }
    case 'psu': return u > 40 && u < 120 && v > 26 && v < 62 ? (Math.floor(v) % 9 < 2 && u > 50 && u < 110 ? 1 : 2) : 0;
    case 'pcb': {
      if ((Math.floor(u / 23) + Math.floor(v / 31)) % 5 === 0 && Math.floor(v) % 6 < 2) return 1;
      return Math.floor(u) % 41 < 2 && Math.floor(v / 40) % 2 === 0 ? 1 : 0;
    }
    case 'ihs': return u > 8 && u < 32 && v > 8 && v < 32 ? 2 : 0;
    case 'pump': { const r = Math.hypot(u - 39, v - 39); return r < 25 ? (r > 21 ? 2 : r < 5 ? 3 : 1) : r > 35 ? 1 : 0; }
    case 'ram': return u > 12 && u < 60 && v > 6 && v < 26 ? 2 : Math.abs((u - 80) - (v - 17) * 0.8) < 3 ? 1 : 0;
    case 'ssd': return u > 4 && u < 48 ? 2 : Math.floor(u) % 9 < 3 ? 1 : 0;
    case 'gpuedge': return u > 190 && u < 270 && v > 18 && v < 30 ? 2 : u < 30 && v > 14 && v < 34 ? 1 : 0;
    case 'gpufans': {
      for (const c of [50, 151, 252]) {
        const r = Math.hypot(v - c, u - 58);
        if (r < 46) return r > 42 || r < 12 ? 1 : (((Math.atan2(v - c, u - 58) + r * 0.03) * 9 / 6.283) % 1 + 1) % 1 < 0.25 ? 1 : 2;
      }
      return 0;
    }
    case 'screen': return screen(u, v, w, h);
    case 'lapscreen': {
      if (u < 10 || u > w - 10 || v < 14 || v > h - 8) return 0;
      const row = Math.floor((h - 8 - v) / 13), len = 30 + LAP_ROWS[row % 40]! * 220, ind = (row % 4 === 0 ? 0 : 1 + (row % 3)) * 14;
      if ((h - 8 - v) % 13 > 6) return 10;
      return u > 18 + ind && u < 18 + ind + len ? (row % 5 === 0 ? 13 : 14) : 10;
    }
    case 'keys': {
      if (Math.hypot(u - 164, v - 104) < 6) return 3;
      if (v > 140 && v < 214 && u > 112 && u < 216) return v < 143 || v > 211 || u < 115 || u > 213 ? 1 : 0;
      if (v > 129 && v < 137 && u > 112 && u < 216) return (u > 131 && u < 134) || (u > 194 && u < 197) ? 1 : 3;
      if (v < 18 || v > 126 || u < 20 || u > 308) return 0;
      const ku = (u - 20 + Math.floor((v - 18) / 18) * 6) % 18, kv = (v - 18) % 18;
      return ku > 3 && ku < 15 && kv > 3 && kv < 15 ? 2 : 1;
    }
  }
  return 0;
}

// ---- the scene

/** A rigid transform: a 3×3 rotation, row-major, and a translation. */
interface Xf {
  r: number[];
  t: Vec;
}

const I: Xf = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };
const mul = (A: Xf, B: Xf): Xf => {
  const r: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(A.r[i * 3]! * B.r[j]! + A.r[i * 3 + 1]! * B.r[3 + j]! + A.r[i * 3 + 2]! * B.r[6 + j]!);
  return { r, t: [0, 1, 2].map((i) => A.r[i * 3]! * B.t[0] + A.r[i * 3 + 1]! * B.t[1] + A.r[i * 3 + 2]! * B.t[2] + A.t[i]!) as Vec };
};
const apply = (M: Xf, q: Vec): Vec => [0, 1, 2].map((i) => M.r[i * 3]! * q[0] + M.r[i * 3 + 1]! * q[1] + M.r[i * 3 + 2]! * q[2] + M.t[i]!) as Vec;
const turnN = (M: Xf, n: Vec): Vec => [0, 1, 2].map((i) => M.r[i * 3]! * n[0] + M.r[i * 3 + 1]! * n[1] + M.r[i * 3 + 2]! * n[2]) as Vec;

/** Each part's world transform for a state: parents first, each part offset along its slide and ex. */
function frames(st: DeskState): Record<string, Xf> {
  const out: Record<string, Xf> = {}, exp = ease(st.exp);
  const turn = -0.62 + 1.2 * ease(st.turn);
  for (const p of model.parts) {
    const P = p.parent ? out[p.parent]! : I, o = ease(st.outs[p.key] ?? 0);
    const off = [0, 1, 2].map((i) => p.origin[i]! + p.slide[i]! * o + p.ex[i]! * exp) as Vec;
    if (p.key === 'panel') {
      const a = ease(Math.min(1, st.lift * 2.2)), b = ease((st.lift - 0.3) / 0.7);
      off[0] -= 80 * a; off[1] += 260 * b;
    }
    const a = p.key === 'tower' ? turn : p.rot, c = Math.cos(a), s = Math.sin(a);
    out[p.key] = mul(P, { r: [c, 0, s, 0, 1, 0, -s, 0, c], t: off });
  }
  return out;
}

function camera(st: DeskState, view: View) {
  const yaw = -0.58 + st.dyaw, el = 0.34 + st.dpitch, T = view.target, dist = 4300;
  const C: Vec = [T[0] + dist * Math.sin(yaw) * Math.cos(el), T[1] + dist * Math.sin(el), T[2] + dist * Math.cos(yaw) * Math.cos(el)];
  const unit = (v: Vec) => { const l = Math.hypot(...v); return v.map((x) => x / l) as Vec; };
  const F = unit([T[0] - C[0], T[1] - C[1], T[2] - C[2]]);
  const R = unit([-F[2], 0, F[0]]);
  const U: Vec = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { C, F, R, U, f: view.f, cx: view.w / 2, cy: view.h / 2 - 2 };
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// The plate's paper and rules; the parts' colours come from the garden's (model.ts).
const SAND = rgb('#F1ECDF'), INK = rgb(INKS.ink), PAPER = rgb('#E6DECB'), DESK_LINE = rgb('#8C7C66'), RULE = rgb('#A99D84');
const FIX = [INKS.ink, '#EFE8D6', INKS.canopy, INKS.hibiscus, INKS.fern, '#A99D84', INKS.mango].map(rgb);
/** The sun, from the upper left and in front. */
const SUN = ((s: Vec) => { const l = Math.hypot(...s); return s.map((x) => x / l) as Vec; })([-0.42, 0.74, 0.56]);
/** The drawing keeps this many cells inside the plate's edge, within its rules. */
const IN = 9;

/** Draws the desk in a state, framed by a view. */
export function render(st: DeskState, view: View = VIEWS.wide): Frame {
  const { parts, by } = model, W = view.w, H = view.h, N = W * H;
  const zb = new Float32Array(N).fill(1e9), pid = new Int16Array(N).fill(-1), gid = new Int32Array(N).fill(-1);
  const sh = new Float32Array(N), mk = new Uint8Array(N), ori = new Uint8Array(N), pol = new Int32Array(N).fill(-1);
  const uu = new Float32Array(N), vv = new Float32Array(N);
  const plist: Poly[] = [];
  const fr = frames(st), cam = camera(st, view);
  const proj = (p: Vec) => {
    const d: Vec = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
    const z = dot(d, cam.F), x = dot(d, cam.R), y = dot(d, cam.U);
    return { x: cam.cx + cam.f * x / z, y: cam.cy - cam.f * y / z, z };
  };
  const exp = ease(st.exp);
  const hidden = (p: Part) => p.key === 'panel' && st.lift >= 0.999;
  // The panel dissolves into the paper as it lifts: more of its cells fall away.
  const glassThr = 9 + Math.round(7 * ease((st.lift - 0.3) / 0.7));

  // Shadow casters on the desk: each a box in its part's frame, with the sun turned into that frame.
  const casters = ([['case', [0, 0, -447], [215, 469, 0]], ['monitor', [-180, 112, -60], [180, 472, 30]], ['monitor', [-32, 10, -128], [32, 300, -100]], ['laptop', [-164, 0, -113], [164, 18, 113]]] as const)
    .map(([k, a, b]) => { const { r, t } = fr[k]!; return { r, t, a, b, dl: [0, 1, 2].map((j) => r[j]! * SUN[0] + r[3 + j]! * SUN[1] + r[6 + j]! * SUN[2]) }; });
  const shadowed = (wx: number, wy: number, wz: number) => {
    for (const c of casters) {
      const r = c.r, dx = wx - c.t[0], dy = wy - c.t[1], dz = wz - c.t[2];
      let t0 = 0, t1 = 1e9;
      for (let k = 0; k < 3; k++) {
        const o = r[k]! * dx + r[3 + k]! * dy + r[6 + k]! * dz, dl = c.dl[k]!;
        if (Math.abs(dl) < 1e-9) { if (o < c.a[k]! || o > c.b[k]!) { t0 = 2e9; break; } continue; }
        let ta = (c.a[k]! - o) / dl, tb = (c.b[k]! - o) / dl;
        if (ta > tb) [ta, tb] = [tb, ta];
        if (ta > t0) t0 = ta;
        if (tb < t1) t1 = tb;
        if (t0 > t1) break;
      }
      if (t0 <= t1) return true;
    }
    return false;
  };

  interface Vert { x: number; y: number; iz: number; uz: number; vz: number }
  const tri = (A: Vert, B: Vert, C: Vert, poly: Poly, glass: boolean, pk: number, o: number, shade: number, part: number) => {
    const area = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
    if (Math.abs(area) < 1e-6) return;
    const x0 = Math.max(IN, Math.floor(Math.min(A.x, B.x, C.x))), x1 = Math.min(W - 1 - IN, Math.ceil(Math.max(A.x, B.x, C.x)));
    const y0 = Math.max(IN, Math.floor(Math.min(A.y, B.y, C.y))), y1 = Math.min(H - 1 - IN, Math.ceil(Math.max(A.y, B.y, C.y)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((B.x - px) * (C.y - py) - (B.y - py) * (C.x - px)) / area;
      const w1 = ((C.x - px) * (A.y - py) - (C.y - py) * (A.x - px)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const z = 1 / (w0 * A.iz + w1 * B.iz + w2 * C.iz), i = y * W + x;
      if (z >= zb[i]!) continue;
      if (glass && bay(x, y) < glassThr) continue;
      if (poly.tag) { uu[i] = (w0 * A.uz + w1 * B.uz + w2 * C.uz) * z; vv[i] = (w0 * A.vz + w1 * B.vz + w2 * C.vz) * z; }
      pol[i] = pk; zb[i] = z; pid[i] = part; gid[i] = poly.g; sh[i] = shade; ori[i] = o;
    }
  };

  for (const p of parts) {
    if (!p.polys.length || hidden(p)) continue;
    const M = fr[p.key]!;
    for (const poly of p.polys) {
      const ex = poly.ex;
      const wpts = poly.p.map((q) => apply(M, [q[0] + ex[0] * exp, q[1] + ex[1] * exp, q[2] + ex[2] * exp]));
      const n = turnN(M, poly.n), w0 = wpts[0]!;
      if (dot(n, [cam.C[0] - w0[0], cam.C[1] - w0[1], cam.C[2] - w0[2]]) <= 0) continue;
      const shade = 0.36 + 0.64 * Math.max(0, dot(n, SUN));
      const vs = wpts.map((w, k): Vert => { const q = proj(w), uv = poly.uv[k]!; return { x: q.x, y: q.y, iz: 1 / q.z, uz: uv[0] / q.z, vz: uv[1] / q.z }; });
      if (vs.some((v) => v.iz <= 0)) continue;
      // Which way this face's hatching runs: level on tops, slanting with the face on the sides.
      const nu = dot(n, cam.U), nr = dot(n, cam.R);
      const o = Math.abs(nu) > 0.75 ? 0 : nr < 0 ? 1 : 2;
      plist.push(poly);
      for (let k = 1; k + 1 < vs.length; k++) tri(vs[0]!, vs[k]!, vs[k + 1]!, poly, poly.tag === 'glass', plist.length - 1, o, shade, p.i);
    }
  }

  // The cooler's two hoses, from the pump to the radiator's top tank, as depth-tested strokes.
  const hose = (lift: number, off: number) => {
    const pa = apply(fr.pump!, [150, 364 + off, -310 + off * 0.6]), pb = apply(fr.radiator!, [110 + off, 427, -70]);
    const pc: Vec = [(pa[0] + pb[0]) / 2, Math.max(pa[1], pb[1]) + lift, (pa[2] + pb[2]) / 2];
    let last = '';
    for (let s = 0; s <= 160; s++) {
      const t = s / 160, q = [0, 1, 2].map((k) => (1 - t) * (1 - t) * pa[k]! + 2 * (1 - t) * t * pc[k]! + t * t * pb[k]!) as Vec;
      const P = proj(q), x = Math.round(P.x), y = Math.round(P.y);
      if (last === `${x},${y}`) continue;
      last = `${x},${y}`;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        const X = x + dx, Y = y + dy, i = Y * W + X;
        if (X < IN || Y < IN || X >= W - IN || Y >= H - IN || P.z >= zb[i]! + 2) continue;
        zb[i] = P.z; pid[i] = by.pump!.i; gid[i] = 900000; sh[i] = 0.5; mk[i] = (dx + dy) % 2 ? 0 : 1;
      }
    }
  };
  hose(40, 0);
  hose(55, 18);

  // Marks, now that only the visible face of each cell is left; the desk's shadows with them.
  for (let i = 0; i < N; i++) {
    const k = pol[i]!;
    if (k < 0) continue;
    const poly = plist[k]!;
    if (!poly.tag) continue;
    const x = i % W, y = (i / W) | 0;
    let m = texture(poly.tag, uu[i]!, vv[i]!, poly.w, poly.h, x, y);
    if (poly.tag === 'wood' && shadowed(uu[i]! + DESK_TOP[0], 0, vv[i]! + DESK_TOP[2])) m = m === 1 ? 1 : 5;
    mk[i] = m;
  }

  // Compose: tone from shade, ordered-dithered across four inks of the part's colour, cross-hatched
  // where it is darkest; marks on top; then outlines where faces meet.
  const hot = st.hover ?? st.sel;
  const pals = parts.map((p) => {
    const on = p.key === hot, c = rgb(on || !p.body ? p.col : p.body);
    const dark = c[0] + c[1] + c[2] < 180, mid = dark ? mix(c, SAND, 0.42) : c;
    const lt = mix(c, SAND, on ? 0.45 : 0.68), tint = mix(c, SAND, on ? 0.72 : 0.9), dk = dark ? c : mix(c, INK, on ? 0.3 : 0.55);
    const accent = p.key === 'laptop' ? rgb(INKS.hibiscus) : p.key === 'pump' ? rgb(INKS.fern) : c;
    return { ramp: [tint, lt, on || dark ? mid : mix(c, SAND, 0.22), dk] as const, line: on ? dk : mix(c, INK, 0.7), accent, on };
  });
  const img = new Uint8ClampedArray(N * 4);
  const put = (i: number, c: RGB) => { img[i * 4] = c[0]; img[i * 4 + 1] = c[1]; img[i * 4 + 2] = c[2]; img[i * 4 + 3] = 255; };
  const grain = rng('desk-paper');
  for (let i = 0; i < N; i++) put(i, SAND);
  for (let k = 0; k < N * 0.012; k++) put(Math.floor(grain() * N), PAPER);
  const boxes: Frame['boxes'] = {};
  for (let i = 0; i < N; i++) {
    const p = pid[i]!;
    if (p < 0) continue;
    const x = i % W, y = (i / W) | 0, b = bay(x, y), part = parts[p]!, P = pals[p]!, m = mk[i]!;
    let t = part.tone + (1 - sh[i]!) * 0.66;
    if (m === 5) t += 0.42;
    if (P.on) t = 0.12 + t * 0.62;
    t = Math.max(0, Math.min(0.999, t));
    const v = t * 3, base = Math.floor(v);
    let idx = Math.min(3, base + ((v - base) * 16 > b + 0.5 ? 1 : 0));
    // Cross-hatched shade: lines that run with the face (level on tops), crossed where darkest.
    const o = ori[i], ha = o === 0 ? y * 2 : o === 1 ? x + y : x - y + 4096, hc = o === 0 ? x + y : o === 1 ? x - y + 4096 : x + y;
    if (t > 0.56 && ha % 4 === 0) idx = 3;
    if (t > 0.76 && hc % 4 === 0) idx = 3;
    let c = P.ramp[idx]!;
    if (m === 1) c = P.ramp[3];
    else if (m === 2) c = P.on ? SAND : P.ramp[0];
    else if (m === 3) c = P.accent;
    else if (m >= 10) c = FIX[m - 10]!;
    if (part.key === 'desk' && sh[i]! > 0.8) c = m === 5 ? ((x + y) % 3 === 0 ? P.ramp[2] : (x - y + 4096) % 6 === 0 ? P.ramp[1] : SAND) : m === 1 ? P.ramp[1] : SAND;
    put(i, c);
    if (part.pick) {
      const bb = (boxes[part.key] ??= [x, y, x, y]);
      if (x < bb[0]) bb[0] = x;
      if (y < bb[1]) bb[1] = y;
      if (x > bb[2]) bb[2] = x;
      if (y > bb[3]) bb[3] = y;
    }
  }
  // Outlines: a cell is inked when a neighbour belongs to another face and lies behind it (or on the
  // same part, to its right or below), so each edge is one cell wide.
  const NB = [1, W, -1, -W];
  for (let y = IN; y < H - IN; y++) for (let x = IN; x < W - IN; x++) {
    const i = y * W + x, p = pid[i]!;
    if (p < 0) continue;
    let edge = false;
    for (let n = 0; n < 4; n++) {
      const j = i + NB[n]!, q = pid[j]!;
      if (gid[j] === gid[i]) continue;
      if (q !== p) { if (q < 0 || zb[i]! <= zb[j]!) { edge = true; break; } }
      else if (n < 2 && !parts[p]!.soft && zb[i]! <= zb[j]! + 6) { edge = true; break; }
    }
    if (edge) put(i, parts[p]!.key === 'desk' ? DESK_LINE : pals[p]!.line);
  }
  // The lit part glows: a stippled ring of its light ink round its outline.
  if (hot && by[hot]) {
    const hp = by[hot].i, lt = pals[hp]!.ramp[1];
    for (let y = IN; y < H - IN; y++) for (let x = IN; x < W - IN; x++) {
      const i = y * W + x;
      if (pid[i] === hp || (x + y) % 2) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
        const j = i + dy * W + dx;
        if (pid[j] === hp && zb[j]! < zb[i]!) { near = true; break; }
      }
      if (near) put(i, lt);
    }
  }
  // Assembly lines while exploded: a dotted rule from where each part sits to where it has gone.
  if (exp > 0.02) {
    const home = frames({ ...st, exp: 0 });
    for (const p of parts) {
      const first = p.polys[0];
      if (!p.pick || p.ex.every((v) => v === 0) || !first || hidden(p)) continue;
      const c: Vec = [0, 0, 0];
      for (const q of first.p) for (let k = 0; k < 3; k++) c[k as 0 | 1 | 2] += q[k]! / first.p.length;
      const a = proj(apply(home[p.key]!, c)), b = proj(apply(fr[p.key]!, c));
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (let s = 0; s <= n; s += 2) {
        const x = Math.round(a.x + (b.x - a.x) * s / n), y = Math.round(a.y + (b.y - a.y) * s / n), z = a.z + (b.z - a.z) * s / n;
        if (x < IN || y < IN || x >= W - IN || y >= H - IN) continue;
        const i = y * W + x, q = pid[i]!;
        if (q < 0 || zb[i]! > z - 4 || q === by.desk!.i) put(i, DESK_LINE);
      }
    }
  }
  // The plate mark: a double rule, the inner one dotted, and a small bloom in each corner.
  const m1 = 3, m2 = 6;
  const set = (x: number, y: number, c: RGB) => put(y * W + x, c);
  for (let x = m1; x < W - m1; x++) { set(x, m1, RULE); set(x, H - 1 - m1, RULE); }
  for (let y = m1; y < H - m1; y++) { set(m1, y, RULE); set(W - 1 - m1, y, RULE); }
  for (let x = m2; x < W - m2; x += 2) { set(x, m2, RULE); set(x, H - 1 - m2, RULE); }
  for (let y = m2; y < H - m2; y += 2) { set(m2, y, RULE); set(W - 1 - m2, y, RULE); }
  for (const [cx, cy] of [[m1, m1], [W - 1 - m1, m1], [m1, H - 1 - m1], [W - 1 - m1, H - 1 - m1]] as const)
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) set(cx + dx, cy + dy, rgb(dx || dy ? INKS.hibiscus : INKS.mango));

  return { w: W, h: H, pixels: img, ids: pid, boxes };
}

/** The key of the pickable part a frame shows at a cell, if any. */
export function partAt(frame: Frame, x: number, y: number): string | null {
  if (x < 0 || y < 0 || x >= frame.w || y >= frame.h) return null;
  const part = model.parts[frame.ids[y * frame.w + x]!];
  return part?.pick ? part.key : null;
}

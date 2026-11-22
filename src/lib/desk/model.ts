// My desk as a small 3D model: every part a few boxes and cylinders in millimetres, in its parent's
// frame. The tower's parts are authored in the case's corner frame: x 0 (open side) .. 215
// (motherboard side), y up from the floor, z 0 (front) .. -447 (back). Each part has a slide (where a
// click moves it) and an ex (where the exploded view moves it), both along its own axis in its
// parent's frame. render.ts draws it; nothing here knows about pixels.

export type Vec = [number, number, number];

/** The garden's colours a part is inked in, as garden.css names them. */
type Ink = 'ink' | 'earth' | 'bark' | 'moss' | 'fern' | 'canopy' | 'river' | 'lagoon' | 'mango' | 'hibiscus' | 'orchid' | 'rose';

export const INKS: Record<Ink, string> = {
  ink: '#1F2B23', earth: '#7A5C42', bark: '#5C4636', moss: '#5E8E4A', fern: '#3F8A52', canopy: '#2B7349', river: '#1D5A8F',
  lagoon: '#2A7099', mango: '#A87400', hibiscus: '#C24E39', orchid: '#8A4F98', rose: '#B5476E',
};

/** A face of the model, in its part's frame, with its texture coordinates in millimetres. */
export interface Poly {
  p: Vec[];
  uv: [number, number][];
  n: Vec;
  /** The texture its marks are cut from, or null for plain tone. */
  tag: string | null;
  w: number;
  h: number;
  /** Faces in one smoothing group share an outline id, so no edge is inked between them. */
  g: number;
  /** How far this face moves on its own when the desk is exploded. */
  ex: Vec;
}

export interface Part {
  key: string;
  i: number;
  parent: string | null;
  origin: Vec;
  /** Its turn about the vertical, in radians. */
  rot: number;
  slide: Vec;
  ex: Vec;
  /** How dark it is cut, 0 (paper) to 1. */
  tone: number;
  /** Whether hovering or clicking it does anything. */
  pick: boolean;
  /** The garden colour it is lit in, and its hex (the desk's own wood has no garden colour). */
  ink: Ink;
  col: string;
  /** The colour it wears at rest, when not its lit colour. */
  body?: string;
  /** Soft parts ink no outlines between their own faces. */
  soft?: boolean;
  polys: Poly[];
}

interface PrimBase {
  tex?: Record<string, string>;
  ex?: Vec;
  rx?: number;
  ry?: number;
  at?: Vec;
  grp?: string;
  uOff?: number;
  uTot?: number;
}
interface Box extends PrimBase {
  t: 'box';
  a: Vec;
  b: Vec;
}
interface Cyl extends PrimBase {
  t: 'cyl';
  axis: 0 | 1 | 2;
  c: Vec;
  r: number;
  l0: number;
  l1: number;
  n: number;
}
type Prim = Box | Cyl;

interface Model {
  parts: Part[];
  by: Record<string, Part>;
}

function rotate(q: Vec, pr: PrimBase, at = pr.at ?? [0, 0, 0]): Vec {
  let [x, y, z] = q;
  if (pr.rx) { const c = Math.cos(pr.rx), s = Math.sin(pr.rx); [y, z] = [y * c - z * s, y * s + z * c]; }
  if (pr.ry) { const c = Math.cos(pr.ry), s = Math.sin(pr.ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
  return [x + at[0], y + at[1], z + at[2]];
}

/** The desk top's corner, where the wood's texture starts. */
export const DESK_TOP: Vec = [-820, 0, -540];

function build(): Model {
  const parts: Part[] = [], by: Record<string, Part> = {}, prims = new Map<Part, Prim[]>();
  const part = (key: string, o: Partial<Omit<Part, 'key' | 'i' | 'polys'>> & { ink?: Ink; bodyInk?: Ink }): Part => {
    const { ink = 'ink', bodyInk, ...rest } = o;
    const p: Part = {
      key, i: parts.length, parent: null, origin: [0, 0, 0], rot: 0, slide: [0, 0, 0], ex: [0, 0, 0], tone: 0.3, pick: true,
      ink, col: INKS[ink], ...(bodyInk ? { body: INKS[bodyInk] } : {}), polys: [], ...rest,
    };
    parts.push(p); by[key] = p; prims.set(p, []);
    return p;
  };
  const box = (p: Part, a: Vec, b: Vec, o: PrimBase = {}) => prims.get(p)!.push({ t: 'box', a, b, ...o });
  const cyl = (p: Part, axis: 0 | 1 | 2, c: Vec, r: number, l0: number, l1: number, o: PrimBase = {}) =>
    prims.get(p)!.push({ t: 'cyl', axis, c, r, l0, l1, n: 20, ...o });
  const TO: Vec = [-107.5, 0, 223.5];

  const desk = part('desk', { pick: false, col: '#A88B6A', tone: 0.02 });
  box(desk, [DESK_TOP[0], -40, DESK_TOP[2]], [860, 0, 340], { tex: { py: 'wood' } });

  part('tower', { pick: false, origin: [-500, 0, 60] });

  // The case: walls round an open left side, a shroud over the PSU, a mesh top.
  const cs = part('case', { parent: 'tower', origin: TO, tone: 0.22 });
  for (const [x, z] of [[10, -40], [175, -40], [10, -437], [175, -437]] as const) box(cs, [x, 0, z], [x + 30, 12, z + 30]);
  box(cs, [0, 12, -447], [215, 20, 0]);
  box(cs, [0, 461, -447], [215, 469, 0], { tex: { py: 'mesh' }, ex: [0, 120, 0] });
  box(cs, [207, 20, -447], [215, 461, -22], { ex: [170, 0, 0] });
  box(cs, [0, 20, -447], [207, 461, -439], { ex: [0, 0, -150] });
  box(cs, [0, 12, -22], [8, 469, 0]);
  box(cs, [207, 12, -22], [215, 469, 0], { ex: [170, 0, 0] });
  box(cs, [8, 12, -22], [207, 26, 0]);
  box(cs, [8, 455, -22], [207, 469, 0], { ex: [0, 120, 0] });
  box(cs, [8, 108, -439], [207, 114, -22]);

  // The side panel, tinted glass: drawn as a screen door, so the inside shows through it.
  const sp = part('panel', { parent: 'tower', origin: TO, tone: 0.62 });
  const glass = Object.fromEntries(['nx', 'px', 'py', 'ny', 'pz', 'nz'].map((f) => [f, 'glass']));
  box(sp, [-5, 13, -446], [0, 468, -1], { tex: glass });

  // The walnut front: a dark mesh behind its slats.
  const fr = part('front', { parent: 'tower', origin: TO, ink: 'earth', tone: 0.18, soft: true, slide: [0, 0, 150], ex: [90, 0, 230] });
  box(fr, [8, 26, -20], [207, 455, -14], { tex: { pz: 'mesh' } });
  for (let i = 0; i < 10; i++) { const x = 10 + i * 19.8; box(fr, [x, 30, -14], [x + 14.5, 451, 0], { tex: { pz: 'grain' } }); }

  // The cooler's radiator at the front, its two fans pushing through it.
  const rad = part('radiator', { parent: 'tower', origin: TO, ink: 'mango', slide: [-230, 0, 0], ex: [-110, 20, 190] });
  box(rad, [36, 112, -84], [179, 427, -56], { tex: { nx: 'fins', px: 'fins' } });
  box(rad, [37.5, 128, -56], [177.5, 268, -31], { tex: { pz: 'fan', nz: 'fan', nx: 'fanside' }, ex: [0, 0, 70] });
  box(rad, [37.5, 270, -56], [177.5, 410, -31], { tex: { pz: 'fan', nz: 'fan', nx: 'fanside' }, ex: [0, 0, 70] });

  const psu = part('psu', { parent: 'tower', origin: TO, ink: 'bark', tone: 0.38, slide: [-200, 0, 0], ex: [-210, 0, 0] });
  box(psu, [32, 21, -438], [182, 107, -278], { tex: { nx: 'psu' } });

  // The motherboard carries the CPU (which carries the pump), the RAM, the SSD and the GPU.
  const mb = part('mobo', { parent: 'tower', origin: TO, ink: 'moss', slide: [-50, 0, 0], ex: [90, 0, 0] });
  box(mb, [192, 134, -431], [196, 439, -187], { tex: { nx: 'pcb' } });
  box(mb, [174, 322, -430], [192, 437, -402]);
  box(mb, [178, 414, -402], [192, 434, -330]);
  box(mb, [184, 150, -262], [192, 196, -206]);

  const cpu = part('cpu', { parent: 'mobo', ink: 'rose', tone: 0.2, slide: [-70, 0, 0], ex: [-80, 0, 0] });
  box(cpu, [186, 344, -330], [192, 384, -290], { tex: { nx: 'ihs' } });
  const pump = part('pump', { parent: 'cpu', ink: 'mango', tone: 0.34, slide: [-110, 0, 0], ex: [-130, 0, 0] });
  cyl(pump, 0, [0, 364, -310], 39, 142, 186, { tex: { cap0: 'pump' } });

  const ram = part('ram', { parent: 'mobo', ink: 'orchid', slide: [-90, 0, 0], ex: [-110, 0, 0] });
  box(ram, [158, 300, -254], [192, 433, -247], { tex: { nz: 'ram', pz: 'ram' } });
  box(ram, [158, 300, -238], [192, 433, -231], { tex: { nz: 'ram', pz: 'ram' } });

  const ssd = part('ssd', { parent: 'mobo', ink: 'river', slide: [-60, 0, 0], ex: [-60, 0, 0] });
  box(ssd, [188.5, 262, -334], [192, 284, -254], { tex: { nx: 'ssd' } });

  const gpu = part('gpu', { parent: 'mobo', ink: 'lagoon', tone: 0.32, slide: [-170, 0, 0], ex: [-210, -10, 0] });
  box(gpu, [76, 202, -440], [192, 250, -137], { tex: { nx: 'gpuedge', ny: 'gpufans' } });
  box(gpu, [76, 250, -440], [192, 254, -139]);

  // The monitor: a 34-inch panel on an 1500R curve, in eleven segments, on its stand.
  const mon = part('monitor', { origin: [190, 0, -330], ink: 'canopy', bodyInk: 'ink', slide: [0, 0, 90] });
  box(mon, [-150, 0, -140], [150, 10, 70]);
  box(mon, [-32, 10, -128], [32, 300, -100]);
  box(mon, [-170, 180, -100], [170, 330, -52]);
  const R = 1500, half = 403, N = 11, ang = half / R;
  for (let i = 0; i < N; i++) {
    const th = -ang + (2 * ang) * (i + 0.5) / N, cw = 2 * R * Math.sin(ang / N) + 1.5;
    box(mon, [-cw / 2, 0, -24], [cw / 2, 360, 0], {
      ry: -th, at: [R * Math.sin(th), 112, R * (1 - Math.cos(th))], grp: 'scr', uOff: i * (cw - 1.5), uTot: N * (cw - 1.5), tex: { pz: 'screen' },
    });
  }

  // The ThinkPad, open at an easy angle.
  const lap = part('laptop', { origin: [560, 0, 120], rot: -0.32, ink: 'hibiscus', bodyInk: 'ink', slide: [0, 0, 90] });
  box(lap, [-164, 0, -113], [164, 18, 113], { tex: { py: 'keys' } });
  box(lap, [-164, 0, -6], [164, 215, 0], { rx: -0.3, at: [0, 18, -110], tex: { pz: 'lapscreen' } });

  // Polygons, built once in each part's frame.
  let gid = 0;
  const groups: Record<string, number> = {};
  for (const p of parts) {
    const own = prims.get(p)!;
    own.forEach((pr, k) => {
      const tex = pr.tex ?? {}, ex = pr.ex ?? [0, 0, 0];
      const add = (pts: Vec[], uv: [number, number][], n: Vec, face: string, w: number, h: number, smooth: boolean) => {
        let g: number;
        if (smooth || pr.grp) {
          const id = `${p.key}:${pr.grp ?? ''}:${face}:${smooth ? k : ''}`;
          g = groups[id] ??= gid++;
        } else g = gid++;
        p.polys.push({ p: pts.map((q) => rotate(q, pr)), uv, n: rotate(n, pr, [0, 0, 0]), tag: tex[face] ?? null, w, h, g, ex });
      };
      if (pr.t === 'box') {
        const { a, b } = pr, uo = pr.uOff ?? 0;
        // [face, fixed axis, value, u axis, v axis, normal sign]
        const faces = [['px', 0, b[0], 2, 1, 1], ['nx', 0, a[0], 2, 1, -1], ['py', 1, b[1], 0, 2, 1], ['ny', 1, a[1], 0, 2, -1], ['pz', 2, b[2], 0, 1, 1], ['nz', 2, a[2], 0, 1, -1]] as const;
        for (const [face, ax, val, ua, va, sg] of faces) {
          const corner = (ui: number, vi: number): Vec => { const q: Vec = [0, 0, 0]; q[ax] = val; q[ua] = ui ? b[ua] : a[ua]; q[va] = vi ? b[va] : a[va]; return q; };
          const n: Vec = [0, 0, 0]; n[ax] = sg;
          const w = b[ua] - a[ua], h = b[va] - a[va];
          add([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)], [[uo, 0], [uo + w, 0], [uo + w, h], [uo, h]], n, face, pr.uTot ?? w, h, false);
        }
      } else {
        // A cylinder along x, y or z: two caps and a smooth side.
        const ax = pr.axis, o1 = ((ax + 1) % 3) as 0 | 1 | 2, o2 = ((ax + 2) % 3) as 0 | 1 | 2, { n, r } = pr;
        const at = (l: number, j: number): Vec => { const q: Vec = [...pr.c]; q[ax] = l; q[o1] += r * Math.cos(2 * Math.PI * j / n); q[o2] += r * Math.sin(2 * Math.PI * j / n); return q; };
        for (const [l, s, face] of [[pr.l0, -1, 'cap0'], [pr.l1, 1, 'cap1']] as const) {
          const pts: Vec[] = [], uv: [number, number][] = [];
          for (let j = 0; j < n; j++) { pts.push(at(l, j)); uv.push([r + r * Math.cos(2 * Math.PI * j / n), r + r * Math.sin(2 * Math.PI * j / n)]); }
          const nn: Vec = [0, 0, 0]; nn[ax] = s;
          add(pts, uv, nn, face, 2 * r, 2 * r, false);
        }
        for (let j = 0; j < n; j++) {
          const nn: Vec = [0, 0, 0], m = (j + 0.5) / n * 2 * Math.PI; nn[o1] = Math.cos(m); nn[o2] = Math.sin(m);
          add([at(pr.l0, j), at(pr.l0, j + 1), at(pr.l1, j + 1), at(pr.l1, j)], [[0, 0], [1, 0], [1, 1], [0, 1]], nn, 'side', 1, 1, true);
        }
      }
    });
  }
  return { parts, by };
}

export const model: Model = build();

/** What a part is, for its caption, the parts list and its card. */
interface PartInfo {
  key: string;
  name: string;
  model: string;
  spec: string;
  /** A line I write about it, shown on its card once written. */
  line?: string;
}

/** The parts in the order the list numbers them. The side panel is not among them: clicking it lifts it away. */
export const PARTS: readonly PartInfo[] = [
  { key: 'case', name: 'Case', model: 'Fractal Design North, Charcoal Black', spec: 'mid-tower · 469 × 215 × 447 mm' },
  { key: 'front', name: 'Walnut front', model: 'Fractal Design North', spec: 'walnut slats over a mesh' },
  { key: 'radiator', name: 'Radiator & fans', model: 'NZXT Kraken Plus 280', spec: '280 mm radiator · 2 × 140 mm fans, front' },
  { key: 'pump', name: 'Pump head', model: 'NZXT Kraken Plus 280', spec: 'on the CPU' },
  { key: 'cpu', name: 'CPU', model: 'AMD Ryzen 7 9800X3D', spec: 'under the pump' },
  { key: 'mobo', name: 'Motherboard', model: 'ASUS B650E MAX GAMING WIFI', spec: 'ATX' },
  { key: 'ram', name: 'Memory', model: 'Kingston FURY Beast Black', spec: '2 × 16 GB · DDR5-6000 CL30' },
  { key: 'ssd', name: 'SSD', model: 'Samsung 990 EVO Plus', spec: '2 TB · M.2' },
  { key: 'gpu', name: 'Graphics card', model: 'MSI GeForce RTX 5070 Ti 16G Ventus 3X OC', spec: '303 mm · three fans' },
  { key: 'psu', name: 'Power supply', model: 'Corsair RM850x', spec: 'ATX 3.1 · 850 W' },
  { key: 'monitor', name: 'Monitor', model: 'GIGABYTE G34WQC2', spec: '34" ultrawide · curved' },
  { key: 'laptop', name: 'Laptop', model: 'Lenovo ThinkPad P14s Gen 2a', spec: '14" · the red TrackPoint' },
];

/** The side panel's name for its caption. */
export const PANEL = 'Side panel';

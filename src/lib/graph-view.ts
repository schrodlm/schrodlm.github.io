// The garden map, the graph view of the whole garden at /graph/: every note as its flower's head,
// the better linked the bigger, laid out once at build time, so the same garden always draws the
// same plate. Ported to braille from the chosen woodcut prototype ("W · woodcut map, refined").
//
// - Each group of linked notes is laid out on its own by a small force layout (Fruchterman and
//   Reingold's): links pull, every note pushes, and the better linked a note, the harder it is
//   drawn to the middle, so hubs sit at the centre of their group with their neighbours in rings
//   round them. It is seeded from the group's own notes and runs a fixed number of rounds, so it
//   is deterministic. Then the heads are eased apart until none touch.
// - The groups are packed onto the plate as tightly as they go, the largest first, in its middle.
// - The wildflowers, linked with nothing, stand on their own stems in a bed along the plate's foot.
// - At rest only the strongest vines are drawn: for each group, the tree that joins all its notes
//   through the best-linked pairs. The other links stay hidden until a note at either end is
//   hovered, which brings all its vines up (the page does that, from the layers drawn here).
import { blade, createCanvas, encode, line, type DotCanvas, type Point, type Row } from './braille';
import type { LinkGraph } from './graph';
import { box, frame, vineDots } from './neighbourhood';
import { rng } from './random';

/** The widest plate, in cells: 8 px each across the page's wide frame. */
export const PLATE_WIDTH = 130;
/** A cell's width and a row's height in px. The plate never scales, it scrolls. */
export const CELL = 8;
export const ROW = 2 * CELL;

// A head's size in rows by how many notes it is linked with: at least this many, this big.
const TIERS = [
  [12, 4],
  [6, 3],
  [3, 2],
  [0, 1],
] as const;

/** A note's head size in rows, by how many notes it is linked with. */
export function headSize(degree: number): number {
  return TIERS.find(([least]) => degree >= least)![1];
}

/** A note on the plate. */
export interface Flower {
  slug: string;
  /** Its head's top-left cell. */
  cell: Point;
  /** Its head's size in rows; it is twice as many cells across. */
  size: number;
  /** How many notes it is linked with. */
  degree: number;
  /** Linked with nothing, it stands in the wildflowers' bed on a stem of its own. */
  wild: boolean;
  /** A hub: the best-linked note of its group, or one of the biggest heads. Captioned at rest. */
  hub: boolean;
}

/** A link between two notes, whichever way it runs, by their slugs in order. */
export interface Vine {
  ends: readonly [string, string];
  /** Among the strongest, drawn at rest. */
  strong: boolean;
}

export interface GardenLayout {
  /** The plate's size in cells and rows. */
  width: number;
  height: number;
  /** Every note, in slug order. */
  flowers: Flower[];
  /** Every link once, in order of its ends. */
  vines: Vine[];
  /** The row the wildflowers' bed starts at, its name on it and its flowers below; none without wildflowers. */
  bed: number | undefined;
}

// Everything below is measured in dots, which are square: a cell is 2 across and 4 down.
// The least room between the plate's frame and a head.
const EDGE = 8;
// A group of n notes is first laid out in a box SIDE·√n dots tall and ASPECT times as wide.
const SIDE = 15;
const ASPECT = 1.2;
const ROUNDS = 500;
const SPREAD = 0.8;
const GRAVITY = 0.5;
// Two heads stand apart by their half-diagonals, this much room, and a little more for every link
// either has, so a hub's ring has space for its vines.
const ROOM = 4;
const LEAN = 0.8;
// Heads then snap to whole cells, which can bring two up to 4 dots nearer; this much more room
// still leaves the vine between two of the smallest a dot or two to show.
const SNAP = 2;
const RELAX_ROUNDS = 400;
// Groups stand this far apart, and are packed on a grid this fine.
const GROUP_GAP = 12;
const STEP = 2;
// A wildflower's slot across the bed, in cells, and its height with its stem, in rows.
const WILD_SLOT = 10;
const WILD_ROWS = 4;
// The smallest plate, in cells and rows, for a garden of a few notes or none.
const LEAST_WIDTH = 40;
const LEAST_HEIGHT = 8;

/** Every link once, whichever way it runs, each marked whether it is among the strongest. */
export function gardenVines(graph: LinkGraph): Vine[] {
  // The notes and each one's neighbours come in slug order, so the pairs come in order of their ends.
  const all = graph.notes.flatMap((a) => graph.neighbours(a).flatMap((b) => (a < b ? [[a, b] as const] : [])));
  // The strongest: for each group, the tree through its best-linked pairs (Kruskal's, heaviest
  // first; the sort is stable, so ties keep the order of their ends).
  const weight = ([a, b]: readonly [string, string]) => graph.degree(a) * graph.degree(b);
  const parent = new Map<string, string>();
  const root = (slug: string): string => {
    let at = slug;
    while (parent.has(at)) at = parent.get(at)!;
    if (at !== slug) parent.set(slug, at);
    return at;
  };
  const strong = new Set<readonly [string, string]>();
  for (const ends of [...all].sort((x, y) => weight(y) - weight(x))) {
    const [ra, rb] = [root(ends[0]), root(ends[1])];
    if (ra === rb) continue;
    parent.set(ra, rb);
    strong.add(ends);
  }
  return all.map((ends) => ({ ends, strong: strong.has(ends) }));
}

/** The groups of linked notes, each in slug order, the largest first. */
function groups(graph: LinkGraph): string[][] {
  const seen = new Set<string>();
  const found: string[][] = [];
  for (const start of graph.notes) {
    if (seen.has(start) || graph.degree(start) === 0) continue;
    const group: string[] = [];
    const todo = [start];
    seen.add(start);
    while (todo.length) {
      const at = todo.pop()!;
      group.push(at);
      for (const next of graph.neighbours(at)) {
        if (!seen.has(next)) {
          seen.add(next);
          todo.push(next);
        }
      }
    }
    found.push(group.sort());
  }
  return found.sort((a, b) => b.length - a.length || (a[0]! < b[0]! ? -1 : 1));
}

type Spot = [x: number, y: number];

/**
 * Lays out one group within `room` dots across: the force layout, then the heads eased apart. Its
 * heads' centres come back with the group's top-left corner, heads included, at (0, 0), and the
 * box they take.
 */
function layGroup(group: string[], vines: Vine[], degree: (slug: string) => number, room: number): { centres: Spot[]; box: Size } {
  const n = group.length;
  const index = new Map(group.map((slug, i) => [slug, i]));
  const springs = vines
    .filter((v) => index.has(v.ends[0]))
    .map((v) => [index.get(v.ends[0])!, index.get(v.ends[1])!, v.strong ? 1 : 0.8] as const);
  const deg = group.map(degree);
  const half = deg.map((d) => 2 * headSize(d));

  const height = Math.min(SIDE * Math.sqrt(n), room / ASPECT);
  const width = height * ASPECT;
  const random = rng(`garden:${group[0]}`);
  const pos: Spot[] = group.map(() => [(0.2 + 0.6 * random()) * width, (0.2 + 0.6 * random()) * height]);
  const k = SPREAD * Math.sqrt((width * height) / n);
  let temp = width / 8;
  for (let round = 0; round < ROUNDS; round++) {
    const move: Spot[] = group.map(() => [0, 0]);
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const [dx, dy, d] = apart(pos[a]!, pos[b]!);
        const f = (k * k) / d;
        push(move[a]!, dx / d * f, dy / d * f);
        push(move[b]!, -dx / d * f, -dy / d * f);
      }
    }
    for (const [a, b, pull] of springs) {
      const [dx, dy, d] = apart(pos[a]!, pos[b]!);
      const f = ((d * d) / k) * pull;
      push(move[a]!, -dx / d * f, -dy / d * f);
      push(move[b]!, dx / d * f, dy / d * f);
    }
    for (let a = 0; a < n; a++) {
      const p = pos[a]!;
      const m = move[a]!;
      // The better linked, the harder drawn to the middle: hubs settle there, leaves round them.
      const g = GRAVITY * (1 + deg[a]! / 3);
      push(m, (width / 2 - p[0]) * g, (height / 2 - p[1]) * g);
      const d = Math.hypot(m[0], m[1]) || 0.01;
      push(p, (m[0] / d) * Math.min(d, temp), (m[1] / d) * Math.min(d, temp));
    }
    temp *= 0.99;
  }

  // Fit the layout to its box, keeping its shape.
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  const scale = Math.min(width / Math.max(1, Math.max(...xs) - Math.min(...xs)), height / Math.max(1, Math.max(...ys) - Math.min(...ys)));
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  for (const p of pos) {
    p[0] = (p[0] - x0) * scale;
    p[1] = (p[1] - y0) * scale;
  }

  // Ease the heads apart until none is nearer another than their room, staying within `room`
  // across.
  const need = (a: number, b: number) => Math.SQRT2 * (half[a]! + half[b]!) + ROOM + SNAP + LEAN * (Math.sqrt(deg[a]!) + Math.sqrt(deg[b]!));
  for (let round = 0; round < RELAX_ROUNDS; round++) {
    let moved = false;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const [dx, dy, d] = apart(pos[a]!, pos[b]!);
        const gap = need(a, b);
        if (d >= gap) continue;
        const by = (gap - d) / 2;
        push(pos[a]!, (dx / d) * by, (dy / d) * by);
        push(pos[b]!, (-dx / d) * by, (-dy / d) * by);
        moved = true;
      }
    }
    pos.forEach((p, a) => (p[0] = Math.min(Math.max(p[0], half[a]!), room - half[a]!)));
    if (!moved) break;
  }

  const left = Math.min(...pos.map((p, a) => p[0] - half[a]!));
  const top = Math.min(...pos.map((p, a) => p[1] - half[a]!));
  const centres = pos.map(([x, y]): Spot => [x - left, y - top]);
  return {
    centres,
    box: { w: Math.max(...centres.map((c, a) => c[0] + half[a]!)), h: Math.max(...centres.map((c, a) => c[1] + half[a]!)) },
  };
}

// The offset from b to a, and the distance, never quite 0, so two notes in one spot part sideways.
function apart(a: Spot, b: Spot): [dx: number, dy: number, d: number] {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const d = Math.hypot(dx, dy);
  return d < 0.01 ? [0.01, 0, 0.01] : [dx, dy, d];
}

function push(p: Spot, dx: number, dy: number): void {
  p[0] += dx;
  p[1] += dy;
}

interface Size {
  w: number;
  h: number;
}

/**
 * Packs boxes into `width` dots across, the first first, each where it grows the packing least
 * without coming within GROUP_GAP of one already placed, and then as near its middle as it can.
 * Returns each one's top-left corner, the packing cropped to start at (0, 0), and its width.
 */
function pack(boxes: Size[], width: number): { corners: Spot[]; width: number } {
  if (boxes.length === 0) return { corners: [], width: 0 };
  const area = boxes.reduce((sum, b) => sum + (b.w + GROUP_GAP) * (b.h + GROUP_GAP), 0);
  let height = Math.max(...boxes.map((b) => b.h), Math.ceil((area / width) * 1.3));
  for (;;) {
    const placed = tryPack(boxes, width, height);
    if (placed) {
      const top = Math.min(...placed.map((p) => p[1]));
      const left = Math.min(...placed.map((p) => p[0]));
      const right = Math.max(...placed.map((p, i) => p[0] + boxes[i]!.w));
      return { corners: placed.map(([x, y]) => [x - left, y - top]), width: right - left };
    }
    height = Math.ceil(height * 1.15);
  }
}

function tryPack(boxes: Size[], width: number, height: number): Spot[] | undefined {
  const placed: [x0: number, y0: number, x1: number, y1: number][] = [];
  // The packing so far, which each box grows as little as it can.
  let all = [Infinity, Infinity, -Infinity, -Infinity] as const;
  for (const { w, h } of boxes) {
    let best: [grown: number, d: number, x: number, y: number] | undefined;
    for (let y = 0; y + h <= height; y += STEP) {
      for (let x = 0; x + w <= width; x += STEP) {
        const clash = placed.some(([x0, y0, x1, y1]) => x < x1 + GROUP_GAP && x + w + GROUP_GAP > x0 && y < y1 + GROUP_GAP && y + h + GROUP_GAP > y0);
        if (clash) continue;
        const grown = (Math.max(all[2], x + w) - Math.min(all[0], x)) * (Math.max(all[3], y + h) - Math.min(all[1], y));
        const d = Math.hypot(x + w / 2 - width / 2, y + h / 2 - height / 2);
        if (!best || grown < best[0] || (grown === best[0] && d < best[1])) best = [grown, d, x, y];
      }
    }
    if (!best) return undefined;
    const [, , x, y] = best;
    placed.push([x, y, x + w, y + h]);
    all = [Math.min(all[0], x), Math.min(all[1], y), Math.max(all[2], x + w), Math.max(all[3], y + h)];
  }
  return placed.map(([x, y]) => [x, y]);
}

/** Lays out the whole garden from its link graph. */
export function layGarden(graph: LinkGraph): GardenLayout {
  const vines = gardenVines(graph);
  const room = PLATE_WIDTH * 2 - 2 * EDGE;
  const laid = groups(graph).map((group) => ({ group, ...layGroup(group, vines, graph.degree, room) }));
  const packed = pack(
    laid.map((l) => l.box),
    room,
  );

  // The plate is as wide as the groups and the wildflowers' bed need, up to the page's frame, so a
  // small garden stays small enough to see whole on a phone.
  const wild = graph.notes.filter((slug) => graph.degree(slug) === 0);
  const across = Math.max(1, Math.min(wild.length, Math.floor((PLATE_WIDTH - 4) / WILD_SLOT)));
  const width = Math.min(PLATE_WIDTH, Math.max(LEAST_WIDTH, Math.ceil(packed.width / 2) + EDGE, across * WILD_SLOT + 4));
  const left = Math.floor((width * 2 - packed.width) / 2);

  const flowers = new Map<string, Flower>();
  let bottom = 0;
  laid.forEach(({ group, centres, box }, g) => {
    const [x, y] = packed.corners[g]!;
    bottom = Math.max(bottom, EDGE + y + box.h);
    // The best-linked note of a group of several is its hub, as is any of the biggest heads.
    const lead = group.length >= 4 ? [...group].sort((a, b) => graph.degree(b) - graph.degree(a))[0] : undefined;
    group.forEach((slug, i) => {
      const degree = graph.degree(slug);
      const size = headSize(degree);
      const [cx, cy] = centres[i]!;
      const cell: Point = [Math.round((left + x + cx - 2 * size) / 2), Math.round((EDGE + y + cy - 2 * size) / 4)];
      flowers.set(slug, { slug, cell, size, degree, wild: false, hub: slug === lead || size >= 3 });
    });
  });

  // The wildflowers' bed, below the groups: its name on its first row, then rows of wildflowers.
  const top = laid.length ? Math.ceil(bottom / 4) + 2 : 1;
  const bed = wild.length ? top : undefined;
  wild.forEach((slug, i) => {
    const row = Math.floor(i / across);
    const inRow = Math.min(across, wild.length - row * across);
    const start = Math.floor((width - inRow * WILD_SLOT) / 2) + WILD_SLOT / 2 - 1;
    const cell: Point = [start + (i % across) * WILD_SLOT, top + 1 + row * WILD_ROWS];
    flowers.set(slug, { slug, cell, size: 1, degree: 0, wild: true, hub: false });
  });

  const height = bed !== undefined ? bed + 1 + Math.ceil(wild.length / across) * WILD_ROWS : Math.ceil((bottom + EDGE) / 4);
  return {
    width,
    height: Math.max(LEAST_HEIGHT, height),
    flowers: graph.notes.map((slug) => flowers.get(slug)!),
    vines,
    bed,
  };
}

/** A box on the plate. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Whether two boxes overlap. */
export const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** The box a flower takes on the plate, in cells and rows: its head, and a wildflower's stem below it. */
export function footprint(f: Flower): Rect {
  return { x: f.cell[0], y: f.cell[1], w: f.size * 2, h: f.wild ? WILD_ROWS - 1 : f.size };
}

// Captions are 11 px Plex Mono, whose characters are 0.6 em across but are set a whole 7 px apart,
// padded either side, with a pixel to spare either side; a long title is cut short.
const CAPTION = { char: 7, pad: 3, height: 14, longest: 34 } as const;

/** Where a note's caption stands, in px from the plate's top-left corner. */
export interface Caption extends Rect {
  /** Shown at rest, not only when its note or a neighbour is hovered. */
  atRest: boolean;
}

/**
 * Places every note's caption beside its head: to the right, else the left, below or above,
 * wherever it first fits on the plate clear of every head and of the captions shown at rest. The
 * hubs are placed first, the best linked first, and shown at rest where they fit cleanly; any
 * other caption shows only on hover, so it may lie over a resting one. `title` names a note.
 */
export function placeCaptions(layout: GardenLayout, title: (slug: string) => string): Map<string, Caption> {
  // Every head, which only another note's caption must keep off, and every wildflower's stem.
  const heads = layout.flowers.flatMap((f) => {
    const [x, y] = [f.cell[0] * CELL, f.cell[1] * ROW];
    const head = { slug: f.slug, x: x - 2, y: y - 2, w: f.size * 2 * CELL + 4, h: f.size * ROW + 4 };
    return f.wild ? [head, { slug: '', x: x - 2, y: y + ROW, w: 2 * CELL + 4, h: (footprint(f).h - 1) * ROW }] : [head];
  });
  const onPlate = (r: Rect) => r.x >= CELL && r.y >= 4 && r.x + r.w <= (layout.width - 1) * CELL && r.y + r.h <= layout.height * ROW - 4;

  const order = [...layout.flowers].sort((a, b) => Number(b.hub) - Number(a.hub) || b.degree - a.degree || (a.slug < b.slug ? -1 : 1));
  const resting: Rect[] = [];
  const captions = new Map<string, Caption>();
  for (const f of order) {
    const side = f.size * 2 * CELL;
    const [hx, hy] = [f.cell[0] * CELL, f.cell[1] * ROW];
    const w = Math.ceil(Math.min(title(f.slug).length, CAPTION.longest) * CAPTION.char) + 2 * CAPTION.pad + 2;
    const h = CAPTION.height;
    const middle = hy + (f.size * ROW) / 2 - h / 2;
    const tries: Rect[] = [
      { x: hx + side + 4, y: middle, w, h },
      { x: hx - 4 - w, y: middle, w, h },
      { x: hx + side / 2 - w / 2, y: hy + f.size * ROW + 2, w, h },
      { x: hx + side / 2 - w / 2, y: hy - 2 - h, w, h },
    ].map((r) => ({ ...r, x: Math.round(r.x), y: Math.round(r.y) }));
    const clearOfHeads = (r: Rect) => !heads.some((o) => o.slug !== f.slug && overlap(r, o));
    const clean = f.hub ? tries.find((r) => onPlate(r) && clearOfHeads(r) && !resting.some((o) => overlap(r, o))) : undefined;
    if (clean) resting.push(clean);
    const spot = clean ?? tries.find((r) => onPlate(r) && clearOfHeads(r)) ?? tries.find(onPlate) ?? tries[0]!;
    captions.set(f.slug, { ...spot, atRest: spot === clean });
  }
  return captions;
}

// Vines stop short of any head they pass as well as the two they join, so no vine ever runs over
// petals.
const PASS = 1;
const STRONG = 'var(--pebble)';
const BED = 'var(--rule)';
const LEAF = { colour: 'var(--moss)' };
const STEM = { colour: 'var(--fern)' };
// A vine's dots take the colour of the element they are set in, so the page can bring one up.
const BROUGHT_UP = 'currentColor';

export interface GardenDrawing {
  /** The plate at rest: its frame, the strong vines, the bed and the wildflowers' stems. */
  plate: Row[];
  /** Each vine whole, in `currentColor`, cut to its own box, whose top-left cell is `cell`; in the layout's order. */
  vines: { rows: Row[]; cell: Point }[];
}

/** Draws a laid-out garden as layers the page sets one over the other, under its notes' heads. */
export function drawGarden(layout: GardenLayout): GardenDrawing {
  const plate = createCanvas(layout.width, layout.height);
  frame(plate);
  const bySlug = new Map(layout.flowers.map((f) => [f.slug, f]));
  // Every dot within reach of a head, which no vine crosses.
  const bare = new Uint8Array(plate.dotWidth * plate.dotHeight);
  for (const f of layout.flowers) {
    const [x0, y0, side] = [f.cell[0] * 2, f.cell[1] * 4, f.size * 4];
    for (let y = y0 - PASS; y < y0 + side + PASS; y++) {
      for (let x = x0 - PASS; x < x0 + side + PASS; x++) {
        if (x >= 0 && y >= 0 && x < plate.dotWidth && y < plate.dotHeight) bare[y * plate.dotWidth + x] = 1;
      }
    }
  }
  const isBare = (x: number, y: number) => {
    const [dx, dy] = [Math.round(x), Math.round(y)];
    return dx >= 0 && dy >= 0 && dx < plate.dotWidth && dy < plate.dotHeight && bare[dy * plate.dotWidth + dx] === 1;
  };
  // The plate as the vines draw on it, leaving the heads bare.
  const ground: DotCanvas = { ...plate, put: (x, y, colour, weight) => isBare(x, y) || plate.put(x, y, colour, weight) };

  const vines = layout.vines.map((v) => {
    const [a, b] = [bySlug.get(v.ends[0])!, bySlug.get(v.ends[1])!];
    const random = rng(`vine:${v.ends[0]}:${v.ends[1]}`);
    const bow = (random() < 0.5 ? -1 : 1) * (0.08 + random() * 0.08);
    const dots = vineDots(box(a.cell, a.size), box(b.cell, b.size), bow).filter(([x, y]) => !isBare(x, y));
    // At rest only a strong vine is drawn, dotted every other dot, with a leaf on a long one now
    // and then.
    if (v.strong) {
      dots.forEach(([x, y], i) => i % 2 === 0 && ground.put(x, y, STRONG));
      if (dots.length > 24 && random() < 0.5) leaf(ground, dots, 0.35 + random() * 0.3, random() < 0.5 ? -1 : 1);
    }
    return cut(dots);
  });

  for (const f of layout.flowers.filter((f) => f.wild)) stem(plate, f);
  if (layout.bed !== undefined) {
    const y = layout.bed * 4 + 2;
    for (let x = EDGE; x < plate.dotWidth - EDGE; x += 3) plate.put(x, y, BED);
  }
  return { plate: encode(plate), vines };
}

// A vine's dots alone, on the smallest canvas of whole cells that holds them.
function cut(dots: Point[]): { rows: Row[]; cell: Point } {
  if (dots.length === 0) return { rows: [], cell: [0, 0] };
  const x0 = Math.floor(Math.min(...dots.map((d) => d[0])) / 2);
  const y0 = Math.floor(Math.min(...dots.map((d) => d[1])) / 4);
  const x1 = Math.floor(Math.max(...dots.map((d) => d[0])) / 2);
  const y1 = Math.floor(Math.max(...dots.map((d) => d[1])) / 4);
  const canvas = createCanvas(x1 - x0 + 1, y1 - y0 + 1);
  for (const [x, y] of dots) canvas.put(x - x0 * 2, y - y0 * 4, BROUGHT_UP);
  return { rows: encode(canvas), cell: [x0, y0] };
}

// A small leaf off a vine, a share `at` of the way along it, angled off to one side.
function leaf(canvas: DotCanvas, dots: Point[], at: number, side: -1 | 1): void {
  const i = Math.floor(dots.length * at);
  const [base, next] = [dots[i]!, dots[Math.min(i + 2, dots.length - 1)]!];
  const angle = Math.atan2(next[1] - base[1], next[0] - base[0]) + side * 0.8;
  const tip: Point = [base[0] + Math.cos(angle) * 5, base[1] + Math.sin(angle) * 5];
  const swell: Point = [(base[0] + tip[0]) / 2 - Math.sin(angle) * side, (base[1] + tip[1]) / 2 + Math.cos(angle) * side];
  blade(canvas, base, swell, tip, 1.8, LEAF);
}

// A wildflower's stem, from under its head down its slot, with a leaf.
function stem(canvas: DotCanvas, f: Flower): void {
  const x = f.cell[0] * 2 + 2;
  const top = f.cell[1] * 4 + 4;
  const foot = (f.cell[1] + WILD_ROWS - 1) * 4 - 1;
  line(canvas, [x, top], [x, foot], STEM);
  blade(canvas, [x, foot - 3], [x + 2, foot - 6], [x + 4, foot - 7], 2, LEAF);
}

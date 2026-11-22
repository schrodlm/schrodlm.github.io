// A note's neighbourhood: the small plate at the end of a note page, drawn in braille, with the note
// as its own head in the middle. The notes that link to it stand on the left, on dotted vines; the
// notes it links to stand on the right, on solid vines ending in a leaf-tip at the note they reach.
// A note linked both ways joins the shorter side, on a solid vine with a leaf-tip at either end.
// The notes two steps away are a few small heads above and below it, drawn faint by the page.
//
// Only the best-linked neighbours are shown, a few to a side, so the plate stays calm on a hub; the
// page says how many more there are. Heads come from the herbarium (or a stub's seedling), handed
// in by the page; this module lays them out and draws the vines between them. Ported, calmer, from
// the "Note · braille" prototype.
import { bezier, blade, createCanvas, encode, line, stamp, type DotCanvas, type Point, type Row } from './braille';
import type { LinkGraph } from './graph';
import { compareTitles } from './pages';

/** The plate's width in cells: 8 px each across the reading column. */
export const PLATE_WIDTH = 94;
/** The most neighbours shown on either side, and the most notes two steps away. */
export const PER_SIDE = 5;
export const MOST_FAR = 6;
/** The heads' sizes in rows: the note itself, a neighbour, a note two steps away. */
export const SIZES = { self: 5, near: 3, far: 1 } as const;

// Neighbours stand a head's height apart, at least this far from the middle and bowing out a
// little more towards the middle of their side.
const PITCH = 4;
const REACH = 15;
const BOW = 3;
// The shortest plate, enough for the note and the heads above and below it.
const LEAST_HEIGHT = 17;
// The heads two steps away sit on an ellipse around the note, in dots, between these angles from
// the left, clear of the vines to the corners.
const FAR_ELLIPSE = { x: 16, y: 24 };
const FAR_ARC = [0.3, 0.7] as const;
// Vines stop this many dots short of the heads they join.
const CLEAR = 2;
const RULE = { colour: 'var(--pebble)' };
// A vine's dots take the colour of the element they are set in, so the page can bring one up.
const VINE = { colour: 'currentColor' };

export type Role = 'out' | 'in' | 'both';
export type Side = -1 | 1;

/** A note on the plate, by its head's top-left cell. */
export interface Placed {
  slug: string;
  cell: Point;
}

export interface Neighbour extends Placed {
  /** Whether this note links to it, it links here, or both. */
  role: Role;
  /** Left of the note, or right. */
  side: Side;
}

export interface Neighbourhood {
  /** The plate's size in cells and rows. */
  width: number;
  height: number;
  self: Placed;
  /** The neighbours shown: the left side top to bottom, then the right. */
  near: Neighbour[];
  /** The notes two steps away shown. */
  far: Placed[];
  /** How many neighbours are not shown. */
  unshown: number;
}

/**
 * Lays out a note's neighbourhood from the link graph. `title` names any note, for the order the
 * neighbours stand in. Returns undefined for a note with no neighbours, which gets no plate.
 */
export function layNeighbourhood(graph: LinkGraph, slug: string, title: (slug: string) => string): Neighbourhood | undefined {
  const out = new Set(graph.linksOut(slug));
  const into = new Set(graph.linksIn(slug));
  if (out.size + into.size === 0) return undefined;

  const aToZ = (a: string, b: string) => compareTitles(title(a), title(b)) || (a < b ? -1 : 1);
  const role = (other: string): Role => (out.has(other) && into.has(other) ? 'both' : out.has(other) ? 'out' : 'in');
  // The strongest first: linked both ways, then the better linked, then A to Z.
  const strength = (a: string, b: string) =>
    Number(role(b) === 'both') - Number(role(a) === 'both') ||
    graph.degree(b) - graph.degree(a) ||
    aToZ(a, b);
  const neighbours = [...graph.neighbours(slug)].sort(strength);
  const left = neighbours.filter((other) => role(other) === 'in');
  const right = neighbours.filter((other) => role(other) === 'out');
  for (const other of neighbours.filter((n) => role(n) === 'both')) (left.length < right.length ? left : right).push(other);
  const sides = ([-1, 1] as const).map((side) =>
    (side < 0 ? left : right)
      .sort(strength)
      .slice(0, PER_SIDE)
      .sort(aToZ)
      .map((other) => ({ slug: other, side, role: role(other) })),
  );

  const tallest = Math.max(...sides.map((column) => column.length));
  // An odd height, so the note's head sits in the very middle.
  const height = Math.max(LEAST_HEIGHT, tallest * PITCH + 5) | 1;
  const middle = { x: PLATE_WIDTH / 2, y: height / 2 };
  const self: Placed = { slug, cell: [middle.x - SIZES.self, (height - SIZES.self) / 2] };

  const near: Neighbour[] = sides.flatMap((column) =>
    column.map(({ slug: other, side, role: r }, k) => {
      const rows = (k - (column.length - 1) / 2) * PITCH;
      const bulge = Math.max(0, 1 - (rows / 10) ** 2);
      const x = middle.x + side * (REACH + BOW * bulge);
      return { slug: other, role: r, side, cell: [Math.round(x - SIZES.near), (height - SIZES.near) / 2 + rows] as Point };
    }),
  );

  // Two steps away, the notes reached through the most of the neighbours shown, then the better
  // linked; each leans towards the side of the neighbours it hangs from, and they alternate above
  // and below the note.
  const shown = new Map(near.map((n) => [n.slug, n.side]));
  const through = (other: string) => graph.neighbours(other).filter((n) => shown.has(n));
  const lean = (other: string) => through(other).reduce((sum, n) => sum + shown.get(n)!, 0) / through(other).length;
  const chosen = graph
    .twoStepsAway(slug)
    .filter((other) => through(other).length > 0)
    .sort((a, b) => through(b).length - through(a).length || graph.degree(b) - graph.degree(a) || aToZ(a, b))
    .slice(0, MOST_FAR)
    .sort((a, b) => lean(a) - lean(b) || (a < b ? -1 : 1));
  const arcs = [chosen.filter((_, i) => i % 2 === 0), chosen.filter((_, i) => i % 2 === 1)];
  const far: Placed[] = arcs.flatMap((arc, below) =>
    arc.map((other, k) => {
      const angle = Math.PI * (FAR_ARC[0] + ((FAR_ARC[1] - FAR_ARC[0]) * (k + 0.5)) / arc.length);
      const x = middle.x * 2 - Math.cos(angle) * FAR_ELLIPSE.x;
      const y = middle.y * 4 + (below ? 1 : -1) * Math.sin(angle) * FAR_ELLIPSE.y;
      return { slug: other, cell: [Math.round((x - 2 * SIZES.far) / 2), Math.round((y - 2 * SIZES.far) / 4)] as Point };
    }),
  );

  return { width: PLATE_WIDTH, height, self, near, far, unshown: neighbours.length - near.length };
}

/**
 * Where text beside a neighbour's head stands, in % of the plate, so it tracks the plate as it
 * scales: `gap` cells out from the head on the plate's outer side, at the head's middle row.
 * `edge` is the plate's edge it is measured from, the one on the neighbour's side, and `room` how
 * much of the plate's width is left between it and that edge, less a cell's margin.
 */
export function besideHead(hood: Neighbourhood, n: Neighbour, gap: number) {
  const [x, y] = n.cell;
  const pct = (cells: number) => (100 * cells) / hood.width;
  const outer = n.side > 0 ? x + SIZES.near * 2 + gap : hood.width - x + gap;
  return {
    edge: n.side > 0 ? ('left' as const) : ('right' as const),
    inset: pct(outer),
    room: pct(hood.width - outer - 2),
    top: (100 * (y + SIZES.near / 2)) / hood.height,
  };
}

/** A head of `size` rows, from the herbarium or a stub's seedling. */
export type DrawHead = (slug: string, size: number) => Row[];

export interface Vine {
  /** The vine alone, in dots of `currentColor`, the size of the plate. */
  rows: Row[];
  /** The colour its neighbour's head is mostly drawn in. */
  colour: string;
}

export interface NeighbourhoodDrawing {
  /** The plate: its frame, the note's head and its neighbours'. */
  plate: Row[];
  /** The heads two steps away, alone, the size of the plate. */
  far: Row[];
  /** One vine for each neighbour shown, in the same order. */
  vines: Vine[];
}

/** Draws a laid-out neighbourhood as layers the page sets one over the other. */
export function drawNeighbourhood(hood: Neighbourhood, head: DrawHead): NeighbourhoodDrawing {
  const { width, height } = hood;
  const plate = createCanvas(width, height);
  frame(plate);
  stamp(plate, head(hood.self.slug, SIZES.self), ...hood.self.cell);
  const far = createCanvas(width, height);
  for (const { slug, cell } of hood.far) stamp(far, head(slug, SIZES.far), ...cell);

  const vines = hood.near.map((n) => {
    const rows = head(n.slug, SIZES.near);
    stamp(plate, rows, ...n.cell);
    const canvas = createCanvas(width, height);
    vine(canvas, box(hood.self.cell, SIZES.self), box(n.cell, SIZES.near), n);
    return { rows: encode(canvas), colour: mostly(rows) };
  });
  return { plate: encode(plate), far: encode(far), vines };
}

interface Box {
  centre: Point;
  /** Half its side, in dots. */
  half: number;
}

// A head's square, in dots.
const box = ([x, y]: Point, size: number): Box => ({ centre: [x * 2 + size * 2, y * 4 + size * 2], half: size * 2 });

const inside = ([x, y]: Point, { centre, half }: Box) =>
  Math.abs(x - centre[0]) <= half + CLEAR && Math.abs(y - centre[1]) <= half + CLEAR;

// A vine from the note to a neighbour, bowing gently away from the plate's middle row, stopping
// short of both heads: dotted from a note that only links here; solid, with a leaf-tip at the
// neighbour, to a note this one links to; and for a link both ways, a leaf-tip at either end.
function vine(canvas: DotCanvas, from: Box, to: Box, n: Neighbour): void {
  const [x0, y0] = from.centre;
  const [x1, y1] = to.centre;
  const length = Math.hypot(x1 - x0, y1 - y0);
  const bow = (y1 < y0 ? -1 : 1) * n.side * 0.12 * length;
  const control: Point = [(x0 + x1) / 2 - ((y1 - y0) / length) * bow, (y0 + y1) / 2 + ((x1 - x0) / length) * bow];

  // The dots along the curve, each once, outside both heads.
  const dots: Point[] = [];
  const seen = new Set<string>();
  const steps = Math.ceil(length * 4);
  for (let s = 0; s <= steps; s++) {
    const p = bezier(from.centre, control, to.centre, s / steps);
    const dot: Point = [Math.round(p[0]), Math.round(p[1])];
    const key = dot.join();
    if (seen.has(key) || inside(dot, from) || inside(dot, to)) continue;
    seen.add(key);
    dots.push(dot);
  }
  if (dots.length < 2) return;

  dots.forEach(([x, y], i) => {
    if (n.role !== 'in' || i % 3 === 0) canvas.put(x, y, VINE.colour);
  });
  if (n.role !== 'in') leaf(canvas, dots.slice(-5));
  if (n.role === 'both') leaf(canvas, dots.slice(0, 5).reverse());
}

// A leaf-tip along the last few dots of a vine, pointing the way it runs.
function leaf(canvas: DotCanvas, run: Point[]): void {
  const base = run[0]!;
  const tip = run[run.length - 1]!;
  const [dx, dy] = [tip[0] - base[0], tip[1] - base[1]];
  const length = Math.hypot(dx, dy) || 1;
  const swell: Point = [(base[0] + tip[0]) / 2 - (dy / length) * 1.1, (base[1] + tip[1]) / 2 + (dx / length) * 1.1];
  blade(canvas, base, swell, tip, 1.5, VINE);
}

// The plate's frame: one ruled line round its edge.
function frame(canvas: DotCanvas): void {
  const right = canvas.dotWidth - 2;
  const bottom = canvas.dotHeight - 2;
  line(canvas, [1, 1], [right, 1], RULE);
  line(canvas, [right, 1], [right, bottom], RULE);
  line(canvas, [right, bottom], [1, bottom], RULE);
  line(canvas, [1, bottom], [1, 1], RULE);
}

/** The colour most of a drawing's dots are in. */
export function mostly(rows: readonly Row[]): string {
  const dots = new Map<string, number>();
  for (const row of rows) {
    for (const run of row) {
      let count = 0;
      for (const ch of run.t) {
        for (let bits = ch.charCodeAt(0) - 0x2800; bits; bits &= bits - 1) count++;
      }
      if (count) dots.set(run.c, (dots.get(run.c) ?? 0) + count);
    }
  }
  let best = 'currentColor';
  let most = 0;
  for (const [colour, count] of dots) {
    if (count > most) {
      best = colour;
      most = count;
    }
  }
  return best;
}

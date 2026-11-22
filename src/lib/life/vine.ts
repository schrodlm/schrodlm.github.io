// The vine that hangs beside the text: one stem from the top of the page, with leaves, curls and
// small blooms off both sides, still at the top and swaying in the wind most at its foot. A butterfly rests on its leaves
// and a bee on its blooms, taking turns to fly as the clock says. The vine grows from a seed, the
// page's own, so every page has its own vine and it is the same in every build.
//
// The blooms are tiny rosettes of dots, part of the vine. They are not flowers: a page's flower
// comes from the herbarium, never from here.
import { createCanvas, encode, line, oval, type DotCanvas, type Point, type Row } from '../braille';
import { rng } from '../random';
import { beeTurn, butterflyTurn, wind, type Turn } from './clock';

/** The vine's drawing, in cells across and rows down. */
export const VINE_WIDTH = 18;
export const VINE_HEIGHT = 72;

const WIDTH = VINE_WIDTH * 2;
const HEIGHT = VINE_HEIGHT * 4;
const MIDDLE = WIDTH / 2;

const STEM = 'var(--fern)';
const LEAVES = ['var(--canopy)', 'var(--fern)', 'var(--moss)'];
const PETALS = ['var(--hibiscus)', 'var(--orchid)', 'var(--lagoon)', 'var(--rose)'];
const HEART = 'var(--mango)';
const CURL = 'var(--moss)';
const INK = 'var(--ink)';
const WINGS = 'var(--orchid)';
const BEE = 'var(--mango)';
const BEE_WINGS = 'var(--wing)';

// The bugs draw over everything else on the vine.
const BUG = 6;

type Side = -1 | 1;

interface Leaf {
  y: number;
  side: Side;
  size: number;
  colour: string;
}

interface Bloom {
  y: number;
  /** 0 for the bloom at the foot, which hangs from the stem itself. */
  side: Side | 0;
  colour: string;
}

interface Curl {
  y: number;
  side: Side;
}

export interface VinePlan {
  phase: [number, number, number];
  leaves: Leaf[];
  blooms: Bloom[];
  curls: Curl[];
  /** The leaves the butterfly rests on, from the top down. */
  perches: Leaf[];
}

/** Grow a vine from a seed: the same seed always grows the same vine. */
export function growVine(seed: string): VinePlan {
  const random = rng(`vine:${seed}`);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)]!;
  const phase: VinePlan['phase'] = [random() * 2 * Math.PI, random() * 2 * Math.PI, random() * 2 * Math.PI];
  const leaves: Leaf[] = [];
  const blooms: Bloom[] = [];
  const curls: Curl[] = [];
  let side: Side = random() < 0.5 ? -1 : 1;
  for (let y = 5; y < HEIGHT - 12; y += 6 + Math.floor(random() * 8)) {
    const roll = random();
    // The first thing off the stem is always a leaf, so the butterfly has somewhere to rest.
    if (roll < 0.11 && y > 24) blooms.push({ y, side, colour: pick(PETALS) });
    else if (roll < 0.2 && leaves.length) curls.push({ y, side });
    else leaves.push({ y, side, size: 3.6 + random() * 2.6, colour: pick(LEAVES) });
    side = side === 1 ? -1 : 1;
  }
  // The bee needs a bloom to fly to besides the one at the foot: if none grew, the leaf nearest the
  // middle of the vine blooms instead.
  if (!blooms.length && leaves.length > 1) {
    const middle = leaves.reduce((a, b) => (Math.abs(b.y - HEIGHT / 2) < Math.abs(a.y - HEIGHT / 2) ? b : a));
    leaves.splice(leaves.indexOf(middle), 1);
    blooms.push({ y: middle.y, side: middle.side, colour: pick(PETALS) });
  }
  blooms.push({ y: HEIGHT - 6, side: 0, colour: PETALS[0]! });
  // Every third leaf below the very top, so the butterfly's hops are long enough to see.
  const perches = leaves.filter((leaf, i) => i % 3 === 1 && leaf.y > 20);
  return { phase, leaves, blooms, curls, perches: perches.length ? perches : leaves };
}

// Where the stem is across, in dots, at a depth `y` and a moment of wind.
function stemX(plan: VinePlan, y: number, gust: number): number {
  const [a, b, c] = plan.phase;
  const sway = gust * 2.6 * (y / HEIGHT) ** 1.4;
  return MIDDLE + 4.2 * Math.sin(y * 0.021 + a) + 2.4 * Math.sin(y * 0.057 + b) + 1.2 * Math.sin(y * 0.13 + c) + sway;
}

// A leaf's middle: out to its side and a little below where it leaves the stem.
function leafMiddle(plan: VinePlan, leaf: Leaf, gust: number): Point {
  const x = stemX(plan, leaf.y, gust) + leaf.side * (1.2 + leaf.size * 0.45);
  return [x, leaf.y + 1.2 + leaf.size * 0.42];
}

function bloomMiddle(plan: VinePlan, bloom: Bloom, gust: number): Point {
  return [stemX(plan, bloom.y, gust) + bloom.side * 3.2, bloom.y + 1];
}

// A bug's `n`th stop: down the vine one stop at a time and back up, so every flight is to a
// neighbouring leaf or bloom.
function stop<T>(stops: T[], n: number): T {
  const period = 2 * (stops.length - 1);
  const m = period ? n % period : 0;
  return stops[m < stops.length ? m : period - m]!;
}

// A bug's place on its round: at its stop, or along the way to the next.
function along(stops: Point[], turn: Turn, fly: (from: Point, to: Point, k: number) => Point): Point {
  const from = stop(stops, turn.at);
  return turn.flight === null ? from : fly(from, stop(stops, turn.at + 1), turn.flight);
}

export interface Butterfly {
  x: number;
  y: number;
  open: boolean;
}

/**
 * The butterfly at a tick: resting on a leaf, opening and closing its wings slowly, or on its hop
 * to the next leaf in a rising and falling arc, beating them.
 */
export function butterflyAt(plan: VinePlan, tick: number): Butterfly {
  const gust = wind(tick);
  const turn = butterflyTurn(tick);
  const rests = plan.perches.map((leaf): Point => {
    const [x, y] = leafMiddle(plan, leaf, gust);
    return [x, y - 3];
  });
  const [x, y] = along(rests, turn, (from, to, k) => [
    from[0] + (to[0] - from[0]) * k,
    from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 12,
  ]);
  const open = turn.flight === null ? tick % 24 < 18 : tick % 2 === 0;
  return { x, y, open };
}

export interface Bee {
  x: number;
  y: number;
  flying: boolean;
}

/**
 * The bee at a tick: sitting on a bloom, or on its visit to the next one: across to it, three
 * figure-eights around it, and down onto it.
 */
export function beeAt(plan: VinePlan, tick: number): Bee {
  const gust = wind(tick);
  const turn = beeTurn(tick);
  const seats = plan.blooms.map((bloom): Point => {
    const [x, y] = bloomMiddle(plan, bloom, gust);
    return [x - 0.5, y - 3];
  });
  const [x, y] = along(seats, turn, (from, to, k) => {
    // Over the bloom, a little above where it will sit.
    const hover: Point = [to[0], to[1] - 3];
    if (k < 0.45) {
      const s = k / 0.45;
      return [from[0] + (hover[0] - from[0]) * s + Math.sin(s * Math.PI) * 4, from[1] + (hover[1] - from[1]) * s - Math.sin(s * Math.PI) * 8];
    }
    if (k < 0.9) {
      const s = ((k - 0.45) / 0.45) * 3 * 2 * Math.PI;
      return [hover[0] + Math.sin(s) * 4, hover[1] + Math.sin(2 * s) * 1.5];
    }
    const s = (k - 0.9) / 0.1;
    return [hover[0], hover[1] + (to[1] - hover[1]) * s];
  });
  // Kept a body's length from either edge, so it never flies out of the drawing.
  return { x: Math.min(Math.max(x, 1), WIDTH - 4), y, flying: turn.flight !== null };
}

/** The vine at a tick, with its bugs, as rows of braille. */
export function drawVine(plan: VinePlan, tick: number): Row[] {
  const canvas = createCanvas(VINE_WIDTH, VINE_HEIGHT);
  const gust = wind(tick);

  // The stem, one dot a row; where it steps across, a dot fills the corner so it reads unbroken.
  let last = Math.round(stemX(plan, 0, gust));
  for (let y = 0; y < HEIGHT - 4; y++) {
    const x = Math.round(stemX(plan, y, gust));
    if (x !== last) canvas.put(x, y - 1, STEM);
    canvas.put(x, y, STEM);
    last = x;
  }

  for (const leaf of plan.leaves) {
    canvas.put(stemX(plan, leaf.y, gust) + leaf.side, leaf.y, leaf.colour, 1.5);
    oval(canvas, leafMiddle(plan, leaf, gust), leaf.size * 0.62, 1.15, leaf.side * 0.8, { colour: leaf.colour, weight: 1.5 });
  }

  for (const curl of plan.curls) {
    const x = stemX(plan, curl.y, gust);
    for (let a = 0; a < 5.4; a += 0.25) {
      const r = 2.6 - a * 0.4;
      canvas.put(x + curl.side * (2 + r * Math.cos(a)), curl.y + 1 + r * Math.sin(a) * curl.side, CURL, 1.2);
    }
  }

  for (const bloom of plan.blooms) {
    const [x, y] = bloomMiddle(plan, bloom, gust);
    if (bloom.side) line(canvas, [stemX(plan, bloom.y, gust), bloom.y], [x, y], { colour: STEM });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * Math.PI;
      canvas.put(x + Math.cos(a) * 2.1, y + Math.sin(a) * 2.1, bloom.colour, 3);
    }
    canvas.put(x, y, HEART, 3.5);
  }

  drawBee(canvas, beeAt(plan, tick), tick);
  drawButterfly(canvas, butterflyAt(plan, tick));
  return encode(canvas);
}

// A body three dots long and two wings of four dots a side, spread or folded up.
function drawButterfly(canvas: DotCanvas, { x, y, open }: Butterfly): void {
  for (let k = -1; k <= 1; k++) canvas.put(x, y + k, INK, BUG);
  const wing: Point[] = open
    ? [[1, -1], [2, -2], [3, -2], [3, -1], [2, -1], [1, 1], [2, 1], [2, 2]]
    : [[1, -1], [1, -2], [2, -2], [1, 1]];
  for (const side of [-1, 1]) for (const [u, v] of wing) canvas.put(x + side * u, y + v, WINGS, BUG);
}

// A striped body four dots long, a head, and two wings that flicker while it flies.
function drawBee(canvas: DotCanvas, { x, y, flying }: Bee, tick: number): void {
  for (let u = -1; u <= 2; u++) for (let v = 0; v <= 1; v++) canvas.put(x + u, y + v, u % 2 ? INK : BEE, BUG);
  canvas.put(x + 3, y, INK, BUG);
  for (const u of [0, 1]) canvas.put(x + u, y - 1 - (flying ? (tick + u) % 2 : 0), BEE_WINGS, BUG);
}

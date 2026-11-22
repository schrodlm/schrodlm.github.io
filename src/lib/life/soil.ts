// The soil under every page, above the footer bar: a ground line with grass and mushrooms on it,
// and roots and stones in the earth below. In the middle of it ants carry crumbs from a little pile
// on the ground, down a tunnel to their nest, and walk back up for more, slowly and all the time.
// The soil is the same on every page.
//
// It is drawn wider than the widest screen and centred, so a screen of any width sees its middle,
// where the ants live, and a phone sees only that.
import { createCanvas, encode, line, type DotCanvas, type Point, type Row } from '../braille';
import { rng } from '../random';

/** The soil's drawing, in cells across and rows down. */
export const SOIL_WIDTH = 320;
export const SOIL_HEIGHT = 8;

const WIDTH = SOIL_WIDTH * 2;
const HEIGHT = SOIL_HEIGHT * 4;
// The ground line, in dots from the top; the grass grows above it.
const GROUND = 6;
const MIDDLE = WIDTH / 2;

// Where the ants live, in dots: the pile of crumbs on the ground, the tunnel's mouth, and the nest.
const PILE = MIDDLE - 60;
const HOLE = MIDDLE - 12;
const NEST: Point = [MIDDLE + 16, 22];
const NEST_RX = 7;
const NEST_RY = 3.2;

const EARTH = 'var(--earth)';
const GRASS = 'var(--moss)';
const CAP = 'var(--hibiscus)';
const PEBBLE = 'var(--pebble)';
const ROOT = 'var(--bark)';
const CRUMB = 'var(--moss)';
const ANT = 'var(--ink)';

// How far round its trip each ant is at tick 0, spread so that none of them start on top of another.
const ANTS = [0.1, 0.45, 0.8];
// Dots an ant walks in a tick: two a second.
const PACE = 0.5;

/** The way the ants walk, one dot a step: along the ground from the pile, then down to the nest. */
export const antPath: Point[] = walk([
  [PILE + 2, GROUND - 1],
  ...Array.from({ length: 101 }, (_, i): Point => {
    const s = i / 100;
    return [HOLE + (NEST[0] - NEST_RX - HOLE) * s * s, GROUND - 1 + (NEST[1] - GROUND + 1) * Math.sin((s * Math.PI) / 2)];
  }),
]);

// Resample a line through the points into steps one dot long.
function walk(points: Point[]): Point[] {
  const steps: Point[] = [points[0]!];
  let left = 1;
  for (let i = 1; i < points.length; i++) {
    let [x, y] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    let gap = Math.hypot(x1 - x, y1 - y);
    while (gap >= left) {
      x += ((x1 - x) * left) / gap;
      y += ((y1 - y) * left) / gap;
      steps.push([x, y]);
      gap -= left;
      left = 1;
    }
    left -= gap;
  }
  return steps;
}

export interface Ant {
  x: number;
  y: number;
  /** Which way it faces: one step, a dot long, along its way. */
  heading: Point;
  /** Down to the nest it carries a crumb; back up it carries nothing. */
  carrying: boolean;
}

/** The ants at a tick, each somewhere on its way between the pile and the nest. */
export function antsAt(tick: number): Ant[] {
  const length = antPath.length - 1;
  return ANTS.map((start) => {
    const s = (tick * PACE + start * 2 * length) % (2 * length);
    const carrying = s < length;
    const k = carrying ? s : 2 * length - s;
    const at = Math.min(Math.floor(k), length - 1);
    const [x0, y0] = antPath[at]!;
    const [x1, y1] = antPath[at + 1]!;
    const f = k - at;
    const heading: Point = carrying ? [x1 - x0, y1 - y0] : [x0 - x1, y0 - y1];
    return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, heading, carrying };
  });
}

let still: DotCanvas | undefined;

/** The soil at a tick, with its ants, as rows of braille. */
export function drawSoil(tick: number): Row[] {
  still ??= ground();
  const canvas = createCanvas(SOIL_WIDTH, SOIL_HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dot = still.dot(x, y);
      if (dot) canvas.put(x, y, dot.colour, dot.weight);
    }
  }
  for (const ant of antsAt(tick)) drawAnt(canvas, ant, tick);
  return encode(canvas);
}

// Everything in the soil that never moves.
function ground(): DotCanvas {
  const canvas = createCanvas(SOIL_WIDTH, SOIL_HEIGHT);
  const random = rng('soil');
  // The ants' way along the ground, and the tunnel and nest under it.
  const onTheWay = (x: number) => x > PILE - 8 && x < HOLE + 6;
  const underground = (x: number, margin: number) => x > HOLE - margin && x < NEST[0] + NEST_RX + margin;

  // The ground line, broken here and there, with a crumb of earth under it, and open at the tunnel.
  for (let x = 0; x < WIDTH; x++) {
    if (Math.abs(x - HOLE) <= 1) continue;
    if (x % 5 !== 4 || random() < 0.4) canvas.put(x, GROUND, EARTH);
    if (random() < 0.2) canvas.put(x, GROUND + 1, EARTH);
  }

  // Grass, leaning this way and that.
  for (let x = 0; x < WIDTH; x++) {
    if (random() >= 0.16) continue;
    const height = 1.5 + random() * 3.5;
    const lean = (random() - 0.5) * 2;
    line(canvas, [x, GROUND - 1], [x + lean, GROUND - height], { colour: GRASS });
  }

  // Mushrooms, apart from each other and off the ants' way: a cap two or three dots tall on a stalk.
  const mushrooms: number[] = [];
  while (mushrooms.length < 15) {
    const x = 8 + Math.floor(random() * (WIDTH - 16));
    if (onTheWay(x) || mushrooms.some((m) => Math.abs(m - x) < 12)) continue;
    mushrooms.push(x);
    const big = random() < 0.4;
    const top = GROUND - (big ? 5 : 4);
    const cap = big ? [1, 2, 3] : [1, 2];
    cap.forEach((half, k) => {
      for (let u = -half; u <= half; u++) canvas.put(x + u, top + k, CAP, 3);
    });
    for (let y = top + cap.length; y < GROUND; y++) canvas.put(x, y, PEBBLE, 3);
  }

  // Roots wandering down, now and then putting out a side root, kept clear of the tunnel and nest.
  for (let x0 = 6; x0 < WIDTH - 6; x0 += 12 + Math.floor(random() * 20)) {
    const depth = 10 + Math.floor(random() * 18);
    if (underground(x0, 24)) continue;
    let x = x0;
    let dx = 0;
    for (let y = GROUND + 1; y < GROUND + depth && y < HEIGHT; y++) {
      dx = Math.max(-0.8, Math.min(0.8, dx + (random() - 0.5) * 0.7));
      x += dx;
      canvas.put(x, y, ROOT, 1.5);
      if (random() < 0.12) {
        const side = random() < 0.5 ? -1 : 1;
        line(canvas, [x, y], [x + side * 3, y + 2.5], { colour: EARTH });
      }
    }
  }

  // Stones, the odd one a little bigger.
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(random() * WIDTH);
    const y = GROUND + 3 + Math.floor(random() * (HEIGHT - GROUND - 4));
    const big = random() < 0.3;
    if (underground(x, 4)) continue;
    canvas.put(x, y, PEBBLE);
    if (big) for (const [u, v] of [[1, 0], [0, 1], [1, 1]] as const) canvas.put(x + u, y + v, PEBBLE);
  }

  // The ants' pile of crumbs, the tunnel's floor, and the nest with the crumbs they brought.
  for (const [u, v] of [[-1, 0], [0, 0], [1, 0], [0, -1]] as const) canvas.put(PILE + u, GROUND - 1 + v, CRUMB, 2);
  const mouth = antPath.findIndex(([x]) => x >= HOLE);
  for (let k = mouth; k < antPath.length; k += 2) {
    const [x, y] = antPath[k]!;
    canvas.put(x, y + 1, PEBBLE, 1.2);
  }
  for (let a = 0; a < 2 * Math.PI; a += 0.18) {
    canvas.put(NEST[0] + Math.cos(a) * NEST_RX, NEST[1] + Math.sin(a) * NEST_RY, ROOT, 2);
  }
  for (const [u, v] of [[-3, 1], [-1, 1], [1, 1], [3, 1], [-2, 0], [0, 0]] as const) canvas.put(NEST[0] + u, NEST[1] + v, CRUMB, 3);
  return canvas;
}

// An ant: head, thorax and abdomen along its heading, a leg ticking under it, and maybe a crumb in
// its jaws.
function drawAnt(canvas: DotCanvas, { x, y, heading, carrying }: Ant, tick: number): void {
  const [ux, uy] = heading;
  const leg = tick % 2 ? 1 : -1;
  canvas.put(x + ux, y + uy, ANT, 6);
  canvas.put(x, y, ANT, 6);
  canvas.put(x - ux * 1.6, y - uy * 1.6, ANT, 6);
  canvas.put(x - uy * leg, y + ux * leg, ANT, 5);
  if (carrying) canvas.put(x + ux * 2.2, y + uy * 2.2 - 0.6, CRUMB, 6);
}

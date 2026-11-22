// The garden: the band of plants across the top of the home page. Every post stands in it as its
// own flower, in the order they were planted, the oldest on the left, and between and around them
// grow ferns, sprigs and grass that belong to no page. One wind moves them all, so they lean the
// same way together.
//
// The flowers come from the herbarium, a stub's seedling from the seedling: the garden only lays
// each one, at its moment of wind, into the band. The ferns, sprigs and grass are its own, and green
// only, so the flowers are the only colour in it.
import { createCanvas, curve, encode, line, stamp, type DotCanvas, type Row } from '../braille';
import { rng } from '../random';
import { drawFlower } from '../seedling';

/** A flower's footprint in the garden, in cells across and rows down: the herbarium's plant. */
export const PLANT_WIDTH = 15;
export const PLANT_HEIGHT = 13;
/** The garden's rows: the plants, and the soil row under them. */
export const GARDEN_HEIGHT = PLANT_HEIGHT + 1;

// How far a weed reaches either side of the cell it stands in, in cells, bent by the strongest gust.
const REACH = 3;
// Cells from one flower's footprint to the next: room between them for a weed that never reaches
// either flower.
const PITCH = PLANT_WIDTH + 2 * REACH + 2;
// The garden is drawn at least this wide, wider than a wide screen, and centred, so the plants run
// out past the window's edges; past the posts it grows weeds alone, at least this far each side.
const MIN_WIDTH = 320;
const VERGE = 12;

// The ground line, in dots from the top: the top of the soil row, just under the plants' feet.
const GROUND = PLANT_HEIGHT * 4;

const EARTH = 'var(--earth)';
const PEBBLE = 'var(--pebble)';
const GRASS = 'var(--moss)';
const FROND = 'var(--fern)';
const STALK = 'var(--canopy)';

// A flower's dots win over the weeds' and the grass's where they meet, and a cell with one flower
// dot in it takes the flower's colour even against a cell full of grass.
const FLOWER = 8;

/** A post standing in the garden: the seed its flower grows from, and whether it is a stub. */
export interface Post {
  seed: string;
  stub: boolean;
}

/** A post's flower, placed: its footprint's leftmost cell. */
interface Placed extends Post {
  x: number;
}

/** A weed: a fern with paired fronds or a sprig with leaves off alternate sides. */
interface Weed {
  kind: 'fern' | 'sprig';
  /** Where it stands, in dots across. */
  x: number;
  /** Its height, in dots. */
  height: number;
  /** How far the wind bends it. */
  give: number;
  /** For a sprig, the side its first leaf grows on. */
  side: -1 | 1;
}

/** A blade of grass on the ground line. */
interface Blade {
  x: number;
  height: number;
  lean: number;
}

export interface GardenPlan {
  /** Cells across. */
  width: number;
  /** The posts' flowers, in the order given. */
  flowers: Placed[];
  weeds: Weed[];
  grass: Blade[];
  /** The crumbs of earth just under the ground line, in dots across. */
  crumbs: number[];
}

/**
 * Lay out the garden for the posts, in the order given: each post's flower at its place, and the
 * weeds and grass between and around them. The same posts always give the same garden.
 */
export function planGarden(posts: readonly Post[]): GardenPlan {
  const random = rng('garden');
  const bed = posts.length * PITCH;
  const width = Math.max(MIN_WIDTH, bed + 2 * VERGE);
  const left = Math.floor((width - bed) / 2);
  const flowers = posts.map((post, i) => ({ ...post, x: left + i * PITCH + (PITCH - PLANT_WIDTH) / 2 }));

  // Weeds every few cells, kept far enough from each flower that, however hard the wind bends
  // them, they never reach into its footprint. A weed that would stand too near one stands just
  // past it instead, so every gap between two flowers grows one.
  const weeds: Weed[] = [];
  let cell = 2 + Math.floor(random() * 3);
  while (cell < width - 2) {
    let near;
    while ((near = flowers.find(({ x }) => cell > x - 1 - REACH && cell < x + PLANT_WIDTH + REACH))) {
      cell = near.x + PLANT_WIDTH + REACH;
    }
    if (cell >= width - 2) break;
    weeds.push({
      kind: random() < 0.45 ? 'fern' : 'sprig',
      x: cell * 2 + 1,
      height: 8 + Math.floor(random() * 13),
      give: 0.8 + random() * 0.6,
      side: random() < 0.5 ? -1 : 1,
    });
    cell += 4 + Math.floor(random() * 5);
  }

  const grass: Blade[] = [];
  const crumbs: number[] = [];
  for (let x = 0; x < width * 2; x++) {
    // Grass stays within the plants' bottom row, four dots tall at most.
    if (random() < 0.18) grass.push({ x, height: 1.5 + random() * 2.5, lean: (random() - 0.5) * 1.5 });
    if (random() < 0.2) crumbs.push(x);
  }
  return { width, flowers, weeds, grass, crumbs };
}

/** The garden at a moment of wind, from -1 to 1, as rows of braille. */
export function drawGarden(plan: GardenPlan, wind: number): Row[] {
  const canvas = createCanvas(plan.width, GARDEN_HEIGHT);
  line(canvas, [0, GROUND], [plan.width * 2 - 1, GROUND], { colour: EARTH });
  for (const x of plan.crumbs) canvas.put(x, GROUND + 1 + (x % 3 === 0 ? 1 : 0), PEBBLE);
  for (const blade of plan.grass) {
    line(canvas, [blade.x, GROUND - 1], [blade.x + blade.lean + wind * 0.8, GROUND - blade.height], { colour: GRASS });
  }
  for (const weed of plan.weeds) drawWeed(canvas, weed, wind);
  for (const flower of plan.flowers) {
    stamp(canvas, drawFlower(flower.seed, flower.stub, 'plant', wind), flower.x, 0, FLOWER);
  }
  return encode(canvas);
}

// A weed bends from its foot, most at its tip, like the vine and the plants in the boards.
function drawWeed(canvas: DotCanvas, weed: Weed, wind: number): void {
  const bend = wind * weed.give * (weed.height / 8);
  const at = (k: number): [number, number] => [weed.x + bend * (k / weed.height) ** 1.6, GROUND - 1 - k];
  const tip = at(weed.height);
  curve(canvas, at(0), at(weed.height / 2), tip, { colour: weed.kind === 'fern' ? FROND : STALK });
  if (weed.kind === 'fern') {
    // Fronds in pairs up the stem, shorter towards the tip, swept up and with the wind.
    for (let k = 3; k < weed.height - 1; k += 3) {
      const [x, y] = at(k);
      const reach = 1 + 3 * (1 - k / weed.height);
      for (const side of [-1, 1]) line(canvas, [x, y], [x + side * reach + wind * 0.5, y - reach * 0.6], { colour: FROND });
    }
    return;
  }
  // A sprig's leaves, off alternate sides, and a curled tip.
  let side = weed.side;
  for (let k = 4; k < weed.height - 2; k += 4) {
    const [x, y] = at(k);
    line(canvas, [x + side, y], [x + side * 2.5 + wind * 0.5, y - 2], { colour: GRASS });
    side = side === 1 ? -1 : 1;
  }
  canvas.put(tip[0] + 1, tip[1], STALK);
}

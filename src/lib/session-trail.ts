// The session trail under a devlog's title: the project's sessions as stepping stones across a
// stream, cut as a woodcut plate with the toolkit the other plates are cut with, this session's
// stone lit. The page lays a link over each stone, so the stones sit at even steps it can work out
// too.
//
// A stone is never narrower than a fingertip: when a project has more sessions than fit across the
// plate, the trail shows the run of them around this one. Ported from the "Devlog · B · session
// trail" prototype.
import { c, frame, plate } from '../../scripts/plates/woodcut.mjs';
import { rng } from './random';

/** The plate's width in cells: across the column, or a phone. */
export const TRAIL_WIDTH = { wide: 237, narrow: 114 } as const;
export const TRAIL_HEIGHT = 32;
/** A cell's size in CSS px. */
export const CELL = 3;
/** The row the stones sit on. */
export const WATER = 20;

// The first stone's centre, and the room the last one keeps from the plate's right edge.
const X0 = 14;
const RIGHT = 15;
// Stones are 8 cells (24 px) apart at the least, so each link is a fingertip wide, and 10 at most.
const MIN_STEP = 8;
const MAX_STEP = 10;

/**
 * Where the stones go across a plate `width` cells wide, for `count` sessions with `current` lit:
 * the index of the first session shown, and the centre of each stone shown, in cells.
 */
export function layTrail(count: number, current: number, width: number): { first: number; xs: number[] } {
  const span = width - RIGHT - X0;
  const shown = Math.min(count, Math.floor(span / MIN_STEP) + 1);
  const first = Math.max(0, Math.min(count - shown, current - Math.floor((shown - 1) / 2)));
  const step = shown > 1 ? Math.min(MAX_STEP, span / (shown - 1)) : 0;
  return { first, xs: Array.from({ length: shown }, (_, i) => Math.round(X0 + i * step)) };
}

/** The plate for a trail laid by `layTrail`, with the stone at `lit` (an index into `xs`) lit. */
export function drawTrail(width: number, xs: readonly number[], lit: number): Uint8Array {
  const P = plate(width, TRAIL_HEIGHT);
  frame(P, `trail${width}`);
  const bay = (x: number, y: number) => P.bay(x, y)!;

  // The stream: a ripple along its top bank, glints of light, and water deepening downstream.
  P.fill(7, WATER - 3, width - 8, TRAIL_HEIGHT - 8, (x: number, y: number) => {
    if (y === WATER - 3) return x % 7 < 4 ? c.trace : null;
    if ((y - WATER + 3) % 3 === 1 && (x + y * 3) % 9 < 4) return c.cream;
    return bay(x, y) < 2 + (y - WATER) * 2 ? c.lagoon : bay(x + 1, y) < 7 ? c.trace : null;
  });

  // The stones: those behind this one worn and inked, this one lit, those ahead still pale.
  const jitter = rng(`stones${width}`);
  xs.forEach((cx, i) => {
    const here = i === lit;
    const past = i < lit;
    const rx = here ? 4 : 2 + Math.round(jitter() * 0.7);
    const ry = 2;
    P.fill(cx - rx - 1, WATER - ry - 1, cx + rx + 1, WATER + ry + 2, (x: number, y: number) => {
      const d = Math.hypot((x - cx) / (rx + 0.5), (y - WATER) / (ry + 0.5));
      if (d > 1.05) return y === WATER + ry + 1 && Math.abs(x - cx) <= rx ? c.cream : null;
      if (d > 0.72) return past || here ? c.ink : c.rule;
      if (here) return bay(x, y) < 10 ? c.mango : c.ochre;
      if (!past) return c.cream;
      return y < WATER ? c.cream : bay(x, y) < 8 ? c.rule : c.dust;
    });
  });

  // Reeds on both banks.
  for (const bx of [9, 11, width - 12, width - 10]) {
    for (let k = 0; k < 6; k++) P.set(bx + (k > 3 ? 1 : 0), WATER + 2 - k, k > 4 ? c.earth : c.fern);
  }
  return P.data;
}

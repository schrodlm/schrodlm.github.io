// The one clock the garden's life keeps time by. It ticks four times a second from the moment a
// page opens, and tick 0 is the resting frame: the one the build draws, and all that readers who
// prefer reduced motion ever see.
//
// A minute is one round. In it the bee flies once, from its bloom to the next, and later the
// butterfly hops once, from its leaf to the next; the two flights never overlap, so only one thing
// on the vine is ever flying.

export const TICK_MS = 250;
/** Ticks in a round: one minute. */
export const ROUND = 240;

/**
 * Where a bug is in its rounds: resting at stop `at` (counting every stop it has made since the
 * page opened), or on its way from stop `at` to stop `at + 1`, `flight` of the way there (0 to 1).
 */
export interface Turn {
  at: number;
  flight: number | null;
}

interface Span {
  start: number;
  ticks: number;
}

// When in the round each bug flies, in ticks. The bee takes twenty-five seconds, the butterfly five.
const BEE: Span = { start: 80, ticks: 100 };
const BUTTERFLY: Span = { start: 220, ticks: 20 };

function turn(tick: number, { start, ticks }: Span): Turn {
  const round = Math.floor(tick / ROUND);
  const t = tick % ROUND;
  if (t < start) return { at: round, flight: null };
  if (t < start + ticks) return { at: round, flight: (t - start) / ticks };
  return { at: round + 1, flight: null };
}

/** The butterfly's turn: a rest on a leaf, and once a round a hop to the next leaf. */
export const butterflyTurn = (tick: number): Turn => turn(tick, BUTTERFLY);

/** The bee's turn: a rest on a bloom, and once a round a visit to the next bloom. */
export const beeTurn = (tick: number): Turn => turn(tick, BEE);

/** The wind at a tick, from -1 to 1: two slow swells, still at tick 0. The vine sways in it. */
export function wind(tick: number): number {
  const s = tick / 4;
  return 0.7 * Math.sin(s * 0.55) + 0.3 * Math.sin(s * 0.21);
}

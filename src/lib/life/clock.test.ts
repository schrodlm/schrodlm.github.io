import { describe, expect, it } from 'vitest';
import { beeTurn, butterflyTurn, ROUND, wind, type Turn } from './clock';

const ticks = (rounds: number) => Array.from({ length: rounds * ROUND }, (_, tick) => tick);

// The ticks at which a bug takes off.
const takeOffs = (turn: (tick: number) => Turn, rounds: number) =>
  ticks(rounds).filter((tick) => turn(tick).flight !== null && (tick === 0 || turn(tick - 1).flight === null));

describe('the clock', () => {
  it('starts at rest: tick 0 has both bugs at their first stop and still air', () => {
    expect(butterflyTurn(0)).toEqual({ at: 0, flight: null });
    expect(beeTurn(0)).toEqual({ at: 0, flight: null });
    expect(wind(0)).toBe(0);
  });

  it('never has the bee and the butterfly flying at once', () => {
    for (const tick of ticks(5)) {
      expect(butterflyTurn(tick).flight !== null && beeTurn(tick).flight !== null).toBe(false);
    }
  });

  it('sends the butterfly to its next leaf once a minute', () => {
    const hops = takeOffs(butterflyTurn, 5);
    expect(hops).toHaveLength(5);
    hops.slice(1).forEach((tick, i) => expect(tick - hops[i]!).toBe(ROUND));
  });

  it('sends the bee on one visit between each two hops of the butterfly', () => {
    const hops = takeOffs(butterflyTurn, 5);
    const visits = takeOffs(beeTurn, 5);
    hops.slice(1).forEach((tick, i) => expect(visits.filter((v) => v > hops[i]! && v < tick)).toHaveLength(1));
  });

  it('flies each bug from one stop to the next, and it lands where it was going', () => {
    for (const turn of [butterflyTurn, beeTurn]) {
      for (const tick of ticks(3).slice(1)) {
        const before = turn(tick - 1);
        const now = turn(tick);
        if (now.flight !== null) {
          expect(now.flight).toBeGreaterThanOrEqual(0);
          expect(now.flight).toBeLessThan(1);
          if (before.flight !== null) expect(now.flight).toBeGreaterThan(before.flight);
        }
        if (before.flight !== null && now.flight === null) expect(now.at).toBe(before.at + 1);
        if (before.flight === null && now.flight === null) expect(now.at).toBe(before.at);
      }
    }
  });
});

describe('wind', () => {
  it('stays between -1 and 1 and blows both ways', () => {
    const gusts = ticks(5).map(wind);
    expect(Math.min(...gusts)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...gusts)).toBeLessThanOrEqual(1);
    expect(Math.min(...gusts)).toBeLessThan(-0.5);
    expect(Math.max(...gusts)).toBeGreaterThan(0.5);
  });

  it('changes a little at a time, never in a jump', () => {
    for (const tick of ticks(5).slice(1)) expect(Math.abs(wind(tick) - wind(tick - 1))).toBeLessThan(0.15);
  });
});

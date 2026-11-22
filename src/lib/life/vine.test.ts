import { describe, expect, it } from 'vitest';
import { beeTurn, butterflyTurn, ROUND } from './clock';
import { beeAt, butterflyAt, drawVine, growVine, VINE_HEIGHT, VINE_WIDTH } from './vine';

const seeds = Array.from({ length: 200 }, (_, i) => `/notes/note-${i}/`);
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const ticks = (rounds: number) => Array.from({ length: rounds * ROUND }, (_, tick) => tick);
const text = (seed: string, tick: number) =>
  drawVine(growVine(seed), tick)
    .map((row) => row.map((run) => run.t).join(''))
    .join('\n');

describe('growVine', () => {
  it('grows the same vine from the same seed, and its own from another', () => {
    expect(growVine('/notes/a/')).toEqual(growVine('/notes/a/'));
    expect(text('/notes/a/', 0)).not.toBe(text('/notes/b/', 0));
  });

  it('gives every vine leaves for the butterfly and blooms for the bee to fly between', () => {
    for (const seed of seeds) {
      const plan = growVine(seed);
      expect(plan.perches.length).toBeGreaterThanOrEqual(2);
      expect(plan.blooms.length).toBeGreaterThanOrEqual(2);
      for (const perch of plan.perches) expect(plan.leaves).toContain(perch);
    }
  });
});

describe('drawVine', () => {
  it('draws braille at the vine’s footprint', () => {
    const rows = drawVine(growVine('/notes/a/'), 0);
    expect(rows).toHaveLength(VINE_HEIGHT);
    for (const row of rows) {
      const line = row.map((run) => run.t).join('');
      expect(line).toHaveLength(VINE_WIDTH);
      expect(line).toMatch(/^[⠀-⣿]+$/);
    }
  });

  it('draws in the garden’s colours only', () => {
    for (const row of drawVine(growVine('/notes/a/'), 130)) {
      for (const run of row) expect(run.c).toMatch(/^(transparent|var\(--[a-z-]+\))$/);
    }
  });
});

describe('the bugs', () => {
  it('rest at tick 0, the butterfly with its wings open, and are a stop further on a round later', () => {
    const plan = growVine('/notes/a/');
    expect(butterflyAt(plan, 0)).toMatchObject({ open: true });
    expect(beeAt(plan, 0)).toMatchObject({ flying: false });
    const moved = (a: { y: number }, b: { y: number }) => Math.abs(a.y - b.y) > 4;
    expect(moved(butterflyAt(plan, 0), butterflyAt(plan, ROUND))).toBe(true);
    expect(moved(beeAt(plan, 0), beeAt(plan, ROUND))).toBe(true);
  });

  it('move only while they fly', () => {
    const plan = growVine('/notes/a/');
    // A resting bug only sways with its leaf or bloom in the wind, less than half a dot a tick.
    for (const tick of ticks(2).slice(1)) {
      if (butterflyTurn(tick).flight === null && butterflyTurn(tick - 1).flight === null) {
        expect(dist(butterflyAt(plan, tick), butterflyAt(plan, tick - 1))).toBeLessThan(0.5);
      }
      if (beeTurn(tick).flight === null && beeTurn(tick - 1).flight === null) {
        expect(dist(beeAt(plan, tick), beeAt(plan, tick - 1))).toBeLessThan(0.5);
      }
    }
  });

  it('fly without jumping, a few cells a frame at most', () => {
    for (const seed of seeds.slice(0, 20)) {
      const plan = growVine(seed);
      for (const tick of ticks(3).slice(1)) {
        expect(dist(butterflyAt(plan, tick), butterflyAt(plan, tick - 1))).toBeLessThan(8);
        expect(dist(beeAt(plan, tick), beeAt(plan, tick - 1))).toBeLessThan(8);
      }
    }
  });

  it('beats the butterfly’s wings in flight, and opens and closes them slowly at rest', () => {
    const plan = growVine('/notes/a/');
    const resting = ticks(1).filter((tick) => butterflyTurn(tick).flight === null);
    const flying = ticks(1).filter((tick) => butterflyTurn(tick).flight !== null);
    const changes = (list: number[]) =>
      list.slice(1).filter((tick, i) => tick === list[i]! + 1 && butterflyAt(plan, tick).open !== butterflyAt(plan, list[i]!).open).length;
    expect(changes(flying)).toBe(flying.length - 1);
    expect(changes(resting)).toBeLessThan(resting.length / 8);
    expect(changes(resting)).toBeGreaterThan(0);
  });

  it('stay whole on the vine’s drawing', () => {
    // How far each bug's body and wings reach from where it is, in dots: left, right, up, down.
    const reach = (bug: object) => ('open' in bug ? [3, 3, 2, 2] : [1, 3, 2, 1]);
    const outside: string[] = [];
    for (const seed of seeds) {
      const plan = growVine(seed);
      for (const tick of ticks(4)) {
        for (const bug of [butterflyAt(plan, tick), beeAt(plan, tick)]) {
          const [left, right, up, down] = reach(bug);
          const [x, y] = [Math.round(bug.x), Math.round(bug.y)];
          if (x - left! < 0 || x + right! >= VINE_WIDTH * 2 || y - up! < 0 || y + down! >= VINE_HEIGHT * 4) {
            outside.push(`${seed} at tick ${tick}`);
          }
        }
      }
    }
    expect(outside).toEqual([]);
  });
});

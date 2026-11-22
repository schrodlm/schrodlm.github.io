import { describe, expect, it } from 'vitest';
import type { Row } from '../braille';
import { draw, grow } from '../herbarium';
import { drawSeedling } from '../seedling';
import { drawGarden, GARDEN_HEIGHT, planGarden, PLANT_HEIGHT, PLANT_WIDTH, type Post } from './garden';

const posts = (n: number): Post[] => Array.from({ length: n }, (_, i) => ({ seed: `posts/post-${i}`, stub: false }));
const text = (row: Row) => row.map((run) => run.t).join('');
const code = (ch: string) => ch.charCodeAt(0) - 0x2800;
// The cells a drawing's row covers, each with the colour it is drawn in, or null where it is empty.
const cells = (row: Row) => row.flatMap((run) => [...run.t].map((ch) => (ch === '⠀' ? null : { ch, c: run.c })));

describe('planGarden', () => {
  it('lays out the same garden for the same posts', () => {
    expect(planGarden(posts(5))).toEqual(planGarden(posts(5)));
  });

  it('stands every post in it, in the order given, each once', () => {
    const given = posts(9);
    expect(planGarden(given).flowers.map(({ seed, stub }) => ({ seed, stub }))).toEqual(given);
  });

  it('gives every flower its own footprint, inside the garden, never overlapping another', () => {
    for (const n of [1, 4, 12, 40]) {
      const { width, flowers } = planGarden(posts(n));
      for (const [i, { x }] of flowers.entries()) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + PLANT_WIDTH).toBeLessThanOrEqual(width);
        if (i > 0) expect(x).toBeGreaterThanOrEqual(flowers[i - 1]!.x + PLANT_WIDTH);
      }
    }
  });

  it('grows as wide as a wide screen, and wider for many posts', () => {
    expect(planGarden(posts(1)).width * 8).toBeGreaterThanOrEqual(2560);
    const many = planGarden(posts(40));
    expect(many.width).toBeGreaterThan(many.flowers.at(-1)!.x + PLANT_WIDTH);
  });

  it('centres the posts in it', () => {
    const { width, flowers } = planGarden(posts(4));
    const left = flowers[0]!.x;
    const right = width - flowers.at(-1)!.x - PLANT_WIDTH;
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it('grows weeds between the flowers', () => {
    const plan = planGarden(posts(6));
    for (let i = 1; i < plan.flowers.length; i++) {
      const [from, to] = [plan.flowers[i - 1]!.x + PLANT_WIDTH, plan.flowers[i]!.x];
      expect(plan.weeds.some(({ x }) => x / 2 > from && x / 2 < to)).toBe(true);
    }
  });

  it('grows only weeds, when there are no posts yet', () => {
    const plan = planGarden([]);
    expect(plan.flowers).toEqual([]);
    expect(plan.weeds.length).toBeGreaterThan(0);
  });
});

describe('drawGarden', () => {
  const plan = planGarden([...posts(3), { seed: 'posts/a-stub', stub: true }]);

  it('draws the garden at its width and height', () => {
    const rows = drawGarden(plan, 0.3);
    expect(rows).toHaveLength(GARDEN_HEIGHT);
    for (const row of rows) expect(text(row)).toHaveLength(plan.width);
  });

  it('draws each post’s flower from the herbarium, standing on the ground, and a stub’s seedling', () => {
    const rows = drawGarden(plan, 0);
    for (const flower of plan.flowers) {
      const plant = flower.stub ? drawSeedling('plant') : draw(grow(flower.seed), { wind: 0, form: 'plant' });
      for (let y = 0; y < PLANT_HEIGHT; y++) {
        const own = cells(plant[y]!);
        const there = cells(rows[y]!).slice(flower.x, flower.x + PLANT_WIDTH);
        own.forEach((cell, i) => {
          if (!cell) return;
          // Every dot of the plant's is there, in its colour, with maybe a blade of grass besides.
          expect(there[i]!.c).toBe(cell.c);
          expect(code(there[i]!.ch) & code(cell.ch)).toBe(code(cell.ch));
        });
      }
    }
    // The soil row under them.
    expect(text(rows[PLANT_HEIGHT]!)).not.toMatch(/^⠀+$/);
  });

  it('keeps the weeds out of the flowers’ footprints, whichever way the wind blows', () => {
    const weedsOnly = { ...plan, flowers: [] };
    for (const wind of [-1, 0, 1]) {
      const rows = drawGarden(weedsOnly, wind);
      for (const { x } of plan.flowers) {
        // Only grass, on the bottom row of the plants, may grow at a flower's feet.
        for (let y = 0; y < PLANT_HEIGHT - 1; y++) {
          expect(cells(rows[y]!).slice(x, x + PLANT_WIDTH).every((cell) => cell === null)).toBe(true);
        }
      }
    }
  });

  it('sways in the wind, and draws the same garden at the same wind', () => {
    expect(drawGarden(plan, 0.6)).toEqual(drawGarden(plan, 0.6));
    expect(drawGarden(plan, 0.6)).not.toEqual(drawGarden(plan, 0));
  });
});

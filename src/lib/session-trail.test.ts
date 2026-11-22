import { describe, expect, test } from 'vitest';
import { TRAIL_HEIGHT, TRAIL_WIDTH, drawTrail, layTrail } from './session-trail';

const gaps = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]!);

describe('laying the trail', () => {
  test('a few sessions step from the left bank, ten cells apart', () => {
    expect(layTrail(3, 2, TRAIL_WIDTH.wide)).toEqual({ first: 0, xs: [14, 24, 34] });
  });

  test('a single session is a single stone', () => {
    expect(layTrail(1, 0, TRAIL_WIDTH.narrow)).toEqual({ first: 0, xs: [14] });
  });

  test('more sessions close up, but never under 8 cells apart, a fingertip', () => {
    for (const width of Object.values(TRAIL_WIDTH))
      for (let count = 2; count <= 60; count++) {
        const { xs } = layTrail(count, 0, width);
        expect(Math.min(...gaps(xs))).toBeGreaterThanOrEqual(8);
        expect(xs.at(-1)!).toBeLessThanOrEqual(width - 15);
      }
  });

  test('every session fits across the column while they can', () => {
    const { first, xs } = layTrail(22, 12, TRAIL_WIDTH.wide);
    expect([first, xs.length]).toEqual([0, 22]);
  });

  test('beyond that, the trail shows the run of sessions around this one', () => {
    expect(layTrail(22, 12, TRAIL_WIDTH.narrow)).toMatchObject({ first: 7 });
    expect(layTrail(22, 12, TRAIL_WIDTH.narrow).xs).toHaveLength(11);
  });

  test('the run stops at the first and the last session', () => {
    expect(layTrail(22, 1, TRAIL_WIDTH.narrow).first).toBe(0);
    expect(layTrail(22, 21, TRAIL_WIDTH.narrow).first).toBe(11);
  });

  test('this session is always among the stones shown', () => {
    for (let current = 0; current < 40; current++) {
      const { first, xs } = layTrail(40, current, TRAIL_WIDTH.narrow);
      expect(current).toBeGreaterThanOrEqual(first);
      expect(current).toBeLessThan(first + xs.length);
    }
  });
});

test('the plate is cut at its size, and the same each time', () => {
  const { xs } = layTrail(5, 2, TRAIL_WIDTH.wide);
  const plate = drawTrail(TRAIL_WIDTH.wide, xs, 2);
  expect(plate).toHaveLength(TRAIL_WIDTH.wide * TRAIL_HEIGHT * 4);
  expect(drawTrail(TRAIL_WIDTH.wide, xs, 2)).toEqual(plate);
});

test('the stone of this session is lit', () => {
  const { xs } = layTrail(5, 2, TRAIL_WIDTH.wide);
  const at = (plate: Uint8Array, x: number) => [...plate.slice((20 * TRAIL_WIDTH.wide + x) * 4, (20 * TRAIL_WIDTH.wide + x) * 4 + 3)];
  const mango = [0xa8, 0x74, 0x00];
  const ochre = [0xe9, 0xd9, 0xae];
  const lit = drawTrail(TRAIL_WIDTH.wide, xs, 2);
  expect([mango, ochre]).toContainEqual(at(lit, xs[2]!));
  expect([mango, ochre]).not.toContainEqual(at(lit, xs[1]!));
});

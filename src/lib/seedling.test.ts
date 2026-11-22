import { describe, expect, it } from 'vitest';
import type { Row } from './braille';
import { draw, grow } from './herbarium';
import { drawFlower, drawPageFlower, drawSeedling } from './seedling';

const footprint = (rows: Row[]) => ({ width: rows[0]!.map((run) => run.t).join('').length, height: rows.length });
const empty = (row: Row) => row.every((run) => /^⠀+$/.test(run.t));

describe('drawSeedling', () => {
  it('stands in a flower’s footprint, for the plant and for the mark', () => {
    for (const form of ['plant', 'mark'] as const) {
      expect(footprint(drawSeedling(form))).toEqual(footprint(draw(grow('notes/any'), { wind: 0, form })));
    }
  });

  it('stands in a head’s square footprint, at every size', () => {
    for (const size of [1, 2, 3, 5]) {
      expect(footprint(drawSeedling('head', size))).toEqual(footprint(draw(grow('notes/any'), { wind: 0, form: 'head', size })));
    }
  });

  it('takes a head’s size only as a whole number of rows', () => {
    for (const size of [undefined, 0, 1.5]) expect(() => drawSeedling('head', size)).toThrow(RangeError);
  });

  it('sprouts a head from the middle of its foot, and from nowhere else on it', () => {
    const foot = drawSeedling('head', 3).at(-1)!.map((run) => run.t).join('');
    expect([...foot].map((ch) => ch !== '⠀')).toEqual([false, false, false, true, false, false]);
  });

  it('stands on the ground, and leaves the top of the footprint empty', () => {
    const plant = drawSeedling('plant');
    expect(empty(plant.at(-1)!)).toBe(false);
    expect(empty(plant[0]!)).toBe(true);
  });
});

describe('drawFlower', () => {
  it('draws the flower a seed grows, at the wind given', () => {
    expect(drawFlower('posts/a-post', false, 'plant', 0.5)).toEqual(
      draw(grow('posts/a-post'), { wind: 0.5, form: 'plant' }),
    );
  });

  it('draws the seedling for a stub, whatever the wind', () => {
    expect(drawFlower('posts/a-stub', true, 'plant', -0.7)).toEqual(drawSeedling('plant'));
  });
});

describe('drawPageFlower', () => {
  it('draws a written page’s flower, grown from its collection and slug', () => {
    expect(drawPageFlower('posts', 'a-post', 'Some text.', 'mark')).toEqual(
      draw(grow('posts/a-post'), { wind: 0, form: 'mark' }),
    );
  });

  it('draws a written page’s head at the size asked', () => {
    expect(drawPageFlower('notes', 'a-note', 'Some text.', 'head', 2)).toEqual(
      draw(grow('notes/a-note'), { wind: 0, form: 'head', size: 2 }),
    );
    expect(drawPageFlower('notes', 'a-stub', '', 'head', 2)).toEqual(drawSeedling('head', 2));
  });

  it('draws the seedling for a stub', () => {
    expect(drawPageFlower('notes', 'a-stub', '\n', 'plant')).toEqual(drawSeedling('plant'));
  });
});

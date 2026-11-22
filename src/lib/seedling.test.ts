import { describe, expect, it } from 'vitest';
import type { Row } from './braille';
import { draw, grow } from './herbarium';
import { drawPageFlower, drawSeedling } from './seedling';

const footprint = (rows: Row[]) => ({ width: rows[0]!.map((run) => run.t).join('').length, height: rows.length });
const empty = (row: Row) => row.every((run) => /^⠀+$/.test(run.t));

describe('drawSeedling', () => {
  it('stands in a flower’s footprint, for the plant and for the mark', () => {
    for (const form of ['plant', 'mark'] as const) {
      expect(footprint(drawSeedling(form))).toEqual(footprint(draw(grow('notes/any'), { wind: 0, form })));
    }
  });

  it('stands on the ground, and leaves the top of the footprint empty', () => {
    const plant = drawSeedling('plant');
    expect(empty(plant.at(-1)!)).toBe(false);
    expect(empty(plant[0]!)).toBe(true);
  });
});

describe('drawPageFlower', () => {
  it('draws a written page’s flower, grown from its collection and slug', () => {
    expect(drawPageFlower('posts', 'a-post', 'Some text.', 'mark')).toEqual(
      draw(grow('posts/a-post'), { wind: 0, form: 'mark' }),
    );
  });

  it('draws the seedling for a stub', () => {
    expect(drawPageFlower('notes', 'a-stub', '\n', 'plant')).toEqual(drawSeedling('plant'));
  });
});

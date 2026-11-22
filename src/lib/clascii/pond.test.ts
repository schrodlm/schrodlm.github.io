import { describe, expect, test } from 'vitest';
import { compose, farthest, NEW, OLD, spread, WATER } from './pond';

describe('the spreading ring', () => {
  test('starts as a drop of water in the old art and ends having covered every cell with new art', () => {
    const drop = { x: 9, y: 2 };
    const first = spread(drop, 0, 10, 5);
    expect(first[2 * 10 + 9]).toBe(WATER);
    expect(first.filter((cell) => cell !== OLD)).toHaveLength(1);
    expect([...spread(drop, farthest(drop, 10, 5), 10, 5)].every((cell) => cell === NEW)).toBe(true);
  });

  test('is water at its edge, new inside it and old beyond, a row counting as two columns', () => {
    const cells = spread({ x: 0, y: 0 }, 4, 8, 3);
    const at = (x: number, y: number) => cells[y * 8 + x];
    expect([at(0, 0), at(2, 0), at(3, 0), at(4, 0), at(5, 0)]).toEqual([NEW, NEW, WATER, WATER, OLD]);
    expect([at(0, 1), at(0, 2)]).toEqual([NEW, WATER]);
  });
});

describe('the pond while it spreads', () => {
  const cells = Uint8Array.from([NEW, WATER, OLD, OLD]);

  test('shows the new art, the ring as water, and the old art beyond it', () => {
    expect(compose(['abcd'], ['wxyz'], cells)).toEqual(['a~yz']);
  });

  test('is still beyond the ring when there was no art, or it was another size', () => {
    expect(compose(['abcd'], undefined, cells)).toEqual(['a~  ']);
    expect(compose(['abcd'], ['wxyzz'], cells)).toEqual(['a~  ']);
  });
});

import { describe, expect, it } from 'vitest';
import { createCanvas } from './canvas';

describe('createCanvas', () => {
  it('is two dots across and four down per cell', () => {
    const canvas = createCanvas(3, 2);
    expect([canvas.dotWidth, canvas.dotHeight]).toEqual([6, 8]);
  });

  it('lets a heavier dot win and a lighter one leave it be', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0, 0, 'stem', 1);
    canvas.put(0, 0, 'petal', 3);
    canvas.put(0, 0, 'stem', 1);
    expect(canvas.dot(0, 0)).toEqual({ colour: 'petal', weight: 3 });
  });

  it('lets the later dot win at equal weight', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0, 0, 'first', 2);
    canvas.put(0, 0, 'second', 2);
    expect(canvas.dot(0, 0)?.colour).toBe('second');
  });

  it('rounds to the nearest dot and ignores dots off the canvas', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0.6, 1.4, 'red');
    canvas.put(-1, 0, 'red');
    canvas.put(2, 0, 'red');
    canvas.put(0, 4, 'red');
    const drawn: [number, number][] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) if (canvas.dot(x, y)) drawn.push([x, y]);
    expect(drawn).toEqual([[1, 1]]);
  });

  it('has nothing outside its edges', () => {
    const canvas = createCanvas(1, 1);
    expect(canvas.dot(-1, 0)).toBeNull();
    expect(canvas.dot(2, 0)).toBeNull();
  });

  it('refuses a size that is not whole cells', () => {
    expect(() => createCanvas(1.5, 2)).toThrow(RangeError);
  });
});

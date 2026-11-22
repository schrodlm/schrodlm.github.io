import { describe, expect, it } from 'vitest';
import { createCanvas, type DotCanvas } from './canvas';
import { blade, curve, disc, line, oval, ring } from './draw';

const ink = { colour: 'ink' };

// The canvas's dots as text, '#' where a dot is drawn, one string per dot row.
const picture = (canvas: DotCanvas) =>
  Array.from({ length: canvas.dotHeight }, (_, y) =>
    Array.from({ length: canvas.dotWidth }, (_, x) => (canvas.dot(x, y) ? '#' : '.')).join(''),
  );

const count = (canvas: DotCanvas) => picture(canvas).join('').split('#').length - 1;

// Every drawn dot touches another, across or diagonally, so the stroke reads unbroken.
const connected = (canvas: DotCanvas) => {
  const dots: [number, number][] = [];
  for (let y = 0; y < canvas.dotHeight; y++) for (let x = 0; x < canvas.dotWidth; x++) if (canvas.dot(x, y)) dots.push([x, y]);
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const [x, y] = dots[queue.pop()!]!;
    dots.forEach(([u, v], j) => {
      if (!seen.has(j) && Math.abs(u - x) <= 1 && Math.abs(v - y) <= 1) {
        seen.add(j);
        queue.push(j);
      }
    });
  }
  return seen.size === dots.length;
};

describe('line', () => {
  it('draws a horizontal line from end to end', () => {
    const canvas = createCanvas(3, 1);
    line(canvas, [0, 1], [5, 1], ink);
    expect(picture(canvas)).toEqual(['......', '######', '......', '......']);
  });

  it('draws a diagonal unbroken', () => {
    const canvas = createCanvas(2, 1);
    line(canvas, [0, 0], [3, 3], ink);
    expect(picture(canvas)).toEqual(['#...', '.#..', '..#.', '...#']);
  });

  it('draws with its ink and weight', () => {
    const canvas = createCanvas(1, 1);
    line(canvas, [0, 0], [1, 0], { colour: 'mango', weight: 3 });
    expect(canvas.dot(1, 0)).toEqual({ colour: 'mango', weight: 3 });
  });
});

describe('curve', () => {
  it('runs from end to end through the pull of its control point', () => {
    const canvas = createCanvas(6, 3);
    curve(canvas, [0, 10], [6, 0], [11, 10], ink);
    expect(canvas.dot(0, 10)).not.toBeNull();
    expect(canvas.dot(11, 10)).not.toBeNull();
    expect(canvas.dot(6, 5)).not.toBeNull();
    expect(canvas.dot(6, 10)).toBeNull();
    expect(connected(canvas)).toBe(true);
  });
});

describe('disc', () => {
  it('fills a circle', () => {
    const canvas = createCanvas(4, 2);
    disc(canvas, [3, 3], 2, ink);
    expect(picture(canvas)).toEqual([
      '........',
      '...#....',
      '..###...',
      '.#####..',
      '..###...',
      '...#....',
      '........',
      '........',
    ]);
  });
});

describe('ring', () => {
  it('draws only the outline, unbroken', () => {
    const canvas = createCanvas(6, 3);
    ring(canvas, [6, 6], 4, ink);
    expect(canvas.dot(6, 6)).toBeNull();
    expect(canvas.dot(10, 6)).not.toBeNull();
    expect(canvas.dot(6, 2)).not.toBeNull();
    expect(connected(canvas)).toBe(true);
  });
});

describe('oval', () => {
  it('stretches along its long axis', () => {
    const canvas = createCanvas(8, 3);
    oval(canvas, [8, 6], 6, 2, 0, ink);
    expect(canvas.dot(14, 6)).not.toBeNull();
    expect(canvas.dot(8, 9)).toBeNull();
  });

  it('turns by its angle', () => {
    const canvas = createCanvas(8, 3);
    oval(canvas, [8, 6], 6, 2, Math.PI / 2, ink);
    expect(canvas.dot(8, 11)).not.toBeNull();
    expect(canvas.dot(13, 6)).toBeNull();
  });
});

describe('blade', () => {
  it('is pointed at both ends and widest a third of the way along', () => {
    const canvas = createCanvas(12, 2);
    blade(canvas, [0, 4], [12, 4], [23, 4], 4, ink);
    const column = (x: number) => picture(canvas).filter((row) => row[x] === '#').length;
    expect(column(0)).toBeLessThanOrEqual(2);
    expect(column(23)).toBe(1);
    expect(column(8)).toBeGreaterThanOrEqual(4);
    expect(column(8)).toBeGreaterThan(column(18));
    expect(connected(canvas)).toBe(true);
  });

  it('draws more dots the wider it is', () => {
    const thin = createCanvas(12, 2);
    const wide = createCanvas(12, 2);
    blade(thin, [0, 4], [12, 4], [23, 4], 1, ink);
    blade(wide, [0, 4], [12, 4], [23, 4], 4, ink);
    expect(count(wide)).toBeGreaterThan(count(thin));
  });
});

import { describe, expect, it } from 'vitest';
import { createCanvas } from './canvas';
import { encode, markup, stamp } from './encode';

const code = (ch: string) => ch.charCodeAt(0) - 0x2800;

describe('encode', () => {
  it('puts each dot of a cell on its Unicode braille bit', () => {
    const expected = [
      [0, 0, 0x01],
      [0, 1, 0x02],
      [0, 2, 0x04],
      [1, 0, 0x08],
      [1, 1, 0x10],
      [1, 2, 0x20],
      [0, 3, 0x40],
      [1, 3, 0x80],
    ] as const;
    for (const [x, y, bit] of expected) {
      const canvas = createCanvas(1, 1);
      canvas.put(x, y, 'red');
      expect(code(encode(canvas)[0]![0]!.t)).toBe(bit);
    }
  });

  it('fills a cell with every dot as U+28FF', () => {
    const canvas = createCanvas(1, 1);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) canvas.put(x, y, 'red');
    expect(encode(canvas)).toEqual([[{ t: '⣿', c: 'red' }]]);
  });

  it('places cells by their dots: two across, four down', () => {
    const canvas = createCanvas(2, 2);
    canvas.put(2, 0, 'red');
    canvas.put(0, 4, 'blue');
    expect(encode(canvas)).toEqual([
      [
        { t: '⠀', c: 'transparent' },
        { t: '⠁', c: 'red' },
      ],
      [
        { t: '⠁', c: 'blue' },
        { t: '⠀', c: 'transparent' },
      ],
    ]);
  });

  it('gives a cell the colour whose dots weigh the most', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0, 0, 'stem', 1);
    canvas.put(0, 1, 'stem', 1);
    canvas.put(1, 0, 'petal', 3);
    expect(encode(canvas)[0]![0]!.c).toBe('petal');
  });

  it('counts the dots, not only the heaviest one', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0, 0, 'petal', 2);
    for (let y = 0; y < 3; y++) canvas.put(1, y, 'stem', 1);
    expect(encode(canvas)[0]![0]!.c).toBe('stem');
  });

  it('breaks a tie for the colour met first, reading the cell row by row', () => {
    const canvas = createCanvas(1, 1);
    canvas.put(0, 3, 'late');
    canvas.put(1, 0, 'early');
    expect(encode(canvas)[0]![0]!.c).toBe('early');
  });

  it('merges neighbouring cells of one colour into a run', () => {
    const canvas = createCanvas(5, 1);
    for (const x of [0, 2, 4]) canvas.put(x, 0, 'red');
    canvas.put(6, 0, 'blue');
    expect(encode(canvas)).toEqual([
      [
        { t: '⠁⠁⠁', c: 'red' },
        { t: '⠁', c: 'blue' },
        { t: '⠀', c: 'transparent' },
      ],
    ]);
  });

  it('keeps empty cells as transparent runs of blank braille', () => {
    const canvas = createCanvas(3, 1);
    canvas.put(2, 0, 'red');
    expect(encode(canvas)).toEqual([
      [
        { t: '⠀', c: 'transparent' },
        { t: '⠁', c: 'red' },
        { t: '⠀', c: 'transparent' },
      ],
    ]);
  });

  it('gives every row the canvas width in characters', () => {
    const canvas = createCanvas(7, 3);
    canvas.put(5, 5, 'red');
    const rows = encode(canvas);
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.map((r) => r.t).join('')).toHaveLength(7);
  });
});

describe('markup', () => {
  it('sets coloured runs in spans of their colour and leaves empty runs bare', () => {
    expect(
      markup([
        { t: '⠀⠀', c: 'transparent' },
        { t: '⠁⠂', c: 'var(--fern)' },
      ]),
    ).toBe('⠀⠀<span style="color: var(--fern)">⠁⠂</span>');
  });
});

describe('stamp', () => {
  const drawing = () => {
    const canvas = createCanvas(3, 2);
    canvas.put(0, 0, 'red');
    canvas.put(3, 5, 'blue');
    canvas.put(5, 7, 'red');
    return encode(canvas);
  };

  it('lays a drawing on a whole cell so it encodes again as it was', () => {
    const canvas = createCanvas(3, 2);
    stamp(canvas, drawing(), 0, 0);
    expect(encode(canvas)).toEqual(drawing());
  });

  it('lays it at a cell offset, each dot in its run’s colour', () => {
    const canvas = createCanvas(6, 4);
    stamp(canvas, drawing(), 2, 1);
    expect(canvas.dot(4, 4)).toEqual({ colour: 'red', weight: 1 });
    expect(canvas.dot(7, 9)).toEqual({ colour: 'blue', weight: 1 });
    expect(canvas.dot(9, 11)).toEqual({ colour: 'red', weight: 1 });
    expect(canvas.dot(0, 0)).toBeNull();
  });

  it('lays its dots with a weight, and lays none for empty cells', () => {
    const canvas = createCanvas(3, 2);
    canvas.put(1, 1, 'green', 5);
    stamp(canvas, [[{ t: '⣿', c: 'red' }, { t: '⠀⠀', c: 'transparent' }]], 0, 0, 2);
    expect(canvas.dot(0, 0)).toEqual({ colour: 'red', weight: 2 });
    expect(canvas.dot(1, 1)).toEqual({ colour: 'green', weight: 5 });
    expect(canvas.dot(2, 0)).toBeNull();
  });

  it('drops what falls outside the canvas', () => {
    const canvas = createCanvas(1, 2);
    stamp(canvas, drawing(), -1, 0);
    expect(encode(canvas)).toEqual([[{ t: '⠀', c: 'transparent' }], [{ t: '⠐', c: 'blue' }]]);
  });
});

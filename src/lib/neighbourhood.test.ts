import { describe, expect, it } from 'vitest';
import { createCanvas, encode, type Row } from './braille';
import { linkGraph, type Page } from './graph';
import {
  besideHead,
  drawNeighbourhood,
  layNeighbourhood,
  mostly,
  MOST_FAR,
  PER_SIDE,
  PLATE_WIDTH,
  SIZES,
  type Neighbourhood,
} from './neighbourhood';

/** A garden from a list of links, `from → to`, every note named in them existing. */
function garden(...links: string[]) {
  const out = new Map<string, string[]>();
  for (const link of links) {
    const [from, to] = link.split(' → ') as [string, string];
    out.set(from, [...(out.get(from) ?? []), to]);
    if (!out.has(to)) out.set(to, []);
  }
  const pages: Page[] = [...out].map(([slug, targets]) => ({ slug, html: targets.map((t) => `<a href="/notes/${t}/">x</a>`).join('') }));
  return linkGraph(pages, '/');
}

const title = (slug: string) => slug.toUpperCase();
const lay = (graph: ReturnType<typeof garden>, slug: string) => layNeighbourhood(graph, slug, title)!;
const names = (hood: Neighbourhood, side: -1 | 1) => hood.near.filter((n) => n.side === side).map((n) => n.slug);

// A head of the right footprint, every dot of it inked in one colour.
const head = (colour: string) => (_slug: string, size: number) => {
  const canvas = createCanvas(size * 2, size);
  for (let y = 0; y < canvas.dotHeight; y++) for (let x = 0; x < canvas.dotWidth; x++) canvas.put(x, y, colour);
  return encode(canvas);
};

const text = (rows: Row[]) => rows.map((row) => row.map((run) => run.t).join(''));
const inked = (rows: Row[], [x, y]: readonly [number, number]) => text(rows)[y]![x] !== '⠀';

describe('layNeighbourhood', () => {
  it('gives a note with no links no plate', () => {
    expect(layNeighbourhood(garden('a → b'), 'c', title)).toBeUndefined();
  });

  it('stands the notes linking here on the left, the notes it links to on the right, A to Z', () => {
    const hood = lay(garden('me → zeta', 'me → alpha', 'in → me', 'other → me'), 'me');
    expect(names(hood, -1)).toEqual(['in', 'other']);
    expect(names(hood, 1)).toEqual(['alpha', 'zeta']);
    expect(hood.near.map((n) => n.role)).toEqual(['in', 'in', 'out', 'out']);
  });

  it('puts a note linked both ways on the shorter side', () => {
    const lean = lay(garden('me → a', 'me → b', 'both → me', 'me → both'), 'me');
    expect(names(lean, -1)).toEqual(['both']);
    expect(lean.near.find((n) => n.slug === 'both')!.role).toBe('both');
    const even = lay(garden('me → a', 'in → me', 'both → me', 'me → both'), 'me');
    expect(names(even, 1)).toEqual(['a', 'both']);
  });

  it('shows the best-linked few on each side, and counts the rest', () => {
    const links = Array.from({ length: PER_SIDE + 3 }, (_, i) => `me → n${i}`);
    // n7 is linked from elsewhere too, so it is kept over the others.
    const hood = lay(garden(...links, 'x → n7', 'y → n7'), 'me');
    expect(names(hood, 1)).toHaveLength(PER_SIDE);
    expect(names(hood, 1)).toContain('n7');
    expect(names(hood, 1)).toEqual(['n0', 'n1', 'n2', 'n3', 'n7']);
    expect(hood.unshown).toBe(3);
  });

  it('keeps notes linked both ways over the better linked', () => {
    const links = Array.from({ length: PER_SIDE }, (_, i) => `n${i} → me`);
    const hood = lay(garden(...links, 'n0 → x', 'n1 → x', 'me → both', 'both → me', 'me → a', 'me → b', 'me → c', 'me → d', 'me → e'), 'me');
    expect(names(hood, 1)).toContain('both');
  });

  it('sets the note in the middle of a plate the reading column wide, and grows it for more neighbours', () => {
    const small = lay(garden('me → a'), 'me');
    expect(small.width).toBe(PLATE_WIDTH);
    expect(small.height % 2).toBe(1);
    expect(small.self).toEqual({ slug: 'me', cell: [PLATE_WIDTH / 2 - SIZES.self, (small.height - SIZES.self) / 2] });
    const tall = lay(garden(...Array.from({ length: PER_SIDE }, (_, i) => `me → n${i}`)), 'me');
    expect(tall.height).toBeGreaterThan(small.height);
  });

  it('keeps every head inside the plate, apart from the others, and the neighbours level with their side', () => {
    const links = Array.from({ length: PER_SIDE }, (_, i) => [`me → o${i}`, `i${i} → me`]).flat();
    const hood = lay(garden(...links, 'o0 → f0', 'o1 → f1', 'i0 → f2', 'i1 → f3', 'o2 → f4', 'i2 → f5', 'i3 → f6'), 'me');
    const boxes = [
      { cell: hood.self.cell, size: SIZES.self },
      ...hood.near.map((n) => ({ cell: n.cell, size: SIZES.near })),
      ...hood.far.map((n) => ({ cell: n.cell, size: SIZES.far })),
    ];
    for (const { cell: [x, y], size } of boxes) {
      expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(1);
      expect(x + size * 2).toBeLessThanOrEqual(hood.width - 1);
      expect(y + size).toBeLessThanOrEqual(hood.height - 1);
    }
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const apart =
          a.cell[0] + a.size * 2 <= b.cell[0] || b.cell[0] + b.size * 2 <= a.cell[0] || a.cell[1] + a.size <= b.cell[1] || b.cell[1] + b.size <= a.cell[1];
        expect(apart).toBe(true);
      }
    }
    for (const n of hood.near) expect(Math.sign(n.cell[0] + SIZES.near - hood.width / 2)).toBe(n.side);
  });

  it('shows a few of the notes two steps away, those reached through the most neighbours first', () => {
    const links = Array.from({ length: MOST_FAR + 2 }, (_, i) => `a → f${i}`);
    const hood = lay(garden('me → a', 'me → b', ...links, 'b → f7', 'me → c', 'c → f7'), 'me');
    expect(hood.far).toHaveLength(MOST_FAR);
    expect(hood.far.map((n) => n.slug)).toContain('f7');
  });

  it('leaves out the notes two steps away only through a neighbour not shown', () => {
    const links = Array.from({ length: PER_SIDE + 1 }, (_, i) => `me → n${i}`);
    const hubs = Array.from({ length: PER_SIDE }, (_, i) => `n${i} → hub`);
    // n5 is the one left off the plate, so far is out of sight with it.
    const hood = lay(garden(...links, ...hubs, 'n5 → far'), 'me');
    expect(names(hood, 1)).not.toContain('n5');
    expect(hood.far.map((n) => n.slug)).toEqual(['hub']);
  });

  it('sets the notes two steps away above and below the note, leaning to the side they hang from', () => {
    const hood = lay(garden('me → r', 'l → me', 'r → fr1', 'r → fr2', 'l → fl1', 'l → fl2'), 'me');
    const middle = hood.self.cell[0] + SIZES.self;
    const above = hood.far.filter((n) => n.cell[1] < hood.self.cell[1]);
    const below = hood.far.filter((n) => n.cell[1] >= hood.self.cell[1] + SIZES.self);
    expect(above.length + below.length).toBe(4);
    expect(above.length).toBe(2);
    for (const n of hood.far) expect(Math.sign(n.cell[0] + SIZES.far - middle)).toBe(n.slug.startsWith('fl') ? -1 : 1);
  });
});

describe('besideHead', () => {
  const hood = lay(garden('me → right', 'left → me'), 'me');
  const [left, right] = hood.near as [Neighbourhood['near'][0], Neighbourhood['near'][0]];

  it('stands text beyond a head on its outer side, at its middle row, in % of the plate', () => {
    const r = besideHead(hood, right, 1);
    expect(r.edge).toBe('left');
    expect(r.inset).toBeCloseTo((100 * (right.cell[0] + SIZES.near * 2 + 1)) / hood.width);
    expect(r.top).toBeCloseTo((100 * (right.cell[1] + SIZES.near / 2)) / hood.height);
    const l = besideHead(hood, left, 1);
    expect(l.edge).toBe('right');
    expect(l.inset).toBeCloseTo((100 * (hood.width - left.cell[0] + 1)) / hood.width);
  });

  it('leaves the text the room up to the plate’s edge, less a margin', () => {
    for (const n of [left, right]) {
      const at = besideHead(hood, n, 1);
      expect(at.inset + at.room).toBeCloseTo(100 - 200 / hood.width);
    }
  });
});

describe('drawNeighbourhood', () => {
  const graph = garden('me → out', 'in → me', 'me → both', 'both → me', 'out → far');
  const hood = lay(graph, 'me');
  const drawing = drawNeighbourhood(hood, head('#123456'));
  const size = (rows: Row[]) => ({ width: text(rows)[0]!.length, height: rows.length });

  it('draws every layer the size of the plate', () => {
    for (const rows of [drawing.plate, drawing.far, ...drawing.vines.map((v) => v.rows)]) {
      expect(size(rows)).toEqual({ width: hood.width, height: hood.height });
    }
  });

  it('frames the plate and stamps the note’s head and its neighbours’ on it, and the far heads apart', () => {
    const rows = text(drawing.plate);
    expect(rows[0]).not.toContain('⠀');
    expect(rows.at(-1)).not.toContain('⠀');
    expect(rows.every((row) => row[0] !== '⠀' && row.at(-1) !== '⠀')).toBe(true);
    for (const { cell } of [hood.self, ...hood.near]) expect(inked(drawing.plate, cell)).toBe(true);
    for (const { cell } of hood.far) {
      expect(inked(drawing.far, cell)).toBe(true);
      expect(inked(drawing.plate, cell)).toBe(false);
    }
  });

  it('draws each vine alone, in the colour of the element it is set in, between the heads', () => {
    expect(drawing.vines).toHaveLength(hood.near.length);
    for (const vine of drawing.vines) {
      expect(vine.colour).toBe('#123456');
      const colours = new Set(vine.rows.flat().filter((run) => run.c !== 'transparent').map((run) => run.c));
      expect([...colours]).toEqual(['currentColor']);
      for (const { cell } of [hood.self, ...hood.near]) expect(inked(vine.rows, cell)).toBe(false);
    }
  });

  it('dots a vine from a note that only links here, and draws the others solid', () => {
    const dots = (rows: Row[]) => [...text(rows).join('')].reduce((sum, ch) => sum + (ch.charCodeAt(0) - 0x2800).toString(2).replace(/0/g, '').length, 0);
    const vine = (role: string) => drawing.vines[hood.near.findIndex((n) => n.role === role)]!.rows;
    expect(dots(vine('in'))).toBeLessThan(dots(vine('out')) / 2);
  });
});

describe('mostly', () => {
  it('names the colour most of a drawing’s dots are in, counting dots rather than cells', () => {
    expect(mostly([[{ t: '⣿', c: 'red' }, { t: '⠁⠁', c: 'blue' }, { t: '⠀⠀⠀', c: 'transparent' }]])).toBe('red');
    expect(mostly([[{ t: '⠁', c: 'red' }, { t: '⠃', c: 'blue' }]])).toBe('blue');
  });
});

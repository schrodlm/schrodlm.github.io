import { describe, expect, it } from 'vitest';
import type { Row } from './braille';
import { linkGraph, type Page } from './graph';
import { CELL, drawGarden, footprint, gardenVines, headSize, layGarden, overlap, placeCaptions, PLATE_WIDTH, ROW, type GardenLayout } from './graph-view';
import { inventedGarden, inventedPages } from '../../tests/kit/invented-garden';

/** A garden from a list of links, `from → to`, and lone notes, every note named in them existing. */
function garden(...entries: string[]) {
  const out = new Map<string, string[]>();
  for (const entry of entries) {
    const [from, to] = entry.split(' → ') as [string, string | undefined];
    out.set(from, [...(out.get(from) ?? []), ...(to ? [to] : [])]);
    if (to && !out.has(to)) out.set(to, []);
  }
  const pages: Page[] = [...out].map(([slug, targets]) => ({ slug, html: targets.map((t) => `<a href="/notes/${t}/">x</a>`).join('') }));
  return linkGraph(pages, '/');
}

const invented = inventedGarden();
const big = linkGraph(inventedPages(invented), '/');
const bigLayout = layGarden(big);
const titles = new Map(invented.map((note) => [note.slug, note.title]));

const flower = (layout: GardenLayout, slug: string) => layout.flowers.find((f) => f.slug === slug)!;
const centre = (layout: GardenLayout, slug: string) => {
  const { x, y, w } = footprint(flower(layout, slug));
  return [x + w / 2, (y + w / 4) * 2] as const;
};

describe('headSize', () => {
  it('grows a head with its links, in tiers', () => {
    expect([0, 1, 2, 3, 5, 6, 11, 12, 40].map(headSize)).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('gardenVines', () => {
  it('holds every link once, whichever way it runs, in order of its ends', () => {
    const vines = gardenVines(garden('b → a', 'a → b', 'a → c'));
    expect(vines.map((v) => v.ends)).toEqual([
      ['a', 'b'],
      ['a', 'c'],
    ]);
  });

  it('marks as strongest a tree through each group, by its best-linked pairs', () => {
    // A hub with four leaves, two of them also linked to each other, and a pair on its own.
    const graph = garden('hub → a', 'hub → b', 'hub → c', 'hub → d', 'a → b', 'x → y');
    const strong = gardenVines(graph)
      .filter((v) => v.strong)
      .map((v) => v.ends.join('–'));
    expect(strong).toEqual(['a–hub', 'b–hub', 'c–hub', 'd–hub', 'x–y']);
  });

  it('draws a calm share of a big garden at rest: one vine fewer than each group has notes', () => {
    const vines = bigLayout.vines;
    const linked = bigLayout.flowers.filter((f) => !f.wild).length;
    const strong = vines.filter((v) => v.strong).length;
    expect(strong).toBeLessThan(vines.length);
    expect(linked - strong).toBeGreaterThan(1);
    expect(linked - strong).toBeLessThan(15);
  });
});

describe('layGarden', () => {
  it('lays out the same garden the same way every time, whatever order its notes come in', () => {
    const again = layGarden(linkGraph([...inventedPages(invented)].reverse(), '/'));
    expect(again).toEqual(bigLayout);
  });

  it('keeps a group where it was when a wildflower is added', () => {
    const before = layGarden(garden('a → b', 'b → c', 'c → a', 'a → d'));
    const after = layGarden(garden('a → b', 'b → c', 'c → a', 'a → d', 'lone'));
    for (const slug of ['a', 'b', 'c', 'd']) expect(flower(after, slug).cell).toEqual(flower(before, slug).cell);
    expect(flower(after, 'lone').wild).toBe(true);
  });

  it('sizes each head by its links and centres a hub among its leaves', () => {
    const leaves = 'abcdefghijkl'.split('');
    const layout = layGarden(garden(...leaves.map((leaf) => `hub → ${leaf}`)));
    expect(flower(layout, 'hub').size).toBe(4);
    expect(flower(layout, 'a').size).toBe(1);
    const [hx, hy] = centre(layout, 'hub');
    const [mx, my] = leaves.map((leaf) => centre(layout, leaf)).reduce(([x, y], [a, b]) => [x + a / leaves.length, y + b / leaves.length], [0, 0]);
    const off = Math.hypot(hx - mx, hy - my);
    for (const leaf of leaves) {
      const [x, y] = centre(layout, leaf);
      expect(Math.hypot(x - mx, y - my)).toBeGreaterThan(off);
    }
  });

  it('stands the wildflowers in their own bed, below every linked note', () => {
    const wild = bigLayout.flowers.filter((f) => f.wild);
    expect(wild.length).toBeGreaterThan(10);
    const bed = bigLayout.bed!;
    for (const f of bigLayout.flowers) {
      if (f.wild) expect(f.cell[1]).toBeGreaterThan(bed);
      else expect(f.cell[1] + f.size).toBeLessThanOrEqual(bed);
    }
  });

  it('keeps every flower of a big garden on the plate, and no two touching', () => {
    expect(bigLayout.width).toBeLessThanOrEqual(PLATE_WIDTH);
    const boxes = bigLayout.flowers.map(footprint);
    for (const [i, a] of boxes.entries()) {
      expect(a.x).toBeGreaterThanOrEqual(1);
      expect(a.y).toBeGreaterThanOrEqual(1);
      expect(a.x + a.w).toBeLessThanOrEqual(bigLayout.width - 1);
      expect(a.y + a.h).toBeLessThanOrEqual(bigLayout.height - 1);
      for (const b of boxes.slice(i + 1)) expect(overlap(a, b)).toBe(false);
    }
  });

  it('keeps a small garden small enough to see whole on a phone', () => {
    const layout = layGarden(garden('a → b', 'b → c', 'lone'));
    expect(layout.width * CELL).toBeLessThanOrEqual(342);
    expect(layout.bed).toBeDefined();
  });

  it('draws an empty garden as an empty plate', () => {
    const layout = layGarden(garden());
    expect(layout.flowers).toEqual([]);
    expect(layout.bed).toBeUndefined();
  });
});

describe('placeCaptions', () => {
  const captions = placeCaptions(bigLayout, (slug) => titles.get(slug)!);
  const heads = bigLayout.flowers.map((f) => {
    const { x, y, w, h } = footprint(f);
    return { slug: f.slug, x: x * CELL, y: y * ROW, w: w * CELL, h: h * ROW };
  });

  it('captions every note, and a hub at rest where it fits cleanly', () => {
    expect(captions.size).toBe(bigLayout.flowers.length);
    const resting = [...captions].filter(([, c]) => c.atRest).map(([slug]) => slug);
    expect(resting.length).toBeGreaterThan(10);
    for (const slug of resting) expect(flower(bigLayout, slug).hub).toBe(true);
    // The best-linked note of all is named.
    const best = [...bigLayout.flowers].sort((a, b) => b.degree - a.degree)[0]!;
    expect(resting).toContain(best.slug);
  });

  it('keeps resting captions on the plate, off every head and off each other', () => {
    const resting = [...captions].filter(([, c]) => c.atRest);
    for (const [i, [slug, c]] of resting.entries()) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(bigLayout.width * CELL);
      expect(c.y + c.h).toBeLessThanOrEqual(bigLayout.height * ROW);
      expect(heads.filter((h) => h.slug !== slug && overlap(c, h))).toEqual([]);
      for (const [, other] of resting.slice(i + 1)) expect(overlap(c, other)).toBe(false);
    }
  });
});

describe('drawGarden', () => {
  const drawing = drawGarden(bigLayout);
  const inked = (rows: Row[]) => rows.flatMap((row) => row.flatMap((run) => [...run.t])).filter((ch) => ch !== '⠀').length;

  it('draws the plate at the layout’s size and a layer for every vine', () => {
    expect(drawing.plate).toHaveLength(bigLayout.height);
    expect(drawing.plate.every((row) => row.reduce((n, run) => n + [...run.t].length, 0) === bigLayout.width)).toBe(true);
    expect(drawing.vines).toHaveLength(bigLayout.vines.length);
    // Every vine shows, however near its two heads stand.
    expect(drawing.vines.filter((v) => inked(v.rows) === 0)).toEqual([]);
  });

  it('cuts each vine to its own box between its two notes, in the colour it is set in', () => {
    bigLayout.vines.forEach((vine, i) => {
      const { rows, cell } = drawing.vines[i]!;
      if (rows.length === 0) return;
      expect(rows.flat().every((run) => run.c === 'currentColor' || run.c === 'transparent')).toBe(true);
      const [a, b] = vine.ends.map((slug) => footprint(flower(bigLayout, slug)));
      // Its box lies within the two heads' box, give or take the vine's bow.
      const width = rows[0]!.reduce((n, run) => n + [...run.t].length, 0);
      const slack = 2 + Math.hypot(a!.x - b!.x, a!.y - b!.y) * 0.2;
      expect(cell[0]).toBeGreaterThanOrEqual(Math.min(a!.x, b!.x) - slack);
      expect(cell[0] + width).toBeLessThanOrEqual(Math.max(a!.x + a!.w, b!.x + b!.w) + slack);
    });
  });

  it('never runs a vine over a head', () => {
    const plate = drawing.plate.map((row) => row.flatMap((run) => [...run.t]));
    for (const f of bigLayout.flowers) {
      const { x, y } = footprint(f);
      for (let row = y; row < y + f.size; row++) {
        for (let col = x; col < x + f.size * 2; col++) expect(plate[row]![col]).toBe('⠀');
      }
    }
  });
});

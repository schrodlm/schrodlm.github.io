import { describe, expect, test } from 'vitest';
import { BAND_ROWS, drawBand, drawMargins, drawSoil, html, SOIL_ROWS, type Line } from './jungle';

const text = (line: Line) => line.map((run) => run.t).join('');
/** The characters of a drawing in a tone, by row. */
const inTone = (lines: Line[], tone?: string) =>
  lines.map((line) => line.map((run) => (run.tone === tone ? run.t : ' '.repeat(run.t.length))).join(''));

describe('the band', () => {
  test('is as wide as asked and stands on its ground line', () => {
    const band = drawBand(120, 0);
    expect(band).toHaveLength(BAND_ROWS);
    for (const line of band) expect(text(line)).toHaveLength(120);
    expect(inTone(band, 'bark').at(-1)).toMatch(/^[_.,]{120}$/);
  });

  test('rests in still air at tick 0, its stems straight, and leans in the wind later', () => {
    expect(inTone(drawBand(120, 0), 'leaf').join('')).toMatch(/^[ |]+$/);
    const swaying = Array.from({ length: 40 }, (_, tick) => inTone(drawBand(120, tick), 'leaf').join(''));
    expect(swaying.some((leaves) => /[/\\]/.test(leaves))).toBe(true);
  });

  test('is the same drawing every time', () => {
    expect(drawBand(80, 7)).toEqual(drawBand(80, 7));
  });
});

describe('the soil', () => {
  test('has grass on its ground line and roots below it', () => {
    const soil = drawSoil(100);
    expect(soil).toHaveLength(SOIL_ROWS);
    expect(text(soil[1]!)).toBe('_'.repeat(100));
    expect(inTone(soil.slice(2), 'bark').join('')).toMatch(/[|/\\]/);
  });
});

describe('the margins', () => {
  const margins = { cols: 160, rows: 40, x0: 20, x1: 139 };

  test('keep the page and two columns either side of it clear of all but the speckle', () => {
    for (const tick of [0, 13, 99]) {
      const lines = drawMargins(margins, tick);
      expect(lines).toHaveLength(40);
      for (const line of lines) {
        const clear = line
          .flatMap((run) => [...run.t].map((ch) => (run.tone === 'far' ? ' ' : ch)))
          .slice(margins.x0 - 2, margins.x1 + 3)
          .join('');
        expect(clear.trim()).toBe('');
      }
    }
  });

  test('grow stems from the bottom and hang vines from the top', () => {
    const lines = drawMargins(margins, 0);
    expect(inTone(lines, 'leaf').at(-1)).toContain('|');
    expect(inTone(lines, 'leaf')[0]).toMatch(/[()]/);
  });

  test('draw only the speckle when there is no room beside the page', () => {
    const lines = drawMargins({ cols: 50, rows: 20, x0: 1, x1: 48 }, 0);
    expect(lines.flat().every((run) => !run.tone || run.tone === 'far')).toBe(true);
  });
});

test('a drawing becomes lines of HTML, each tone in a span of its class, its characters escaped', () => {
  expect(html([[{ t: '<&' }, { t: '>|', tone: 'leaf' }], [{ t: ' ' }]])).toBe('&lt;&amp;<span class="leaf">&gt;|</span>\n ');
});

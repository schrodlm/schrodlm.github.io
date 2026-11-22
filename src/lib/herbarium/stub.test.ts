import { describe, expect, it } from 'vitest';
import { draw, grow, label, type Row } from '.';

const width = (row: Row) => row.map((run) => run.t).join('').length;
const footprint = (rows: Row[]) => ({ width: width(rows[0]!), height: rows.length });

describe('grow', () => {
  it('grows the same specimen from the same name', () => {
    expect(grow('notes/sample-note')).toEqual(grow('notes/sample-note'));
  });

  it('keeps the name and numbers the specimen from it', () => {
    const specimen = grow('notes/sample-note');
    expect(specimen.name).toBe('notes/sample-note');
    expect(Number.isInteger(specimen.seed)).toBe(true);
    expect(specimen.seed).not.toBe(grow('notes/another-note').seed);
    expect(specimen.latin).not.toBe('');
  });
});

describe('draw', () => {
  const specimen = grow('notes/sample-note');

  it('draws each form at its footprint', () => {
    expect(footprint(draw(specimen, { wind: 0, form: 'plant' }))).toEqual({ width: 15, height: 13 });
    expect(footprint(draw(specimen, { wind: 0, form: 'mark' }))).toEqual({ width: 3, height: 1 });
    expect(footprint(draw(specimen, { wind: 0, form: 'head', size: 1 }))).toEqual({ width: 2, height: 1 });
    expect(footprint(draw(specimen, { wind: 0, form: 'head', size: 6 }))).toEqual({ width: 12, height: 6 });
  });

  it('gives every row the same width', () => {
    const rows = draw(specimen, { wind: 0.5, form: 'plant' });
    for (const row of rows) expect(width(row)).toBe(15);
  });

  it('draws only braille characters, in CSS colours', () => {
    for (const form of ['plant', 'head', 'mark'] as const) {
      for (const run of draw(specimen, { wind: -1, form, size: 3 }).flat()) {
        expect(run.t).toMatch(/^[\u2800-\u28FF]+$/);
        expect(run.c).toMatch(/^(#[0-9A-F]{6}|transparent)$/);
      }
    }
  });

  it('draws the same construction tape for every name, never a flower', () => {
    expect(draw(grow('notes/another-note'), { wind: 0, form: 'plant' })).toEqual(
      draw(specimen, { wind: 0, form: 'plant' }),
    );
  });

  it('refuses a head without a whole number of rows for its size', () => {
    expect(() => draw(specimen, { wind: 0, form: 'head' })).toThrow(RangeError);
    expect(() => draw(specimen, { wind: 0, form: 'head', size: 0 })).toThrow(RangeError);
    expect(() => draw(specimen, { wind: 0, form: 'head', size: 2.5 })).toThrow(RangeError);
  });
});

describe('label', () => {
  it('labels every trait under construction', () => {
    const traits = label(grow('notes/sample-note'));
    expect(traits.length).toBeGreaterThan(0);
    for (const trait of traits) expect(trait.value).toBe('under construction');
  });
});

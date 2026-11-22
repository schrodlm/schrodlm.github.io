import { describe, expect, test } from 'vitest';
import { braille, characters, isBraille, OWN, settings, shown, SLIDERS, track, TRACK, type Controls } from './controls';

const PLAIN: Controls = {
  characters: 'default',
  own: '@. ',
  rotate: 0,
  flipVertical: false,
  flipHorizontal: false,
  brightness: 0,
  contrast: 1,
  invert: false,
  colors: false,
};

describe('the characters choice', () => {
  test('names a built-in table, my own characters, or braille with a dither', () => {
    expect(characters('bourke', '')).toBe('bourke');
    expect(characters(OWN, '#. ')).toEqual({ chars: '#. ' });
    expect(characters(braille('diffusion'), '')).toEqual({ braille: 'diffusion' });
  });

  test('knows a braille choice from a table', () => {
    expect([isBraille(braille('threshold')), isBraille('bourke'), isBraille(OWN)]).toEqual([true, false, false]);
  });
});

describe('the settings', () => {
  test('fill the area with as many whole cells as fit, at the cell’s shape', () => {
    const s = settings(PLAIN, { width: 6, height: 12 }, { width: 800, height: 640 });
    expect([s.maxColumns, s.maxRows, s.cellAspect]).toEqual([133, 53, 0.5]);
  });

  test('ask for at least one cell, however small the area', () => {
    const s = settings(PLAIN, { width: 6, height: 12 }, { width: 0, height: 0 });
    expect([s.maxColumns, s.maxRows]).toEqual([1, 1]);
  });

  test('leave out every filter that would change nothing', () => {
    const s = settings(PLAIN, { width: 6, height: 12 }, { width: 60, height: 60 });
    expect(s.rgbFilters).toEqual([]);
    expect(s.greyFilters).toEqual([]);
    expect(s.characters).toBe('default');
    expect(s.colors).toBe(false);
  });

  test('carry every control that is set, in the demo’s order', () => {
    const all: Controls = { ...PLAIN, characters: braille('ordered'), rotate: 90, flipVertical: true, flipHorizontal: true, brightness: -20, contrast: 1.5, invert: true, colors: true };
    const s = settings(all, { width: 5, height: 12 }, { width: 60, height: 60 });
    expect(s.rgbFilters).toEqual([
      { type: 'rotate', degrees: 90 },
      { type: 'flip', direction: 'vertical' },
      { type: 'flip', direction: 'horizontal' },
    ]);
    expect(s.greyFilters).toEqual([{ type: 'brightness', amount: -20 }, { type: 'contrast', factor: 1.5 }, { type: 'invert' }]);
    expect(s.characters).toEqual({ braille: 'ordered' });
    expect(s.colors).toBe(true);
  });
});

test('each slider shows its value its own way', () => {
  expect(SLIDERS).toEqual(['font-size', 'shrink', 'brightness', 'contrast']);
  expect(SLIDERS.map((id) => shown(id, 2))).toEqual(['2px', '2', '+2', '×2.00']);
  expect([shown('brightness', 0), shown('brightness', -5)]).toEqual(['0', '-5']);
});

describe('a slider’s track', () => {
  test('is a fixed width, with a stop every seven characters and the knob where the value sits', () => {
    expect(track(0, 0, 10)).toBe('o------:------:------:------:');
    expect(track(10, 0, 10)).toBe(':------:------:------:------o');
    expect(track(0, -128, 128)).toBe(':------:------o------:------:');
    expect(track(5, 0, 10)).toHaveLength(TRACK);
  });

  test('keeps the knob on the track for a value beyond it', () => {
    expect(track(99, 0, 10)).toBe(track(10, 0, 10));
  });
});

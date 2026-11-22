import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./garden.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, 'i'));
  if (!match?.[1]) throw new Error(`garden.css has no colour --${name}`);
  return match[1];
}

// WCAG 2 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('the palette', () => {
  it.each(['ink', 'muted', 'canopy', 'river', 'river-deep', 'earth', 'bark'])('%s reads at 4.5:1 or better on sand', (name) => {
    expect(contrast(token(name), token('sand'))).toBeGreaterThanOrEqual(4.5);
  });

  it('bark, the footer text, reads at 4.5:1 or better on the footer bar', () => {
    expect(contrast(token('bark'), token('sand-deep'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the fonts', () => {
  it('are served by the site, never fetched from Google', () => {
    expect(css).not.toMatch(/googleapis|gstatic/);
  });

  it('come in Latin and Latin Extended only', () => {
    const files = [...css.matchAll(/url\('([^']+\.woff2)'\)/g)].map((m) => m[1]);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(file).toMatch(/-latin(-ext)?-/);
  });
});

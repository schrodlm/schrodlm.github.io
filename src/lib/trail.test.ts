import { describe, expect, it } from 'vitest';
import { trail } from './trail';

const text = (seed: string) => trail(seed).map((run) => run.text).join('');

describe('trail', () => {
  it('grows the same trail from the same heading', () => {
    expect(trail('Motivace')).toEqual(trail('Motivace'));
  });

  it('grows different trails from different headings', () => {
    expect(text('Motivace')).not.toBe(text('Hlavní problém: nekonzistence'));
  });

  it('draws stems, leaves and blooms from their own characters', () => {
    const allowed = { stem: /^[~-]+$/, leaf: /^[&%]$/, bloom: /^@$/ };
    for (const seed of ['Notes', 'Motivace', 'Recent posts', '']) {
      for (const run of trail(seed)) expect(run.text).toMatch(allowed[run.part]);
    }
  });

  it('starts every trail with a few characters of bare stem', () => {
    for (const seed of ['Notes', 'Motivace', 'Recent posts', 'a', 'b', 'c']) {
      expect(text(seed).slice(0, 3)).toMatch(/^[~-]{3}$/);
    }
  });

  it('grows leaves along the way', () => {
    expect(trail('Motivace').some((run) => run.part === 'leaf')).toBe(true);
  });
});

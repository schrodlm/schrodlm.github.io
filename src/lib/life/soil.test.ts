import { describe, expect, it } from 'vitest';
import { antPath, antsAt, drawSoil, SOIL_HEIGHT, SOIL_WIDTH } from './soil';

const first = antPath[0]!;
const last = antPath[antPath.length - 1]!;
const ticks = Array.from({ length: 2000 }, (_, tick) => tick);
const near = (x: number, y: number) => antPath.some(([u, v]) => Math.hypot(u - x, v - y) <= 1);

describe('drawSoil', () => {
  it('draws braille at the soil’s footprint, in the garden’s colours', () => {
    const rows = drawSoil(0);
    expect(rows).toHaveLength(SOIL_HEIGHT);
    for (const row of rows) {
      const line = row.map((run) => run.t).join('');
      expect(line).toHaveLength(SOIL_WIDTH);
      expect(line).toMatch(/^[⠀-⣿]+$/);
      for (const run of row) expect(run.c).toMatch(/^(transparent|var\(--[a-z-]+\))$/);
    }
  });

  it('draws the same frame at the same tick, and only the ants change', () => {
    expect(drawSoil(40)).toEqual(drawSoil(40));
    const text = (tick: number) => drawSoil(tick).map((row) => row.map((run) => run.t).join(''));
    const [now, later] = [text(0), text(40)];
    const changed = now.flatMap((line, y) => [...line].flatMap((ch, x) => (ch === later[y]![x] ? [] : [x])));
    expect(changed.length).toBeGreaterThan(0);
    // Every changed cell is within reach of the ants' way.
    for (const x of changed) expect(antPath.some(([u]) => Math.abs(u / 2 - x) <= 2)).toBe(true);
  });
});

describe('antPath', () => {
  it('walks one dot a step, from the ground down to the nest', () => {
    antPath.slice(1).forEach(([x, y], i) => {
      const [u, v] = antPath[i]!;
      // A step that rounds a bend is a hair shorter, cutting the corner.
      expect(Math.hypot(x - u, y - v)).toBeGreaterThan(0.99);
      expect(Math.hypot(x - u, y - v)).toBeLessThan(1 + 1e-9);
    });
    expect(last[1]).toBeGreaterThan(first[1] + 10);
  });

  it('keeps the tunnel and the nest in the middle, where a phone sees them', () => {
    // A phone 390 px wide shows the middle 48 cells, 24 either side: 48 dots.
    for (const [x, y] of antPath) if (y > first[1]) expect(Math.abs(x - SOIL_WIDTH)).toBeLessThan(48);
  });

  it('stays within the soil', () => {
    for (const [x, y] of antPath) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(SOIL_WIDTH * 2);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(SOIL_HEIGHT * 4);
    }
  });
});

describe('antsAt', () => {
  it('keeps every ant on the way between the pile and the nest', () => {
    for (const tick of ticks) for (const ant of antsAt(tick)) expect(near(ant.x, ant.y)).toBe(true);
  });

  it('walks every ant slowly, half a dot a tick', () => {
    for (const tick of ticks.slice(1)) {
      antsAt(tick).forEach((ant, i) => {
        const before = antsAt(tick - 1)[i]!;
        expect(Math.hypot(ant.x - before.x, ant.y - before.y)).toBeLessThanOrEqual(0.5 + 1e-9);
      });
    }
  });

  it('has the ants carry a crumb down to the nest and nothing back up', () => {
    for (const tick of ticks.slice(1)) {
      antsAt(tick).forEach((ant, i) => {
        const before = antsAt(tick - 1)[i]!;
        // The tick an ant turns round at either end, it has not yet walked the new way.
        if (before.carrying !== ant.carrying) return;
        const down = Math.hypot(ant.x - last[0], ant.y - last[1]) < Math.hypot(before.x - last[0], before.y - last[1]);
        expect(ant.carrying).toBe(down);
      });
    }
  });

  it('faces every ant the way it walks', () => {
    for (const tick of ticks.slice(0, 400)) {
      antsAt(tick).forEach((ant, i) => {
        const ahead = antsAt(tick + 1)[i]!;
        // At either end of its way an ant turns round; anywhere else it faces where it goes next.
        if (ahead.carrying !== ant.carrying) return;
        const [dx, dy] = ant.heading;
        expect(dx * (ahead.x - ant.x) + dy * (ahead.y - ant.y)).toBeGreaterThan(0);
      });
    }
  });

  it('brings every ant all the way to the nest and back to the pile', () => {
    const trips = antsAt(0).map((_, i) => ticks.map((tick) => antsAt(tick)[i]!));
    for (const trip of trips) {
      expect(trip.some((ant) => Math.hypot(ant.x - last[0], ant.y - last[1]) < 0.5)).toBe(true);
      expect(trip.some((ant) => Math.hypot(ant.x - first[0], ant.y - first[1]) < 0.5)).toBe(true);
    }
  });

  it('starts no two ants on the same spot', () => {
    const ants = antsAt(0);
    ants.forEach((p, i) => ants.slice(i + 1).forEach((q) => expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(4)));
  });
});

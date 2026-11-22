import type { DotCanvas } from './canvas';

/** A stretch of characters in one CSS colour. */
export interface Run {
  t: string;
  c: string;
}

/** One line of a drawing, as runs whose characters add up to the drawing's width. */
export type Row = Run[];

/** The colour of a run with no dots in it. */
export const TRANSPARENT = 'transparent';

const BLANK = 0x2800;

// The Unicode braille bit of the dot at (x, y) in its cell, x across 0–1 and y down 0–3.
const BIT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;

/**
 * A row as HTML: runs with no dots as bare characters, the rest each in a span of its colour. The
 * Braille component renders rows with it at build time, and the garden's life redraws them with it
 * in the browser, so the two always match.
 */
export function markup(row: Row): string {
  return row.map((run) => (run.c === TRANSPARENT ? run.t : `<span style="color: ${run.c}">${run.t}</span>`)).join('');
}

/**
 * Encode a dot canvas as braille, one row of runs per line of cells. A cell takes the colour whose
 * dots in it weigh the most; a tie goes to the colour met first, reading the cell's dots row by
 * row. Neighbouring cells of one colour share a run, and empty cells make transparent runs.
 */
export function encode(canvas: DotCanvas): Row[] {
  const rows: Row[] = [];
  for (let cy = 0; cy < canvas.height; cy++) {
    const row: Row = [];
    for (let cx = 0; cx < canvas.width; cx++) {
      let bits = 0;
      const score = new Map<string, number>();
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const dot = canvas.dot(cx * 2 + dx, cy * 4 + dy);
          if (!dot) continue;
          bits |= BIT[dy]![dx]!;
          score.set(dot.colour, (score.get(dot.colour) ?? 0) + dot.weight);
        }
      }
      let colour = TRANSPARENT;
      let best = -Infinity;
      for (const [c, s] of score) {
        if (s > best) {
          best = s;
          colour = c;
        }
      }
      const ch = String.fromCharCode(BLANK + bits);
      const last = row[row.length - 1];
      if (last && last.c === colour) last.t += ch;
      else row.push({ t: ch, c: colour });
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Lay a drawing's dots into a larger canvas, its top-left cell at cell (`x`, `y`), each dot in its
 * run's colour with the given weight. The inverse of `encode`: a drawing laid on a whole cell and
 * encoded again comes back as it was, where nothing else is drawn. Runs with no dots lay none.
 */
export function stamp(canvas: DotCanvas, rows: readonly Row[], x: number, y: number, weight = 1): void {
  rows.forEach((row, cy) => {
    let cx = 0;
    for (const run of row) {
      for (const ch of run.t) {
        const bits = ch.charCodeAt(0) - BLANK;
        for (let dy = 0; dy < 4; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (bits & BIT[dy]![dx]!) canvas.put((x + cx) * 2 + dx, (y + cy) * 4 + dy, run.c, weight);
          }
        }
        cx++;
      }
    }
  });
}

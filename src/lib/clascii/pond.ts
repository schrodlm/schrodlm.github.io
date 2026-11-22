// The pond on clascii's page: when a setting changes, a drop falls into the art and the new art
// spreads from it as a ring of water, over the old. Distances count a row as two columns, since a
// character is about twice as tall as it is wide, so the ring looks round.

/** What a cell of the art shows while the new art spreads. */
export const OLD = 0;
export const NEW = 1;
export const WATER = 2;

/** A cell of the art, counted from the top left. */
export interface Drop {
  x: number;
  y: number;
}

const distance = (x: number, y: number, drop: Drop) => Math.hypot(x - drop.x, (y - drop.y) * 2);

/** How far the ring must spread from `drop` to have covered the whole art. */
export function farthest(drop: Drop, columns: number, rows: number): number {
  return Math.max(...[0, columns - 1].flatMap((x) => [0, rows - 1].map((y) => distance(x, y, drop)))) + 2;
}

/**
 * Which cells show the new art, the ring of water, or the old art when the ring has spread `radius`
 * from `drop`: one value per cell, row by row.
 */
export function spread(drop: Drop, radius: number, columns: number, rows: number): Uint8Array {
  const cells = new Uint8Array(columns * rows);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const d = distance(x, y, drop);
      cells[y * columns + x] = d <= radius - 1.5 ? NEW : d <= radius ? WATER : OLD;
    }
  return cells;
}

/**
 * The lines to show while the new art spreads over the old. The old art shows only where it is the
 * same size as the new; elsewhere, and before there was any, the pond is still empty.
 */
export function compose(next: readonly string[], old: readonly string[] | undefined, cells: Uint8Array): string[] {
  const columns = next[0]?.length ?? 0;
  const same = old?.length === next.length && old[0]?.length === columns;
  return next.map((line, y) =>
    Array.from(line, (ch, x) => {
      const cell = cells[y * columns + x];
      return cell === NEW ? ch : cell === WATER ? '~' : same ? old![y]![x]! : ' ';
    }).join(''),
  );
}

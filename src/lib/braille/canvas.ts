// A bitmap of braille dots: every character cell is 2 dots wide and 4 dots tall. Each dot keeps a
// colour and a weight, so where two parts overlap the heavier one (a petal over a stem) wins the dot.

export interface DotCanvas {
  /** Width in character cells. */
  readonly width: number;
  /** Height in character cells (rows). */
  readonly height: number;
  /** Width in dots, twice the cells. */
  readonly dotWidth: number;
  /** Height in dots, four times the rows. */
  readonly dotHeight: number;
  /**
   * Set the dot nearest to (x, y), in dot coordinates, unless a heavier dot is already there.
   * Equal weights let the later dot win. Dots outside the canvas are ignored.
   */
  put(x: number, y: number, colour: string, weight?: number): void;
  /** The dot at whole dot coordinates, or null where nothing is drawn. */
  dot(x: number, y: number): { colour: string; weight: number } | null;
}

export function createCanvas(width: number, height: number): DotCanvas {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
    throw new RangeError(`A canvas is a whole number of cells, not ${width} × ${height}`);
  }
  const dotWidth = width * 2;
  const dotHeight = height * 4;
  const colours: string[] = [];
  const index = new Map<string, number>();
  const colourAt = new Int32Array(dotWidth * dotHeight).fill(-1);
  const weightAt = new Float64Array(dotWidth * dotHeight);

  return {
    width,
    height,
    dotWidth,
    dotHeight,
    put(x, y, colour, weight = 1) {
      const dx = Math.round(x);
      const dy = Math.round(y);
      if (dx < 0 || dy < 0 || dx >= dotWidth || dy >= dotHeight) return;
      const i = dy * dotWidth + dx;
      if (colourAt[i] !== -1 && weight < weightAt[i]!) return;
      let k = index.get(colour);
      if (k === undefined) {
        k = colours.length;
        colours.push(colour);
        index.set(colour, k);
      }
      colourAt[i] = k;
      weightAt[i] = weight;
    },
    dot(x, y) {
      if (x < 0 || y < 0 || x >= dotWidth || y >= dotHeight) return null;
      const i = y * dotWidth + x;
      const k = colourAt[i]!;
      return k === -1 ? null : { colour: colours[k]!, weight: weightAt[i]! };
    },
  };
}

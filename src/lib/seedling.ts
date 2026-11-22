// The seedling: what a stub, a note with nothing written yet, shows where its flower would be. It
// is a sprout and not a flower, the same for every stub, at the footprint of the form it stands in
// for, so a stub's page and its line in a list are laid out as a flower's would be.
import { blade, createCanvas, encode, line, type Row } from './braille';
import { draw, grow, type Form } from './herbarium';
import { isStub } from './markdown/stubs';
import { seedName, type Kind } from './pages';

const STEM = { colour: 'var(--fern)' };
const LEAF = { colour: 'var(--moss)' };

/** The seedling at the footprint of a flower's whole plant, its mark, or its head of `size` rows. */
export function drawSeedling(form: Form, size?: number): Row[] {
  if (form === 'head') return sproutHead(size);
  if (form === 'mark') {
    const canvas = createCanvas(3, 1);
    line(canvas, [3, 3], [3, 1], STEM);
    blade(canvas, [3, 1], [1.5, 0], [1, 1], 1, LEAF);
    blade(canvas, [3, 1], [4.5, 0], [5, 0], 1, LEAF);
    return encode(canvas);
  }
  const canvas = createCanvas(15, 13);
  const foot = canvas.dotHeight - 1;
  const middle = canvas.dotWidth / 2;
  line(canvas, [middle, foot], [middle, foot - 12], STEM);
  blade(canvas, [middle, foot - 9], [middle - 4, foot - 14], [middle - 8, foot - 12], 3, LEAF);
  blade(canvas, [middle, foot - 12], [middle + 4, foot - 18], [middle + 8, foot - 16], 3, LEAF);
  return encode(canvas);
}

/**
 * A note's or post's flower in one form, at rest, or the seedling while the page is a stub. A head
 * takes its `size` in rows.
 */
export function drawPageFlower(kind: Kind, slug: string, markdown: string, form: Form, size?: number): Row[] {
  return isStub(markdown) ? drawSeedling(form, size) : draw(grow(seedName(kind, slug)), { wind: 0, form, ...(size === undefined ? {} : { size }) });
}

// A sprout standing in a head's square footprint: a stem from the middle of its foot, and a leaf
// either side near its top.
function sproutHead(size: number | undefined): Row[] {
  if (size === undefined || !Number.isInteger(size) || size < 1) {
    throw new RangeError(`A head's size is a whole number of rows, not ${size}`);
  }
  const canvas = createCanvas(size * 2, size);
  const side = canvas.dotHeight;
  const foot = side - 1;
  const middle = side / 2;
  const top = foot - side * 0.5;
  const reach = side * 0.3;
  const width = Math.max(1, side / 6);
  line(canvas, [middle, foot], [middle, top], STEM);
  blade(canvas, [middle, top + reach * 0.4], [middle - reach * 0.6, top - reach * 0.2], [middle - reach, top], width, LEAF);
  blade(canvas, [middle, top], [middle + reach * 0.6, top - reach * 0.6], [middle + reach, top - reach * 0.4], width, LEAF);
  return encode(canvas);
}

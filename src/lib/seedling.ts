// The seedling: what a stub, a note with nothing written yet, shows where its flower would be. It
// is a sprout and not a flower, the same for every stub, at the footprint of the form it stands in
// for, so a stub's page and its line in a list are laid out as a flower's would be.
import { blade, createCanvas, encode, line, type Row } from './braille';
import { draw, grow } from './herbarium';
import { isStub } from './markdown/stubs';
import { seedName, type Kind } from './pages';

type Form = 'plant' | 'mark';

const STEM = { colour: 'var(--fern)' };
const LEAF = { colour: 'var(--moss)' };

/** The seedling at the footprint of a flower's whole plant or its mark. */
export function drawSeedling(form: Form): Row[] {
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

/** A note's or post's flower in one form, at rest, or the seedling while the page is a stub. */
export function drawPageFlower(kind: Kind, slug: string, markdown: string, form: Form): Row[] {
  return isStub(markdown) ? drawSeedling(form) : draw(grow(seedName(kind, slug)), { wind: 0, form });
}

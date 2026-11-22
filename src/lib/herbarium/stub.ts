// A STUB, NOT A FLOWER. My `herbarium` library grows the real flowers, and replaces this file when
// it is published (see docs/herbarium-contract.md). Until then this stub meets the same contract
// and draws construction tape at each form's real footprint, the same for every name, so pages can
// be built around flowers without anyone mistaking the placeholder for one. Do not draw flowers
// here: flowers come from the library.
import { createCanvas, encode, line, type DotCanvas, type Row } from '../braille';

export type { Row, Run } from '../braille';

export interface Specimen {
  /** The name the specimen grew from. */
  name: string;
  /** The specimen's number, grown from its name. */
  seed: number;
  /** Its Latin name. */
  latin: string;
}

export type Form = 'plant' | 'head' | 'mark';

export interface DrawOptions {
  /** The moment of wind, from -1 (full gust to the left) through 0 (still) to 1 (to the right). */
  wind: number;
  form: Form;
  /** A head's height in rows, needed for a head; it is twice as many cells wide, so it is square. */
  size?: number;
}

export interface Trait {
  name: string;
  value: string;
}

const MANGO = '#A87400';
const INK = '#1F2B23';

export function grow(name: string): Specimen {
  // FNV-1a over the name's UTF-16 code units: the same name always gets the same number.
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) hash = Math.imul(hash ^ name.charCodeAt(i), 0x01000193);
  return { name, seed: hash >>> 0, latin: 'Nomen nondum datum' };
}

export function draw(_specimen: Specimen, { form, size }: DrawOptions): Row[] {
  if (form === 'plant') return tape(15, 13);
  if (form === 'mark') return tape(3, 1);
  if (size === undefined || !Number.isInteger(size) || size < 1) {
    throw new RangeError(`A head's size is a whole number of rows, not ${size}`);
  }
  return tape(size * 2, size);
}

export function label(_specimen: Specimen): Trait[] {
  return ['head', 'petals', 'stem', 'leaves'].map((name) => ({ name, value: 'under construction' }));
}

// Construction tape: diagonal stripes of mango and ink, inside an ink frame where the
// footprint has room for one.
function tape(width: number, height: number): Row[] {
  const canvas = createCanvas(width, height);
  const framed = height > 1;
  if (framed) frame(canvas);
  const inset = framed ? 2 : 0;
  for (let y = inset; y < canvas.dotHeight - inset; y++) {
    for (let x = inset; x < canvas.dotWidth - inset; x++) {
      if ((x + y) % 3 !== 0) continue;
      canvas.put(x, y, Math.floor((x + y) / 6) % 2 ? INK : MANGO);
    }
  }
  return encode(canvas);
}

function frame(canvas: DotCanvas): void {
  const right = canvas.dotWidth - 1;
  const bottom = canvas.dotHeight - 1;
  const ink = { colour: INK, weight: 2 };
  line(canvas, [0, 0], [right, 0], ink);
  line(canvas, [right, 0], [right, bottom], ink);
  line(canvas, [right, bottom], [0, bottom], ink);
  line(canvas, [0, bottom], [0, 0], ink);
}

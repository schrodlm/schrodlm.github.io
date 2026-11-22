// The braille drawing kit: draw on a dot canvas, then encode it as rows of coloured braille runs
// for the Braille component to render; a drawing can be stamped back into a larger canvas.
export { createCanvas, type DotCanvas } from './canvas';
export { encode, markup, stamp, TRANSPARENT, type Row, type Run } from './encode';
export { bezier, blade, curve, disc, line, oval, ring, type Ink, type Point } from './draw';

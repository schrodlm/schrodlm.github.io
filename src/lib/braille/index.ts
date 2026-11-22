// The braille drawing kit: draw on a dot canvas, then encode it as rows of coloured braille runs
// for the Braille component to render.
export { createCanvas, type DotCanvas } from './canvas';
export { encode, markup, TRANSPARENT, type Row, type Run } from './encode';
export { blade, curve, disc, line, oval, ring, type Ink, type Point } from './draw';

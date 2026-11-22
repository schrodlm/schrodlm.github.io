// The short vine a section heading trails, drawn in the heading's own font: mostly stem (~ and -),
// now and then a leaf (& or %) and rarely a bloom (@). It grows from the heading's text, so a
// heading's trail is the same in every build.
import { rng } from './random';

export type TrailPart = 'stem' | 'leaf' | 'bloom';
export interface TrailRun {
  part: TrailPart;
  text: string;
}

// Long enough to cross the widest column; the heading clips what it doesn't need.
const LENGTH = 140;

export function trail(seed: string): TrailRun[] {
  const random = rng(seed);
  const runs: TrailRun[] = [];
  let stem = '';
  const add = (part: TrailPart, text: string) => {
    if (stem) runs.push({ part: 'stem', text: stem });
    stem = '';
    runs.push({ part, text });
  };
  for (let i = 0; i < LENGTH; i++) {
    const roll = random();
    // The first few characters are always stem, so a leaf never touches the heading.
    if (i > 2 && roll < 0.07) add('leaf', random() < 0.5 ? '&' : '%');
    else if (i > 2 && roll < 0.085) add('bloom', '@');
    else stem += random() < 0.8 ? '~' : '-';
  }
  if (stem) runs.push({ part: 'stem', text: stem });
  return runs;
}

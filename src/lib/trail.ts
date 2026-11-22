// The short vine a section heading trails, drawn in the heading's own font: mostly stem (~ and -),
// now and then a leaf (& or %) and rarely a bloom (@). It grows from the heading's text, so a
// heading's trail is the same in every build.

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

// A small seeded generator (a string hash feeding mulberry32): the same seed always gives the same
// sequence of numbers in [0, 1).
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

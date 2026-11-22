// An invented garden the size of a real one, for testing that the garden map stays legible at
// scale: a big group of notes grown around a few hubs, some small groups, and wildflowers. Every
// title is made up from the lists below; it never holds real content.
import type { Page } from '../../src/lib/graph';
import { rng } from '../../src/lib/random';

export interface InventedNote {
  slug: string;
  title: string;
  /** Not written yet: it links nowhere, though others may link to it. */
  stub: boolean;
  /** The slugs of the notes it links to. */
  links: string[];
}

const KINDS = ['Invented', 'Sample', 'Pretend', 'Toy', 'Imaginary', 'Mock', 'Paper', 'Dummy', 'Made-up', 'Fictional', 'Stand-in', 'Placeholder'];
const THINGS = [
  'clock',
  'quorum',
  'ledger',
  'lattice',
  'semaphore',
  'monad',
  'replica',
  'heap',
  'eventual consistency',
  'scheduler',
  'bloom filter',
  'gossip protocol',
  'trie',
  'two-phase commit',
  'cache',
  'rope',
  'skip list',
  'garbage collector of last resort',
  'mutex',
  'vector clock',
];

// As many notes as a real garden has, about one link and a half for each.
const COUNT = 200;

/** The invented garden, the same every time. */
export function inventedGarden(): InventedNote[] {
  const random = rng('invented garden');
  const pick = (n: number) => Math.floor(random() * n);
  const notes: InventedNote[] = Array.from({ length: COUNT }, (_, i) => ({
    slug: `invented-${String(i).padStart(3, '0')}`,
    title: `${KINDS[i % KINDS.length]} ${THINGS[Math.floor(i / KINDS.length) % THINGS.length]}`,
    stub: i % 11 === 5,
    links: [],
  }));
  const degree = new Array<number>(COUNT).fill(0);
  const link = (a: number, b: number) => {
    if (a === b) return;
    // A stub links nowhere, so a link between it and another note runs into it.
    const [from, to] = notes[a]!.stub && !notes[b]!.stub ? [b, a] : [a, b];
    const target = notes[to]!.slug;
    if (notes[from]!.links.includes(target) || notes[to]!.links.includes(notes[from]!.slug)) return;
    notes[from]!.links.push(target);
    degree[a]!++;
    degree[b]!++;
  };
  // The better linked a note, the likelier a new one links it.
  const popular = (below: number, from = 0) => {
    const total = degree.slice(from, below).reduce((sum, d) => sum + d + 1, 0);
    let at = random() * total;
    for (let i = from; i < below; i++) {
      at -= degree[i]! + 1;
      if (at < 0) return i;
    }
    return below - 1;
  };

  // Three quarters grow into one group, with more links among them than a tree has.
  const main = Math.round(COUNT * 0.75);
  for (let i = 1; i < main; i++) link(i, popular(i));
  for (let k = 0; k < Math.round(main * 0.8); k++) link(pick(main), popular(main));
  // Some small groups, of two to five notes.
  let at = main;
  const wild = Math.round(COUNT * 0.12);
  for (let size = 2; at + size <= COUNT - wild; size = (size % 5) + 2) {
    for (let i = 1; i < size; i++) link(at + i, at + pick(i));
    at += size;
  }
  // And the rest are wildflowers.
  return notes;
}

/** The invented garden as the link graph reads it: each note's links as rendered HTML. */
export function inventedPages(notes: readonly InventedNote[]): Page[] {
  return notes.map((note) => ({ slug: note.slug, html: note.links.map((to) => `<a href="/notes/${to}/">${to}</a>`).join(' ') }));
}

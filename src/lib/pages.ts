// Notes and posts: where each one's page lives, what its page says about it, and the order their
// lists take. Every page is named by its slug, its path in the collection without `.md`.

export type Kind = 'notes' | 'posts';

/**
 * A page's address before the base path. A note in a folder keeps the folder as a segment of its
 * address, `/notes/distributed-systems/raft/`; a post never carries its date, so redating it
 * doesn't move it.
 */
export function pagePath(collection: Kind | 'projects', slug: string): string {
  return `/${collection}/${slug}/`;
}

/** The name a page's flower grows from: its collection and slug, `notes/cap-theorem`. */
export function seedName(kind: Kind, slug: string): string {
  return `${kind}/${slug}`;
}

/** The folders a page sits in, worded for its breadcrumb: `distributed-systems/raft` → `distributed systems`. */
export function folders(slug: string): string[] {
  return slug
    .split('/')
    .slice(0, -1)
    .map((folder) => folder.replaceAll('-', ' '));
}

const WORDS_PER_MINUTE = 200;

/** How many minutes a page's markdown takes to read, at least one. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Czech names its language best as an adverb, "written česky", not by the noun "čeština".
const OWN_NAMES: Record<string, string> = { cs: 'česky' };

/** The page's language, named in that language, in lowercase: `en-GB` is "english". */
export function languageName(lang: string): string {
  const primary = lang.split('-')[0]!.toLowerCase();
  return OWN_NAMES[primary] ?? (new Intl.DisplayNames([primary], { type: 'language' }).of(primary) ?? primary).toLowerCase();
}

/** A day as the site writes it, `2026-10-19`. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface Dated {
  id: string;
  data: { date: Date };
}

interface Titled {
  id: string;
  data: { title: string };
}

/** Posts, the newest first; posts of one day in the order of their slugs. */
export function newestFirst<T extends Dated>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Notes from A to Z by title, whatever their case, accents or folder. */
export function byTitle<T extends Titled>(notes: readonly T[]): T[] {
  return [...notes].sort((a, b) => collator.compare(a.data.title, b.data.title) || a.id.localeCompare(b.id));
}

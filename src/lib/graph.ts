// The garden's link graph: which notes link to which, worked out at build time from each note's
// rendered HTML, so it counts exactly the links a reader can follow (none from code, all from
// reference links and raw HTML alike). A link counts when it leads to another note that exists;
// links to headings count as links to their note, and a note linking another twice links it once.
//
// A note's page draws its neighbourhood from it, and the graph view draws the whole garden.
import { withBase } from './base-path';
import { noteSlug } from './markdown/stubs';

/** A note as the graph reads it: its slug and its rendered HTML. */
export interface Page {
  slug: string;
  html: string;
}

/** A link from one note to another, by slug. */
export type Link = readonly [from: string, to: string];

export interface LinkGraph {
  /** Every note, linked or not, in slug order. */
  readonly notes: readonly string[];
  /** Every link once, in order of the note it leaves and then of the note it reaches. */
  readonly links: readonly Link[];
  /** The notes a note links to, in slug order. */
  linksOut(slug: string): readonly string[];
  /** The notes that link to a note, in slug order. */
  linksIn(slug: string): readonly string[];
  /** The notes a note links to or is linked from, each once, in slug order. */
  neighbours(slug: string): readonly string[];
  /** The notes two steps from a note, whichever way the links run, and not nearer: in slug order. */
  twoStepsAway(slug: string): readonly string[];
  /** How many neighbours a note has. A note with none is a wildflower. */
  degree(slug: string): number;
}

// An <a> tag, with attribute values quoted either way, which may hold a `>`; and each of its
// attributes, read in turn, so an `href=` inside another attribute's value is not taken for one.
const ANCHOR = /<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const ATTRIBUTE = /([^\s"'=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
// What holds no tags, though it may look as if it does: a comment, and the text of a script or a
// style.
const NO_TAGS = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/gi;

/**
 * The slugs of the notes a page's rendered HTML links to, each once, in the order first linked:
 * every link to `/notes/<slug>/`, below the base path or not, anchors and queries ignored. Whether
 * those notes exist is for the graph to decide.
 */
export function noteLinks(html: string, base: string): string[] {
  const root = withBase('/', base);
  const found = new Set<string>();
  for (const [, attributes] of html.replace(NO_TAGS, '').matchAll(ANCHOR)) {
    const match = [...attributes!.matchAll(ATTRIBUTE)].find(([, name]) => name!.toLowerCase() === 'href');
    if (!match) continue;
    let href = (match[2] ?? match[3] ?? match[4] ?? '').replaceAll('&amp;', '&');
    if (href.startsWith(root)) href = href.slice(root.length - 1);
    const slug = noteSlug(href);
    if (slug !== undefined) found.add(slug);
  }
  return [...found];
}

const sorted = (slugs: Iterable<string>) => [...slugs].sort();

/** The link graph of a garden's notes, from each one's rendered HTML below the site's base path. */
export function linkGraph(pages: readonly Page[], base: string): LinkGraph {
  const notes = sorted(new Set(pages.map((page) => page.slug)));
  const exists = new Set(notes);
  const out = new Map<string, Set<string>>(notes.map((slug) => [slug, new Set()]));
  const into = new Map<string, Set<string>>(notes.map((slug) => [slug, new Set()]));
  for (const { slug, html } of pages) {
    for (const target of noteLinks(html, base)) {
      if (target === slug || !exists.has(target)) continue;
      out.get(slug)!.add(target);
      into.get(target)!.add(slug);
    }
  }

  const linksOut = new Map(notes.map((slug) => [slug, sorted(out.get(slug)!)]));
  const linksIn = new Map(notes.map((slug) => [slug, sorted(into.get(slug)!)]));
  const neighbours = new Map(notes.map((slug) => [slug, sorted(new Set([...out.get(slug)!, ...into.get(slug)!]))]));
  const links: Link[] = notes.flatMap((from) => linksOut.get(from)!.map((to): Link => [from, to]));
  const none: readonly string[] = [];

  return {
    notes,
    links,
    linksOut: (slug) => linksOut.get(slug) ?? none,
    linksIn: (slug) => linksIn.get(slug) ?? none,
    neighbours: (slug) => neighbours.get(slug) ?? none,
    twoStepsAway(slug) {
      const near = neighbours.get(slug) ?? none;
      const far = new Set(near.flatMap((next) => neighbours.get(next)!));
      far.delete(slug);
      for (const next of near) far.delete(next);
      return sorted(far);
    },
    degree: (slug) => (neighbours.get(slug) ?? none).length,
  };
}

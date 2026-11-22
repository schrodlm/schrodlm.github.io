// A devlog's rendered HTML taken apart at its section headings, so its page can set each section
// in its own way: the Summary as the lede, the Goal in a box, a marker before each item of Done,
// Decisions, Problems and surprises, Learned and Next, and the References in small type.
//
// The page is cut at its top-level <h2>s only; a heading inside a callout or a list stays where it
// is. A section is known by its heading's id, which normalized markdown makes from the heading.

/** The sections whose items the page counts and marks, by heading id, with the marker and the name it counts them by. */
export const KINDS = new Map([
  ['done', { marker: '[x]', short: 'done' }],
  ['decisions', { marker: '->', short: 'decisions' }],
  ['problems-and-surprises', { marker: '!', short: 'problems' }],
  ['learned', { marker: '+', short: 'learned' }],
  ['next', { marker: '[ ]', short: 'next' }],
]);

interface Section {
  /** The heading's id, such as `problems-and-surprises`. */
  id: string;
  /** The heading's own HTML, without the <h2>. */
  heading: string;
  /** Everything after the heading, up to the next section. */
  html: string;
  /** How many items its top-level lists hold. */
  items: number;
}

interface Sections {
  /** Whatever comes before the first section heading. */
  intro: string;
  sections: Section[];
}

interface Tag {
  name: string;
  closing: boolean;
  start: number;
  end: number;
  attributes: string;
  /** The elements open around the tag, outermost first, the tag itself not counted. */
  around: string[];
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
// A tag, with attribute values quoted either way, which may hold a `>`.
const TAG = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;

// What holds no tags, though it may look as if it does: a comment, and the text of a script or a
// style. Blanked out before the tags are read, keeping every other tag where it is.
const NO_TAGS = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/gi;

/** Every tag in a piece of HTML, with the elements open around it. */
function tags(html: string): Tag[] {
  const open: string[] = [];
  const found: Tag[] = [];
  for (const match of html.replace(NO_TAGS, (blank) => ' '.repeat(blank.length)).matchAll(TAG)) {
    const [whole, slash, rawName, attributes, selfClosing] = match;
    const name = rawName!.toLowerCase();
    const closing = slash === '/';
    if (closing) {
      const at = open.lastIndexOf(name);
      if (at !== -1) open.length = at;
    }
    found.push({ name, closing, start: match.index, end: match.index + whole.length, attributes: attributes!, around: [...open] });
    if (!closing && !selfClosing && !VOID.has(name)) open.push(name);
  }
  return found;
}

/** The number of items in the top-level lists of a piece of HTML. */
function topLevelItems(html: string): number {
  return tags(html).filter(
    (tag) => tag.name === 'li' && !tag.closing && tag.around.length === 1 && ['ul', 'ol'].includes(tag.around[0]!),
  ).length;
}

/** Cuts a devlog's HTML at its top-level section headings. */
export function sections(html: string): Sections {
  const all = tags(html);
  const cuts: { start: number; end: number; id: string; heading: string }[] = [];
  for (const [i, tag] of all.entries()) {
    if (tag.name !== 'h2' || tag.closing || tag.around.length > 0) continue;
    const close = all.find((t, j) => j > i && t.name === 'h2' && t.closing && t.around.length === 0);
    if (!close) continue;
    const id = /\bid="([^"]*)"/.exec(tag.attributes)?.[1] ?? '';
    cuts.push({ start: tag.start, end: close.end, id, heading: html.slice(tag.end, close.start) });
  }
  return {
    intro: html.slice(0, cuts[0]?.start ?? html.length).trim(),
    sections: cuts.map((cut, i) => {
      const body = html.slice(cut.end, cuts[i + 1]?.start ?? html.length).trim();
      return { id: cut.id, heading: cut.heading, html: body, items: topLevelItems(body) };
    }),
  };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** The words of a piece of HTML, as plain text: typeset math reads as drawn, footnote marks go. */
export function plainText(html: string): string {
  return html
    .replace(/<math\b[\s\S]*?<\/math>/g, '')
    .replace(/<sup>\s*<a [^>]*data-footnote-ref[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
      if (code[0] === '#') return String.fromCodePoint(Number(code[1]?.toLowerCase() === 'x' ? `0${code.slice(1)}` : code.slice(1)));
      return ENTITIES[code] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first sentence of a section's first paragraph, for the field journal; empty without one. */
export function firstSentence(html: string, lang: string): string {
  const paragraph = /<p>([\s\S]*?)<\/p>/.exec(html)?.[1];
  if (paragraph === undefined) return '';
  const [first] = new Intl.Segmenter(lang, { granularity: 'sentence' }).segment(plainText(paragraph));
  return first?.segment.trim() ?? '';
}

/** A devlog's gist: the first sentence of its Summary, for the field journal and its description. */
export function gist(html: string, lang: string): string {
  const summary = sections(html).sections.find((section) => section.id === 'summary');
  return summary ? firstSentence(summary.html, lang) : '';
}

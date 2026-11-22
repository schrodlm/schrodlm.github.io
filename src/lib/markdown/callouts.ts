import { defineHastPlugin } from 'satteri';
import { type Child, elements, h, text } from './hast';

// A callout arrives as a blockquote whose first line names its type, as Obsidian writes it:
// `> [!warning]- Title`, with an optional fold marker (+ open, - closed) and an optional title.
// It becomes a box framed in ASCII: a top rule carrying the type's glyph, the title, the body and a
// bottom rule. A foldable one is a <details>, so it folds without JavaScript.
//
//   +--[ ! ]-----------------------
//     Title
//     The body.
//   +------------------------------
//
// Four types have a look of their own; any other type is drawn as a note, under its own name.

const GLYPHS = {
  note: '[ i ]',
  important: '[ ! ]',
  tip: '[ & ]',
  warning: '[ ! ]',
} as const;

type Look = keyof typeof GLYPHS;

const MARKER = /^\[!([^\]\s]+)\]([+-]?)[ \t]*/;

export const calloutPlugin = defineHastPlugin({
  name: 'callouts',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const first = elements(node)[0];
      if (first?.tagName !== 'p') return;
      const opening = first.children[0];
      if (opening?.type !== 'text') return;
      const match = MARKER.exec(opening.value);
      if (!match) return;

      const type = (match[1] ?? '').toLowerCase();
      const fold = match[2];
      const look: Look = type in GLYPHS ? (type as Look) : 'note';
      const [title, body] = splitFirstLine([text(opening.value.slice(match[0].length)), ...first.children.slice(1)]);

      const rule = (art: string, extra: string[] = []) =>
        h('span', { className: ['callout-rule', ...extra], ariaHidden: 'true' }, [text(art)]);
      const head = h(fold ? 'summary' : 'div', { className: ['callout-head'] }, [
        rule(`+--${GLYPHS[look]}`),
        h('span', { className: ['callout-title'] }, isBlank(title) ? [text(capitalise(type))] : title),
      ]);
      ctx.replaceNode(first, isBlank(body) ? [head] : [head, h('p', {}, body)]);
      ctx.appendChild(node, rule('+', ['callout-foot']));

      ctx.setField(node, 'tagName', fold ? 'details' : 'div');
      ctx.setProperty(node, 'className', ['callout', `callout-${look}`]);
      if (!fold) ctx.setProperty(node, 'role', 'note');
      if (fold === '+') ctx.setProperty(node, 'open', true);
    },
  },
});

/** Splits a paragraph's content at its first line break: the title, then the start of the body. */
function splitFirstLine(children: Child[]): [Child[], Child[]] {
  const title: Child[] = [];
  for (const [i, child] of children.entries()) {
    const rest = children.slice(i + 1);
    if (child.type === 'element' && child.tagName === 'br') return [title, rest];
    const end = child.type === 'text' ? child.value.indexOf('\n') : -1;
    if (child.type === 'text' && end >= 0) {
      return [
        [...title, text(child.value.slice(0, end).trimEnd())],
        [text(child.value.slice(end + 1)), ...rest],
      ];
    }
    title.push(child);
  }
  return [title, []];
}

function isBlank(children: Child[]): boolean {
  return children.every((child) => child.type === 'text' && child.value.trim() === '');
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineHastPlugin } from 'satteri';
import { h, text } from './hast';

// A stub is a note with no body yet. A link to one is drawn as a seedling: a dotted underline, a
// small sprout after it and a "not written yet" hint. Which notes are stubs is worked out from the
// notes folder itself, the one the notes collection reads, since the markdown is rendered before
// the collections can be asked. The folder is read once per build: the dev server, and Astro's
// cache of pages that haven't changed, keep their seedlings until a fresh build.

const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

/** Whether a note's markdown has nothing below its front matter. */
export function isStub(markdown: string): boolean {
  return markdown.replace(/^\uFEFF/, '').replace(FRONT_MATTER, '').trim() === '';
}

/** The slugs of the stubs in a notes folder, such as `cap-theorem` or `distributed/raft`. */
export function findStubs(dir: string): Set<string> {
  const stubs = new Set<string>();
  if (!existsSync(dir)) return stubs;
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    const file = join(entry.parentPath, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md') && isStub(readFileSync(file, 'utf8'))) {
      stubs.add(relative(dir, file).slice(0, -'.md'.length).replaceAll(sep, '/'));
    }
  }
  return stubs;
}

/** The slug of the note a site-absolute link points at, or undefined for any other link. */
export function noteSlug(href: string): string | undefined {
  const path = href.split(/[?#]/)[0] ?? '';
  const match = /^\/notes\/(.+?)\/?$/.exec(path);
  return match?.[1];
}

/** Draws links to the given stubs as seedlings. It runs before the base path is put on the links. */
export function stubLinkPlugin(stubs: ReadonlySet<string>) {
  return defineHastPlugin({
    name: 'stub-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties['href'];
        const slug = typeof href === 'string' ? noteSlug(href) : undefined;
        if (slug === undefined || !stubs.has(slug)) return;
        ctx.setProperty(node, 'className', ['stub']);
        ctx.setProperty(node, 'title', 'Not written yet');
        ctx.appendChild(node, [
          h('span', { className: ['sprout'], ariaHidden: 'true' }, [text(',')]),
          h('span', { className: ['visually-hidden'] }, [text(' (not written yet)')]),
        ]);
      },
    },
  });
}

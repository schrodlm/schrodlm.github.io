import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { calloutPlugin } from './callouts.ts';

async function render(markdown: string) {
  return (await markdownToHtml(markdown, { hastPlugins: [calloutPlugin] })).html.trim();
}

const rule = (art: string, foot = false) =>
  `<span class="callout-rule${foot ? ' callout-foot' : ''}" aria-hidden="true">${art}</span>`;

describe('calloutPlugin', () => {
  it('frames a callout in ASCII rules, its title above its body', async () => {
    expect(await render('> [!note] A title\n> The body.')).toBe(
      '<div class="callout callout-note" role="note">\n' +
        `<div class="callout-head">${rule('+--[ i ]')}<span class="callout-title">A title</span></div>` +
        `<p>The body.</p>\n${rule('+', true)}</div>`,
    );
  });

  it.each([
    ['note', '[ i ]'],
    ['important', '[ ! ]'],
    ['tip', '[ &amp; ]'],
    ['warning', '[ ! ]'],
  ])('gives a %s its own look and glyph', async (type, glyph) => {
    const html = await render(`> [!${type}] Title\n> Body.`);
    expect(html).toContain(`class="callout callout-${type}"`);
    expect(html).toContain(rule(`+--${glyph}`));
  });

  it('reads the type in any case', async () => {
    expect(await render('> [!WARNING]\n> Body.')).toContain('class="callout callout-warning"');
  });

  it('draws a type it does not know as a note, titled by its own name', async () => {
    const html = await render('> [!example]\n> Body.');
    expect(html).toContain('class="callout callout-note"');
    expect(html).toContain('<span class="callout-title">Example</span>');
  });

  it('titles a callout without a title by its type', async () => {
    expect(await render('> [!tip]\n> Body.')).toContain('<span class="callout-title">Tip</span>');
  });

  it('keeps the markup in a title', async () => {
    expect(await render('> [!note] Mind the *gap*\n> Body.')).toContain(
      '<span class="callout-title">Mind the <em>gap</em></span>',
    );
  });

  it('keeps every paragraph of the body, and a callout with no body has none', async () => {
    const html = await render('> [!note] Title\n> One.\n>\n> Two.');
    expect(html).toContain('<p>One.</p>\n<p>Two.</p>');
    expect(await render('> [!note] Only a title')).not.toContain('<p>');
  });

  it('makes a foldable callout a <details>, closed with - and open with +', async () => {
    const closed = await render('> [!warning]- Folded\n> Body.');
    expect(closed).toMatch(/^<details class="callout callout-warning">/);
    expect(closed).toContain(`<summary class="callout-head">${rule('+--[ ! ]')}<span class="callout-title">Folded</span></summary>`);
    expect(await render('> [!warning]+ Open\n> Body.')).toMatch(/^<details class="callout callout-warning" open>/);
  });

  it('frames a callout inside another', async () => {
    const html = await render('> [!note] Outer\n> > [!tip] Inner\n> > Body.');
    expect(html).toContain('class="callout callout-note"');
    expect(html).toContain('class="callout callout-tip"');
  });

  it('leaves a plain quotation alone', async () => {
    expect(await render('> Just a quote, [!note] inside.')).toBe('<blockquote>\n<p>Just a quote, [!note] inside.</p>\n</blockquote>');
  });
});

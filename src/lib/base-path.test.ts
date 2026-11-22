import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { basePathPlugin, withBase } from './base-path.ts';

async function render(markdown: string, base: string) {
  return (await markdownToHtml(markdown, { hastPlugins: [basePathPlugin(base)] })).html.trim();
}

describe('basePathPlugin', () => {
  it('puts the base in front of site-absolute links and images', async () => {
    expect(await render('[x](/notes/x/) ![a](/assets/img/a.png)', '/site-preview/')).toBe(
      '<p><a href="/site-preview/notes/x/">x</a> <img src="/site-preview/assets/img/a.png" alt="a"></p>',
    );
  });

  it('keeps a heading anchor on the link', async () => {
    expect(await render('[x](/notes/x/#a-heading)', '/site-preview/')).toBe(
      '<p><a href="/site-preview/notes/x/#a-heading">x</a></p>',
    );
  });

  it('leaves links to other sites, relative and same-page links alone', async () => {
    const markdown = '[a](https://example.com/a) [b](//example.com/b) [c](c.md) [d](#d) [e](mailto:e@example.com)';
    expect(await render(markdown, '/site-preview/')).toBe(await render(markdown, '/'));
  });
});

describe('withBase', () => {
  it('accepts a base with or without its slashes', () => {
    expect(withBase('/notes/', '/site-preview/')).toBe('/site-preview/notes/');
    expect(withBase('/notes/', '/site-preview')).toBe('/site-preview/notes/');
    expect(withBase('/notes/', 'site-preview')).toBe('/site-preview/notes/');
  });

  it('changes nothing at the root', () => {
    expect(withBase('/notes/', '/')).toBe('/notes/');
  });
});

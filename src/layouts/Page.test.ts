import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Page from './Page.astro';

async function render(props: Record<string, unknown> = {}, slots: Record<string, string> = {}, path = '/') {
  const container = await AstroContainer.create({ astroConfig: { site: 'https://schrodlm.github.io' } });
  return container.renderToString(Page, {
    props,
    slots: { default: '<p>The text.</p>', ...slots },
    request: new Request(`https://schrodlm.github.io${path}`),
  });
}

describe('Page', () => {
  it('names the tab after the page, then me', async () => {
    expect(await render({ title: 'Not found' })).toContain('<title>Not found · Matěj Schrödl</title>');
    expect(await render()).toContain('<title>Matěj Schrödl</title>');
  });

  it('declares the page language, English unless told otherwise', async () => {
    expect(await render()).toMatch(/<html lang="en"/);
    expect(await render({ lang: 'cs' })).toMatch(/<html lang="cs"/);
  });

  it('marks the current section in the nav', async () => {
    const html = await render({ section: 'notes' }, {}, '/notes/some-note/');
    expect(html).toMatch(/<a href="\/notes\/" aria-current="true"[^>]*>\[&gt;notes\]<\/a>/);
    expect(html).toMatch(/<a href="\/posts\/"[^>]*>\[posts\]<\/a>/);
    expect(html).not.toMatch(/aria-current="[^"]*"[^>]*>\[posts\]/);
  });

  it('says a section page is the current page', async () => {
    expect(await render({ section: 'posts' }, {}, '/posts/')).toMatch(/aria-current="page"[^>]*>\[&gt;posts\]/);
  });

  it('marks no section on a page outside them', async () => {
    const html = await render();
    expect(html).not.toContain('aria-current');
    expect(html).not.toContain('[&gt;');
  });

  it('hides the side decoration and the footer art from screen readers', async () => {
    const html = await render({}, { side: '<pre>vine</pre>', 'footer-art': '<pre>soil</pre>' });
    expect(html).toMatch(/<div class="side" aria-hidden="true"[^>]*>\s*<pre>vine<\/pre>/);
    expect(html).toMatch(/<div class="footer-art" aria-hidden="true"[^>]*>\s*<pre>soil<\/pre>/);
  });

  it('stands every page on the soil, unless the page brings its own footer art', async () => {
    expect(await render()).toMatch(/<div class="footer-art" aria-hidden="true"[^>]*>\s*<div data-life="soil"/);
    expect(await render({}, { 'footer-art': '<pre>other</pre>' })).not.toContain('data-life="soil"');
  });

  it('gives a page its canonical address, and the 404 none', async () => {
    expect(await render({}, {}, '/notes/')).toContain('<link rel="canonical" href="https://schrodlm.github.io/notes/">');
    const missing = await render({ canonical: false });
    expect(missing).not.toContain('rel="canonical"');
    expect(missing).toContain('<meta name="robots" content="noindex">');
  });
});

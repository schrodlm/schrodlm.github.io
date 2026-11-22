import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { figurePlugin } from './figures.ts';

async function render(markdown: string) {
  return (await markdownToHtml(markdown, { hastPlugins: [figurePlugin] })).html.trim();
}

describe('figurePlugin', () => {
  it('makes an image alone in its paragraph a figure, captioned by its alt text', async () => {
    expect(await render('![A flow](/assets/img/a.png)')).toBe(
      '<figure class="figure"><img src="/assets/img/a.png" alt="A flow"><figcaption aria-hidden="true">A flow</figcaption></figure>',
    );
  });

  it.each([['![](/assets/img/a.png)'], ['![Image](/assets/img/a.png)']])('gives %s no caption', async (markdown) => {
    const html = await render(markdown);
    expect(html).toMatch(/^<figure class="figure"><img [^>]+><\/figure>$/);
  });

  it('leaves an image inside a line of text in the line', async () => {
    expect(await render('Text ![a](/assets/img/a.png) more.')).toBe('<p>Text <img src="/assets/img/a.png" alt="a"> more.</p>');
  });

  it('leaves two images in one paragraph alone', async () => {
    expect(await render('![a](/a.png) ![b](/b.png)')).toMatch(/^<p>/);
  });
});

import katex from 'katex';
import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { mathPlugin } from './math.ts';

async function render(markdown: string) {
  return (await markdownToHtml(markdown, { features: { math: true }, hastPlugins: [mathPlugin] })).html.trim();
}

describe('mathPlugin', () => {
  it('typesets inline math in its line', async () => {
    expect(await render('Inline $a^2$ math.')).toBe(`<p>Inline ${katex.renderToString('a^2')} math.</p>`);
  });

  it('typesets display math as a block of its own', async () => {
    expect(await render('$$\n\\frac{1}{2}\n$$')).toBe(katex.renderToString('\\frac{1}{2}', { displayMode: true }));
  });

  it('shows a formula it cannot read as its source, marked as an error, without failing', async () => {
    const html = await render('$\\frac{1}{$');
    expect(html).toContain('katex-error');
    expect(html).toContain('\\frac{1}{');
  });

  it('leaves code alone', async () => {
    expect(await render('`$x$`\n\n```js\nconst x = 1;\n```')).toBe(
      '<p><code>$x$</code></p>\n<pre><code class="language-js">const x = 1;\n</code></pre>',
    );
  });
});

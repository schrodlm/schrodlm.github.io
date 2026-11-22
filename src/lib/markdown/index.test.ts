import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { markdownToHtml } from 'satteri';
import { afterAll, describe, expect, it } from 'vitest';
import { houseStyle } from './index.ts';

const notesDir = mkdtempSync(join(tmpdir(), 'notes-'));
writeFileSync(join(notesDir, 'a-seedling.md'), '---\ntitle: A seedling\n---\n');
afterAll(() => rmSync(notesDir, { recursive: true }));

async function render(markdown: string, base = '/') {
  const hastPlugins = houseStyle({ base, notesDir });
  return (await markdownToHtml(markdown, { features: { math: true }, hastPlugins })).html;
}

describe('houseStyle', () => {
  it('takes heading ids from the text as written, before math is typeset or a stub link sprouts', async () => {
    const html = await render('## Euler $e^{i\\pi}$ identity\n## About [the seedling](/notes/a-seedling/)');
    expect([...html.matchAll(/<h2 id="([^"]*)"/g)].map((match) => match[1])).toEqual([
      'euler-eipi-identity',
      'about-the-seedling',
    ]);
  });

  it('finds a stub by its link before the base path goes on it', async () => {
    const html = await render('[Seedling](/notes/a-seedling/)', '/site-preview/');
    expect(html).toContain('<a href="/site-preview/notes/a-seedling/" class="stub"');
  });

  it('renders what a callout holds', async () => {
    const html = await render('> [!note] Title\n> Math $x$ and a [seedling](/notes/a-seedling/).\n>\n> ![A figure](/assets/img/a.png)');
    expect(html).toContain('class="callout callout-note"');
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="stub"');
    expect(html).toContain('<figure class="figure">');
  });
});

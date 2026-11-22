import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { houseStyle } from './index.ts';

async function render(markdown: string, base = '/') {
  const hastPlugins = houseStyle({ base });
  return (await markdownToHtml(markdown, { features: { math: true }, hastPlugins })).html;
}

describe('houseStyle', () => {
  it('takes heading ids from the text as written, before math is typeset', async () => {
    const html = await render('## Euler $e^{i\\pi}$ identity\n## Euler $e^{i\\pi}$ identity');
    expect([...html.matchAll(/<h2 id="([^"]*)"/g)].map((match) => match[1])).toEqual([
      'euler-eipi-identity',
      'euler-eipi-identity-1',
    ]);
  });
});

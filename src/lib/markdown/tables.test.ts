import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { tablePlugin } from './tables.ts';

describe('tablePlugin', () => {
  it('wraps a table in a box that scrolls sideways', async () => {
    const { html } = await markdownToHtml('| a | b |\n|---|---|\n| 1 | 2 |', { hastPlugins: [tablePlugin] });
    expect(html.trim()).toMatch(/^<div class="table-scroll"><table>[\s\S]*<\/table><\/div>$/);
  });
});

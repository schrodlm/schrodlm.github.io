import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { trail } from '../trail.ts';
import { headingTrailPlugin } from './headings.ts';

const html = async (markdown: string) =>
  (await markdownToHtml(markdown, { hastPlugins: [headingTrailPlugin] })).html.trim();

describe('headingTrailPlugin', () => {
  it('trails a section heading with the vine its text grows, hidden from screen readers', async () => {
    const vine = trail('Motivace')
      .map((run) => `<span class="${run.part}">${run.text.replaceAll('&', '&amp;')}</span>`)
      .join('');
    expect(await html('## Motivace')).toBe(
      `<div class="section-heading"><h2>Motivace</h2><span class="trail" aria-hidden="true">${vine}</span></div>`,
    );
  });

  it('leaves subheadings plain', async () => {
    expect(await html('### Plain')).toBe('<h3>Plain</h3>');
  });

  it('leaves a heading inside a quote or a list plain', async () => {
    expect(await html('> ## Quoted')).not.toContain('trail');
    expect(await html('- ## Listed')).not.toContain('trail');
  });
});

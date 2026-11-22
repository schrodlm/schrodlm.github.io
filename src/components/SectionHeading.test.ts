import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionHeading from './SectionHeading.astro';

async function render(title: string) {
  const container = await AstroContainer.create();
  return container.renderToString(SectionHeading, { props: { title } });
}

describe('SectionHeading', () => {
  it('is a level-two heading with the given text', async () => {
    expect(await render('Motivace')).toMatch(/<h2[^>]*>Motivace<\/h2>/);
  });

  it('hides its trail from screen readers', async () => {
    expect(await render('Motivace')).toMatch(/<span class="trail" aria-hidden="true"/);
  });
});

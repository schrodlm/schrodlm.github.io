import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import AboutWords from './AboutWords.astro';

// The words from a note are checked in the browser (tests/e2e/about.spec.ts), against the sample
// About note; the collections aren't loaded under Vitest.
it('says the words are to come when there is no About note', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(AboutWords, { props: { entry: undefined } });
  expect(html).toContain('The words for this page are still to come.');
  expect(html).not.toContain('class="prose"');
});

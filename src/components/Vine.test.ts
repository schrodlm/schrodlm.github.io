import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Vine from './Vine.astro';

async function render(path: string, props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(Vine, { props, request: new Request(`https://schrodlm.github.io${path}`) });
}

describe('Vine', () => {
  it('grows from the page’s address', async () => {
    expect(await render('/notes/sample-note/')).toContain('data-seed="/notes/sample-note/"');
  });

  it('grows from a seed it is given instead', async () => {
    expect(await render('/notes/sample-note/', { seed: 'elsewhere' })).toContain('data-seed="elsewhere"');
  });

  it('grows a different vine on a different page', async () => {
    const drawing = (html: string) => html.replace(/data-seed="[^"]*"/, '');
    expect(drawing(await render('/notes/a/'))).not.toBe(drawing(await render('/notes/b/')));
  });
});

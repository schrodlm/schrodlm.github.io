import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// The braille kit's internal page, for the screenshot tests: added only when the site is built
// from the sample content, so it never reaches the real site.
const kit = {
  name: 'braille-kit',
  hooks: {
    'astro:config:setup': ({ injectRoute }) =>
      injectRoute({ pattern: '/_kit', entrypoint: './tests/kit/index.astro' }),
  },
};

export default defineConfig({
  site: 'https://schrodlm.github.io',
  trailingSlash: 'always',
  integrations: [svelte(), ...(process.env.CONTENT_DIR === 'tests/fixtures/content' ? [kit] : [])],
});

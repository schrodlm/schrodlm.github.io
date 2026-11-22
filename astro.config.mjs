import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import svelte from '@astrojs/svelte';
import { basePathPlugin } from './src/lib/base-path.ts';

// The site lives at the root of schrodlm.github.io. The preview is served below a base path, which
// SITE_BASE sets (see docs/development.md).
const base = process.env.SITE_BASE ?? '/';

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
  base,
  trailingSlash: 'always',
  integrations: [svelte(), ...(process.env.CONTENT_DIR === 'tests/fixtures/content' ? [kit] : [])],
  markdown: { processor: satteri({ hastPlugins: [basePathPlugin(base)] }) },
});

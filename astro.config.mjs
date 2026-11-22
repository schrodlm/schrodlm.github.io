import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import svelte from '@astrojs/svelte';
import contentImages from './src/lib/content-images.ts';
import { houseStyle } from './src/lib/markdown/index.ts';

// The site lives at the root of schrodlm.github.io. The preview is served below a base path, which
// SITE_BASE sets (see docs/development.md).
const base = process.env.SITE_BASE ?? '/';
// The sync writes the content into src/content/; CONTENT_DIR points elsewhere (see src/content.config.ts).
const contentDir = process.env.CONTENT_DIR ?? 'src/content';

const notesDir = resolve(fileURLToPath(new URL('.', import.meta.url)), contentDir, 'notes');

// The kit's internal pages, for the screenshot tests: the braille kit, the vine in the page shell
// and a note of every construct. Added only when the site is built from the sample content, so
// they never reach the real site.
const kit = {
  name: 'braille-kit',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      injectRoute({ pattern: '/_kit', entrypoint: './tests/kit/index.astro' });
      injectRoute({ pattern: '/_kit/vine', entrypoint: './tests/kit/vine.astro' });
      injectRoute({ pattern: '/_kit/prose', entrypoint: './tests/kit/prose.astro' });
    },
  },
};

export default defineConfig({
  site: 'https://schrodlm.github.io',
  base,
  trailingSlash: 'always',
  integrations: [
    svelte(),
    contentImages({ dir: `${contentDir}/assets/img` }),
    ...(process.env.CONTENT_DIR === 'tests/fixtures/content' ? [kit] : []),
  ],
  markdown: {
    // Code is coloured through custom properties, which the prose styles set from the palette.
    shikiConfig: { theme: 'css-variables' },
    processor: satteri({
      // Dashes stay as written, so heading ids match the anchors normalized markdown gives, which
      // are made from the markdown as written: a `--` turned into a dash would lose its hyphens.
      // Quotes and ellipses are still set typographically.
      features: { math: true, smartPunctuation: { dashes: false } },
      hastPlugins: houseStyle({ base, notesDir }),
    }),
  },
});

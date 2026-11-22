import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://schrodlm.github.io',
  trailingSlash: 'always',
  integrations: [svelte()],
});

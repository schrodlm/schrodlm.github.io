/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Tests only ever see the invented sample content.
    env: { CONTENT_DIR: 'tests/fixtures/content' },
  },
});

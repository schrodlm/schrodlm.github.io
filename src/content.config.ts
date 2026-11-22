import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The sync writes the collections into src/content/. Tests and screenshots point CONTENT_DIR at the
// invented sample content in tests/fixtures/content/ instead.
const root = process.env.CONTENT_DIR ?? 'src/content';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${root}/notes` }),
  schema: z.object({ title: z.string() }),
});

export const collections = { notes };

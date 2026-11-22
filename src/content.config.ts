// One collection per kind of page, each with a strict schema: a field in the wrong form, or a field
// the collection doesn't take, fails the build and names the file and the field.
// docs/front-matter.md lists every field; keep it in step with this file.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCollection, reference } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  academicYear,
  email,
  expected,
  githubUrl,
  isoDate,
  line,
  month,
  monthOrPresent,
  pageFields,
  rating,
  SLUG,
  strict,
  text,
  url,
} from './lib/front-matter';

// The sync writes the collections into src/content/. Tests and screenshots point CONTENT_DIR at the
// invented sample content in tests/fixtures/content/ instead. A relative path is taken from the
// project's root, wherever the build is run from.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)), process.env.CONTENT_DIR ?? 'src/content');

/**
 * The pages in one folder of the content, each named by its path without `.md`: normalized markdown
 * names every file by its slug. Astro's default would let a `slug` field rename the page instead.
 */
const pages = (folder: string) =>
  glob({
    pattern: '**/*.md',
    base: `${root}/${folder}`,
    generateId: ({ entry }) => {
      const id = entry.replace(/\.md$/, '');
      if (!SLUG.test(id)) {
        throw new Error(`${folder}/${entry}: a file name must be a slug, lowercase words joined by hyphens`);
      }
      return id;
    },
  });

/**
 * Names a page of another collection by its slug, its file name without `.md`. The page must
 * exist, so a misspelt or deleted project fails the build here rather than leaving a dead link.
 * Astro re-checks only pages that changed since its last build, so a deleted project is caught
 * by a fresh build, as in CI.
 */
function slugOf<C extends 'projects' | 'universities'>(collection: C) {
  return z
    .string({ error: expected(`the slug of a page in ${collection}`) })
    .regex(SLUG, {
      error: 'must be a slug: lowercase words joined by hyphens, as in the file name',
      abort: true,
    })
    .refine((slug) => existsSync(join(root, collection, `${slug}.md`)), {
      error: (issue) => `names "${String(issue.input)}", but there is no ${collection}/${String(issue.input)}.md`,
    })
    .pipe(reference(collection));
}

interface Loaded {
  id: string;
  file: string;
}

/** Runs a check over a collection's pages once its loader is done, and fails the build with a message. */
function checked(loader: Loader, check: (pages: Loaded[]) => string | undefined): Loader {
  return {
    name: loader.name,
    load: async (context) => {
      await loader.load(context);
      const loaded = context.store.values().map(({ id, filePath }) => ({ id, file: filePath ?? id }));
      const problem = check(loaded);
      if (problem) throw new Error(`${context.collection}: ${problem}`);
    },
  };
}

/** A collection of a single page, which may also be absent. */
const single = (folder: string) =>
  checked(pages(folder), (loaded) =>
    loaded.length > 1
      ? `holds one page, but found ${loaded.length}: ${loaded.map(({ file }) => file).join(', ')}`
      : undefined,
  );

const notes = defineCollection({
  loader: pages('notes'),
  schema: strict(pageFields, 'a note'),
});

const posts = defineCollection({
  loader: pages('posts'),
  schema: strict(
    {
      ...pageFields,
      date: isoDate,
      project: slugOf('projects').optional(),
    },
    'a post',
  ),
});

const milestone = strict(
  {
    title: text,
    done: z.boolean({ error: expected('true or false') }).default(false),
  },
  'a milestone',
);

const projects = defineCollection({
  loader: pages('projects'),
  schema: strict(
    {
      ...pageFields,
      description: line,
      status: z.enum(['in progress', 'finished'], { error: expected('"in progress" or "finished"') }),
      languages: z
        .array(text, { error: expected('a list of languages') })
        .min(1, { error: 'must list at least one language' }),
      github: githubUrl.optional(),
      milestones: z.array(milestone, { error: expected('a list of milestones') }).default([]),
    },
    'a project',
  ),
});

const devlogs = defineCollection({
  loader: pages('devlogs'),
  schema: strict(
    {
      ...pageFields,
      date: isoDate,
      project: slugOf('projects'),
      session: z
        .number({ error: expected('the session number: 1, 2, 3…') })
        .int({ error: 'must be a whole number' })
        .min(1, { error: 'must be 1 or more' }),
      prs: z.array(url, { error: expected('a list of pull request addresses') }).default([]),
    },
    'a devlog',
  ),
});

const ratings = strict(
  {
    difficulty: rating,
    usefulness: rating,
    teaching: rating,
    worth_it: z.boolean({ error: expected('true or false') }),
  },
  'ratings',
);

const courses = defineCollection({
  loader: pages('courses'),
  schema: strict(
    {
      ...pageFields,
      code: text,
      university: slugOf('universities'),
      year: academicYear,
      semester: z.enum(['winter', 'summer'], { error: expected('"winter" or "summer"') }),
      written: isoDate.optional(),
      ratings: ratings.optional(),
      course_page: url.optional(),
    },
    'a course',
  ),
});

const universities = defineCollection({
  loader: pages('universities'),
  schema: strict({ ...pageFields, short_name: text }, 'a university'),
});

const nestedItem = strict({ text, items: z.array(text, { error: expected('a list of lines') }) }, 'an item');

/**
 * A CV bullet: a line, or `text:` with bullets of its own beneath it. The value's shape picks the
 * form, so a mistake inside a nested bullet names its field, which a union's error wouldn't.
 */
const item = z.unknown().transform((value, ctx): string | z.output<typeof nestedItem> => {
  const result = typeof value === 'object' && value !== null ? nestedItem.safeParse(value) : text.safeParse(value);
  if (result.success) return result.data;
  for (const issue of result.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
  return z.NEVER;
});
const items = z.array(item, { error: expected('a list of items') }).default([]);

/** A period from `start` to `end`, a month or `present`, which can't end before it starts. */
const period = { start: month, end: monthOrPresent };
const inOrder = ({ start, end }: { start: string; end: string }) => end === 'present' || end >= start;
// Compared only once both are well-formed, so a malformed month raises one error, not two.
const endsAfterStart = {
  path: ['end'],
  error: 'must not come before start',
  when: (payload: { issues: unknown[] }) => payload.issues.length === 0,
};

const cv = defineCollection({
  loader: single('cv'),
  schema: strict(
    {
      ...pageFields,
      name: text,
      headline: text,
      location: text,
      contacts: strict(
        {
          email: email.optional(),
          web: url.optional(),
          github: githubUrl.optional(),
          linkedin: url.optional(),
          phone: z
            .never({ error: 'is not allowed: the CV is public, so it carries no phone number' })
            .optional(),
        },
        'contacts',
      ),
      experience: z
        .array(
          strict({ role: text, organisation: text, place: text.optional(), ...period, items }, 'a job').refine(
            inOrder,
            endsAfterStart,
          ),
          { error: expected('a list of jobs') },
        )
        .default([]),
      education: z
        .array(
          strict({ school: text, place: text.optional(), degree: text, ...period, items }, 'a school').refine(
            inOrder,
            endsAfterStart,
          ),
          { error: expected('a list of schools') },
        )
        .default([]),
      projects: z
        .array(
          strict({ name: text, url: url.optional(), text: text.optional(), items }, 'a project').refine(
            (project) => project.text !== undefined || project.items.length > 0,
            { error: 'needs text, items, or both' },
          ),
          { error: expected('a list of projects') },
        )
        .default([]),
      skills: z.record(text, text, { error: expected('a map from each group of skills to its line') }).default({}),
      languages: z.record(text, text, { error: expected('a map from each language to how well I speak it') }).default({}),
    },
    'the CV',
  ),
});

const about = defineCollection({
  loader: single('about'),
  schema: strict(pageFields, 'the About page'),
});

/** The sections whose page opens with an intro, named by their URL: `home` is `/`. */
const INTRO_SECTIONS = ['home', 'notes', 'posts', 'projects', 'courses'];

const intros = defineCollection({
  loader: checked(pages('intros'), (loaded) => {
    const stray = loaded.filter(({ id }) => !INTRO_SECTIONS.includes(id));
    return stray.length > 0
      ? `${stray.map(({ file }) => file).join(', ')}: an intro is named after its section, one of ${INTRO_SECTIONS.join(', ')}`
      : undefined;
  }),
  schema: strict(pageFields, 'an intro'),
});

export const collections = { notes, posts, projects, devlogs, courses, universities, cv, about, intros };

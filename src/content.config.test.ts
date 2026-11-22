import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { z } from 'astro/zod';
import { describe, expect, test } from 'vitest';
import { collections } from './content.config';

// Front matter as YAML hands it over: an unquoted date is already a Date.
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

type Name = keyof typeof collections;

const valid = {
  notes: { title: 'A note' },
  posts: { title: 'A post', date: day('2024-03-14'), project: 'sample-project' },
  projects: {
    title: 'A project',
    description: 'One line about it.',
    status: 'in progress',
    languages: ['Rust'],
    github: 'https://github.com/example/a-project',
    milestones: [{ title: 'Start', done: true }, { title: 'Finish' }],
  },
  devlogs: {
    title: 'A session',
    date: day('2024-05-20'),
    project: 'sample-project',
    session: 1,
    prs: ['https://github.com/example/a-project/pull/1'],
  },
  courses: {
    title: 'FEX101 - A course',
    code: 'FEX101',
    university: 'example-university',
    year: '2025/26',
    semester: 'winter',
    written: day('2026-02-14'),
    ratings: { difficulty: 3.5, usefulness: 4, teaching: 5, worth_it: true },
    course_page: 'https://example.com/fex101',
  },
  universities: { title: 'Faculty of Examples', short_name: 'FEX' },
  cv: {
    title: 'CV',
    name: 'Jane Placeholder',
    headline: 'Invented engineer',
    location: 'Exampleville',
    contacts: { email: 'jane@example.com', github: 'https://github.com/example', leetcode: 'https://leetcode.com/example' },
    experience: [
      {
        role: 'Engineer',
        organisation: 'Example Corp',
        start: '2024-01',
        end: 'present',
        items: ['A line.', { text: 'A line with more:', items: ['one', 'two'] }],
      },
    ],
    education: [{ school: 'Example University', degree: "Master's", start: '2021-09', end: '2025-06' }],
    projects: [{ name: 'Coursework', items: ['a kernel'] }],
    skills: { Programming: 'TypeScript and C.' },
    languages: { English: 'fluent' },
  },
  about: { title: 'About' },
  intros: { title: 'Home' },
} satisfies Record<Name, Record<string, unknown>>;

async function parse(name: Name, data: Record<string, unknown>) {
  const schema = collections[name].schema as z.ZodType;
  return schema.safeParseAsync(data);
}

/** The issues a page's front matter raises, as Astro prints them: `field.path: message`. */
async function issues(name: Name, data: Record<string, unknown>) {
  const result = await parse(name, data);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

describe('the schemas', () => {
  test.each(Object.keys(valid) as Name[])('accept a well-formed %s page', async (name) => {
    expect(await issues(name, valid[name])).toEqual([]);
  });

  test('fill in the defaults', async () => {
    const result = await parse('notes', { title: 'A note' });
    expect(result.data).toMatchObject({ lang: 'en', tags: [] });
  });

  test('read a quoted date as the same day', async () => {
    const result = await parse('posts', { ...valid.posts, date: '2024-03-14' });
    expect(result.data).toMatchObject({ date: day('2024-03-14') });
  });

  test('accept a course that is not rated yet', async () => {
    const { written: _, ratings: __, course_page: ___, ...unrated } = valid.courses;
    expect(await issues('courses', unrated)).toEqual([]);
  });

  test('turn a project slug into a reference', async () => {
    const result = await parse('posts', valid.posts);
    expect(result.data).toMatchObject({ project: { collection: 'projects', id: 'sample-project' } });
  });

  // Each case breaks one field of a well-formed page, and expects the issue that names it.
  test.each<[Name, Record<string, unknown>, string]>([
    ['notes', { wroth_it: true }, 'wroth_it: is not a field a note takes'],
    ['notes', { slug: 'proj_2' }, 'slug: is not allowed'],
    ['notes', { draft: true }, 'draft: must be false or left out'],
    ['notes', { lang: 'Czech' }, 'lang: must be a language tag'],
    ['notes', { tags: 'one' }, 'tags: must be a list of tags'],
    ['notes', { title: undefined }, 'title: is required'],
    ['posts', { date: '14.3.2024' }, 'date: must be a date written YYYY-MM-DD'],
    ['posts', { date: new Date('2024-03-14T10:00:00Z') }, 'date: must be a date written YYYY-MM-DD'],
    ['posts', { date: '2024-02-30' }, 'date: must be a date written YYYY-MM-DD'],
    ['posts', { date: undefined }, 'date: is required'],
    ['posts', { project: 'no-such-project' }, 'project: names "no-such-project", but there is no projects/no-such-project.md'],
    ['posts', { project: 'Sample Project' }, 'project: must be a slug'],
    ['projects', { status: 'done' }, 'status: must be "in progress" or "finished"'],
    ['projects', { description: 'Two\nlines.' }, 'description: must fit on one line'],
    ['projects', { languages: [] }, 'languages: must list at least one language'],
    ['projects', { languages: 'Rust' }, 'languages: must be a list of languages'],
    ['projects', { github: 'https://gitlab.com/example/a' }, 'github: must be an address starting with https://github.com/'],
    ['projects', { milestones: [{ title: 'Start', state: 'done' }] }, 'milestones.0.state: is not a field a milestone takes'],
    ['devlogs', { project: undefined }, 'project: is required'],
    ['devlogs', { session: 1.5 }, 'session: must be a whole number'],
    ['devlogs', { session: 0 }, 'session: must be 1 or more'],
    ['devlogs', { prs: ['#12'] }, 'prs.0: must be a web address'],
    ['courses', { university: 'nowhere' }, 'university: names "nowhere", but there is no universities/nowhere.md'],
    ['courses', { year: 2025 }, 'year: must be an academic year written like 2025/26'],
    ['courses', { year: '2025/27' }, 'year: must be an academic year written like 2025/26'],
    ['courses', { semester: 3 }, 'semester: must be "winter" or "summer"'],
    ['courses', { ratings: { ...valid.courses.ratings, teaching: 6 } }, 'ratings.teaching: must be from 1 to 5 in half steps'],
    ['courses', { ratings: { ...valid.courses.ratings, difficulty: 3.25 } }, 'ratings.difficulty: must be from 1 to 5 in half steps'],
    ['courses', { ratings: { ...valid.courses.ratings, usefulness: 0.5 } }, 'ratings.usefulness: must be from 1 to 5 in half steps'],
    ['courses', { ratings: { difficulty: 3, usefulness: 3, teaching: 3 } }, 'ratings.worth_it: is required'],
    ['courses', { course_page: 'example.com' }, 'course_page: must be a web address'],
    ['universities', { short_name: undefined }, 'short_name: is required'],
    ['cv', { contacts: { phone: '+000 000 000' } }, 'contacts.phone: is not allowed'],
    ['cv', { contacts: { mastodon: 'https://example.com' } }, 'contacts.mastodon: is not a field contacts takes'],
    ['cv', { contacts: { leetcode: 'leetcode.com/example' } }, 'contacts.leetcode: must be a web address'],
    ['cv', { experience: [{ ...valid.cv.experience[0], start: '2024-1' }] }, 'experience.0.start: must be a month written YYYY-MM'],
    ['cv', { experience: [{ ...valid.cv.experience[0], end: 'now' }] }, 'experience.0.end: must be a month written YYYY-MM, or present'],
    ['cv', { education: [{ ...valid.cv.education[0], end: '2020-06' }] }, 'education.0.end: must not come before start'],
    ['cv', { experience: [{ ...valid.cv.experience[0], items: [{ items: ['x'] }] }] }, 'experience.0.items.0.text: is required'],
    ['cv', { experience: [{ ...valid.cv.experience[0], items: [{ text: 'a', items: ['b'], extra: 1 }] }] }, 'experience.0.items.0.extra: is not a field an item takes'],
    ['cv', { experience: [{ ...valid.cv.experience[0], items: [7] }] }, 'experience.0.items.0: must be text'],
    ['cv', { projects: [{ name: 'Empty' }] }, 'projects.0: needs text, items, or both'],
    ['cv', { skills: ['C'] }, 'skills: must be a map from each group of skills to its line'],
  ])('reject a broken %s page: %o', async (name, change, expected) => {
    const broken = { ...valid[name], ...change };
    expect((await issues(name, broken)).join('\n')).toContain(expected);
  });

  // A mistake that would trip a later check too is reported once, by the check that explains it.
  test.each<[Name, Record<string, unknown>, string]>([
    ['posts', { project: 'Sample Project' }, 'project: must be a slug: lowercase words joined by hyphens, as in the file name'],
    ['cv', { education: [{ ...valid.cv.education[0], start: '2024-1', end: '2024-05' }] }, 'education.0.start: must be a month written YYYY-MM'],
  ])('report one issue for a broken %s page: %o', async (name, change, expected) => {
    expect(await issues(name, { ...valid[name], ...change })).toEqual([expected]);
  });
});

describe('a build of broken content', () => {
  test('fails and names the file and the field', () => {
    const content = mkdtempSync(join(tmpdir(), 'content-'));
    try {
      cpSync('tests/fixtures/content', content, { recursive: true });
      const file = join(content, 'courses/fex101-sample-course.md');
      writeFileSync(file, readFileSync(file, 'utf8').replace('teaching: 5', 'teaching: 6'));

      // Astro's own sync loads every collection, in a child process with a cache of its own.
      const sync = `
        import { sync } from 'astro';
        try {
          await sync({ cacheDir: process.argv[1], force: true, logLevel: 'silent' });
        } catch (error) {
          console.log(JSON.stringify({ message: error.message, file: error.loc?.file }));
        }`;
      const run = spawnSync(process.execPath, ['--input-type=module', '-e', sync, join(content, '.cache')], {
        env: { ...process.env, CONTENT_DIR: content },
        encoding: 'utf8',
      });

      const error = JSON.parse(run.stdout) as { message: string; file: string };
      expect(error.file).toBe(file);
      expect(error.message).toContain('courses → fex101-sample-course');
      expect(error.message).toContain('**ratings.teaching**: must be from 1 to 5 in half steps');
    } finally {
      rmSync(content, { recursive: true, force: true });
    }
  }, 60_000);
});

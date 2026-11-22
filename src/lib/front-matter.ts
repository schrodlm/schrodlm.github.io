// The forms a front-matter field can take, shared by the collections in src/content.config.ts.
// Each schema carries its own message, written to follow the field's name: Astro prints
// "**ratings.teaching**: must be from 1 to 5 in half steps", next to the file.
import { z } from 'astro/zod';

/** The message for a field that is missing or has the wrong type, given the form it should take. */
export function expected(form: string) {
  return (issue: { input?: unknown }) =>
    issue.input === undefined ? `is required: ${form}` : `must be ${form}`;
}

/** A line of text that isn't empty. */
export const text = z
  .string({ error: expected('text') })
  .trim()
  .min(1, { error: 'must not be empty' });

/** Text on a single line, such as a one-line description. */
export const line = text.refine((value) => !value.includes('\n'), { error: 'must fit on one line' });

/** A web address starting with https:// or http://. */
export const url = z.url({
  protocol: /^https?$/,
  error: expected('a web address starting with https://'),
});

/** An address on GitHub. */
export const githubUrl = z.url({
  protocol: /^https$/,
  hostname: /^github\.com$/,
  error: expected('an address starting with https://github.com/'),
});

export const email = z.email({ error: expected('an email address') });

/** A list of tags. YAML's `tags: [a, b]` and a dash list are both lists. */
const tags = z.array(text, { error: expected('a list of tags') }).default([]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A day written `YYYY-MM-DD`. YAML reads an unquoted date as a timestamp, so a value arrives
 * either as a date at midnight UTC or, when quoted, as text; both become a Date at midnight UTC.
 */
export const isoDate = z.unknown().transform((value, ctx) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (value.toISOString().endsWith('T00:00:00.000Z')) return value;
  } else if (typeof value === 'string' && ISO_DATE.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)) return date;
  }
  ctx.addIssue({ code: 'custom', message: expected('a date written YYYY-MM-DD')({ input: value }) });
  return z.NEVER;
});

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** A month written `YYYY-MM`, for the CV's periods. */
export const month = z
  .string({ error: expected('a month written YYYY-MM') })
  .regex(MONTH, { error: 'must be a month written YYYY-MM' });

/** The end of a period: a month, or `present`. */
export const monthOrPresent = z
  .string({ error: expected('a month written YYYY-MM, or present') })
  .refine((value) => value === 'present' || MONTH.test(value), {
    error: 'must be a month written YYYY-MM, or present',
  });

function isCanonicalLanguageTag(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value)[0] === value;
  } catch {
    return false;
  }
}

/** A page's language as a BCP 47 tag, `en` unless it says otherwise. */
const lang = z
  .string({ error: expected('a language tag such as en or cs') })
  .refine(isCanonicalLanguageTag, { error: 'must be a language tag such as en or cs' })
  .default('en');

/** A rating on the 1–5 scale, in half steps. */
export const rating = z
  .number({ error: expected('a number from 1 to 5 in half steps, such as 3 or 3.5') })
  .refine((value) => value >= 1 && value <= 5 && Number.isInteger(value * 2), {
    error: 'must be from 1 to 5 in half steps, such as 3 or 3.5',
  });

/** An academic year written `2025/26`. */
export const academicYear = z
  .string({ error: expected('an academic year written like 2025/26') })
  .refine(
    (value) => {
      const match = /^(\d{4})\/(\d{2})$/.exec(value);
      return match !== null && (Number(match[1]) + 1) % 100 === Number(match[2]);
    },
    { error: 'must be an academic year written like 2025/26' },
  );

/** A slug: lowercase ASCII words joined by hyphens, with folders joined by slashes. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

/**
 * An object that takes only the fields it names. Every other field fails with its own name,
 * where Zod's strict objects would report them together, without a field to point at.
 */
export function strict<S extends z.core.$ZodLooseShape>(shape: S, what: string) {
  const unknownField = z.custom<never>(() => false, {
    error: `is not a field ${what} takes (see docs/front-matter.md)`,
  });
  return z.object(shape).catchall(unknownField) as unknown as z.ZodObject<
    z.core.util.Writeable<S>,
    z.core.$strict
  >;
}

/**
 * The fields every page may carry, in every collection. `title` always arrives with normalized
 * markdown. Obsidian's own properties are accepted and ignored where a page doesn't show them.
 */
export const pageFields = {
  title: text,
  lang,
  tags,
  aliases: z.array(text, { error: expected('a list of names') }).optional(),
  cssclasses: z.array(text, { error: expected('a list of class names') }).optional(),
  draft: z
    .literal(false, { error: 'must be false or left out: a draft is never published' })
    .optional(),
  // Astro reads a `slug` field as the page's name. The site names pages by file name only, and
  // says why, rather than reporting it as just another unknown field.
  slug: z
    .never({ error: 'is not allowed: a page is named by its file name, which is its slug' })
    .optional(),
};

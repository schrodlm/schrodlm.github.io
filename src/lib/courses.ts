// What the course pages work out from a course's front matter and body: its name without its code,
// its ratings as meters, and the order courses are listed in. A course is reached at
// /courses/<its path>/ and a university at /universities/<its path>/, the addresses the converter
// writes into links to them.

export type Semester = 'winter' | 'summer';

/** A course as far as listing it goes: when I took it, and its code. */
export interface Placed {
  data: { year: string; semester: Semester; code: string };
}

export const courseHref = (id: string) => `/courses/${id}/`;
export const universityHref = (id: string) => `/universities/${id}/`;

/** A course has a page of its own only when it has a review to show: text below its front matter. */
export const hasReview = (course: { body?: string | undefined }) => Boolean(course.body?.trim());

/** The course's name: its title without the code in front, as in `NSWI035 - Principy…`. */
export function courseName(title: string, code: string): string {
  const rest = title.slice(code.length);
  if (!title.startsWith(code) || !/^[\s\-–—:·]/.test(rest)) return title;
  return rest.replace(/^[\s\-–—:·]+/, '') || title;
}

/** A rating as written: `4`, or `3.5` for a half step. */
export const formatRating = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

interface MeterRun {
  part: 'on' | 'off';
  text: string;
}

const FULL = '█';
const EMPTY = '░';

/**
 * A rating from 1 to 5 as a short meter: five cells two characters wide, a whole point filling a
 * cell and a half point half of one. The filled part comes first, then the rest.
 */
export function meter(value: number): MeterRun[] {
  const cells = [1, 2, 3, 4, 5].map((point) =>
    value >= point ? FULL + FULL : value >= point - 0.5 ? FULL + EMPTY : EMPTY + EMPTY,
  );
  const drawn = cells.join(' ');
  const end = drawn.lastIndexOf(FULL) + 1;
  return [
    { part: 'on' as const, text: drawn.slice(0, end) },
    { part: 'off' as const, text: drawn.slice(end) },
  ].filter((run) => run.text);
}

const SEMESTERS: Semester[] = ['winter', 'summer'];

/** Courses in the order I took them: by academic year, winter before summer, then by code. */
export function oldestFirst<C extends Placed>(courses: readonly C[]): C[] {
  return [...courses].sort(
    ({ data: a }, { data: b }) =>
      a.year.localeCompare(b.year) ||
      SEMESTERS.indexOf(a.semester) - SEMESTERS.indexOf(b.semester) ||
      a.code.localeCompare(b.code),
  );
}

interface Year<C> {
  year: string;
  semesters: { semester: Semester; courses: C[] }[];
}

/** Courses grouped by academic year and then by semester, oldest first. */
export function byYearAndSemester<C extends Placed>(courses: readonly C[]): Year<C>[] {
  const years: Year<C>[] = [];
  for (const course of oldestFirst(courses)) {
    const { year, semester } = course.data;
    let last = years.at(-1);
    if (last?.year !== year) years.push((last = { year, semesters: [] }));
    const group = last.semesters.at(-1);
    if (group?.semester === semester) group.courses.push(course);
    else last.semesters.push({ semester, courses: [course] });
  }
  return years;
}

/** How many courses there are and the academic years they span: `3 courses · 2023/24–2025/26`. */
export function courseFacts(courses: readonly Placed[]): string {
  const count = `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`;
  if (courses.length === 0) return count;
  const years = courses.map(({ data }) => data.year).sort();
  const [first, last] = [years[0], years.at(-1)];
  return `${count} · ${first === last ? first : `${first}–${last}`}`;
}

interface Ratings {
  difficulty: number;
  usefulness: number;
  teaching: number;
}

/** The three ratings in their order on the page. */
export const RATED = ['difficulty', 'usefulness', 'teaching'] as const;

/** The ratings on one line, for a course in a list: `difficulty 3.5 · usefulness 4 · teaching 5`. */
export const compactScores = (ratings: Ratings) =>
  RATED.map((name) => `${name} ${formatRating(ratings[name])}`).join(' · ');

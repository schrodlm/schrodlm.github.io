import { describe, expect, test } from 'vitest';
import {
  byYearAndSemester,
  courseFacts,
  compactScores,
  courseName,
  formatRating,
  hasReview,
  meter,
  oldestFirst,
  type Placed,
  type Semester,
} from './courses';

const course = (code: string, year: string, semester: Semester): Placed => ({ data: { code, year, semester } });
const codes = (courses: Placed[]) => courses.map(({ data }) => data.code);

describe('a meter', () => {
  const drawn = (value: number) => meter(value).map(({ text }) => text).join('');

  test('fills a cell for each whole point and half a cell for a half point', () => {
    expect(drawn(1)).toBe('██ ░░ ░░ ░░ ░░');
    expect(drawn(3.5)).toBe('██ ██ ██ █░ ░░');
    expect(drawn(4.5)).toBe('██ ██ ██ ██ █░');
    expect(drawn(5)).toBe('██ ██ ██ ██ ██');
  });

  test('draws the filled part first, then the rest', () => {
    expect(meter(2.5)).toEqual([
      { part: 'on', text: '██ ██ █' },
      { part: 'off', text: '░ ░░ ░░' },
    ]);
    expect(meter(5)).toEqual([{ part: 'on', text: '██ ██ ██ ██ ██' }]);
  });
});

describe('a rating', () => {
  test('is written as a whole number, or with its half step', () => {
    expect(formatRating(4)).toBe('4');
    expect(formatRating(3.5)).toBe('3.5');
  });

  test('all three fit on one line in a list', () => {
    expect(compactScores({ difficulty: 2, usefulness: 1.5, teaching: 5 })).toBe(
      'difficulty 2 · usefulness 1.5 · teaching 5',
    );
  });
});

describe('a course', () => {
  test('is named by its title without the code in front', () => {
    expect(courseName('NSWI035 - Principy distribuovaných systémů', 'NSWI035')).toBe('Principy distribuovaných systémů');
    expect(courseName('BI-OSY: Operační systémy', 'BI-OSY')).toBe('Operační systémy');
    expect(courseName('Operating systems', 'NSWI200')).toBe('Operating systems');
    expect(courseName('NSWI200', 'NSWI200')).toBe('NSWI200');
    expect(courseName('NSWI2001 Something else', 'NSWI200')).toBe('NSWI2001 Something else');
  });

  test('has a review when there is text below its front matter', () => {
    expect(hasReview({ body: 'A review.' })).toBe(true);
    expect(hasReview({ body: '\n  \n' })).toBe(false);
    expect(hasReview({})).toBe(false);
  });
});

describe('courses in order', () => {
  const taken = [
    course('NSWI200', '2025/26', 'winter'),
    course('NSWI028', '2025/26', 'summer'),
    course('BI-OSY', '2022/23', 'winter'),
    course('NSWI035', '2025/26', 'winter'),
    course('BI-PA2', '2022/23', 'summer'),
  ];

  test('run from the oldest year, winter before summer, then by code', () => {
    expect(codes(oldestFirst(taken))).toEqual(['BI-OSY', 'BI-PA2', 'NSWI035', 'NSWI200', 'NSWI028']);
  });

  test('group by academic year and then by semester', () => {
    const grouped = byYearAndSemester(taken).map(({ year, semesters }) => ({
      year,
      semesters: semesters.map(({ semester, courses }) => ({ semester, codes: codes(courses) })),
    }));
    expect(grouped).toEqual([
      {
        year: '2022/23',
        semesters: [
          { semester: 'winter', codes: ['BI-OSY'] },
          { semester: 'summer', codes: ['BI-PA2'] },
        ],
      },
      {
        year: '2025/26',
        semesters: [
          { semester: 'winter', codes: ['NSWI035', 'NSWI200'] },
          { semester: 'summer', codes: ['NSWI028'] },
        ],
      },
    ]);
  });

  test('a year with only a summer semester has only that group', () => {
    const [year] = byYearAndSemester([course('X1', '2024/25', 'summer')]);
    expect(year?.semesters.map(({ semester }) => semester)).toEqual(['summer']);
  });

  test('are counted, with the academic years they span', () => {
    expect(courseFacts(taken)).toBe('5 courses · 2022/23–2025/26');
    expect(courseFacts([course('X1', '2024/25', 'summer')])).toBe('1 course · 2024/25');
    expect(courseFacts([])).toBe('0 courses');
  });

  test('leave the list they were given as it was', () => {
    const before = codes(taken);
    byYearAndSemester(taken);
    expect(codes(taken)).toEqual(before);
  });
});

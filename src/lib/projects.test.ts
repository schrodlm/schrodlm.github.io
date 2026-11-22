import { describe, expect, test } from 'vitest';
import { byMonth, day, inOrder, latest, listOrder, stages } from './projects';

const session = (n: number, date: string) => ({ id: `p/session-${n}`, data: { session: n, date: new Date(`${date}T00:00:00Z`) } });
const ids = (sessions: { id: string }[]) => sessions.map(({ id }) => id);

describe('milestone stages', () => {
  const milestones = (...done: boolean[]) => done.map((d, i) => ({ title: `m${i}`, done: d }));

  test('the done ones, the first one not done in progress, and the rest to come', () => {
    expect(stages(milestones(true, true, false, false))).toEqual(['done', 'done', 'current', 'todo']);
  });

  test('an earlier milestone left undone is the one in progress, though later ones are done', () => {
    expect(stages(milestones(true, false, true))).toEqual(['done', 'current', 'done']);
  });

  test('with every milestone done, none is in progress', () => {
    expect(stages(milestones(true, true))).toEqual(['done', 'done']);
  });

  test('without milestones, there are none', () => {
    expect(stages([])).toEqual([]);
  });
});

describe('sessions in order', () => {
  test('go by session number, whatever order they come in', () => {
    expect(ids(inOrder([session(3, '2024-07-01'), session(1, '2024-05-01'), session(2, '2024-06-01')]))).toEqual([
      'p/session-1',
      'p/session-2',
      'p/session-3',
    ]);
  });

  test('number 10 comes after number 9', () => {
    expect(ids(inOrder([session(10, '2024-05-02'), session(9, '2024-05-01')]))).toEqual(['p/session-9', 'p/session-10']);
  });

  test('leave the list they were given as it was', () => {
    const given = [session(2, '2024-06-01'), session(1, '2024-05-01')];
    inOrder(given);
    expect(ids(given)).toEqual(['p/session-2', 'p/session-1']);
  });
});

describe('the field journal', () => {
  test('lists the sessions newest first, grouped by month', () => {
    const months = byMonth([
      session(1, '2026-09-23'),
      session(3, '2026-10-01'),
      session(2, '2026-09-30'),
      session(4, '2026-11-01'),
      session(5, '2026-11-01'),
    ]);
    expect(months.map(({ name, sessions }) => [name, ids(sessions)])).toEqual([
      ['November 2026', ['p/session-5', 'p/session-4']],
      ['October 2026', ['p/session-3']],
      ['September 2026', ['p/session-2', 'p/session-1']],
    ]);
  });

  test('keeps the same month of different years apart', () => {
    const months = byMonth([session(1, '2025-06-10'), session(2, '2026-06-10')]);
    expect(months.map(({ name }) => name)).toEqual(['June 2026', 'June 2025']);
  });

  test('keeps a session numbered out of step in the month it happened', () => {
    const months = byMonth([session(1, '2026-11-01'), session(2, '2026-10-01'), session(3, '2026-11-02')]);
    expect(months.map(({ name, sessions }) => [name, ids(sessions)])).toEqual([
      ['November 2026', ['p/session-3', 'p/session-1']],
      ['October 2026', ['p/session-2']],
    ]);
  });

  test('puts a session on the last day of a month in that month', () => {
    expect(byMonth([session(1, '2026-01-31')])[0]!.name).toBe('January 2026');
  });

  test('is empty without devlogs', () => {
    expect(byMonth([])).toEqual([]);
  });
});

describe('the latest devlog', () => {
  test('is the newest session, with the number of sessions', () => {
    expect(latest([session(2, '2026-11-01'), session(1, '2026-09-23'), session(3, '2026-11-02')])).toEqual({
      date: new Date('2026-11-02T00:00:00Z'),
      count: 3,
    });
  });

  test('is none without devlogs', () => {
    expect(latest([])).toBeUndefined();
  });
});

test('a day is written YYYY-MM-DD', () => {
  expect(day(new Date('2024-03-05T00:00:00Z'))).toBe('2024-03-05');
});

test('the projects list puts those in progress first, then the most recently worked on, then by name', () => {
  const project = (title: string, status: 'in progress' | 'finished', last?: string) => ({
    data: { title, status },
    latest: last ? { date: new Date(`${last}T00:00:00Z`), count: 1 } : undefined,
  });
  const order = listOrder([
    project('Finished, recent', 'finished', '2026-11-01'),
    project('Quiet B', 'in progress'),
    project('Old', 'in progress', '2025-01-01'),
    project('Quiet A', 'in progress'),
    project('Recent', 'in progress', '2026-10-01'),
    project('Finished, quiet', 'finished'),
  ]);
  expect(order.map(({ data }) => data.title)).toEqual([
    'Recent',
    'Old',
    'Quiet A',
    'Quiet B',
    'Finished, recent',
    'Finished, quiet',
  ]);
});

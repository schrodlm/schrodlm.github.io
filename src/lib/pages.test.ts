import { describe, expect, it } from 'vitest';
import { byTitle, folders, isoDay, languageName, newestFirst, pagePath, readingMinutes, seedName } from './pages';

describe('pagePath', () => {
  it('puts a page at its slug, below its collection', () => {
    expect(pagePath('notes', 'cap-theorem')).toBe('/notes/cap-theorem/');
    expect(pagePath('posts', 'why-is-formal-verification-so-hard')).toBe('/posts/why-is-formal-verification-so-hard/');
  });

  it('puts a project below the projects', () => {
    expect(pagePath('projects', 'sample-project')).toBe('/projects/sample-project/');
  });

  it('keeps a note’s folders as segments of its address', () => {
    expect(pagePath('notes', 'distributed-systems/raft')).toBe('/notes/distributed-systems/raft/');
  });
});

describe('seedName', () => {
  it('grows a flower from the collection and the slug', () => {
    expect(seedName('notes', 'distributed-systems/raft')).toBe('notes/distributed-systems/raft');
    expect(seedName('posts', 'a-post')).toBe('posts/a-post');
  });
});

describe('folders', () => {
  it('words each folder for the breadcrumb', () => {
    expect(folders('distributed-systems/raft')).toEqual(['distributed systems']);
    expect(folders('a/b-c/note')).toEqual(['a', 'b c']);
  });

  it('is empty for a page at the top of its collection', () => {
    expect(folders('cap-theorem')).toEqual([]);
  });
});

describe('readingMinutes', () => {
  it('reads two hundred words a minute, rounded', () => {
    expect(readingMinutes('word '.repeat(400))).toBe(2);
    expect(readingMinutes('word '.repeat(700))).toBe(4);
  });

  it('takes at least a minute', () => {
    expect(readingMinutes('')).toBe(1);
  });

  it('counts words, not the marks between them', () => {
    expect(readingMinutes(`${'slovo '.repeat(300)}${'- # | '.repeat(300)}`)).toBe(2);
  });
});

describe('languageName', () => {
  it('names my languages as their readers would', () => {
    expect(languageName('cs')).toBe('česky');
    expect(languageName('en')).toBe('english');
    expect(languageName('en-GB')).toBe('english');
  });

  it('names any other language in that language', () => {
    expect(languageName('de')).toBe('deutsch');
    expect(languageName('de-AT')).toBe('deutsch');
  });
});

describe('isoDay', () => {
  it('writes the day as YYYY-MM-DD', () => {
    expect(isoDay(new Date('2026-10-19T00:00:00Z'))).toBe('2026-10-19');
  });
});

const post = (id: string, date: string) => ({ id, data: { date: new Date(`${date}T00:00:00Z`) } });
const note = (id: string, title: string) => ({ id, data: { title } });

describe('newestFirst', () => {
  it('puts the newest post first, and posts of one day by slug', () => {
    const posts = [post('b', '2024-01-01'), post('c', '2025-06-01'), post('a', '2024-01-01')];
    expect(newestFirst(posts).map(({ id }) => id)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the list it was given alone', () => {
    const posts = [post('old', '2020-01-01'), post('new', '2021-01-01')];
    newestFirst(posts);
    expect(posts.map(({ id }) => id)).toEqual(['old', 'new']);
  });
});

describe('byTitle', () => {
  it('orders notes from A to Z by title, whatever their case, accents or folder', () => {
    const notes = [note('z/apple', 'apple'), note('cap', 'Čas'), note('b', 'Banana'), note('a', 'Zebra')];
    expect(byTitle(notes).map(({ data }) => data.title)).toEqual(['apple', 'Banana', 'Čas', 'Zebra']);
  });

  it('orders numbers by their value', () => {
    expect(byTitle([note('b', 'Note 10'), note('a', 'Note 9')]).map(({ id }) => id)).toEqual(['a', 'b']);
  });
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { markdownToHtml } from 'satteri';
import { afterEach, describe, expect, it } from 'vitest';
import { findStubs, isStub, noteSlug, stubLinkPlugin } from './stubs.ts';

describe('isStub', () => {
  it.each([
    ['---\ntitle: A\n---\n', true],
    ['---\ntitle: A\n---', true],
    ['---\ntitle: A\n---\n\n  \n', true],
    ['---\r\ntitle: A\r\n---\r\n', true],
    ['\uFEFF---\ntitle: A\n---\n', true],
    ['---\ntitle: A\n---\nA body.\n', false],
    ['---\ntitle: A\n---\n---\n', false],
  ])('%j is a stub: %s', (markdown, stub) => {
    expect(isStub(markdown)).toBe(stub);
  });
});

describe('findStubs', () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true });
    dir = undefined;
  });

  it('finds the notes with no body, in subfolders too', () => {
    dir = mkdtempSync(join(tmpdir(), 'stubs-'));
    mkdirSync(join(dir, 'deep'));
    writeFileSync(join(dir, 'empty.md'), '---\ntitle: Empty\n---\n');
    writeFileSync(join(dir, 'written.md'), '---\ntitle: Written\n---\nText.\n');
    writeFileSync(join(dir, 'deep', 'empty-too.md'), '---\ntitle: Empty too\n---\n');
    writeFileSync(join(dir, 'notes.txt'), '');
    mkdirSync(join(dir, 'odd.md'));
    expect(findStubs(dir)).toEqual(new Set(['empty', 'deep/empty-too']));
  });

  it('finds none when there is no notes folder', () => {
    expect(findStubs(join(tmpdir(), 'no-such-notes-folder'))).toEqual(new Set());
  });
});

describe('noteSlug', () => {
  it.each([
    ['/notes/tmux/', 'tmux'],
    ['/notes/tmux/#prefix-key', 'tmux'],
    ['/notes/tmux', 'tmux'],
    ['/notes/deep/raft/', 'deep/raft'],
    ['/notes/', undefined],
    ['/posts/tmux/', undefined],
    ['https://example.com/notes/tmux/', undefined],
    ['#notes', undefined],
  ])('%s is the note %s', (href, slug) => {
    expect(noteSlug(href)).toBe(slug);
  });
});

describe('stubLinkPlugin', () => {
  async function render(markdown: string) {
    return (await markdownToHtml(markdown, { hastPlugins: [stubLinkPlugin(new Set(['a-stub']))] })).html.trim();
  }

  it('draws a link to a stub as a seedling with its hint', async () => {
    expect(await render('[Raft](/notes/a-stub/#leader)')).toBe(
      '<p><a href="/notes/a-stub/#leader" class="stub" title="Not written yet">Raft' +
        '<span class="sprout" aria-hidden="true">,</span><span class="visually-hidden"> (not written yet)</span></a></p>',
    );
  });

  it('leaves links to written notes and other pages ordinary', async () => {
    const markdown = '[a](/notes/written/) [b](/posts/a-stub/) [c](https://example.com/) [d](#a-stub)';
    expect(await render(markdown)).not.toContain('class="stub"');
  });
});

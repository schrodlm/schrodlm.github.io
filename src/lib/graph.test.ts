import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { markdownToHtml } from 'satteri';
import { afterAll, describe, expect, it } from 'vitest';
import { linkGraph, noteLinks } from './graph';
import { houseStyle } from './markdown';

const a = (href: string, text = 'a link') => `<a href="${href}">${text}</a>`;

describe('noteLinks', () => {
  it('finds the notes a page links to, in the order first linked', () => {
    expect(noteLinks(`<p>${a('/notes/raft/')} and ${a('/notes/cap-theorem/')}</p>`, '/')).toEqual(['raft', 'cap-theorem']);
  });

  it('keeps a note’s folder in its slug', () => {
    expect(noteLinks(a('/notes/distributed-systems/raft/'), '/')).toEqual(['distributed-systems/raft']);
  });

  it('counts a note linked twice, or at its headings, once', () => {
    const html = [a('/notes/raft/'), a('/notes/raft/#leader-election'), a('/notes/raft/?x=1'), a('/notes/raft')].join(' ');
    expect(noteLinks(html, '/')).toEqual(['raft']);
  });

  it('reads links below the base path, and links written into the note as they are', () => {
    expect(noteLinks(`${a('/site-preview/notes/raft/')} ${a('/notes/paxos/')}`, '/site-preview/')).toEqual(['raft', 'paxos']);
  });

  it('leaves every other link alone', () => {
    const html = [
      a('/posts/a-post/'),
      a('/projects/a-project/'),
      a('/notes/'),
      a('#a-heading'),
      a('https://example.com/notes/raft/'),
      a('raft/'),
      '<a name="anchor">no href</a>',
      '<img src="/notes/raft/">',
      '<link href="/notes/raft/">',
    ].join(' ');
    expect(noteLinks(html, '/')).toEqual([]);
  });

  it('reads any quoting, other attributes and a `>` inside a value', () => {
    const html = [
      `<a class="stub" title="a > b" href="/notes/one/">x</a>`,
      `<a href='/notes/two/'>x</a>`,
      `<a href=/notes/three/>x</a>`,
      `<A HREF="/notes/four/">x</A>`,
      `<a title='see href="/notes/not-this/"' href="/notes/five/">x</a>`,
    ].join('');
    expect(noteLinks(html, '/')).toEqual(['one', 'two', 'three', 'four', 'five']);
  });

  it('ignores what only looks like a link: code, comments and scripts', () => {
    const html = [
      '<pre><code>&lt;a href="/notes/raft/"&gt;</code></pre>',
      '<!-- <a href="/notes/paxos/"> -->',
      '<script>"<a href=\\"/notes/zab/\\">"</script>',
    ].join('');
    expect(noteLinks(html, '/')).toEqual([]);
  });
});

describe('noteLinks over markdown rendered in the house style', () => {
  const notesDir = mkdtempSync(join(tmpdir(), 'notes-'));
  writeFileSync(join(notesDir, 'a-seedling.md'), '---\ntitle: A seedling\n---\n');
  afterAll(() => rmSync(notesDir, { recursive: true }));

  const render = async (markdown: string, base: string) =>
    (await markdownToHtml(markdown, { features: { math: true }, hastPlugins: houseStyle({ base, notesDir }) })).html;

  it('finds inline and reference links, links to stubs, and links in callouts and tables, not code', async () => {
    const markdown = [
      'See [raft](/notes/systems/raft/#terms) and [paxos][p], and [a seedling](/notes/a-seedling/).',
      '',
      '[p]: /notes/paxos/',
      '',
      '> [!note] Also',
      '> [cap](/notes/cap/)',
      '',
      '| a |',
      '| - |',
      '| [zab](/notes/zab/) |',
      '',
      '`[not](/notes/inline-code/)`',
      '',
      '```',
      '[not](/notes/fenced-code/)',
      '```',
    ].join('\n');
    for (const base of ['/', '/site-preview/']) {
      expect(noteLinks(await render(markdown, base), base)).toEqual(['systems/raft', 'paxos', 'a-seedling', 'cap', 'zab']);
    }
  });
});

describe('linkGraph', () => {
  // raft → paxos ↔ cap; zab → raft; lonely links to nothing and nothing links to it.
  const graph = linkGraph(
    [
      { slug: 'raft', html: `${a('/notes/paxos/')} ${a('/notes/raft/#self')} ${a('/notes/missing/')}` },
      { slug: 'paxos', html: a('/notes/cap/') },
      { slug: 'cap', html: `${a('/notes/paxos/')} ${a('/notes/paxos/#again')}` },
      { slug: 'zab', html: a('/notes/raft/') },
      { slug: 'lonely', html: '<p>No links.</p>' },
    ],
    '/',
  );

  it('holds every note in slug order, linked or not', () => {
    expect(graph.notes).toEqual(['cap', 'lonely', 'paxos', 'raft', 'zab']);
  });

  it('holds every link once, leaving out links to itself and to notes that don’t exist', () => {
    expect(graph.links).toEqual([
      ['cap', 'paxos'],
      ['paxos', 'cap'],
      ['raft', 'paxos'],
      ['zab', 'raft'],
    ]);
  });

  it('gives each note its links out and in', () => {
    expect(graph.linksOut('raft')).toEqual(['paxos']);
    expect(graph.linksIn('raft')).toEqual(['zab']);
    expect(graph.linksOut('paxos')).toEqual(['cap']);
    expect(graph.linksIn('paxos')).toEqual(['cap', 'raft']);
  });

  it('counts a note linked both ways as one neighbour', () => {
    expect(graph.neighbours('paxos')).toEqual(['cap', 'raft']);
    expect(graph.degree('paxos')).toBe(2);
    expect(graph.neighbours('cap')).toEqual(['paxos']);
  });

  it('finds the notes two steps away whichever way the links run, never the note or a neighbour', () => {
    expect(graph.twoStepsAway('raft')).toEqual(['cap']);
    expect(graph.twoStepsAway('zab')).toEqual(['paxos']);
    expect(graph.twoStepsAway('cap')).toEqual(['raft']);
    expect(graph.twoStepsAway('paxos')).toEqual(['zab']);
  });

  it('leaves a wildflower with no neighbours at all', () => {
    expect(graph.degree('lonely')).toBe(0);
    expect(graph.neighbours('lonely')).toEqual([]);
    expect(graph.twoStepsAway('lonely')).toEqual([]);
  });

  it('knows nothing of a note it doesn’t hold', () => {
    expect(graph.linksOut('missing')).toEqual([]);
    expect(graph.linksIn('missing')).toEqual([]);
    expect(graph.degree('missing')).toBe(0);
    expect(graph.twoStepsAway('missing')).toEqual([]);
  });

  it('reads notes in folders below a base path', () => {
    const preview = linkGraph(
      [
        { slug: 'systems/raft', html: a('/site-preview/notes/systems/paxos/') },
        { slug: 'systems/paxos', html: '' },
      ],
      '/site-preview',
    );
    expect(preview.links).toEqual([['systems/raft', 'systems/paxos']]);
  });

  it('is the same graph whatever order the notes come in', () => {
    const pages = [
      { slug: 'b', html: a('/notes/a/') },
      { slug: 'a', html: `${a('/notes/c/')} ${a('/notes/b/')}` },
      { slug: 'c', html: '' },
    ];
    const one = linkGraph(pages, '/');
    const other = linkGraph([...pages].reverse(), '/');
    expect(other.links).toEqual(one.links);
    expect(other.neighbours('a')).toEqual(['b', 'c']);
  });
});

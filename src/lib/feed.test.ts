import { describe, expect, it } from 'vitest';
import { rss } from './feed';

const feed = (items = [{ title: 'A post', link: 'https://example.com/posts/a-post/', date: new Date('2026-10-19T00:00:00Z'), tags: ['one'] }]) =>
  rss({
    title: 'Me',
    description: 'My posts.',
    link: 'https://example.com/',
    self: 'https://example.com/feed.xml',
    items,
  });

describe('rss', () => {
  it('is an RSS 2.0 channel that names its own address', () => {
    const xml = feed();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain('<atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain('<link>https://example.com/</link>');
  });

  it('carries each post with its address as its id, its day and its tags', () => {
    const xml = feed();
    expect(xml).toContain('<link>https://example.com/posts/a-post/</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://example.com/posts/a-post/</guid>');
    expect(xml).toContain('<pubDate>Mon, 19 Oct 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<category>one</category>');
  });

  it('escapes what XML would read as markup', () => {
    const xml = feed([{ title: 'A & B <c>', link: 'https://example.com/posts/a/?x=1&y=2', date: new Date(0), tags: [] }]);
    expect(xml).toContain('<title>A &amp; B &lt;c&gt;</title>');
    expect(xml).toContain('<link>https://example.com/posts/a/?x=1&amp;y=2</link>');
  });
});

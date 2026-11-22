// The RSS 2.0 feed of my posts. Every address in it is absolute, as feed readers need.

export interface FeedItem {
  title: string;
  link: string;
  date: Date;
  tags: string[];
}

export interface Feed {
  title: string;
  description: string;
  // The site's home page and the feed's own address.
  link: string;
  self: string;
  items: FeedItem[];
}

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function rss({ title, description, link, self, items }: Feed): string {
  const xmlItems = items.map((item) =>
    [
      '    <item>',
      `      <title>${escape(item.title)}</title>`,
      `      <link>${escape(item.link)}</link>`,
      `      <guid isPermaLink="true">${escape(item.link)}</guid>`,
      `      <pubDate>${item.date.toUTCString()}</pubDate>`,
      ...item.tags.map((tag) => `      <category>${escape(tag)}</category>`),
      '    </item>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escape(title)}</title>`,
    `    <link>${escape(link)}</link>`,
    `    <description>${escape(description)}</description>`,
    `    <atom:link href="${escape(self)}" rel="self" type="application/rss+xml"/>`,
    ...xmlItems,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

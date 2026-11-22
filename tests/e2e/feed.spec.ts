import { expect, test } from '@playwright/test';

test('the feed is valid RSS carrying the posts of /posts/, in its order, at absolute addresses that resolve', async ({ page, request }) => {
  const response = await request.get('/feed.xml');
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  await page.goto('/posts/');
  const listed = await page.locator('main li a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  const feed = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    const text = (el: Element, name: string) => el.querySelector(name)?.textContent ?? '';
    return {
      broken: doc.querySelector('parsererror') !== null,
      root: doc.documentElement.nodeName,
      version: doc.documentElement.getAttribute('version'),
      title: text(doc.querySelector('channel')!, 'title'),
      items: [...doc.querySelectorAll('item')].map((item) => ({
        link: text(item, 'link'),
        guid: text(item, 'guid'),
        date: text(item, 'pubDate'),
      })),
    };
  }, xml);
  expect(feed).toMatchObject({ broken: false, root: 'rss', version: '2.0', title: 'Matěj Schrödl' });
  expect(feed.items.length).toBeGreaterThan(0);
  expect(feed.items.map(({ link }) => new URL(link).pathname)).toEqual(listed);
  for (const item of feed.items) {
    expect(item.link).toMatch(/^https:\/\/schrodlm\.github\.io\/posts\/[a-z0-9-]+\/$/);
    expect(item.guid).toBe(item.link);
    expect(Number.isNaN(Date.parse(item.date))).toBe(false);
    expect((await request.get(new URL(item.link).pathname)).ok()).toBe(true);
  }
});

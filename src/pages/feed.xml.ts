// The RSS feed at /feed.xml: every post, the newest first, each with its title, address, date and
// tags. The addresses carry the base path, so the preview's feed points at the preview.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { withBase } from '../lib/base-path';
import { newestFirst, pagePath } from '../lib/pages';
import { rss } from '../lib/feed';

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('astro.config.mjs must name the site, for the feed’s absolute addresses');
  const absolute = (path: string) => new URL(withBase(path, import.meta.env.BASE_URL), site).href;
  const posts = newestFirst(await getCollection('posts'));
  const body = rss({
    title: 'Matěj Schrödl',
    description: 'My posts, the newest first.',
    link: absolute('/'),
    self: absolute('/feed.xml'),
    items: posts.map((post) => ({
      title: post.data.title,
      link: absolute(pagePath('posts', post.id)),
      date: post.data.date,
      tags: post.data.tags,
    })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};

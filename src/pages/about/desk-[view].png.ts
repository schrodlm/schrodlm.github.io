// The desk's resting frame, drawn at build time by the same renderer the page turns it with: the
// picture a visitor sees before the script runs, without JavaScript, and with reduced motion.
// /about/desk-wide.png frames the whole desk, /about/desk-narrow.png the tower, for a phone.
import type { APIRoute, GetStaticPaths } from 'astro';
import { render, REST, VIEWS } from '../../lib/desk/render';
import { png } from '../../lib/png';

type View = keyof typeof VIEWS;

export const getStaticPaths = (() => (Object.keys(VIEWS) as View[]).map((view) => ({ params: { view } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const frame = render(REST, VIEWS[params.view as View]);
  return new Response(new Uint8Array(png({ w: frame.w, h: frame.h, data: frame.pixels })), {
    headers: { 'Content-Type': 'image/png' },
  });
};

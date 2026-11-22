// The CV plate's still, drawn at build time by the same code the page animates it with: the
// picture a visitor sees before the script runs, without JavaScript, and with reduced motion.
import type { APIRoute } from 'astro';
import { DESK_HEIGHT, DESK_WIDTH, STILL, deskFrame } from '../../lib/lamplit-desk';
import { png } from '../../lib/png';

export const GET: APIRoute = () =>
  new Response(new Uint8Array(png({ w: DESK_WIDTH, h: DESK_HEIGHT, data: deskFrame(STILL) })), {
    headers: { 'Content-Type': 'image/png' },
  });

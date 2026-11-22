import { cp, readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

// The converter copies the images notes embed into <content root>/assets/img/ and links them as
// /assets/img/<file>. This integration serves that folder at /assets/img/: the dev server reads it
// in place, and the build copies it into the built site.

const URL_PREFIX = '/assets/img/';

const TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

// The file a request asks for, or undefined when it is not a content image or would leave the folder.
export function imageFile(url: string, base: string, dir: string): string | undefined {
  let path = url.split(/[?#]/)[0] ?? '';
  const prefix = base.replace(/\/+$/, '');
  if (prefix && path.startsWith(`${prefix}/`)) path = path.slice(prefix.length);
  if (!path.startsWith(URL_PREFIX)) return undefined;
  let name: string;
  try {
    name = decodeURIComponent(path.slice(URL_PREFIX.length));
  } catch {
    return undefined;
  }
  const root = resolve(dir);
  const file = resolve(root, name);
  return file.startsWith(root + sep) ? file : undefined;
}

// `dir` is absolute or relative to the project's root, like the content collections' folders.
export default function contentImages({ dir: folder }: { dir: string }): AstroIntegration {
  let base = '/';
  let dir = folder;
  return {
    name: 'content-images',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base;
        dir = resolve(fileURLToPath(config.root), folder);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const file = req.url && imageFile(req.url, base, dir);
          if (!file) return next();
          try {
            const body = await readFile(file);
            res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream');
            res.end(body);
          } catch {
            next();
          }
        });
      },
      'astro:build:done': async ({ dir: out, logger }) => {
        const exists = await stat(dir).then((s) => s.isDirectory(), () => false);
        if (!exists) {
          logger.info(`no content images in ${dir}`);
          return;
        }
        await cp(dir, new URL(URL_PREFIX.slice(1), out), { recursive: true });
      },
    },
  };
}

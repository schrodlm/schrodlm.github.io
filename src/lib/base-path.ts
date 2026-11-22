import { defineHastPlugin, type HastPluginDefinition } from 'satteri';

// The converter writes site-absolute links into the markdown (`/notes/x/`, `/assets/img/x.png`).
// When the site is served below a base path, such as the preview at /site-preview/, they need the
// base in front. Links to other sites, relative links and same-page links are left alone, and so is
// HTML written into a note as it is, which reaches the plugin as raw text.

export function withBase(url: string, base: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  return base.replace(/^\/*/, '/').replace(/\/+$/, '') + url;
}

// A hast plugin for Sätteri, Astro's markdown processor.
export function basePathPlugin(base: string): HastPluginDefinition {
  return defineHastPlugin({
    name: 'base-path',
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        for (const name of ['href', 'src']) {
          const value = node.properties[name];
          if (typeof value === 'string') ctx.setProperty(node, name, withBase(value, base));
        }
      },
    },
  });
}

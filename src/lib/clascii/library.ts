// clascii, my ASCII art library, as the site serves it. Until it is on npm, its built JavaScript is
// kept in public/vendor/clascii/, in a folder named after its version and the commit it was built
// from, with its types and licence; docs/development.md says how to update it. Only the page at
// /clascii/ loads it, when it runs.
import type * as Clascii from '../../../public/vendor/clascii/0.1.0-98e3b45/index';

export type * from '../../../public/vendor/clascii/0.1.0-98e3b45/index';

/** Where the library is served, below the site's base. */
const LIBRARY = '/vendor/clascii/0.1.0-98e3b45/main.mjs';

/** Loads the library from the site, below the base path `base` (`/`, or `/site-preview/` for the preview). */
export function load(base: string): Promise<typeof Clascii> {
  return import(/* @vite-ignore */ base.replace(/\/+$/, '') + LIBRARY);
}

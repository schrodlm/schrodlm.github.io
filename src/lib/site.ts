// What every page says about the site: my name, and the sections the nav lists, in its order,
// with the one a page belongs to marked: `page` on the section's own page, `true` on a page inside
// it.
import { withBase } from './base-path';

export const NAME = 'Matěj Schrödl';

const SECTIONS = ['notes', 'posts', 'projects', 'courses', 'about', 'cv'] as const;
export type Section = (typeof SECTIONS)[number];

interface NavItem {
  name: Section;
  href: string;
  current: 'page' | 'true' | undefined;
}

/** The nav for the page at `here`, which belongs to `section`, with every link below `base`. */
export function nav(section: Section | undefined, here: string, base: string): NavItem[] {
  return SECTIONS.map((name) => {
    const href = withBase(`/${name}/`, base);
    const current = name === section ? (here === href ? 'page' : 'true') : undefined;
    return { name, href, current };
  });
}

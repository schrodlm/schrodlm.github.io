// The woodcut plates, found by slug. The pictures are drawn by scripts/plates/ into
// src/assets/plates/<group>/<slug>.<size>.png, one image pixel per cell; this file says what each
// one shows. A project or university is matched to its plate by its own slug, so nothing in the
// content names a plate; one without a plate of its own gets the neutral plate.
import type { ImageMetadata } from 'astro';

export interface Plate {
  image: ImageMetadata;
  /** What the plate shows, for its alt text. */
  alt: string;
}

/** A project's card on the projects list, and its page's header, wide or narrow (a phone). */
export type ProjectPlateSize = 'card' | 'wide' | 'narrow';
/** A university's page header, wide, or narrow on a phone and on its card on the courses home. */
export type UniversityPlateSize = 'wide' | 'narrow';

const NEUTRAL = 'neutral';

const PROJECTS: Record<string, string> = {
  rentczecher: 'a row of Prague houses at dusk, a few windows lit, a dog keeping watch on the pavement',
  'goob-the-renderer': 'a lit sphere and a cube on a checkered floor, the test scene of a renderer',
  'analysis-of-rotor-models':
    'machine code turned by a cog into an SMT formula, beside a plot of three solvers racing to a timeout',
  clascii: 'a sun over a hill, and the same picture set in characters',
  [NEUTRAL]: 'green hills under a pale sky, a path winding away past a signpost',
};

const UNIVERSITIES: Record<string, string> = {
  'fit-cvut': 'the ČVUT building in Dejvice, its terracotta wings and white ribbon-windowed centre behind the pylon',
  mff: 'the faculty’s palace on Malostranské náměstí beside St Nicholas, a tram at the stop',
};

const files = import.meta.glob<ImageMetadata>('../assets/plates/*/*.png', { eager: true, import: 'default' });

function load(group: string, slug: string, size: string, what: string): Plate {
  const image = files[`../assets/plates/${group}/${slug}.${size}.png`];
  if (!image) throw new Error(`The plate ${group}/${slug}.${size}.png is missing; run npm run plates.`);
  return { image, alt: `A woodcut of ${what}.` };
}

/** The slugs of the projects and universities that have a plate of their own. */
export const projectsWithPlates = Object.keys(PROJECTS).filter((slug) => slug !== NEUTRAL);
export const universitiesWithPlates = Object.keys(UNIVERSITIES);

export function projectPlate(slug: string, size: ProjectPlateSize): Plate {
  const key = Object.hasOwn(PROJECTS, slug) ? slug : NEUTRAL;
  return load('projects', key, size, PROJECTS[key]!);
}

export function universityPlate(slug: string, size: UniversityPlateSize): Plate {
  if (!Object.hasOwn(UNIVERSITIES, slug)) return projectPlate(NEUTRAL, size);
  return load('universities', slug, size, UNIVERSITIES[slug]!);
}

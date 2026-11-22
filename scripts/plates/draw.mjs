#!/usr/bin/env node
// Draws the woodcut plates and writes them to src/assets/plates/ as PNGs.
//
//   npm run plates                  every plate
//   npm run plates -- rentczecher   only the plates of the drawings named
//
// A plate is pixel art cut like a woodcut: one image pixel is one 3 px cell, tones are ordered
// (Bayer) dithering in the garden's colours, the paper shows through where nothing is cut, and a
// double-ruled plate mark goes round the edge. The PNGs hold one pixel per cell; the site shows
// each cell as 3 CSS pixels with `image-rendering: pixelated` (see src/components/Plate.astro).
//
// The drawings are code: projects.mjs has one per project (by its slug) and the neutral one,
// universities.mjs the two faculty buildings, woodcut.mjs the palette and the tools they share.
// They come from the prototypes on the "Jungle ASCII Prototypes" canvas. How to redraw a plate
// or give a project its own is in docs/development.md.
//
// Needs only Node.js; with the version in .nvmrc, an unchanged drawing writes the same bytes.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plate, png } from './woodcut.mjs';
import { project, projectSlugs } from './projects.mjs';
import { university, universitySlugs } from './universities.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/plates');

// The sizes, in cells. A project has a card on the projects list, and a header across its page
// that is wide on a desktop and narrow on a phone. A university has the wide header on its page
// and a narrow crop for its card on the courses home and for its page on a phone.
const SIZES = {
  projects: { card: [114, 64], wide: [237, 92], narrow: [114, 84] },
  universities: { wide: [237, 92], narrow: [114, 84] },
};
const DRAW = { projects: project, universities: university };
const SLUGS = { projects: projectSlugs, universities: universitySlugs };

const only = process.argv.slice(2);
const unknown = only.filter((slug) => !Object.values(SLUGS).flat().includes(slug));
if (unknown.length) {
  console.error(`No drawing named ${unknown.join(', ')}. The drawings: ${Object.values(SLUGS).flat().join(', ')}.`);
  process.exit(1);
}
// Redrawing every plate starts clean, so a drawing removed or renamed leaves no plate behind.
if (!only.length) rmSync(OUT, { recursive: true, force: true });
for (const group of Object.keys(SIZES)) {
  for (const slug of SLUGS[group]) {
    if (only.length && !only.includes(slug)) continue;
    for (const [size, [w, h]] of Object.entries(SIZES[group])) {
      const P = plate(w, h);
      DRAW[group](P, slug);
      const file = join(OUT, group, `${slug}.${size}.png`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, png(P));
      console.log(`${group}/${slug}.${size}.png  ${w}×${h}`);
    }
  }
}

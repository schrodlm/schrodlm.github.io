# Development

Running the site locally, rendering the CV, and deploying. How the parts fit
is in [architecture.md](architecture.md).

## The Astro site

The Astro site is being built on the `astro` branch, next to the Jekyll files,
and replaces them when it is done. It needs the Node.js version in `.nvmrc`
and, for the screenshot tests, Docker.

```bash
npm ci
npm run dev             # serve with live reload at http://localhost:4321
npm run check           # type-check
npm test                # unit tests
npm run build:fixtures  # build from the sample content in tests/fixtures/
npm run test:e2e        # screenshot tests, inside Playwright's own image
```

`npm run build` reads the collections from `src/content/`; setting
`CONTENT_DIR` points it elsewhere. The tests only ever use the invented sample
content in `tests/fixtures/content/`. Screenshots are taken inside Playwright's
image so they match CI; after an intended visual change, refresh them with
`npm run test:e2e -- --update-snapshots` and commit them with the change.

### Redrawing a plate

The woodcut plates (the projects' pictures and the faculty buildings) are
drawn by code in `scripts/plates/` and kept as PNGs in `src/assets/plates/`,
one image pixel per cell. Redrawing them needs only Node.js:

```bash
npm run plates                  # redraw every plate
npm run plates -- rentczecher   # redraw only the plates of the drawings named
```

Each project's drawing sits under its slug in `scripts/plates/projects.mjs`,
the buildings in `universities.mjs`, and the palette and shared tools in
`woodcut.mjs`. To redraw a plate, change its drawing, run the script and look
at `/kit/plates/` in `npm run dev`. To give a project its own plate, add a
drawing under its slug and say what it shows in `src/lib/plates.ts`; a project
without one gets the neutral plate. With the Node.js version in `.nvmrc`, an
unchanged drawing writes the same bytes, so changed PNGs mean a changed
drawing: refresh the screenshots and commit both with the drawing.

## Running the site

You need Ruby with Bundler:

```bash
bundle install
bundle exec jekyll serve --livereload
```

The site is served at <http://127.0.0.1:4000>. A change to `_config.yml` needs
a restart. The build's known warnings are tracked as `bug` issues; any other
warning is new.

## Rendering the CV PDF

The PDF is printed from the built site with Playwright, and needs Node.js. The
workflow in `.github/workflows/pages.yml` is the reference for the exact
steps:

```bash
bundle exec jekyll build
npm install --no-save playwright
npx playwright install chromium
node scripts/render-cv-pdf.mjs
```

The CV is set in Latin Modern (`fonts-lmodern` on Debian and Ubuntu). Without
it, the PDF falls back to another serif. The print styles are the
`@media print` block in `assets/main.scss`. Check them in a browser with
"emulate print media", or by printing `/cv.html`.

## Changing content

The collections (`_notes/`, `_posts/`, `_projects/`, `_courses/`) and
`assets/img/` are written by the sync, and the next sync overwrites any edit
made here. Change content in the vault. Change how content looks in the
layouts, includes and styles of this repo.

To preview vault content before it is pushed, run the converter with the
vault's config against a scratch clone of this repo, then build that clone.
Never commit the generated content.

## Deploying

Pushing to `main` deploys. It also runs from *Actions → Build and deploy site
→ Run workflow*. Follow a run with `gh run watch`.

## Files the build leaves out

`_config.yml`'s `exclude:` keeps the repository's own documentation and
tooling out of the published site. Jekyll copies any other file without front
matter to the site as it is, so add new docs or tooling there.

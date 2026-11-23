# Development

How I run, test, preview and deploy the site. How the parts fit is in
[architecture.md](architecture.md).

## Running the site

The site needs the Node.js version in `.nvmrc` and, for the screenshot tests,
Docker.

```bash
npm ci
npm run dev             # serve with live reload at http://localhost:4321
npm run check           # type-check
npm test                # unit tests
npm run build:fixtures  # build from the sample content in tests/fixtures/
npm run test:e2e        # screenshot tests, inside Playwright's own image
npm run build           # build from src/content/, as the deploy does
```

`npm run build` reads the collections from `src/content/`, which the sync
writes; setting `CONTENT_DIR` points it elsewhere. A clone without content
still builds, warning that each collection is empty, but has no CV page to
print. The images the content embeds sit in the content's `assets/img/`
folder, and the site serves them at `/assets/img/`, in the dev server and in
the build alike. The tests only ever use the invented sample content in
`tests/fixtures/content/`. Screenshots are taken inside
Playwright's image so they match CI; after an intended visual change, refresh
them with `npm run test:e2e -- --update-snapshots` and commit them with the
change.

## A base path

The site lives at the root of its domain. Setting `SITE_BASE` (for example
`SITE_BASE=/site-preview/`) builds it to be served below that path instead.
The content's links are site-absolute (`/notes/x/`), so a small plugin in the
markdown pipeline puts the base in front of them; the pages' own links use
`import.meta.env.BASE_URL`.

## The CV PDF

The PDF is printed from the built `/cv/` page with the Chromium that
`@playwright/test` pins, and lands beside it as `dist/cv/cv.pdf`:

```bash
npx playwright install --only-shell chromium   # once per Playwright version
npm run build
npm run pdf
```

The page brings its own fonts, Latin Modern Roman for print (its licence is in
`src/assets/fonts/latin-modern/`, and `scripts/fonts/latin-modern.sh` makes
them), so the PDF looks the same on every machine and needs no system fonts.
A build without a `/cv/` page fails the step, and so does a page that fails
to load a stylesheet, font or image, rather than printing a PDF that looks
wrong. Run it with the same `SITE_BASE` as the build. The end-to-end tests
print it from the sample CV and check it fits on one or two A4 pages; to
check the real CV still fits on two, build the preview and look at its PDF.

## Previewing with real content

The preview is a branch's site, built from the vault's real content and
served at <https://schrodlm.github.io/site-preview/> from its own repository,
`schrodlm/site-preview`. It needs Python 3 next to Node.js:

```bash
scripts/preview.sh <vault-dir> <converter-config>
```

It converts the vault's committed HEAD with the given converter config, builds
this repo's committed HEAD from the result below `/site-preview/`, prints the
CV PDF when there is a CV page, and force-pushes the built site to that
repository's `gh-pages` branch. The config stays in the vault, and the script
works in a temporary folder, so no vault content ever lands in this repo.
`--no-publish` stops before the push and keeps the folder, to look at the
built site first.

## Deploying

Pushing to `main` deploys: `.github/workflows/deploy.yml` builds the site,
prints the CV PDF and deploys the result to GitHub Pages. It also runs from
*Actions → Deploy the site → Run workflow*. Follow a run with `gh run watch`.

## Redrawing a plate

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

The desk on the About page is the exception: the build draws its resting
frame from the model in `src/lib/desk/`, the same one the page turns, so it
has no PNG to redraw. Change the model and build. So is the CV's lamplit
desk: the build draws its still from `src/lib/lamplit-desk.ts`, the same
drawing the page animates.

## Updating clascii

The showcase at `/showcase/clascii/` runs my ASCII art library,
[clascii](https://github.com/schrodlm/clascii), from its built JavaScript.
The library's own demo is published by its repo at `/clascii/`.
Until clascii is on npm the site keeps that build itself, in
`public/vendor/clascii/<version>-<commit>/`: the package's `main.mjs` and
`index.d.ts` with clascii's `LICENSE`, the folder named after the version in
its `package.json` and the commit it was built from. Only that page loads it.
To update it, in a clone of clascii at the commit to use:

```bash
cd js/package && npm ci && cd ../..   # once, the package's build tools
sbt js/npmPackage                     # writes js/package/main.mjs
```

Copy `js/package/main.mjs`, `js/package/index.d.ts` and `LICENSE` into a new
folder named for that version and commit, delete the old folder, and point
the paths in `src/lib/clascii/library.ts` at the new one. Run the checks and
the screenshot tests: a new build may draw the same picture differently.

Once clascii is on npm, the site installs it as a dependency at an exact
version instead, and the vendored folder goes.


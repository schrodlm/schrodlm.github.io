# Development

Running the site locally, rendering the CV, and deploying. How the parts fit
is in [architecture.md](architecture.md).

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

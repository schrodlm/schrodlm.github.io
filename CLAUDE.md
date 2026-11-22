# CLAUDE.md

My personal Astro site, the last stage of a pipeline: my private Obsidian vault syncs through `schrodlm/obsidian-md-converter` into this repo, which deploys to schrodlm.github.io. Read `docs/architecture.md` before touching the pipeline or how content renders. Binding decisions are the ADRs in `docs/adr/`.

## Working here

- **The collections are generated.** Everything in `src/content/` is rewritten whole by every sync (ADR 1); only the sync commits there. Fix content in the vault; the site accepts only normalized markdown and asks nothing of the converter (ADR 4). Fix presentation here, in `src/`.
- **Tests use invented content.** Tests, screenshots and examples use the sample content in `tests/fixtures/content/`, never vault content.
- **Preview against real vault content** with `scripts/preview.sh`, which converts the vault and builds in a temporary folder, so nothing generated lands here (see `docs/development.md`).
- **Build:** `npm run build`. Checks: `npm run check`, `npm test`, `npm run build:fixtures`, `npm run test:e2e`.
- **The revival** was planned on the wayfinder map, issue #1, *Revive schrodlm.github.io*. Its Notes hold the design thesis and the standing decisions; read them before design or structure work.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, driven via the `gh` CLI, ordered by milestones. See `docs/agents/issue-tracker.md`.

### Working on the site

One issue at a time, on a branch, through a PR into `main`. See `docs/agents/build.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

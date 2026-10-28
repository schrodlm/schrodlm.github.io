# CLAUDE.md

My personal Jekyll site, the last stage of a pipeline: my private Obsidian vault syncs through `schrodlm/obsidian-md-converter` into this repo, which deploys to schrodlm.github.io. Read `docs/architecture.md` before touching the pipeline or how content renders. Binding decisions are the ADRs in `docs/adr/`.

## Working here

- **The collections are generated.** `_notes/`, `_posts/`, `_projects/`, `_courses/` and `assets/img/` are rewritten whole by every sync (ADR 1). Fix content in the vault, fix conversion in the converter, fix presentation here in `_layouts/`, `_includes/`, `assets/` and the standalone pages.
- **Preview against real vault content** by running the converter into a scratch clone of this repo (recipe in `docs/development.md`). Discard the generated content, never commit it.
- **Build:** `bundle exec jekyll build`. Known build warnings are tracked as `bug` issues; anything else is new.
- **New top-level docs or tooling** go in `_config.yml`'s `exclude:`, or Jekyll publishes them as static files.
- **The revival** is planned on the wayfinder map, issue #1, *Revive schrodlm.github.io*. Its Notes hold the design thesis and the standing decisions; read them before design or structure work.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, driven via the `gh` CLI, ordered by milestones. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

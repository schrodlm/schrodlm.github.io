# 1. Content is written in the vault, and the site's collections are generated

Status: accepted (2025-08-19), recorded 2026-10-28

## Context

Notes, posts, projects and course reviews were first written in Obsidian and
then copied into the site by hand. Obsidian brings wikilinks, embeds, a graph,
and a single place to think. Copying by hand means two diverging copies of
every note. The alternative was to write in the site repo directly, in plain
markdown, and give up Obsidian.

## Decision

The private Obsidian vault is the single source of every piece of content. A
sync, which runs on every push to the vault, converts the mapped vault folders
with obsidian-md-converter and replaces `_notes/`, `_posts/`, `_projects/`,
`_courses/` and `assets/img/` in this repo whole. This repo owns how content
looks: layouts, includes, styles, scripts, the standalone pages and the CV.

## Consequences

- An edit to a collection made in this repo is lost on the next sync. Content
  fixes go to the vault, and conversion fixes go to the converter.
- Which vault folder a file sits in decides whether it is published.
- Everything the site can show is bounded by what the converter emits, so a
  new presentation of an Obsidian feature, such as callouts, is a converter
  change, a theme change, or both.
- The sync pushes with an access token kept as a secret in the vault, which
  can expire and must then be renewed there.
- Unpublishing is automatic for notes, but images, which are only ever copied,
  are not removed.

## Note (2026-11-22)

With the move to Astro ([ADR 2](0002-the-site-is-built-with-astro.md)), the
sync writes every collection and its images into one folder, `src/content/`,
and replaces that folder whole instead of `_notes/`, `_posts/`, `_projects/`,
`_courses/` and `assets/img/`. The decision above stands otherwise.

## Note (2026-11-26)

The sync pushes with a deploy key on this repo instead of an access token, so
its credential no longer expires and can write nowhere else.

Until now the sync converted over the old content, which replaced only the
folders it maps, not `src/content/` whole as the note above says. It now
converts into an empty folder and replaces `src/content/` with it, so the
folder of a mapping I remove leaves the site with the next sync. Images a page
no longer embeds already did.

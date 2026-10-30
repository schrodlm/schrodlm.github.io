# 2. The site is built with Astro

Status: accepted (2026-10-29)

## Context

The revival replaces the minima theme entirely with a design built on ASCII
art: procedurally grown flora and an interactive graph of notes. Both need the
same code at build time, to write a first frame into the HTML, and in the
browser, to animate it. Jekyll builds in Ruby and cannot share that code with
the browser. Jekyll's remaining advantage, the existing templates, disappears
with the rewrite. Eleventy, SvelteKit and staying on Jekyll were considered.

## Decision

The site is built with Astro. The content collections read the folders the
sync writes. A schema per collection is the written contract for the front
matter the site accepts. Markdown rendering, including callouts and math, is
done by the site's remark and rehype plugins. Interactive pieces are plain
TypeScript, and Svelte components are used as islands only where state gets
complex. The converter gains an output mode that writes neutral markdown
instead of Jekyll's dialect, rather than the site parsing Jekyll-isms.

## Consequences

- One toolchain, Node, builds the site and renders the CV PDF; Ruby leaves the
  repo.
- A front-matter mistake in the vault fails the build and names the file,
  instead of publishing a broken page.
- Moving the site waits on a converter release that writes neutral markdown,
  and on a sync that uses it.
- Astro releases a major version about yearly, and upgrading is a recurring
  chore.
- Existing URLs must be reproduced or redirected deliberately, since nothing
  carries them over automatically.

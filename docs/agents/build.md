# Building the Astro site

How an agent works on one build issue (label `build`, tracked in #47). Read
this, `CONTEXT.md`, the ADRs, and the issue with its comments before starting.

## Where the decisions are

- **The map, #1,** and the decision tickets it links: #7 (the garden), #8
  (how markdown renders), #17 (URLs), #19 (the graph view), #23 (About), #24
  (projects and devlogs), #25 (courses), #27 (braille, the bugs, the herbarium
  stub, the build), #28 (the CV). Later tickets override earlier ones where
  they disagree.
- **The prototypes** are boards on the "Jungle ASCII Prototypes" canvas,
  <https://claude.ai/artifact/KgGnnr3WStrREye2rS8ttj>. Read a board with the
  Artifact tool (`action: read`, `path: project/<Board>.dc.html`). The board
  titles in `project/canvas.json` say which variant each is; the decision
  tickets say which variant was chosen.
- **The prototype generators** are on the `prototype/garden` branch under
  `prototype/garden/` (`git show origin/prototype/garden:prototype/garden/<file>`).
  They are throwaway Python that writes the boards; port the ideas, not the
  code.

## Working on an issue

1. Branch `build/<issue>-<slug>` from the latest `origin/astro`, in your own
   worktree.
2. Use the Node.js version in `.nvmrc`. If `node --version` is older, prepend
   `~/.local/opt/node24/bin` to `PATH`.
3. Build what the issue's "done when" asks for, and nothing beyond it. Where
   a decision is missing, take the calmer, plainer option and say so in the
   PR.
4. Commit as the `git-commits` rules say: atomic commits, a one-line
   imperative subject and nothing else (no trailers), every commit green, and
   tests in their own commit right after what they test.
5. Before opening the PR, run `npm run check`, `npm test`,
   `npm run build:fixtures` and `npm run test:e2e`. Refresh screenshots only
   for changes you meant (`npm run test:e2e -- --update-snapshots`), and
   look at every new or changed screenshot before committing it.
6. Push the branch and open a PR into `astro` whose body follows the
   `pr` template (Summary, Evidence, Merge Danger) and says `Closes #<issue>`.
   Put screenshots in the Evidence. Don't merge it; the build lead reviews and
   merges.

## Rules of the house

- **Never commit vault content.** Tests, screenshots and examples use the
  invented sample content in `tests/fixtures/content/`. Add to it freely; keep
  it obviously invented.
- **The site consumes normalized markdown** (ADR 4) and asks nothing of the
  converter. If the site needs data, it works it out from the markdown.
- **Flowers are not ours to draw.** Every flower comes from
  `src/lib/herbarium/` (the stub, until the owner's library is published).
  Never draw a flower anywhere else.
- **Calm.** Decoration lives at the edges, never in the text column. Art is
  `aria-hidden`. Every animation stops under `prefers-reduced-motion` and
  shows its resting frame. Pages work without JavaScript.
- **Light only.** Colours come from the custom properties the page shell
  defines; don't introduce new ones without adding them there.
- **Docs and comments** are written in the owner's voice ("I"), stay generic
  (no counts, versions or private vault details), and use the glossary's
  words. Add new terms to `CONTEXT.md` in the same PR.
- **Dependencies** are pinned to exact versions. Prefer none: a small
  function beats a package.

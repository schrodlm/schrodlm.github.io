# 3. Flowers come from a separate, versioned library

Status: accepted (2026-10-30)

## Context

Every post and note on the site grows its own ASCII flower from its name, and
the flower is meant to stay the same for as long as the page lives. The same
flower is drawn at build time into the page and animated in the browser, and it
appears in several places: the garden, the page itself, its specimen card and
the herbarium. The generator needs nothing from the site, and its behaviour has
to be pinned, because any change to it could regrow every flower at once.

## Decision

The flower generator is its own project: a dependency-free TypeScript library in
its own public repository, published to npm. It is a pure function of a page's
name. It grows the specimen, draws it as a coloured character grid for a given
moment of wind, and gives its label. The site turns grids into HTML and depends
on the library like any other package, pinned to a major version.

Within a major version, the same name always grows the same flower. Only a new
major version may change existing flowers, and golden tests over a fixed set of
names guard that promise.

## Consequences

- Upgrading the library within its major version never changes a flower on the
  site; a major upgrade is a deliberate decision to regrow them.
- The library can be used outside the site, and has its own documentation and
  tests.
- A change to how flowers look is a library release followed by a site update,
  not an edit in this repo.

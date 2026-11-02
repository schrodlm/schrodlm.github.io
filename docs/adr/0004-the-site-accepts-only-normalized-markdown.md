# 4. The site accepts only normalized markdown

Status: accepted (2026-11-02)

## Context

My content is written in Obsidian, whose markdown has features no site
renders as they are: wikilinks, embeds with sizes, links to headings by their
text. Something has to turn it into what the site can render. It is tempting
to let the site understand a little of Obsidian, or to shape site decisions
around what that something does. Either one blurs the line between the two,
and every change on one side then leaks into the other.

## Decision

The site defines one input format, **normalized markdown**, and accepts
nothing else:

- front matter shaped by each collection's schema;
- CommonMark with GFM tables, task lists and footnotes, `$…$` and `$$…$$` math,
  and callouts as `> [!type] Title`;
- links as ordinary markdown links with absolute site paths, heading anchors in
  GitHub style, and plain text where a link has nowhere to go;
- images as ordinary markdown images with absolute paths and no size.

Where normalized markdown comes from is not the site's concern. No decision
about the site asks anything of whatever produces it.

## Consequences

- The site can be built, tested and previewed from any normalized markdown,
  with or without the vault.
- A new Obsidian feature reaches the site only by first having a form in
  normalized markdown; the site's renderer then decides how it looks.
- Producing normalized markdown from the vault is entirely the converter's
  job, and changing how it does that never touches the site.

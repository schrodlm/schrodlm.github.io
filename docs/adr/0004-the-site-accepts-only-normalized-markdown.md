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

The site accepts only **normalized markdown**, as the converter's published
specification defines it: one file per page named by its slug, YAML front
matter, and a CommonMark dialect with ordinary links and images. The site pins
the major version of the specification it accepts, and decides only how it
renders what it receives.

Who produces normalized markdown, and how, is not the site's concern. No
decision about the site asks anything of the producer; what the site needs from
the format goes to the specification's owner.

## Consequences

- The site can be built, tested and previewed from any normalized markdown,
  with or without the vault.
- A new Obsidian feature reaches the site only by first having a form in
  normalized markdown; the site's renderer then decides how it looks.
- Producing normalized markdown from the vault is entirely the converter's
  job, and changing how it does that never touches the site.
- A new major version of the specification is adopted by a deliberate change
  to the site.

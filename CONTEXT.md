# schrodlm.github.io

My personal site: a public garden of my notes, posts, projects and university-related stuff, written in my Obsidian vault and synced here to be published.

## Language

### Where content comes from

**Vault**:
The private Obsidian vault where every piece of content is written. The site
holds a generated copy of part of it, never the original.
_Avoid_: second brain, Obsidian (the editor)

**Sync**:
One run that regenerates the site's content from the vault, triggered by a
push to the vault. A sync replaces every collection whole, so content removed
from the vault disappears from the site.
_Avoid_: import, export, deploy

**Converter**:
The tool a sync runs to turn the vault's Obsidian markdown into the site's
markdown: it rewrites wikilinks, copies images and adds front matter.
_Avoid_: exporter, script

**Published**:
Reachable on the live site. A piece of content is published when a sync has
carried it here and a deploy has served it. Which vault folders publish is
decided by folder, not by a flag on the note.
_Avoid_: public, live

**Deploy**:
Building the site and serving it on GitHub Pages, run on every push to this
repo, the sync bot's pushes included.
_Avoid_: sync, publish

**Wikilink**:
Obsidian's `[[link]]` between vault notes. A sync turns each one into a link
to the target's page, or into its plain text when the target is not
published.
_Avoid_: internal link, backlink (that is the reverse direction)

**Callout**:
Obsidian's highlighted block (`> [!note]`, `> [!important]`), a quote with a
type and an optional title.
_Avoid_: admonition, alert

### What the site holds

**Collection**:
One kind of content with its own section of the site: notes, posts, projects
and courses. Each maps to one vault folder.
_Avoid_: category, section, type

**Note**:
One self-contained piece of knowledge, usually a single concept, linked to
other notes.
_Avoid_: article, page, entry, post

**Stub**:
A note that exists so others can link to it, with no body written yet. It is
published like any other note.
_Avoid_: draft (a draft is unfinished writing, a stub is unwritten)

**Post**:
A dated piece of writing with an argument or a story, longer than a note and
read on its own. A post may belong to a project.
_Avoid_: blog, article, note

**Project**:
A write-up of something I built, with its language, its status and its
repository. Posts written along the way belong to it.
_Avoid_: portfolio item, repo

**Course**:
A review of one university course I took: when, where, how hard, how
useful, whether it was worth it, and the materials I made for it.
_Avoid_: subject, class, předmět

**University page**:
A course-collection page introducing one university and
linking its courses. It is not itself a course and is left out of the course
list.
_Avoid_: hub, landing page

**Intro**:
The text shown above a collection's list on its section page, kept as a page
of that collection that is itself left out of the list.
_Avoid_: landing page (the field's name), front page

**Connected notes**:
The list under a note of the notes it links to. Only outgoing links, from that
one note. The code calls it the "note graph", which it is not.
_Avoid_: graph, note graph

**Graph view**:
A site-wide, interactive map of every note and the links between them, like
Obsidian's. Planned, not built.
_Avoid_: note graph, knowledge map

**CV**:
My curriculum vitae, a page of the site and a PDF printed from that page
at every deploy.
_Avoid_: resume

### How the site looks

**Garden**:
The band of ASCII plants across the top of the home page, swaying in one
wind. Every post stands in it as its own flower, among plants that belong to
no page.
_Avoid_: header, banner, canopy

**Flower**:
The ASCII plant a post or note grows from its seed. Every page has exactly
one, and it never changes while the page lives.
_Avoid_: icon, avatar, illustration

**Seed**:
What a page's flower is grown from. The same seed always grows the same
flower.
_Avoid_: hash, id

**Specimen**:
A page's flower as the herbarium presents it: a number, a Latin name, and the
traits its seed chose (its head, petals, stem and leaves).
_Avoid_: card, entry

**Specimen card**:
The museum label at the end of a post or note, naming its specimen and how
the seed grew it.
_Avoid_: footer, metadata

**Mark**:
The one-line glimpse of a flower shown beside a page's title in a list, so
the list and the garden match.
_Avoid_: icon, bullet

**Herbarium**:
The page that shows every specimen together, like a museum hall.
_Avoid_: gallery, catalogue, index

**Vine**:
The single vine that hangs beside the text on a post or note, where a
butterfly, a ladybug and now and then a bee live. Section headings trail a
short vine of their own.
_Avoid_: border, divider, decoration

## Relationships

- The **vault** feeds the site only through a **sync**, which runs the
  **converter**; a **deploy** then serves the result.
- Each **collection** maps to exactly one vault folder.
- A **note** links to other notes by **wikilinks**; its **connected notes**
  are those links.
- A **post** belongs to zero or one **project**, a project has any number of
  posts.
- A **course** belongs to one university, whose **university page** links it.
- Every **post** and **note** grows one **flower** from its **seed**; the
  **herbarium** shows each as a **specimen**, and the **garden** shows the posts.

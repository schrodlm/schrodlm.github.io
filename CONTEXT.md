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
The tool a sync runs to turn the vault's Obsidian markdown into normalized
markdown. It is a separate project, and the site knows nothing of it.
_Avoid_: exporter, script

**Normalized markdown**:
The only input the site accepts: markdown as the converter's published
specification defines it. Where it comes from is not the site's concern.
_Avoid_: neutral markdown, converter output, Obsidian markdown

**Published**:
Reachable on the live site. A piece of content is published when a sync has
carried it here and a deploy has served it. Which vault folders publish is
decided by folder, not by a flag on the note.
_Avoid_: public, live

**Deploy**:
Building the site and serving it on GitHub Pages, run on every push to this
repo, the sync bot's pushes included.
_Avoid_: sync, publish

**Preview**:
A build of the site in progress from the vault's real content, served below
`/site-preview/` from a repository of its own and pushed there by hand. It is
not the live site.
_Avoid_: staging, demo

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
One kind of content, read from its own folder and held to its own schema:
notes, posts, projects, devlogs, courses and universities, and the CV, the
About page and the intros. Notes, posts, projects and courses each have a
section of the site. Each maps to one vault folder.
_Avoid_: category, section, type

**Front matter**:
The YAML fields at the top of a page. Each collection takes a fixed set,
listed in `docs/front-matter.md`; a field in the wrong form, or one the
collection doesn't take, fails the build and names the file and the field.
_Avoid_: metadata, properties (Obsidian's word)

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
A write-up of something I built, with its languages, its status, its
repository and its milestones. Posts written along the way belong to it.
_Avoid_: portfolio item, repo

**Milestone**:
One step of a project's plan, done or not. The first one not done is the one
in progress.
_Avoid_: goal, task

**Devlog**:
The record of one working session on one project, numbered within it, in the
same sections every time: Summary, Goal, Done, Decisions, Problems and
surprises, Learned, Next, References.
_Avoid_: session log, diary, post (a post is read on its own)

**Field journal**:
A project's devlogs together, newest first and grouped by month, on the
project's page.
_Avoid_: changelog, log, timeline

**Course**:
A review of one university course I took: when, where, how hard, how
useful, whether it was worth it, and the materials I made for it.
_Avoid_: subject, class, předmět

**Rating**:
A course's score for its difficulty, its usefulness or its teaching, from 1
to 5 in half steps. A course has all three with its worth-it verdict, or none
and is *not rated yet*.
_Avoid_: grade, mark (a mark is a flower's glimpse), stars

**University page**:
A page introducing one university, its own collection, listing its courses
by academic year and semester. It is not itself a course.
_Avoid_: hub, landing page

**Intro**:
The text above a section's list, such as the courses home's or the home
page's. It is a page of its own in the intros collection, named after its
section.
_Avoid_: landing page, front page

**Connected notes**:
The list under a note of the notes it links to. Only outgoing links, from that
one note. The code calls it the "note graph", which it is not.
_Avoid_: graph, note graph

**Graph view**:
The map of how notes link, drawn as plates: one of the whole garden, with
every note as its flower and every link a vine, and a small one on each note
page showing that note's neighbourhood.
_Avoid_: note graph, knowledge map

**Plate**:
A picture drawn in pixels rather than characters, engraved like a woodcut in
the garden's tones, with its text laid over it. The graph view, the desks on
About and the CV, each project's picture and each faculty's building are drawn
as plates.
_Avoid_: canvas, image, illustration

**Desk**:
The plate on the About page: my desk as a small model drawn in the plate's
pixels, which turns, names its parts, slides one out with its card, and comes
apart. The parts list beneath it names each part's real model.
_Avoid_: 3D model, PC model, viewer

**Lamplit desk**:
The plate on the CV: me in silhouette at a desk at night, writing this CV with
a quill by an oil lamp, under the caption "me, writing this". Where motion is
welcome I write it line by line; otherwise the sheet is already written.
_Avoid_: me plate, hero image, the desk (that is About's)

**Wildflower**:
A note that nothing links to and that links to nothing. On the garden's plate
it grows on its own stem, apart from the clusters.
_Avoid_: orphan, isolated note

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

**Form**:
One of the three ways a flower is drawn: the whole plant, its head alone at a
given size, or its mark. Each form has a fixed footprint.
_Avoid_: variant, view

**Wind**:
The one number, from -1 to 1, that poses every plant at a moment. The site
moves it over time, so the garden sways; 0 is still air.
_Avoid_: breeze, sway

**Construction tape**:
What stands in for every flower until my `herbarium` library is published: a
striped box at each form's footprint, every trait of it labelled "under
construction".
_Avoid_: placeholder flower, dummy

**Herbarium**:
The page that shows every specimen together, like a museum hall.
_Avoid_: gallery, catalogue, index

**Vine**:
The single vine that hangs beside the text on a post, note or devlog, grown
from the page's address so each page has its own. A butterfly rests on its
leaves and a bee on its small blooms, which are part of the vine and not
flowers. Once a minute each takes a turn to fly to the next leaf or bloom,
never both at once. Section headings trail a short vine of their own.
_Avoid_: border, divider, decoration

**Soil**:
The ground under every page, above the footer bar: grass and mushrooms on
it, roots and stones in it, and in its middle the ants, carrying crumbs down
a tunnel to their nest and walking back up for more. It is the same on every
page.
_Avoid_: footer (that is the bar below it)

## Relationships

- The **vault** feeds the site only through a **sync**, which runs the
  **converter**; a **deploy** then serves the result.
- Each **collection** maps to exactly one vault folder.
- A **note** links to other notes by **wikilinks**; its **connected notes**
  are those links.
- A **post** belongs to zero or one **project**, a project has any number of
  posts.
- A **devlog** belongs to exactly one **project**; a project's devlogs make
  its **field journal**.
- A **course** belongs to one university, whose **university page** links it,
  and has three **ratings** or none.
- Every **post** and **note** grows one **flower** from its **seed**; the
  **herbarium** shows each as a **specimen**, and the **garden** shows the posts.

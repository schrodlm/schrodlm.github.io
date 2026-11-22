# Front matter

Every field the site takes, collection by collection: its form, whether it is
required, and an example. It is my checklist for the vault. The schemas in
`src/content.config.ts` are the same contract in code, and the two change
together.

## How the site reads a page

- **Folders.** The site reads normalized markdown from one folder per
  collection: `notes/`, `posts/`, `projects/`, `devlogs/`, `courses/`,
  `universities/`, `cv/`, `about/` and `intros/`. Subfolders are fine,
  except in `intros/`, where the name alone says which section an intro is for.
- **The file name is the slug.** A page is named by its path without `.md`,
  such as `cap-theorem` or `rentczecher/session-3`. A file name that isn't a
  slug (lowercase words joined by hyphens) fails the build. A `slug` field is
  refused, since it would rename the page.
- **Strict.** A field in the wrong form fails the build, and so does a field
  the collection doesn't take, because a misspelt optional field would
  otherwise vanish without a word. The build prints the file and the field:

  ```
  [InvalidContentEntryDataError] courses → nswi000-some-course data does not match collection schema.
    ratings.teaching: must be from 1 to 5 in half steps, such as 3 or 3.5
    wroth_it: is not a field a course takes (see docs/front-matter.md)
    Location:
      src/content/courses/nswi000-some-course.md
  ```

  Positions in a list count from 0: `experience.1.end` is the second job's
  `end`. Astro stops at the first page that fails, so a run shows one page's
  problems at a time.
- **Addresses.** A course with a review is served at `/courses/<slug>/`, a
  university at `/universities/<slug>/`, a project at `/projects/<slug>/` and
  a devlog at `/devlogs/<slug>/`, subfolders and all: the address the
  converter writes into links with `links: urls`. `courses/mff/nswi035.md` is
  `/courses/mff/nswi035/`, and `devlogs/rentczecher/session-3.md` is
  `/devlogs/rentczecher/session-3/`.
- **Pages that point at pages** name them by slug, and the page must exist: a
  post's `project: rentczecher` needs `projects/rentczecher.md`. A local build
  re-checks only the pages that changed since the last one, so a deleted
  project is caught by a fresh build, as in CI, or by `astro build --force`.

## Forms

| Form | Written as | Example |
|---|---|---|
| text | any text that isn't empty | `title: Teorém CAP` |
| one line | text without a line break | `description: A watchdog for flat listings.` |
| date | `YYYY-MM-DD`, quoted or not (see below) | `date: 2025-03-14` |
| month | `YYYY-MM`, for CV periods | `start: 2025-01` |
| academic year | `YYYY/YY`, the two years it spans | `year: 2025/26` |
| language | a BCP 47 tag in its usual case | `lang: cs`, `lang: en-GB` |
| web address | starting with `https://` (or `http://`) | `course_page: https://example.com/fex101` |
| slug | another page's file name, without `.md` | `project: sample-project` |
| rating | 1 to 5 in half steps: 1, 1.5 … 5 | `difficulty: 3.5` |
| list | a YAML list, `[a, b]` or one `- item` per line | `tags: [mff, systems]` |

YAML reads an unquoted date before the site sees it, and quietly rolls a day
that doesn't exist into the next month: `2024-02-30` arrives as 1 March. A
quoted `"2024-02-30"` fails the build as it should.

## Every page

Every collection takes these, on top of its own fields.

| Field | Form | Required | Notes |
|---|---|---|---|
| `title` | text | yes | Normalized markdown always has one. |
| `lang` | language | no, `en` | The page's language; the page renders it as `lang`. |
| `tags` | list of text | no | Shown where a page shows tags: notes, posts, devlogs and courses. |
| `aliases` | list of text | no | Obsidian's own property, accepted and ignored. |
| `cssclasses` | list of text | no | Obsidian's own property, accepted and ignored. |
| `draft` | `false` | no | A draft is never published, so only `false` gets here. |

To keep a property in the vault that the site doesn't use, I add it to the
schema first; otherwise the build fails on it.

## Notes

| Field | Form | Required | Notes |
|---|---|---|---|
| `date` | date | no | The day I wrote it. |
| `source` | web address | no | What the note is drawn from, such as a lecture recording. |
| `references` | list of web addresses | no | Further sources. |
| `related_course` | text | no | The code of the course the note belongs to, such as `NSWI028`. |

The site keeps these but doesn't show them yet.

```yaml
---
title: Teorém CAP
lang: cs
tags: [distributed-systems]
related_course: NSWI035
---
```

## Posts

| Field | Form | Required | Notes |
|---|---|---|---|
| `date` | date | yes | The day it was published. It orders the posts and never moves the URL. |
| `project` | slug of a project | no | The project the post belongs to. |

```yaml
---
title: Why is formal verification so hard?
date: 2026-10-19
project: rentczecher
tags: [verification]
---
```

## Projects

| Field | Form | Required | Notes |
|---|---|---|---|
| `description` | one line | yes | The one-liner on the project's card and page. |
| `status` | `in progress` or `finished` | yes | |
| `languages` | list of text, at least one | yes | The languages it is written in. |
| `github` | web address on `https://github.com/` | no | The repository. |
| `milestones` | list of milestones | no | In order. The first one not done is the one in progress. |

A milestone has a `title` (text, required) and `done` (`true` or `false`,
`false` if left out).

```yaml
---
title: rentczecher
description: A local-first desktop watchdog for flat listings.
status: in progress
languages: [Python, TypeScript, Rust]
github: https://github.com/example/rentczecher
milestones:
  - title: Watch the first portal
    done: true
  - title: Show each flat once
  - title: Signed installers
---
```

## Devlogs

A devlog records one working session of one project. Its sections (Summary,
Goal, Done, Decisions, Problems and surprises, Learned, Next, References) are
`##` headings in the body, not fields. The page knows each by its heading, as
written here: the first sentence of the Summary is the devlog's line in the
field journal, and the list items of Done, Decisions, Problems and surprises,
Learned and Next are counted and marked. Any other `##` heading is shown as
written.

| Field | Form | Required | Notes |
|---|---|---|---|
| `date` | date | yes | The day of the session. |
| `project` | slug of a project | yes | |
| `session` | a whole number from 1 | yes | The session's number within its project. |
| `prs` | list of web addresses | no | The pull requests the session opened or merged. |

```yaml
---
title: Deduplicating listings
date: 2026-03-02
project: rentczecher
session: 12
prs:
  - https://github.com/example/rentczecher/pull/41
tags: [sqlite]
---
```

## Courses

A course may have no review yet: then it has no `ratings`, no `written`, and
the body may be empty. A course with a body has a page at
`/courses/<slug>/`; one without is listed on its university's page and the
courses home without a link. The title may start with the code, as in
`NSWI035 - Principy…`: the pages show the code apart, and the name without it.

| Field | Form | Required | Notes |
|---|---|---|---|
| `code` | text | yes | The course's code, such as `NSWI035`. |
| `university` | slug of a university | yes | |
| `year` | academic year | yes | The academic year I took it in. |
| `semester` | `winter` or `summer` | yes | The semester of that year. |
| `written` | date | no | The day I wrote the review. |
| `ratings` | ratings | no | Left out, the course shows *not rated yet*. |
| `course_page` | web address | no | The course's own page. |

`ratings` holds all four or none:

| Field | Form | Notes |
|---|---|---|
| `difficulty` | rating | |
| `usefulness` | rating | |
| `teaching` | rating | |
| `worth_it` | `true` or `false` | The verdict. |

```yaml
---
title: NSWI035 - Principy distribuovaných systémů
lang: cs
code: NSWI035
university: mff
year: 2025/26
semester: winter
written: 2026-02-14
ratings:
  difficulty: 3.5
  usefulness: 4
  teaching: 5
  worth_it: true
course_page: https://example.com/nswi035
tags: [distributed-systems]
---
```

## Universities

The body is my text about the place. Its courses are grouped by their own
`year` and `semester`, so the university needs nothing more. Its page is at
`/universities/<slug>/`, under the plate of its building when the site has one
for that slug (`src/lib/plates.ts`), and a neutral plate otherwise.

| Field | Form | Required | Notes |
|---|---|---|---|
| `short_name` | text | yes | The short name, as in the breadcrumb `courses / MFF / NSWI035`. The `title` is the full name. |

```yaml
---
title: Faculty of Mathematics and Physics, Charles University
short_name: MFF
---
```

## CV

One page in `cv/`, in English. The front matter holds the timeline, and the body
is the short summary. Every line of text in it is inline markdown, so it can
carry `**bold**`, `*emphasis*` and `[links](https://example.com)`. A line with
a colon followed by a space must be quoted.

| Field | Form | Required | Notes |
|---|---|---|---|
| `name` | text | yes | My name, the CV's heading. |
| `headline` | text | yes | The line under it. |
| `location` | text | yes | |
| `contacts` | contacts | yes | Any of `email`, `web`, `github`, `linkedin` and `leetcode`. There is no phone number: the CV is public. |
| `experience` | list of jobs | no | Shown in the order written. |
| `education` | list of schools | no | Shown in the order written. |
| `projects` | list of projects | no | |
| `skills` | map of group to text | no | One line per group, in the order written. |
| `languages` | map of language to level | no | |

| Contact | Form |
|---|---|
| `email` | an email address |
| `web` | web address |
| `github` | web address on `https://github.com/` |
| `linkedin` | web address |
| `leetcode` | web address |

| Entry | Fields |
|---|---|
| a job | `role`, `organisation`, `start` (month) and `end` (month or `present`), all required; `place` and `items`, optional |
| a school | `school`, `degree`, `start` and `end`, all required; `place` and `items`, optional |
| a project | `name`, required; `url`, `text` and `items`, optional, but it needs `text`, `items` or both |

`end` can't come before `start`. `items` is a list of bullets. A bullet is a
line, or a line with bullets of its own:

```yaml
---
title: CV
name: Jane Placeholder
headline: Firmware engineer · C++ · embedded systems
location: Prague, Czech Republic
contacts:
  email: jane@example.com
  web: https://example.com
  github: https://github.com/example
  linkedin: https://www.linkedin.com/in/example
  leetcode: https://leetcode.com/example
experience:
  - role: C++ Firmware Developer
    organisation: Example Corp
    start: 2025-01
    end: present
    items:
      - I work on the [open firmware](https://example.com) of a family of printers.
      - text: "**Led the firmware for a release**, with its headline features:"
        items:
          - the first feature;
          - the second feature.
education:
  - school: Faculty of Examples, Example University
    place: Prague, Czech Republic
    degree: Master's, Computer Science
    start: 2025-09
    end: present
projects:
  - name: obsidian-md-converter
    url: https://github.com/schrodlm/obsidian-md-converter
    text: The CLI that publishes my vault to this site.
  - name: Coursework highlights
    items:
      - an OS kernel in C, built with a team of three.
skills:
  Programming: C++, C and Python. Also Java and TypeScript.
  Tools: CMake, gdb, Git and Docker.
languages:
  Czech: native
  English: fluent
---

The summary, a short paragraph.
```

## About

One page in `about/`. The body is the words, and nothing beyond the fields of
every page is needed.

```yaml
---
title: About
---
```

## Intros

An intro is the text above a section's list, one page in `intros/` named after
its section: `home` (the home page), `notes`, `posts`, `projects` or
`courses`. Any other name fails the build. Nothing beyond the fields of every
page is needed; the body is the text.

```yaml
---
title: Courses
---
```

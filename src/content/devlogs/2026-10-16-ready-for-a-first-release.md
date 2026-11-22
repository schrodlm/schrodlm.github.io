---
date: 2026-10-16
project: rentczecher
session: 16
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/137
- https://github.com/schrodlm/rentczecher/pull/138
- https://github.com/schrodlm/rentczecher/pull/139
- https://github.com/schrodlm/rentczecher/pull/140
title: "2026-10-16 Ready for a first release"
---
## Summary
The last fixes before the first release landed, and version 0.1.0 is tagged and building. Any place can now be searched, down to a street. A scan with no internet says so instead of pretending to work. No portal can keep a scan reading it forever. A version tag now builds the installers for all three systems and drafts a release, and the database starts its life from one clean schema. It is a beta, but it works.

## Goal
Fix what would hurt a first user, and make releasing a version one step: push a tag.

## Done
- **Any place as a search place.** The portals only search by region and district, so a profile searching a town used to save fine and then never find anything. Now the portals search the smallest district that holds the place, and the app keeps only the listings that lie inside it.
- **A scan with no internet fails honestly.** It used to finish as if it had worked and count every flat as missing. Now it saves nothing and says no portal could be reached. A scan with some portals down names them.
- **A cap on every search.** Bezrealitky and RE/MAX used to read page after page until the portal said stop. Now a search reads at most 50 pages on each portal, like Sreality, and stops the moment a portal serves a page it has already read. A normal search never notices.
- **Releases from a tag.** Pushing a version tag:
  - checks the tag matches the app's version
  - builds the installers on Windows, macOS and Linux
  - gives them names without the version, so a download link always finds the newest
  - drafts a release with all four

  I publish the draft by hand after trying it.
- **One clean schema.** The sixteen database changes made during development are folded into one file that creates the final schema directly. A database built from it is identical to one built the long way, table by table. This was the last chance to do it, before anyone has a real database.
- **A schema doc that tells the truth.** It described two tables nothing writes yet as if they were in use, and missed the table that holds what you viewed and starred.
- **A release build that works everywhere.** The step that lists the app's Rust libraries failed on fresh machines, because it refused to download anything. It now downloads what it needs, still pinned to the exact versions.
- **Version 0.1.0 tagged.**

## Decisions
- **50 pages per search on every portal.** That is up to 750 listings on Bezrealitky and about a thousand on RE/MAX, far more than a home search needs.
- **A repeated page is judged before filtering.** Otherwise a page whose new adverts are all filtered out would look repeated and end a real search early. The review caught that in the first version.
- **Releases start as drafts.** Nothing goes public until I have installed it myself.
- **Call it a beta, not a pre-release.** A pre-release is skipped by the latest-release links, so the download buttons would lead nowhere.
- **No licence texts for what dependencies bundle.** Python, lxml and PyYAML carry other projects' code without passing their credits along. Restoring them all made the notices script bigger and harder to follow for very little, so the notices keep naming those libraries without their texts.
- **The website's download buttons wait for the release.** They point at the published files, which only exist once the release is published.

## Problems and surprises
- **The AppImage was already covered.** I planned to collect the credits of the two hundred libraries it bundles, then found that the tool building it already copies every library's copyright file inside.
- **A soft reset nearly lost a change.** Folding the new page cap into an earlier commit left the old value in, because only staged changes are kept. I caught it and redid both commits.

## Learned
- **Count what the portal sent, not what you kept.** Any check of "is this page new" has to look at the raw page.
- **A migration number is a promise.** An old database at version 16 would never run a new second migration, which is why every development database had to start over.

## Next
- Try the draft release on Windows and macOS, mark it beta and publish it.
- Then switch the website's buttons to direct downloads.
- After the release: a minimum time between scans, and stopping for good when a portal refuses.

---

**References:** any place as a search place and the no-internet scan [#137](https://github.com/schrodlm/rentczecher/pull/137) · page caps [#138](https://github.com/schrodlm/rentczecher/pull/138) · release workflow [#139](https://github.com/schrodlm/rentczecher/pull/139) · squashed migrations [#140](https://github.com/schrodlm/rentczecher/pull/140) (closes [#89](https://github.com/schrodlm/rentczecher/issues/89)) · tag `v0.1.0` · install test [#54](https://github.com/schrodlm/rentczecher/issues/54)

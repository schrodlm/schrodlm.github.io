---
date: 2026-10-10
project: rentczecher
session: 9
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/99
title: "2026-10-10 Profiles can be edited end to end"
---
## Summary
The profile editor is finished and merged. Clicking + opens a window to create a profile, ✎ opens the selected one to edit or delete it, and the scoring section shows how listings would score while I set it up. On the way the scoring itself got simpler: I now set the weights directly on a bar, every preference is named for the value it prefers, and a preferred place or layout either earns its points or none. A UX round on top adds a score ring to every listing, sorting, and portal logos.

## Goal
Build the scoring section and the editor window, wire them into the inbox, and fix whatever felt wrong once I could actually use them.

## Done
- **The scoring section.** One card per preference with its setting, and example listings beside them scored live, near 100, 50 and 10, so I see what my choices mean on listings that look real.
- **Weights on a split bar.** Each counting preference is a segment as wide as its weight. Dragging the divider between two moves points between those two only, and the arrow keys nudge it. This replaced the Off to Top importance buttons after a round of three prototypes.
- **Preferred values, named so end to end.** `max_good_price`, `ideal_size_m2` and `ideal_land_m2` became `preferred_price`, `preferred_size_m2` and `preferred_land_m2`, in the engine, the database, the API and the panel. The cards read "Preferovaná cena" and so on.
- **The editor window.** Name, what and where for a new profile, limits, portals and scoring. A stored profile shows its search as a locked one-line summary, can be paused, and asks before deleting.
- **Mistakes caught in Czech.** A missing name, place or portal, or a typed minimum above a maximum, shows a Czech message and keeps Save disabled. If the engine still refuses something, its own reason follows a Czech "could not save".
- **Wired into the inbox.** + and ✎ open the editor, and the tabs update after a save or delete. With no profiles at all, the inbox says to create one.
- **Score rings and sorting.** Every listing shows its score as a ring that runs from bronze through amber to olive. The feed sorts by score, date, price, price per m² or size, with an arrow to turn the order around.
- **Portal logos on listings,** in the photo slot and on the source chips, with each portal's proper name.

## Decisions
- **Weights, not importance levels.** The levels only masked the weights, and they could not be read back exactly, since Low and Low saves the same as Top and Top. Setting the weights directly removed the guessing and the need to store levels.
- **A preferred layout or place is worth the same wherever it sits in the list.** Ranking them asked too much while setting up a profile.
- **Outside the preferred places means no place points.** The old 20 % was a leftover of the ranking. Now the weight I set is exactly what is at stake, and the rule says it in points: "Všech 20 bodů v kterémkoli z těchto míst, jinde žádné." Scoring by distance is a far-off issue.
- **A preference counts once its value is set,** with no switch to also turn on.
- **New types are written out field by field,** never cut from another type and glued back together. Plain subsets of the API's types stay as they are.
- **The ring stays in the palette.** Olive and amber read well enough as good and middling, and the five-colour rule holds.
- **Tests switch to English once the app speaks it.** For now they render Czech like the app.

## Problems and surprises
- **Escape in the place search closed the whole editor** and lost the draft. A review caught it. The search now marks the Escape it uses for its own list, and the editor leaves those alone.
- **Switching several preferences on in a row could squeeze one below the minimum,** after which a divider moved the wrong way. Found in review, fixed before it was pushed.
- **Blending olive and amber made mud.** Mixing the ring colour in plain RGB gave brown. Mixing in OKLCH keeps it vivid.
- **I did not see the rings at first.** My dev scenario's profiles had every weight at 0, so nothing scored. That is how it should behave, so the scenario now has a few preferences.
- **Commit hooks and untracked files.** The hooks hide unstaged edits but not new files, so a new component's strings went missing for a check. Moving the file aside for that commit fixed it.

## Learned
- **A type checker on its own is not enough proof.** The real check was running the whole flow against a real engine on a scratch database: create, rename, delete, each answered by the engine.
- **The difference between a weight and an importance.** They track the same thing, so only one of them should be stored and set. The other is just a way to show it.
- **Czech plurals in the catalog.** One message has three forms, 1 bod, 2 to 4 body, 5 and more bodů, and the translator picks the right one.

## Next
- Merge the UX polish.
- The next milestone after Profiles.

---

**References:** scoring section [#95](https://github.com/schrodlm/rentczecher/pull/95) ([#85](https://github.com/schrodlm/rentczecher/issues/85)) · editor window [#97](https://github.com/schrodlm/rentczecher/pull/97) ([#86](https://github.com/schrodlm/rentczecher/issues/86), split bar prototype on branch `prototype/weight-split`) · UX polish [#99](https://github.com/schrodlm/rentczecher/pull/99) (closes [#46](https://github.com/schrodlm/rentczecher/issues/46)) · importance levels not needed [#94](https://github.com/schrodlm/rentczecher/issues/94) · English tests [#96](https://github.com/schrodlm/rentczecher/issues/96) · place by distance [#98](https://github.com/schrodlm/rentczecher/issues/98) · price per m² [#81](https://github.com/schrodlm/rentczecher/issues/81)

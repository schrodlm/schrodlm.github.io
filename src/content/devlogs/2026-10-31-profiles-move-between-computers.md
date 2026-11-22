---
date: 2026-10-31
project: rentczecher
session: 20
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/157
title: "2026-10-31 Profiles move between computers"
---
## Summary
Profiles can now move from one computer to another. A new menu next to the profile tabs saves the chosen profiles into a file and adds the profiles from such a file. This was the last feature before release 0.3.0.

## Goal
Let someone set up their searches once and take them to another computer. Before today the only way was to build every profile again by hand.

## Done
- **Saving profiles to a file.** The new menu opens a window listing every profile, all ticked. Unticking some leaves them out. The system's own Save dialog then asks where the file goes.
- **Adding profiles from a file.** The system's Open dialog picks the file, the app adds every profile in it, and a short report lists what was added and what could not be.
- **What the file holds.** Each profile's search, its preferences, its portals and the kinds of place it shows nearby on the map. Places are saved by their official code, so they mean the same place on every computer.
- **Careful reading.** The app checks every field in the file. A file it did not write, or one edited into something it cannot read, is refused as a whole rather than half read. A file saved with an invisible marker some editors add at the start still reads fine.
- **The glossary and the privacy policy** name the new file and say that it never holds listings.

## Decisions
- **Importing always adds.** A profile from the file never replaces or merges into one already there. When its name is taken, it gets the next free number, so a file imported twice gives "Praha (3)" and not "Praha (2) (2)".
- **One refused profile does not stop the rest.** If the engine refuses a profile, for example because its place does not exist, the report names it and the others still come in.
- **The file carries searches, never listings.** The flats a profile found, its favourites and its price history stay on the computer that found them. That keeps the file small and keeps listing data from being passed around.
- **Imported profiles start active.** A paused profile comes in running, since on a new computer you most likely want it scanning.
- **The window owns the file's shape.** The desktop shell only shows the dialogs and moves the text. The file carries a version number, so a later format is refused and never misread.
- **Not the test scenarios.** The app already reads scenario files for its tests, but those are test tools that name places by name and hold listings, so the profiles file is its own simple format.

## Problems and surprises
- **Two imports at once.** A quick double click could open two dialogs and import the same file twice. The dialogs now block the window while they are open, and the app stays blocked until the import is done.
- **The menu got cut off.** Placed among the profile tabs, its list was clipped by the tabs' sideways scrolling. It now sits just after them.
- **Missing Czech in my own checkout.** After switching branches every Czech test failed, because the compiled Czech texts on my machine were older than the last feature. Rebuilding them fixed it, and the code was fine.
- **The first 0.3.0 build failed.** The updater's HTTPS libraries are under the ISC license, which the release's license check did not accept yet. ISC is permissive like MIT, so I added it and tagged 0.3.0 again. The normal checks never run the license step, so only a release build could have caught it.

## Learned
- **A strict reader catches change early.** Reading every field by name means that when the engine's idea of a profile changes, the code stops compiling right there, instead of imports quietly failing for users later.
- **0.2.0 users keep their data anyway.** Updating to 0.3.0 keeps the same data folder, so the file is for moving between computers, not for surviving the update.

## Next
- Release 0.3.0.
- Prove updating end to end with two signed releases.

---

**References:** profiles file PR [#157](https://github.com/schrodlm/rentczecher/pull/157) · panel `panel/src/lib/profiles-file.ts`, `panel/src/lib/import-profiles.ts` · shell `shell/src/profiles_file.rs`

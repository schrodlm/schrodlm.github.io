---
date: 2026-10-05
project: rentczecher
session: 7
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/79
title: "2026-10-05 Profiles move into the database"
---
## Summary
Profiles are no longer lines in a config file. They live in the database as proper user data, and the app's engine can now create, edit, pause and delete them on request. Choosing a place for a profile now means picking a real, official place from a search, so a profile can never point at a place that does not exist.

## Goal
Get everything the profile editor screen needs in place on the engine side. Before this, a profile could only be written by hand into a file, and its place was a loose name the engine had to guess at.

## Done
- **Profiles in the database.** A profile's search, its portals and its scoring wishes each got their own tables, with the database refusing the same bad values the code refuses. The config file and everything that read it are gone.
- **A clearer profile.** The list of accepted layouts became a room range plus a kitchen kind. Preferred neighbourhoods became preferred places, matched by where a listing actually is. Hidden defaults like an assumed ideal flat size are gone, so a setting is either chosen or empty.
- **Pausing remembers when.** A profile now records the moment it was paused instead of a plain on or off.
- **Managing profiles from the app.** The engine answers requests to list, show, create, change and delete profiles. Places travel as their official kind and code, and come back with readable names.
- **Searching for places.** Typing the start of a name finds matching official places, broadest first, optionally limited to an area and to chosen kinds of place.
- **Fixing how names are read.** The places database had been throwing away words like "Hlavní" from every name, which made almost two hundred streets impossible to find. Each portal now cleans up its own odd wording, and the database matches names exactly as officially written. I rebuilt it and checked that only the matching keys changed.
- **One list for each vocabulary.** The names of the portals and the layout codes are written down once in the core. Tests now fail if the scrapers, the database or the app's types fall out of step with them.
- **Two PRs,** split into small commits, each with its tests in the commit right after it.

## Decisions
- **A profile's search cannot be changed once created.** The listings it has already collected were found under that search, so changing it would quietly make them answer a different question. A different search is a new profile. Everything else, including the portals, can change.
- **Dropping a portal keeps its old listings,** and new scans simply stop visiting it. What happens to those listings gets settled together with deleting listings later.
- **"Inside" means at least partly inside.** Holešovice straddles two Prague districts, so it shows up when searching either one. Whether the same rule should apply when filtering listings is left for the next PR.
- **Weights can never be negative or infinite.** Preferences are meant to lift a listing's score, never to push it down, and an infinite weight breaks scoring.
- **Each portal fixes its own quirks.** Knowledge of how a portal writes names stays in that portal's code instead of a general rule deep in the engine that guessed for everyone.
- **Reviews only where they pay off.** Two independent reviews now run only on commits with real risk. Small and mechanical commits go straight in.

## Problems and surprises
- **The word-dropping rule broke more than it fixed.** Removing "Hlavní" everywhere also merged distinct places into the same key. Fixing it at the source turned out to be only two commits.
- **Reviews caught real bugs in the new API.** A number too large for the database crashed a request instead of being refused, and an infinite weight was accepted and then shown as empty.
- **The commit hooks tripped on unfinished files.** A new file that was not yet committed broke the checks, so it had to be moved aside during each commit.

## Learned
- **An HTTP status is just how the API reports a fact.** "This profile does not exist" is a fact about the data. The core raises it, and only the API layer decides it becomes a 404.
- **A type cannot be built from a list at runtime.** The list of portals has to be written down as a type first. The scraper registry is then checked against that type, rather than being the source of it.
- **Browsers block cross-site requests by default.** The engine has to list every request method the app may use, or the browser refuses it before it even reaches the engine.

## Next
- The profile editor screen, starting with a rough mockup to react to.
- Searching finer places natively on each portal.

---

**References:** profiles in the database [#78](https://github.com/schrodlm/rentczecher/pull/78) · profile and places API [#79](https://github.com/schrodlm/rentczecher/pull/79), landed on main by [#80](https://github.com/schrodlm/rentczecher/pull/80) · parent issue [#16](https://github.com/schrodlm/rentczecher/issues/16) ([fixed criteria decision](https://github.com/schrodlm/rentczecher/issues/16#issuecomment-5997076044)) · editor screen [#11](https://github.com/schrodlm/rentczecher/issues/11) · finer search places [#74](https://github.com/schrodlm/rentczecher/issues/74) · API contract `docs/api/openapi.json`

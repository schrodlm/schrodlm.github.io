---
date: 2026-10-10
project: rentczecher
session: 10
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/104
- https://github.com/schrodlm/rentczecher/pull/105
- https://github.com/schrodlm/rentczecher/pull/108
- https://github.com/schrodlm/rentczecher/pull/110
title: "2026-10-10 Favourites and a detail view"
---
## Summary
The inbox grew up. I can keep a listing as a favourite, and the inbox is no longer a wall of cards but a list beside the selected listing's details. The details show the score, how the listing compares with the rest of the profile, how its price moved over time on every portal, and where it lies, now with a pin on the map.

## Goal
Make the inbox something I can actually work through: keep the flats I like, read one listing at length without losing my place in the list, and see its price story and position at a glance.

## Done
- **Favourites.** A star keeps a listing for the profile. Favourites get their own section under the new ones, a gold outline, and are never cleaned away, however long the portals stop showing them. Starring a listing also marks it viewed.
- **A list beside the details.** The inbox is now a compact list on the left, in sections for new, favourite and already viewed listings, with the selected listing at length on the right. On a narrow window only one side shows at a time.
- **The details.** Price and price per m², the facts, a star, a link to every portal carrying the flat, and below them panels for the score, the reasons behind it, a comparison with the profile's other listings ("Cheaper than 40 % of the profile's listings"), the place on the map and a history of what happened. A panel with nothing to say is left out.
- **Moving through it by keyboard.** Up and down move through the list, Enter opens the listing on its portal, F stars it, and round buttons on the sides of the details step through as well.
- **Price over time.** A chart shows each portal's price for the flat as a step line on one shared scale, the listing's own in amber, with a key of every portal's current price. An unchanged price is named once and says since when. The history dates each change, rises included.
- **A pin on the map.** The map pins the listing at its point inside the district it already highlighted. A listing without a point shows just its district as before.

## Decisions
- **Selecting a listing views it.** A profile opens on its first listing without viewing it, so opening the app never silently clears what is new.
- **Rows stay put until the next load.** A listing viewed or starred keeps its section until the list loads again, so nothing jumps from under the cursor while I work through it.
- **Only real price changes are kept.** Repeat scans at the same price, and other profiles watching the same listing, collapse into one price with the first and last time it was seen.
- **The pin is a small plain dot,** no glow and no wording saying it is approximate. At district zoom it plainly is.
- **The engine knows nothing about the inbox.** The inbox is the panel's screen. The engine serves listings as a profile tracks them and each client presents them its own way, so the engine's names lost every mention of the inbox or its cards.

## Problems and surprises
- **Price drops vanished after one scan.** A drop was measured against the scan just before, and every scan records a price even when nothing changed, so a drop disappeared the next time round. It is now measured against the last price that differed.
- **Keys reached into open dialogs** and a favourite jumped sections when unstarred. Both came out of review and were fixed before merging.
- **"The cheapest" was said too often,** also when another listing had the same price. It now only shows when the listing truly is the cheapest.

## Learned
- **A list beside the details is a calmer way to read many items** than a feed of cards, because the place in the list never moves while I read.
- **Recording every observation and showing only changes** are two different jobs. Storing everything keeps the history honest, and collapsing it when serving keeps the chart readable.

## Next
- Filtering the inbox, and finishing the Profiles milestone.
- Pictures of each listing come with the Photos milestone.

---

**References:** favourites [#104](https://github.com/schrodlm/rentczecher/pull/104) (closes [#48](https://github.com/schrodlm/rentczecher/issues/48)) · list and detail layout [#105](https://github.com/schrodlm/rentczecher/pull/105) (closes [#101](https://github.com/schrodlm/rentczecher/issues/101), prototype on branch `prototype/inbox-layout`) · price history [#108](https://github.com/schrodlm/rentczecher/pull/108) (closes [#102](https://github.com/schrodlm/rentczecher/issues/102)) · map pin [#110](https://github.com/schrodlm/rentczecher/pull/110) (closes [#103](https://github.com/schrodlm/rentczecher/issues/103)) · listing pictures [#106](https://github.com/schrodlm/rentczecher/issues/106) · charges on every portal [#107](https://github.com/schrodlm/rentczecher/issues/107) · where a point comes from [#109](https://github.com/schrodlm/rentczecher/issues/109)

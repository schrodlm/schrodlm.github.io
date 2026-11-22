---
date: 2026-10-11
project: rentczecher
session: 11
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/111
- https://github.com/schrodlm/rentczecher/pull/112
- https://github.com/schrodlm/rentczecher/pull/115
- https://github.com/schrodlm/rentczecher/pull/116
- https://github.com/schrodlm/rentczecher/pull/120
title: "2026-10-11 Each flat once"
---
## Summary
The Profiles milestone is done. The inbox can be filtered, places with the same name land in the right town, every portal's prices read correctly, portal links open in the browser, and the biggest change of all: the same flat on two portals now shows once. What I view or star applies to the flat, not to one portal's posting of it.

## Goal
Finish everything left in Profiles, then fix what I found broken once I searched a whole region for real.

## Done
- **A filter beside the sort.** It narrows the inbox for now, without changing the profile: by portal, price drops only, a minimum score, layout, price, size and land. Each part offers only what the profile's listings actually have, and the active parts show as chips that clear them.
- **Places with the same name.** A street or village name that exists in several places is now settled by the place the profile searched, when exactly one of them lies inside it.
- **Prices read right on every portal.** RE/MAX mixed sales into a rent search and misread every price, Sreality showed flats at 0 Kč, and one Bezrealitky flat came in euros. All fixed: rentals only, the price read from the price alone, plots priced per m² multiplied out, and listings with no real price left out for now.
- **Portal links open in the browser.** In the app they did nothing at all. A small command of our own opens them, instead of a plugin that would have added dozens of dependencies.
- **Each flat once.** A flat on Sreality and Bezrealitky was two rows in the inbox. It is now one, shown by its cheapest listing, with the other portal as a link. Viewed and favourite moved from the posting to the flat, so viewing it on one portal views it everywhere, and a portal posting a flat I already saw does not make it new again.

## Decisions
- **A tracked property is the new term:** a flat as one profile tracks it, made of that profile's listings of it. The engine serves tracked properties, and the panel calls them properties for short.
- **The flat's state lives in a table of its own.** What belongs to one posting (when it was first and last seen, how often it was missed) stays per listing. What I did with the flat (viewed, starred) moved to a row per flat, which every posting of it points to.
- **The shown listing's own price line** in the chart is found by its id, not by its position in a list, so two equally priced portals can never mix up which line is amber.
- **Splitting a flat into two cards is accepted for now.** When a merge leaves one posting behind, that posting keeps showing as its own card with my marks intact. Keeping such a flat as one is a later issue, not needed for the first release.

## Problems and surprises
- **The merge bug.** A first version deleted the left-behind posting's state during a merge, which made it vanish from the inbox and come back as new. Caught in review before it was pushed.
- **RE/MAX glued the district onto the price.** Its price field became formatted text, the old parse failed, and the fallback read digits from the whole card, so 16 500 Kč in "Plzeň 3" became 316 500 Kč.
- **The opener plugin was far too heavy** for opening a link: 56 crates and almost 4 MB, replaced by three crates and a few lines.

## Learned
- **Normalising a table is about where a fact belongs.** Viewed and starred are facts about the flat, so storing them per posting made every posting disagree with the others.
- **A portal's own form is the documentation.** RE/MAX picks rent or sale by a field I had never sent. Reading its form found the bug in minutes.

## Next
- Theme and language switchers, then the Photos milestone.

---

**References:** filter [#111](https://github.com/schrodlm/rentczecher/pull/111) (closes [#100](https://github.com/schrodlm/rentczecher/issues/100)) · place ties [#112](https://github.com/schrodlm/rentczecher/pull/112) (closes [#63](https://github.com/schrodlm/rentczecher/issues/63)) · portal prices [#115](https://github.com/schrodlm/rentczecher/pull/115) ([#113](https://github.com/schrodlm/rentczecher/issues/113), [#114](https://github.com/schrodlm/rentczecher/issues/114)) · portal links [#116](https://github.com/schrodlm/rentczecher/pull/116) · tracked property [#120](https://github.com/schrodlm/rentczecher/pull/120) (closes [#117](https://github.com/schrodlm/rentczecher/issues/117)) · Updated section [#118](https://github.com/schrodlm/rentczecher/issues/118) · one flat split across properties [#119](https://github.com/schrodlm/rentczecher/issues/119)

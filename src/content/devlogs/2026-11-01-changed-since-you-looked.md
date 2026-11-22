---
date: 2026-11-01
project: rentczecher
session: 22
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/164
title: "2026-11-01 Changed since you looked"
---
## Summary
A flat you already looked at comes back to your attention when it changes. It moves into a new Updated section, and its history marks what changed. The matching across portals also got stricter, so different flats on one street stay apart. Together with iDNES Reality this makes version 0.4.0.

## Goal
Stop missing changes on flats I had already opened. Before today, a viewed flat that got cheaper stayed quietly in Viewed, and a viewed flat that turned up on another portal came back as New, which it is not.

## Done
- **An Updated section.** It sits right after New. A viewed flat lands there when a scan finds another portal posting it, or a price on any of its portals going down or up.
- **Leaving it.** Opening the flat again or "Mark all viewed" moves it back to Viewed.
- **Favourites stay put.** A starred flat that changed stays in Favourites with a small "Changed" mark under its star.
- **A history across portals.** A flat's history now lists the price changes on every portal that posts it, and says when another portal started posting it.
- **The change is highlighted.** The details open with a short "Changed since you viewed it" list, and the same rows stand out in the history, so it is clear where to look.
- **Stricter matching.** Two listings close together on one street used to be merged as one flat on location alone. Now the flat itself has to agree as well: the price, and for a flat the layout and the size.
- **A scenario to try it.** Test scenarios can now open and star flats between scans, and a new one shows drops, rises, a new portal, a changed favourite and a flat that did not change.
- **Version 0.4.0.** Built and signed on all three systems. It is the first release the updater can offer to people already on 0.3.0.

## Decisions
- **Price rises count too.** Any price change is news about a flat you were considering, not just a drop.
- **Right after New.** Changes matter almost as much as new flats, so they come second.
- **A new flat means a new flat.** A flat is new only when none of its listings was seen before. A known flat on another portal is updated, not new.
- **When in doubt, keep them apart.** A pair close on location but not agreeing on the flat is recorded as uncertain and never merged. Some real duplicates now show twice, for example one flat listed with and without its service charges, which is the lesser harm.
- **Not 1.0 yet.** The app still only scans when you click, and it has never run on its own for a week. 1.0 waits for background watching, notifications and a signed Windows installer.

## Problems and surprises
- **One profile could hide a change from another.** Prices were compared against the last price anyone saw. If a second profile scanned first, the first profile never saw the drop. Each profile now compares against its own last look.
- **Every flat on two portals claimed it was newly posted.** Two listings saved by the same scan got times a few microseconds apart, so the history thought one portal came after the other. Everything one scan saves now carries one time.
- **The highlight remembers the first look.** The list of changes starts from the first time you opened the flat, not the last, because only the first time is stored. Fine for now, worth fixing later.
- **The matching numbers.** Being on one street within 100 m already scored over the match line, and no gap in price or size could pull it back. In my own database 37 merges included pairs 16 m² apart and pairs 30% apart in price. The new rule undoes 17 of them.
- **Houses and land stopped merging at all.** The first version of the stricter rule asked every estate type for a layout and a size, which houses and plots often lack. The review caught it, and each type now has its own rule.

## Learned
- **Time is a value worth passing around.** Asking the clock separately for each save made one moment look like several.
- **Scenarios pay off.** Being able to open the app on a made-up history of scans is what made the history and the highlight easy to judge by eye.

## Next
- Publish 0.4.0 and see the updater offer it.
- Watching in the background, the last big piece before 1.0.

---

**References:** Updated section PR [#164](https://github.com/schrodlm/rentczecher/pull/164) · matcher PR [#163](https://github.com/schrodlm/rentczecher/pull/163) · version PR [#165](https://github.com/schrodlm/rentczecher/pull/165) · issue [#118](https://github.com/schrodlm/rentczecher/issues/118) · migration `0005` · scenario `engine/tests/scenarios/updated-flats.yaml` · ADR 6

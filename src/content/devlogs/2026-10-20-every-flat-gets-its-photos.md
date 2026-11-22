---
date: 2026-10-20
project: rentczecher
session: 17
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/145
title: "2026-10-20 Every flat gets its photos"
---
## Summary
Flats have photos now. After each scan the app keeps each new flat's main photo, the one the portal's results show anyway. When I open or star a flat, it fetches the rest of that flat's gallery, up to twenty photos. The photos stay on my computer for as long as the flat does. In the app they lead a flat's details as a collage, and any photo opens over the whole window.

## Goal
Show what a flat looks like without turning the app into a copy of the portals. The rule from the start is one private copy per person, and a full gallery for every listing after every scan would break it with a single broad search.

## Done
- **A main photo after each scan.** Each new flat gets its main photo, at most a hundred per portal in one go, newest first. What does not fit waits for the next scan.
- **The whole gallery when I look.** Opening a flat for a moment, or starring it, asks for its whole gallery. A flat I only scroll past never gets more than its main photo.
- **Galleries from the advert page, once.** Sreality's search results already list every photo. Bezrealitky and RE/MAX only show one, so for those the app reads the flat's own advert page once, when I open it, and takes the gallery from there.
- **Polite fetching.** Photos come one at a time with a pause between them. A portal that refuses is asked nothing more in that round, and a photo that keeps failing is given up after three tries.
- **Kept as long as the flat.** The photos are files in the app's data folder. When a flat is forgotten after ninety days, or its profile is deleted, its photos go too.
- **Private links.** The panel loads each photo through a link that only works while the engine runs.
- **The collage.** A flat's details now open with its first photos in a collage of different sizes, shaped by how many there are, the last tile counting the rest. While photos download, each missing one is a soft breathing wash in the app's colours. Without photos the collage is a slim banner with the portal's logo.
- **The full-window view.** Any photo opens over the whole window, with the arrows stepping through, Escape closing it and a credit linking back to the advert. While more photos are coming it says so.

## Decisions
- **Main photo first, the rest on demand.** This keeps a scan's footprint small and fetches the full gallery only for flats I actually look at, the way a person browsing would.
- **"Viewed" is not "opened".** The inbox can mark everything viewed at once, so viewing a flat cannot be what asks for its gallery. Opening it in the details for a moment is.
- **Read an advert page once, only on request.** It is the only time the app opens an advert itself, and the operator page and the docs now say so.
- **Keep the originals.** RE/MAX serves full-size uploads of a few megabytes. I raised the size limit to ten megabytes rather than shrink anything.
- **The collage over a thumbnail strip.** I picked it from a prototype with three layouts.
- **One pull request for the engine and the panel.** I wanted to try them together, so the panel's work went on top of the engine's and they became one.

## Problems and surprises
- **One broken advert page could stop every download.** A Bezrealitky page with an unexpected shape made the reader fail in a way nothing counted, and the same page was tried first on every round. The review caught it. Now an odd page counts as a failed read and is given up after three.
- **Answers arriving out of order.** While a gallery downloads, the engine announces every new photo, and an older answer arriving late could leave the collage stuck on fewer photos. Only the newest answer counts now.
- **A false "no photos".** A Bezrealitky or RE/MAX flat flashed "this listing has no photos" for a second before its advert page was read. A gallery counts as still downloading until then.
- **A flat deleted mid-read** made the round of downloads stop. It is skipped now.

## Learned
- **A cheap shortcut can cost the most.** Deciding what to fetch by what a person looks at was more work than fetching everything, and it is what keeps the app honest.
- **Count failures you do not expect.** A failure that is never counted repeats forever.

## Next
- Stand-in photos for the demo scenarios, so the website's screenshots can show the collage without real adverts.
- Release 0.2.0.

---

**References:** photos in the engine and the panel [#145](https://github.com/schrodlm/rentczecher/pull/145) (folds in [#144](https://github.com/schrodlm/rentczecher/pull/144)) · design [#126](https://github.com/schrodlm/rentczecher/issues/126) · advert-page galleries [#125](https://github.com/schrodlm/rentczecher/issues/125) · ADR 13

---
date: 2026-10-09
project: rentczecher
session: 8
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/93
title: "2026-10-09 The profile editor takes shape"
---
## Summary
The profile editor went from a question to most of its parts. After four rounds of prototypes the design is settled: a window in front of the inbox, the search place picked on a clickable map of Czechia, sliders you can also type into, and scoring by how much each wish matters, with example listings showing what that means. The engine changed to fit it, and the map, the place search and every form input are built and merged or waiting to be.

## Goal
Find out what the profile editor should look like and feel like, then build its pieces properly, one small reviewed step at a time.

## Done
- **The prototype.** Three different editors to compare, then three more rounds on the one I liked. It is kept on its own branch exactly as I last saw it, as the reference for what we wanted.
- **Scoring left the engine.** Nothing in the engine ever used the score, so the formula moved to the panel, where the editor previews it. Before removing it, I recorded the engine's own scores for 39 sample listings, and the panel's copy has to match every one of them.
- **Searches accept a set of layouts.** A room range can only describe a rectangle of rooms and kitchen kinds, while the chips allow any combination, like 2+kk with 3+1. The engine now stores the set, and searches also gained a maximum size.
- **The panel can manage profiles.** It can create, change and delete profiles, and search places by name, through the engine's API.
- **A map of Czechia.** Click a kraj to zoom in, click an okres to see its towns, and Praha opens into its districts. Town dots are sized by how big the town is, names never cover each other, and the zoom eases in with the layers fading after it.
- **Searching by name.** A search box suggests real places as you type, works with the keyboard, and is the way to reach anything the map does not draw, down to a street.
- **The form pieces.** Two kinds of slider with typed numbers beside them, layout chips, and portal tiles with each portal's logo. All of them follow the palette, so dark mode will work without extra work.

## Decisions
- **One search place for now.** Several would be nicer, but the engine searches one place today, and the first release comes first.
- **Each client scores in its own way.** The engine stores what you want and the facts, and the app decides how to rank. Written down as a decision record.
- **Price per m² stays out of the editor.** Its scale is fixed and only fits Prague rents. Whether it gets a setting or goes away is its own question for later.
- **An atypical layout is shown only when picked.** With chips it is a choice like any other.
- **The map is drawn once from the gazetteer, and stays in step with it.** It records which gazetteer it came from, a rebuild redraws it, and a test fails if the two ever disagree. This ties the panel and the engine together a little, which is fine for now.
- **Old database changes get folded into one before the release.** Until then each change stays small and keeps my local database upgrading.
- **Every change that is not a test waits for my review,** even inside work I handed over.

## Problems and surprises
- **The map had holes and bold spots.** Military zones like Brdy have no village nearby, so they ended up belonging to nothing. Filling enclosed gaps fixed it, and the next cleanup briefly made Praha 1 and 2 unclickable, until it learned to never drop a region's main shape.
- **Praha was a hole in Středočeský.** It is a region of its own, so zooming into the region around it left an empty space. It now shows as a district of Středočeský.
- **A check passed on my side and failed on the server.** I had been running a lighter version of the panel's type check than the one the server runs. The fix was small, and the checks now match.
- **The map's colours would have broken dark mode.** A few shades were written as fixed colours, so I mixed them from the palette instead.

## Learned
- **How the map borders are made without any border data.** Every half-kilometre cell of the country goes to its nearest village, so a border falls halfway between the last villages on either side. Land more than 7 km from any village is outside the country.
- **Svelte does not draw the map, the browser does.** The map is ordinary SVG. Svelte writes its shapes and keeps them up to date, the data holds the outlines, and plain CSS gives them their colours.
- **How the app gets packaged.** Vite turns the panel into plain files, and Tauri compresses them into the app itself. They are unpacked in memory, only when the window asks for them.

## Next
- The scoring section of the editor.
- The editor window that puts all the pieces together.

---

**References:** prototype verdict [#11](https://github.com/schrodlm/rentczecher/issues/11) on branch `prototype/profile-editor` · scoring in clients [#87](https://github.com/schrodlm/rentczecher/pull/87) (ADR 11, part of [#46](https://github.com/schrodlm/rentczecher/issues/46)) · layout sets and maximum size [#90](https://github.com/schrodlm/rentczecher/pull/90) ([#88](https://github.com/schrodlm/rentczecher/issues/88)) · panel client [#91](https://github.com/schrodlm/rentczecher/pull/91) ([#82](https://github.com/schrodlm/rentczecher/issues/82)) · map picker [#92](https://github.com/schrodlm/rentczecher/pull/92) ([#83](https://github.com/schrodlm/rentczecher/issues/83)) · form pieces [#93](https://github.com/schrodlm/rentczecher/pull/93) ([#84](https://github.com/schrodlm/rentczecher/issues/84)) · price per m² [#81](https://github.com/schrodlm/rentczecher/issues/81) · migration squash before release [#89](https://github.com/schrodlm/rentczecher/issues/89) · next: scoring section [#85](https://github.com/schrodlm/rentczecher/issues/85), editor window [#86](https://github.com/schrodlm/rentczecher/issues/86) · map walkthrough `panel/scripts/README.md`

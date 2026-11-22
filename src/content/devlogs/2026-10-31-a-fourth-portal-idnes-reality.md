---
date: 2026-10-31
project: rentczecher
session: 21
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/161
title: "2026-10-31 A fourth portal iDNES Reality"
---
## Summary
rentczecher reads a fourth portal now, iDNES Reality. It is on in every new profile, next to RE/MAX. Profiles that already exist keep the portals they had.

## Goal
Find the flats the first three portals miss. Many agencies send their listings to iDNES Reality as well, so its copies of the same listings also give the matching across portals real work.

## Done
- **Checked what the portal asks first.** Its terms are only for advertisers and say nothing about how visitors read the site. Its robots.txt allows the search pages and rules out a few kinds of search address, which the app never builds.
- **A scraper for its pages.** The portal has no data feed, only plain pages built on the server, so the app reads each result card for its title, address, price and photo.
- **Places by their official code.** The portal names places by the same official codes the app's offline place list already uses, so that list needed no new table for it.
- **The whole gallery.** For a flat you open, the app reads every photo from the advert page and leaves out videos and 3D tours.
- **A safer database upgrade.** A listing's portal now points at a table of portals instead of a fixed list written into the listings table. Changing it meant rebuilding that table once, and the upgrade now checks it lost nothing before it saves.
- **Everywhere else.** The portal tiles in the app (now two by two), the test scenarios, the docs with a checklist for adding a portal, the website's portal list, new screenshots and a devlog post.

## Decisions
- **On by default.** By the rules the project keeps, a portal that does not ask apps to stay away is on in new profiles.
- **Stay inside robots.txt.** No price floor in the search address, so the app drops the cheaper results itself. One value per filter, so one search per place and estate type. No sorting.
- **A table of portals.** The fixed list could only change by rebuilding the whole listings table each time. With a table, the next portal is one new row.

## Problems and surprises
- **Rebuilding a table could have wiped the history.** The database deletes everything that belongs to a table you drop, which would have taken every price history and photo with it. The upgrade now turns that off while it runs and checks afterwards that every row still has the row it belongs to.
- **A space that is not a space.** The portal groups the digits of a large area with a no-break space, "1 255 m²", while a plain space follows the layout, "3+1 120 m²". Only the no-break space counts as a thousands separator.
- **An empty search is not empty.** With no results the page fills up with similar offers from elsewhere. The app reads only the results list.
- **What the review caught.** A plot's area first landed where a house's floor area goes, so the minimum plot size let every plot through. The gallery took videos for photos. The upgrade could have refused to run on a database where an outside tool once left a stray row. All three are fixed and tested.

## Learned
- **Some portals already speak the official codes.** Not every portal needs its own table of place ids.
- **Every rebuild of a table needs the safety net.** Turning off the cascade and checking afterwards is now how every database upgrade runs.

## Next
- Show viewed flats that changed since in their own section.
- Release 0.4.0.

---

**References:** iDNES Reality PR [#161](https://github.com/schrodlm/rentczecher/pull/161) · adapter `engine/src/rentczecher_engine/adapters/scrapers/idnes.py` · migrations `0003` and `0004` · `docs/portals/idnes.md` · ADR 12

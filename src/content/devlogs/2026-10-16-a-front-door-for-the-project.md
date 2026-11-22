---
date: 2026-10-16
project: rentczecher
session: 15
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/131
- https://github.com/schrodlm/rentczecher/pull/132
- https://github.com/schrodlm/rentczecher/pull/133
- https://github.com/schrodlm/rentczecher/pull/135
title: "2026-10-16 A front door for the project"
---
## Summary
rentczecher now has a website at rentczecher.cz and a README a newcomer can read in two minutes. The README used to be one long page of everything. It is now a short introduction for people who want to use the app, with screenshots, a diagram of how the app is built and the idea of profiles at its centre. The technical detail moved to pages of its own, and both the README and the website now say only what the app really does.

## Goal
Give the project a front door, both for someone looking for a better way to search for a flat and for someone who wants to help build it.

## Done
- **The website.** rentczecher.cz is a static site in Czech and English, built from the same repository and published by GitHub Pages. It explains the app, shows it in screenshots made from the app's made-up test data, has a roadmap, a devlog and a page for portal operators.
- **A new README.** The logo, a few badges, a screenshot of the inbox that follows the reader's light or dark theme, then:
  - what the app does
  - how it is built around profiles
  - how to download it
  - how it uses the portals
  - a diagram of its three parts in the app's own colours
  - where to start contributing
- **Profiles, explained.** A profile is one of your searches, saved and watched for you, with three parts. Criteria decide what shows up at all, portals are the sites it asks, and preferences decide the order.
- **Technical pages of their own:**
  - a contributing guide
  - an architecture overview of the whole app, plus one for each of its parts
  - pages on running the engine without the app, building it, troubleshooting, how the app uses the portals, and the map data's credit
- **Portals named once.** The README names no portal. They are listed in one table, so adding a portal changes one row.
- **A website that tells the truth.**
  - The page for portal operators promised a page cap, a pause between scans and backing off after a refusal, none of which existed yet. It now says only what is true.
  - It no longer names the next portal before anyone has checked what that portal asks.
  - It no longer says scans run on a schedule.
  - It explains the Windows warning next to the macOS one.
  - The roadmap now shows the first release in progress instead of features that already shipped.
- **The map data credited everywhere.** The licence of the place data asks every map to credit ČÚZK, link the licence and say the data was changed. Every map now does, the small ones too.
- **Better Czech.** The scoring hints read like a translation. They are rewritten in plain Czech.

## Decisions
- **The README speaks to users first.** Everything a contributor needs is one link away, not in the way.
- **One architecture page per part, and kept high level.** A technical reader should see what each part does and why, not a list of every type.
- **The website's promises wait for the code.** A claim goes back on the operator page only once the app does it.
- **Notifications on the computer first.** The roadmap's next channel is a notice on your own computer, with email to your own inbox as an option. Nothing leaves the machine unless you ask.

## Problems and surprises
- **The old README was wrong in many places.** A check against the code found it calling the app a cron script, saying scores were not shown yet, and promising to keep listings forever.
- **The check also found a real bug.** A town or street as a search place saved fine, but every scan of it failed. It was fixed straight after in another session.
- **The first map credit cut the small map.** Putting the credit inside the map squeezed it, so each screen now places the credit under the map instead.

## Learned
- **A diagram can live in the README as text.** GitHub draws it and follows the reader's theme, so it never needs a new picture.
- **Verifying a README is a job of its own.** Every sentence that states a fact is worth checking against the code.

## Next
- The last fixes before the release, and the release itself.

---

**References:** website [#131](https://github.com/schrodlm/rentczecher/pull/131) · README and docs [#132](https://github.com/schrodlm/rentczecher/pull/132) · honest website copy [#133](https://github.com/schrodlm/rentczecher/pull/133) · ČÚZK credit [#135](https://github.com/schrodlm/rentczecher/pull/135) · Czech scoring hints in [#130](https://github.com/schrodlm/rentczecher/pull/130)

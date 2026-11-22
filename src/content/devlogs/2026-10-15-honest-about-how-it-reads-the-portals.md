---
date: 2026-10-15
project: rentczecher
session: 14
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/130
title: "2026-10-15 Honest about how it reads the portals"
---
## Summary
With the licence settled, I went looking for anything in the project that could get me into trouble or simply reads badly. Five separate reviews went through the code, the docs, the stored data, the logos and the planned features. The worst finds were that the app pretended to be Firefox, turned Sreality on in every new profile, and kept every listing it ever saw forever. All three are fixed, and the rules behind the fixes are now written down so later features have to follow them too.

## Goal
Make rentczecher behave, everywhere, like what it claims to be: one person's own home search, on their own computer, that sends them back to the portal.

## Done
- **A full review.** Five reviews looked at network behaviour, wording, stored data, trademarks and the planned features. They produced one ranked report with every red flag, where it is and how to fix it.
- **Written rules.** A new decision record, "one private copy per person", says what every feature must respect:
  - one owner per app
  - nothing of the listings leaves the computer
  - the store is a working set, not an archive
  - a refusal from a portal is a no
  - a portal that asks not to be read is off by default
  - every listing sends the user back to its portal
  - no money tied to features
- **An honest name.** Every request now says it comes from rentczecher and links the website, instead of claiming to be Firefox. All three portals answer it the same way they answered the fake browser.
- **Sreality and Bezrealitky off by default.** Both ask apps not to read their sites. A new profile now starts with RE/MAX only. Switching on Sreality or Bezrealitky shows a short note on what the portal asks, links its terms, and lets the user decide.
- **No archive.** The app used to forget only that a profile had seen a listing, and kept the listing, its prices and its place forever. Now a flat nobody has seen for 90 days is deleted with everything read about it, unless it is starred. Deleting a profile deletes what only that profile held.
- **No statistics platform.** The architecture doc described a public website publishing market statistics fed by users' scans, the exact kind of service that gets sued. That plan is gone, and the earlier decision now says it was rejected, not parked.
- **Clean public branches.** About forty old branches on GitHub still carried real adverts from early tests, an old study of how Sreality's servers balance load, and a prototype showing a real advert's photos. All of them are deleted.

## Decisions
- **Keep the portal icons.** Showing a portal's icon next to its own listings is the use trademark law allows, and the app promotes nothing with them. An icon goes at its owner's first objection. Off tiles show the icons in soft grey, so they do not look disabled.
- **90 days of memory.** A listing that comes back within 90 days is still recognised. That covers a landlord pulling an advert and posting it again, which is the case that matters.
- **The opt-in lives in the editor only.** The legal weight is in the default and in the user choosing knowingly, and both happen there.
- **Tests keep scanning Sreality.** It is the most important portal to check, so the test scenarios stay as they are.
- **The emails to the portals can wait.** I will ask Bezrealitky whether they mind, and Seznam and RE/MAX about the icons, but not before the release.

## Problems and surprises
- **The fake browser was never needed.** My old notes said Sreality refuses anything that is not a browser. The tests showed that was really networks being blocked, not the identity.
- **Bezrealitky's robots.txt forbids the very page the scraper reads,** and our own docs proposed a way around it. The docs now say plainly what the portal asks, and the portal is off by default.
- **The public branches were the worst evidence.** The code on the main branch was already clean, but the old branches, one click away on GitHub, showed real adverts and server probing.

## Learned
- **What protects a tool is how it behaves, not what it says.** An honest name, an off switch and a short memory say more than any disclaimer.
- **A deletion has to follow the links.** Thanks to the way the tables cascade, deleting one flat takes its listings, prices and places with it in one step.

## Next
- A proper front door: the website, a readable README and docs that tell the truth.
- Then the last fixes and the first release.

---

**References:** portal guardrails, honest User-Agent, opt-in, retention [#130](https://github.com/schrodlm/rentczecher/pull/130) · ADR 12 "One private copy per person" · audit report [artifact](https://claude.ai/artifact/XjY8HKgYVje6mkVBb5nEJQ) · legal assessment [artifact](https://claude.ai/artifact/7MCyoS9ixkCmkKnsvBRHeR) · CJEU *BMW v Deenik* C-63/97, *Gillette* C-228/03 on naming another's mark

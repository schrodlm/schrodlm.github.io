---
date: 2026-10-14
project: rentczecher
session: 13
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/128
title: "2026-10-14 Is it legal to release this"
---
## Summary
Photos were about to start when one question stopped everything: would releasing rentczecher get me into legal trouble? Two days went into finding out, then into making the repository as clean as it can be. The answer is reassuring, and the project now credits the data it ships, says plainly how it uses the portals, carries a licence, and lists the licences of everything it bundles.

## Goal
Know whether publishing the app is safe for me as its maintainer, and fix whatever in the repository makes it less safe than it needs to be.

## Done
- **A legal assessment.** Research across Czech and EU law, the portals' own terms and real enforcement practice, written up as one document I could hand to a lawyer: database rights, contract, unfair competition, criminal law, photo copyright and personal data, with a rating for me and for users, and the questions still open.
- **A market comparison.** Around twenty paid Czech watchdogs and twenty open-source tools set side by side with rentczecher on price, features, privacy and looks.
- **Crediting ČÚZK.** The place data comes from RÚIAN under a licence that asks for a credit, a link to the terms, and a note on what was changed. The map now shows the credit, and the README says what was modified and where the source metadata lives.
- **Saying how rentczecher uses the portals.** The README now states that it is independent of the portals, built for one person's own home search, never republishes anything, and that a portal operator with a concern gets a quick answer.
- **No real adverts in the tests.** The recorded Sreality responses the tests used were real people's adverts. They are now made-up ones of the same shape.
- **A licence.** rentczecher is now GPL-3.0-or-later across the engine, the panel and the desktop shell. Anyone may use, change and share it, and whoever passes it on must pass it on with its source under the same licence. The name and logo are not part of it.
- **Knowing what we bundle.** The panel's build now lists the licences of the packages it ships, the first step towards the notices the installers will carry.
- **The photos had started too.** Before the legal question came up, a photo table, a listing carrying all its photo URLs, and Sreality's full gallery were in progress. They are parked on their own branch.

## Decisions
- **Release it.** No court anywhere has acted against a private, free, local home-search tool. Every case found involved a company republishing data to the public. The realistic worst case is a polite letter asking to remove the Sreality support.
- **Stay the mildest tool on the market, on purpose.** No hosted version, nothing shared between users, no paid tier, every listing linking back to its portal. Those are what keep rentczecher out of the patterns that get sued.
- **Stop pretending to be Firefox, most likely.** All three portals answered an honest identity naming the project when I tested it, so the browser impersonation buys nothing. The plan is to drop it, and if a portal ever refuses us, stop rather than hide. Still to settle.
- **Sreality off by default.** The user turns it on knowingly, after seeing what Sreality's terms say.
- **GPL rather than a permissive licence,** so that rentczecher and every fork of it stay free.
- **Leave the old fixtures in history.** Rewriting the main branch for six listings with no personal data is not worth breaking every clone.

## Problems and surprises
- **Sreality now sells what rentczecher does.** Sreality Premium launched in March at 199 Kč a month with instant alerts and price watching, and its visitor terms banning scraping appeared the same day. That is the main reason the risk is higher than a year ago.
- **Seznam has sued once over this database,** against a commercial site that republished Sreality's listings and photos. The case is still not settled.
- **"Personal use" does not protect data taken from an electronic database.** It protects the photos, but not the listings themselves.
- **My own notes were wrong.** The belief that Sreality needs a browser identity came from network blocks, not from Sreality refusing honest clients.
- **The paid services are riskier than we are and still exist.** Several run central servers scraping every portal for thousands of paying customers, and nobody has stopped them.

## Learned
- **The database right is the real question,** and it turns on whether a tool harms the investment behind the database. A tool that serves one person and sends them back to the portal is about as far from that as a scraper can be.
- **What protects a tool is its shape, not its intentions.** The court case closest to rentczecher went against a company because it ran one service for the public. Each person running their own copy is a different thing in law.
- **Terms of use bind less than they claim.** Czech courts do not form a contract from a footer link, and the person who writes the code is not a party at all.
- **Open data comes with homework.** CC BY means a visible credit, a link and a description of changes, not just a line somewhere in the code.

## Next
- Replace the Firefox identity, add the Sreality opt-in, and stop a portal that refuses us.
- The website for rentczecher.cz.
- Then back to the photos.

---

**References:** portal use, ČÚZK credit and made-up fixtures [#128](https://github.com/schrodlm/rentczecher/pull/128) · GPL-3.0-or-later on branch `license-gpl` (commits c1c2f2f to 9da8a4a) · photos parked on branch `photos` and in a stash · [legal assessment](https://claude.ai/artifact/7MCyoS9ixkCmkKnsvBRHeR) · [market comparison](https://claude.ai/artifact/EZaaADTBHR6zrhsZDpJmmC) · photo tickets [#42](https://github.com/schrodlm/rentczecher/issues/42), [#125](https://github.com/schrodlm/rentczecher/issues/125), [#126](https://github.com/schrodlm/rentczecher/issues/126) · CJEU *Innoweb v Wegener* C-202/12, *CV-Online v Melons* C-762/19 · *Seznam.cz v Valuo Technologies*, Vrchní soud v Praze 3 Cmo 60/2020

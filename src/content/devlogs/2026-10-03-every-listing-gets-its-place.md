---
date: 2026-10-03
project: rentczecher
session: 6
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/67
title: "2026-10-03 Every listing gets its place"
---
## Summary
Every listing now knows where it is, not just as the portal's text but as official places: the street, the part of town, the district, the town and the region, plus the house number when the portal gives one. Each property remembers the most precise location any of its postings gave, and the app can send it to the panel with readable names.

## Goal
Lay the ground for profiles that search and prefer real places. Before today a listing's location was only a string, so "is this flat in Holešovice?" could not be answered reliably.

## Done
- **Earlier in the session,** scenario mode and the database of Czech places (the gazetteer) were merged, and the design for profiles was written down.
- **One location per listing.** It holds one official place of each kind. An earlier version kept the same fact in two fields that had already drifted apart, so I merged them into one.
- **Reading the text.** The engine first finds the one place the text pins down for certain, usually the street. It then fills in what that place lies in, and looks up the other names only inside that town, where they are no longer ambiguous.
- **House numbers** are read where portals give them and kept exactly as written.
- **Storage.** Each property keeps its most precise location. A less detailed posting later on never makes it worse.
- **The panel can ask for it.** The API now sends the location with names next to the portal's original text, which got a clearer name.
- **Documentation and cleanup.** A readable walkthrough of how locating works, a short guide to rebuilding the places database, and three audits that removed stale comments, unused code and outdated docs. The old JSON store, unused since the move to SQLite, is deleted in its own PR.

## Decisions
- **When unsure, leave it empty.** A missing piece of a location is harmless. A wrong one quietly misleads everything built on top.
- **Duplicate detection may get slightly more precise,** because a found street is a finer clue than a district. I pinned the old behaviour with tests first and approved the change consciously.
- **Showing the location in the panel is separate work.** Today's change only records it and makes it available.
- **Some unused code stays on purpose,** because upcoming features need it: matching relisted flats, and the listing detail view.
- **A few odd cases are tracked, not fixed.** "Praha 7" alone lands on a slightly wrong unit, and fixing it needs a decision about duplicate detection first.

## Problems and surprises
- **A fix I planned turned out unnecessary.** RE/MAX's Praha listings already resolve almost perfectly, and my change made them worse.
- **RE/MAX writes one house number twice,** which would have stored a fake second number. A review caught it, and live data confirmed it.
- **The review step kept paying off.** It caught a merged property losing its location, a database connection left open, and a test that checked almost nothing.

## Learned
- **An address lies in exactly one place of each kind,** but parts of town and streets cross district borders. So the most precise place alone cannot tell you the rest, and that is why the location keeps every level.
- **Python's `closing()`** guarantees a cleanup runs however a block ends, like a cleanup path in C.

## Next
- Merge the location PR, then point the cleanup PR at main.
- Profiles in the database, now able to name real places.

---

**References:** location PR [#67](https://github.com/schrodlm/rentczecher/pull/67) (closes [#60](https://github.com/schrodlm/rentczecher/issues/60)) · JSON store removal [#68](https://github.com/schrodlm/rentczecher/pull/68) · scenario mode [#58](https://github.com/schrodlm/rentczecher/pull/58) · gazetteer [#62](https://github.com/schrodlm/rentczecher/pull/62) ([#59](https://github.com/schrodlm/rentczecher/issues/59)) · profiles [#16](https://github.com/schrodlm/rentczecher/issues/16) · follow-ups [#64](https://github.com/schrodlm/rentczecher/issues/64) (odd cases), [#65](https://github.com/schrodlm/rentczecher/issues/65) (panel display), [#66](https://github.com/schrodlm/rentczecher/issues/66) (emails and scoring) · groundwork for [#61](https://github.com/schrodlm/rentczecher/issues/61) (relisted flats) and [#12](https://github.com/schrodlm/rentczecher/issues/12) (detail view) · walkthrough `docs/locating.md`

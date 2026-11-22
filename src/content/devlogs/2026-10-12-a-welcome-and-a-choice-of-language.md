---
date: 2026-10-12
project: rentczecher
session: 12
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/122
title: "2026-10-12 A welcome and a choice of language"
---
## Summary
The app can now be light or dark and speak Czech or English, by choice. The very first launch opens a welcome wizard: pick the language by its flag, pick the look, then a short tour of what a profile does before creating the first one. Later the top bar has a light/dark switch and a CS/EN switch.

## Goal
Let a person choose the app's language and theme, ask them once on the first run, and remember it on this machine.

## Done
- **A small settings file of the app's own.** The choices live in a file in the system's settings folder, kept by the desktop app and never by the engine, so a headless engine's clients each keep their own. No file means the app has never been set up.
- **The theme.** Light, dark or following the system. The whole palette switches at once, and the window's title bar follows too.
- **The language.** The app picks its language at startup, and numbers and dates now follow it: 24 000 Kč in Czech, 24,000 Kč in English. Switching language reloads the app, which reopens on the same profile and listing.
- **The welcome wizard.** A rounded card over the dimmed app, in three steps: the language, with flags warmed to fit the palette, the theme, with a small preview of each, and four slides showing a profile at work, built from the app's own map, listing rows, score ring and price chart. "Create profile" opens the editor straight away, and "Later" is always there.
- **Development stays quick.** Every test scenario writes the settings file for itself, so the wizard never gets in the way, and one scenario leaves it out to work on the wizard.
- **The dead settings button is gone** until there are settings to show.

## Decisions
- **The settings file is written only when the wizard finishes,** so quitting halfway brings the wizard back.
- **Picking a language in the wizard reloads straight away,** and the wizard comes back in that language. Its choices so far ride along in the address. I first had the wizard speak a language of its own and reload at the end, which needed extra bookkeeping to remember "open the editor" across that reload. Reloading right away removed all of it.
- **The top bar switches only light and dark.** A click should always visibly change something, and "follow the system" often does not. It stays the wizard's default.
- **English writes numbers and dates the British way,** day before month, which suits a European app with a British flag. Prices stay in Kč.
- **Flags for languages,** drawn by hand rather than as emoji, since emoji flags do not show on Windows.

## Problems and surprises
- **The commit hooks see new files.** They set aside unfinished edits but not new files, so a new component's strings tripped the translation check. Moving new files aside while committing worked around it.
- **A first run without loaded profiles** could open an editor that cannot save. Found in review, the editor now waits for them.
- **The formatter reformatted the whole shell** when I ran it, since the repo does not use its default width. Undone, and the change applied by hand.

## Learned
- **How the app's window reaches the computer.** The panel asks the shell by name, the shell fills in what it manages itself (like the settings file's path), and anything Tauri ships has to be allowed one command at a time. The panel can never choose which file it reads.
- **Session storage** survives a reload but not closing the window, which is exactly what reopening the same listing after a language change needs.

## Next
- Two small fixes: only the list should scroll, and the filter menu should open where it fits.
- Then the Photos milestone.

---

**References:** theme, language and welcome wizard [#122](https://github.com/schrodlm/rentczecher/pull/122) (closes [#121](https://github.com/schrodlm/rentczecher/issues/121), prototype on branch `prototype/welcome-wizard`) · first run [#10](https://github.com/schrodlm/rentczecher/issues/10) · settings screen [#13](https://github.com/schrodlm/rentczecher/issues/13) · scrolling [#123](https://github.com/schrodlm/rentczecher/issues/123) · filter menu [#124](https://github.com/schrodlm/rentczecher/issues/124)

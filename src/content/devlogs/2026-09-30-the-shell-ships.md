---
date: 2026-09-30
project: rentczecher
session: 4
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/50
title: "2026-09-30 The shell ships"
---
## Summary
The desktop shell is finished. It now builds into a real Linux install package that runs the engine without Python being installed. The engine can no longer outlive the window or die without anyone noticing, and a failed start shows an error dialog instead of nothing. Nineteen commits are ready and the PR is next.

## Goal
Close the gap between "the inbox opens in a window" and a shell worth merging: crash safety in both directions, a proper release build, and the last missing pieces before testing on all three operating systems.

## Done
- **The dead-man's switch.** The engine shuts itself down as soon as the pipe from the shell closes. The shell holds that pipe open and never writes to it, so it only closes when the shell is gone. Force-killing the shell stopped the engine in 0.21 seconds.
- **One doorway.** The panel now asks the shell for the engine's address and access token. Two old helper files are gone, and a single command starts the whole dev setup, including the web page's dev server.
- **The release path.** Release builds start the bundled, self-contained engine from the app's own files. A Linux install package built, and when unpacked it ran and showed the inbox.
- **A security policy for the page.** It is a list of what the page may load and talk to. It is strict in release, with a looser dev version only so live reloading of the page keeps working.
- **Package details** in English: descriptions, category and the desktop menu entry.
- **Engine death is noticed.** When the engine's output pipe closes, the shell tells the panel, which shows a banner. Force-killing the engine showed it in 0.11 seconds.
- **A startup dialog.** When the engine never reports healthy, a native error dialog explains it and the app quits on OK, with no half-started engine left behind.
- **Docs.** The README gained the build commands and the tools and Linux libraries you need.
- **Tracker.** A log file for release builds is noted as an issue for later.

## Decisions
- **Crash detection works both ways.** The engine dies with the shell, and the shell notices when the engine dies. Both rely on the operating system closing a dead process's pipes.
- **No graceful shutdown for now.** Killing the engine when the app exits is enough today, so it stays that way until the lifecycle work needs more.
- **Closing the window behaves as before** until background watching arrives with the tray icon.
- **Shell text is English.** The startup dialog appears before the panel and its Czech texts exist, and the panel has no language setting to follow yet.
- **Package details are English** even though users see them. Czech is for the app's own screens, emails and owner logs.

## Problems and surprises
- **The portable single-file Linux format fails on my machine.** A helper tool I have installed intercepts every such file, including the build tools themselves, and its old file reader cannot open them. The install package builds fine locally, so the portable format moves to the automated build servers.
- **The release build did not compile at first,** because the code that starts the engine existed only in debug builds. The code checker now runs on both kinds of build.

## Learned
- **A Linux install package is a simple archive** of three parts: a version marker, the control files and the payload. Unpacking it shows exactly what the installer would put where.
- **The release app is one program file** with the panel baked into it at build time. The engine sits next to it as a folder of resources.
- **The page's security policy is an allowlist the browser enforces.** The shell and page talk through special internal addresses, so those must be on the list.
- **Events from the shell to the page** are sent by name, and the page subscribes to that name. The name is the only contract between the two sides.
- **Waiting on the main thread freezes the loop that draws the dialog,** so the dialog reports the click through a callback instead of waiting for it.

## Next
- Open the desktop shell PR.
- Then the build matrix for all three operating systems, a manual test in virtual machines, and the matching decision record.

---

**References:** desktop shell PR [#50](https://github.com/schrodlm/rentczecher/pull/50) (closes [#36](https://github.com/schrodlm/rentczecher/issues/36)) · release log file [#49](https://github.com/schrodlm/rentczecher/issues/49) · three-OS CI matrix, VM gate and D2 decision record [#37](https://github.com/schrodlm/rentczecher/issues/37)

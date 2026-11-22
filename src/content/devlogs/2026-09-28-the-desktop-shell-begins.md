---
date: 2026-09-28
project: rentczecher
session: 3
tags:
- devlog
title: "2026-09-28 The desktop shell begins"
---
## Summary
I re-cut the road to a first release into seven milestones, then started on the desktop app. The inbox now opens in its own native window, and that window starts the engine by itself and waits until the engine answers before showing anything. Nineteen commits on a branch, no PR yet.

## Goal
Turn my rough list of what a releasable prototype needs into an ordered plan. Then prove the riskiest part first: can a packaged Python engine run inside a desktop app built with Tauri, a toolkit for small native apps?

## Done
- **Seven milestones:** desktop app, profiles, the background watchdog, photos, first run, an installable release, and a mode that runs without a window. The roadmap got a dated note mapping them onto the older July plan.
- **Tracker updates.** New issues for favourites and for moving scoring into the panel, and two older issues rewritten so scans are scheduled inside the app.
- **The engine learned how to be started by the app.** It can pick any free port and tell the app which one it took, and the app can ask it to shut down cleanly on every operating system.
- **A packaged engine.** One recipe bundles the engine into a 73 MB folder that runs on a machine with no Python installed and answers in under a second.
- **The desktop app itself.** Its tooling, icons made from my logo, and the skeleton that opens the inbox in a native window. The app now creates a secret key, starts the engine, reads which port it took, and opens the window only once the engine says it is healthy.
- **Housekeeping.** The product now has one version number, kept in one place and pinned by a test. A design decision was rewritten so the desktop app is the only way in, even during development.

## Decisions
- **The desktop app comes first.** Running the engine inside it was the agreed make-or-break check, the biggest technical risk, so it is proven before features are built on top.
- **Scoring is presentation,** so it moves to the panel and the email drops its score badge. Deciding what to notify about stays in the engine, because scans must send alerts with no window open.
- **Watching in the background is on by default.** Closing the window keeps scans running behind a visible tray icon, a notice explains this the first time, and on Linux desktops without a tray the app simply quits.
- **The engine ships as a folder, not a single file.** It starts faster and avoids false alarms from antivirus on Windows.
- **Development builds run the engine straight from source,** so Python changes show up on the next launch.
- **No more opening the panel in a normal browser.** Development happens in the app's own window, so the helper script and settings for the browser route are going away.
- **One version number for the whole product,** since the engine and panel always ship together. The version in the API's web addresses marks compatibility for the day the engine is released on its own.

## Problems and surprises
- **A shutdown that never finished.** The live update stream only noticed it should stop when it sent something, and a quiet stream never sent anything. Every closed tab had been leaking a background worker since the API was merged. A small "still here" message every second fixed it.
- **The window loaded before the engine was ready.** Tauri builds its windows at startup, at the same time as the engine is starting. The fix was to stop it doing that and build the window myself after the health check.
- **The crash test killed the wrong process, twice.** The Python launcher starts two processes, and my search by name matched my own command. Killing by exact process number worked.

## Learned
- **Tauri is a Rust library for a small host program** that draws a native window and shows the page using the operating system's own browser engine. Its command line tool only drives the build, and the Rust compiler builds the host with the library inside.
- **The panel cannot be the host,** because web page code runs locked in a sandbox. Something native has to open the window first, like firmware hosting a Lua interpreter.
- **Package managers hand out files, not languages.** The JavaScript package manager installs Tauri's tool as a ready-built Rust program, just as the Python one installs the linter.
- **Packaging Python is not compiling it.** The bundle holds a small launcher, a Python interpreter, the code and its data files. It cannot build for another operating system, so each OS needs its own build machine.
- **The web server stops through a flag** its main loop checks ten times a second, the same flag Ctrl-C sets.
- **Python looks names up when a function runs,** not when it is written. That is why the shutdown handler can refer to a server created later.
- **The operating system closes a process's pipes when it dies,** however it dies. That makes the engine's input pipe a crash-proof dead-man's switch: when the app dies, the engine notices and stops.

## Next
- Commit the dead-man's switch, then connect the app to the engine's input pipe.
- The panel asks the app how to reach the engine, then the browser-route helper and its settings go.
- The release path, the browser security rules for the window, the app lifecycle work, and the check on all three operating systems.

---

**References:** branch milestone-3-desktop-shell · favourites [#48](https://github.com/schrodlm/rentczecher/issues/48) · scoring moved to the panel [#46](https://github.com/schrodlm/rentczecher/issues/46) · in-app scheduling [#7](https://github.com/schrodlm/rentczecher/issues/7), [#21](https://github.com/schrodlm/rentczecher/issues/21) · background watching and tray [#31](https://github.com/schrodlm/rentczecher/issues/31) · ADR 1 (the shell is the only way in) · ADR 3 (packaged engine) · decision D2 (the make-or-break gate)

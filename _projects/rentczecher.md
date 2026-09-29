---
name: rentczecher
language: Python, TypeScript, Rust
status: in progress
layout: project
github: rentczecher
slug: proj_4
description: A free, local-first desktop watchdog for Czech real-estate listings.
title: "rentczecher"
---
**file last reviewed:** 29.09.2026

rentczecher watches the big Czech real-estate portals (Sreality, Bezrealitky, RE/MAX) for flats and houses matching my searches. It notices the same property posted on several portals, scores listings against my preferences, and tells me about new listings and price drops.

It started as a cron script that emailed search results. Now it is becoming a desktop app for people who have never opened a terminal.

## Principles
- **Local-first.** No cloud, no account, no subscription, no payment. The data lives on the user's machine.
- **Free and open source,** with transparent scoring.
- **Czech first,** with English alongside.

## Successful Outcome
A desktop app a non-technical person downloads, installs and sets up through screens. It watches the portals in the background and shows new listings in an inbox, with photos that survive a listing being taken down.

## How it is built
- **The engine** is Python. It scrapes, deduplicates and scores, and stores everything in SQLite.
- **The panel** is a SvelteKit web app showing the inbox. It talks to the engine over a local API.
- **The shell** is a small Tauri program in Rust. It opens the window, starts the engine and supervises it.

## Milestones
- [x] **Storage flip.** SQLite instead of JSON files.
- [x] **Pipeline extraction.** The scan as a callable service.
- [x] **Sidecar API.** The engine's local API with a committed contract.
- [x] **The panel.** The inbox screen in the browser.
- [ ] **Desktop shell.** The native window, a frozen engine, and a check on all three operating systems. IN PROGRESS
- [ ] **Profiles.** Create and edit searches in the app.
- [ ] **Watchdog.** Scheduled scans with no window open.
- [ ] **Photos.** Stored locally, shown in a listing detail view.
- [ ] **First run.** Setup through screens instead of config files.
- [ ] **Installable release.** Signed installers anyone can download.
- [ ] **Headless mode.** The engine on a server, clients on other devices.

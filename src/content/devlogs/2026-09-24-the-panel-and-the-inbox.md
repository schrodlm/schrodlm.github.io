---
date: 2026-09-24
project: rentczecher
session: 2
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/47
title: "2026-09-24 The panel and the inbox"
---
## Summary
The panel exists. It is the web page half of the desktop app, and it shows the inbox of listings by talking to the engine running alongside it. It is in Czech, and every request it sends to the engine is checked against the agreed interface before the code even builds. It was merged on 2026-09-28 as 59 commits, and the first automatic test run on the server passed on its first try.

## Goal
Build the web half of the desktop app on top of the new engine interface, still one small commit at a time, and learn the web stack while doing it.

## Done
- **The skeleton.** A fresh web project, the colours from my palette set up as shared design values, and the logo.
- **Translations.** Our own small translation system. The code holds the English text, a Czech catalogue translates it, and a checker refuses any commit that leaves a string untranslated.
- **Setup and running.** One command now sets up everything, and another runs the engine and the panel together. The old installer from the days of scheduled runs is gone.
- **Talking to the engine.** A client whose every request is checked by the compiler, a piece that follows a running scan's progress live, and a fix for a browser safety check the engine was not answering.
- **The inbox.** Profiles as tabs, a run button with live progress and the health of each portal, listing cards, and the feed.
- **Safety nets.** A commit check that the interface description is up to date, and the first automatic test run on the server, testing both the engine and the panel on every push.
- **Cleanup.** A review of the whole branch from four angles, landed as 13 small commits.
- **Work for later,** filed as issues: storing photos locally, a scenario mode for running the app in development, the growing size of what the engine sends, and showing scores.

## Decisions
- **English text in the code, the classic convention.** The English sentence sits where it is used, and the Czech version is derived from it in the catalogue.
- **Generated files stay out of version control,** like the compiled Czech catalogue and the generated types. The interface description is the exception, because it is the handoff between the Python side and the web side.
- **A ready-made typed client instead of a hand-written one.** An agent review compared the options from three angles, and I picked the one where a wrong address or parameter simply does not compile.
- **The commit check stays light.** Heavy checks like the panel tests run on the server instead.
- **Profiles are tabs across the top,** from a sketch I drew on a screenshot of the skeleton.
- **A listing counts as seen when it is clicked open.** This took three tries. Marking it when scrolled past was overthought, on hover felt weird in use, and the click won.

## Problems and surprises
- **The browser blocked every request.** The panel and the engine ran at different addresses, so the browser first asked the engine for permission, and the engine never answered.
- **Tool versions clashed.** My system's package manager was older than one library needed, and the newest test runner wanted a newer Node, the program that runs JavaScript outside the browser. I settled on Node 20 with library versions that work with it.
- **The editor showed type errors the real checker did not.** Its background helper had gone stale after installing new libraries.
- **Several commits went in without my review in between.** The rule since then is one approval, one commit.

## Learned
- **Svelte is a compiler.** At build time it turns each component into plain JavaScript that updates the page directly. React instead ships a runtime that interprets components in the browser.
- **Vite** is the build tool and development server. It drives the compilers and reloads the page on every save.
- **Svelte's reactive markers.** One marks a variable as live, another computes a value from live values, and simply assigning a new value redraws the page.
- **Czech has three plural forms,** which is why a proper translation system with plural rules beats a simple dictionary of strings.
- **The browser's same-origin rule** stops a malicious page from talking to other sites in my name, and it applies just as strictly to my own two components.
- **Types vanish when the code runs.** The compiler checks each engine address like a struct member access in C, but nothing of it is left in the shipped JavaScript.

## Next
The desktop shell: a native window wrapped around the panel.

---

**References:** panel PR [#47](https://github.com/schrodlm/rentczecher/pull/47) · issues for later [#42](https://github.com/schrodlm/rentczecher/issues/42) (local photos), [#44](https://github.com/schrodlm/rentczecher/issues/44) (scenario mode), [#45](https://github.com/schrodlm/rentczecher/issues/45) (payload growth), [#46](https://github.com/schrodlm/rentczecher/issues/46) (scores) · typed client decision ADR 2 · stack: SvelteKit, openapi-fetch, gettext, Tauri

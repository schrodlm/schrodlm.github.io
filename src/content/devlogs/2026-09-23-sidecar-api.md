---
date: 2026-09-23
project: rentczecher
session: 1
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/40
title: "2026-09-23 Sidecar API"
---
## Summary
The engine can now talk to the future desktop app. It got a small local API (a set of web addresses the app calls to ask for data or start work), a command that starts it, and a written contract describing every call. It was merged as 39 commits, each one reviewed by me.

## Goal
Understand the API layer line by line instead of accepting it as one big block. The work already existed on a reference branch, so the session replayed it commit by commit and split anything too big to follow.

## Done
- **The API, in small slices.** First the plumbing: the part that hands out live events, a secret token the app must present on every call, the part that runs scans, and the wiring that connects it all. Then one feature per commit: profiles, new listings, starting a scan, portal health, and the live event stream.
- **A command to start it.** It upgrades the database to the latest layout on startup, then serves the API only to this computer.
- **A written contract.** A script exports a description of every call to a file kept in the repo, so the app and the engine agree on what goes over the wire.
- **Typed live events.** The four kinds of live event now have a fixed, checked shape and are part of the contract.
- **Glossary.** New terms written down: shell, sidecar, token, run, event, broker, event stream, and the tools behind the contract.
- **Tracker.** A milestone for running without the desktop app (headless mode), an issue for how it will log in safely, and an audit that closed one stale issue.

## Decisions
- **Tests land in their own commit, right after the code they test,** and commits carry no AI credit lines. Both rules went into the project's instructions, and the branch history was rewritten to follow them.
- **The API listens only on this computer.** Opening it to the network waits for headless mode, where encryption and a proper way to hand out tokens make it safe.
- **Profiles stay read-only, loaded from the config file, in the first version.** They move into the database as user data later.

## Problems and surprises
- **The first API commit touched 13 files,** too much to understand in one sitting. Splitting it into slices made every piece reviewable.
- **Rewriting history needed care.** Before deleting the old branch, I checked that the rewritten one ended up exactly identical in content.

## Learned
- **A live event stream is one web response that never ends.** The server keeps adding small text messages, and the browser turns each one into a callback. The browser's built-in tool for this cannot send extra headers, which is why the event route alone accepts the token in the address.
- **The broker fans events out.** Every connected app gets its own queue, and every event is copied into every queue.
- **Python can tie "acquire" and "release" to a block of code,** so the release always runs when the block ends, much like a cleanup path in C.
- **The contract format is language-neutral.** The Python side generates it from its data descriptions, and other tools turn it into types for the app's language, so both sides come from one source.
- **"Sidecar" is a role, not a program.** It is the same Python engine, just started and watched over by the desktop app.

## Next
- Build the panel, the app's user interface, against this contract.

---

**References:** API PR [#40](https://github.com/schrodlm/rentczecher/pull/40) · typed live events [#39](https://github.com/schrodlm/rentczecher/issues/39) · headless login [#38](https://github.com/schrodlm/rentczecher/issues/38) · closed in the audit [#32](https://github.com/schrodlm/rentczecher/issues/32) · profiles into the database [#16](https://github.com/schrodlm/rentczecher/issues/16) · contract `docs/api/openapi.json` · rules in `CLAUDE.md`

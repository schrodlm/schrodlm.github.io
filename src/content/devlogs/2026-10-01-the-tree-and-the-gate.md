---
date: 2026-10-01
project: rentczecher
session: 5
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/53
title: "2026-10-01 The tree and the gate"
---
## Summary
The old July planning folder is retired, and its binding choices are now short written decision records. The repo is split into three clear parts: the engine, the panel (the app's screens) and the shell (the desktop wrapper). GitHub now builds the app on Linux, Windows and macOS and checks that the bundled engine actually starts on each. That was the last piece of milestone 3, so it is closed.

## Goal
Finish milestone 3: bring the old plan in line with what really happened, then prove the app builds and its engine runs on all three operating systems.

## Done
- **Planning folder retired.** The decisions that still bind became six new decision records: the engine as one package, the desktop shell running the engine alongside it, duplicate detection that compares listings in pairs, sending the email before saving the scan, place data kept offline, and everything running locally first. Portal notes and design rules moved into their own docs, and open research questions became issues. An old evaluation script is gone.
- **Milestones reshuffled.** Milestone 9 is now "More portals", starting with iDNES. Running without the desktop app moved to milestone 10. One issue moved to milestone 8 and another was closed.
- **The rule for vanished listings looks wrong.** When a portal breaks, its listings count as missing. A listing that disappeared also seems to be reported again in every later email. This is now tracked.
- **The restructure,** in eight commits. The glossary now defines what rentczecher is. The old GUI folder split into the panel and the shell. The engine moved into its own Python project and got a new package name. Tests that hit real portals moved into their own folder. Every moved file kept its git history.
- **The build pipeline.** It runs on release tags and on a dedicated test branch. It builds every installer on three machines, one per system, then runs quick start-up checks on the bundled engine.
- **Start-up checks (smoke tests).** They confirm the bundled engine ships its data, answers a health check with its secret token, serves profiles, and shuts down when the app closes its input.
- **The gate merged,** which closed milestone 3. The decision record calls it provisionally passed: green on all three systems, but running the real app on Windows and macOS waits for testers.
- **Tracker.** New issues for a manual install test for testers and for builds on older Intel Macs.

## Decisions
- **rentczecher is the product:** the engine plus the desktop app plus the command line. Only the Python package got a new name. The command people type stays rentczecher.
- **Panel and shell sit side by side,** because the shell is not really part of the screens. Two of its three jobs are about the engine. The build tool is told where the shell lives through a setting.
- **Tests are sorted by what they need to run,** not by "unit" versus "integration". Offline is the default. Real-portal tests and bundled-engine tests each live in their own folder, which marks them automatically.
- **Builds run only on release tags and the test branch,** not on every push, because one run costs about 25 minutes of build machine time.
- **The app half of the gate is manual,** done by testers once the app is usable. The smoke tests cover the engine half automatically.

## Problems and surprises
- **The first smoke test got "connection refused".** The engine opens its network port before it has finished starting, so the test now keeps asking for health, just like the shell does.
- **The Rust build cache remembered full folder paths** and broke the first build after the move until it was wiped.
- **The code checker picked up my personal settings** for the setup script once the repo root no longer had its own config. The commit hook now hands it the engine's config explicitly.
- **The bundled engine crashed on Windows.** Python there reads files in an old Western encoding unless told otherwise, so the Czech names in the place data broke it, and the config was quietly garbled. The smoke tests caught it on their very first Windows run. Everything is now read as UTF-8.
- **Each system bundled a different Python version.** Linux took the machine's 3.10, which lacks a library the engine needs. The engine now requires 3.11 and pins 3.12, so all three installers ship the same Python.
- **GitHub rebased the restructure PR** even though a merge commit was requested, so the PR's explanation of why lives only on GitHub.

## Learned
- **Git does not record moves.** It guesses them from how similar the content is, so a commit that only moves files, with no edits, keeps file history and blame working.
- **A Python import name has to be a valid identifier,** so it uses underscores. Package names are normalized, so a dash and an underscore mean the same package to the installers.
- **Where the desktop shell's folder sits is a default, not a rule.** The build tool searches for the shell's config file and can be pointed somewhere else.
- **The tool that bundles Python only builds for the system and CPU it runs on.** That is why there is one build machine per system, and why Intel Macs need their own build.

## Next
- Milestone 4, Profiles: the first version good enough for testers, who then run the install checklist.

---

**References:** restructure PR [#53](https://github.com/schrodlm/rentczecher/pull/53) · three-OS gate PR [#56](https://github.com/schrodlm/rentczecher/pull/56) (closes [#37](https://github.com/schrodlm/rentczecher/issues/37)) · research inputs [#23](https://github.com/schrodlm/rentczecher/issues/23), [#37](https://github.com/schrodlm/rentczecher/issues/37), [#51](https://github.com/schrodlm/rentczecher/issues/51) · iDNES portal [#51](https://github.com/schrodlm/rentczecher/issues/51) · moved to milestone 8 [#49](https://github.com/schrodlm/rentczecher/issues/49) · closed [#24](https://github.com/schrodlm/rentczecher/issues/24) · vanished listings rule [#52](https://github.com/schrodlm/rentczecher/issues/52) · manual install test [#54](https://github.com/schrodlm/rentczecher/issues/54) · Intel Mac builds [#55](https://github.com/schrodlm/rentczecher/issues/55) · decision records ADRs 4 to 9, gate status in ADR 5 · portal notes `docs/portals/` · design rules `docs/design.md`

---
date: 2026-10-26
project: rentczecher
session: 19
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/156
title: "2026-10-26 The app updates itself"
---
## Summary
The app can now update itself. When a newer release is out, the top bar says so, and one click downloads it, checks that it really comes from me, installs it and restarts into the new version. Releases now carry everything this needs, and the privacy policy says that the app asks GitHub about new versions.

## Goal
Stop asking people to watch the website for new versions. Before today an installed app never learned that a newer one existed, so everyone would stay on the version they first installed.

## Done
- **The app asks for a new version.** When it starts and once a day after that, it fetches a small file from the newest GitHub release that names the latest version. If that version is newer, the top bar shows it with an "Update and restart" button. Without internet it simply tries again next time.
- **Updating with one click.** The app downloads the new version for its own system, shows how far the download has come, installs it and restarts. If anything fails, it says so and links to the release page for a download by hand.
- **Every release is signed.** The build signs each file the app can update from with a private key that only the build has. The app carries the matching public key and refuses any download the key did not sign.
- **The release writes the update file.** After every system has built, a small script gathers the downloads and their signatures into the one file the app asks for. It stops the release if any download or signature is missing, or if one was signed with the wrong key.
- **The engine stops properly before an update.** Stopping it now waits until it has really gone, which an update on Windows needs.
- **The privacy policy names GitHub,** what the app asks it and when, and that GitHub counts the checks without knowing who made them.

## Decisions
- **The user decides when to update.** The app only offers the update. Nothing is downloaded until the user clicks, so a scan is never cut short by a restart.
- **A release reaches the apps only when I publish it.** The build leaves each release as a draft, and GitHub does not show drafts as the latest release, so I can check a release before anyone is offered it.
- **The signature must also name the version.** Without this, someone able to fake the update file could offer an old release under a new number and push people back to it. The signature covers the version, so that no longer works. No release before this one was signed, so this costs nothing.
- **Development builds never update.** A build I am working on would otherwise offer to replace itself with the last release.
- **Only the shell can update.** The window can ask for a check and an install and nothing more, not everything the update library could do.

## Problems and surprises
- **Windows ends the app abruptly.** On Windows the update library launches the installer and then exits the app at once, past the normal shutdown that would stop the engine. The installer cannot replace files that are still in use, so the engine is now stopped right before that exit.
- **The build only warns about the wrong key.** Signing with a different key than the app trusts gives a warning and a release no app would accept. The script that writes the update file catches this and fails instead.
- **macOS updates from a different file.** It does not use the disk image people download, but a packed copy of the app itself, which the release now ships as well.

## Learned
- **HTTPS is not enough for updates.** It proves the file came from GitHub, not that I put it there. A signature checked by the app is what ties an update to me.
- **The signing key is a one-way door.** Every app installed from now on trusts this key and only this key. If I lose it, those apps can never be updated again, so its backup lives outside GitHub.
- **"Installer" means something different on each system.** Windows runs a real setup program. macOS and the Linux AppImage just replace the app. The Linux package goes through the system's package manager and asks for a password.

## Next
- One more feature, then release 1.0.
- Prove updating end to end. That needs two signed releases: install the first, publish the second, and check that each system offers it and updates.

---

**References:** updater PR [#156](https://github.com/schrodlm/rentczecher/pull/156) (closes [#149](https://github.com/schrodlm/rentczecher/issues/149)) · manifest script `engine/scripts/updater_manifest.py` · shell `shell/src/update.rs`

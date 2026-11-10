# Brief: the sections still to design (projects, devlogs, courses)

You're designing pages for a personal site, the "garden". The owner said one thing above all for this round: **"I don't want my site to look too gardeny. It should still be a usable and nicely readable site."** The garden is a seasoning. Pages are, first, clear, quick to scan and comfortable to read; decoration lives at the edges and never competes with the words.

## Read first (all in this folder, `kit/`)

- `BRIEF.md`: **the board format (`.dc.html`) and its rules that bite**, plus the design system (colours, type, feel). Its rules apply: don't publish, don't touch git, don't write outside `kit/`, don't modify the shared files (`gen_garden2.py`, `gen_woodcut*.py`, `woodcut_sprites.py`, `runtime.js`, `shoot.js`); copy what you need.
- `gen_garden2.py`: the shared shell: `nav(active)`, `FOOTER`, `trail_heading`, `specimen_card`, `component`, `page`, the vine, colours and fonts. Its bottom half generates the **chosen** post and note pages; your pages must sit in the same family.
- `ref/FlowerPost.dc.html`, `ref/FlowerNote.dc.html`, `ref/GardenHome.dc.html`: the chosen post page, note page and home. Match their header, column width, type sizes and footer.
- `ref/Clearing.dc.html`: an older project page from an earlier round, for ideas only.
- `gen_woodcut.py`, `woodcut_sprites.py`: the woodcut-plate medium (3 px dithered pixels on an offscreen canvas → data-URL `<img>`, `image-rendering: pixelated`, real text over the plate). Use it where you need pixel art.
- `shoot.js` + `runtime.js`: the local renderer for screenshots: `node shoot.js <outdir> '<json list of {file, out, height, y?, scale?, state?}>'`. Playwright is at `/home/schrodlm/node_modules/playwright`. Look at your shots with the Read tool and **iterate on what you see**.

## Standing design facts

- Sand ground `#F1ECDF`; text in ink `#1F2B23`, muted `#535F52`, canopy `#2B7349` (headings, nav), river `#1D5A8F` (links). The bright colours (fern, moss, mango, hibiscus, orchid, lagoon, rose, earth, bark) are for art only, never for words.
- IBM Plex Mono for structure and labels, Literata for reading.
- Nav `[notes] [posts] [projects] [courses] [about] [cv]`, current one `[>x]` in ink.
- Characters (ASCII) are the medium for decoration; woodcut pixel plates are the medium for pictures (the graph view, the About desk).
- Posts and notes grow a flower. **Projects, devlogs and courses do not.**
- Respect `prefers-reduced-motion`. Each page must work at 390 px wide (show it with a phone shot).
- The site shows whatever content it is given; never invent copy for the owner. Use the real content from the vault paths given below (read only, never write there), and placeholders like "[written by me]" where the content doesn't exist.

## Deliverable

- Your boards in `kit/jungle/project/`, from your own `gen_<name>.py` in `kit/`.
- Screenshots at `scale: 2` in `kit/shots/<name>/`, including a 390 px one per page.
- **At least three render–look–refine rounds.** Judge honestly against: readable and usable first · fits the family of the chosen post/note pages · a little delight, not much · calm.
- A final report of 150 words at most: what you built (board file names and the title you'd give each), what you'd still improve, and the paths.

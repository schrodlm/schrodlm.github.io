# Brief: the About page's desk plate

You're designing the centrepiece of the **About page** of a personal site: a pixel-art plate of the owner's **desk**, with their PC as the interactive heart. It's drawn in the same medium as the site's graph view: **woodcut plates**, with 3 px dithered pixels, cross-hatched shade and ordered (Bayer) dithering, in the garden palette on sand, inside a double-ruled plate border with faint paper grain, and with real text over the plate for labels. The site is a calm "garden"; this page's job, in the owner's words, is mostly "to look cool". It should feel crafted, playful and a little magical, without being busy.

## Read first (all in this folder)

- `BRIEF.md`: the general rules for this folder and the board format (`.dc.html`). **Its rules apply here too**, including: don't publish, don't touch git, don't modify the shared files, and don't write outside this folder.
- `gen_woodcut.py`, `woodcut_sprites.py`, `gen_woodcut_note.py`: **the chosen woodcut style.** Study how they draw: offscreen canvas → data-URL `<img>` with `image-rendering: pixelated`, 3 px cells, Bayer dithering, cross-hatching, the plate border and paper grain, captions as real text over the plate, invisible buttons for hover and click. Match this look.
- `gen_garden2.py`: the shared shell (`nav`, `FOOTER`, `page`, `component`, colours). Use `nav('about')`.
- `shoot.js` + `runtime.js`: the local renderer for screenshots (see BRIEF.md). Pass `state` to freeze interaction states.

## The desk (real things; look up real proportions if you can)

| Thing | Model | Notes |
|---|---|---|
| Case | Fractal Design North, Charcoal Black | mid-tower, roughly 469 H × 215 W × 447 D mm, wooden (walnut) slatted front, side panel |
| Monitor | GIGABYTE G34WQC2, 34" | ultrawide 21:9, curved, on its stand |
| Laptop | Lenovo ThinkPad P14s Gen 2a | 14", open, the classic ThinkPad red TrackPoint |
| CPU | AMD Ryzen 7 9800X3D | under the AIO pump |
| Cooler | NZXT Kraken Plus 280, black | 280 mm radiator with 2 × 140 mm fans (assume front-mounted), pump head on the CPU |
| Motherboard | ASUS B650E MAX GAMING WIFI | ATX |
| GPU | MSI GeForce RTX 5070 Ti 16G Ventus 3X OC | about 303 mm long, three fans |
| RAM | Kingston FURY Beast Black 32 GB kit, DDR5-6000 CL30 | 2 sticks |
| SSD | Samsung 990 EVO Plus 2 TB | M.2, on the motherboard |
| PSU | Corsair RM850x ATX 3.1 | in the bottom shroud |

## How it behaves

- **On load:** the desk at rest. The tower turns or settles into view, then its side panel lifts away to show the inside. It must be calm and quick, a few seconds.
- **Hover** a part, the monitor or the laptop: it lights up in its colour, and its name appears as a real-text caption.
- **Click** a part: it slides out of the case (or forward), and a small card shows its name and a line about it. Use a placeholder line such as "[a line about it, written by me]"; the owner writes the real ones.
- **An "explode" control** separates every part along its axis, like an assembly diagram, and clicking it again puts them back.
- **Reduced motion:** with it on, there's no animation. Show the final state of each action straight away.
- **Phone width (390 px):** the plate scales down and stays usable. Captions may become a list.
- You may write your own component timer for smoother animation (for example 50–80 ms frames while something is moving, idle otherwise), instead of the base 250 ms tick.

## Below the plate

- **The words:** a placeholder block "[About text — written by me]". The owner writes it; don't write copy for them.
- **A contact block in the same pixel style:**
  - small woodcut pixel icons (an envelope, GitHub's cat silhouette, LinkedIn's "in"), next to real-text links;
  - email `matej.schrodl@gmail.com`, GitHub `github.com/schrodlm`, LinkedIn `linkedin.com/in/matej-schrodl354`;
  - no phone number.
- **The usual footer** (`FOOTER`).

## Deliverable

- A board `jungle/project/<Name>.dc.html` from your own script `gen_<name>.py` (the name is in your direction).
- Screenshots in `shots/<name>/` at `scale: 2`: at rest, side panel off, hovering the GPU, the GPU clicked with its card, exploded, and the plate at 390 px wide.
- **At least three render–look–refine rounds.** Judge honestly against: looks cool · fits the woodcut garden · reads clearly · calm.
- A final report of 150 words at most: what you built, what you'd still improve, and the paths.

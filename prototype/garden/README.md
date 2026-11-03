# Garden prototypes (throwaway)

This branch is never merged. It keeps the generators behind the design
prototypes on the [Jungle ASCII Prototypes](https://claude.ai/artifact/KgGnnr3WStrREye2rS8ttj)
canvas, so they can be regenerated or built on.

- `gen_garden2.py`: shared pieces (flowers and specimens, nav, footer, the vine, the page shell).
- `gen_graph.py`: the link graph, force layouts, and the character-drawn graph variants (A–D).
- `gen_dither.py`, `gen_pollen.py`, `gen_meadows.py`, `gen_engraving*.py`: dithered graph variants (E–H, G2, G3).
- `gen_woodcut.py`, `gen_woodcut_note.py`, `woodcut_sprites.py`: **the chosen graph view**, the woodcut map and the note-level plate.
- `graph.json`: the note link graph the prototypes were built from.
- `shoot.js`, `runtime.js`: a local stand-in for the canvas runtime that renders a board and screenshots it with Playwright.
- `boards/`: the generated boards and the canvas index, as last generated here.

Run a generator from this folder after creating `jungle/project/`, e.g. `python3 gen_woodcut.py`.

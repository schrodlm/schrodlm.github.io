# How can ASCII art be rendered and animated on a static site?

Research for [issue #3](https://github.com/schrodlm/schrodlm.github.io/issues/3), under the revival map ([#1](https://github.com/schrodlm/schrodlm.github.io/issues/1)).
Researched 2026-10-28. Library versions are the npm `latest` tags on that date.

Context: the design thesis is a clean white page where ASCII art carries all decoration and structure (flora, borders, the graph, the header). Vibrant green, blue and yellow appear only in the ASCII. The flora is procedurally generated jungle (flowers, leaves, vines), animated where it helps, and prose stays plainly readable.

## Recommendation

1. **Render with DOM text: a `<pre>` per art block, coloured with run-length `<span>`s (one span per run of same-coloured characters, not one per character).** The glyphs are real text, so they stay vector-crisp at any zoom or DPR, inherit the page font, can be selected, and cost nothing to make responsive (size by `ch`/`em`). This is the default renderer of the best-known ASCII playground, play.core. Its docs say only that frequent horizontal style changes slow the text renderer down "considerably", which run-length spans keep down.
2. **Generate the flora with seeded L-systems or a simple growth automaton on a character grid, written in vanilla JS (no dependency).** A fixed seed per page, for example a hash of the page URL, makes every page's jungle stable between visits.
3. **Generate the static frame at build time and add the animation in the browser.** A build step emits the initial `<pre>` into the HTML, so the art exists with JS disabled and there is no layout shift. A small script (a few KB) then animates it. Growth, sway and blooming are driven by `requestAnimationFrame` at a capped 10 to 30 fps, paused off-screen with `IntersectionObserver`, and disabled under `prefers-reduced-motion: reduce`.
4. **Accessibility:** decorative art gets `aria-hidden="true"`. Meaningful art (a logo or the header wordmark) gets `role="img"` plus an `aria-label`. Prose is never ASCII.
5. **Keep canvas as an escape hatch** for a single dense, full-bleed animated scene (if one ever exceeds the DOM budget). Use a pre-rendered glyph atlas and `drawImage`, not per-frame `fillText`. **Do not use WebGL** (textmode.js, three.js `AsciiEffect`, shader post-processing). They solve a different problem, converting 3D or video into ASCII, and cost bundle size, crispness on a white page, and accessibility.
6. **Static generator: nothing here forces leaving Jekyll.** The site already builds in a custom Actions workflow (`.github/workflows/pages.yml` runs `bundle exec jekyll build` and then Node steps), so a Node or Ruby build-time generator step fits as it is. The GitHub Pages plugin allowlist does not apply.

## Rendering approaches compared

| | DOM text (`<pre>` + run-length spans) | Canvas 2D (glyph atlas) | WebGL ASCII shader |
|---|---|---|---|
| **Crispness** | Best. Text is rasterised by the browser at device resolution and survives zoom. | Blurry unless the backing store is scaled by `devicePixelRatio`; must round coordinates ([MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)) | Same DPR issue; atlas glyphs are textures, so they soften on zoom |
| **Performance** | Fine for blocks of up to a few thousand cells at 10–30 fps. Cost grows with the number of colour changes per row (spans) | Good. Pre-render glyphs to an offscreen canvas and `drawImage`. MDN: "Avoid text rendering whenever possible" in hot loops ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)) | Best for full-screen, per-pixel conversion of video or 3D. Overkill for sparse flora |
| **Responsiveness** | Free: reflows, `ch`/`em` sizing, media queries | Manual: resize handler, recompute cols and rows, redraw | Manual, same as canvas |
| **Screen readers** | Text is exposed. Hide decoration with `aria-hidden`, label meaningful art with `role="img"` + `aria-label` ([MDN img role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/img_role)) | A bitmap "does not provide information about any drawn objects"; needs fallback content inside `<canvas>` ([MDN canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)) | Same as canvas |
| **No-JS / SEO** | Works if build-time generated | Nothing renders | Nothing renders |
| **Selection / copy** | Yes (the art is text) | No | No |
| **Size limits** | None of note | iOS caps canvas at 4096×4096 px, and "exceeding the maximum … renders the canvas unusable" ([MDN canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)) | GPU context limits; WebGL2 required by textmode.js |
| **Dependencies** | None | None | three 0.186.1 / postprocessing 6.39.5, or textmode.js 0.18.0 (~930 KB unpacked) |

### Notes on DOM text

- play.core (the engine behind [play.ertdfgcvb.xyz](https://play.ertdfgcvb.xyz), [repo](https://github.com/ertdfgcvb/play.core), Apache-2.0, not published to npm, last push 2026-04-03) is the best reference design. A program exports `boot`, `pre`, `main(coord, context, cursor, buffer)` (called once per cell, returning a char or `{char, color, backgroundColor, fontWeight}`) and `post`. Its default renderer is `'text'`, with `'canvas'` as an alternative, and its fps defaults to 30. Its manual warns that frequent horizontal changes in weight or colour "will slow down the rendering considerably" because every style change needs a new inline element ([manual](https://play.ertdfgcvb.xyz/abc.html)). The lesson is to group same-colour runs. A jungle palette of 3 to 4 colours, with large mostly-green clusters, keeps the runs long.
- Only re-write rows that changed (diff the buffer against the last frame), and update `textContent`/`innerHTML` per row rather than the whole block.
- Typography: use one monospace webfont that covers box-drawing and block glyphs (U+2500–U+259F) so borders join up. Set `font-variant-ligatures: none` (ligature fonts merge `--`, `->` and similar), and use a `line-height` tuned so vertical strokes touch. Fallback fonts with different advance widths break alignment, so self-host the font.

### Notes on canvas

- MDN's canvas performance guidance applies directly: pre-render repeated drawing to an offscreen canvas, avoid text rendering in hot loops, scale for `devicePixelRatio`, use integer coordinates, and layer static and animated content on separate canvases ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)).
- Put a text fallback inside `<canvas>…</canvas>` ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)).

### Notes on WebGL

- **textmode.js 0.18.0** (MIT, [code.textmode.art](https://code.textmode.art)): "optimized WebGL2 rendering pipeline", converts existing `<canvas>`/`<video>` into textmode, works alongside p5.js (2.3.4) and three.js, and exports TXT/SVG/GIF. It is still at 0.x. Its strength is image-to-ASCII conversion, which this site does not need.
- **three.js `AsciiEffect`** ([source, r186](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/effects/AsciiEffect.js)) renders a 3D scene, reads back pixels and writes a DOM `<table>` of characters (charset `' .:-=+*#%@'`). It is useful only if a 3D object (e.g. the About page PC model) should appear as ASCII. It is a candidate for that one feature, not for the site's flora.

## Animation and motion policy

- Drive frames with `requestAnimationFrame` and throttle to a target fps. "Most browsers stop sending `requestAnimationFrame()` callbacks to background tabs or hidden `<iframe>`s" ([MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)), so hidden tabs cost nothing. Pause art that is scrolled out of view with `IntersectionObserver`.
- `prefers-reduced-motion` has values `no-preference` and `reduce`, and is Baseline widely available since January 2020. MDN notes that motion "can trigger discomfort for those with vestibular motion disorders" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). Policy: under `reduce`, render the fully grown final frame and do not animate. Listen to `matchMedia('(prefers-reduced-motion: reduce)')` `change` events to react live.
- Good motion for flora is slow and small: growth on first view (once), gentle sway via character swaps (`|` `/` `\`), and blooming when hovered. Avoid continuous large-area motion beside prose.

## Generating plant-like ASCII

| Technique | What it gives | Fit for ASCII grid | Source |
|---|---|---|---|
| **L-systems** (string rewriting + turtle) | Branching plants, ferns, flowers. Highly controllable, compact rules | Good: walk the turtle on the grid, pick a char by heading (`\|`, `/`, `\`, `_`), stamp leaf and flower glyphs at terminals | Prusinkiewicz & Lindenmayer, *The Algorithmic Beauty of Plants* ([algorithmicbotany.org](http://algorithmicbotany.org/papers/#abop)); JS lib `lindenmayer` 1.5.4 ([repo](https://github.com/nylki/lindenmayer)) |
| **Space colonization** | Natural-looking crowns and vines that fill a region (e.g. grow around the text column) | Good for "vines filling the margins": attractor points = free margin cells, so branches avoid prose | Runions, Lane, Prusinkiewicz, "Modeling Trees with a Space Colonization Algorithm" (2007) ([algorithmicbotany.org](http://algorithmicbotany.org/papers/colonization.egwnp2007.html)) |
| **Cellular / agent growth** (stochastic grid growth, CA rules) | Vines, moss, ground cover; trivially animatable step by step | Native: the grid *is* the state | cbonsai, a C/ncurses bonsai generator with `static` and `live` growth modes ([gitlab.com/jallbrit/cbonsai](https://gitlab.com/jallbrit/cbonsai)); botany, a terminal plant-growing game ([github.com/jifunks/botany](https://github.com/jifunks/botany)) |

Practical combo: a stochastic agent walk in the cbonsai style for vines and branches, with small hand-authored glyph stamps for flowers and leaves (`@`, `*`, `&`, `o`, `~`) coloured from the green/blue/yellow palette. Use space colonization when vines must wrap a region and avoid content. Seed a small PRNG (e.g. mulberry32) from the page slug so output is deterministic and can be generated identically at build time and at runtime.

## Constraints on the static generator

- The art is either emitted as static HTML at build time or generated client-side. Both work with any generator. The only requirement is a build step that can run a script.
- This repo already builds in GitHub Actions with Ruby and Node available (`.github/workflows/pages.yml`, Jekyll `~> 4.4.1`), so a build-time generator can be a Node script run after `jekyll build` over `_site/`, a Jekyll plugin in Ruby, or a Liquid include that outputs a placeholder that JS fills. Nothing here argues for leaving Jekyll. A JS-native generator (Eleventy, Astro) would let the same flora module run at build and runtime without a port, which is a minor convenience, not a requirement.

## Notable examples

- [play.ertdfgcvb.xyz](https://play.ertdfgcvb.xyz): live-coded ASCII programs on a DOM-text renderer, the closest reference for this site.
- [code.textmode.art](https://code.textmode.art): WebGL2 textmode, the state of the art for video and 3D-to-ASCII.
- [cbonsai](https://gitlab.com/jallbrit/cbonsai): procedural ASCII trees with a visible growth animation, a direct model for the flora.
- three.js [`AsciiEffect` example](https://threejs.org/examples/#webgl_effects_ascii): 3D to DOM ASCII.

## Open questions handed on

- The exact font, palette hex values and density of flora belong to the design-language ticket.
- Whether the graph view is ASCII-rendered (DOM text vs canvas) depends on the graph-view research. A large interactive graph is the one place the canvas escape hatch may be needed.

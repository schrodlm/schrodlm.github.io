# What renders an Obsidian-like graph view on a static site?

Research for issue #4. Researched 2026-10-28. The question: what it would take to build a site-wide, force-directed, clickable note graph with backlinks on this Jekyll 4.4 site, and whether it can be drawn in ASCII to fit the design thesis in #1 (ASCII art on clean white, with green, blue and yellow coming only through the glyphs).

## TL;DR

- **The graph is small.** 215 nodes and 309 undirected edges (365 directed links). That is well within the comfortable range of every library compared here, so performance does not decide the choice. Styling control and bundle size do.
- **Library: use plain `d3-force` 3.0.0 with our own renderer.** The physics is about 7 KB gzipped. Its layout is deterministic, it is the engine Quartz uses, and it imposes no rendering, so ASCII is possible. `force-graph` is the fallback if we want a finished canvas widget quickly (56 KB gzipped). Sigma.js and Cytoscape.js are oversized for this and harder to make look like ASCII.
- **Data: a roughly 40-line Ruby `Jekyll::Generator` in `_plugins/`.** It scans `site.collections['notes']` for `](/notes/<slug>.html)`, writes `/assets/graph.json`, and puts `backlinks` into each note's data so the backlinks render server-side in Liquid. Do not put this in the converter (out of scope per #1), and do not do it in Liquid (brittle).
- **ASCII: feasible.** Run d3-force, snap positions to a character grid, draw edges with Bresenham lines of `- | / \ .`, draw nodes as glyphs and labels, and output a `<pre>` of colored `<span>`s and `<a>`s (or draw the same grid on a canvas with `fillText`). Because the layout is deterministic, the same grid can be pre-rendered at build time as a no-JS fallback.

## 1. The graph we have to draw

Measured on `_notes/` at commit `09f9915`. The script scanned each note's markdown for `(/notes/<slug>.html` links, which the converter already writes in that form.

| Metric | Value |
|---|---|
| Notes (nodes) | 215 |
| Directed note→note links (deduplicated, no self-links) | 365 |
| Undirected edges | 309 |
| Raw link occurrences | 449 (0 dangling) |
| Isolated notes (no links in or out) | 23 (matches the ~23 empty stubs noted in #1) |
| Connected components | 36; the largest has 95 nodes |
| Highest degree | `konsenzus-v-distribuovanych-systemech` (20), then `distributed-system`, `koordinace-a-synchronizace-v-distribuovanem-systemu` and `komunikacni-model` (14 each) |
| Links from notes to posts | 9 (`/posts/...`), outside the notes graph |

Even 5x growth (about 1000 nodes and 1500 edges) is small for a force simulation that uses Barnes–Hut.

The current `assets/js/note-graph.js` reads `.note-content a[href^="/notes/"]` from the DOM and prints a `<ul>` of outgoing links. It has no global data, no backlinks and no layout.

## 2. Library comparison

Versions and dependencies come from the npm registry (`registry.npmjs.org/<pkg>/latest`). Sizes were measured by downloading each package's own minified UMD bundle from jsDelivr at that exact version and gzipping it with level 9.

| | **d3-force** | **force-graph** | **sigma.js** (+ graphology) | **cytoscape.js** |
|---|---|---|---|---|
| Version (published) | 3.0.0 (2021-06-05), ISC | 1.52.0 (2026-09-28), MIT | sigma 4.0.4 (2026-10-27) + graphology 0.26.0, MIT | 3.34.4 (2026-10-15), MIT |
| What it is | Physics only (velocity Verlet integrator, forces) | Ready-made canvas widget built on d3-force-3d, d3-zoom and d3-drag | WebGL renderer; the graph model is graphology; layout is separate (e.g. `graphology-layout-forceatlas2` 0.10.1) | Full graph library: model, layouts, canvas renderer, stylesheet |
| Min / gzip | 8.3 KB / 3.0 KB, plus d3-quadtree, d3-timer and d3-dispatch: **about 7 KB gzipped in total**. Adding d3-zoom, d3-drag and d3-selection with their transition and interpolate dependencies brings it to about 29 KB | 173 KB / **56 KB** (standalone bundle) | sigma 393 KB / **104 KB** + graphology 74 KB / 14 KB (sigma 3.0.2 was 187 KB / 47 KB) | 436 KB / **136 KB** (no dependencies) |
| Layout | Forces you compose: `forceManyBody` (Barnes–Hut), `forceLink`, `forceCenter`, `forceCollide`. About 300 ticks by default | d3-force-3d, with `warmupTicks`/`cooldownTicks`/`cooldownTime` | ForceAtlas2 (optionally in a web worker), or anything you compute yourself | `cose` built in; `fcose`/`cose-bilkent` extensions |
| Rendering | **None.** You draw to SVG, canvas or text | Canvas 2D; `nodeCanvasObject` / `linkCanvasObject` let you replace node and link drawing completely | WebGL 2 (v4 dropped WebGL 1). Labels are SDF text in WebGL; shapes come from "primitives"/programs | Canvas, plus a WebGL renderer in preview since 3.31 |
| Click to navigate | Your own hit-testing (`simulation.find(x, y, r)`) | `onNodeClick(node, event)` | `clickNode` event | `cy.on('tap', 'node', …)` |
| Styling ceiling | Unlimited. You own every pixel or character | High. The canvas callbacks run every frame, so glyph nodes are easy | CSS-like styles for circles and lines; anything exotic, including glyph text nodes, means writing WebGL programs | CSS-like stylesheet for shapes, colors and labels; no free-form drawing |
| Performance at 200–1000 nodes | Trivial. Barnes–Hut keeps a tick at O(n log n) | Smooth. It was built for thousands of nodes | Overkill. It is designed for 10k+ | Fine, and "largely moot" according to its own docs |
| ASCII fit | **Best**: physics with no opinion on drawing | Good: draw glyphs in `nodeCanvasObject` | Poor | Poor |

Sources:
- d3-force: README and the docs at d3js.org/d3-force. The many-body force uses "the Barnes–Hut approximation"; a simulation runs "300 iterations" by default; `simulation.randomSource` exists, and the default source is a fixed-seed LCG (`src/lcg.js`, seed `s = 1`), with initial positions in a "phyllotaxis arrangement". Together these make the layout **deterministic**.
- force-graph: README API table (`nodeCanvasObject`, `linkCanvasObject`, `onNodeClick`, `warmupTicks`, `cooldownTicks`, `autoPauseRedraw`) at github.com/vasturiano/force-graph.
- sigma.js: `CHANGELOG.md` for 4.0.0 ("complete rewrite of the programs system", "Migrates nodes and edges labels to WebGL using Signed Distance Fields", "Drops WebGL 1 support").
- cytoscape.js: `documentation/md/core/init.md` (`hideEdgesOnViewport` / `textureOnViewport` are "largely moot"), `documentation/md/layouts/cose.md`, and blog.js.cytoscape.org "WebGL Renderer Preview" (2025-01-13).

### Prior art: Quartz (the closest thing to "Obsidian Publish, static")

Quartz v4.5.2 (`jackyzha0/quartz`, branch `v4`) builds its graph like this:
- **Data:** a `ContentIndex` emitter writes a `contentIndex.json` mapping each slug to `{ slug, title, links: SimpleSlug[], tags }` (`quartz/plugins/emitters/contentIndex.tsx`). Backlinks are derived by inverting `links`.
- **Layout:** `d3` ^7.9.0 `forceSimulation` with `forceManyBody`, `forceCenter`, `forceLink` and `forceCollide` (`quartz/components/scripts/graph.inline.ts`, lines 168–172).
- **Rendering:** `pixi.js` ^8.15.0 with `preference: "webgpu"` (line 360), plus `@tween.js` for hover animation. pixi.js 8.22.0 alone is 841 KB minified / 237 KB gzipped.
- **Views:** a local graph (depth-limited breadth-first search from the current note) and a global graph in a modal.

What we take from Quartz is its architecture: a JSON link index produced at build time, d3-force for layout, and a separate renderer. We do not need pixi; at 215 nodes, Canvas 2D or text is enough.

## 3. Build-time link data in Jekyll

There are three options.

**A. A Jekyll generator plugin (recommended).** Generators run after the site is read and before it is rendered (Jekyll docs, `plugins/generators.md`). At that point `doc.content` is the raw markdown, which already contains the converter's `](/notes/<slug>.html)` links. The GitHub Actions build (`.github/workflows/pages.yml`, `bundle exec jekyll build` on Ruby 3.3) loads `_plugins/` because it does not run in safe mode. Sketch:

```ruby
# _plugins/note_graph.rb
module NoteGraph
  LINK = %r{\]\(/notes/([^)#\s]+?)\.html}
  class Generator < Jekyll::Generator
    priority :low
    def generate(site)
      notes = site.collections['notes'].docs
      by_slug = notes.to_h { |d| [d.basename_without_ext, d] }
      edges = notes.flat_map do |d|
        src = d.basename_without_ext
        d.content.scan(LINK).flatten.uniq
          .select { |t| by_slug.key?(t) && t != src }.map { |t| [src, t] }
      end
      back = Hash.new { |h, k| h[k] = [] }
      edges.each { |s, t| back[t] << s }
      notes.each do |d|
        d.data['backlinks'] = back[d.basename_without_ext].map { |s| by_slug[s] }
      end
      json = { nodes: notes.map { |d| { id: d.basename_without_ext, title: d.data['title'], url: d.url } },
               links: edges.map { |s, t| { source: s, target: t } } }.to_json
      page = Jekyll::PageWithoutAFile.new(site, site.source, 'assets', 'graph.json')
      page.content = json
      page.data['layout'] = nil
      site.pages << page
    end
  end
end
```

- The note layout then lists backlinks with `{% for b in page.backlinks %}`. That needs no JavaScript and works for crawlers. It replaces the DOM-scraping in today's `note-graph.js`.
- `graph.json` at the current size is about 215 × ~90 B + 365 × ~60 B, roughly 40 KB raw and under 8 KB gzipped. The client fetches it once, and the same file feeds both the local and the global view.
- The graph is rebuilt on every vault sync with no change to the converter, which fits #1's rule that the converter is a dependency, not a workspace.

**B. Pure Liquid.** You can loop `site.notes`, `split` each `content` on `"](/notes/"` and emit JSON with `jsonify`. It works without a plugin, but it is O(notes × links) string-splitting in a template language, the backlink inversion is awkward, and it is fragile against markdown edge cases. Use it only if plugins ever become disallowed, for example on a switch back to the `github-pages` gem.

**C. In the converter.** The converter resolves wikilinks, so it knows the graph exactly, including unresolved links that the site never sees. But #1 puts the converter's architecture out of scope and pins it at `v0.1.0`, and every sync wipes the folders it writes. One option is to ask it to emit `_data/graph.json`, which would survive because it is a data file the converter owns. That is only worth doing if the site later needs information it cannot recover from the markdown, such as unresolved or "ghost" links of the kind Obsidian shows. Note it as a possible later converter requirement, not a starting point.

## 4. ASCII rendering feasibility

ASCII is feasible, because d3-force only produces `x`/`y` and leaves drawing to us. There are three tiers:

1. **ASCII-flavoured canvas** (cheapest). Draw nodes with `ctx.fillText` in a monospace font (`o`, `@`, `*`, or a small flower glyph cluster to fit the jungle idea) and draw edges as dotted lines. Pixel positions stay continuous, so drag and zoom feel like Obsidian. You can do this with force-graph's `nodeCanvasObject`/`linkCanvasObject` or with raw d3-force on a `<canvas>`.
2. **True character grid** (most on-thesis). Each tick:
   - map simulation coordinates to a `cols × rows` grid. 160 × 60 is 9,600 cells; scale it by viewport;
   - draw each edge as a Bresenham line, choosing `-`, `|`, `/`, `\` by slope (or `.` / `:` for a lighter look), and colour by cluster or degree in green, blue or yellow;
   - stamp nodes as `(o)`, `[*]` or a degree-sized glyph, with the label text written after the glyph and suppressed when it collides;
   - output the result either as a `<pre>` of `<span class>` runs with each node an `<a href>` (native clicks, focus, accessible link text), or as a canvas `fillText` grid with hit-testing through `simulation.find()`.

   String-building 9.6k cells per frame is cheap. Let the simulation cool (`alpha` decays to `alphaMin` in about 300 ticks), then stop redrawing. Hover can highlight a node's neighbours by recolouring spans. Drag is coarser on a grid but works.
3. **Static pre-render** (no JavaScript). The default d3-force layout is deterministic (fixed-seed LCG, phyllotaxis start), so running the same simulation at build time gives the same picture. The Actions workflow already sets up Node 20 for the CV PDF, so a small `scripts/render-graph.mjs` step after `jekyll build` could run d3-force over `_site/assets/graph.json`, rasterise the grid and inject a `<pre>` into `_site/graph/index.html` as a no-JS and first-paint fallback. The client script then animates from the same positions.

Caveats:
- **Legibility.** At 215 nodes, putting every label on a terminal-sized grid will collide. Show labels only for high-degree nodes, the hovered node and its neighbours, and use the local (depth-1 or depth-2) graph on note pages, which is a few dozen nodes at most.
- **Fonts.** Box-drawing or Unicode glyphs need a monospace webfont with consistent advance widths. Plain ASCII `-|/\.o*` is safe everywhere.
- **The 23 isolated stubs** will float around the edge. Hide them, or let the publishing-gate decision (#1, "Not yet specified") remove them.

## 5. Recommendation

1. Add `_plugins/note_graph.rb` (option A). It emits `/assets/graph.json` and `page.backlinks`, and the note layout renders backlinks server-side.
2. Client: vendor `d3-force` 3.0.0 with `d3-quadtree`, `d3-timer` and `d3-dispatch` (about 7 KB gzipped), and write our own renderer: a character-grid `<pre>`/canvas for the ASCII look (tier 2), with a local graph on each note and a global graph at `/graph/`. Add d3-zoom and d3-drag (about 22 KB gzipped more) only if hand-rolled pan and zoom is not enough.
3. Optional: a build-time ASCII pre-render (tier 3) using the Node step that already exists in `pages.yml`.
4. If time is short, `force-graph` 1.52.0 with `nodeCanvasObject` glyphs gives an Obsidian-like result in an afternoon, at 56 KB gzipped and with less control over the ASCII grid.
5. Skip sigma.js and cytoscape.js. They are built for 10k+ node graphs and graph analysis, they are 4 to 19 times larger than the d3-force route, and their WebGL/stylesheet rendering works against an ASCII aesthetic.

The visual design itself (glyph vocabulary, colour mapping, the local versus global split) remains the "Graph view design" item in #1 and waits for the design-language decision.

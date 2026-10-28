# What would a clickable, animated 3D model of my PC cost to build?

Research for issue #5. Checked on 2026-10-28. Package versions and sizes come from the npm registry and jsDelivr on that date. Sizes marked "gz" were measured by gzipping the published file at level 9.

## TL;DR

- **It is feasible, and the ASCII version fits the design thesis best.** Render the PC with three.js and pass every frame through an ASCII effect. Clicking still works because picking runs on the real 3D scene, not on the characters.
- **The model is most of the cost, not the viewer.** Photogrammetry cannot capture the parts inside a case. You end up modelling in Blender, either by hand or by assembling CAD and Sketchfab parts with compatible licences.
- **Minimal version: about 10–15 h.** Use `<model-viewer>` and a model of about six blocky parts, one material each. Labels are hotspots and there is no ASCII.
- **Nice version: about 45–80 h.** A three.js scene of a reasonably faithful model, with exploded-view animations, outlines on hover, a GPU ASCII shader in green, blue and yellow, lazy loading and a fallback. The Blender learning curve decides which end of the range you land on.
- **Page cost.** Load nothing until the visitor asks for it. After that, expect about 230 KiB gz of three.js plus a 0.5–1.5 MB model.

## 1. Sourcing the model

| Route | What you get | Licence | Effort | Verdict |
|---|---|---|---|---|
| **Photogrammetry or phone scan** (Polycam, RealityScan, Meshroom) | One textured exterior shell, with no separate parts | Your own photos, so the scan is yours | 2–4 h of capture and cleanup | **Not enough on its own.** Parts behind panels are never photographed, and the scan comes out as a single mesh, so you would have to cut it into parts by hand. Tempered glass and glossy black panels are the usual problem cases for photogrammetry. Use a scan only as a reference for proportions. |
| **Hand modelling in Blender** | Exactly the parts you want, each as its own object | Yours | 4 h for blocky shapes, 30–60 h for a faithful model | **The default.** Low-poly blocks also suit an ASCII render, which hides detail anyway. |
| **Assembling existing parts** (manufacturer STEP files, GrabCAD, Sketchfab) | Detailed GPUs, boards and coolers | Varies by model (see below) | 8–20 h of finding, converting from STEP, decimating and cleaning | **Good for the "nice" version.** Check the licence of every part. |

**Licences of the existing-model sources:**

- **Sketchfab.** Each downloadable model carries either a Creative Commons licence or the Sketchfab Standard licence. CC BY is the default, and the uploader can add NC, ND or SA. Credit is required for every CC licence except CC0. The Download API guidelines say the licence and credit must follow the asset wherever it is used. The Standard licence forbids redistributing the asset as a standalone file. A GLB on a public static site can be downloaded by anyone, so it effectively is a standalone file. Prefer CC0 or CC BY.
  - https://sketchfab.com/licenses (Standard and Editorial terms)
  - https://sketchfab.com/blogs/community/an-introduction-to-creative-commons-licenses
  - https://help.sketchfab.com/en/articles/16152215-crediting-users-for-3d-model-downloads
  - https://sketchfab.com/developers/download-api/guidelines
- **CC ND is unusable here.** Splitting a model into parts, recolouring it or decimating it counts as an adaptation, and ND forbids adaptations. CC NC is fine for a non-commercial personal site.
- **GrabCAD Community.** GrabCAD has no per-model licence. Its Stratasys site terms grant a "limited, non-exclusive … license" for "internal, non-commercial purposes". Republishing a derived mesh on a public site falls outside that grant. Use GrabCAD parts only as modelling references.
  - https://grabcad.com/terms (returned 403 to automated fetch, so this was read through search excerpts and is unconfirmed)
- **Manufacturer CAD downloads** (for example case and cooler STEP files) come with their own terms. Check each one. Most are meant for fit-checking, not for redistribution.

**Photogrammetry tools, in case you want a reference scan:**

- **Polycam.** Its help centre says the free plan exports glTF.
  - https://learn.poly.cam/hc/en-us/articles/27756102599572-What-File-Types-Can-Polycam-Export
- **RealityScan.** Epic's free desktop and mobile app, formerly RealityCapture. Version 2.2 exports GLB, OBJ, FBX and USD. The 2.0 release made it free for individuals and companies under $1M in revenue.
  - https://www.cgchannel.com/2025/06/epic-games-releases-realityscan-2-0-and-realityscan-mobile-1-7/
  - https://digitalproduction.com/2026/06/26/realityscan-2-2-widens-gpu-support/
- **Meshroom / AliceVision.** Licensed MPL-2.0. Its GPU-accelerated depth step runs on the GPU, and it outputs a mesh with UV textures.
  - https://alicevision.org/

**Authoring requirement for any route:** every clickable component must be its own node in the glTF, and for `<model-viewer>` it must also have its own material (see section 2). Do not run `gltf-transform join` or the join step of `optimize` on the file, because it merges meshes to reduce draw calls. Check the flags with `gltf-transform help optimize`.

## 2. Viewers and part picking

| | `<model-viewer>` 4.4.0 (Apache-2.0) | three.js r186 (`three@0.186.1`, MIT) |
|---|---|---|
| JS weight (gz) | `model-viewer.min.js`: **282 KiB**, with three.js bundled in | `three.module.min.js` 88 KiB + `three.core.min.js` 102 KiB + `GLTFLoader` 25 KiB + `OrbitControls` 8 KiB + meshopt decoder 8 KiB ≈ **231 KiB** |
| Clicking a part | `materialFromPoint(x, y)` returns a **material**, not a node (`lib/features/scene-graph.d.ts`). Picking a part therefore means one material per part. `surfaceFromPoint` and `positionAndNormalFromPoint` return points for hotspots. | `Raycaster.intersectObjects()` returns the hit `Object3D`. Walk up to the part's group and read `object.name`. https://threejs.org/docs/#api/en/core/Raycaster |
| Labels | Declarative hotspots: `<button slot="hotspot-gpu" data-position data-normal>` (`lib/features/annotation.d.ts`). Very easy. | `CSS2DRenderer`, or DOM labels you position by hand. |
| Highlighting | Change the material's colour or emissive factor through the material API. | Anything: emissive, `OutlinePass`, or the ASCII colour. |
| Animation | Plays clips baked into the glTF: `animationName`, `play()`, and `appendAnimation()` for layering (`lib/features/animation.d.ts`). Each part's "slide out" has to be keyframed in Blender. | Baked clips through `AnimationMixer`, **or** code-driven tweens such as lerping a part along its explode vector. No keyframing needed. |
| Lazy loading | Built in: `loading="auto|lazy|eager"`, `reveal="auto|manual"`, `poster`, `dismissPoster()` (`lib/features/loading.d.ts`). The script itself still has to be lazy-imported. | Do it yourself with `IntersectionObserver` or a click, then `import()`. |
| Post effects / ASCII | `@google/model-viewer-effects` 1.5.0 offers bloom, pixelate, outline, SSAO, glitch, colour grade and SMAA, but **no ASCII**. A custom effect would need its `EffectBase` mixin and pulls in `postprocessing`. | Full control. See section 4. |

Sources: model-viewer type declarations at https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/lib/ and the docs at https://modelviewer.dev/ (the docs are rendered client-side, so the type declarations were the source checked).

**Verdict.** `<model-viewer>` is the faster route to a plain, realistic viewer with labels. three.js wins as soon as you want ASCII rendering or animation driven from code, and it is not heavier. Both run as plain ES modules from a CDN or `assets/js`, so neither forces a bundler into the Jekyll build.

## 3. Page weight and lazy loading

- **Model budget.** Aim for a GLB of 0.5–1.5 MB. For an ASCII render, use flat vertex colours or plain materials with no textures. That drops most of the weight, since textures dominate the size of a typical glTF.
- **Compression** with glTF-Transform (`@gltf-transform/cli` 4.5.1, MIT, https://gltf-transform.dev/cli):
  - `simplify` reduces the vertex count.
  - `meshopt` compresses geometry and animation (EXT_meshopt_compression). The decoder costs **8 KiB gz**.
  - `draco` compresses geometry (KHR_draco_mesh_compression). Its decoder costs **~280 KiB of wasm plus a 57 KiB wrapper** (measured from gstatic's 1.5.7 build), so Draco's decoder outweighs what it saves on a small model.
  - `webp` and `resize` handle any textures you keep.
  - **Choose meshopt.**
- **Load strategy.**
  1. The About page ships a static poster: a pre-rendered ASCII still in a `<pre>`, or a small image. It adds 0 KiB of JS.
  2. A "▶ open the PC" button, or an `IntersectionObserver` with a margin, triggers `import('/assets/js/pc.js')`. That module imports three.js and then fetches the GLB.
  3. Honour `prefers-reduced-motion` with no auto-rotation or explode animation. Fall back to the poster when WebGL is unavailable.
- **Result.** First load of the About page is unchanged. About 230 KiB gz of JS plus the GLB are fetched only on demand, and the browser caches them afterwards.

## 4. ASCII rendering feasibility

**Feasible, and this is the version that fits the design thesis of ASCII on clean white in green, blue and yellow.** Picking is unaffected because the raycaster tests the 3D scene, not the rendered characters. Two implementations:

1. **three.js `AsciiEffect`** (`examples/jsm/effects/AsciiEffect.js`, 3 KiB gz)
   - **How it works.** Each frame it renders with WebGL, copies the canvas into a small offscreen canvas (size × `resolution`, default 0.15), and reads the pixels back with `getImageData`. It maps brightness onto the ramp `' .:-=+*#%@'` and writes the result with `innerHTML` into a `<table>` styled `white-space: pre`.
   - **White background.** Bright and transparent pixels map to a space, so the default ramp already suits a white page without `invert`.
   - **Colour.** `color: true` wraps every character in a styled `<span>`. The source notes this "slows down rendering".
   - **Pros.** Real text characters in the page's own monospace font, so it matches the rest of the site's ASCII exactly.
   - **Cons.** It costs a CPU readback and a DOM rebuild every frame. Monochrome text at a modest size is fine. Coloured text at full width will stutter on phones.
   - **Mitigation.** Re-render only while the user drags or a part animates, not continuously.
   - Source: https://github.com/mrdoob/three.js/blob/r186/examples/jsm/effects/AsciiEffect.js
2. **GPU ASCII shader.** This means a fragment shader that samples a glyph atlas per cell. The `postprocessing` library has a ready-made `ASCIIEffect` (`postprocessing` 6.39.5, Zlib licence), with options `asciiTexture`, `cellSize=16`, `color` and `inverted`.
   - **Pros.** It runs entirely on the GPU, so it stays smooth at 60 fps with colour.
   - **Cons.** The glyphs are pixels, not selectable text, and the glyph atlas must use the site's font to match. The full `postprocessing` ESM build is ~154 KiB gz unminified. Without a bundler, a hand-written 50–80-line `ShaderMaterial` pass is lighter.
   - Source: https://cdn.jsdelivr.net/npm/postprocessing@6.39.5/build/types/index.d.ts

**Colouring parts in the palette.** Give each part a flat unlit material in green, blue or yellow, and use the highlight colour for hover. The shader's per-cell colour sampling then carries the palette into the ASCII, so colour enters only through the ASCII, as the thesis requires.

**Recommendation.** Use approach 1 for a monochrome prototype, then approach 2 for the nice version.

## 5. Effort estimate (honest)

These figures assume someone who is comfortable with JS and new to Blender.

**Minimal: about 10–15 h**

| Task | Hours |
|---|---|
| Learn enough Blender to block out a case, motherboard, GPU, CPU cooler, RAM, PSU and drives as separate objects, one material each | 4–6 |
| Export GLB, `gltf-transform meshopt` | 0.5 |
| `<model-viewer>` with hotspot labels, `materialFromPoint` highlight, `loading="lazy"` and a poster, lazy `import()` | 3–5 |
| Styling on the About page, mobile check | 2–3 |

**Nice: about 45–80 h**

| Task | Hours |
|---|---|
| Faithful model of the actual case and parts, assembling licensed parts and hand-modelling the rest, plus decimation | 20–40 |
| three.js scene: orbit, raycast picking, hover outline, labels, explode tweens per part | 10–15 |
| GPU ASCII pass in the site palette and font, tuning legibility at different sizes | 8–15 |
| Lazy loading, poster still, reduced-motion, no-WebGL fallback, touch | 4–6 |
| Cross-device performance tuning | 3–5 |

Hand-modelling the faithful version is the biggest risk. Low-poly blocks plus ASCII hide almost all missing detail, so "nice rendering of a blocky model" (about 25–35 h) is the sweet spot.

## Sources

- three.js r186: https://www.npmjs.com/package/three (0.186.1, MIT); https://threejs.org/docs/#api/en/core/Raycaster; AsciiEffect source at https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/AsciiEffect.js
- model-viewer 4.4.0: https://modelviewer.dev/ and the type declarations at https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/lib/features/
- model-viewer-effects 1.5.0: https://cdn.jsdelivr.net/npm/@google/model-viewer-effects@1.5.0/lib/model-viewer-effects.d.ts
- postprocessing 6.39.5: https://github.com/pmndrs/postprocessing
- glTF-Transform 4.5.1: https://gltf-transform.dev/cli; meshoptimizer 1.3.0: https://github.com/zeux/meshoptimizer; Draco decoders at https://www.gstatic.com/draco/versioned/decoders/1.5.7/
- Sketchfab licences: https://sketchfab.com/licenses, https://sketchfab.com/developers/download-api/guidelines
- GrabCAD terms: https://grabcad.com/terms
- Polycam: https://learn.poly.cam/hc/en-us/articles/27756102599572-What-File-Types-Can-Polycam-Export; RealityScan: https://www.cgchannel.com/2025/06/epic-games-releases-realityscan-2-0-and-realityscan-mobile-1-7/; Meshroom: https://alicevision.org/

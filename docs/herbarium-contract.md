# The herbarium contract

Every flower on the site comes from my `herbarium` library ([ADR 3](adr/0003-flowers-come-from-a-separate-library.md)).
This is what the site needs from it. Until the library is published, a stub in
`src/lib/herbarium/stub.ts` meets the same contract and draws construction tape
instead of flowers. The words are the [glossary's](../CONTEXT.md).

## The seam

The site takes flowers from `src/lib/herbarium/` and nowhere else. Its
`index.ts` re-exports whatever meets this contract, today the stub.

## The three functions

```ts
grow(name: string): Specimen
draw(specimen: Specimen, options: DrawOptions): Row[]
label(specimen: Specimen): Trait[]
```

The library exports these and the types below, under these names.

```ts
interface Specimen {
  name: string;   // the name it grew from
  seed: number;   // a whole number, shown as the specimen's number
  latin: string;  // its Latin name
}

type Form = 'plant' | 'head' | 'mark';

interface DrawOptions {
  wind: number;   // the moment of wind, see below
  form: Form;
  size?: number;  // a head's size in rows; needed for a head, ignored otherwise
}

interface Run { t: string; c: string }  // characters, and their CSS colour
type Row = Run[];                         // one line of the drawing

interface Trait { name: string; value: string }  // one line of the specimen card
```

- **`grow`** turns a page's name into its specimen. The specimen may carry more
  than these three fields (its genome, say); the site never reads the rest and
  only hands the specimen back to `draw` and `label`.
- **`draw`** draws the specimen's flower in one form at one moment of wind, as
  rows of coloured braille runs.
- **`label`** gives the traits the seed chose, in the order the specimen card
  lists them.

All three are pure: no randomness, no clock, no state between calls. They run
both at build time in Node and in the browser, so the library uses neither
Node's nor the DOM's APIs, has no dependencies, and ships as an ES module with
its own types.

## Forms and their footprints

Each form has a fixed footprint in braille cells, whatever the name and the
wind, so the site can lay out a page before it knows the flower.

| Form | Footprint, cells across × rows | Where the site shows it |
|---|---|---|
| `plant` | 15 × 13 | the whole plant: beside a page's title, on its specimen card, in the garden |
| `head` | 2·`size` × `size` | the head alone, as a square: in the herbarium and on the graph view |
| `mark` | 3 × 1 | the one-line mark beside a title in a list |

- A cell is 2 dots across and 4 down, and the site sets it twice as tall as it
  is wide, so a head 2·`size` cells across and `size` rows tall is a square
  of dots.
- A head takes any whole `size` from 1 up; small sizes may simplify it. Any
  other size, or none, is a `RangeError`.
- The plant stands on the bottom row, its stem rising from the middle, so
  plants side by side share one ground.
- The plant sways within its footprint; no wind pushes it out.

## Characters and colours

- Every character is from the braille block, U+2800 to U+28FF. A cell with no
  dots is U+2800. No spaces, no newlines, nothing else.
- Every row's runs add up to exactly the footprint's width.
- `c` is a CSS colour string the library chooses, such as `#A87400`, or
  `transparent` for a run with no dots. The site sets it as the run's colour
  as it is. The colours are drawn to read on the site's light ground.
- A cell takes one colour: where parts of a flower share a cell, the library
  decides which one shows.
- The site may decode a drawing back to its dots and lay them into a larger
  drawing, as the garden does, so a dot left out must mean empty ground.

## The wind

`wind` is one number from -1 to 1. 0 is still air, and draws the flower at
rest. The sign is the direction, positive leaning right and negative left, and
the size is the strength, 1 being the strongest gust the site sends. The wind
changes the flower's pose, never which flower it is.

The site animates the wind: in the browser it calls `draw` for every flower on
the page many times a second, with a value that drifts smoothly over time. So
`draw` is fast, and continuous in `wind`: a small change of wind makes a small
change in the drawing, never a jump. Every page is first built with `wind: 0`,
which is also what visitors who prefer reduced motion, or have no JavaScript,
see. A value outside -1 to 1 is treated as the nearer end.

## Same name, same flower

Within a major version, the same name always grows the same specimen, and the
same specimen and options always draw the same rows and give the same label,
character for character and colour for colour. For the site this means:

- a flower drawn into a page at build time and the same flower animated in the
  browser always match;
- an upgrade within the major version changes no flower on the site, so it is
  routine;
- moving to a new major version regrows every flower. It is a deliberate
  change in its own pull request, with its screenshots refreshed.

Before the first major release, flowers may still change with any version.

The library's golden tests keep this promise. The site does not test the
library's flowers; it tests that it lays out each form's footprint.

## Swapping the stub for the library

The site depends on `herbarium` like any other package, pinned to an exact
version. Then one line changes, in `src/lib/herbarium/index.ts`:

```diff
-export * from './stub';
+export * from 'herbarium';
```

The stub and its tests go in the same change, and the screenshots are
refreshed, since every page now shows its real flower.

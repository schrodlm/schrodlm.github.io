/**
 * Clascii turns pictures into ASCII art. Compiled from the Scala library of the same name with Scala.js.
 *
 * Every function checks its arguments when it runs and throws an Error that says what is wrong,
 * so plain JavaScript gets the same protection these types give TypeScript.
 */

/** The names of the built-in character tables, in the order to offer them. */
export declare const tables: readonly string[];

/** The ways braille can decide which dots to raise, the default first. */
export declare const dithers: readonly Dither[];

/**
 * A picture in the browser's layout. A canvas's ImageData fits as it is.
 */
export interface Pixels {
  /** Red, green, blue and alpha (0–255) for every pixel, row by row: width × height × 4 values. */
  readonly data: Uint8ClampedArray | Uint8Array;
  /** At least 1. */
  readonly width: number;
  /** At least 1. */
  readonly height: number;
}

/**
 * The characters to draw with:
 * - a built-in table's name, one of {@link tables};
 * - `{ chars }`: your own characters, darkest first, each grey getting an equal share;
 * - `{ limits }`: your own grey limits, `[grey, character]` pairs whose greys rise and end at 255,
 *   each character drawn for the greys up to its limit;
 * - `{ braille }`: braille, one character for every 2 by 4 pixels, so eight times the detail,
 *   drawn with the {@link Dither} named.
 */
export type Characters =
  | string
  | { readonly chars: string }
  | { readonly limits: ReadonlyArray<readonly [number, string]> }
  | { readonly braille: Dither };

/**
 * How braille decides which dots to raise, so that areas of grey look grey:
 * - `"ordered"`: compared with a repeating 4 by 4 pattern; even textures, steady on video. The default.
 * - `"diffusion"`: each dot's rounding error passes on to its neighbours; the most natural for
 *   photos, but on video the dots shimmer.
 * - `"threshold"`: a dot wherever the picture is darker than mid-grey; sharp outlines, no greys.
 */
export type Dither = "ordered" | "diffusion" | "threshold";

/** A filter on the full picture, before it is shrunk to fit. */
export type RgbFilter =
  /** Turns the picture clockwise; degrees must be a multiple of 90. */
  | { readonly type: "rotate"; readonly degrees: number }
  /** Turns the picture upside down (vertical) or mirrors it left to right (horizontal). */
  | { readonly type: "flip"; readonly direction: "vertical" | "horizontal" };

/** A filter on the grey values (0 black to 255 white), after the picture is shrunk. */
export type GreyFilter =
  /** Adds a whole number to every grey. */
  | { readonly type: "brightness"; readonly amount: number }
  /** Moves every grey away from mid-grey: 2 doubles the contrast, 0 makes all mid-grey. At least 0. */
  | { readonly type: "contrast"; readonly factor: number }
  /** Turns black into white and white into black. */
  | { readonly type: "invert" };

/** A filter on the finished characters. */
export type AsciiFilter =
  /** Multiplies the art's size: 2 doubles it, 0.5 halves it. Must be positive. */
  { readonly type: "scale"; readonly factor: number };

/** How to draw. Every setting is optional. */
export interface Settings {
  /** Most characters per line, a whole number of at least 1. The art is never wider than the picture. */
  readonly maxColumns?: number;
  /** Most lines, a whole number of at least 1. The art fits inside both limits. */
  readonly maxRows?: number;
  /** A character cell's width divided by its height; 0.5 (the default) suits most monospace fonts. */
  readonly cellAspect?: number;
  /** The characters to draw with; "default" when left out. */
  readonly characters?: Characters;
  /** Run in order on the full picture. */
  readonly rgbFilters?: readonly RgbFilter[];
  /** Run in order on the grey values. */
  readonly greyFilters?: readonly GreyFilter[];
  /** Run in order on the finished characters. */
  readonly asciiFilters?: readonly AsciiFilter[];
  /**
   * True to get each character's colour too: the average colour of the pixels it covers.
   * Grey filters change only the characters; every other filter moves both.
   */
  readonly colors?: boolean;
}

/** The finished art. */
export interface Art {
  /** Characters per line. */
  readonly columns: number;
  /** Number of lines. */
  readonly rows: number;
  /** One string per line, each `columns` characters long. */
  readonly lines: string[];
  /** The lines joined with newlines. */
  readonly text: string;
  /**
   * Only with `colors: true`: red, green, blue and alpha for every character, row by row:
   * columns × rows × 4 values, so `new ImageData(colors, columns, rows)` accepts it. Alpha is 255.
   */
  readonly colors?: Uint8ClampedArray<ArrayBuffer>;
}

/** Art rendered with `colors: true`, so its colours are always there. */
export interface ColoredArt extends Art {
  readonly colors: Uint8ClampedArray<ArrayBuffer>;
}

/**
 * Turns pixels into ASCII art.
 *
 * The time it takes grows with the pixels passed in, not with the size of the art. For video, draw
 * each frame onto a canvas at about 4 pixels per column of art first: the canvas shrinks it almost
 * for free, and the art looks the same.
 *
 * @throws Error if the pixels or settings are not valid, with a message saying which and why.
 */
export declare function render(pixels: Pixels, settings: Settings & { readonly colors: true }): ColoredArt;
/** Turns pixels into ASCII art. */
export declare function render(pixels: Pixels, settings?: Settings): Art;

/**
 * A generated test picture, 640 by 480: soft waves of grey. The same seed always draws the same picture.
 *
 * @param seed A whole number; a random one when left out.
 */
export declare function plasma(seed?: number): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number };

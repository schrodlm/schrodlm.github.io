// The jungle at night around clascii's pond, drawn in characters: a band of grass and stems along
// the top, vines hanging and stems growing in the margins beside the page with fireflies among
// them, a faint speckle behind it all, and the soil with its roots along the bottom. Every part is
// drawn for a tick of the garden's clock (src/lib/life/clock.ts), so the build draws tick 0, the
// resting frame, and the page redraws later ticks from the same code. It grows no flowers: those
// come only from the herbarium.
import { wind } from '../life/clock';
import { rng } from '../random';

/** The colours of the jungle, each a --night-<tone> custom property. */
export type Tone = 'leaf' | 'fern' | 'moss' | 'bark' | 'far' | 'mango' | 'hibiscus';

/** A stretch of characters in one tone, or in none for blank space. */
export interface Run {
  t: string;
  tone?: Tone;
}

/** One line of a drawing. */
export type Line = Run[];

/** How wide the band and the soil are drawn: wider than any window, so a page centres them and lets them be cut. */
export const WIDTH = 320;
/** The band along the top: its rows, the last of them the ground. */
export const BAND_ROWS = 6;
/** The soil along the bottom: a row of grass, the ground line, and the roots under it. */
export const SOIL_ROWS = 7;

class Grid {
  readonly chars: string[];
  readonly tones: (Tone | undefined)[];

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.chars = new Array<string>(cols * rows).fill(' ');
    this.tones = new Array<Tone | undefined>(cols * rows).fill(undefined);
  }

  put(x: number, y: number, ch: string, tone: Tone): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    this.chars[y * this.cols + x] = ch;
    this.tones[y * this.cols + x] = tone;
  }

  free(x: number, y: number): boolean {
    return this.chars[y * this.cols + x] === ' ';
  }

  lines(): Line[] {
    const lines: Line[] = [];
    for (let y = 0; y < this.rows; y++) {
      const line: Line = [];
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        const ch = this.chars[i]!;
        const tone = ch === ' ' ? undefined : this.tones[i];
        const last = line.at(-1);
        if (last && last.tone === tone) last.t += ch;
        else line.push(tone ? { t: ch, tone } : { t: ch });
      }
      lines.push(line);
    }
    return lines;
  }
}

/** A steady pseudo-random number in [0, 1) for a cell, the same on every frame. */
function hash(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Seconds since the page opened, at a tick of the clock. */
const seconds = (tick: number) => tick / 4;

/** The faint speckle behind the jungle, in every cell nothing else is drawn in. */
function speckle(grid: Grid, top: number): void {
  const marks = " .,':";
  for (let y = 0; y < grid.rows; y++)
    for (let x = 0; x < grid.cols; x++) {
      if (!grid.free(x, y)) continue;
      const Y = y + top;
      const v = Math.sin(x * 0.31) * Math.sin(Y * 0.53) + Math.sin((x + Y) * 0.17);
      const k = (v + 2) / 4 + (hash(x, Y) - 0.5) * 0.35;
      if (k > 0.47) grid.put(x, y, marks[Math.min(marks.length - 1, Math.floor((k - 0.47) * 14))]!, 'far');
    }
}

/** The band along the top of the page: grass on the ground line, and short stems leaning in the wind. */
export function drawBand(cols: number, tick: number): Line[] {
  const grid = new Grid(cols, BAND_ROWS);
  const ground = BAND_ROWS - 1;
  for (let x = 0; x < cols; x++) {
    grid.put(x, ground, '_.,_'[x % 4]!, 'bark');
    if (hash(x, 3) < 0.3) grid.put(x, ground - 1, ",'`"[x % 3]!, 'moss');
  }
  const random = rng('clascii band');
  const w = wind(tick);
  for (let x = 2 + Math.floor(random() * 4); x < cols - 2; x += 6 + Math.floor(random() * 5)) {
    const height = 2 + Math.floor(random() * 2);
    const stiff = 0.8 + random() * 0.4;
    const lean = (k: number) => Math.round(Math.max(-1, Math.min(1, (w * stiff * k) / height)));
    for (let k = 0; k < height; k++) {
      const turn = k ? lean(k) - lean(k - 1) : 0;
      grid.put(x + lean(k), ground - 1 - k, turn > 0 ? '/' : turn < 0 ? '\\' : '|', 'leaf');
    }
  }
  speckle(grid, 0);
  return grid.lines();
}

/** The soil along the bottom of the page: grass and mushrooms, the ground line, roots and pebbles. */
export function drawSoil(cols: number): Line[] {
  const grid = new Grid(cols, SOIL_ROWS);
  const random = rng('clascii soil');
  for (let x = 0; x < cols; x++) {
    if (hash(x, 9) < 0.45) grid.put(x, 0, `,'"v`[Math.floor(hash(x, 4) * 4)]!, 'moss');
    grid.put(x, 1, '_', 'bark');
  }
  for (let i = 0; i < Math.max(1, Math.round(cols / 50)); i++) {
    const x = 3 + Math.floor(random() * (cols - 6));
    [...'(^)'].forEach((ch, j) => grid.put(x - 1 + j, 0, ch, 'hibiscus'));
  }
  for (let x0 = 3; x0 < cols - 3; x0 += 5 + Math.floor(random() * 9)) {
    let x = x0;
    const length = 2 + Math.floor(random() * 4);
    for (let y = 2; y < 2 + length && y < SOIL_ROWS; y++) {
      const turn = random() < 0.3 ? -1 : random() > 0.7 ? 1 : 0;
      grid.put(x, y, turn < 0 ? '/' : turn > 0 ? '\\' : '|', 'bark');
      x += turn;
    }
  }
  for (let i = 0; i < cols / 8; i++) grid.put(Math.floor(random() * cols), 2 + Math.floor(random() * (SOIL_ROWS - 2)), '.', 'bark');
  return grid.lines();
}

/** The margins: a drawing `cols` by `rows`, with the page's text in the columns `x0` to `x1`. */
export interface Margins {
  cols: number;
  rows: number;
  x0: number;
  x1: number;
}

/**
 * The margins beside the page, between the band and the soil: vines hanging from the top and
 * stems growing from the bottom, taller towards the window's edge, with fireflies among them. They
 * keep two columns clear of the page's text on either side.
 */
export function drawMargins({ cols, rows, x0, x1 }: Margins, tick: number): Line[] {
  const grid = new Grid(cols, rows);
  const t = seconds(tick);
  const w = wind(tick);
  const random = rng(`clascii margins ${cols}`);
  // Each margin from its first column to its last, and which way the window's edge lies.
  const zones = [
    [0, x0 - 3, -1],
    [x1 + 3, cols - 1, 1],
  ].filter(([a, b]) => b! - a! >= 1) as [number, number, number][];

  for (const [a, b, side] of zones) {
    // Stems, tallest at the edge, swaying a little more towards their tops.
    for (let x = a + 1 + Math.floor(random() * 3); x <= b; x += 6 + Math.floor(random() * 5)) {
      const edge = side < 0 ? 1 - (x - a) / (b - a) : (x - a) / (b - a);
      const height = Math.min(rows - 1, Math.round(6 + 18 * edge * (0.7 + random() * 0.3)));
      const phase = random() * 6.28;
      const leaves = Array.from({ length: 24 }, () => random());
      const most = height < 12 ? 1 : 2;
      for (let k = 0; k < height; k++) {
        const up = k / height;
        const sway = Math.round(most * Math.sin(t * 0.5 + phase) * 0.6 * up ** 1.4 + w * 0.4 * up);
        const sx = x + Math.max(-most, Math.min(most, sway));
        const y = rows - 1 - k;
        grid.put(sx, y, '|', 'leaf');
        const leaf = leaves[k % 24]!;
        if (leaf < 0.125) grid.put(sx - 1, y, '\\', 'fern');
        else if (leaf < 0.25) grid.put(sx + 1, y, '/', 'fern');
      }
    }
    // Two vines hanging from the top.
    for (let i = 0; i < 2; i++) {
      const x = a + Math.floor(random() * (b - a + 1));
      const length = 6 + Math.floor(random() * 9);
      const phase = random() * 6.28;
      for (let k = 0; k < length; k++) {
        const vx = x + Math.round((Math.sin(t * 0.6 + phase) * k) / 14);
        grid.put(vx, k, k % 2 ? ')' : '(', 'leaf');
        if (k % 4 === 3) grid.put(vx + 1, k, '%', 'fern');
      }
    }
    // Fireflies, drifting slowly and now and then glowing.
    for (let i = 0; i < 4; i++) {
      const fx = a + hash(i, side + 1) * (b - a) + 3 * Math.sin(t * 0.3 + i);
      const fy = hash(i, side + 2) * (rows - 4) + 2 * Math.sin(t * 0.23 + i * 1.7);
      if (fx >= a && fx <= b && grid.free(Math.round(fx), Math.round(fy)))
        grid.put(fx, fy, Math.sin(t * 1.6 + i * 2.3) > 0.8 ? '*' : '.', 'mango');
    }
  }
  speckle(grid, BAND_ROWS);
  return grid.lines();
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A drawing as HTML for a <pre>: a line per row, each tone's runs in a span of that tone's class. */
export function html(lines: Line[]): string {
  return lines.map((line) => line.map((run) => (run.tone ? `<span class="${run.tone}">${escape(run.t)}</span>` : escape(run.t))).join('')).join('\n');
}

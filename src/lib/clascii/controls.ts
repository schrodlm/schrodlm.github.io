// What clascii's page works out from its controls: the settings the library renders with, and how a
// slider's track is drawn. Pure functions, so they are tested without a browser or the library.
import type { Characters, Dither, GreyFilter, RgbFilter, Settings } from './library';

/** The characters choice for my own characters, typed in, darkest first. */
export const OWN = 'own';

/** The characters choice for braille raised by a dither. */
export const braille = (dither: Dither) => `braille:${dither}`;

/** Whether a characters choice is braille. */
export const isBraille = (choice: string) => choice.startsWith('braille:');

/** What the controls are set to. */
export interface Controls {
  /** A built-in table's name, {@link OWN}, or a {@link braille} choice. */
  characters: string;
  /** My own characters, darkest first, for {@link OWN}. */
  own: string;
  /** Degrees clockwise: 0, 90, 180 or 270. */
  rotate: number;
  flipVertical: boolean;
  flipHorizontal: boolean;
  /** Added to every grey, -128 to 128. */
  brightness: number;
  /** How far greys move from mid-grey, 1 leaving them as they are. */
  contrast: number;
  invert: boolean;
  colors: boolean;
}

/** A size in CSS pixels. */
export interface Size {
  width: number;
  height: number;
}

/** The characters setting for a characters choice. */
export function characters(choice: string, own: string): Characters {
  if (choice === OWN) return { chars: own };
  if (isBraille(choice)) return { braille: choice.slice('braille:'.length) as Dither };
  return choice;
}

/**
 * The settings for the controls, filling `area` with characters of `cell`'s size. A filter that would
 * change nothing is left out.
 */
export function settings(controls: Controls, cell: Size, area: Size): Settings {
  const rgbFilters: RgbFilter[] = [];
  if (controls.rotate) rgbFilters.push({ type: 'rotate', degrees: controls.rotate });
  if (controls.flipVertical) rgbFilters.push({ type: 'flip', direction: 'vertical' });
  if (controls.flipHorizontal) rgbFilters.push({ type: 'flip', direction: 'horizontal' });

  const greyFilters: GreyFilter[] = [];
  if (controls.brightness !== 0) greyFilters.push({ type: 'brightness', amount: controls.brightness });
  if (controls.contrast !== 1) greyFilters.push({ type: 'contrast', factor: controls.contrast });
  if (controls.invert) greyFilters.push({ type: 'invert' });

  return {
    maxColumns: Math.max(1, Math.floor(area.width / cell.width)),
    maxRows: Math.max(1, Math.floor(area.height / cell.height)),
    cellAspect: cell.width / cell.height,
    characters: characters(controls.characters, controls.own),
    rgbFilters,
    greyFilters,
    colors: controls.colors,
  };
}

/** How each slider shows its value, by the slider's id. */
const SHOWN: Record<string, (value: number) => string> = {
  'font-size': (v) => `${v}px`,
  shrink: (v) => String(v),
  brightness: (v) => (v > 0 ? `+${v}` : String(v)),
  contrast: (v) => `×${v.toFixed(2)}`,
};

/** The ids of the sliders. */
export const SLIDERS = Object.keys(SHOWN);

/** A slider's value as it shows beside its label. */
export function shown(id: string, value: number): string {
  return SHOWN[id]!(value);
}

/** How many characters a slider's track is wide. */
export const TRACK = 29;

/** A slider's track, `:------:------o------:------:`, with its knob `o` where `value` sits. */
export function track(value: number, min: number, max: number): string {
  const at = Math.round(((Math.min(max, Math.max(min, value)) - min) / (max - min)) * (TRACK - 1));
  return Array.from({ length: TRACK }, (_, i) => (i === at ? 'o' : i % 7 === 0 ? ':' : '-')).join('');
}

import { describe, expect, it } from 'vitest';
import { DESK_HEIGHT, DESK_WIDTH, STILL, deskFrame } from './lamplit-desk.ts';

const INK = [0x16, 0x0c, 0x08];
const WHITE = [0xfb, 0xf6, 0xea];

function pixel(frame: Uint8ClampedArray, x: number, y: number) {
  const i = (y * DESK_WIDTH + x) * 4;
  return [frame[i], frame[i + 1], frame[i + 2]];
}

/** The rows from y0 to y1 at column x that are inked. */
function inked(frame: Uint8ClampedArray, x: number, y0: number, y1: number) {
  let n = 0;
  for (let y = y0; y <= y1; y++) if (pixel(frame, x, y).join() === INK.join()) n++;
  return n;
}

describe('deskFrame', () => {
  it('draws the whole plate, the same every time', () => {
    expect(deskFrame(STILL)).toHaveLength(DESK_WIDTH * DESK_HEIGHT * 4);
    expect(deskFrame(STILL)).toEqual(deskFrame(STILL));
    expect(deskFrame(37)).toEqual(deskFrame(37));
  });

  it('moves from frame to frame, and the still is none of the first frames', () => {
    expect(deskFrame(1)).not.toEqual(deskFrame(0));
    expect(deskFrame(STILL)).not.toEqual(deskFrame(0));
  });

  it('leaves the margin outside the plate mark clear, so the page shows through', () => {
    const still = deskFrame(STILL);
    expect(still[3]).toBe(0);
    expect(still[(10 * DESK_WIDTH + 11) * 4 + 3]).toBe(0);
  });

  it('writes the caption in white across the top', () => {
    const still = deskFrame(STILL);
    let white = 0;
    for (let y = 12; y < 50; y++) for (let x = 0; x < DESK_WIDTH; x++) if (pixel(still, x, y).join() === WHITE.join()) white++;
    expect(white).toBeGreaterThan(200);
  });

  // The first line runs from y 163 up the picture along column 205: from my seat, left to right.
  it('writes a line from its start onwards, the way I sit to it', () => {
    const halfway = deskFrame(50);
    expect(inked(halfway, 205, 150, 163)).toBeGreaterThan(0);
    expect(inked(halfway, 205, 134, 149)).toBe(0);
    const written = deskFrame(150);
    expect(inked(written, 205, 134, 149)).toBeGreaterThan(0);
  });
});

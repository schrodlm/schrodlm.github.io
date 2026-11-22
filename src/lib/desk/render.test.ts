import { describe, expect, test } from 'vitest';
import { model, PARTS } from './model';
import { partAt, render, REST, START, VIEWS, type Frame } from './render';

const shown = (frame: Frame, key: string) => frame.ids.includes(model.by[key]!.i);
const centre = (frame: Frame, key: string) => {
  const [x0, y0, x1, y1] = frame.boxes[key]!;
  return [(x0 + x1) / 2, (y0 + y1) / 2] as const;
};

describe('the desk plate', () => {
  test('is drawn at its view’s size', () => {
    for (const view of Object.values(VIEWS)) {
      const frame = render(REST, view);
      expect([frame.w, frame.h]).toEqual([view.w, view.h]);
      expect(frame.pixels.length).toBe(view.w * view.h * 4);
    }
  });

  test('shows every listed part at rest, except the CPU under its pump', () => {
    const frame = render(REST);
    const missing = PARTS.filter(({ key }) => !frame.boxes[key]).map(({ key }) => key);
    expect(missing).toEqual(['cpu']);
  });

  test('shows the CPU once the pump is slid off it', () => {
    expect(render({ ...REST, sel: 'pump', outs: { pump: 1 } }).boxes.cpu).toBeDefined();
  });

  test('has the side panel on while the tower turns in, and gone at rest', () => {
    expect(shown(render(START), 'panel')).toBe(true);
    expect(shown(render(REST), 'panel')).toBe(false);
  });

  test('lights a hovered part in its colour', () => {
    const rest = render(REST), lit = render({ ...REST, hover: 'gpu' });
    expect(lit.pixels).not.toEqual(rest.pixels);
    expect(lit.boxes.gpu).toEqual(rest.boxes.gpu);
  });

  test('slides a clicked part out of the open side of the case', () => {
    const rest = render(REST), out = render({ ...REST, sel: 'gpu', outs: { gpu: 1 } });
    expect(centre(out, 'gpu')[0]).toBeLessThan(centre(rest, 'gpu')[0]);
  });

  test('moves the parts apart when exploded', () => {
    const rest = render(REST), apart = render({ ...REST, exp: 1 });
    for (const key of ['front', 'radiator', 'psu', 'gpu']) expect(centre(apart, key)).not.toEqual(centre(rest, key));
  });

  test('turns with a drag', () => {
    expect(centre(render({ ...REST, dyaw: 0.3 }), 'laptop')).not.toEqual(centre(render(REST), 'laptop'));
  });
});

describe('picking', () => {
  const frame = render(REST);

  test('names the part at a cell', () => {
    const [x, y] = centre(frame, 'psu');
    expect(partAt(frame, Math.round(x), Math.round(y))).toBe('psu');
  });

  test('names nothing on the paper, the desk top or off the plate', () => {
    expect(partAt(frame, 1, 1)).toBeNull();
    const desk = frame.ids.indexOf(model.by.desk!.i);
    expect(partAt(frame, desk % frame.w, Math.floor(desk / frame.w))).toBeNull();
    expect(partAt(frame, -1, 0)).toBeNull();
    expect(partAt(frame, frame.w, 0)).toBeNull();
  });
});

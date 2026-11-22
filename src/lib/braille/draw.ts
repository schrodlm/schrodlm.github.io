import type { DotCanvas } from './canvas';

// Drawing primitives on a dot canvas. Coordinates are in dots and may be fractional; every dot
// lands on the nearest whole one.

export type Point = readonly [x: number, y: number];

/** What a primitive draws with: a CSS colour and the weight its dots claim (1 if left out). */
export interface Ink {
  colour: string;
  weight?: number;
}

const put = (canvas: DotCanvas, x: number, y: number, ink: Ink) =>
  canvas.put(x, y, ink.colour, ink.weight);

/** A straight line, unbroken. */
export function line(canvas: DotCanvas, from: Point, to: Point, ink: Ink): void {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
  for (let i = 0; i <= n; i++) put(canvas, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, ink);
}

/** The point a share `s` (0 to 1) of the way along a quadratic Bézier curve. */
export const bezier = (from: Point, control: Point, to: Point, s: number): Point => {
  const a = (1 - s) * (1 - s);
  const b = 2 * (1 - s) * s;
  const e = s * s;
  return [a * from[0] + b * control[0] + e * to[0], a * from[1] + b * control[1] + e * to[1]];
};

const span = (from: Point, control: Point, to: Point) =>
  Math.hypot(control[0] - from[0], control[1] - from[1]) + Math.hypot(to[0] - control[0], to[1] - control[1]);

/** A quadratic Bézier curve from `from` to `to`, pulled towards `control`, unbroken. */
export function curve(canvas: DotCanvas, from: Point, control: Point, to: Point, ink: Ink): void {
  const n = Math.ceil(span(from, control, to) * 2) + 1;
  for (let i = 0; i <= n; i++) {
    const [x, y] = bezier(from, control, to, i / n);
    put(canvas, x, y, ink);
  }
}

/** A filled circle. */
export function disc(canvas: DotCanvas, centre: Point, radius: number, ink: Ink): void {
  const [cx, cy] = centre;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      // The small allowance keeps dots lying a hair outside the radius, which a fractional centre
      // or radius would otherwise nick out of the rim.
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius + 0.3) put(canvas, x, y, ink);
    }
  }
}

/** A circle's outline. */
export function ring(canvas: DotCanvas, centre: Point, radius: number, ink: Ink): void {
  const [cx, cy] = centre;
  const n = Math.max(1, Math.ceil(radius * 9));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    put(canvas, cx + radius * Math.cos(a), cy + radius * Math.sin(a), ink);
  }
}

/** A filled ellipse with semi-axes `rx` and `ry`, turned clockwise by `angle` radians. */
export function oval(
  canvas: DotCanvas,
  centre: Point,
  rx: number,
  ry: number,
  angle: number,
  ink: Ink,
): void {
  const [cx, cy] = centre;
  const reach = Math.max(rx, ry) + 1;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let y = Math.floor(cy - reach); y <= Math.ceil(cy + reach); y++) {
    for (let x = Math.floor(cx - reach); x <= Math.ceil(cx + reach); x++) {
      const u = (x - cx) * cos + (y - cy) * sin;
      const v = -(x - cx) * sin + (y - cy) * cos;
      if ((u / rx) ** 2 + (v / ry) ** 2 <= 1.08) put(canvas, x, y, ink);
    }
  }
}

/**
 * A tapered blade along a quadratic curve: a point at the foot, widest a third of the way along,
 * a point at the tip. `width` is the blade's widest, in dots.
 */
export function blade(
  canvas: DotCanvas,
  from: Point,
  control: Point,
  to: Point,
  width: number,
  ink: Ink,
): void {
  const n = Math.ceil(span(from, control, to) * 3) + 2;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const [x, y] = bezier(from, control, to, s);
    const tx = 2 * (1 - s) * (control[0] - from[0]) + 2 * s * (to[0] - control[0]);
    const ty = 2 * (1 - s) * (control[1] - from[1]) + 2 * s * (to[1] - control[1]);
    const tl = Math.hypot(tx, ty) || 1;
    // √s·(1 − s) peaks at s = 1/3 with 0.385; dividing by it makes `width` the widest.
    const half = (width * Math.sqrt(s) * (1 - s)) / 0.385 / 2;
    for (let q = -half; q <= half + 0.01; q += 0.5) put(canvas, x - (ty / tl) * q, y + (tx / tl) * q, ink);
  }
}

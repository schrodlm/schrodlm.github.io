// The desk on the About page, brought to life: it turns into view, can be dragged, names a part on
// hover, slides a part out with its card on click, and explodes. Everything it drives is already in
// the page (components/Desk.astro), drawn and written at build time, so without this script the
// page still shows the resting frame, the parts list and the links. It draws a frame only while
// something moves; with reduced motion every action shows its end state straight away.
import { model, PANEL, PARTS } from './model.ts';
import { partAt, render, REST, START, VIEWS, type DeskState, type Frame } from './render.ts';

interface Tween {
  from: number;
  to: number;
  t0: number;
  dur: number;
}

const name = (key: string) => (key === 'panel' ? PANEL : PARTS.find((p) => p.key === key)!.name);

export function mount(root: HTMLElement) {
  const q = <E extends Element>(sel: string) => root.querySelector<E>(sel)!;
  const stage = q<HTMLElement>('.stage'), canvas = q<HTMLCanvasElement>('canvas'), caption = q<HTMLElement>('.caption');
  const card = q<HTMLElement>('.card'), status = q<HTMLElement>('.status'), explode = q<HTMLButtonElement>('.explode');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // The phone's view follows the same media query as the narrow resting frame in the markup.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), narrow = matchMedia(q<HTMLSourceElement>('source').media);

  // The parts list's entries become buttons that do what clicking the part does.
  const items = [...root.querySelectorAll<HTMLElement>('.parts [data-part]')].map((entry) => {
    const button = document.createElement('button');
    // Its attributes too, so it keeps its part, its colour and the component's scoped styles.
    for (const { name, value } of entry.attributes) button.setAttribute(name, value);
    button.type = 'button';
    button.setAttribute('aria-controls', card.id);
    button.setAttribute('aria-expanded', 'false');
    button.append(...entry.childNodes);
    entry.replaceWith(button);
    return button;
  });

  let st: DeskState = reduce.matches ? { ...REST } : { ...START, outs: {} };
  let frame: Frame | null = null, queued = false, exploded = false;
  const tweens = new Map<string, Tween>();

  const get = (k: string) => (k.startsWith('out:') ? st.outs[k.slice(4)] ?? 0 : st[k as 'turn' | 'lift' | 'exp']);
  const set = (k: string, v: number) => {
    if (k.startsWith('out:')) st = { ...st, outs: { ...st.outs, [k.slice(4)]: v } };
    else st = { ...st, [k]: v };
  };
  const tween = (k: string, to: number, dur: number, delay = 0) => {
    if (reduce.matches) set(k, to);
    else tweens.set(k, { from: get(k), to, t0: performance.now() + delay, dur });
    draw();
  };

  function draw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(step);
  }

  function step(now: number) {
    queued = false;
    for (const [k, t] of tweens) {
      const p = Math.max(0, Math.min(1, (now - t.t0) / t.dur));
      set(k, t.from + (t.to - t.from) * p);
      if (p >= 1) tweens.delete(k);
    }
    const view = narrow.matches ? VIEWS.narrow : VIEWS.wide;
    frame = render(st, view);
    if (canvas.width !== view.w || canvas.height !== view.h) { canvas.width = view.w; canvas.height = view.h; }
    ctx!.putImageData(new ImageData(frame.pixels, view.w, view.h), 0, 0);
    canvas.hidden = false;
    show(frame);
    if (tweens.size) draw();
  }

  // The caption over the lit part, the card of the one slid out, and which entry is which.
  function show(frame: Frame) {
    const key = st.hover ?? st.sel, box = key ? frame.boxes[key] : undefined;
    caption.hidden = !box;
    if (key && box) {
      const cx = (box[0] + box[2]) / 2 / frame.w * 100, top = box[1] / frame.h * 100, below = top < 14;
      caption.textContent = name(key);
      caption.style.setProperty('--part', `var(--${model.by[key]!.ink})`);
      caption.style.left = `${Math.max(8, Math.min(92, cx))}%`;
      caption.style.top = `${below ? (box[3] + 2) / frame.h * 100 : top}%`;
      caption.classList.toggle('below', below);
    }
    for (const item of items) {
      const key = item.dataset.part;
      item.classList.toggle('lit', key === st.hover || key === st.sel);
      item.setAttribute('aria-expanded', String(key === st.sel));
    }
  }

  function open(key: string | null) {
    const n = PARTS.findIndex((p) => p.key === key), part = PARTS[n];
    card.hidden = !part;
    // The card appears and fills at once, which a live region on it may not announce; this one stays.
    status.textContent = part ? `${part.name} slid out: ${part.model}, ${part.spec}.` : '';
    if (!part) return;
    card.style.setProperty('--part', `var(--${model.by[part.key]!.ink})`);
    q<HTMLElement>('.card-fig').textContent = `Fig. ${n + 1} · ${part.name}`;
    q<HTMLElement>('.card-model').textContent = part.model;
    q<HTMLElement>('.card-spec').textContent = part.spec;
    const line = q<HTMLElement>('.card-line');
    line.textContent = part.line ?? '';
    line.hidden = !part.line;
  }

  /** Clicking a part slides it out and opens its card, or puts it back; the side panel lifts away. */
  function pick(key: string | null) {
    if (!key) return;
    if (key === 'panel') { tween('lift', 1, 1400); return; }
    const sel = st.sel;
    if (sel) tween(`out:${sel}`, 0, 900);
    st = { ...st, sel: sel === key ? null : key };
    if (st.sel) tween(`out:${key}`, 1, 1100);
    open(st.sel);
    draw();
  }

  // A part is lit by the pointer over it or by keyboard focus on its entry, the pointer first, so
  // one leaving doesn't put out the other.
  let pointed: string | null = null, focused: string | null = null;
  function hover() {
    const key = pointed ?? focused;
    if (key === st.hover) return;
    st = { ...st, hover: key };
    draw();
  }
  const point = (key: string | null) => { pointed = key; hover(); };
  const focus = (key: string | null) => { focused = key; hover(); };

  const cellAt = (e: PointerEvent) => {
    if (!frame) return null;
    const r = canvas.getBoundingClientRect();
    return partAt(frame, Math.floor((e.clientX - r.left) / r.width * frame.w), Math.floor((e.clientY - r.top) / r.height * frame.h));
  };

  // Dragging turns the desk, within limits; a press that doesn't drag is a click.
  let drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, yaw: st.dyaw, pitch: st.dpitch, moved: false };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved) {
        st = { ...st, dyaw: clamp(drag.yaw - dx * 0.0016, -0.32, 0.32), dpitch: clamp(drag.pitch + dy * 0.001, -0.12, 0.14) };
        draw();
        return;
      }
    }
    point(cellAt(e));
  });
  stage.addEventListener('pointerup', (e) => {
    const was = drag;
    drag = null;
    if (was && !was.moved) pick(cellAt(e));
  });
  stage.addEventListener('lostpointercapture', () => { drag = null; });
  stage.addEventListener('pointerleave', () => { if (!drag) point(null); });

  for (const item of items) {
    const key = item.dataset.part!;
    item.addEventListener('pointerenter', () => point(key));
    item.addEventListener('pointerleave', () => point(null));
    item.addEventListener('focus', () => focus(key));
    item.addEventListener('blur', () => focus(null));
    item.addEventListener('click', () => pick(key));
  }
  // Putting a part back hides the card, and with it the focused button; focus goes to its entry.
  q<HTMLButtonElement>('.card-close').addEventListener('click', () => {
    const sel = st.sel;
    pick(sel);
    items.find((item) => item.dataset.part === sel)?.focus();
  });
  explode.addEventListener('click', () => {
    exploded = !exploded;
    explode.textContent = exploded ? '[assemble]' : '[explode]';
    if (exploded && st.lift < 1) tween('lift', 1, 900);
    tween('exp', exploded ? 1 : 0, 1600);
  });
  narrow.addEventListener('change', draw);

  for (const el of root.querySelectorAll<HTMLElement>('[data-live]')) el.hidden = false;
  // On load the tower turns into view, then its side panel lifts away.
  tween('turn', 1, 2400, 300);
  tween('lift', 1, 1600, 2900);
}

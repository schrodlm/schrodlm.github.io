// Runs clascii on its showcase (src/pages/showcase/clascii/index.astro): loads the library, turns
// the chosen picture into characters with the settings the controls make, and keeps the jungle
// around the pond alive. Every picture stays in the browser: a file is read where it is, the camera
// goes straight into a <video>, and nothing is sent anywhere.
//
// It follows clascii's own demo, with every one of its controls, in the page's design: a change
// drops into the pond and the new art spreads from where it fell, unless the reader prefers reduced
// motion or the picture is moving.
import { braille, isBraille, OWN, settings, shown, SLIDERS, track, type Controls, type Size } from '../lib/clascii/controls';
import { drawBand, drawMargins, html, WIDTH } from '../lib/clascii/jungle';
import { load, type Art, type ColoredArt, type Pixels } from '../lib/clascii/library';
import { compose, farthest, NEW, OLD, spread, WATER, type Drop } from '../lib/clascii/pond';
import { TICK_MS } from '../lib/life/clock';

const get = <E extends Element = HTMLElement>(name: string) => document.querySelector<E>(`[${name}]`)!;
const input = (id: string) => document.getElementById(id) as HTMLInputElement;

const art = get<HTMLPreElement>('data-art');
const water = get('data-water');
const colours = get<HTMLCanvasElement>('data-colours');
const status = get('data-status');
const still = matchMedia('(prefers-reduced-motion: reduce)');
const css = getComputedStyle(document.documentElement);
const tone = (name: string) => css.getPropertyValue(`--night-${name}`).trim();

// ---- Measuring -----------------------------------------------------------------------------------

const ruler = document.createElement('span');
ruler.setAttribute('aria-hidden', 'true');
ruler.style.cssText = 'position: absolute; visibility: hidden; white-space: pre;';

/** A character's cell in `element`'s font: its advance and its line's height. */
function measure(ch: string, element: HTMLElement): Size {
  ruler.style.font = getComputedStyle(element).font;
  ruler.textContent = ch.repeat(100);
  element.after(ruler);
  const { width, height } = ruler.getBoundingClientRect();
  ruler.remove();
  return { width: width / 100, height };
}

// ---- The jungle ----------------------------------------------------------------------------------

const band = get('data-band');
const margins = get('data-margins');
const form = get<HTMLFormElement>('data-controls');
const app = form.closest<HTMLElement>('.app')!;

/** The margins' size in characters, and the columns the page takes in them. */
function marginsGrid() {
  const box = margins.parentElement!;
  const cell = measure('M', margins);
  const cols = Math.ceil(box.clientWidth / cell.width) + 1;
  const left = (box.clientWidth - cols * cell.width) / 2;
  const page = app.getBoundingClientRect();
  return {
    cols,
    rows: Math.max(1, Math.floor(box.clientHeight / cell.height)),
    x0: Math.floor((page.left - left) / cell.width),
    x1: Math.ceil((page.right - left) / cell.width),
  };
}

let grid = marginsGrid();
let tick = 0;

function drawJungle() {
  const next = { band: html(drawBand(WIDTH, tick)), margins: html(drawMargins(grid, tick)) };
  if (band.innerHTML !== next.band) band.innerHTML = next.band;
  if (margins.innerHTML !== next.margins) margins.innerHTML = next.margins;
}

const start = performance.now();
let timer: ReturnType<typeof setTimeout> | undefined;
// The garden's clock: four ticks a second, while the tab is shown and motion is welcome.
function frame() {
  const elapsed = performance.now() - start;
  tick = Math.floor(elapsed / TICK_MS);
  drawJungle();
  timer = setTimeout(frame, (tick + 1.5) * TICK_MS - elapsed);
}
function keepTime() {
  const run = !document.hidden && !still.matches;
  if (run && !timer) frame();
  if (!run && timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  if (still.matches && tick) {
    tick = 0;
    drawJungle();
  }
}

// ---- The controls --------------------------------------------------------------------------------

function controls(): Controls {
  const chosen = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';
  return {
    characters: chosen('characters') || 'default',
    own: input('own').value,
    rotate: +chosen('rotate'),
    flipVertical: input('flip-vertical').checked,
    flipHorizontal: input('flip-horizontal').checked,
    brightness: +input('brightness').value,
    contrast: +input('contrast').value,
    invert: input('invert').checked,
    colors: input('colours').checked,
  };
}

/** Shows each slider's value and moves its knob. */
function showSliders() {
  for (const id of SLIDERS) {
    const slider = input(id);
    get(`data-shown="${id}"`).textContent = shown(id, +slider.value);
    get(`data-track="${id}"`).textContent = track(+slider.value, +slider.min, +slider.max);
  }
  art.style.fontSize = `${input('font-size').value}px`;
}

/** A radio button of the characters choice, bracketed like the rest, named `name` if its text is not enough. */
function choice(value: string, text: string, name?: string) {
  const label = document.createElement('label');
  label.className = 'choice';
  const radio = Object.assign(document.createElement('input'), { type: 'radio', name: 'characters', value, checked: value === 'default' });
  if (name) radio.setAttribute('aria-label', name);
  label.append(radio, Object.assign(document.createElement('span'), { textContent: text }));
  return label;
}

// ---- The picture ---------------------------------------------------------------------------------

type Source = 'plasma' | 'image' | 'video' | 'camera';

const video = document.createElement('video');
video.muted = true;
video.loop = true;
video.playsInline = true;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d', { willReadFrequently: true })!;

let source: Source = 'plasma';
let picture: Pixels | ImageBitmap | undefined;
let stream: MediaStream | undefined;
let videoUrl: string | undefined;
let running = false;

/** Draws a picture or a video frame onto a canvas, shrunk to `px / column` pixels a column, and reads it back. */
function grab(from: CanvasImageSource, width: number, height: number, columns: number): Pixels {
  const scale = Math.min(1, (columns * +input('shrink').value) / width);
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  context.drawImage(from, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function pixels(columns: number): Pixels {
  if (picture && 'data' in picture) return picture;
  if (picture) return grab(picture, picture.width, picture.height, columns);
  return grab(video, video.videoWidth, video.videoHeight, columns);
}

// ---- Drawing -------------------------------------------------------------------------------------

/** The art on show: the last render, and what the pond shows of it while it spreads. */
let onShow: { art: Art; lines: string[] } | undefined;
let spreading: number | undefined;
/** The art's character cell, measured in its font at its size for each render, braille on its own. */
let size: Size = { width: 1, height: 1 };

/** Shows `lines` of `next`, with `cells` saying which come from `old` or are water while it spreads. */
function show(next: Art, lines: string[], old?: Art, cells?: Uint8Array) {
  art.textContent = lines.join('\n');
  const left = Math.floor((water.clientWidth - next.columns * size.width) / 2);
  const top = Math.floor((water.clientHeight - next.rows * size.height) / 2);
  art.style.left = colours.style.left = `${left}px`;
  art.style.top = colours.style.top = `${top}px`;
  const coloured = Boolean(next.colors);
  art.classList.toggle('coloured', coloured);
  colours.hidden = !coloured;
  if (coloured) paint(next as ColoredArt, lines, old, cells);
}

/**
 * Paints every character in its own colour on a canvas laid over the art, whose text is made
 * transparent so it keeps the layout. While the new art spreads, the old keeps its colours and the
 * ring is water.
 */
function paint(next: ColoredArt, lines: string[], old?: Art, cells?: Uint8Array) {
  const scale = devicePixelRatio || 1;
  const width = next.columns * size.width, height = next.rows * size.height;
  colours.style.width = `${width}px`;
  colours.style.height = `${height}px`;
  colours.width = Math.round(width * scale);
  colours.height = Math.round(height * scale);
  const pen = colours.getContext('2d')!;
  const fontSize = parseFloat(art.style.fontSize);
  pen.scale(scale, scale);
  pen.font = `${fontSize}px ${getComputedStyle(art).fontFamily}`;
  pen.textBaseline = 'top';
  const offset = (size.height - fontSize) / 2;
  const sameOld = old?.colors && old.columns === next.columns && old.rows === next.rows ? old.colors : undefined;
  let style = '';
  lines.forEach((line, row) => {
    for (let column = 0; column < line.length; column++) {
      const ch = line[column]!;
      if (ch === ' ' || ch === '⠀') continue;
      const i = row * next.columns + column;
      const kind = cells ? cells[i] : NEW;
      // Old art drawn without colours keeps the ink it was shown in.
      const from = kind === OLD ? sameOld : next.colors;
      const colour = kind === WATER ? tone('water') : from ? `rgb(${from[i * 4]} ${from[i * 4 + 1]} ${from[i * 4 + 2]})` : tone('ink');
      if (colour !== style) pen.fillStyle = style = colour;
      pen.fillText(ch, column * size.width, row * size.height + offset);
    }
  });
}

/** Where a drop from `element` falls in the art: the cell nearest it. */
function dropFrom(element: Element | undefined, next: Art): Drop {
  if (!element) return { x: (next.columns - 1) / 2, y: (next.rows - 1) / 2 };
  const from = element.getBoundingClientRect(), into = art.getBoundingClientRect();
  const clamp = (v: number, most: number) => Math.max(0, Math.min(most, Math.floor(v)));
  return {
    x: clamp((from.left + from.width / 2 - into.left) / size.width, next.columns - 1),
    y: clamp((from.top + from.height / 2 - into.top) / size.height, next.rows - 1),
  };
}

const SPREAD_MS = 900;

/** Lets `next` spread over the art on show from a drop that fell from `element`. */
function spreadFrom(next: Art, element: Element | undefined) {
  const old = onShow;
  const drop = dropFrom(element, next);
  const end = farthest(drop, next.columns, next.rows);
  const begun = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - begun) / SPREAD_MS);
    const cells = spread(drop, end * (1 - (1 - k) ** 2), next.columns, next.rows);
    const lines = compose(next.lines, old?.lines, cells);
    show(next, lines, old?.art, cells);
    onShow = { art: next, lines };
    spreading = k < 1 ? requestAnimationFrame(step) : undefined;
  };
  spreading = requestAnimationFrame(step);
}

// The last frames' timings in milliseconds: the stats average the latest 30, the graph shows them all.
const FRAMES = 120;
const frames: { grab: number; render: number; show: number }[] = [];
let lastFrame = performance.now();
let fps = 0;

let clascii: Awaited<ReturnType<typeof load>> | undefined;

/**
 * Renders the picture with the controls' settings and shows it. A change made with `element`
 * drops into the pond from it; with no element it is a frame of a moving picture, or a new window.
 */
function draw(element?: Element, drop = false) {
  size = measure(isBraille(controls().characters) ? '⣿' : 'M', art);
  const options = settings(controls(), size, { width: water.clientWidth, height: water.clientHeight });
  try {
    const t0 = performance.now();
    const shrunk = pixels(options.maxColumns!);
    const t1 = performance.now();
    const result = clascii!.render(shrunk, options);
    const t2 = performance.now();
    if (spreading) cancelAnimationFrame(spreading);
    spreading = undefined;
    if (drop && !running && !still.matches) spreadFrom(result, element);
    else {
      show(result, result.lines);
      onShow = { art: result, lines: result.lines };
    }
    const t3 = performance.now();
    frames.push({ grab: t1 - t0, render: t2 - t1, show: t3 - t2 });
    if (frames.length > FRAMES) frames.shift();
    if (running) fps = 0.9 * fps + 0.1 * (1000 / (t3 - lastFrame));
    lastFrame = t3;
    const name = source === 'plasma' ? `plasma, seed ${input('seed').value}` : `your ${source}`;
    status.classList.remove('error');
    status.textContent = `${name} · ${result.columns} × ${result.rows}`;
    const label = `ASCII art of ${name}, ${result.columns} by ${result.rows} characters`;
    if (art.getAttribute('aria-label') !== label) art.setAttribute('aria-label', label);
    showStats(shrunk, result, options.colors ?? false);
  } catch (error) {
    fail(error);
  }
}

/** Says what went wrong in the status line, and to a screen reader, which the status line is too busy for. */
function fail(error: unknown) {
  status.classList.add('error');
  status.textContent = error instanceof Error ? error.message : String(error);
  get('data-alert').textContent = status.textContent;
}

// ---- Stats ---------------------------------------------------------------------------------------

const average = (list: typeof frames, key: 'grab' | 'render' | 'show') => list.reduce((sum, f) => sum + f[key], 0) / Math.max(1, list.length);
const ms = (value: number) => `${value.toFixed(1)} ms`;

function showStats(shrunk: Pixels, result: Art, coloured: boolean) {
  const recent = frames.slice(-30);
  const [grabbing, rendering, showing] = (['grab', 'render', 'show'] as const).map((key) => average(recent, key)) as [number, number, number];
  const total = grabbing + rendering + showing;
  const worst = Math.max(...frames.map((f) => f.grab + f.render + f.show));
  const [width, height] = picture ? [picture.width, picture.height] : [video.videoWidth, video.videoHeight];
  const characters = result.columns * result.rows;
  const rows: [string, string][] = [
    ['frame rate', running ? `${fps.toFixed(0)} fps` : 'still'],
    ['frame', ms(total)],
    ['worst frame', ms(worst)],
    ['of 60 fps budget', `${Math.round((total / (1000 / 60)) * 100)} %`],
    ['grab', ms(grabbing)],
    ['render', ms(rendering)],
    [coloured ? 'paint' : 'show', ms(showing)],
    ['picture', `${width}×${height}`],
    ['shrunk to', `${shrunk.width}×${shrunk.height}`],
    ['art', `${result.columns}×${result.rows}`],
    ['characters', characters.toLocaleString('en')],
    ['px per character', ((shrunk.width * shrunk.height) / characters).toFixed(1)],
  ];
  get('data-stats').replaceChildren(
    ...rows.map(([name, value]) => {
      const row = document.createElement('div');
      row.append(Object.assign(document.createElement('dt'), { textContent: name }), Object.assign(document.createElement('dd'), { textContent: value }));
      return row;
    }),
  );
  drawGraph();
}

/** The last frames as stacked bars, grab at the bottom, under a dashed line at a 60 fps frame. */
function drawGraph() {
  const graph = get<HTMLCanvasElement>('data-graph');
  const scale = devicePixelRatio || 1;
  graph.width = graph.clientWidth * scale;
  graph.height = graph.clientHeight * scale;
  const pen = graph.getContext('2d')!;
  pen.scale(scale, scale);
  const width = graph.clientWidth, height = graph.clientHeight;
  const budget = 1000 / 60;
  const top = Math.max(budget * 1.5, ...frames.map((f) => f.grab + f.render + f.show));
  const bar = width / FRAMES;
  frames.forEach((f, i) => {
    let y = height;
    for (const [key, colour] of [['grab', 'water'], ['render', 'accent'], ['show', 'mango']] as const) {
      const h = (f[key] / top) * height;
      pen.fillStyle = tone(colour);
      pen.fillRect(i * bar, y - h, Math.max(1, bar - 0.5), h);
      y -= h;
    }
  });
  pen.strokeStyle = tone('muted');
  pen.setLineDash([3, 3]);
  const line = height - (budget / top) * height;
  pen.beginPath();
  pen.moveTo(0, line);
  pen.lineTo(width, line);
  pen.stroke();
}

// ---- Sources -------------------------------------------------------------------------------------

// Each switch of the picture starts a new turn; a frame loop, a camera or a video that answers for
// an older turn has been left behind and stops.
let turn = 0;

function loop(mine: number) {
  if (mine !== turn) return;
  if (video.readyState >= 2) draw();
  requestAnimationFrame(() => loop(mine));
}

function stopMoving() {
  turn++;
  running = false;
  video.pause();
  stream?.getTracks().forEach((t) => t.stop());
  stream = undefined;
  video.srcObject = null;
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = undefined;
  video.removeAttribute('src');
}

function choose(name: Source) {
  source = name;
  document.querySelectorAll<HTMLElement>('[data-source]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.source === name)));
  get('data-seed-row').hidden = name !== 'plasma';
  frames.length = 0;
}

function showPlasma(element?: Element) {
  let next: Pixels;
  try {
    next = clascii!.plasma(Math.trunc(+input('seed').value));
  } catch (error) {
    return fail(error);
  }
  stopMoving();
  choose('plasma');
  picture = next;
  draw(element, true);
}

async function showImage(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fail(`${file.name} could not be read as an image`);
  }
  stopMoving();
  choose('image');
  picture = bitmap;
  draw(water, true);
}

function startMoving(name: Source) {
  choose(name);
  picture = undefined;
  running = true;
  input('flip-horizontal').checked = name === 'camera'; // a camera feels natural mirrored
  const mine = turn;
  video.play().then(
    () => loop(mine),
    (error: unknown) => mine === turn && fail(error),
  );
}

async function showCamera() {
  const asked = ++turn;
  let camera: MediaStream;
  try {
    camera = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
  } catch (error) {
    if (asked === turn) fail(`No camera: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  // Another picture was chosen while the browser asked: the camera goes off again at once.
  if (asked !== turn) return camera.getTracks().forEach((t) => t.stop());
  stopMoving();
  stream = camera;
  video.srcObject = stream;
  startMoving('camera');
}

function showVideo(file: File) {
  stopMoving();
  videoUrl = URL.createObjectURL(file);
  video.src = videoUrl;
  startMoving('video');
}

function open(file: File | undefined) {
  if (!file || !clascii) return;
  if (file.type.startsWith('image/')) showImage(file);
  else if (file.type.startsWith('video/')) showVideo(file);
  else fail(`${file.name} is not an image or a video`);
}

// ---- Output --------------------------------------------------------------------------------------

async function copy(button: HTMLElement) {
  if (!onShow) return;
  try {
    await navigator.clipboard.writeText(onShow.art.text);
    button.textContent = 'copied';
    setTimeout(() => (button.textContent = 'copy'), 1500);
  } catch (error) {
    fail(error);
  }
}

function save() {
  if (!onShow) return;
  const url = URL.createObjectURL(new Blob([onShow.art.text + '\n'], { type: 'text/plain' }));
  Object.assign(document.createElement('a'), { href: url, download: 'clascii.txt' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---- Wiring --------------------------------------------------------------------------------------

function wire(library: NonNullable<typeof clascii>) {
  for (const name of library.tables) get('data-tables').append(choice(name, name));
  get('data-tables').append(choice(OWN, 'your own'));
  for (const dither of library.dithers) get('data-dithers').append(choice(braille(dither), dither, `braille, ${dither}`));

  const imageFile = get<HTMLInputElement>('data-image-file');
  const videoFile = get<HTMLInputElement>('data-video-file');
  document.querySelectorAll<HTMLElement>('[data-source]').forEach((button) =>
    button.addEventListener('click', () => {
      const name = button.dataset.source as Source;
      if (name === 'plasma') showPlasma(button);
      if (name === 'image') imageFile.click();
      if (name === 'video') videoFile.click();
      if (name === 'camera') showCamera();
    }),
  );
  get('data-choose').addEventListener('click', () => imageFile.click());
  for (const file of [imageFile, videoFile])
    file.addEventListener('change', () => {
      open(file.files?.[0]);
      file.value = '';
    });
  input('seed').addEventListener('change', () => showPlasma(input('seed')));
  get('data-new-seed').addEventListener('click', (e) => {
    input('seed').value = String(Math.floor(Math.random() * 1e6));
    showPlasma(e.currentTarget as Element);
  });
  get('data-copy').addEventListener('click', (e) => copy(e.currentTarget as HTMLElement));
  get('data-save').addEventListener('click', save);

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', async (e) => {
    const control = e.target as HTMLInputElement;
    if (control.type === 'file' || control.id === 'seed') return;
    showSliders();
    const { characters } = controls();
    get('data-own-row').hidden = characters !== OWN;
    if (isBraille(characters)) await document.fonts.load(`10px "Garden Braille"`, '⣿');
    if (!running) draw(control.closest('label, .slider') ?? control, true);
  });

}

let resizing = 0;
addEventListener('resize', () => {
  cancelAnimationFrame(resizing);
  resizing = requestAnimationFrame(() => {
    grid = marginsGrid();
    drawJungle();
    if (!running && onShow) draw();
  });
});

// Drop or paste an image or a video anywhere.
let depth = 0;
document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  depth++;
  document.body.classList.add('dragging');
});
document.addEventListener('dragleave', () => {
  if (--depth === 0) document.body.classList.remove('dragging');
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  depth = 0;
  document.body.classList.remove('dragging');
  open(e.dataTransfer?.files[0]);
});
document.addEventListener('paste', (e) => open(e.clipboardData?.files[0]));

drawJungle();
keepTime();
document.addEventListener('visibilitychange', keepTime);
still.addEventListener('change', keepTime);

showSliders();
load(import.meta.env.BASE_URL).then(
  async (library) => {
    await document.fonts.ready;
    // Measured again in the page's own font, and caught up with any slider moved while it loaded.
    grid = marginsGrid();
    drawJungle();
    showSliders();
    clascii = library;
    wire(library);
    showPlasma();
  },
  (error: unknown) => fail(`clascii did not load: ${error instanceof Error ? error.message : String(error)}`),
);

// Brings the vine and the soil to life in the browser. The build draws each at tick 0, the resting
// frame; this redraws them four times a second from the same drawing code, on one clock that starts
// when the page opens. It only redraws what is on screen, stops while the tab is hidden, and does
// nothing at all for readers who prefer reduced motion.
import { markup, type Row } from '../lib/braille';
import { TICK_MS } from '../lib/life/clock';
import { drawSoil } from '../lib/life/soil';
import { drawVine, growVine } from '../lib/life/vine';

interface Art {
  rows: HTMLElement[];
  draw: (tick: number) => Row[];
  // What each row shows now, so a frame only touches the rows that changed.
  shown: string[];
}

function paint(art: Art, tick: number): void {
  art.draw(tick).forEach((row, i) => {
    const html = markup(row);
    if (html === art.shown[i]) return;
    art.rows[i]!.innerHTML = html;
    art.shown[i] = html;
  });
}

// A drawing on the page: the soil, or a vine grown from its seed.
function artOf(element: HTMLElement): Art {
  const rows = [...element.querySelector('.braille')!.children] as HTMLElement[];
  const shown = rows.map((row) => row.innerHTML);
  if (element.dataset.life === 'soil') return { rows, shown, draw: drawSoil };
  const plan = growVine(element.dataset.seed!);
  return { rows, shown, draw: (tick) => drawVine(plan, tick) };
}

const still = matchMedia('(prefers-reduced-motion: reduce)');
const start = performance.now();
const onScreen = new Set<Art>();
let timer: ReturnType<typeof setTimeout> | undefined;

// Draw the tick it is now, and wake again in the middle of the next one, so no tick is drawn twice
// or skipped however the timer jitters.
function frame(): void {
  const elapsed = performance.now() - start;
  const tick = Math.floor(elapsed / TICK_MS);
  for (const art of onScreen) paint(art, tick);
  timer = setTimeout(frame, (tick + 1.5) * TICK_MS - elapsed);
}

// Run the clock's redraws only while something alive is on screen, the tab is shown, and motion is
// welcome.
function keepTime(): void {
  const run = onScreen.size > 0 && !document.hidden && !still.matches;
  if (run && !timer) frame();
  if (!run && timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

const arts = new Map<Element, Art>([...document.querySelectorAll<HTMLElement>('[data-life]')].map((el) => [el, artOf(el)]));

const watcher = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const art = arts.get(entry.target)!;
    if (entry.isIntersecting) onScreen.add(art);
    else onScreen.delete(art);
  }
  keepTime();
});
for (const element of arts.keys()) watcher.observe(element);

document.addEventListener('visibilitychange', keepTime);
// A reader who asks for stillness mid-visit gets the resting frame back.
still.addEventListener('change', () => {
  if (still.matches) for (const art of arts.values()) paint(art, 0);
  keepTime();
});

import { expect, test, type Page } from '@playwright/test';
import { model } from '../../src/lib/desk/model';
import { render, REST, VIEWS } from '../../src/lib/desk/render';

test.use({ reducedMotion: 'reduce' });

/** Where a part shows on the live plate: the cell of it nearest its middle, in page pixels. */
async function where(page: Page, phone: boolean, key: string) {
  const view = phone ? VIEWS.narrow : VIEWS.wide, frame = render(REST, view), id = model.by[key]!.i;
  const [x0, y0, x1, y1] = frame.boxes[key]!, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  let best = [0, 0], dist = Infinity;
  frame.ids.forEach((part, i) => {
    const x = i % frame.w, y = Math.floor(i / frame.w), d = Math.hypot(x - mx, y - my);
    if (part === id && d < dist) [best, dist] = [[x, y], d];
  });
  const box = (await page.locator('.stage canvas').boundingBox())!;
  return { x: box.x + (best[0]! + 0.5) * box.width / view.w, y: box.y + (best[1]! + 0.5) * box.height / view.h };
}

test('with reduced motion the desk rests at once: the live plate is the resting frame', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('.stage canvas')).toBeVisible();
  const same = await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('.stage img')!, live = document.querySelector<HTMLCanvasElement>('.stage canvas')!;
    await img.decode();
    const still = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight });
    still.getContext('2d')!.drawImage(img, 0, 0);
    const a = still.getContext('2d')!.getImageData(0, 0, still.width, still.height).data;
    const b = live.getContext('2d')!.getImageData(0, 0, live.width, live.height).data;
    return a.length === b.length && a.every((v, i) => v === b[i]);
  });
  expect(same).toBe(true);
});

test('hovering a part names it, clicking it slides it out with its card, and the parts list does the same', async ({ page }, info) => {
  await page.goto('/about/');
  await expect(page.locator('.stage canvas')).toBeVisible();
  const gpu = await where(page, info.project.name === 'phone', 'gpu');
  const card = page.locator('#desk-card'), entry = page.getByRole('button', { name: /Graphics card/ });

  await page.mouse.move(gpu.x, gpu.y);
  await expect(page.locator('.caption')).toHaveText('Graphics card');
  await page.mouse.click(gpu.x, gpu.y);
  await expect(card).toBeVisible();
  await expect(card).toContainText('Fig. 9 · Graphics card');
  await expect(card).toContainText('MSI GeForce RTX 5070 Ti 16G Ventus 3X OC');
  await expect(entry).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.status')).toHaveText(/^Graphics card slid out/);
  await expect(page.locator('.desk')).toHaveScreenshot('desk-card.png');

  await card.getByRole('button', { name: '[put back]' }).click();
  await expect(card).toBeHidden();
  await expect(entry).toHaveAttribute('aria-expanded', 'false');
  await expect(entry).toBeFocused();

  await page.getByRole('button', { name: /CPU/ }).focus();
  await page.keyboard.press('Enter');
  await expect(card).toContainText('AMD Ryzen 7 9800X3D');

  await page.getByRole('button', { name: '[explode]' }).click();
  await expect(page.getByRole('button', { name: '[assemble]' })).toBeVisible();
});

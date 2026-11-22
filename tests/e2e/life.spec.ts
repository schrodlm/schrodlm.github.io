import { expect, test } from '@playwright/test';
import { VINE_HEIGHT, VINE_WIDTH } from '../../src/lib/life/vine';

test('the vine hangs beside the column, clear of the text, and hides on a phone', async ({ page }, testInfo) => {
  await page.goto('/_kit/vine/');
  await page.evaluate(() => document.fonts.ready);
  const vine = page.locator('[data-life="vine"] .braille');
  if (testInfo.project.name === 'desktop') {
    const column = (await page.locator('main').boundingBox())!;
    const box = (await vine.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(column.x + column.width);
    expect(box).toMatchObject({ y: 0, width: VINE_WIDTH * 8, height: VINE_HEIGHT * 16 });
    // It hangs into the margin but stops above the soil, however short the page.
    const side = (await page.locator('.side').boundingBox())!;
    expect(side.y + side.height).toBeLessThanOrEqual((await page.locator('footer').boundingBox())!.y);
  } else {
    await expect(vine).toBeHidden();
  }
  await expect(page).toHaveScreenshot('vine.png', { fullPage: true });
});

test('every page stands on the soil, as wide as the window and no wider', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const footer = page.locator('footer');
  const art = footer.locator('[data-life="soil"] .braille');
  await expect(art).toBeVisible();
  const width = page.viewportSize()!.width;
  expect((await footer.boundingBox())!.width).toBe(width);
  expect((await art.boundingBox())!.width).toBeGreaterThan(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  await expect(footer).toHaveScreenshot('footer.png');
});

test('a reader who prefers reduced motion sees the resting frame, and it stays', async ({ page }) => {
  await page.goto('/_kit/vine/');
  // The soil on screen, and on a desktop the vine beside it, as the motion test below has them move.
  await page.locator('[data-life="soil"]').scrollIntoViewIfNeeded();
  // What every drawing alive on the page shows, as text, to tell whether it has moved.
  const frames = () => page.locator('[data-life]').evaluateAll((art) => art.map((el) => el.textContent));
  const resting = await frames();
  await page.waitForTimeout(1500);
  expect(await frames()).toEqual(resting);
});

test.describe('with motion welcome', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the ants walk and, beside the text, the vine sways', async ({ page }, testInfo) => {
    await page.goto('/_kit/vine/');
    const alive = testInfo.project.name === 'desktop' ? ['vine', 'soil'] : ['soil'];
    for (const kind of alive) {
      const art = page.locator(`[data-life="${kind}"]`);
      await art.scrollIntoViewIfNeeded();
      const resting = await art.textContent();
      await expect.poll(() => art.textContent(), { timeout: 5000 }).not.toBe(resting);
    }
  });
});

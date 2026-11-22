import { expect, test } from '@playwright/test';

test('every plate shows each cell as 3 CSS pixels, pixelated', async ({ page }) => {
  await page.goto('/kit/plates/');
  const images = page.locator('.plate img');
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  for (const img of await images.all()) {
    const [natural, shown] = await img.evaluate((el: HTMLImageElement) => [
      [el.naturalWidth, el.naturalHeight],
      [el.clientWidth, el.clientHeight],
    ]);
    expect(shown).toEqual([natural[0]! * 3, natural[1]! * 3]);
    await expect(img).toHaveCSS('image-rendering', 'pixelated');
  }
  await expect(page).toHaveScreenshot('plates.png', { fullPage: true });
});

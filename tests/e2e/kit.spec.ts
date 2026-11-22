import { expect, test } from '@playwright/test';

test('the braille kit sets every cell 8 × 16 px and the stub at each form’s footprint', async ({ page }) => {
  await page.goto('/_kit/');
  await page.evaluate(() => document.fonts.ready);
  const box = (selector: string) => page.locator(selector).boundingBox();
  expect(await box('.braille.plant')).toMatchObject({ width: 15 * 8, height: 13 * 16 });
  expect(await box('.braille.head')).toMatchObject({ width: 8 * 8, height: 4 * 16 });
  expect(await box('.braille.mark-art')).toMatchObject({ width: 3 * 8, height: 16 });
  expect(await box('.braille.scaled')).toMatchObject({ width: 300, height: 13 * 40 });
  await expect(page).toHaveScreenshot('kit.png', { fullPage: true });
});

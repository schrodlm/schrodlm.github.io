import { expect, test } from '@playwright/test';

test('the herbarium hangs the card of every written post and note, each linking to its page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Herbarium' }).click();
  await expect(page).toHaveURL('/herbarium/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Herbarium schrodlmensis');
  const cards = page.locator('main .card');
  // Every sample post and note but the stub, which has no flower yet.
  await expect(cards).toHaveCount(11);
  await expect(cards.filter({ hasText: 'A seedling' })).toHaveCount(0);
  const note = cards.filter({ hasText: 'Vzorová replikace' });
  await expect(note.getByRole('link', { name: 'Vzorová replikace' })).toHaveAttribute(
    'href',
    '/notes/invented-systems/vzorova-replikace/',
  );
  await expect(cards.filter({ hasText: '“A sample post”' })).toContainText('planted 2024-03-14');

  // By Latin name, and specimens of one name by their numbers.
  const numbers = await cards.locator('.number').allTextContents();
  const seeds = numbers.map((text) => Number(/No\. (\d+)/.exec(text)![1]));
  expect(seeds).toEqual([...seeds].sort((a, b) => a - b));

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await expect(page).toHaveScreenshot('herbarium.png', { fullPage: true });
});

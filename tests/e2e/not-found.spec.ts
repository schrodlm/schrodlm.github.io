import { expect, test } from '@playwright/test';

test('an unknown address shows the 404 page in the shell', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing grows here');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page).toHaveScreenshot('not-found.png', { fullPage: true });
});

test('a long word or bare URL breaks inside the column on a phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'only a phone is narrow enough');
  await page.goto('/no-such-page/');
  // Put a long title and a bare URL into the column, as a note could have.
  await page.evaluate(() => {
    const h1 = document.querySelector('main h1')!;
    h1.textContent = 'Nejneobhospodařovávatelnějšími';
    const p = document.createElement('p');
    p.textContent = 'https://example.com/a/very/long/path/that/nobody/would/ever/type/by/hand/index.html';
    h1.after(p);
  });
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll('main h1, main p')]
      .filter((el) => el.scrollWidth > el.clientWidth)
      .map((el) => el.textContent),
  );
  expect(overflowing).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

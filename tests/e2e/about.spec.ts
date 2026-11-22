import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('the About page shows the words of its note and where to write to me', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(page.getByRole('link', { name: '[>about]' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Invented words for the About page.')).toBeVisible();
  await expect(page.getByText('still to come')).toHaveCount(0);
  for (const [name, href] of [
    ['matej.schrodl@gmail.com', 'mailto:matej.schrodl@gmail.com'],
    ['github.com/schrodlm', 'https://github.com/schrodlm'],
    ['linkedin.com/in/matej-schrodl354', 'https://www.linkedin.com/in/matej-schrodl354'],
  ] as const) {
    await expect(page.getByRole('link', { name })).toHaveAttribute('href', href);
  }
  await expect(page).toHaveScreenshot('about.png', { fullPage: true });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the desk shows its resting frame, each cell 3 CSS pixels, and its parts with their models', async ({ page }) => {
    await page.goto('/about/');
    const plate = page.getByRole('img', { name: /^A woodcut of my desk/ });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const [natural, shown] = await plate.evaluate((el: HTMLImageElement) => [
      [el.naturalWidth, el.naturalHeight],
      [el.clientWidth, el.clientHeight],
    ]);
    expect(shown).toEqual([natural[0]! * 3, natural[1]! * 3]);
    await expect(page.locator('.parts li')).toHaveCount(12);
    await expect(page.getByText('MSI GeForce RTX 5070 Ti 16G Ventus 3X OC')).toBeVisible();
    await expect(page.getByRole('button')).toHaveCount(0);
  });
});

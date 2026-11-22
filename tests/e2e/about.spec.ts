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

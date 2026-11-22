import { expect, test } from '@playwright/test';

test('the home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matěj Schrödl');
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

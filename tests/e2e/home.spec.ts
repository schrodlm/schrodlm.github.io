import { expect, test } from '@playwright/test';

test('the home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matěj Schrödl');
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('the shell links every section and serves its own fonts', async ({ page }) => {
  const fonts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.push(request.url());
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const section of ['notes', 'posts', 'projects', 'courses', 'about', 'cv']) {
    await expect(nav.getByRole('link', { name: `[${section}]` })).toHaveAttribute('href', `/${section}/`);
  }
  expect(fonts.length).toBeGreaterThan(0);
  for (const font of fonts) expect(new URL(font).origin).toBe(new URL(page.url()).origin);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/["']/g, '')),
  );
  expect(loaded).toEqual(expect.arrayContaining(['IBM Plex Mono', 'Literata']));
});

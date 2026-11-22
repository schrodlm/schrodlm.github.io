import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}

// The sample posts, oldest first, as they stand in the garden from the left.
const PLANTED = [
  ['Starší ukázkový příspěvek', '2023-11-02', '/posts/an-older-sample-post/'],
  ['A sample post', '2024-03-14', '/posts/a-sample-post/'],
  ['Building the sample project', '2024-06-01', '/posts/building-the-sample-project/'],
  ['Notes from the sample garden', '2025-02-20', '/posts/notes-from-the-sample-garden/'],
] as const;

test('the home page renders: the garden, my intro, the recent posts and the projects', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matěj Schrödl');
  await expect(page.getByText('An invented intro for the home page')).toBeVisible();
  await expect(page.locator('main li a')).toHaveText(PLANTED.map(([title]) => title).reverse());
  await expect(page.locator('main li .mark')).toHaveCount(PLANTED.length);
  await expect(page.getByRole('link', { name: 'Sample project', exact: true })).toHaveAttribute('href', '/projects/sample-project/');
  await expect(page.getByRole('link', { name: 'Finished sample', exact: true })).toHaveCount(0);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('every post stands in the garden as a flower that links to it, named by its title and Latin name', async ({ page }) => {
  await open(page);
  const flowers = page.locator('.garden .flower');
  await expect(flowers).toHaveCount(PLANTED.length);
  for (const [i, [title, , href]] of PLANTED.entries()) {
    await expect(flowers.nth(i)).toHaveAttribute('href', href);
    await expect(flowers.nth(i)).toHaveAccessibleName(`${title}, Nomen nondum datum`);
  }
});

test('pointing at a flower shows its placard, and focusing one from the keyboard does too', async ({ page }) => {
  await open(page);
  // The placard holds every flower's line, and shows one at a time.
  const placard = page.locator('.garden .placard > :visible');
  await expect(placard).toHaveText('4 posts, 4 flowers · hover one to read its label');

  await page.locator('.garden .flower').nth(1).hover();
  await expect(placard).toHaveText(/^No\. \d+ · Nomen nondum datum · “A sample post” · planted 2024-03-14$/);
  await page.mouse.move(0, 600);
  await expect(placard).toHaveText('4 posts, 4 flowers · hover one to read its label');

  await page.locator('.skip').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.garden .flower').first()).toBeFocused();
  await expect(placard).toContainText('“Starší ukázkový příspěvek” · planted 2023-11-02');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/posts/an-older-sample-post/');
});

test('the garden stays within the window, and every flower in it can be reached', async ({ page }) => {
  await open(page);
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  const last = page.locator('.garden .flower').last();
  await last.scrollIntoViewIfNeeded();
  const box = (await last.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
});

test('a reader who prefers reduced motion sees the garden still', async ({ page }) => {
  await open(page);
  const garden = page.locator('[data-life="garden"]');
  const resting = await garden.textContent();
  await page.waitForTimeout(1500);
  expect(await garden.textContent()).toBe(resting);
});

test.describe('with motion welcome', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the garden sways in the wind', async ({ page }) => {
    await open(page);
    const garden = page.locator('[data-life="garden"]');
    const resting = await garden.textContent();
    await expect.poll(() => garden.textContent(), { timeout: 5000 }).not.toBe(resting);
  });
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

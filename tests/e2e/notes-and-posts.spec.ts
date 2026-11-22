import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

test.describe('a note in a folder', () => {
  const path = '/notes/invented-systems/vzorova-replikace/';

  test('names its folder, its language, reading time, tags and Latin name, and closes on its specimen card', async ({ page }) => {
    await open(page, path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
    await expect(page.getByRole('link', { name: '[>notes]' })).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.crumbs')).toHaveText('notes / invented systems');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vzorová replikace');
    await expect(page.locator('.meta')).toHaveText(/^česky · 1 min · #vymysleno · #ukazka · \S/);
    const card = page.getByRole('region', { name: "This page's flower" });
    await expect(card).toContainText('grown from “notes/invented-systems/vzorova-replikace”');
    await expect(card).not.toContainText('planted');
    await expect(page).toHaveScreenshot('note.png', { fullPage: true });
  });

  test('trails its section headings, not its subheadings', async ({ page }) => {
    await open(page, path);
    await expect(page.locator('.section-heading h2')).toHaveText(['Motivace', 'Hlavní problém']);
    await expect(page.locator('.prose > h3')).toHaveText('Podnadpis');
  });

  test('stands its flower in the margin beside the title, or above it on a phone, with the vine only beside', async ({ page }, testInfo) => {
    await open(page, path);
    const flower = (await page.locator('.flower .braille').boundingBox())!;
    const title = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
    expect(flower).toMatchObject({ width: 15 * 8, height: 13 * 16 });
    if (testInfo.project.name === 'desktop') {
      expect(flower.x + flower.width).toBeLessThan(title.x);
      await expect(page.locator('[data-life="vine"]')).toBeVisible();
    } else {
      expect(flower.y + flower.height).toBeLessThanOrEqual(title.y);
      await expect(page.locator('[data-life="vine"]')).toBeHidden();
    }
  });
});

test('a post shows its date and project, and its card says when it was planted', async ({ page }) => {
  await open(page, '/posts/notes-from-the-sample-garden/');
  await expect(page.getByRole('link', { name: '[>posts]' })).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.crumbs')).toHaveText('posts · 2025-02-20 · part of Finished sample');
  await expect(page.getByRole('link', { name: 'Finished sample' })).toHaveAttribute('href', '/projects/finished-sample/');
  await expect(page.getByRole('region', { name: "This page's flower" })).toContainText(
    'grown from “posts/notes-from-the-sample-garden” · planted 2025-02-20',
  );
  await expect(page).toHaveScreenshot('post.png', { fullPage: true });
});

test('a stub shows a seedling for its flower, and no specimen card', async ({ page }) => {
  await open(page, '/notes/a-seedling/');
  await expect(page.getByText('Not written yet.')).toBeVisible();
  await expect(page.locator('.meta')).toHaveText('english');
  await expect(page.getByRole('region', { name: "This page's flower" })).toHaveCount(0);
});

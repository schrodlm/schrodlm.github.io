import { expect, test } from '@playwright/test';

test.describe('the note of every construct', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/_kit/prose/');
    await page.evaluate(() => document.fonts.ready);
  });

  test('renders in the house style', async ({ page }) => {
    await expect(page).toHaveScreenshot('prose.png', { fullPage: true });
  });

  test('a link to a heading lands on its GitHub-style id', async ({ page }) => {
    await page.getByRole('link', { name: 'a heading below' }).click();
    await expect(page).toHaveURL(/#tot%C3%A1ln%C3%AD-uspo%C5%99%C3%A1d%C3%A1n%C3%AD-a--b$/);
    await expect(page.getByRole('heading', { name: 'Totální uspořádání (A & B)' })).toBeInViewport();
  });

  test('only the link to a stub is drawn as a seedling', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'a note still waiting to be written (not written yet)' })).toHaveClass('stub');
    await expect(page.getByRole('link', { name: 'one that is' })).not.toHaveClass('stub');
  });

  test('only the wide table scrolls sideways, never the page', async ({ page }) => {
    const table = page.locator('.table-scroll');
    expect(await table.evaluate((box) => box.scrollWidth > box.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test('a folded callout opens without JavaScript', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto('/_kit/prose/');
  const body = page.getByText('A warning that stays closed until it is opened.');
  await expect(body).toBeHidden();
  await page.getByText('Folded until opened').click();
  await expect(body).toBeVisible();
  await page.close();
});

import { expect, test, type Page } from '@playwright/test';

const art = (page: Page) => page.locator('[data-art]');

/** Opens the generator and waits for the library to draw the plasma it starts with, seed 7. */
async function open(page: Page) {
  await page.goto('/clascii/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-status]')).toHaveText(/^plasma, seed 7 · \d+ × \d+$/);
}

test('the generator draws plasma in the pond, with every control beside it', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle('clascii · Matěj Schrödl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('clascii');
  await expect(art(page)).toHaveAttribute('aria-label', /^ASCII art of plasma, seed 7, \d+ by \d+ characters$/);
  const settings = page.getByRole('form', { name: 'Settings' });
  for (const group of ['source', 'size', 'characters', 'picture', 'greys', 'colour', 'output'])
    await expect(settings.getByRole('group', { name: group })).toBeVisible();
  for (const name of ['plasma', 'image', 'video', 'camera', 'new', 'copy', '.txt'])
    await expect(settings.getByRole('button', { name: new RegExp(`^\\[>?${name.replace('.', '\\.')}\\]$`) })).toBeVisible();
  for (const name of ['font size', 'px / column', 'brightness', 'contrast']) await expect(settings.getByRole('slider', { name })).toBeAttached();
  for (const name of ['default', 'nonlinear-default', 'bourke', 'your own', 'braille, ordered', 'braille, diffusion', 'braille, threshold'])
    await expect(settings.getByRole('radio', { name: new RegExp(`^\\[?>?${name}\\]?$`) })).toBeAttached();
  for (const name of ['flip ↕', 'flip ↔', 'invert', 'colours']) await expect(settings.getByRole('checkbox', { name })).toBeAttached();
  await expect(page.getByRole('link', { name: '[>projects]' })).toHaveAttribute('aria-current', 'true');
  // The timings differ on every run, so the stats and their graph are masked, in the night's colour.
  const mask = [page.locator('[data-stats], [data-graph]')];
  await expect(page).toHaveScreenshot('clascii.png', { fullPage: true, mask, maskColor: '#0e1712' });
});

test('choosing another table of characters redraws the art in them', async ({ page }) => {
  await open(page);
  const before = await art(page).textContent();
  expect(before).toMatch(/^[@%#*+=\-:. \n]+$/);
  await page.locator('label.choice', { hasText: 'bourke' }).click();
  await expect(page.getByRole('radio', { name: 'bourke' })).toBeChecked();
  await expect(art(page)).not.toHaveText(before!);
  expect(await art(page).textContent()).toMatch(/[a-zA-Z]/);
  await page.locator('label.choice', { hasText: 'threshold' }).click();
  await expect(art(page)).toHaveText(/^[⠀-⣿\n]+$/);
});

test('my own characters show a field for them, and the art is drawn with only those', async ({ page }) => {
  await open(page);
  await expect(page.getByLabel('darkest first')).toBeHidden();
  await page.locator('label.choice', { hasText: 'your own' }).click();
  await page.getByLabel('darkest first').fill('X ');
  await expect(art(page)).toHaveText(/^[X \n]+$/);
});

test('a picture of my own is drawn without anything leaving the browser', async ({ page }) => {
  await open(page);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.locator('[data-image-file]').setInputFiles('src/assets/plates/projects/clascii.wide.png');
  await expect(page.locator('[data-status]')).toHaveText(/^your image · \d+ × \d+$/);
  await expect(page.locator('[data-seed-row]')).toBeHidden();
  expect(requests).toEqual([]);
});

test('the library loads on the generator only', async ({ page }) => {
  const loads: string[] = [];
  page.on('request', (request) => request.url().includes('/vendor/clascii/') && loads.push(request.url()));
  await page.goto('/projects/');
  await page.waitForLoadState('networkidle');
  expect(loads).toEqual([]);
  await open(page);
  expect(loads).toHaveLength(1);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the pond says what it would do and where the library lives', async ({ page }) => {
    await page.goto('/clascii/');
    // Playwright's text and role queries skip <noscript>, so the note is found by its class.
    const note = page.locator('.without');
    await expect(note).toBeVisible();
    await expect(note).toContainText('It needs JavaScript to run');
    await expect(note.locator('a')).toHaveAttribute('href', 'https://github.com/schrodlm/clascii');
    await expect(page.getByRole('form', { name: 'Settings' })).toBeHidden();
  });
});

test('the generator never scrolls sideways, even on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a project's write-up links to the generator", async ({ page }) => {
  await page.goto('/projects/finished-sample/');
  await expect(page.getByRole('link', { name: 'try it' })).toHaveAttribute('href', '/clascii/');
});

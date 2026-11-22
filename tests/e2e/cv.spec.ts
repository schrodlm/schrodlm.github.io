import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** What the plate's canvas shows now, as a data URL. */
const canvasPixels = (page: Page) =>
  page.locator('.lamplit-desk canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

// The tests emulate a reader who prefers reduced motion, unless one asks for motion itself.
test('the CV renders from its note, under the still plate', async ({ page }) => {
  await page.goto('/cv/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jane Placeholder');
  await expect(page.getByRole('link', { name: '[>cv]' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Download PDF ↓' })).toHaveAttribute('href', '/cv/cv.pdf');
  await expect(page.getByRole('img', { name: /me, writing this/ })).toBeVisible();
  await expect(page.locator('.lamplit-desk canvas')).toBeHidden();
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await expect(page).toHaveScreenshot('cv.png', { fullPage: true });
});

test.describe('where motion is welcome', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the plate plays over its still', async ({ page }) => {
    await page.goto('/cv/');
    // The plate only moves while it is on screen.
    await page.locator('.lamplit-desk').scrollIntoViewIfNeeded();
    await expect(page.locator('.lamplit-desk canvas')).toBeVisible();
    const first = await canvasPixels(page);
    await expect.poll(() => canvasPixels(page)).not.toBe(first);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the plate shows its still', async ({ page }) => {
    await page.goto('/cv/');
    await expect(page.getByRole('img', { name: /me, writing this/ })).toBeVisible();
    await expect(page.locator('.lamplit-desk canvas')).toBeHidden();
  });
});

test.describe('in print', () => {
  // Print has one layout, on A4, so these run once, as the desktop.
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'print is the same on every screen'));

  test('the CV is set in Latin Modern, without the shell or the plate', async ({ page }) => {
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.emulateMedia({ media: 'print' });
    await page.goto('/cv/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    await expect(page.locator('.lamplit-desk')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Download PDF ↓' })).toBeHidden();
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/["']/g, '')),
    );
    expect(loaded.length).toBeGreaterThan(0);
    expect(new Set(loaded)).toEqual(new Set(['Latin Modern Roman']));
    await expect(page).toHaveScreenshot('cv-print.png', { fullPage: true });
  });

  test('the PDF prints on one or two A4 pages', () => {
    // It starts its own server and browser.
    test.setTimeout(60_000);
    execFileSync('node', ['scripts/print-cv-pdf.mjs'], { stdio: 'inherit' });
    const pdf = readFileSync('dist/cv/cv.pdf', 'latin1');
    const pages = [...pdf.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map(([, w, h]) => [Number(w), Number(h)]);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages.length).toBeLessThanOrEqual(2);
    for (const [w, h] of pages) {
      expect(w).toBeCloseTo(595, 0);
      expect(h).toBeCloseTo(842, 0);
    }
  });
});

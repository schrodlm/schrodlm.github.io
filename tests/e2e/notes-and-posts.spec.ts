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

test.describe('a note’s neighbourhood', () => {
  const path = '/notes/invented-systems/vzorova-replikace/';
  const neighbours = [
    ['Sample consensus', '/notes/invented-systems/sample-consensus/', 'linked from'],
    ['Sample quorum', '/notes/invented-systems/sample-quorum/', 'both ways'],
    ['A seedling', '/notes/a-seedling/', 'links to'],
    ['Sample clock', '/notes/sample-clock/', 'links to'],
    ['Ukázková poznámka', '/notes/ukazkova-poznamka/', 'links to'],
  ];

  test('stands between the text and the specimen card, its neighbours linked from captions or a numbered list', async ({ page }, testInfo) => {
    await open(page, path);
    const hood = page.getByRole('region', { name: 'Neighbourhood' });
    const card = page.getByRole('region', { name: "This page's flower" });
    expect((await hood.boundingBox())!.y).toBeLessThan((await card.boundingBox())!.y);
    const desktop = testInfo.project.name === 'desktop';
    const links = desktop ? hood.locator('.caption') : hood.getByRole('listitem').getByRole('link');
    await expect(links).toHaveCount(neighbours.length);
    for (const [i, [title, href, how]] of neighbours.entries()) {
      await expect(links.nth(i)).toHaveAttribute('href', href!);
      await expect(links.nth(i)).toContainText(title!);
      if (!desktop) await expect(hood.getByRole('listitem').nth(i)).toHaveText(new RegExp(`^${i + 1}\\s*${title}.*· ${how}$`));
    }
    await expect(hood.locator('.caption').first()).toBeVisible({ visible: desktop });
    await expect(hood.getByRole('list')).toBeVisible({ visible: !desktop });
    await expect(hood.locator('.number').first()).toBeVisible({ visible: !desktop });
    await expect(hood.locator('.legend')).toHaveText(
      'Solid vines end in a leaf at the notes this one links to; dotted vines come from the notes that link here; a leaf at both ends marks a link both ways. The faint heads above and below are two steps away.',
    );
    await expect(hood).toHaveScreenshot('neighbourhood.png');
  });

  test('keeps the captions, or on a phone the numbers, on the plate', async ({ page }, testInfo) => {
    await open(page, path);
    const plate = (await page.locator('.neighbourhood .plate').boundingBox())!;
    const labels = page.locator(testInfo.project.name === 'desktop' ? '.neighbourhood .caption' : '.neighbourhood .number');
    await expect(labels).toHaveCount(neighbours.length);
    for (const caption of await labels.all()) {
      const box = (await caption.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(plate.x);
      expect(box.x + box.width).toBeLessThanOrEqual(plate.x + plate.width);
      expect(box.y).toBeGreaterThanOrEqual(plate.y);
      expect(box.y + box.height).toBeLessThanOrEqual(plate.y + plate.height);
    }
  });

  test('brings a caption’s vine up in its note’s colour while it is hovered or focused', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'a phone has no captions to hover');
    await open(page, path);
    const vines = page.locator('.neighbourhood .vine');
    const colour = (i: number) => vines.nth(i).evaluate((vine) => getComputedStyle(vine).color);
    const resting = await colour(0);
    expect(await colour(1)).toBe(resting);

    await page.locator('.caption').first().hover();
    const hot = await vines.first().evaluate((vine) => {
      const probe = document.createElement('span');
      probe.style.color = getComputedStyle(vine).getPropertyValue('--hot');
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    expect(hot).not.toBe(resting);
    await expect.poll(() => colour(0)).toBe(hot);
    expect(await colour(1)).toBe(resting);
    await expect(page.locator('.neighbourhood')).toHaveScreenshot('neighbourhood-hover.png');

    await page.mouse.move(0, 0);
    await expect.poll(() => colour(0)).toBe(resting);
    await page.locator('.caption').nth(1).focus();
    await expect.poll(() => colour(1)).not.toBe(resting);
    // A stub's vine comes up too, in its seedling's colour.
    await page.locator('.caption.stub').hover();
    await expect.poll(() => colour(2)).not.toBe(resting);
  });

  test('is drawn for a stub, from the notes that link to it', async ({ page }) => {
    await open(page, '/notes/a-seedling/');
    const hood = page.getByRole('region', { name: 'Neighbourhood' });
    await expect(hood.locator('.legend')).toHaveText(/^Dotted vines come from the notes that link here\./);
  });

  test('is not drawn on a post', async ({ page }) => {
    await open(page, '/posts/notes-from-the-sample-garden/');
    await expect(page.getByRole('region', { name: 'Neighbourhood' })).toHaveCount(0);
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

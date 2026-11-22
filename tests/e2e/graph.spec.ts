import { expect, test, type Locator, type Page } from '@playwright/test';

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

const opacity = (locator: Locator) => locator.evaluate((element) => Number(getComputedStyle(element).opacity));
const noPageOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// The sample garden's notes, A to Z, as the map's links reach them.
const NOTES = [
  'A seedling',
  'Every construct',
  'Lone sample',
  'Sample clock',
  'Sample consensus',
  'Sample note',
  'Sample quorum',
  'Ukázková poznámka',
  'Vzorová replikace',
];

test.describe('the garden map', () => {
  test('draws every note as a link on the plate, the wildflower in its own bed', async ({ page }) => {
    await open(page, '/graph/');
    await expect(page.getByRole('link', { name: '[>notes]' })).toHaveAttribute('aria-current', 'true');
    const map = page.getByRole('region', { name: 'The garden map' });
    const notes = map.locator('.plate .note');
    await expect(notes).toHaveCount(NOTES.length);
    for (const [i, title] of NOTES.entries()) await expect(notes.nth(i).locator('.caption')).toContainText(title);
    await expect(map.getByRole('link', { name: 'Vzorová replikace (5 links)', exact: true })).toHaveAttribute('href', '/notes/invented-systems/vzorova-replikace/');
    await expect(map.getByRole('link', { name: 'Lone sample (a wildflower)', exact: true })).toBeVisible();
    await expect(map.getByRole('link', { name: 'A seedling (2 links, not written yet)', exact: true })).toBeVisible();
    // The wildflower stands below the bed's name, every other note above it.
    const bed = (await map.locator('.bed').boundingBox())!;
    for (const [i, title] of NOTES.entries()) {
      const box = (await notes.nth(i).boundingBox())!;
      if (title === 'Lone sample') expect(box.y).toBeGreaterThanOrEqual(bed.y + bed.height);
      else expect(box.y + box.height).toBeLessThan(bed.y);
    }
    await expect(map.locator('.legend')).toContainText('8 flowers on 11 vines, and 1 wildflower.');
    expect(await noPageOverflow(page)).toBe(true);
    await expect(page).toHaveScreenshot('graph.png', { fullPage: true });
  });

  test('names a hub at rest and the rest of the notes only when they come up', async ({ page }) => {
    await open(page, '/graph/');
    const caption = (title: string) => page.locator('.plate .note', { hasText: title }).locator('.caption');
    expect(await opacity(caption('Vzorová replikace'))).toBe(1);
    expect(await opacity(caption('Sample clock'))).toBe(0);
  });

  test('brings up a note’s vines and its neighbours’ names on hover, and fades the rest', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'a phone has nothing to hover');
    await open(page, '/graph/');
    const note = (title: string) => page.locator('.plate .note', { hasText: title });
    const vines = page.locator('.plate .vine');
    expect(await vines.evaluateAll((all) => all.every((v) => getComputedStyle(v).opacity === '0'))).toBe(true);

    await note('Sample clock').hover();
    // Sample clock is linked with Sample consensus, Vzorová replikace and Sample note.
    await expect.poll(() => vines.evaluateAll((all) => all.filter((v) => getComputedStyle(v).opacity === '1').length)).toBe(3);
    for (const title of ['Sample clock', 'Sample consensus', 'Sample note', 'Vzorová replikace']) {
      expect(await opacity(note(title))).toBe(1);
      expect(await opacity(note(title).locator('.caption'))).toBe(1);
    }
    for (const title of ['Lone sample', 'A seedling']) {
      expect(await opacity(note(title))).toBeLessThan(1);
      expect(await opacity(note(title).locator('.caption'))).toBe(0);
    }
    await expect(page.locator('.garden-map .plate')).toHaveScreenshot('graph-hover.png');

    await page.mouse.move(0, 0);
    await expect.poll(() => opacity(note('Lone sample'))).toBe(1);
  });

  test('reaches every note by keyboard, A to Z, naming each as it comes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'a phone has no keyboard to tab with');
    await open(page, '/graph/');
    await page.locator('.plate .note').first().focus();
    const reached: string[] = [];
    for (const _ of NOTES) {
      const focused = page.locator('.plate .note:focus');
      reached.push(await focused.locator('.caption').evaluate((caption) => caption.firstChild!.textContent!.trim()));
      await expect.poll(() => opacity(focused.locator('.caption'))).toBe(1);
      await page.keyboard.press('Tab');
    }
    expect(reached).toEqual(NOTES);
  });

  test('opens a note when its flower is followed', async ({ page }) => {
    await open(page, '/graph/');
    await page.locator('.plate .note', { hasText: 'Sample quorum' }).click();
    await expect(page).toHaveURL('/notes/invented-systems/sample-quorum/');
  });

  test('says the same in words, in a list of every note and its links', async ({ page }) => {
    await open(page, '/graph/');
    const list = page.locator('.every');
    await list.getByText('Every note, and what it links').click();
    await expect(list.getByRole('listitem')).toHaveCount(NOTES.length);
    await expect(list.getByRole('listitem').last()).toHaveText(
      'Vzorová replikace · links to A seedling, Sample clock, Sample quorum, Ukázková poznámka · linked from Sample consensus, Sample quorum',
    );
    await expect(list.getByRole('listitem').nth(NOTES.indexOf('Lone sample'))).toHaveText('Lone sample · a wildflower, linked with nothing yet');
  });

  test('is a small link away from the notes', async ({ page }) => {
    await open(page, '/notes/');
    await page.getByRole('link', { name: 'see the whole garden' }).click();
    await expect(page).toHaveURL('/graph/');
  });
});

test.describe('a garden the size of a real one', () => {
  test('draws quickly, every flower clear of every other, its resting names clear of each other', async ({ page }) => {
    const started = Date.now();
    await open(page, '/_kit/garden/');
    expect(Date.now() - started).toBeLessThan(5000);
    const notes = page.locator('.plate .note');
    await expect(notes).toHaveCount(200);

    const boxes = await notes.evaluateAll((all) =>
      all.map((note) => {
        const head = note.getBoundingClientRect();
        const caption = note.querySelector('.caption')!.getBoundingClientRect();
        return { head, caption, named: note.classList.contains('named') };
      }),
    );
    type Box = { x: number; y: number; width: number; height: number };
    const over = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    let heads = 0;
    let names = 0;
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        if (over(a.head, b.head)) heads++;
        if (a.named && b.named && over(a.caption, b.caption)) names++;
      }
    }
    expect(heads).toBe(0);
    expect(names).toBe(0);
    expect(boxes.filter((b) => b.named).length).toBeGreaterThan(10);
    expect(await noPageOverflow(page)).toBe(true);
  });

  test('scrolls inside its frame on a phone, never the page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'a desktop has room for the whole plate');
    await open(page, '/_kit/garden/');
    const frame = page.locator('.garden-map .frame');
    expect(await frame.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    expect(await noPageOverflow(page)).toBe(true);
  });
});

import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

test('the notes list every note from A to Z under their intro, each with its mark', async ({ page }) => {
  await open(page, '/notes/');
  await expect(page.getByRole('link', { name: '[>notes]' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('An invented intro for the notes section')).toBeVisible();
  const links = page.locator('main li a');
  await expect(links).toHaveText([
    'A seedling',
    'Every construct',
    'Lone sample',
    'Sample clock',
    'Sample consensus',
    'Sample note',
    'Sample quorum',
    'Ukázková poznámka',
    'Vzorová replikace',
  ]);
  await expect(links.last()).toHaveAttribute('href', '/notes/invented-systems/vzorova-replikace/');
  await expect(page.locator('main li .mark')).toHaveCount(9);
  await expect(page).toHaveScreenshot('notes.png', { fullPage: true });
});

test('the posts list every post, the newest first, with its date and mark', async ({ page }) => {
  await open(page, '/posts/');
  await expect(page.locator('main li a')).toHaveText([
    'Notes from the sample garden',
    'Building the sample project',
    'A sample post',
    'Starší ukázkový příspěvek',
  ]);
  await expect(page.locator('main li .date')).toHaveText(['2025-02-20', '2024-06-01', '2024-03-14', '2023-11-02']);
  await expect(page.locator('main li .mark')).toHaveCount(4);
  await expect(page).toHaveScreenshot('posts.png', { fullPage: true });
});

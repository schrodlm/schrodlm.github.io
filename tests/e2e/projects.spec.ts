import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

test('the projects list shows a card for every project, in progress first', async ({ page }) => {
  await open(page, '/projects/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects');
  await expect(page.getByRole('link', { name: '[>projects]' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('2 projects · 1 in progress · 1 finished')).toBeVisible();
  const names = page.getByRole('heading', { level: 2 });
  await expect(names).toHaveText(['Sample project', 'Finished sample']);
  await expect(page.getByRole('link', { name: 'Sample project' })).toHaveAttribute('href', '/projects/sample-project/');
  await expect(page.getByText('last devlog 2024-07-11 · 3 sessions')).toBeVisible();
  await expect(page.getByText('no devlogs yet')).toBeVisible();
  await expect(page).toHaveScreenshot('projects.png', { fullPage: true });
});

test("a project's page shows its write-up, milestones, field journal and posts", async ({ page }) => {
  await open(page, '/projects/sample-project/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sample project');
  const jumps = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');
  await expect(jumps).toHaveText(['milestones 2/4', 'field journal · 3', 'posts · 1']);
  await expect(page.getByText('2 of 4 done')).toBeVisible();
  await expect(page.locator('.milestones li.current')).toContainText('Write the docs');
  const journal = page.locator('#journal');
  await expect(journal.getByRole('heading', { level: 3 })).toHaveText([/July 2024$/, /June 2024$/, /May 2024$/]);
  await expect(journal.getByRole('link')).toHaveText(['Writing the docs', 'The first version', 'Sketching the idea']);
  await expect(journal.getByText('An invented third session, in which the docs were begun.', { exact: true })).toBeVisible();
  await expect(page.locator('#posts').getByRole('link')).toHaveAttribute('href', '/posts/building-the-sample-project/');
  await expect(page).toHaveScreenshot('project.png', { fullPage: true });
});

test('a project with nothing to list leaves out the jump bar and its parts', async ({ page }) => {
  await open(page, '/projects/finished-sample/');
  await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(0);
  await expect(page.locator('#milestones, #journal, #posts')).toHaveCount(0);
});

test('a devlog shows its trail, its sections with their counts, and its neighbours', async ({ page }) => {
  await open(page, '/devlogs/sample-project/session-3/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing the docs');
  await expect(page.getByRole('link', { name: 'field journal', exact: true })).toHaveAttribute('href', '/projects/sample-project/#journal');
  const trail = page.getByRole('navigation', { name: 'Sessions of Sample project' });
  const stones = trail.getByRole('link');
  await expect(stones).toHaveCount(3);
  await expect(stones.last()).toHaveAttribute('aria-current', 'page');
  await expect(stones.first()).toHaveAttribute('href', '/devlogs/sample-project/session-1/');
  const counts = page.getByRole('navigation', { name: 'Sections' }).getByRole('link');
  await expect(counts).toHaveText(['done 3', 'decisions 2', 'problems 1', 'learned 2', 'next 2']);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    /^Done\s*3/,
    /^Decisions\s*2/,
    /^Problems and surprises\s*1/,
    /^Learned\s*2/,
    /^Next\s*2/,
  ]);
  const neighbours = page.getByRole('navigation', { name: 'Previous and next session' }).getByRole('link');
  await expect(neighbours).toHaveCount(1);
  await expect(neighbours).toHaveAttribute('href', '/devlogs/sample-project/session-2/');
  await expect(page).toHaveScreenshot('devlog.png', { fullPage: true });
});

test('a stone of the trail is a fingertip wide and leads to its session', async ({ page }) => {
  await open(page, '/devlogs/sample-project/session-3/');
  const stone = page.getByRole('link', { name: 'Session 1: Sketching the idea' });
  const box = (await stone.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  await stone.click();
  await expect(page).toHaveURL(/\/devlogs\/sample-project\/session-1\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sketching the idea');
});

test('no page of the projects scrolls sideways, even on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ['/projects/', '/projects/sample-project/', '/devlogs/sample-project/session-3/']) {
    await open(page, path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

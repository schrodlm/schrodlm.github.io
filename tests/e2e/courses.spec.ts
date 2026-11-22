import { expect, test, type Page } from '@playwright/test';

const settled = async (page: Page) => {
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await page.evaluate(() => document.fonts.ready);
};

test('the courses home shows my intro, a card per university and every course, oldest first', async ({ page }) => {
  await page.goto('/courses/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Courses');
  await expect(page.getByRole('link', { name: '[>courses]' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('An invented intro for the courses section')).toBeVisible();
  await expect(page.getByRole('link', { name: 'PIT', exact: true })).toHaveAttribute('href', '/universities/placeholder-institute/');
  await expect(page.getByRole('link', { name: 'FEX', exact: true })).toHaveAttribute('href', '/universities/example-university/');
  await expect(page.locator('.index .code')).toHaveText(['PIT200', 'FEX101', 'FEX102', 'FEX103']);
  await expect(page.getByRole('link', { name: 'Sample course' })).toHaveAttribute('href', '/courses/fex101-sample-course/');
  await expect(page.getByText('Unrated course')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Unrated course' })).toHaveCount(0);
  await settled(page);
  await expect(page).toHaveScreenshot('courses.png', { fullPage: true });
});

test('a university page lists its courses by year and semester', async ({ page }) => {
  await page.goto('/universities/example-university/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FEX');
  await expect(page.getByRole('link', { name: 'courses', exact: true })).toHaveAttribute('href', '/courses/');
  await expect(page.getByRole('heading', { level: 3 })).toHaveText(['2025/26']);
  await expect(page.getByRole('heading', { level: 4 })).toHaveText(['winter semester', 'summer semester']);
  const unrated = page.getByRole('listitem').filter({ hasText: 'FEX102' });
  await expect(unrated).toContainText('not rated yet');
  await expect(unrated.getByRole('link')).toHaveCount(0);
  await expect(page.getByRole('listitem').filter({ hasText: 'FEX101' })).toContainText(
    'difficulty 3.5 · usefulness 4 · teaching 5',
  );
  await settled(page);
  await expect(page).toHaveScreenshot('university.png', { fullPage: true });
});

test('a rated course shows its meters and verdict', async ({ page }) => {
  await page.goto('/courses/fex101-sample-course/');
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb).toHaveText('courses / FEX / FEX101');
  await expect(breadcrumb.getByRole('link', { name: 'FEX' })).toHaveAttribute('href', '/universities/example-university/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sample course');
  await expect(page.getByRole('definition')).toHaveText(['██ ██ ██ █░ ░░3.5 out of 5', '██ ██ ██ ██ ░░4 out of 5', '██ ██ ██ ██ ██5 out of 5']);
  await expect(page.getByText('[+] worth it')).toBeVisible();
  await expect(page.getByRole('link', { name: 'example.com/fex101' })).toHaveAttribute('href', 'https://example.com/fex101');
  await settled(page);
  await expect(page).toHaveScreenshot('course-rated.png', { fullPage: true });
});

test('a course not rated yet says so, without meters or a verdict', async ({ page }) => {
  await page.goto('/courses/fex103-course-under-way/');
  await expect(page.getByText('not rated yet')).toBeVisible();
  await expect(page.getByRole('definition')).toHaveCount(0);
  await expect(page.getByText('worth it')).toHaveCount(0);
  await settled(page);
  await expect(page).toHaveScreenshot('course-unrated.png', { fullPage: true });
});

test('a review keeps its own language under English labels', async ({ page }) => {
  await page.goto('/courses/pit200-ukazkovy-predmet/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'cs');
  await expect(page.locator('article')).toHaveAttribute('lang', 'cs');
  await expect(page.getByText('[-] not worth it')).toBeVisible();
});

test('a course without a review has no page', async ({ page }) => {
  const response = await page.goto('/courses/fex102-unrated-course/');
  expect(response?.status()).toBe(404);
});

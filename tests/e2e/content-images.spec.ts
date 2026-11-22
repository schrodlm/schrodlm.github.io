import { expect, test } from '@playwright/test';

test('the content images are served at /assets/img/', async ({ request }) => {
  const response = await request.get('/assets/img/sample-image.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');
});

// Print the built site's CV page, /cv/, to dist/cv/cv.pdf, so the PDF sits beside the page.
// Run it after `astro build`, with the same SITE_BASE. It serves dist/ with `astro preview` and
// prints with the Chromium that @playwright/test pins. The page brings its own fonts, so no system
// fonts are needed.
import { chromium } from '@playwright/test';
import { preview } from 'astro';
import { existsSync } from 'node:fs';

const OUT = 'dist/cv/cv.pdf';
const base = `/${process.env.SITE_BASE ?? ''}/`.replace(/\/+/g, '/');

if (!existsSync('dist/cv/index.html')) {
  console.error('dist/cv/index.html is missing: the build has no CV page to print.');
  process.exit(1);
}

const server = await preview({ logLevel: 'warn', server: { port: 0 } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // A missing stylesheet or font would still print, only wrong, so it fails the run instead.
  const failed = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => failed.push(`${request.failure()?.errorText} ${request.url()}`));
  // Print media from the start, so the fonts only print uses load before the check below.
  await page.emulateMedia({ media: 'print' });
  await page.goto(`http://localhost:${server.port}${base}cv/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (failed.length) throw new Error(`The CV page could not load everything:\n  ${failed.join('\n  ')}`);
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`Wrote ${OUT}`);
} finally {
  await browser.close();
  await server.stop();
}

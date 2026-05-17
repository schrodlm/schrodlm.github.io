import { chromium } from 'playwright';
import { createServer } from 'http';
import { stat, readFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

const SITE_DIR = '_site';
const OUT_PATH = '_site/assets/pdf/cv.pdf';
const PORT = 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    let filePath = join(SITE_DIR, path);
    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
      if (!extname(filePath)) filePath += '.html';
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`serving ${SITE_DIR} on :${PORT}`);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/cv.html`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });

await mkdir('_site/assets/pdf', { recursive: true });
await page.pdf({
  path: OUT_PATH,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  displayHeaderFooter: false,
});

console.log(`wrote ${OUT_PATH}`);
await browser.close();
server.close();

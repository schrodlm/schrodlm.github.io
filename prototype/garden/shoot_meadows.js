// Renders design-canvas boards (.dc.html) with a minimal stand-in runtime and screenshots them.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/schrodlm/node_modules/playwright');
const BOARDS = path.join(__dirname, 'jungle/project');
const [OUT, ...specs] = process.argv.slice(2);
const shots = JSON.parse(specs.join(' '));
const runtime = fs.readFileSync(path.join(__dirname, 'runtime.js'), 'utf8');
(async () => {
  const browser = await chromium.launch();
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: 1280, height: s.vh || s.height || 900 }, deviceScaleFactor: s.scale || 1 });
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ content: runtime });
    await page.evaluate(([src, st]) => window.renderBoard(src, st), [fs.readFileSync(path.join(BOARDS, s.file), 'utf8'), s.state || {}]);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const file = path.join(OUT, s.out);
    if (s.selector) await page.locator(s.selector).first().screenshot({ path: file });
    else await page.screenshot({ path: file, clip: { x: 0, y: s.y || 0, width: 1280, height: s.height } });
    console.log('saved', s.out);
    await page.close();
  }
  await browser.close();
})();

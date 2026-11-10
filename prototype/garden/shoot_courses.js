// Copy of shoot.js for the course boards: adds width, prop overrides and full-page capture.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/schrodlm/node_modules/playwright');
const BOARDS = path.join(__dirname, 'jungle/project');
const [OUT, ...specs] = process.argv.slice(2);
const shots = JSON.parse(specs.join(' '));
const runtime = fs.readFileSync(path.join(__dirname, 'runtime.js'), 'utf8');
(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(OUT, { recursive: true });
  for (const s of shots) {
    const w = s.width || 1280;
    const page = await browser.newPage({ viewport: { width: w, height: s.height || 900 }, deviceScaleFactor: s.scale || 1 });
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ content: runtime });
    let src = fs.readFileSync(path.join(BOARDS, s.file), 'utf8');
    if (s.props) src = src.replace(/data-props='([^']*)'/, (_, j) => { const d = JSON.parse(j); for (const [k, v] of Object.entries(s.props)) d[k].default = v; return "data-props='" + JSON.stringify(d) + "'"; });
    await page.evaluate(([src, st]) => window.renderBoard(src, st), [src, s.state || {}]);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500); await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, s.out);
    if (s.full) await page.screenshot({ path: file, fullPage: true });
    else await page.screenshot({ path: file, clip: { x: 0, y: s.y || 0, width: w, height: s.height } });
    console.log('saved', s.out);
    await page.close();
  }
  await browser.close();
})();

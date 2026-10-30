// 檢查 drafts-160/index.html：node drafts-160/index-shot.mjs <out.png> [等待毫秒=6000]
import path from 'node:path';
import { chromium } from 'playwright';
import { root } from './shot.mjs';
const [out, wait = '6000', y0 = '', hh = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => m.type() === 'error' && errs.push(m.text()));
page.on('requestfailed', r => errs.push('failed ' + r.url()));
await page.goto(`file://${path.join(root, 'drafts-160/index.html')}`);
await page.waitForTimeout(+wait);
if (y0) { await page.evaluate(y => scrollTo(0, y), +y0); await page.waitForTimeout(4000); await page.screenshot({ path: out }); } else await page.screenshot({ path: out, fullPage: true });
console.log('errors:', errs.length ? errs.slice(0, 8) : 'none');
await browser.close();

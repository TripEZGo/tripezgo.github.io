// 官網首頁本機截圖（不上線）：頁面開在 https://tripezgo.com 這個 origin、請求接到本機檔案。
//   node drafts-160/site-shot.mjs <輸出資料夾>   → <輸出>/home-<zh|en|ja|ko>-feature.png（主頁段）、-plans.png（Premium 比較表）
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { root } from './shot.mjs';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const out = path.resolve(process.argv[2] || 'out-160/site');
fs.mkdirSync(out, { recursive: true });
const PAGES = { zh: '/index.html', en: '/en/index.html', ja: '/ja/index.html', ko: '/ko/index.html' };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.route('https://tripezgo.com/**', (route) => {
  let p = path.join(root, decodeURIComponent(new URL(route.request().url()).pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(root) || !fs.existsSync(p)) return route.fulfill({ status: 404, body: '' });
  route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p), headers: { 'cache-control': 'no-store' } });
});
for (const [l, u] of Object.entries(PAGES)) {
  await page.goto('https://tripezgo.com' + u, { waitUntil: 'load' });
  const feat = page.locator('#features .feature').first();
  await feat.scrollIntoViewIfNeeded();
  await page.waitForTimeout(6000);   // 手機 iframe 掛上、自動示範跑起來
  const fb = await feat.boundingBox();
  await page.screenshot({ path: path.join(out, `home-${l}-feature.png`), clip: { x: Math.max(0, fb.x), y: fb.y, width: Math.min(fb.width, 1280), height: Math.min(fb.height, 900) } });
  const plans = page.locator('table.compare');
  await plans.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const pb = await plans.boundingBox();
  await page.screenshot({ path: path.join(out, `home-${l}-plans.png`), clip: { x: pb.x, y: pb.y, width: pb.width, height: Math.min(pb.height, 900) } });
  console.log('wrote', l);
}
await browser.close();

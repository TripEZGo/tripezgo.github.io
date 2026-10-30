// 1.6.0 CP5 稿用的截圖小工具：node drafts-160/shot.mjs <page> "<query>" <out.png> [lang=zh-Hant-TW]
// 跟 tools/screens.mjs 一樣：playwright headless shell（不是完整的 Chrome），頁面開在 https://tripezgo.com 這個 origin、請求接到本機檔案。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
export async function routeSite(page) {
  await page.route('https://tripezgo.com/**', (route) => {
    const p = path.join(root, decodeURIComponent(new URL(route.request().url()).pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) });
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, query = '', out, lang = 'zh-Hant-TW'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
  page.on('pageerror', e => console.error('page error:', e.message));
  page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
  await routeSite(page);
  await page.goto(`https://tripezgo.com/screens/${name}.html?lang=${lang}&${query}`);
  await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await page.locator('#d').screenshot());
  await browser.close();
  console.log('wrote', out);
}

// 分享預覽圖：node tools/og/make.mjs → assets/img/og-<zh|en|ja|ko>.png（1200×630）
// 　　　　　＋限時動態廣告圖 assets/img/story-<zh|en|ja|ko>.png（1080×1920，tools/og/story.html；首頁限時活動的 Instagram 鈕用）
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
// 用 http 開（file:// 底下 CSS mask 讀不到同目錄的 SVG，標誌會整個消失）
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
await new Promise((r) => srv.once('listening', r));
const base = `http://127.0.0.1:${srv.address().port}/tools/og/og.html`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const lang of ['zh', 'en', 'ja', 'ko']) {
  await p.goto(`${base}?lang=${lang}`);
  await p.waitForSelector('html[data-ready="1"]');
  await p.screenshot({ path: path.join(root, `assets/img/og-${lang}.png`) });
  console.log('og', lang);
}
const sp = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
for (const lang of ['zh', 'en', 'ja', 'ko']) {
  await sp.goto(base.replace('og.html', 'story.html') + `?lang=${lang}`);
  await sp.waitForSelector('html[data-ready="1"]');
  await sp.screenshot({ path: path.join(root, `assets/img/story-${lang}.png`) });
  console.log('story', lang);
}
await b.close();
srv.close();

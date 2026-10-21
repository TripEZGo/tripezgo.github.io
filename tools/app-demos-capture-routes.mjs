/* 打包進 App 的離線地圖：把真的 MapKit Directions（步行）算出來的路線錄下來，離線時 screens/map-static.js 照放。
 *
 *   node tools/app-demos-capture-routes.mjs        → screens/data/mapdemo-routes.json（需要網路，只在要換路線時跑）
 *
 * 做法：開真的 map-live（tripezgo.com origin），攔 mapkit.Directions；載入時第 2 天的步行路段會自己問一輪，
 * 再依序點示範用到的目的地（商家、圖釘）按步行鈕，把每一次回傳的路線存起來。 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const TARGETS = ['s162', 'd2-omotesando', 'd2-itsukushima', 'd2-momijidani'];   // 示範裡會按步行鈕的那幾個
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  window.__rec = [];
  let real;
  Object.defineProperty(window, 'mapkit', {
    configurable: true, get: () => real,
    set(v) {
      real = v; const D = v.Directions;
      v.Directions = class extends D {
        route(req, cb) {
          super.route(req, (err, res) => {
            if (!err && res?.routes?.length) {
              const r = res.routes[0], c = (p) => [+p.latitude.toFixed(6), +p.longitude.toFixed(6)];
              window.__rec.push({ from: c(req.origin), to: c(req.destination), distance: r.distance, secs: r.expectedTravelTime,
                path: r.polyline.points.map(c), steps: r.steps.map((s) => ({ distance: s.distance, path: (s.path || []).flat().map(c) })) });
            }
            cb(err, res);
          });
        }
      };
    },
  });
});
await page.route('https://tripezgo.com/**', (route) => {
  const p = path.join(root, decodeURIComponent(new URL(route.request().url()).pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404, body: '' });
  route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) });
});
await page.goto('https://tripezgo.com/screens/map-live.html?lang=zh-Hant-TW&interactive=1&nav=0&today=2&start=2026-10-09&pan=0');
await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
await page.waitForTimeout(3000);
for (const id of TARGETS) {
  const el = page.locator(`[data-auto="${id}"]`).first();
  console.log(id, await el.count());
  await el.evaluate((n) => { const r = n.getBoundingClientRect(), o = { bubbles: true, composed: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    n.dispatchEvent(new PointerEvent('pointerdown', o)); n.dispatchEvent(new PointerEvent('pointerup', o)); n.click(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('#card [data-act="walk"]')?.click());
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.querySelector('#card [data-act="end"]')?.click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('#alert [data-a="end"]')?.click());
  await page.waitForTimeout(1500);
}
const rec = await page.evaluate(() => window.__rec);
const uniq = new Map(rec.map((r) => [`${r.from}>${r.to}`, r]));
console.log('recorded', rec.length, 'unique', uniq.size);
fs.writeFileSync(path.join(root, 'screens/data/mapdemo-routes.json'), JSON.stringify([...uniq.values()]) + '\n');
await browser.close();

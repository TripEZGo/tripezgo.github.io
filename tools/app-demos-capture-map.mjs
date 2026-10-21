/* 打包進 App 的離線地圖底圖（ADR-0050）：用真的 MapKit JS 在 tripezgo.com origin 畫一次，截成靜態圖，
 * 再算出圖的四角座標。只在要換底圖時跑（需要網路；正常打包 tools/app-demos.mjs 不跑它）。
 *
 *   node tools/app-demos-capture-map.mjs            → screens/img/mapdemo-<lang>-<theme>.webp ＋ screens/data/mapdemo.json
 *
 * 取景是宮島表參道到嚴島神社那一帶（歡迎頁地圖／旅伴示範用）：圖比手機畫面大一圈（603×1044pt、2x），
 * 示範裡的鏡頭在這張圖之內移動、縮放（screens/map-static.js）。 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const W = 603, H = 1044;
const CENTER = [34.2946, 132.3225], SPAN = [0.0339, 0.02375];
const LANGS = { 'zh-Hant-TW': 'zh-Hant', en: 'en', ja: 'ja' };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const tmp = fs.mkdtempSync('/tmp/mapdemo-');
const browser = await chromium.launch();
const bounds = {};
for (const [lang, mkLang] of Object.entries(LANGS)) for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.route('https://tripezgo.com/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/__cap.html') return route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><body style="margin:0"><div id="m" style="width:${W}px;height:${H}px"></div><script type="module">
      import { CONFIG } from '/trip/config.js';
      const s = document.createElement('script'); s.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js'; s.crossOrigin = 'anonymous';
      s.onload = () => { mapkit.addEventListener('configuration-change', (e) => { if (e.status !== 'Initialized') return;
        const map = new mapkit.Map('m', { showsCompass: 'hidden', showsScale: 'hidden', showsZoomControl: false, showsMapTypeControl: false, showsUserLocationControl: false,
          isRotationEnabled: false, colorScheme: mapkit.Map.ColorSchemes.${theme === 'dark' ? 'Dark' : 'Light'} });
        map.region = new mapkit.CoordinateRegion(new mapkit.Coordinate(${CENTER[0]}, ${CENTER[1]}), new mapkit.CoordinateSpan(${SPAN[0]}, ${SPAN[1]}));
        window.__map = map; window.__ready = true; });
        mapkit.init({ authorizationCallback: (d) => d(CONFIG.mapkitToken), language: '${mkLang}' }); };
      document.head.append(s);</script>` });
    const p = path.join(root, decodeURIComponent(u.pathname));
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) });
  });
  await page.goto('https://tripezgo.com/__cap.html');
  await page.waitForFunction('window.__ready', null, { timeout: 30000 });
  await page.waitForTimeout(9000);
  const b = await page.evaluate(() => {
    const m = window.__map, r = m.element.getBoundingClientRect();
    const tl = m.convertPointOnPageToCoordinate(new DOMPoint(r.left, r.top)), br = m.convertPointOnPageToCoordinate(new DOMPoint(r.right, r.bottom));
    return { north: tl.latitude, west: tl.longitude, south: br.latitude, east: br.longitude };
  });
  bounds.zoomOk = true; bounds.bounds = b;
  const png = path.join(tmp, `${lang}-${theme}.png`);
  await page.locator('#m').screenshot({ path: png });
  const out = path.join(root, `screens/img/mapdemo-${lang}-${theme}.webp`);
  execFileSync('cwebp', ['-q', '58', '-m', '6', '-sharp_yuv', png, '-o', out], { stdio: 'ignore' });
  console.log(lang, theme, fs.statSync(out).size, JSON.stringify(b));
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(root, 'screens/data/mapdemo.json'), JSON.stringify({ w: W, h: H, ...bounds.bounds }) + '\n');

// 把 screens/*.html 渲染成截圖，或跟模擬器的基準圖比對。
//
//   node tools/screens.mjs render calendar "day=2" [--lang=en]   → screens/out/<lang>/calendar.png（1206×2622）
//   node tools/screens.mjs compare calendar "day=2"              → screens/out/compare-calendar.png
//                                                                    左：HTML　中：模擬器（screens/ref/zh/）　右：50% 疊圖
//   node tools/screens.mjs all                                     → 依 SHOTS 清單出四語全部截圖（screens/out/<lang>）
//   node tools/screens.mjs render calendar "day=2&device=ipad"     → screens/out/<lang>/ipad-calendar.png（2064×2752，iPad 13 吋）
//
// 基準圖要重拍：模擬器 iPhone 17 Pro、狀態列 9:41、日本時區啟動（SIMCTL_CHILD_TZ=Asia/Tokyo），
// 存成 screens/ref/<lang>/<name>.png。App 改了 UI 就重拍、重跑 compare，看哪幾張要跟著改。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screens = path.join(root, 'screens');
const LANGS = { zh: 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' };   // ko：只給商城截圖（tools/store），官網沒有韓文——只寫進 screens/out/ko

// 官網用到的畫面：[檔名, 頁面, 參數]
export const SHOTS = [
  ['calendar', 'calendar', 'day=2'],
  ['timeline', 'timeline', 'day=2'], ['overview', 'overview', ''], ['overview-files', 'overview', 'tab=files'], ['overview-todos', 'overview', 'tab=todos'],
  ['notes', 'notes', ''], ['note', 'note', ''], ['scan', 'scan', ''], ['fx', 'fx', ''], ['shop', 'shop', ''],
  ['toolbox', 'notes', 'menu=1'], ['scan-history', 'scan', 'hist=1'], ['fx-nokbd', 'fx', 'kbd=0'],
  ['event', 'event', ''], ['event-extra', 'event', 'extra=1'], ['event-airport', 'event', 'event=d1-airport&extra=1'], ['leg', 'leg', ''],
  ['map-live', 'map-live', ''], ['map-route', 'map-live', 'nav=0&today=2&start=2026-10-09'], ['map-mates', 'map-live', 'nav=0&today=2&start=2026-10-09&focus=mates'], ['map', 'map', ''], ['map-place', 'map-place', ''], ['map-store', 'map-store', ''], ['map-nav', 'map-nav', ''],
  ['share-ig', 'share-ig', ''], ['share-gmap', 'share-gmap', ''], ['inspiration-flow', 'share-web', 'step=post'], ['inspiration', 'inspiration', ''], ['apple-calendar', 'apple-calendar', ''], ['siri', 'siri', ''],
  ['members', 'members', ''], ['share-location', 'share-location', ''], ['lock', 'lock', ''], ['widget', 'widget', ''],
];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(screens, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(screens) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, () => resolve(srv));
  });
}

// MapKit JS 的 token 只認 https://tripezgo.com：頁面一律開在那個 origin，請求接到本機檔案（網站 repo 根目錄）。
// 其他第三方（MapKit 的 cdn 與圖磚）照常連網。
async function routeSite(page) {
  await page.route('https://tripezgo.com/**', (route) => {
    const p = path.join(root, decodeURIComponent(new URL(route.request().url()).pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(p)] || 'application/octet-stream', body: fs.readFileSync(p) });
  });
}
// iPad（query 帶 device=ipad）：13 吋直放 1032×1376pt，DPR 2 → 2064×2752（App Store iPad 13 吋的尺寸）。
// 另開一頁：DPR 開頁時就定了，不能跟 iPhone（402×874 @3x）共用。輸出檔名加 ipad- 前綴，跟 iPhone 那一張並存。
const isIpad = q => new URLSearchParams(q || '').get('device') === 'ipad';
const outName = (name, q) => `${isIpad(q) ? 'ipad-' : ''}${name}.png`;
let ipadPage = null;
async function pageFor(query) {
  if (!isIpad(query)) return page;
  if (!ipadPage) {
    ipadPage = await browser.newPage({ viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2 });
    ipadPage.on('pageerror', e => console.error('page error:', e.message));
    ipadPage.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
  }
  return ipadPage;
}
async function shoot(_page, port, name, query, lang) {
  const page = await pageFor(query);
  if (!page._routed) { await routeSite(page); page._routed = true; }
  const url = `https://tripezgo.com/screens/${name}.html?lang=${LANGS[lang]}&${query || ''}`;
  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
  return page.locator('#d').screenshot();
}

const [cmd, name, query = '', ...rest] = process.argv.slice(2);
const lang = (rest.find(a => a.startsWith('--lang=')) || '--lang=zh').slice(7);
const srv = await serve();
const port = srv.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));

try {
  if (cmd === 'render' || cmd === 'compare') {
    const png = await shoot(page, port, name, query, lang);
    const out = path.join(screens, 'out', lang);
    const file0 = outName(name, query);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, file0), png);
    console.log('wrote', path.join(out, file0));
    if (cmd === 'compare') {
      // iPad 的基準圖放 screens/ref/<lang>/ipad-<name>.png（真機 @2x 擷取）；畫面縮成一半寬並排
      const ref = path.join(screens, 'ref', lang, file0);
      const [w, h] = isIpad(query) ? [516, 688] : [402, 874];
      const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      const cmp = await browser.newPage({ viewport: { width: w * 3 + 20, height: h }, deviceScaleFactor: 2 });
      await cmp.setContent(`<body style="margin:0;display:flex;gap:10px;background:#333">
        <img src="${b64(path.join(out, file0))}" width="${w}">
        <img src="${b64(ref)}" width="${w}">
        <div style="position:relative;width:${w}px;height:${h}px">
          <img src="${b64(ref)}" width="${w}" style="position:absolute;inset:0">
          <img src="${b64(path.join(out, file0))}" width="${w}" style="position:absolute;inset:0;opacity:.5;mix-blend-mode:difference">
        </div></body>`);
      await cmp.waitForTimeout(200);
      const file = path.join(screens, 'out', `compare-${file0}`);
      await cmp.screenshot({ path: file });
      console.log('wrote', file);
    }
  } else if (cmd === 'all') {
    for (const l of Object.keys(LANGS)) for (const [file, page_, q] of SHOTS) {
      const png = await shoot(page, port, page_, q, l);
      const out = path.join(screens, 'out', l);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, `${file}.png`), png);
      console.log(l, file);
    }
  } else {
    console.log('usage: node tools/screens.mjs render|compare <name> [query] [--lang=zh|en|ja|ko] | all');
  }
} finally {
  await browser.close();
  srv.close();
}

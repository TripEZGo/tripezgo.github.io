/* App Store 商城截圖：用 screens/ 的 HTML 畫面直接產（2026-10-12）。
 *
 *   node tools/store/make.mjs <輸出目錄>      例：…/App 的 fastlane/screenshots
 *
 * 1. 每一格用 tools/screens.mjs render 出原始畫面 → tools/store/raw/<語系>/<裝置>/NN.png
 *    · iPhone：1206×2622（402×874 @3x）
 *    · iPad  ：2064×2752（1032×1376 @2x，query 加 device=ipad；版型見 screens/chrome.js 的 DEV）
 * 2. 打開 tools/store/shots.html?only=<裝置>-<語系>-NN（iPhone 1320×2868、iPad 2064×2752，DPR 1），等 data-ready，
 *    截成 <輸出目錄>/<語系>/NN-<名稱>.png（iPhone 6.9 吋）與 ipad-NN-<名稱>.png（iPad 13 吋）。
 * 中英日韓四語。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = process.argv[2];
if (!outDir) { console.log('usage: node tools/store/make.mjs <輸出目錄>'); process.exit(1); }

// [輸出檔名, screens 頁, query]：順序＝商店上的順序（第 10 張掛 Premium，見 shots.html）。iPad 同序、同名，query 多帶 device=ipad
const SLOTS = [
  ['calendar', 'calendar', 'day=2'],
  ['event', 'event', 'event=d1-airport&extra=1'],
  ['leg', 'leg', ''],
  ['overview', 'overview', ''],
  ['map', 'map-live', ''],
  ['share', 'share-gmap', 'step=ext'],
  ['library-tools', 'shop', ''],
  ['collaboration', 'members', ''],
  ['location-sharing', 'map-live', 'nav=0&today=2&start=2026-10-09&focus=mates'],
  ['live-activity', 'lock', ''],
];
const LOCALES = { zh: 'zh-Hant', en: 'en-US', ja: 'ja', ko: 'ko' };   // screens 的語言碼 → fastlane 的語系資料夾
const TEMPLATE_LANG = { zh: 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko' };  // shots.html 的語系碼
// screens.mjs 的輸出：iPad 那一張叫 ipad-<頁>.png；商城檔名 iPad 加 ipad- 前綴
const DEVICES = {
  iphone: { query: '', prefix: '', viewport: { width: 1320, height: 2868 } },
  ipad: { query: 'device=ipad', prefix: 'ipad-', viewport: { width: 2064, height: 2752 } },
};

// 地圖那幾格要連 MapKit 的圖磚，偶爾等不到 data-ready（15 秒）——同一格最多再試兩次
function render(page, query, l) {
  for (let k = 0; ; k++) {
    try {
      execFileSync('node', [path.join(root, 'tools/screens.mjs'), 'render', page, query, `--lang=${l}`], { cwd: root, stdio: 'ignore' });
      return;
    } catch (e) {
      if (k >= 2) throw e;
      console.log('retry', page, query, l);
    }
  }
}

for (const l of Object.keys(LOCALES)) {
  for (const [dev, D] of Object.entries(DEVICES)) {
    const raw = path.join(here, 'raw', TEMPLATE_LANG[l], dev);
    fs.mkdirSync(raw, { recursive: true });
    SLOTS.forEach(([, page, q], i) => {
      render(page, [q, D.query].filter(Boolean).join('&'), l);
      fs.copyFileSync(path.join(root, 'screens/out', l, `${D.prefix}${page}.png`), path.join(raw, `${String(i + 1).padStart(2, '0')}.png`));
      console.log('raw', l, dev, i + 1, page);
    });
  }
}

const browser = await chromium.launch();
let bad = 0;
try {
  for (const [dev, D] of Object.entries(DEVICES)) {
    const page = await browser.newPage({ viewport: D.viewport, deviceScaleFactor: 1 });
    for (const l of Object.keys(LOCALES)) {
      const dest = path.join(outDir, LOCALES[l]);
      fs.mkdirSync(dest, { recursive: true });
      for (const [i, [name]] of SLOTS.entries()) {
        const n = String(i + 1).padStart(2, '0');
        await page.goto(pathToFileURL(path.join(here, 'shots.html')).href + `?only=${dev}-${TEMPLATE_LANG[l]}-${n}`);
        await page.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
        await page.waitForFunction(() => [...document.images].every((im) => im.complete && im.naturalWidth));
        // decoding="async" 的大圖（iPad 原始畫面 1–3.5 MB）載完還沒解碼完就會截到一片白：等每一張 decode 完再截
        await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))));
        const fit = await page.locator('.shot').getAttribute('data-fit');
        if (fit !== 'ok') { bad++; console.error('版面沒排好（data-fit=fail）：', dev, l, n); }
        const file = `${D.prefix}${n}-${name}.png`;
        await page.locator('.shot').screenshot({ path: path.join(dest, file) });
        console.log('shot', LOCALES[l], file, fit);
      }
    }
    await page.close();
  }
} finally { await browser.close(); }
if (bad) process.exit(2);

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

// [輸出檔名, screens 頁, query, （選）第二張的頁與 query]：順序＝商店上的順序（1.6.0 起：主頁、行事曆、靈感、地圖、行程＋路程（兩台並排）、總覽、資料、共編、位置、即時動態；
// 第 10 張掛 Premium，見 shots.html）。iPad／Duo 同序、同名，query 多帶 device=。第 5 張有第二張：raw 檔存成 05a／05b。
// 主頁那一格的版面＝全站主頁同一份：即時動態（中）、待辦（小）、匯率（小）、總覽（中）；範本旅程、第 1 天＝2026-10-10。
const SLOTS = [
  ['home', 'home', 'layout=live:m,todo:s,fx:s,overview:m'],
  ['calendar', 'calendar', 'day=2'],
  ['inspiration', 'inspiration', ''],
  ['map', 'map-live', ''],
  ['event-leg', 'event', 'event=d1-airport&extra=1', ['leg', '']],
  ['overview', 'overview', ''],
  ['library', 'shop', ''],
  ['collaboration', 'members', ''],
  ['location-sharing', 'map-live', 'nav=0&today=2&focus=mates'],
  ['live-activity', 'lock', ''],
];
const LOCALES = { zh: 'zh-Hant', en: 'en-US', ja: 'ja', ko: 'ko' };   // screens 的語言碼 → fastlane 的語系資料夾
const TEMPLATE_LANG = { zh: 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko' };  // shots.html 的語系碼
// screens.mjs 的輸出：iPad 那一張叫 ipad-<頁>.png；商城檔名 iPad 加 ipad- 前綴
const DEVICES = {
  iphone: { query: '', prefix: '', viewport: { width: 1320, height: 2868 } },
  ipad: { query: 'device=ipad', prefix: 'ipad-', viewport: { width: 2064, height: 2752 } },
  // iPhone Duo 內側螢幕橫放：951×669pt @3x ＝ 2853×2007（screens/ 的 ?device=duo）；商城檔名加 duo- 前綴
  duo: { query: 'device=duo', prefix: 'duo-', viewport: { width: 2853, height: 2007 } },
};

// 地圖那幾格要連 MapKit 的圖磚，偶爾等不到 data-ready（15 秒）——同一格最多再試八次（MapKit 圖磚偶爾載不齊，iPad 的位置共享那格尤其常等不到）
function render(page, query, l) {
  for (let k = 0; ; k++) {
    try {
      execFileSync('node', [path.join(root, 'tools/screens.mjs'), 'render', page, query, `--lang=${l}`], { cwd: root, stdio: 'ignore' });
      return;
    } catch (e) {
      if (k >= 8) throw e;
      console.log('retry', page, query, l);
    }
  }
}

for (const l of Object.keys(LOCALES)) {
  for (const [dev, D] of Object.entries(DEVICES)) {
    const raw = path.join(here, 'raw', TEMPLATE_LANG[l], dev);
    fs.mkdirSync(raw, { recursive: true });
    SLOTS.forEach(([, page, q, second], i) => {
      const n = String(i + 1).padStart(2, '0');
      for (const [k, [pg, qq]] of (second ? [[`${n}a`, [page, q]], [`${n}b`, second]] : [[n, [page, q]]])) {
        if (process.env.RESUME && fs.existsSync(path.join(raw, `${k}.png`))) continue;   // RESUME=1：已經有的 raw 不重出（地圖那幾格偶爾要重跑）
        render(pg, [qq, D.query].filter(Boolean).join('&'), l);
        fs.copyFileSync(path.join(root, 'screens/out', l, `${D.prefix}${pg}.png`), path.join(raw, `${k}.png`));
        console.log('raw', l, dev, k, pg);
      }
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
      // 順序換過（1.4.0：分享那格併進靈感）：舊的 NN-名稱.png 不清掉就會跟新的並存，一起被傳上去
      const stale = new RegExp(`^${D.prefix}\\d\\d-[\\w-]+\\.png$`);   // 只清這個裝置自己的前綴：'' → NN-名稱.png、ipad-、duo-
      for (const f of fs.readdirSync(dest)) if (stale.test(f)) fs.rmSync(path.join(dest, f));
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

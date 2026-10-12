/* App Store 商城截圖：用 screens/ 的 HTML 畫面直接產（2026-10-12）。
 *
 *   node tools/store/make.mjs <輸出目錄>      例：…/App 的 fastlane/screenshots
 *
 * 1. 每一格用 tools/screens.mjs render 出 1206×2622 的原始畫面（截圖模式，402×874 @3x）→ tools/store/raw/<語系>/NN.png
 * 2. 打開 tools/store/shots.html?only=iphone-<語系>-NN（1320×2868、DPR 1），等 data-ready，截成 <輸出目錄>/<語系>/NN-<名稱>.png
 * 只出 iPhone 6.9 吋、中英日三語；韓文沒有 screens 畫面，iPad 畫面也不是這批 HTML 畫得出來的——兩者都不動。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = process.argv[2];
if (!outDir) { console.log('usage: node tools/store/make.mjs <輸出目錄>'); process.exit(1); }

// [輸出檔名, screens 頁, query]：順序＝商店上的順序（第 10 張掛 Premium，見 shots.html）
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
const LOCALES = { zh: 'zh-Hant', en: 'en-US', ja: 'ja' };   // screens 的語言碼 → fastlane 的語系資料夾
const TEMPLATE_LANG = { zh: 'zh-Hant', en: 'en', ja: 'ja' };  // shots.html 的語系碼

for (const l of Object.keys(LOCALES)) {
  const raw = path.join(here, 'raw', TEMPLATE_LANG[l]);
  fs.mkdirSync(raw, { recursive: true });
  SLOTS.forEach(([, page, q], i) => {
    execFileSync('node', [path.join(root, 'tools/screens.mjs'), 'render', page, q, `--lang=${l}`], { cwd: root, stdio: 'ignore' });
    fs.copyFileSync(path.join(root, 'screens/out', l, `${page}.png`), path.join(raw, `${String(i + 1).padStart(2, '0')}.png`));
    console.log('raw', l, i + 1, page);
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
let bad = 0;
try {
  for (const l of Object.keys(LOCALES)) {
    const dest = path.join(outDir, LOCALES[l]);
    fs.mkdirSync(dest, { recursive: true });
    for (const [i, [name]] of SLOTS.entries()) {
      const n = String(i + 1).padStart(2, '0');
      await page.goto(pathToFileURL(path.join(here, 'shots.html')).href + `?only=iphone-${TEMPLATE_LANG[l]}-${n}`);
      await page.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
      await page.waitForFunction(() => [...document.images].every((im) => im.complete && im.naturalWidth));
      const fit = await page.locator('.shot').getAttribute('data-fit');
      if (fit !== 'ok') { bad++; console.error('版面沒排好（data-fit=fail）：', l, n); }
      await page.locator('.shot').screenshot({ path: path.join(dest, `${n}-${name}.png`) });
      console.log('shot', LOCALES[l], `${n}-${name}.png`, fit);
    }
  }
} finally { await browser.close(); }
if (bad) process.exit(2);

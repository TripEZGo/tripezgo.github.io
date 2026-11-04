/* 只重出商城截圖的某一格（iPhone）：node tools/store/slot.mjs <格號 01–10> <輸出目錄>
 * 跟 make.mjs 同一條路（screens.mjs render → raw → shots.html 截圖），只是不重畫其他九格、也不碰 iPad／Duo。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const [n, outDir] = process.argv.slice(2);
const SLOTS = { '06': ['overview', 'overview-170', 'day=1', 'overview'] };   // [商城檔名, screens 頁, query, make.mjs 的 SLOTS 名]
if (!SLOTS[n] || !outDir) { console.log('usage: node tools/store/slot.mjs 06 <輸出目錄>'); process.exit(1); }
const [name, page, query] = SLOTS[n];
const LOCALES = { zh: 'zh-Hant', en: 'en-US', ja: 'ja', ko: 'ko' };
const TEMPLATE_LANG = { zh: 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko' };
for (const l of Object.keys(LOCALES)) {
  execFileSync('node', [path.join(root, 'tools/screens.mjs'), 'render', page, query, `--lang=${l}`], { cwd: root, stdio: 'ignore' });
  const raw = path.join(here, 'raw', TEMPLATE_LANG[l], 'iphone');
  fs.mkdirSync(raw, { recursive: true });
  fs.copyFileSync(path.join(root, 'screens/out', l, `${page}.png`), path.join(raw, `${n}.png`));
}
const browser = await chromium.launch();
let bad = 0;
try {
  const pg = await browser.newPage({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
  for (const l of Object.keys(LOCALES)) {
    const dest = path.join(outDir, LOCALES[l]);
    fs.mkdirSync(dest, { recursive: true });
    await pg.goto(pathToFileURL(path.join(here, 'shots.html')).href + `?only=iphone-${TEMPLATE_LANG[l]}-${n}`);
    await pg.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
    await pg.waitForFunction(() => [...document.images].every((im) => im.complete && im.naturalWidth));
    await pg.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))));
    const fit = await pg.locator('.shot').getAttribute('data-fit');
    if (fit !== 'ok') { bad++; console.error('版面沒排好：', l); }
    await pg.locator('.shot').screenshot({ path: path.join(dest, `${n}-${name}.png`) });
    console.log('shot', LOCALES[l], `${n}-${name}.png`, fit);
  }
} finally { await browser.close(); }
if (bad) process.exit(2);

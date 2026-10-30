// 宣傳圖（App Store 頁首／搜尋結果 5244×2950）1.6.0：稿 B 的排法（安全區中間主打那支＝主頁），主標＝slogan（各語系 subtitle.txt）。
// 流程同 App repo Scripts/store-creative/creative.mjs：等 data-ready、檢查 data-fit=ok，截 #art，再用 flatten.swift 壓成不帶 alpha 的 RGB PNG。
//   先跑 node tools/store/make.mjs out-160/_store（會把四語的 calendar／ipad-calendar／event／overview／home 渲進 screens/out/<語言>/）
//   node drafts-160/creative-160.mjs [輸出目錄=out-160/creative]   → <輸出目錄>/<fastlane 語系>.png
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { root } from './shot.mjs';

const FLATTEN = '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/feature-160-home/Scripts/store-creative/flatten.swift';
const LOCALES = { 'zh-Hant': 'zh-Hant', en: 'en-US', ja: 'ja', ko: 'ko' };
const outDir = path.resolve(process.argv[2] || path.join(root, 'out-160/creative'));
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let bad = 0;
try {
  const page = await browser.newPage({ viewport: { width: 5244, height: 2950 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  for (const [l, loc] of Object.entries(LOCALES)) {
    await page.goto(pathToFileURL(path.join(root, 'drafts-160/creative-160.html')).href + `?lang=${l}&site=${encodeURIComponent(pathToFileURL(root).href + '/')}`);
    await page.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
    const fit = await page.locator('#art').getAttribute('data-fit');
    if (fit !== 'ok') { bad++; console.error('主標排不下：', l); }
    const file = path.join(outDir, `${loc}.png`);
    await page.locator('#art').screenshot({ path: file });
    execFileSync('swift', [FLATTEN, file]);
    console.log('creative', loc, fit, await page.locator('#art').getAttribute('data-size'));
  }
} finally { await browser.close(); }
if (bad) process.exit(2);

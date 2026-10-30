// 宣傳圖（App Store 頁首／搜尋結果 5244×2950）草稿，zh-Hant。流程同 App repo Scripts/store-creative/creative.mjs：
// 等 data-ready、檢查 data-fit=ok，截 #art，再用 flatten.swift 壓成不帶 alpha 的 RGB PNG。
//   node drafts-160/creative-160.mjs         （先跑 sh drafts-160/render-creative-inputs.sh 與 node drafts-160/store-shots.mjs）
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { root } from './shot.mjs';

const FLATTEN = '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/feature-160-home/Scripts/store-creative/flatten.swift';
const browser = await chromium.launch();
let bad = 0;
try {
  const page = await browser.newPage({ viewport: { width: 5244, height: 2950 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  for (const variant of ['A', 'B']) {
    await page.goto(pathToFileURL(path.join(root, 'drafts-160/creative-160.html')).href + `?lang=zh-Hant&variant=${variant}&site=${encodeURIComponent(pathToFileURL(root).href + '/')}`);
    await page.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
    const fit = await page.locator('#art').getAttribute('data-fit');
    if (fit !== 'ok') { bad++; console.error('主標排不下：', variant); }
    const file = path.join(root, `drafts-160/png/creative-${variant}-zh-Hant.png`);
    await page.locator('#art').screenshot({ path: file });
    execFileSync('swift', [FLATTEN, file]);
    console.log('creative', variant, fit, await page.locator('#art').getAttribute('data-size'));
  }
} finally { await browser.close(); }
if (bad) process.exit(2);

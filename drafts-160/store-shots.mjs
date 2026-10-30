// 商店截圖草稿：01 主頁、05 掛在行程＋路程（兩支並排）。
//   node drafts-160/store-shots.mjs
// 1. 用 screens/ 的畫面出原始圖 drafts-160/png/raw-*.png（1206×2622）
// 2. 打開 drafts-160/shots-160.html?only=…（1320×2868，DPR 1），等 data-ready／data-fit，截成 drafts-160/png/store-*.png
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { root, routeSite } from './shot.mjs';

const png = path.join(root, 'drafts-160/png');
const RAW = [
  ['raw-home', 'home', 'layout=agenda:m,todo:s,fx:s,overview:m'],       // Premium、旅程中；精選版面：封面＋行程（中）、待辦（小）、匯率（小）、總覽；沒有廣告
  ['raw-event', 'event', 'event=d1-airport&extra=1'],
  ['raw-leg', 'leg', ''],
];
const SHOTS = [['iphone-zh-Hant-01', 'store-01-home'], ['iphone2-zh-Hant-02', 'store-05-event-leg']];

const browser = await chromium.launch();
try {
  const p = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
  p.on('pageerror', e => console.error('page error:', e.message));
  await routeSite(p);
  for (const [name, page, q] of RAW) {
    await p.goto(`https://tripezgo.com/screens/${page}.html?lang=zh-Hant-TW&${q}`);
    await p.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
    fs.writeFileSync(path.join(png, `${name}.png`), await p.locator('#d').screenshot());
    console.log('raw', name);
  }
  const s = await browser.newPage({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
  for (const [only, out] of SHOTS) {
    await s.goto(`file://${root}/drafts-160/shots-160.html?only=${only}`);
    await s.waitForSelector('html[data-ready="true"]', { timeout: 30000 });
    await s.waitForFunction(() => [...document.images].every(im => im.complete && im.naturalWidth));
    await s.evaluate(() => Promise.all([...document.images].map(im => im.decode().catch(() => {}))));
    const fit = await s.locator('.shot').getAttribute('data-fit');
    console.log(out, 'data-fit =', fit, 'gap', await s.locator('.shot').getAttribute('data-gap'));
    await s.locator('.shot').screenshot({ path: path.join(png, `${out}.png`) });
  }
} finally { await browser.close(); }

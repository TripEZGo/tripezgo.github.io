// demo-check.mjs 的輸出 → 聯絡表（每段一格：中間影格＋最後影格並排）：
//   node drafts-160/check-sheet.mjs <影格資料夾> <lang> <theme> <out.png> [cellW=150] [demos 逗號]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [dir, lang, theme, out, cw = '150', demosArg = ''] = process.argv.slice(2);
const names = [...new Set(fs.readdirSync(dir).filter(f => f.includes(`--${lang}--${theme}--`)).map(f => f.split('--')[0]))];
const demos = demosArg ? demosArg.split(',') : names;
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
const cells = demos.map(d => `<div style="margin:4px"><div>${d}</div><div style="display:flex;gap:3px"><img src="${b64(`${d}--${lang}--${theme}--mid.png`)}" width="${cw}"><img src="${b64(`${d}--${lang}--${theme}--last.png`)}" width="${cw}"></div></div>`).join('');
const html = `<body style="margin:0;background:#555;color:#fff;font:11px sans-serif;display:flex;flex-wrap:wrap;width:${(+cw * 2 + 20) * 4}px;padding:6px">${cells}</body>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: (+cw * 2 + 20) * 4 + 12, height: 400 } });
await page.setContent(html);
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out, demos.length);

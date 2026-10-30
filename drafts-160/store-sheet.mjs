// 商店截圖聯絡表：node drafts-160/store-sheet.mjs <資料夾(含各語系子資料夾)> <前綴: ''|ipad-|duo-> <langs 逗號> <out.png> [cellW=160] [only=NN 逗號（預設全部）]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [dir, prefix = '', langsArg = 'zh-Hant', out, cw = '160', only = ''] = process.argv.slice(2);
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const rows = langsArg.split(',').map(l => {
  const d = path.join(dir, l);
  const files = fs.readdirSync(d).filter(f => f.startsWith(prefix) && /^(ipad-|duo-)?\d\d-/.test(f) && (prefix || !/^(ipad-|duo-)/.test(f))).sort()
    .filter(f => !only || only.split(',').some(n => f.replace(prefix, '').startsWith(n)));
  return `<div style="margin:6px 0"><b>${l}</b><div style="display:flex;gap:4px">${files.map(f => `<div><img src="${b64(path.join(d, f))}" width="${cw}" style="display:block"><span style="font-size:9px">${f}</span></div>`).join('')}</div></div>`;
}).join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1800, height: 400 } });
await page.setContent(`<body style="margin:6px;background:#666;color:#fff;font:11px sans-serif">${rows}</body>`);
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out);

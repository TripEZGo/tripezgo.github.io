// 影格目錄 → 一張聯絡表：node drafts-160/sheet.mjs <dir> <out.png> [cols=6] [cellW=200] [from=0] [to=999]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [dir, out, cols = '6', cw = '200', from = '0', to = '999'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort().slice(+from, +to);
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
const html = `<body style="margin:0;background:#444;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:6px;padding:6px;font:11px sans-serif;color:#fff">${files.map(f => `<div><img src="${b64(f)}" width="${cw}" style="display:block;background:#fff"><div>${f.replace('.png', '')}</div></div>`).join('')}</body>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: (+cw + 6) * +cols + 6, height: 400 } });
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out, files.length);

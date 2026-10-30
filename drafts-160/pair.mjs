// plan 新舊關鍵影格並排：node drafts-160/pair.mjs <舊影格目錄> <新影格目錄> <out.png> <idx,idx,...>
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [oldDir, newDir, out, idxs] = process.argv.slice(2);
const pick = (dir, i) => { const f = fs.readdirSync(dir).filter(x => x.endsWith('.png')).sort()[+i]; return 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64'); };
const ids = idxs.split(',');
const row = (dir, label) => `<div class="r"><b>${label}</b>${ids.map(i => `<img src="${pick(dir, i)}">`).join('')}</div>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 4 * 330 + 120, height: 600 }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#fff;font:600 16px -apple-system,sans-serif"><style>.r{display:flex;gap:10px;padding:10px;align-items:flex-start}.r b{width:100px;flex:none;padding-top:8px}img{width:320px;border:1px solid #ddd}</style>${row(oldDir, '舊版（1.5.x 分頁列）')}${row(newDir, '新版（1.6.0 五分頁）')}</body>`);
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out);

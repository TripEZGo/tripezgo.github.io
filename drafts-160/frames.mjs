// 從打包好的示範（drafts-160/build，file://）擷取影格。
//   node drafts-160/frames.mjs <demo> <outDir> <everyMs> <totalMs> [lang=zh-Hant] [extra query]
// 例：node drafts-160/frames.mjs home /tmp/x 500 12000
// 視窗大小＝crop 之後的可見範圍（safe：402×820；box：該示範的 box 寬高），DPR 3。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const here = path.dirname(fileURLToPath(import.meta.url));
const [demo, out, every = '500', total = '12000', lang = 'zh-Hant', extra = ''] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(path.join(process.env.BUILD || path.join(here, 'build'), 'manifest.json'), 'utf8'));
const BOX = { 'pw-home-pages': [402, 500] };
const [w, h] = BOX[demo] || [402, 820];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3 });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(`file://${process.env.BUILD || path.join(here, 'build')}/demo.html?demo=${demo}&lang=${lang}&theme=light${extra ? '&' + extra : ''}`);
const t0 = Date.now();
let n = 0;
while (Date.now() - t0 < +total) {
  const t = Date.now() - t0;
  await page.screenshot({ path: path.join(out, `${String(n++).padStart(3, '0')}-${String(t).padStart(5, '0')}.png`) });
  await page.waitForTimeout(Math.max(0, +every - (Date.now() - t0 - t)));
}
console.log('kinds', JSON.stringify(manifest.kinds[demo]), 'frames', n);
await browser.close();

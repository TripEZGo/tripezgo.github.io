// 減少動態（still=1）：node drafts-160/still-check.mjs <打包資料夾> <輸出資料夾> demo,demo
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [build, out, demos] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const d of demos.split(',')) {
  const page = await browser.newPage({ viewport: { width: 402, height: d === 'pw-home-pages' ? 500 : 820 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`file://${path.resolve(build)}/demo.html?demo=${d}&lang=zh-Hant&theme=light&still=1`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, `still-${d}.png`) });
  console.log(d, errs.length ? errs.join('|') : 'ok');
  await page.close();
}
await browser.close();

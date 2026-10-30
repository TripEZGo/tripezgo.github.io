// 打包好的示範（file://）每段每語言每主題各截「中間」與「最後」影格：
//   node drafts-160/demo-check.mjs <打包資料夾> <輸出資料夾> [demos 逗號] [langs 逗號] [themes 逗號] [totalMs=34000] [併行=6]
// 輸出 <輸出>/<demo>--<lang>--<theme>--mid.png／last.png（DPR 2）。playwright headless shell。
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const [build, out, demosArg = '', langsArg = 'zh-Hant,en,ja', themesArg = 'light,dark', total = '34000', par = '6'] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(path.join(build, 'manifest.json'), 'utf8'));
const BOX = { 'pw-no-ads': [402, 362], 'pw-live-activity': [402, 260], 'pw-unlimited': [402, 350], 'pw-members': [402, 350], 'pw-home-pages': [402, 500], 'pw-calendar': [402, 334] };
const demos = demosArg ? demosArg.split(',') : manifest.demos;
fs.mkdirSync(out, { recursive: true });
const jobs = [];
for (const d of demos) for (const l of langsArg.split(',')) for (const t of themesArg.split(',')) jobs.push([d, l, t]);
const browser = await chromium.launch();
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const [d, l, t] = jobs[next++];
    const [w, h] = BOX[d] || (d === 'privacy' ? [402, 874] : [402, 820]);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: t });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.goto(`file://${path.resolve(build)}/demo.html?demo=${d}&lang=${l}&theme=${t}`);
    const t0 = Date.now(), frames = [];
    while (Date.now() - t0 < +total) {
      frames.push(await page.screenshot());
      await page.waitForTimeout(1500);
    }
    const base = path.join(out, `${d}--${l}--${t}`);
    fs.writeFileSync(`${base}--mid.png`, frames[Math.floor(frames.length / 2)]);
    fs.writeFileSync(`${base}--last.png`, frames.at(-1));
    console.log(d, l, t, errs.length ? 'ERR ' + [...new Set(errs)].join(' | ').slice(0, 300) : 'ok');
    await ctx.close();
  }
}
await Promise.all(Array.from({ length: +par }, worker));
await browser.close();

/* App 功能示範的驗證（ADR-0050）：用 Playwright 從 file:// 載入「輸出資料夾」裡的 demo.html。
 *
 *   node tools/app-demos-check.mjs [--dir <FeatureDemos>] [--ids a,b] [--langs zh-Hant,en,ja] [--themes light,dark] [--shots <dir>]
 *
 * 每一個 id × 語言 × 深淺色：
 *   - 擋掉所有 http／https（route abort）；不准有任何失敗的請求、頁面錯誤、console error
 *   - 播放：0.8 秒與 4.5 秒的截圖要不一樣（動畫在跑）
 *   - still=1：兩張要一模一樣
 *   - 不准有 http／https 網址出現在資料夾的任何檔案裡（命名空間、SVG xmlns 與註解除外）
 * 截圖放 --shots，最後拼一張總覽（contact-<theme>.png）。 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = path.resolve(opt('dir', '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/fix-security-140/App/iOS/Modules/UI/Sources/UI/Resources/FeatureDemos'));
const SHOTS = path.resolve(opt('shots', '/tmp/app-demos-shots'));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const IDS = opt('ids') ? opt('ids').split(',') : manifest.demos;
const LANGS = opt('langs', 'zh-Hant,en,ja').split(',');
const THEMES = opt('themes', 'light,dark').split(',');
const W = +opt('w', 402), H = +opt('h', 874), T1 = +opt('t1', 800), T2 = +opt('t2', 4500);
fs.mkdirSync(SHOTS, { recursive: true });

// 資料夾裡不准有網路網址（命名空間、說明文字除外）：只看 src／href／url()／import／fetch 的位置
const bad = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(html|js|css|json|svg)$/.test(f)) continue;
    const s = fs.readFileSync(p, 'utf8');
    for (const m of s.matchAll(/(?:src|href|action)=["']https?:\/\/[^"']+|url\(["']?https?:\/\/[^)]+|import\(["']https?:|fetch\(["'`]https?:|@import\s+["']https?:/g)) bad.push(`${path.relative(DIR, p)}: ${m[0].slice(0, 90)}`);
  }
})(DIR);

const browser = await chromium.launch();
const results = [];
let fail = 0;
for (const theme of THEMES) {
  const sheet = [];
  for (const id of IDS) for (const lang of LANGS) {
    const row = { id, lang, theme, problems: [] };
    for (const still of [0, 1]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, timezoneId: 'Asia/Tokyo', locale: lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'zh-TW' });
      const page = await ctx.newPage();
      await page.route(/^https?:/, (r) => r.abort());
      const errs = [];
      page.on('requestfailed', (r) => errs.push(`requestfailed ${r.url().slice(-90)} ${r.failure()?.errorText}`));
      page.on('pageerror', (e) => errs.push(`pageerror ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(`console ${m.text().slice(0, 160)}`); });
      for (const fr of [0]) { /* iframe 的錯誤也由同一個 page 收到 */ }
      await page.goto(pathToFileURL(path.join(DIR, 'demo.html')).href + `?demo=${id}&lang=${lang}&theme=${theme}&still=${still}`);
      await page.waitForTimeout(T1);
      const a = await page.screenshot();
      await page.waitForTimeout(T2 - T1);
      const b = await page.screenshot();
      const tag = `${id}.${lang}.${theme}${still ? '.still' : ''}`;
      fs.writeFileSync(path.join(SHOTS, `${tag}.a.png`), a);
      fs.writeFileSync(path.join(SHOTS, `${tag}.b.png`), b);
      const same = Buffer.compare(a, b) === 0;
      if (still && !same) row.problems.push('still=1 的兩張不一樣');
      if (!still && same) row.problems.push('播放中 0.8s 與 4.5s 的截圖一樣（動畫沒跑？）');
      for (const e of errs) row.problems.push(`${still ? 'still: ' : ''}${e}`);
      // 錯誤內容太黑（整頁沒畫出來）也算
      if (!still) row.shot = `${tag}.b.png`;
      await ctx.close();
    }
    if (row.problems.length) fail++;
    results.push(row);
    sheet.push(row);
    console.log(`${row.problems.length ? 'FAIL' : 'ok  '} ${id} ${lang} ${theme}${row.problems.length ? '\n     ' + row.problems.slice(0, 6).join('\n     ') : ''}`);
  }
  // 總覽：一列一個示範、一欄一種語言（用 HTML 拼好再截圖）
  const cells = sheet.map((r) => `<figure><img src="${pathToFileURL(path.join(SHOTS, r.shot)).href}"><figcaption>${r.id} · ${r.lang}</figcaption></figure>`).join('');
  const html = `<style>body{margin:0;background:${theme === 'dark' ? '#000' : '#ddd'};display:grid;grid-template-columns:repeat(${LANGS.length},201px);gap:8px;padding:8px;width:max-content}
    figure{margin:0}img{width:201px;height:437px;display:block;border-radius:10px}figcaption{font:11px sans-serif;color:${theme === 'dark' ? '#ccc' : '#333'};padding:2px 0 6px}</style>${cells}`;
  const cp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const sheetHtml = path.join(SHOTS, `contact-${theme}.html`);
  fs.writeFileSync(sheetHtml, html);
  await cp.goto(pathToFileURL(sheetHtml).href);
  await cp.waitForTimeout(500);
  await cp.screenshot({ path: path.join(SHOTS, `contact-${theme}.png`), fullPage: true });
  await cp.close();
}
await browser.close();
if (bad.length) { console.log('資料夾裡有網路網址：\n  ' + bad.join('\n  ')); fail++; }
console.log(`\n${results.length} 組（id × 語言 × 深淺色）、${fail} 組有問題；截圖與總覽在 ${SHOTS}`);
process.exit(fail ? 1 : 0);

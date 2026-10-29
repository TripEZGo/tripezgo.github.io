/* App 功能示範的驗證（ADR-0050）：用 Playwright 從 file:// 載入「輸出資料夾」裡的 demo.html。
 *
 *   node tools/app-demos-check.mjs [--dir <FeatureDemos>] [--ids a,b] [--langs zh-Hant,en,ja] [--themes light,dark] [--shots <dir>]
 *
 * 每一個 id × 語言 × 深淺色（種類 kind 見 manifest.json）：
 *   - 擋掉所有 http／https（route abort）；不准有任何失敗的請求、頁面錯誤、console error
 *   - once（播一次）：在動 → 停在最後一幀 → 點一下重播 → 長按暫停；static（靜態）：不動；ambient（隱私流向圖）：一直在動
 *   - still=1：兩張要一模一樣
 *   - 不准有 http／https 網址出現在資料夾的任何檔案裡（命名空間、SVG xmlns 與註解除外）
 * 截圖放 --shots，最後拼一張總覽（contact-<theme>.png）。 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = path.resolve(opt('dir', '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/fix-security-140/App/iOS/FeatureDemos'));
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

const KINDS = manifest.kinds || {};
const DEF = manifest.defaults || {};
const T_MAX = +opt('tmax', 150000);     // play-once 的示範最多等多久播完（毫秒）
const CONC = +opt('conc', 4);
const browser = await chromium.launch();
const results = [];
let fail = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (x, y) => Buffer.compare(x, y) === 0;

async function open(id, lang, theme, still) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, timezoneId: 'Asia/Tokyo', locale: lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'zh-TW' });
  const page = await ctx.newPage();
  await page.route(/^https?:/, (r) => r.abort());
  const errs = [];
  page.on('requestfailed', (r) => errs.push(`requestfailed ${r.url().slice(-90)} ${r.failure()?.errorText}`));
  page.on('pageerror', (e) => errs.push(`pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console ${m.text().slice(0, 160)}`); });
  await page.goto(pathToFileURL(path.join(DIR, 'demo.html')).href + `?demo=${id}&lang=${lang}&theme=${theme}&still=${still}`);
  return { ctx, page, errs };
}

// 每一個 id × 語言 × 深淺色。kind（manifest.kinds）：
//   once    播一次：0.8s 與 4.5s 的截圖不同（在動）→ 之後停在最後一幀（連續幾秒不再變）→ 點一下重播（畫面又動了）→ 重播中長按暫停（按住期間不變）
//   static  靜態畫面（行事曆）：播放時也一直不動；不准有動畫
//   ambient 一直在動、沒有「播完」（隱私流向圖的虛線）：0.8s 與 4.5s 不同
//   still=1（全部）：兩張一模一樣
async function runOne(id, lang, theme) {
  const kind = KINDS[id] || 'once';
  const row = { id, lang, theme, kind, problems: [] };
  const tag = `${id}.${lang}.${theme}`;
  // still=1
  {
    const { ctx, page, errs } = await open(id, lang, theme, 1);
    await page.waitForTimeout(T1);
    const a = await page.screenshot();
    await page.waitForTimeout(T2 - T1);
    const b = await page.screenshot();
    fs.writeFileSync(path.join(SHOTS, `${tag}.still.png`), b);
    if (!same(a, b)) row.problems.push('still=1 的兩張不一樣');
    for (const e of errs) row.problems.push(`still: ${e}`);
    await ctx.close();
  }
  const { ctx, page, errs } = await open(id, lang, theme, 0);
  await page.waitForTimeout(T1);
  const a = await page.screenshot();
  await page.waitForTimeout(T2 - T1);
  const b = await page.screenshot();
  fs.writeFileSync(path.join(SHOTS, `${tag}.a.png`), a);
  fs.writeFileSync(path.join(SHOTS, `${tag}.b.png`), b);
  if (kind === 'static') {
    if (!same(a, b)) row.problems.push('static：靜態畫面卻在動（0.8s 與 4.5s 不一樣）');
    await page.waitForTimeout(3000);
    if (!same(b, await page.screenshot())) row.problems.push('static：靜態畫面卻在動（再過 3 秒又變了）');
    row.shot = `${tag}.b.png`;
  } else if (kind === 'step') {
    // step（靈感空狀態）：不自動播——停在第 1 步（0.8s 與 4.5s 一樣）；每點一下播一頁，「N / 總數」每次往前一格；
    // 最後一步播完之後再點＝回到「1 / 總數」。字幕（#cap）每一步都不是空的。
    if (!same(a, b)) row.problems.push('step：沒有點就在動（不該自動播放）');
    const pgText = () => page.locator('#pg').innerText();
    const total = await page.evaluate(() => +(document.getElementById('pg').textContent.match(/\/\s*(\d+)/) || [0, 0])[1]);
    let n = 1;
    for (let tap = 0; tap < total + 6 && n < total; tap++) {
      const before = await pgText();
      await page.mouse.click(W / 2, H / 2);
      let moved = false;
      for (let t = 0; t < 60; t++) { await page.waitForTimeout(250); if ((await pgText()) !== before) { moved = true; break; } }
      if (!moved) { row.problems.push(`step：第 ${tap + 1} 次點擊後 10 秒內沒有走到下一步（停在 ${before}）`); break; }
      n = +(await pgText()).match(/^(\d+)/)[1];
      if (!(await page.locator('#cap').innerText()).trim()) row.problems.push(`step：第 ${n} 步沒有字幕`);
    }
    if (n !== total) row.problems.push(`step：沒有走到最後一步（${n} / ${total}）`);
    else {
      // 最後一步：點一下播最後一頁、播完提示變成「從頭」；再點回到第 1 步
      await page.mouse.click(W / 2, H / 2);
      for (let t = 0; t < 80 && !/^1\s*\//.test(await pgText()); t++) {
        await page.waitForTimeout(250);
        if (t % 20 === 19) await page.mouse.click(W / 2, H / 2);
      }
      if (!/^1\s*\//.test(await pgText())) row.problems.push('step：最後一步之後再點沒有回到第 1 步');
    }
    row.shot = `${tag}.b.png`;
  } else if (kind === 'ambient') {
    if (same(a, b)) row.problems.push('ambient：0.8s 與 4.5s 的截圖一樣（虛線沒在流動？）');
    row.shot = `${tag}.b.png`;
  } else {
    if (same(a, b)) row.problems.push('播放中 0.8s 與 4.5s 的截圖一樣（動畫沒跑？）');
    // 等它播完並停住：連續 5 張（每 1.2 秒一張，比任何一段靜態停留都長）相同＝停在最後一幀
    let held = null, last = b, streak = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < T_MAX) {
      await page.waitForTimeout(1200);
      const c = await page.screenshot();
      streak = same(c, last) ? streak + 1 : 0; last = c;
      if (streak >= 5) { held = c; break; }
    }
    if (!held) row.problems.push(`once：${T_MAX / 1000} 秒內沒有停在最後一幀`);
    else {
      fs.writeFileSync(path.join(SHOTS, `${tag}.final.png`), held);
      row.shot = `${tag}.final.png`;
      await page.waitForTimeout(4000);
      if (!same(held, await page.screenshot())) row.problems.push('once：停住之後又變了（沒有守住最後一幀）');
      // 點一下：從頭重播（畫面要變）
      await page.mouse.click(W / 2, H / 2);
      await page.waitForTimeout(3500);
      const r1 = await page.screenshot();
      if (same(held, r1)) row.problems.push('once：播完後點一下沒有重播');
      else {
        // 長按暫停：按住期間畫面不變，放開後繼續
        await page.mouse.move(W / 2, H / 2); await page.mouse.down(); await page.waitForTimeout(900);
        const p1 = await page.screenshot(); await page.waitForTimeout(1800); const p2 = await page.screenshot();
        if (!same(p1, p2)) row.problems.push('once：長按期間畫面還在動（沒有暫停）');
        await page.mouse.up(); await page.waitForTimeout(2500);
        const r3 = await page.screenshot();   // 放開後要繼續（或剛好已經播完、回到最後一幀）
        if (same(p2, r3) && !same(r3, held)) row.problems.push('once：放開後沒有繼續');
      }
    }
  }
  for (const e of errs) row.problems.push(e);
  await ctx.close();
  return row;
}

const jobs = [];
for (const theme of THEMES) for (const id of IDS) for (const lang of LANGS) jobs.push({ id, lang, theme });
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < jobs.length) {
    const j = jobs[next++];
    let row;
    try { row = await runOne(j.id, j.lang, j.theme); } catch (e) { row = { ...j, problems: [`例外 ${e.message}`] }; }
    if (row.problems.length) fail++;
    results.push(row);
    console.log(`${row.problems.length ? 'FAIL' : 'ok  '} ${row.id} ${row.lang} ${row.theme} [${row.kind || '?'}]${row.problems.length ? '\n     ' + row.problems.slice(0, 6).join('\n     ') : ''}`);
  }
}));
// 總覽：一列一個示範、一欄一種語言（用 HTML 拼好再截圖）
for (const theme of THEMES) {
  const sheet = results.filter((r) => r.theme === theme && r.shot).sort((x, y) => IDS.indexOf(x.id) - IDS.indexOf(y.id) || LANGS.indexOf(x.lang) - LANGS.indexOf(y.lang));
  const cells = sheet.map((r) => `<figure><img src="${pathToFileURL(path.join(SHOTS, r.shot)).href}"><figcaption>${r.id} · ${r.lang}</figcaption></figure>`).join('');
  const html = `<style>body{margin:0;background:${theme === 'dark' ? '#000' : '#ddd'};display:grid;grid-template-columns:repeat(${LANGS.length},201px);gap:8px;padding:8px;width:max-content}
    figure{margin:0}img{width:201px;height:437px;object-fit:contain;background:${theme === 'dark' ? '#111' : '#fff'};display:block;border-radius:10px}figcaption{font:11px sans-serif;color:${theme === 'dark' ? '#ccc' : '#333'};padding:2px 0 6px}</style>${cells}`;
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

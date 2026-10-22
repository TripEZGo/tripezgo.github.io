/* App 功能示範：出現到第一個動作（time-to-first-motion）與整段長度。
 *
 *   node tools/app-demos-ttfm.mjs [--dir <FeatureDemos>] [--ids a,b] [--lang en] [--theme light]
 *
 * 用 CDP screencast 抓畫面變化的時間點（只在畫面真的變了才有新的一張）：
 *   cold   載入後直接播：t0＝殼收到第一個 tz-ready（畫面已畫好）的那一刻；first＝t0 之後第一次畫面變化
 *   act    App 預載再輪到：載入時就 pause()（hold=1 也會自己停），停 3 秒後 play()；t0＝play() 那一刻
 *          parked＝停著的那 3 秒裡畫面變了幾次（要是 0：停在第一幀）
 *   total  從 t0 到最後一次畫面變化（之後連續 6 秒不再變）＝整段長度 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = path.resolve(opt('dir', '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/fix-security-140/App/iOS/FeatureDemos'));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const IDS = (opt('ids') ? opt('ids').split(',') : manifest.demos).filter((id) => (manifest.kinds[id] || 'once') === 'once');
const LANG = opt('lang', 'en'), THEME = opt('theme', 'light');
const browser = await chromium.launch();

async function measure(id, scenario) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, timezoneId: 'Asia/Tokyo' });
  const page = await ctx.newPage();
  await page.route(/^https?:/, (r) => r.abort());
  await page.addInitScript((act) => {
    if (window !== window.top) return;
    window.__tReady = 0;
    addEventListener('message', (e) => { if (e.data && e.data.type === 'tz-ready' && !window.__tReady) window.__tReady = Date.now(); });
    if (act) document.addEventListener('DOMContentLoaded', () => window.tzDemo && window.tzDemo.pause());
  }, scenario === 'act');
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp * 1000, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 40, maxWidth: 201, maxHeight: 437, everyNthFrame: 1 });
  await page.goto(pathToFileURL(path.join(DIR, 'demo.html')).href + `?demo=${id}&lang=${LANG}&theme=${THEME}&still=0&hold=${scenario === 'act' ? 1 : 0}`);
  await page.waitForFunction(() => window.__tReady > 0, null, { timeout: 15000 });
  const tReady = await page.evaluate(() => window.__tReady);
  let t0 = tReady, parked = 0;
  if (scenario === 'act') {
    await page.waitForTimeout(3000);
    const before = frames.length;
    t0 = await page.evaluate(() => { const t = Date.now(); window.tzDemo.play(); return t; });
    parked = new Set(frames.slice(0, before).filter((f) => f.t > tReady + 500).map((f) => f.d)).size - 1;
    if (parked < 0) parked = 0;
  }
  // 等到連續 6 秒不再變（最多 150 秒）
  const start = Date.now();
  while (Date.now() - start < 150000) {
    await page.waitForTimeout(1000);
    const last = frames.filter((f) => f.t > t0).at(-1);
    let lastChange = 0;
    for (let i = 1; i < frames.length; i++) if (frames[i].d !== frames[i - 1].d) lastChange = frames[i].t;
    if (Date.now() - Math.max(lastChange, t0) > 6000 && last) break;
  }
  const base = [...frames].reverse().find((f) => f.t <= t0) || frames[0];
  const first = frames.find((f) => f.t > t0 && f.d !== base.d);
  let lastChange = t0;
  for (let i = 1; i < frames.length; i++) if (frames[i].t > t0 && frames[i].d !== frames[i - 1].d) lastChange = frames[i].t;
  await ctx.close();
  return { first: first ? Math.round(first.t - t0) : null, total: Math.round(lastChange - t0), parked };
}

console.log(`id\tcold-first(ms)\tcold-total(s)\tact-first(ms)\tact-total(s)\tparked-changes`);
for (const id of IDS) {
  const c = await measure(id, 'cold'), a = await measure(id, 'act');
  console.log(`${id}\t${c.first}\t${(c.total / 1000).toFixed(1)}\t${a.first}\t${(a.total / 1000).toFixed(1)}\t${a.parked}`);
}
await browser.close();

// 交付頁 drafts-160/final.html：node drafts-160/final.mjs
// 商店截圖（每種裝置 zh-Hant 全 10 張＋其他語 01）、宣傳圖四語、每段動畫 zh-Hant 淺色最後影格、四處主頁對照。
import fs from 'node:fs';
import path from 'node:path';
import { root } from './shot.mjs';

const R = (p) => path.relative(path.join(root, 'drafts-160'), path.join(root, p));
const NAMES = ['home', 'calendar', 'inspiration', 'map', 'event-leg', 'overview', 'library', 'collaboration', 'location-sharing', 'live-activity'];
const LOCS = ['zh-Hant', 'en-US', 'ja', 'ko'];
const fig = (src, cap, cls = '') => `<figure class="${cls}"><img src="${src}" loading="lazy"><figcaption>${cap}</figcaption></figure>`;
const demos = JSON.parse(fs.readFileSync(path.join(root, 'out-160/FeatureDemos/manifest.json'), 'utf8')).demos;

const store = (title, dir, prefix, cls) => {
  const row = (loc) => NAMES.map((n, i) => `${prefix}${String(i + 1).padStart(2, '0')}-${n}.png`).map((f, i) => fig(R(`${dir}/${loc}/${f}`), `${loc} ${f}`, cls));
  return `<h3>${title}</h3><div class="row">${row('zh-Hant').join('')}</div>
  <p class="lead">其他語系的 01 主頁</p><div class="row">${LOCS.slice(1).map((l) => fig(R(`${dir}/${l}/${prefix}01-home.png`), `${l} ${prefix}01-home.png`, cls)).join('')}</div>`;
};

const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>TripEZGo 1.6.0 CP5 成品</title>
<style>
  :root { --paper:#fbf8f4; --ink:#241d17; --taupe:#7c6f63; --line:#dbd5cd; }
  body { margin:0; padding:32px 40px 80px; background:var(--paper); color:var(--ink); font:15px/1.55 -apple-system,"PingFang TC",sans-serif; }
  h1 { font-size:26px; margin:0 0 6px; } h2 { font-size:21px; margin:56px 0 6px; padding-top:20px; border-top:1px solid var(--line); } h3 { font-size:16px; margin:26px 0 6px; }
  p.lead { color:var(--taupe); margin:4px 0 10px; max-width:980px; }
  .row { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start; }
  figure { margin:0; } figcaption { font-size:12px; color:var(--taupe); margin-top:4px; max-width:220px; word-break:break-all; }
  img { display:block; border:1px solid var(--line); background:#fff; }
  .ph img { width:220px; } .pad img { width:300px; } .duo img { width:420px; } .wide img { width:760px; } .fr img { width:180px; } .frb img { width:180px; }
</style></head><body>
<h1>TripEZGo 1.6.0 CP5 成品</h1>
<p class="lead">全部來自 out-160/。商店截圖：iPhone 6.9 吋 1320×2868、iPad 13 吋 2064×2752、Duo 2853×2007；宣傳圖 5244×2950。</p>

<h2>0　四處主頁對照</h2>
<p class="lead">同一趟旅程、日期 10/10、版面＝即時動態（中）＋待辦（小）＋匯率（小）＋總覽。左起：引導頁 home 動畫（最後影格）、付費牆 pw-home-pages（第 1 頁）、官網首頁主頁段（home.webp）、商店 01、宣傳圖（中間主打那支）。</p>
<div class="row">
  ${fig(R('drafts-160/check/home--zh-Hant--light--last.png'), '引導頁 home（動畫最後影格；匯率與待辦已對調）', 'fr')}
  ${fig(R('drafts-160/check/pw-home-pages--zh-Hant--light--first.png'), '付費牆 pw-home-pages 第 1 頁', 'fr')}
  ${fig(R('assets/img/shots/v2/zh/home.webp'), '官網首頁主頁段', 'fr')}
  ${fig(R('out-160/screenshots/zh-Hant/01-home.png'), '商店 01', 'fr')}
  ${fig(R('out-160/creative/zh-Hant.png'), '宣傳圖（zh-Hant）', 'wide')}
</div>

<h2>1　商店截圖</h2>
${store('iPhone 6.9 吋', 'out-160/screenshots', '', 'ph')}
${store('iPad 13 吋', 'out-160/screenshots', 'ipad-', 'pad')}
${store('iPhone Duo（內側螢幕橫放）', 'out-160/screenshots-duo', 'duo-', 'duo')}

<h2>2　宣傳圖（四語）</h2>
<div class="row">${LOCS.map((l) => fig(R(`out-160/creative/${l}.png`), l, 'wide')).join('')}</div>

<h2>3　動畫：zh-Hant 淺色最後影格</h2>
<div class="row">${demos.map((d) => fig(R(`drafts-160/check/${d}--zh-Hant--light--last.png`), d, 'fr')).join('')}</div>
<h3>中間影格</h3>
<div class="row">${demos.map((d) => fig(R(`drafts-160/check/${d}--zh-Hant--light--mid.png`), d, 'fr')).join('')}</div>
</body></html>`;
fs.writeFileSync(path.join(root, 'drafts-160/final.html'), html);
console.log('wrote drafts-160/final.html');

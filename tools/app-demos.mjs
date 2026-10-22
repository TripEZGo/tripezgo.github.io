/* App 內的功能示範（ADR-0050）：把官網 screens/ 的畫面打包成一個「離線、自給自足」的資料夾，給 App 的 WKWebView 載入。
 *
 *   node tools/app-demos.mjs                          → 輸出到 App target 資源 App/iOS/FeatureDemos/（預設路徑見 DEFAULT_OUT）
 *   node tools/app-demos.mjs --out /tmp/x             → 輸出到別處（驗證、開發用）
 *   node tools/app-demos.mjs --only pw-no-ads,glance  → 只打包這幾個示範（開發時比較快；少一個的頁面不會報錯）
 *
 * 規則（跟 App 端的合約，不要改）
 *   - 入口 demo.html?demo=<id>&lang=<zh-Hant|en|ja>&theme=<light|dark>&still=<0|1>[&mode=<loop|once>&crop=<none|safe|box>&nohand=<0|1>]，
 *     只畫手機螢幕內容（402×874 原尺寸等比縮放放進視窗，沒有外框）。mode／crop／nohand 沒帶就用示範自己的預設（見 DEMOS 與 manifest.json）。
 *   - 資料夾自給自足、只用相對路徑、沒有任何網路網址：資料（範本旅程 JSON）、圖、字（用系統字）、地圖（靜態圖）全在裡面。
 *   - 可以直接用 file:// 開（Chromium、WKWebView 的 loadFileURL）：所以**沒有 ES module 的外部檔、沒有 fetch 本機檔**——
 *     每一頁的 JS 用 esbuild 打成一包、內嵌在 HTML（內嵌的 <script type=module> 在 file:// 沒問題），
 *     JSON 變成 data/files.<lang>.js（classic script），再用一個很小的 fetch 墊片回給原本的 fetch('./data/…')。
 *   - 不送任何訊息給原生、不需要 JS 橋。殼（demo.html）與畫面（iframe）之間的 postMessage 只在頁面自己裡面。
 *   - 預算 ≤ 8 MB。
 *
 * 來源只有一份：screens/*.html、autoplay.js、stories*.js。畫面改了重跑這支，不手抄。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS = path.join(root, 'screens');
const DEFAULT_OUT = '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/fix-security-140/App/iOS/FeatureDemos';
const BUDGET = 8 * 1024 * 1024;
const LANGS = ['zh-Hant-TW', 'en', 'ja'];

// ── 示範清單 ──────────────────────────────────────────────────────────────
// page／auto：iframe 載哪一頁、跑哪一支故事（screens/stories*.js 的 key）；q：該頁的網址參數；
// pages：這個示範的故事會換到的每一頁（沒列到就不會打包進去）；still：減少動態時畫哪一幀（預設＝同一頁、不帶 auto）。
// panels：多格局部畫面（box＝[top,height]，scale＝縮放、crop＝iframe 內往上裁掉多少 px——都是 402×874 座標系）。
// 引導頁（ADR-0050，2026-10-22 稿）：每支都是 mode=once（播一次、停在最後一幀、點一下重播、長按暫停）＋ crop=safe（從 safe area 頂端開始畫）。
//   flows：依序播的幾段 { page, q, auto }＝播故事；{ page, q, still: true, ms }＝靜態停 ms 毫秒；slide＝換進來時往上滑入。
//   still：「減少動態」畫的那一幀（預設＝第一段同一頁、不帶 auto）。flat：不是手機畫面，iframe 就是整個視窗（隱私流向圖）。
// 付費牆：mode=once＋crop=box（每支各一塊固定裁切框 box＝[x, y, w, h]，402×874 座標）＋ nohand（不畫手勢游標）。
//   pw-calendar 是靜態畫面（Apple 行事曆單日檢視），沒有動畫。
const ONB = { mode: 'once', crop: 'safe' };
const PW = { mode: 'once', crop: 'box', nohand: true };
export const DEMOS = {
  // 引導頁
  plan: { ...ONB, flows: [{ page: 'calendar', q: 'day=2', auto: 'demo-plan-calendar' }, { page: 'event', q: 'extra=1', still: true, ms: 4500 }, { page: 'leg', auto: 'leg' }],
    pages: ['calendar', 'timeline', 'event', 'leg'] },
  share: { ...ONB, flows: [{ page: 'share-igi', auto: 'insp-chain' }], pages: ['share-igi', 'share-gmi', 'inspiration', 'event'] },
  map: { ...ONB, flows: [{ page: 'map-demo', q: 'nowalk=1', auto: 'map-pin-walk' }], pages: ['map-demo'] },
  mates: { ...ONB, flows: [{ page: 'map-demo', q: 'focus=mates', auto: 'mates-map' }], pages: ['map-demo'] },
  overview: { ...ONB, flows: [{ page: 'overview', auto: 'overview' }], pages: ['overview'] },
  glance: { ...ONB, flows: [{ page: 'lock', still: true, ms: 3500 }, { page: 'widget', still: true, ms: 4500, slide: true }], pages: ['lock', 'widget'] },
  library: { ...ONB, flows: [{ page: 'notes', auto: 'lib-scan-fx' }], pages: ['notes', 'scan', 'fx'] },
  privacy: { mode: 'once', flat: true, flows: [{ page: 'privacy-flow' }], pages: ['privacy-flow'] },
  // 付費牆
  'pw-no-ads': { ...PW, box: [0, 183, 402, 362], flows: [{ page: 'pw-no-ads', auto: 'pw-no-ads' }], pages: ['pw-no-ads'] },
  'pw-live-activity': { ...PW, box: [0, 418, 402, 260], flows: [{ page: 'pw-live', q: 'bare=1', auto: 'pw-live' }], pages: ['pw-live'] },
  'pw-unlimited': { ...PW, box: [0, 140, 402, 350], flows: [{ page: 'pw-unlimited', auto: 'pw-unlimited' }], pages: ['pw-unlimited'] },
  'pw-members': { ...PW, box: [0, 125, 402, 350], flows: [{ page: 'pw-members', auto: 'pw-members' }], pages: ['pw-members'] },
  'pw-calendar': { ...PW, box: [0, 186, 402, 334], flows: [{ page: 'apple-calendar', still: true, ms: 1e9 }], pages: ['apple-calendar'] },
};

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
const OUT = path.resolve(opt('out') || DEFAULT_OUT);
const ONLY = opt('only') ? new Set(opt('only').split(',')) : null;
const ids = Object.keys(DEMOS).filter((id) => !ONLY || ONLY.has(id));

const read = (f) => fs.readFileSync(path.join(SCREENS, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(SCREENS, f));

// ── 把 bundle 進來的原始碼裡「給首頁／快取版本號用」的動態 import 改成打包得動的寫法（只在這支工具裡改，不動官網的原檔）──
const PATCHES = {
  'chrome.js': [[
    "import('./autoplay.js' + (params.get('av') ? '?v=' + params.get('av') : ''))", "import('./autoplay.js')"]],
  'autoplay.js': [[
    "await import('./stories.js' + new URL(import.meta.url).search)", "await import('./stories.js')"]],
  'stories.js': [[
    /const V = new URL\(import\.meta\.url\)\.search;\n\/\/ demo-[^\n]*\nconst \[[^\n]*\] = await Promise\.all\(\[[^\n]*\n/,
    "import { STORIES as A } from './stories-plan.js';\nimport { STORIES as B } from './stories-map.js';\nimport { STORIES as C } from './stories-tools.js';\nimport { STORIES as D } from './stories-demo-plan.js';\nimport { STORIES as E } from './stories-demo-map.js';\nimport { STORIES as F } from './stories-demo-library.js';\nimport { STORIES as G } from './stories-demo-paywall.js';\n"]],
};
const patchPlugin = {
  name: 'tz-patch',
  setup(b) {
    b.onLoad({ filter: /screens\/[\w-]+\.js$/ }, (args) => {
      const name = path.basename(args.path);
      let src = fs.readFileSync(args.path, 'utf8');
      for (const [from, to] of PATCHES[name] || []) {
        const next = src.replace(from, to);
        if (next === src) throw new Error(`app-demos: ${name} 裡找不到要改的那一段：${String(from).slice(0, 60)}`);
        src = next;
      }
      return { contents: src, loader: 'js', resolveDir: path.dirname(args.path) };
    });
  },
};

async function bundle(js, resolveDir, label) {
  const r = await build({
    stdin: { contents: js, resolveDir, sourcefile: label, loader: 'js' },
    bundle: true, format: 'esm', platform: 'browser', target: ['safari16', 'chrome110'], minify: true, write: false,
    plugins: [patchPlugin], legalComments: 'none', logLevel: 'error',
  });
  return r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
}

// ── 每頁的固定前置：資料載入（classic script，file:// 可用）＋ fetch 墊片 ──
const SHIM = `<script>/* sessionStorage 不能用時（沙箱 iframe 沒有 allow-same-origin、隱私模式）的後備。畫面換頁會整頁重新載入，故事進度（tz-auto:*）與示範狀態都存在 sessionStorage；存不住就會在換頁後卡住。後備：存在記憶體，每次寫入用 postMessage {type:'tz-ss'} 回報外層殼，換頁時由殼放進新頁網址的 #ss=。完全不碰別的 frame 的 DOM／window 屬性。 */
(function(){try{sessionStorage.setItem('__tz','1');sessionStorage.removeItem('__tz');return}catch(e){}
var m={};try{var h=location.hash;if(h.indexOf('#ss=')===0)m=JSON.parse(decodeURIComponent(h.slice(4)))||{}}catch(e){m={}}
function sync(){try{parent.postMessage({type:'tz-ss',name:window.name,data:m},'*')}catch(e){}}
var s={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v);sync()},removeItem:function(k){delete m[k];sync()},clear:function(){m={};sync()},key:function(i){return Object.keys(m)[i]||null}};
Object.defineProperty(s,'length',{get:function(){return Object.keys(m).length}});
try{Object.defineProperty(window,'sessionStorage',{value:s,configurable:true})}catch(e){}})();</script>
`;
const PRELUDE = SHIM + `<script>(function(){var q=new URLSearchParams(location.search),l=q.get('lang')||'zh-Hant-TW';if(['zh-Hant-TW','en','ja'].indexOf(l)<0)l='en';
window.__TZ_FILES={};document.write('<script src="data/files.'+l+'.js"><\\/script>');
var f=window.fetch;window.fetch=function(u){var k=String(u).replace(/^(\\.\\/)+/,'').split('?')[0];var v=window.__TZ_FILES[k];
if(v!==undefined)return Promise.resolve(new Response(v,{status:200,headers:{'content-type':/\\.json$/.test(k)?'application/json':'image/svg+xml'}}));
return Promise.reject(new TypeError('offline: '+k));};})();</script>`;

const IMG_RE = /(?:\.\/)?img\/[A-Za-z0-9_\-/.${}]+?\.(?:png|jpg|jpeg|webp|svg|gif)/g;
const copied = new Set();
const usedText = [];

async function buildPage(name) {
  let html = read(`${name}.html`);
  html = html.replace(/<!-- stamp-screens:start -->[\s\S]*?<!-- stamp-screens:end -->\n?/, '');
  // 樣式表：去掉 ?v=，複製進去
  html = html.replace(/(<link rel="stylesheet" href=")([\w./-]+\.css)(?:\?v=[0-9a-f]+)?(")/g, (m, a, css, b) => {
    copy(`screens/${css}`, path.join(SCREENS, css)); usedText.push(read(css)); return a + css + b;
  });
  // 模組 script：內嵌的與 src 的都打成一包
  const mods = [...html.matchAll(/<script type="module"(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
  if (mods.length > 1) throw new Error(`${name}.html 有 ${mods.length} 個 module script`);
  if (mods.length === 1) {
    const [whole, src, inline] = mods[0];
    const entry = src ? `import './${src.replace(/^\.\//, '')}';` : inline;
    const js = await bundle(entry, SCREENS, `${name}.html`);
    usedText.push(js);
    html = html.replace(whole, () => `<script type="module">${js}</script>`);
    html = html.replace(/<meta charset="utf-8">\n?/i, (m) => `${m}${PRELUDE}\n`);
  }   // 沒有 module script 的頁（隱私流向圖：純 HTML＋classic script）不需要資料墊片與 sessionStorage 後備
  write(`screens/${name}.html`, html);
  usedText.push(html);
}

function copy(rel, abs) {
  if (copied.has(rel)) return; copied.add(rel);
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.copyFileSync(abs, path.join(OUT, rel));
}
function write(rel, data) { fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true }); fs.writeFileSync(path.join(OUT, rel), data); }

// ── 主流程 ──
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const pages = new Set();
for (const id of ids) {
  const d = DEMOS[id];
  for (const p of [...(d.pages || []), ...(d.flows || []).map((x) => x.page)]) if (p) pages.add(p);
}
const missing = [];
for (const p of [...pages].sort()) {
  if (!exists(`${p}.html`)) { missing.push(p); continue; }
  await buildPage(p);
}

// 圖：JS／HTML／CSS 裡寫到的 img/ 路徑；有 ${…} 樣板的（shop-${it.img}.svg、img/${lang}/…）展開成整個前綴
const imgDir = path.join(SCREENS, 'img');
const allImgs = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : allImgs.push(path.relative(imgDir, p)); } })(imgDir);
const blob = usedText.join('\n');
const want = new Set();
for (const m of blob.matchAll(IMG_RE)) {
  const ref = m[0].replace(/^\.\//, '').slice(4);
  if (!ref.includes('${')) { want.add(ref); continue; }
  const re = new RegExp('^' + ref.replace(/[.]/g, '\\.').replace(/\$\{[^}]*\}/g, '[^/]*') + '$');
  for (const f of allImgs) if (re.test(f)) want.add(f);
}
for (const m of blob.matchAll(/url\(["']?(?:\.\/)?img\/([A-Za-z0-9_\-/.]+)/g)) want.add(m[1]);
// 地圖那幾張（map.js 用 `img/${{…}[x]}` 的寫法）：整個 map*.jpg、map-*.png 都帶
if (/img\/\$\{\{/.test(blob)) for (const f of allImgs) if (/^(?:\w+\/)?map[\w-]*\.(jpg|png)$/.test(f)) want.add(f);
for (const f of want) if (f.startsWith('ko/')) want.delete(f);
for (const f of [...want].sort()) { if (fs.existsSync(path.join(imgDir, f))) copy(`screens/img/${f}`, path.join(imgDir, f)); }

// 資料：每個語言一支 classic script，把 JSON／SVG 文字放進 window.__TZ_FILES（鍵＝原本 fetch 的相對路徑）
const sharedFiles = {};
for (const f of ['data/categories.json', 'data/shops-sanyo.json', 'data/mapdemo.json', 'data/mapdemo-routes.json']) if (exists(f)) sharedFiles[f] = read(f);
if (exists('img/members-qr.svg')) sharedFiles['img/members-qr.svg'] = read('img/members-qr.svg');
for (const lang of LANGS) {
  const files = { ...sharedFiles, [`data/sanyo.${lang}.json`]: JSON.stringify(JSON.parse(read(`data/sanyo.${lang}.json`))) };
  if (sharedFiles['data/categories.json']) files['data/categories.json'] = JSON.stringify(JSON.parse(sharedFiles['data/categories.json']));
  for (const f of ['data/shops-sanyo.json', 'data/mapdemo.json', 'data/mapdemo-routes.json']) if (sharedFiles[f]) files[f] = JSON.stringify(JSON.parse(sharedFiles[f]));
  write(`screens/data/files.${lang}.js`, `Object.assign(window.__TZ_FILES,${JSON.stringify(files).replace(/<\/script/gi, '<\\/script')});`);
}

// 殼與清單
const spec = Object.fromEntries(ids.filter((id) => !(DEMOS[id].flows || []).some((f) => missing.includes(f.page))).map((id) => {
  const { pages: _pages, ...d } = DEMOS[id];
  return [id, d];
}));
// kind：once＝播一次停在最後一幀；static＝靜態畫面（沒有動畫）；ambient＝一直在動、不會「播完」（隱私流向圖的虛線）
const kinds = Object.fromEntries(Object.entries(spec).map(([id, d]) => [id, d.flat ? 'ambient' : d.flows.every((f) => f.still === true) && d.flows.length === 1 ? 'static' : 'once']));
write('demo.html', fs.readFileSync(path.join(root, 'tools/app-demos-shell.html'), 'utf8').replace(/\/\*DEMOS\*\/\{\}\/\*END\*\//, () => JSON.stringify(spec)));
write('manifest.json', JSON.stringify({
  adr: 'ADR-0050', entry: 'demo.html?demo=<id>&lang=<zh-Hant|en|ja>&theme=<light|dark>&still=<0|1>[&mode=<loop|once>&crop=<none|safe|box>&nohand=<0|1>]',
  demos: Object.keys(spec), kinds, langs: ['zh-Hant', 'en', 'ja'], themes: ['light', 'dark'],
  defaults: Object.fromEntries(Object.entries(spec).map(([id, d]) => [id, { mode: d.mode || 'loop', crop: d.crop || 'none', nohand: !!d.nohand }])),
}, null, 2) + '\n');

let bytes = 0; const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const n = fs.statSync(p).size; bytes += n; files.push([n, path.relative(OUT, p)]); } } })(OUT);
if (process.env.APP_DEMOS_LIST) files.sort((a, b) => b[0] - a[0]).slice(0, 25).forEach(([n, f]) => console.log(String(n).padStart(9), f));
if (missing.length) console.warn(`app-demos: 還沒有這幾頁，略過：${missing.join(', ')}`);
console.log(`app-demos: ${Object.keys(spec).length} demos, ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB → ${OUT}`);
if (bytes > BUDGET) { console.error(`app-demos: 超過預算 ${BUDGET / 1024 / 1024} MB`); process.exit(1); }

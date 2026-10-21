/* App 內的功能示範（ADR-0050）：把官網 screens/ 的畫面打包成一個「離線、自給自足」的資料夾，給 App 的 WKWebView 載入。
 *
 *   node tools/app-demos.mjs                          → 輸出到 App target 資源 App/iOS/FeatureDemos/（預設路徑見 DEFAULT_OUT）
 *   node tools/app-demos.mjs --out /tmp/x             → 輸出到別處（驗證、開發用）
 *   node tools/app-demos.mjs --only pw-no-ads,glance  → 只打包這幾個示範（開發時比較快；少一個的頁面不會報錯）
 *
 * 規則（跟 App 端的合約，不要改）
 *   - 入口 demo.html?demo=<id>&lang=<zh-Hant|en|ja>&theme=<light|dark>&still=<0|1>，只畫手機螢幕內容，照視窗寬縮放。
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
const PANEL = { x: 16, w: 370, scale: 370 / 402 };
export const DEMOS = {
  // 歡迎頁
  'plan-trio': {
    pages: ['calendar', 'timeline', 'event-new', 'leg'],
    panels: [
      { page: 'calendar', q: 'day=2', auto: 'demo-plan-calendar', box: [20, 270], scale: PANEL.scale, crop: 64 },
      { page: 'event-new', auto: 'demo-plan-event', box: [302, 270], scale: PANEL.scale, crop: 0 },
      { page: 'leg', auto: 'leg', box: [584, 270], scale: PANEL.scale, crop: 405 },
    ],
  },
  inspiration: { page: 'share-web', auto: 'inspiration-flow', pages: ['share-web', 'inspiration', 'event'], still: { page: 'inspiration' } },
  map: { page: 'map-demo', auto: 'demo-map', pages: ['map-demo'] },
  mates: { page: 'members', auto: 'demo-mates', pages: ['members', 'map-demo'] },
  overview: { page: 'overview', auto: 'overview', pages: ['overview'] },
  glance: { page: 'lock', auto: 'demo-glance', pages: ['lock', 'widget', 'siri'] },
  library: { page: 'notes', auto: 'demo-library', pages: ['notes', 'note', 'scan', 'fx', 'shop'] },
  // 付費牆
  'pw-calendar': { page: 'apple-calendar', auto: 'apple-calendar', pages: ['apple-calendar'] },
  'pw-live-activity': { page: 'pw-live', auto: 'pw-live', pages: ['pw-live'] },
  'pw-unlimited': { page: 'pw-unlimited', auto: 'pw-unlimited', pages: ['pw-unlimited'] },
  'pw-no-ads': { page: 'pw-no-ads', auto: 'pw-no-ads', pages: ['pw-no-ads'] },
  'pw-members': { page: 'pw-members', auto: 'pw-members', pages: ['pw-members'] },
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
const PRELUDE = `<script>(function(){var q=new URLSearchParams(location.search),l=q.get('lang')||'zh-Hant-TW';if(['zh-Hant-TW','en','ja'].indexOf(l)<0)l='en';
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
  if (mods.length !== 1) throw new Error(`${name}.html 有 ${mods.length} 個 module script`);
  const [whole, src, inline] = mods[0];
  const entry = src ? `import './${src.replace(/^\.\//, '')}';` : inline;
  const js = await bundle(entry, SCREENS, `${name}.html`);
  usedText.push(js);
  html = html.replace(whole, () => `<script type="module">${js}</script>`);
  html = html.replace(/<meta charset="utf-8">\n?/i, (m) => `${m}${PRELUDE}\n`);
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
  for (const p of [...(d.pages || []), d.page, ...(d.panels || []).map((x) => x.page)]) if (p) pages.add(p);
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
const spec = Object.fromEntries(ids.filter((id) => !(DEMOS[id].page && missing.includes(DEMOS[id].page)) ).map((id) => {
  const d = DEMOS[id];
  const strip = (p) => ({ page: p.page, q: p.q, auto: p.auto, still: p.still, box: p.box, scale: p.scale, crop: p.crop });
  return [id, d.panels ? { panels: d.panels.map(strip) } : strip(d)];
}));
write('demo.html', fs.readFileSync(path.join(root, 'tools/app-demos-shell.html'), 'utf8').replace(/\/\*DEMOS\*\/\{\}\/\*END\*\//, () => JSON.stringify(spec)));
write('manifest.json', JSON.stringify({
  adr: 'ADR-0050', entry: 'demo.html?demo=<id>&lang=<zh-Hant|en|ja>&theme=<light|dark>&still=<0|1>',
  demos: Object.keys(spec), langs: ['zh-Hant', 'en', 'ja'], themes: ['light', 'dark'],
}, null, 2) + '\n');

let bytes = 0; const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const n = fs.statSync(p).size; bytes += n; files.push([n, path.relative(OUT, p)]); } } })(OUT);
if (process.env.APP_DEMOS_LIST) files.sort((a, b) => b[0] - a[0]).slice(0, 25).forEach(([n, f]) => console.log(String(n).padStart(9), f));
if (missing.length) console.warn(`app-demos: 還沒有這幾頁，略過：${missing.join(', ')}`);
console.log(`app-demos: ${Object.keys(spec).length} demos, ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB → ${OUT}`);
if (bytes > BUDGET) { console.error(`app-demos: 超過預算 ${BUDGET / 1024 / 1024} MB`); process.exit(1); }

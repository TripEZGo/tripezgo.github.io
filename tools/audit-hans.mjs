/* 簡體中文版畫面的漏翻檢查：把每一頁用 ?lang=zh-Hans 開起來，列出還帶「繁體專用字」的文字。
 *
 *   node tools/audit-hans.mjs [--app <App repo>]
 *
 * 繁體專用字＝App 字串表（Scripts/i18n/maps/*.json）與範本資料裡「繁中欄出現過、簡中欄一次都沒出現過」的字——
 * 這是兩份人寫的對照表算出來的集合，不是繁簡轉換表。 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import http from 'node:http';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const app = argv.includes('--app') ? argv[argv.indexOf('--app') + 1] : path.join(process.env.HOME, 'Projects/tripezgo');
// 繁體專用字＝兩份人寫的對照表（App 字串表的 zh-Hant-TW／zh-Hans 欄、範本的兩個語言檔）裡，**同一位置**上繁簡不同的那個繁體字
// （長度相同的一對才比；整份語料相減會被「簡體欄裡不小心留著的繁體字」污染）
const cand = new Set(), cH = {}, cS = {};
const count = (str, m) => { if (typeof str === 'string') for (const c of str) m[c] = (m[c] || 0) + 1; };
const align = (a, b) => { if (typeof a === 'string' && typeof b === 'string' && a.length === b.length) for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && /[\u4e00-\u9fff]/.test(a[i])) cand.add(a[i]); count(a, cH); count(b, cS); };
const feed = (o) => {
  if (Array.isArray(o)) return o.forEach(feed);
  if (o && typeof o === 'object') {
    if (typeof o['zh-Hant-TW'] === 'string') align(o['zh-Hant-TW'], o['zh-Hans']);
    Object.values(o).forEach(feed);
  }
};
const mapsDir = path.join(app, 'Scripts/i18n/maps');
for (const f of fs.readdirSync(mapsDir)) if (f.endsWith('.json')) feed(JSON.parse(fs.readFileSync(path.join(mapsDir, f), 'utf8')));
const both = (a, b) => { if (typeof a === 'string') return align(a, b); if (Array.isArray(a) && Array.isArray(b)) a.forEach((x, i) => both(x, b[i])); else if (a && typeof a === 'object' && b && typeof b === 'object') for (const k of Object.keys(a)) both(a[k], b[k]); };
both(JSON.parse(fs.readFileSync(path.join(root, 'screens/data/sanyo.zh-Hant-TW.json'), 'utf8')), JSON.parse(fs.readFileSync(path.join(root, 'screens/data/sanyo.zh-Hans.json'), 'utf8')));

const trad = new Set([...cand].filter((c) => (cS[c] || 0) <= 0.1 * (cH[c] || 1)));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;

const PAGES = [['home', 'layout=live:m,todo:s,fx:s,overview:m'], ['calendar', 'day=2'], ['inspiration', ''], ['inspiration', 'step=types'], ['map-live', ''], ['event', 'event=d2-ferry'], ['event', 'event=d1-flight-tpe-okj'], ['leg', ''],
  ['overview-170', 'day=1'], ['overview-170', 'still=1'], ['shop', ''], ['shop-edit', 'picker=1'], ['members', ''], ['map-live', 'nav=0&today=2&focus=mates'], ['lock', ''], ['widget', ''], ['notes', ''], ['note', ''], ['scan', ''], ['fx', ''], ['timeline', 'day=2']];
const browser = await chromium.launch();
let bad = 0;
for (const [page, q] of PAGES) {
  const pg = await browser.newPage({ viewport: { width: 402, height: 874 } });
  await pg.route('https://tripezgo.com/**', (r) => { const p = path.join(root, new URL(r.request().url()).pathname); fs.existsSync(p) && !fs.statSync(p).isDirectory() ? r.fulfill({ body: fs.readFileSync(p), contentType: TYPES[path.extname(p)] || 'application/octet-stream' }) : r.fulfill({ status: 404, body: '' }); });
  await pg.goto(`https://tripezgo.com/screens/${page}.html?lang=zh-Hans&${q}`);
  try { await pg.waitForSelector('body[data-ready="1"]', { timeout: 20000 }); } catch { console.log('NOT READY', page, q); }
  await pg.waitForTimeout(800);
  const texts = await pg.evaluate(() => {
    const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t && !['SCRIPT', 'STYLE'].includes(n.parentElement?.tagName)) out.push(t); }
    document.querySelectorAll('[placeholder],[aria-label],[alt]').forEach((e) => ['placeholder', 'aria-label', 'alt'].forEach((a) => { const v = e.getAttribute(a); if (v) out.push(v); }));
    return out;
  });
  const hits = [...new Set(texts.filter((t) => [...t].some((c) => trad.has(c))))];
  if (hits.length) { bad += hits.length; console.log(`\n${page} ${q}`); hits.slice(0, 40).forEach((t) => console.log('  ', t.slice(0, 80), '→', [...new Set([...t].filter((c) => trad.has(c)))].join(''))); }
  await pg.close();
}
await browser.close(); srv.close();
console.log(`\n繁體專用字集合 ${trad.size} 個；有問題的文字 ${bad} 條`);

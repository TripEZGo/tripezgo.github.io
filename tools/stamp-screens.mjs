/* screens/ 的快取版本號：`node tools/stamp-screens.mjs`（tools/stamp-home.mjs 也會叫它）。
 *
 * ## 為什麼（2026-10-12）
 *
 * Cloudflare 把 JS／CSS 快取 4 小時、HTML 10 分鐘，網址又不帶版本。screens/*.html 換成新版、裡面
 * `import { DEV } from './chrome.js'`，瀏覽器卻還拿著快取裡的舊 chrome.js（沒有 DEV）——模組載入直接失敗，
 * 首頁手機一片白。蓋上內容雜湊之後，HTML 一換，它指到的整組 JS／CSS 就一定是同一版。
 *
 * ## 怎麼做
 *
 * 每一頁 <head> 開頭放一個 import map，把 /screens/<名字>.js 與 /trip/<名字>.js 對到 `?v=<雜湊>`
 * ——JS 裡的 `import './chrome.js'` 不用改，解析出來的網址會被 import map 換掉；樣式表的 href 直接帶 ?v=。
 * import map 只比對完整網址：已經自己帶 ?v= 的動態 import（autoplay.js、stories-*.js）不受影響。 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (p) => createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex').slice(0, 10);
const START = '<!-- stamp-screens:start -->', END = '<!-- stamp-screens:end -->';

const mods = [
  ...fs.readdirSync(path.join(root, 'screens')).filter((f) => f.endsWith('.js') && !f.startsWith('.')).map((f) => `screens/${f}`),
  ...fs.readdirSync(path.join(root, 'trip')).filter((f) => f.endsWith('.js')).map((f) => `trip/${f}`),
];
const imports = Object.fromEntries(mods.map((m) => [`/${m}`, `/${m}?v=${hash(m)}`]));
const block = `${START}<script type="importmap">${JSON.stringify({ imports })}</script>${END}`;

let changed = 0;
for (const f of fs.readdirSync(path.join(root, 'screens')).filter((f) => f.endsWith('.html'))) {
  const p = path.join(root, 'screens', f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  // 放在 <meta charset> 後面：charset 要落在檔案前 1024 位元組內，import map 一長就會把它擠出去
  const i = s.indexOf(START), j = s.indexOf(END);
  if (i >= 0 && j > i) s = s.slice(0, i).replace(/\n$/, '') + s.slice(j + END.length);
  const m = s.match(/<meta charset="[^"]*">\n?/i);
  if (!m) throw new Error(`${f} 沒有 <meta charset>`);
  s = s.replace(m[0], `${m[0].replace(/\n?$/, '\n')}${block}\n`);
  // 同目錄的樣式表：href="screen.css" / href="screen.css?v=…" → 帶最新雜湊
  s = s.replace(/(<link rel="stylesheet" href=")([\w-]+\.css)(?:\?v=[0-9a-f]+)?(")/g, (m, a, css, b) => `${a}${css}?v=${hash(`screens/${css}`)}${b}`);
  if (s !== before) { fs.writeFileSync(p, s); changed++; }
}
console.log(`stamp-screens: ${changed} pages updated, ${mods.length} modules`);

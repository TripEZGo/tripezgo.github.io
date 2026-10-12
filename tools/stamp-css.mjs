/* 樣式表的快取版本號：`node tools/stamp-css.mjs`（tools/stamp-home.mjs 第一步就跑它）。
 *
 * 2026-10-12：手機版頁首加了漢堡選單（<details class="nav-menu">），樣式在 chrome.css。可是 chrome.css 是經
 * site.css 的 @import 載進來的，兩層網址都不帶版本，Cloudflare／Safari 快取 4 小時——HTML 已經是新的，
 * 樣式還是舊的，頁首就冒出 <details> 預設的 ▶ 三角形。所以整條鏈都蓋上內容雜湊：
 *   chrome.css → site.css 的 @import ?v=     site.css → home.css 的 @import ?v=、各子頁 <link> 的 ?v=
 * home.css 本身的 ?v= 由 stamp-home.mjs 接著蓋（它要等這裡改完 home.css 才算得出雜湊）。
 * 分享頁、聯絡頁由產生器自己呼叫 siteCssHref()，測試比對整頁才會一致。 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const hash = (p) => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex').slice(0, 10);
const swap = (p, re, to) => {
  const s = read(p); if (!re.test(s)) throw new Error(`${p} 裡找不到 ${re}`);
  const out = s.replace(re, to); if (out !== s) writeFileSync(new URL(p, root), out);
};

/** 子頁 <link> 用的 site.css 網址（帶版本號） */
export const siteCssHref = () => `/assets/css/site.css?v=${hash('assets/css/site.css')}`;

// 直接寫在 HTML 裡、不是產生器產的子頁
export const STATIC_PAGES = ['404.html', 'open/index.html',
  ...['', 'en/', 'ja/', 'ko/'].flatMap((l) => [`${l}privacy.html`, `${l}terms.html`])];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  swap('assets/css/site.css', /@import url\("chrome\.css[^"]*"\);/, `@import url("chrome.css?v=${hash('assets/css/chrome.css')}");`);
  swap('assets/css/home.css', /@import url\("site\.css[^"]*"\);/, `@import url("site.css?v=${hash('assets/css/site.css')}");`);
  for (const p of STATIC_PAGES) swap(p, /href="\/assets\/css\/site\.css[^"]*"/, `href="${siteCssHref()}"`);
  console.log('stamp-css:', siteCssHref());
}

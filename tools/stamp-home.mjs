/* 首頁的快取版本號：`node tools/stamp-home.mjs`（改了 home.css／home.js／screens 的自動示範腳本之後跑）。
 *
 * tripezgo.com 前面的 Cloudflare 把 CSS／JS 快取 4 小時、網址不帶版本，手機會一直用舊檔（2026-10-12）。
 * 1. screens/autoplay.js＋stories*.js 的內容雜湊 → home.js 的 AUTO_V（iframe 網址帶 av=，一路帶到 stories-*.js）
 *    assets/js|css/demos/ 的內容雜湊 → home.js 的 DEMO_V（懶載入的示範模組與樣式帶 ?v=）
 * 2. home.css、home.js、promo.js 的內容雜湊 → index.html 的 ?v=
 * 3. 重產 en／ja／ko 首頁（tools/home-i18n.py 照母版帶這兩行）、聯絡頁與公告頁（頁首頁尾從首頁抽）
 * 4. screens/*.html 的 import map 與樣式表版本號（tools/stamp-screens.mjs） */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root));
const hash = (...ps) => { const h = createHash('sha256'); ps.forEach((p) => h.update(read(p))); return h.digest('hex').slice(0, 10); };
const swap = (p, re, to) => {
  const s = read(p).toString(); if (!re.test(s)) throw new Error(`${p} 裡找不到 ${re}`);
  writeFileSync(new URL(p, root), s.replace(re, to));
};

// 樣式表鏈（chrome.css → site.css → home.css／子頁）先蓋版本號，下面算 home.css 的雜湊才是最後的內容
execFileSync('node', [new URL('tools/stamp-css.mjs', root).pathname], { stdio: 'ignore' });
const av = hash('screens/autoplay.js', 'screens/stories.js', 'screens/stories-plan.js', 'screens/stories-map.js', 'screens/stories-tools.js');
swap('assets/js/home.js', /const AUTO_V = '[^']*';/, `const AUTO_V = '${av}';`);
const demos = ['assets/js/demos/', 'assets/css/demos/'].flatMap((d) => readdirSync(new URL(d, root)).sort().map((f) => d + f));
swap('assets/js/home.js', /const DEMO_V = '[^']*';/, `const DEMO_V = '${hash(...demos)}';`);
swap('index.html', /href="\/assets\/css\/home\.css[^"]*"/, `href="/assets/css/home.css?v=${hash('assets/css/home.css')}"`);
swap('index.html', /src="\/assets\/js\/home\.js[^"]*"/, `src="/assets/js/home.js?v=${hash('assets/js/home.js')}"`);
swap('index.html', /src="\/assets\/js\/promo\.js[^"]*"/, `src="/assets/js/promo.js?v=${hash('assets/js/promo.js')}"`);   // 首頁的限時活動
execFileSync('python3', [new URL('tools/home-i18n.py', root).pathname], { stdio: 'ignore' });
execFileSync('python3', [new URL('tools/seo.py', root).pathname], { stdio: 'ignore' });
execFileSync('node', [new URL('tools/gen-contact.mjs', root).pathname], { stdio: 'ignore' });   // canonical／hreflang／og／twitter／JSON-LD
execFileSync('node', [new URL('tools/announcements.mjs', root).pathname, '--offline'], { stdio: 'ignore' });   // /announcements/×4：頁首頁尾從首頁抽
execFileSync('node', [new URL('tools/embed.mjs', root).pathname], { stdio: 'ignore' });        // ?mode=embed 那段 inline head（首頁、隱私、條款）
execFileSync('node', [new URL('tools/stamp-screens.mjs', root).pathname], { stdio: 'inherit' });   // screens/ 的 import map 與樣式表版本號
console.log('stamped: av', av);

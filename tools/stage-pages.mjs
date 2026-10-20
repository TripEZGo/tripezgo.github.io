/* 把「真的要發佈」的東西複製到 _site/，Pages workflow 上傳的是 _site 而不是整個 repo 根目錄：
 *
 *   node tools/stage-pages.mjs [輸出目錄，預設 _site]
 *
 * ## 為什麼
 *
 * 以前 `upload-pages-artifact` 的 path 是 `.`：tools/、tests/、CONTEXT.md、package.json…
 * 全部會被發佈到 https://tripezgo.com/tools/…（安全稽核 I6）。repo 本來就是 public，所以不是洩漏，
 * 但「網站上有什麼」不該取決於「repo 裡放了什麼」。
 *
 * ## 怎麼守
 *
 * 根目錄的每一個項目都必須在 PUBLISH（發佈）或 KEEP_OUT（不發佈）其中一邊：
 * 新增了沒分類的項目就讓 workflow 紅，逼人當場決定——不會靜靜地被發佈，也不會靜靜地 404。
 * 發佈清單裡的項目不存在也會紅（改名或刪掉時，清單要一起改）。
 * `tests/unit/stage-pages.test.mjs` 守著這兩條。 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** 網站實際在送的東西（2026-10-20 從 repo 與頁面引用盤點：首頁的 iPhone 示範是 iframe 載 /screens/，所以 screens/ 在內）。 */
export const PUBLISH = [
  '.nojekyll', '.well-known', '404.html', 'CNAME', 'android-auth', 'app-ads.txt', 'assets', 'contact',
  'en', 'index.html', 'ja', 'join', 'ko', 'open', 'privacy.html', 'robots.txt', 'screens', 'share',
  'sitemap.xml', 'terms.html', 'trip',
];
/** 刻意不發佈：開發用或專案文件。`.git`、`node_modules` 等工具產物不用列，下面的 IGNORED 直接略過。 */
export const KEEP_OUT = [
  '.github', '.gitignore', '.obsidian', '_posts', 'CONTEXT.md', 'README.md', 'package-lock.json', 'package.json',
  'playwright.config.mjs', 'tests', 'tools',
];
/** 工具與瀏覽器留下的、不在版本控制裡的東西。 */
const IGNORED = ['.git', '.DS_Store', 'node_modules', 'test-results', 'playwright-report', '_site'];

/** → `{ unclassified: [...], missing: [...] }`，兩個都空才算過。 */
export function audit(entries) {
  const known = new Set([...PUBLISH, ...KEEP_OUT, ...IGNORED]);
  return {
    unclassified: entries.filter((e) => !known.has(e)),
    missing: PUBLISH.filter((p) => !entries.includes(p)),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const out = new URL((process.argv[2] || '_site').replace(/\/?$/, '/'), 'file://' + process.cwd() + '/');
  const { unclassified, missing } = audit(readdirSync(root));
  if (unclassified.length || missing.length) {
    if (unclassified.length) console.error('::error::tools/stage-pages.mjs 不認得這些根目錄項目，要決定發佈或不發佈：' + unclassified.join(', '));
    if (missing.length) console.error('::error::發佈清單裡的項目不存在：' + missing.join(', '));
    process.exit(1);
  }
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const name of PUBLISH) cpSync(new URL(name, root), new URL(name, out), { recursive: true });
  console.log('已複製 ' + PUBLISH.length + ' 個項目到 ' + out.pathname);
  if (!existsSync(new URL('index.html', out))) process.exit(1);
}

#!/usr/bin/env node
// embed 模式（使用者 2026-10-12）：網址帶 ?mode=embed 時，App 設定裡的 WebView 開這幾頁——
// 藏掉頁首、hero、頁尾、浮動下載鈕、所有 App Store 下載鈕與 QR、手機選單；頁內同站連結自動帶上 mode=embed。
//
//   node tools/embed.mjs        # 把 EMBED_HEAD 蓋進首頁×4、隱私×4、條款×4 的 </head> 前（冪等；tools/stamp-home.mjs 也會跑）
//
// 聯絡頁×4 由 tools/gen-contact.mjs 自己帶同一段（那邊的測試比對整頁）。
// 判斷寫在 <head> 的 inline script：第一次繪製前就加上 html.embed，不會先閃出頁首再藏；樣式也 inline，
// 不靠 Cloudflare 快取 4 小時的 CSS。canonical 照舊指向無參數網址，embed 網址另外補 noindex。

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const EMBED_HEAD = `<!-- embed:start — tools/embed.mjs 產生，不要手改 -->
<script>
(function () {
  if (!/[?&]mode=embed(?:&|$)/.test(location.search)) return;
  var d = document.documentElement;
  d.classList.add('embed');
  var robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex';
  document.head.appendChild(robots);
  // 同站連結補 mode=embed；只有 # 的錨點、外站、mailto 不動
  function tag(a) {
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    var u; try { u = new URL(raw, location.href); } catch (e) { return; }
    if (u.origin !== location.origin || u.searchParams.get('mode') === 'embed') return;
    u.searchParams.set('mode', 'embed');
    a.setAttribute('href', u.pathname + u.search + u.hash);
  }
  function all() { Array.prototype.forEach.call(document.querySelectorAll('a[href]'), tag); }
  document.addEventListener('DOMContentLoaded', all);
  // 之後才由程式加進來的連結：點下去那一刻再補
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) tag(a); }, true);
})();
</script>
<style>
  html.embed .site-header, html.embed .skip-link, html.embed .hero, html.embed .site-footer, html.embed .fab-dl,
  html.embed .plans-cta, html.embed .nav-menu, html.embed .fab-qr, html.embed a[href*="apps.apple.com"] { display: none !important; }
  html.embed { scroll-padding-top: 16px; }
  html.embed .hero + .section { padding-top: clamp(24px, 4vw, 40px); }
  html.embed .legal { padding-top: clamp(24px, 4vw, 40px); }
</style>
<!-- embed:end -->
`;

export const TARGETS = ['', 'en/', 'ja/', 'ko/'].flatMap((p) => ['index.html', 'privacy.html', 'terms.html'].map((f) => p + f));

export function stamp(html) {
  const cleaned = html.replace(/<!-- embed:start[\s\S]*?<!-- embed:end -->\n/, '');
  const i = cleaned.indexOf('</head>');
  if (i < 0) throw new Error('找不到 </head>');
  return cleaned.slice(0, i) + EMBED_HEAD + cleaned.slice(i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const rel of TARGETS) {
    const path = join(root, rel);
    const before = readFileSync(path, 'utf8'), after = stamp(before);
    if (after !== before) { writeFileSync(path, after); console.log('stamped ' + rel); }
  }
}

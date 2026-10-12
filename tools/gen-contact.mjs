#!/usr/bin/env node
// 「聯絡我們」頁：/contact/（中）、/en/contact/、/ja/contact/、/ko/contact/，一顆按鈕開四語 Google 表單（使用者 2026-10-12）。
//
//   node tools/gen-contact.mjs        # 重寫每一語的 index.html（tools/stamp-home.mjs 也會跑）
//
// 頁首頁尾跟分享頁一樣從同語言的首頁抽出來（首頁改了重跑一次就跟上）；頁首錨點指回首頁，語言鈕指到另一語的聯絡頁。
// 原本把表單嵌成 iframe，使用者改判：頁面只放連結（開新分頁）。連結帶 hl= 讓表單的「下一頁／提交」跟著頁面語言。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSclH9b9F8471nM0xbYbe3exfXjFMSQGT9H5DRlkmXVRGJJkpw/viewform';

export const PAGES = [
  { key: 'zh', htmlLang: 'zh-Hant', hl: 'zh-TW', locale: 'zh_TW', home: '/', out: 'contact/index.html',
    title: '聯絡我們 — TripEZGo', h1: '聯絡我們', lede: '使用問題、功能建議、付費問題、合作提案，都可以從這裡告訴我們。我們會用你留下的 Email 回覆。',
    cta: '開啟聯絡表單', fallback: '也可以直接寫信到' },
  { key: 'en', htmlLang: 'en', hl: 'en', locale: 'en_US', home: '/en/', out: 'en/contact/index.html',
    title: 'Contact us — TripEZGo', h1: 'Contact us', lede: "Problems, feature ideas, payment questions or partnerships — tell us here, and we'll reply to the email you leave.",
    cta: 'Open the contact form', fallback: 'Or email us at' },
  { key: 'ja', htmlLang: 'ja', hl: 'ja', locale: 'ja_JP', home: '/ja/', out: 'ja/contact/index.html',
    title: 'お問い合わせ — TripEZGo', h1: 'お問い合わせ', lede: '不具合、機能のご要望、お支払い、協業のご提案はこちらから。ご入力のメールアドレスへ返信します。',
    cta: 'お問い合わせフォームを開く', fallback: 'メールでのお問い合わせ：' },
  { key: 'ko', htmlLang: 'ko', hl: 'ko', locale: 'ko_KR', home: '/ko/', out: 'ko/contact/index.html',
    title: '문의하기 — TripEZGo', h1: '문의하기', lede: '사용 중 문제, 기능 제안, 결제 문의, 제휴 제안을 여기에서 남겨 주세요. 남겨 주신 이메일로 답변드립니다.',
    cta: '문의 양식 열기', fallback: '이메일로 보내셔도 됩니다:' },
];
const CONTACT_PATH = Object.fromEntries(PAGES.map((p) => [p.home, p.home + 'contact/']));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function slice(html, start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('首頁裡找不到 ' + start);
  return html.slice(a, b + end.length);
}

/** 這一語的表單連結（介面語言跟著頁面） */
export const formLink = (page) => `${FORM}?hl=${page.hl}`;

export function render(page) {
  const home = readFileSync(join(root, page.home.slice(1), 'index.html'), 'utf8');
  const header = slice(home, '<header class="site-header">', '</header>')
    .replace(/href="#/g, `href="${page.home}#`)
    .replace(/class="lang" href="(\/(?:en\/|ja\/|ko\/)?)"/g, (_, href) => `class="lang" href="${CONTACT_PATH[href]}"`);
  const footer = slice(home, '<footer class="site-footer">', '</footer>');
  const skipLink = slice(home, '<a class="skip-link"', '</a>');
  const url = `https://tripezgo.com${page.home}contact/`, img = `https://tripezgo.com/assets/img/og-${page.key}.png`;
  const alts = PAGES.map((p) => `<link rel="alternate" hreflang="${p.htmlLang}" href="https://tripezgo.com${p.home}contact/">`).join('\n')
    + '\n<link rel="alternate" hreflang="x-default" href="https://tripezgo.com/contact/">';
  const link = formLink(page);
  return `<!doctype html>
<html lang="${page.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.lede)}">
<link rel="canonical" href="${url}">
${alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="TripEZGo">
<meta property="og:locale" content="${page.locale}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.lede)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#17120f" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/icon-32.png">
<link rel="apple-touch-icon" href="/assets/img/icon-180.png">
<link rel="stylesheet" href="/assets/css/site.css">
<!-- 這一頁是 tools/gen-contact.mjs 產生的，不要手改。 -->
<style>
  main { max-width: 760px; margin: 0 auto; padding: clamp(28px, 5vw, 56px) var(--gutter) clamp(32px, 5vw, 56px); }
  h1 { font-size: var(--text-2xl); line-height: var(--leading-tight); letter-spacing: var(--tracking-display); margin: 0 0 10px; }
  .lede { color: var(--muted); margin: 0 0 20px; }
  .cta { display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; border-radius: var(--radius-pill);
    background: var(--accent); color: var(--accent-on); font-weight: 600; text-decoration: none; }
  .cta:hover { background: var(--accent-ink); color: var(--accent-on); }
  .cta svg { width: 16px; height: 16px; }
  .fallback { margin: 14px 0 0; font-size: var(--text-sm); color: var(--muted); }
</style>
</head>
<body>
${skipLink}
${header}
<main id="main">
  <h1>${esc(page.h1)}</h1>
  <p class="lede">${esc(page.lede)}</p>
  <a class="cta" href="${esc(link)}" target="_blank" rel="noopener">${esc(page.cta)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>
  <p class="fallback">${esc(page.fallback)} <a href="mailto:contact@tripezgo.com">contact@tripezgo.com</a></p>
</main>
${footer}
<script>
  // 手機版漢堡選單：點外面或按 Esc 收起來（首頁由 home.js 處理，這一頁沒有載 home.js）
  (function () {
    var nav = document.querySelector('.nav-menu'); if (!nav) return;
    document.addEventListener('click', function (e) { if (nav.open && !nav.contains(e.target)) nav.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.open) nav.open = false; });
  })();
</script>
</body>
</html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const page of PAGES) {
    const path = join(root, page.out);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, render(page));
    console.log('wrote ' + page.out);
  }
}

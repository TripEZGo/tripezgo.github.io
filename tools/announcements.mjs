/* 首頁的「公告」：兩份 gist 合併、依日期排序 → assets/data/announcements.json（使用者 2026-10-26）。
 *
 *   - App 的公告 gist（ios-announcements.json，App repo ADR-0038）：App 裡看得到的那幾則，官網也列
 *   - 官網專用的公告 gist（web-announcements.json，格式一樣）：只在 tripezgo.com 出現，App 看不到
 *
 *   TEZ_ANNOUNCEMENTS_URL=<App 那份的 raw 網址> TEZ_WEB_ANNOUNCEMENTS_URL=<官網那份的 raw 網址> node tools/announcements.mjs
 *
 * 兩份 gist 都是 secret（永不公開），所以網址不寫進 repo、也不寫進官網：GitHub Actions 部署前用 secret 跑一次
 * （.github/workflows/pages.yml，含每天一次的排程），官網只讀同站這份 JSON。repo 裡那份是最後一次在本機跑的快照。
 * 沒設網址的那一份當作沒有公告（印警告）；有設的任何一份抓不到、或抓到的文件沒有 `announcements` 欄（gist 編輯到一半），
 * 整份照舊用快照——只用其中一份重產會讓另一份的公告憑空消失。都不擋部署。
 * 兩份裡 id 相同的，只留 App 那份的（先列的贏）。
 *
 * 規則照 App（Domain/Model/Announcement.swift）：沒 id 的不收；date 只收 yyyy-MM-dd；圖與連結只收 https；
 * 依語系逐欄挑字（zh-Hant-TW → zh-Hant → zh → en），標題與內文都挑不到的那則不列，按鈕文字挑不到就沒有按鈕；
 * 新的在前、沒 date 的排後面、同一天照 gist 順序。不管 promote——官網列全部（首頁 home.js 只畫前 5 則）。
 * 指到 tripezgo.com 首頁的連結改成那一語的首頁（https://tripezgo.com/#promo → 英文頁的 /en/#promo），同分頁打開。
 *
 * 同一份資料也寫成「所有公告」頁 /announcements/（四語各一頁，設計稿 Open Design site-announcements-page.html）：
 * 直接寫進 HTML，不靠 JS。頁首頁尾照 tools/gen-contact.mjs 從同語言的首頁抽，所以首頁改了要重產：
 *
 *   node tools/announcements.mjs --offline    # 不上網，照 repo 裡的 announcements.json 重產四頁（tools/stamp-home.mjs 會跑） */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteCssHref } from './stamp-css.mjs';
import { EMBED_HEAD } from './embed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'assets/data/announcements.json');

// 官網每一頁的語言 → App 的 lookupOrder（CheckForUpdateUseCase.lookupOrder）
export const LOOKUP = { zh: ['zh-Hant-TW', 'zh-Hant', 'zh', 'en'], en: ['en'], ja: ['ja', 'en'], ko: ['ko', 'en'] };
const HOME = { zh: '/', en: '/en/', ja: '/ja/', ko: '/ko/' };

const str = (v) => (typeof v === 'string' ? v : null);
const dict = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const pick = (values, order) => { for (const k of order) { const v = str(dict(values)[k]); if (v) return v; } return null; };

/** 嚴格的 yyyy-MM-dd（不存在的日期也不收）。 */
export function day(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const d = new Date(text + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === text ? text : null;
}

export function https(text) {
  try { const u = new URL(text); return u.protocol === 'https:' && u.hostname ? u : null; } catch { return null; }
}

/** 官網上的連結：tripezgo.com 的改成站內路徑（首頁換成這一語的首頁），其他照原樣、開新分頁。 */
export function siteLink(u, lang = 'zh') {
  if (u.hostname !== 'tripezgo.com' && u.hostname !== 'www.tripezgo.com') return { url: u.href, external: true };
  return { url: (u.pathname === '/' ? HOME[lang] : u.pathname) + u.search + u.hash, external: false };
}

/** 幾份 gist 文件 → 合併、每種語言各一份清單；任何一份的 `announcements` 不是陣列就是壞文件，回 null（呼叫端沿用快照）。
 *  先列的文件排在前面：同一天照文件順序，id 重複的留先列的那則。 */
export function build(...docs) {
  if (!docs.length || !docs.every((doc) => Array.isArray(doc?.announcements))) return null;
  const seen = new Set();
  const items = docs.flatMap((doc) => doc.announcements)
    .map((a, offset) => ({ a: dict(a), offset }))
    .filter(({ a }) => str(a.id) && !seen.has(a.id) && seen.add(a.id))
    .map(({ a, offset }) => ({ a, offset, date: day(a.date) }))
    .sort((l, r) => (l.date && r.date ? (l.date !== r.date ? r.date.localeCompare(l.date) : l.offset - r.offset)
      : l.date ? -1 : r.date ? 1 : l.offset - r.offset));
  const out = {};
  for (const [lang, order] of Object.entries(LOOKUP)) {
    out[lang] = items.map(({ a, date }) => {
      const title = pick(a.title, order), body = pick(a.body, order);
      if (!title && !body) return null;
      const image = str(a.imageURL) && https(a.imageURL);
      const target = str(dict(a.button).url) && https(dict(a.button).url);
      const label = target && pick(dict(a.button).title, order);
      return { id: a.id, date, title, body, image: image ? image.href : null, button: label ? { title: label, ...siteLink(target, lang) } : null };
    }).filter(Boolean);
  }
  return out;
}

// 合併的順序：App 的在前（同一天、或 id 撞到時它贏）
export const SOURCES = [
  { env: 'TEZ_ANNOUNCEMENTS_URL', name: 'App ' },
  { env: 'TEZ_WEB_ANNOUNCEMENTS_URL', name: '官網' },
];

async function get(url) {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'tripezgo.com announcements builder' }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (k >= 2) throw new Error(e.message); await new Promise((r) => setTimeout(r, 1000 * (k + 1))); }
  }
}

// ── 所有公告頁 ──────────────────────────────────────────────────────────────
// App 的用詞照 Scripts/i18n/maps：公告 Announcements／お知らせ／공지、設定 › 關於（About／このアプリについて／앱 정보）
export const pagePath = (key) => HOME[key] + 'announcements/';
export const PAGES = [
  { key: 'zh', htmlLang: 'zh-Hant', locale: 'zh_TW', title: '所有公告 — TripEZGo', eyebrow: '公告', h1: '所有公告',
    lede: '新功能、活動與重要通知。App 裡的「設定 › 關於 › 公告」也看得到同一份。', empty: '目前沒有公告', fresh: '新' },
  { key: 'en', htmlLang: 'en', locale: 'en_US', title: 'Announcements — TripEZGo', eyebrow: 'Announcements', h1: 'All announcements',
    lede: 'New features, offers and important notices — the same ones you’ll find in the app under Settings › About › Announcements.',
    empty: 'No announcements right now', fresh: 'New' },
  { key: 'ja', htmlLang: 'ja', locale: 'ja_JP', title: 'すべてのお知らせ — TripEZGo', eyebrow: 'お知らせ', h1: 'すべてのお知らせ',
    lede: '新機能、キャンペーン、大切なお知らせ。アプリの「設定 › このアプリについて › お知らせ」でも同じものが見られます。',
    empty: '現在お知らせはありません', fresh: '新着' },
  { key: 'ko', htmlLang: 'ko', locale: 'ko_KR', title: '모든 공지 — TripEZGo', eyebrow: '공지', h1: '모든 공지',
    lede: '새 기능, 이벤트, 중요한 안내. 앱의 「설정 › 앱 정보 › 공지」에서도 같은 내용을 볼 수 있어요.',
    empty: '현재 공지가 없습니다', fresh: 'NEW' },
];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function slice(html, start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('首頁裡找不到 ' + start);
  return html.slice(a, b + end.length);
}
function entry(a, page) {
  const b = a.button;
  return `    <li class="an-entry" id="${esc(a.id)}">
      <div class="an-when">${a.date ? `<time datetime="${a.date}">${a.date}</time>` : ''}${a.date ? `<span class="an-new" hidden>${esc(page.fresh)}</span>` : ''}</div>
      <article class="an-card">
        ${a.image ? `<figure><img src="${esc(a.image)}" alt="" loading="lazy" decoding="async"></figure>` : ''}
        <div class="an-body">
          ${a.title ? `<h2>${esc(a.title)}</h2>` : ''}
          ${a.body ? `<p>${esc(a.body)}</p>` : ''}
          ${b ? `<a class="btn btn-primary" href="${esc(b.url)}"${b.external ? ' target="_blank" rel="noopener"' : ''}>${esc(b.title)}</a>` : ''}
        </div>
      </article>
    </li>`;
}

export function renderPage(page, items) {
  const home = fs.readFileSync(path.join(root, HOME[page.key].slice(1), 'index.html'), 'utf8');
  const self = pagePath(page.key);
  const header = slice(home, '<header class="site-header">', '</header>')
    .replace(/href="#announcements"/g, `href="${self}" aria-current="page"`)
    .replace(/href="#/g, `href="${HOME[page.key]}#`)
    .replace(/class="lang" href="(\/(?:en\/|ja\/|ko\/)?)"/g, (_, href) => `class="lang" href="${href}announcements/"`);
  const footer = slice(home, '<footer class="site-footer">', '</footer>');
  const skipLink = slice(home, '<a class="skip-link"', '</a>');
  const url = `https://tripezgo.com${self}`, img = `https://tripezgo.com/assets/img/og-${page.key}.png`;
  const alts = PAGES.map((p) => `<link rel="alternate" hreflang="${p.htmlLang}" href="https://tripezgo.com${pagePath(p.key)}">`).join('\n')
    + '\n<link rel="alternate" hreflang="x-default" href="https://tripezgo.com/announcements/">';
  const list = items.length ? `<ol class="an-tl">\n${items.map((a) => entry(a, page)).join('\n')}\n  </ol>` : `<p class="an-empty">${esc(page.empty)}</p>`;
  return `<!doctype html>
<html lang="${page.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<link rel="stylesheet" href="${siteCssHref()}">
${EMBED_HEAD}<!-- 這一頁是 tools/announcements.mjs 產生的，不要手改。 -->
<style>
  .an-page { max-width: 860px; margin: 0 auto; padding: clamp(40px, 7vw, 88px) var(--gutter) clamp(64px, 9vw, 120px); container-type: inline-size; }
  .an-page h1 { margin: 0 0 12px; }
  .an-page .lede { font-size: var(--text-base); }
  .site-nav a[aria-current="page"] { color: var(--fg); font-weight: 600; }
  /* 左邊一條線串起每一則；日期在線的左邊（窄的時候移到卡片上方） */
  .an-tl { list-style: none; margin: clamp(32px, 5vw, 56px) 0 0; padding: 0; position: relative; }
  .an-tl::before { content: ""; position: absolute; left: 132px; top: 10px; bottom: 10px; width: 2px; background: var(--border-soft); border-radius: 2px; }
  .an-entry { display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 0 34px; position: relative; scroll-margin-top: 96px; }
  .an-entry + .an-entry { margin-top: 28px; }
  .an-entry::before { content: ""; position: absolute; left: 127px; top: 8px; width: 12px; height: 12px; border-radius: 50%; background: var(--page); border: 2px solid var(--accent); }
  .an-entry:first-child::before { background: var(--accent); }
  .an-when { text-align: right; padding-top: 2px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .an-when time { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--muted); font-variant-numeric: tabular-nums; }
  .an-new[hidden] { display: none; }
  .an-new { font-weight: 700; font-size: 11px; line-height: 1.6; padding: 1px 8px; border-radius: var(--radius-pill); background: var(--accent-wash); color: var(--accent-ink);
    border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border-soft)); }
  .an-card { background: var(--page); border: 1px solid var(--border-soft); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 1px 2px rgba(var(--shadow-rgb), .05); }
  .an-entry:target .an-card { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
  .an-card figure { margin: 0; aspect-ratio: 16/9; background: var(--sunken); }
  .an-card img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .an-body { padding: clamp(18px, 3vw, 26px); display: grid; gap: 10px; }
  .an-card h2 { font-size: clamp(19px, 2.4vw, var(--text-xl)); margin: 0; }
  .an-card p { margin: 0; color: var(--muted); white-space: pre-line; overflow-wrap: anywhere; }
  .an-card .btn { justify-self: start; min-height: 42px; padding: 10px 20px; font-size: var(--text-sm); margin-top: 4px; }
  .an-empty { margin: 40px 0 0; padding: 40px 24px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius-lg); }
  @container (max-width: 600px) {
    .an-tl::before { left: 5px; }
    .an-entry { grid-template-columns: minmax(0, 1fr); gap: 8px; padding-left: 28px; }
    .an-entry::before { left: 0; top: 6px; }
    .an-when { flex-direction: row; align-items: center; text-align: left; padding: 0; }
  }
</style>
</head>
<body>
${skipLink}
${header}
<main id="main" class="an-page">
  <p class="eyebrow">${esc(page.eyebrow)}</p>
  <h1>${esc(page.h1)}</h1>
  <p class="lede">${esc(page.lede)}</p>
  ${list}
</main>
${footer}
<script>
  // 14 天內標「新」，跟首頁 home.js 同一條；在瀏覽器算，頁面本身不隨日期變
  document.querySelectorAll('.an-new').forEach(function (el) {
    var d = el.parentNode.querySelector('time');
    if (d && (Date.now() - Date.parse(d.getAttribute('datetime') + 'T00:00:00Z')) / 864e5 <= 14) el.hidden = false;
  });
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

export function writePages(data) {
  for (const page of PAGES) {
    const out = path.join(root, pagePath(page.key).slice(1), 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, renderPage(page, data?.[page.key] || []));
  }
  console.log('announcements: 寫了 ' + PAGES.map((p) => pagePath(p.key)).join('、'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const snapshot = () => (fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null);
  if (process.argv.includes('--offline')) {
    writePages(snapshot());
  } else {
    try {
      const docs = [];
      for (const { env, name } of SOURCES) {
        const url = process.env[env];
        if (!url) { console.warn(`announcements: 沒設 ${env}，${name}的公告這次當作沒有`); continue; }
        const doc = await get(url).catch((e) => { throw new Error(`${name}的 gist 抓不到（${e.message}）`); });
        if (!Array.isArray(doc?.announcements)) throw new Error(`${name}的 gist 裡沒有 announcements 陣列`);
        docs.push(doc);
      }
      if (!docs.length) throw new Error('兩份 gist 的網址都沒設');
      const data = build(...docs);
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');
      console.log(`announcements: ${data.zh.length} 則 → ${path.relative(root, OUT)}`);
    } catch (e) {
      // 錯誤訊息不帶網址：它是 secret，Actions 會遮，本機的 log 也不該留
      console.warn(`announcements: 沒更新（${e.message}）${fs.existsSync(OUT) ? '，沿用現有的 announcements.json' : ''}`);
    }
    writePages(snapshot());
  }
}

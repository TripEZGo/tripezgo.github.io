/* 「我的遊記」：從作者部落格的 sitemap 撈出「Z 度旅行遊記」分類的文章 → assets/data/journals.json。
 *
 *   node tools/journals.mjs
 *
 * GitHub Actions 部署前會跑一次（.github/workflows/pages.yml，含每天一次的排程），所以部落格發新遊記，
 * 官網隔天就會出現；repo 裡那份是最後一次在本機跑的快照，CI 抓不到網路時照舊用它。
 *
 * 來源：https://zhgchg.li/sitemap.xml 裡 /posts/z-度旅行遊記/ 開頭、<meta name="author" content="ZhgChgLi"> 的文章（繁中是主版本）。每篇讀它的
 * og:title、og:image、article:published_time，以及 hreflang 指到的英文、日文版本（各自再讀一次 og:title）。
 * 依發佈時間由新到舊排。官網韓文頁沒有韓文版遊記，前端用英文那份。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'assets/data/journals.json');
const SITEMAP = 'https://zhgchg.li/sitemap.xml';
const CATEGORY = 'https://zhgchg.li/posts/z-%E5%BA%A6%E6%97%85%E8%A1%8C%E9%81%8A%E8%A8%98/';
const AUTHOR = 'ZhgChgLi';   // 只列作者本人寫的（同分類裡也有 AI 代寫的攻略，例如 author="Andy AI"）——使用者 2026-10-12

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, prop) => { const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`)); return m ? decode(m[1]) : null; };
const alt = (html, lang) => { const m = html.match(new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]*)"`)); return m ? encodeURI(decode(m[1])) : null; };

async function get(url) {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'tripezgo.com journals builder' }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) { if (k >= 2) throw new Error(`${url}: ${e.message}`); await new Promise((r) => setTimeout(r, 1000 * (k + 1))); }
  }
}

async function post(url) {
  const html = await get(url);
  if (meta(html, 'author') !== AUTHOR) return null;
  const item = { date: meta(html, 'article:published_time'), image: meta(html, 'og:image'), zh: { title: meta(html, 'og:title'), url } };
  for (const l of ['en', 'ja']) {
    const u = alt(html, l);
    if (!u) continue;
    try { item[l] = { title: meta(await get(u), 'og:title'), url: u }; } catch (e) { console.warn('skip', l, e.message); }
  }
  if (!item.date || !item.image || !item.zh.title) throw new Error(`${url}: 少了 og:title／og:image／published_time`);
  return item;
}

try {
  const xml = await get(SITEMAP);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => u.startsWith(CATEGORY) && u !== CATEGORY);   // 分類首頁本身不算
  if (!urls.length) throw new Error('sitemap 裡找不到任何遊記');
  const items = [];
  for (let i = 0; i < urls.length; i += 4) items.push(...(await Promise.all(urls.slice(i, i + 4).map(post))).filter(Boolean));
  items.sort((a, b) => b.date.localeCompare(a.date));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 1) + '\n');
  console.log(`journals: ${items.length} 篇 → ${path.relative(root, OUT)}`);
} catch (e) {
  // 抓不到就沿用 repo 裡的快照，不擋部署
  console.warn(`journals: 沒更新（${e.message}）${fs.existsSync(OUT) ? '，沿用現有的 journals.json' : ''}`);
}

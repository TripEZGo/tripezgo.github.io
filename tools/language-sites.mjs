import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
export const locales = { 'zh-tw': '', 'zh-cn': '/zh-cn', en: '/en', ja: '/ja', ko: '/ko' };   // zh-cn：簡體中文版（1.7.0）；目前只有首頁，其餘頁面連回 zh-tw（見 stageLanguage）
const apex = 'tripezgo.com';
const marketing = /^\/(?:index\.html)?$|^\/(?:contact|announcements)(?:\/|\/index\.html)?$|^\/(?:privacy|terms)\.html$/;
export function preferredLanguage(header = '') {
  const choices = header.split(',').map((part, index) => {
    const [tag, ...params] = part.trim().toLowerCase().split(';');
    const q = params.find(p => p.trim().startsWith('q='));
    return { tag, q: q ? Number(q.trim().slice(2)) : 1, index };
  }).filter(x => x.q > 0 && x.q <= 1).sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of choices) {
    if (/^zh-(?:hans|cn|sg)(?:-|$)/.test(tag)) return 'zh-cn';   // 簡體：zh-Hans、zh-CN、zh-SG
    if (/^zh(?:-|$)/.test(tag)) return 'zh-tw';
    for (const lang of ['en', 'ja', 'ko']) if (tag === lang || tag.startsWith(lang + '-')) return lang;
  }
  return 'en';
}
export function publicURL(value) {
  let url;
  try { url = new URL(value, 'https://' + apex); } catch { return value; }
  if (![apex, 'www.' + apex].includes(url.hostname)) return value;
  const match = url.pathname.match(/^\/(en|ja|ko|zh-cn)(?=\/|$)/);
  const path = match ? url.pathname.slice(match[0].length) || '/' : url.pathname;
  if (!marketing.test(path)) return value;
  return `https://${match ? match[1] : 'zh-tw'}.${apex}${path}${url.search}${url.hash}`;
}
export function rewriteContent(text) {
  // Only complete URL tokens; assets, App utility paths and fragments stay intact.
  return text.replace(/(["'])(https:\/\/(?:www\.)?tripezgo\.com[^\s"'<>]*|\/(?!\/)[^\s"'<>]*)\1/g,
    (whole, quote, value) => quote + publicURL(value) + quote);
}

export function redirectPage(target) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="canonical" href="${target}"><title>TripEZGo</title></head><body><a href="${target}">Continue to TripEZGo</a><script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script></body></html>`;
}
export function languageEntry(englishHTML) {
  // Serve real English content first. Navigation failure must leave a usable page.
  const script = `<script data-language-redirect>(() => {
    const preferredLanguage = ${preferredLanguage.toString()};
    let language = 'en';
    try { language = preferredLanguage((navigator.languages || [navigator.language]).join(',')); } catch {}
    try { location.replace('https://' + language + '.tripezgo.com' + location.pathname + location.search + location.hash); } catch {}
  })();</script>`;
  // The destination records the visit; avoid counting the transient router as another page view.
  return englishHTML.replace('<script defer src="/assets/js/analytics.js"></script>', '').replace('</body>', script + '\n</body>');
}
export function stageLanguage(root, lang = 'router') {
  if (lang !== 'router' && !Object.hasOwn(locales, lang)) throw new Error('Unsupported DEPLOY_LANG: ' + lang);
  // Flatten the selected language before removing source language directories.
  if (lang !== 'router' && locales[lang]) {
    for (const name of ['index.html', 'privacy.html', 'terms.html', 'contact', 'announcements']) {
      const from = new URL(locales[lang].slice(1) + '/' + name, root);
      if (lang === 'zh-cn' && !existsSync(from)) {   // 簡體版還沒有隱私、條款、聯絡、公告：照繁中那份發佈，頁尾連結才不會 404
        continue;   // 根目錄那份（繁中）本來就在 root 裡
      }
      cpSync(from, new URL(name, root), { recursive: true });
    }
  }
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) walk(file);
      else if (/\.(html|xml)$/.test(entry.name) || entry.name === 'chrome.js' || entry.name === 'announcements.json') {
        let text = rewriteContent(readFileSync(file, 'utf8'));
        text = text.replace(/(hreflang="x-default" href=")https:\/\/zh-tw\.tripezgo\.com/g, '$1https://en.tripezgo.com');
        if (entry.name === 'sitemap.xml') {
          text = text.replace(/https:\/\/tripezgo\.com\/[^<\s]*/g, publicURL);
          if (lang !== 'router') text = text.replace(/  <url>[\s\S]*?<\/url>/g, entry => entry.includes('<loc>https://' + lang + '.tripezgo.com/') ? entry : '');
        }
        writeFileSync(file, text);
      }
    }
  }
  walk(root);
  const routerPages = lang === 'router' ? new Map(
    ['index.html', 'privacy.html', 'terms.html', 'contact/index.html', 'announcements/index.html']
      .map(name => [name, readFileSync(new URL('en/' + name, root), 'utf8')])
  ) : null;
  // Old language paths remain usable on the main domain and each language host.
  for (const code of ['en', 'ja', 'ko', 'zh-cn']) {
    rmSync(new URL(code + '/', root), { recursive: true, force: true });
    for (const name of code === 'zh-cn' ? ['index.html'] : ['index.html', 'privacy.html', 'terms.html', 'contact/index.html', 'announcements/index.html']) {
      const file = new URL(code + '/' + name, root);
      const path = name.replace(/index\.html$/, '');
      writeRedirect(file, 'https://' + code + '.tripezgo.com/' + path);
    }
  }
  if (lang === 'router') {
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + Object.keys(locales).map(code => '<sitemap><loc>https://' + code + '.tripezgo.com/sitemap.xml</loc></sitemap>').join('') + '</sitemapindex>\n';
    writeFileSync(new URL('sitemap.xml', root), sitemap);
    for (const [name, englishHTML] of routerPages) writeFileSync(new URL(name, root), languageEntry(englishHTML));
  }
  if (lang !== 'router') {
    const robots = new URL('robots.txt', root);
    try { writeFileSync(robots, readFileSync(robots, 'utf8').replace('https://tripezgo.com/sitemap.xml', 'https://' + lang + '.tripezgo.com/sitemap.xml')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  writeFileSync(new URL('CNAME', root), (lang === 'router' ? apex : lang + '.' + apex) + '\n');
}
function writeRedirect(file, target) { mkdirSync(new URL('./', file), { recursive: true }); writeFileSync(file, redirectPage(target)); }

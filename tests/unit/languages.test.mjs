/* 網站的四種語言（2026-10-12 加了韓文）：每一頁的語言下拉、hreflang 與 sitemap 都要四語互通。
 * 加第五種語言時，從 SITE_LANGS 開始改，這裡會把漏掉的頁指出來。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(root, p), 'utf8');

/** 語言代碼 → 網址前綴與下拉上的名稱 */
const SITE_LANGS = {
  'zh-Hant': { prefix: '/', name: '繁體中文' },
  en: { prefix: '/en/', name: 'English' },
  ja: { prefix: '/ja/', name: '日本語' },
  ko: { prefix: '/ko/', name: '한국어' },
};
/** 只有首頁的語言（簡體中文，1.7.0）：隱私、條款、聯絡、公告還沒有簡體版，那幾頁的下拉不列它。 */
const HOME_ONLY = { 'zh-Hans': { prefix: '/zh-cn/', name: '简体中文' } };
/** 每一語都有一份的頁（相對於語言前綴） */
const PAGES = ['index.html', 'privacy.html', 'terms.html'];
const fileOf = (lang, page) => SITE_LANGS[lang].prefix.slice(1) + page;
const urlOf = (lang, page) => SITE_LANGS[lang].prefix + page.replace(/index\.html$/, '');

test('every language has every page', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of PAGES) assert.ok(existsSync(join(root, fileOf(lang, page))), fileOf(lang, page));
});

test('each page\'s language menu shows its own language and links to the same page in the other three', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of PAGES) {
    const html = read(fileOf(lang, page));
    const at = html.indexOf('<details class="lang-menu">');   // 頁首另有漢堡選單的 <details>，從語言選單開頭往後找它自己的結尾
    const menu = html.slice(at, html.indexOf('</details>', at));
    assert.match(menu, new RegExp(`<summary>${SITE_LANGS[lang].name}</summary>`), fileOf(lang, page));
    const links = [...menu.matchAll(/<a class="lang" href="([^"]+)" hreflang="([^"]+)" lang="([^"]+)">([^<]+)<\/a>/g)];
    const home = page === 'index.html';
    const others = [...Object.keys(SITE_LANGS).filter((l) => l !== lang), ...(home ? Object.keys(HOME_ONLY) : [])];
    assert.deepEqual(links.map((m) => m[2]).sort(), others.sort(), fileOf(lang, page));
    for (const [, href, hreflang, , name] of links) {
      const L = SITE_LANGS[hreflang] || HOME_ONLY[hreflang];
      assert.equal(href, home || SITE_LANGS[hreflang] ? L.prefix + (SITE_LANGS[hreflang] ? page.replace(/index\.html$/, '') : '') : urlOf(hreflang, page), fileOf(lang, page));
      assert.equal(name, L.name, fileOf(lang, page));
    }
  }
});

test('the <html lang> matches the folder', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of PAGES) {
    assert.match(read(fileOf(lang, page)), new RegExp(`<html lang="${lang}(-TW)?">`), fileOf(lang, page));
  }
});

test('homepages and legal pages list all four languages as hreflang alternates', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of ['index.html', 'privacy.html', 'terms.html']) {
    const html = read(fileOf(lang, page));
    for (const l of Object.keys(SITE_LANGS)) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${l}" href="https://tripezgo.com${urlOf(l, page)}">`), `${fileOf(lang, page)} → ${l}`);
    }
  }
});

test('the sitemap lists every language of the homepage and legal pages, each with all four alternates', () => {
  const xml = read('sitemap.xml');
  for (const page of ['index.html', 'privacy.html', 'terms.html']) for (const lang of Object.keys(SITE_LANGS)) {
    const loc = `https://tripezgo.com${urlOf(lang, page)}`;
    const i = xml.indexOf(`<loc>${loc}</loc>`);
    assert.ok(i >= 0, loc);
    const entry = xml.slice(i, xml.indexOf('</url>', i));
    for (const l of Object.keys(SITE_LANGS)) {
      assert.ok(entry.includes(`hreflang="${l}" href="https://tripezgo.com${urlOf(l, page)}"`), `${loc} → ${l}`);
    }
  }
});

test('the 404 page links to every language\'s homepage', () => {
  const html = read('404.html');
  for (const lang of ['en', 'ja', 'ko']) assert.ok(html.includes(`href="${SITE_LANGS[lang].prefix}" hreflang="${lang}"`), lang);
});

test('the Simplified Chinese homepage (/zh-cn/) is its own language: html lang, canonical, a menu that lists the others, hreflang alternates both ways', () => {
  const html = read('zh-cn/index.html');
  assert.match(html, /<html lang="zh-Hans">/);
  assert.ok(html.includes('<link rel="canonical" href="https://tripezgo.com/zh-cn/">'));
  const at = html.indexOf('<details class="lang-menu">');
  const menu = html.slice(at, html.indexOf('</details>', at));
  assert.match(menu, /<summary>简体中文<\/summary>/);
  assert.deepEqual([...menu.matchAll(/hreflang="([^"]+)" lang=/g)].map((m) => m[1]).sort(), ['en', 'ja', 'ko', 'zh-Hant']);
  for (const l of ['zh-Hant', 'en', 'ja', 'ko', 'zh-Hans']) assert.ok(html.includes(`hreflang="${l}" href=`), l);
  for (const lang of Object.keys(SITE_LANGS)) assert.ok(read(fileOf(lang, 'index.html')).includes('<link rel="alternate" hreflang="zh-Hans" href="https://tripezgo.com/zh-cn/">'), lang);
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''), /[一-鿿]*(隱私權|註冊|離線|購物清單|總覽)/, '還有繁體詞');
});

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
/** 每一語都有一份的頁（相對於語言前綴） */
const PAGES = ['index.html', 'privacy.html', 'terms.html', 'share/index.html'];
const fileOf = (lang, page) => SITE_LANGS[lang].prefix.slice(1) + page;
const urlOf = (lang, page) => SITE_LANGS[lang].prefix + page.replace(/index\.html$/, '');

test('every language has every page', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of PAGES) assert.ok(existsSync(join(root, fileOf(lang, page))), fileOf(lang, page));
});

test('each page\'s language menu shows its own language and links to the same page in the other three', () => {
  for (const lang of Object.keys(SITE_LANGS)) for (const page of PAGES) {
    const html = read(fileOf(lang, page));
    const menu = html.slice(html.indexOf('<details class="lang-menu">'), html.indexOf('</details>'));
    assert.match(menu, new RegExp(`<summary>${SITE_LANGS[lang].name}</summary>`), fileOf(lang, page));
    const links = [...menu.matchAll(/<a class="lang" href="([^"]+)" hreflang="([^"]+)" lang="([^"]+)">([^<]+)<\/a>/g)];
    const others = Object.keys(SITE_LANGS).filter((l) => l !== lang);
    assert.deepEqual(links.map((m) => m[2]).sort(), others.sort(), fileOf(lang, page));
    for (const [, href, hreflang, , name] of links) {
      assert.equal(href, urlOf(hreflang, page), fileOf(lang, page));
      assert.equal(name, SITE_LANGS[hreflang].name, fileOf(lang, page));
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

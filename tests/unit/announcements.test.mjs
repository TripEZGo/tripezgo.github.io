/* 首頁的公告與 /announcements/（使用者 2026-10-26）：tools/announcements.mjs 把 App 的公告 gist 整理成四語。
 * 規則照 App 的 Domain/Model/Announcement.swift——同一份 gist，兩邊看到的要是同一組公告、同一個順序。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, day, siteLink, PAGES, pagePath, renderPage } from '../../tools/announcements.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const t = (zh, en, extra = {}) => ({ 'zh-Hant': zh, en, ...extra });

test('沒有 announcements 陣列是壞文件（回 null、沿用快照）；明確的空陣列才是「公告撤光了」', () => {
  assert.equal(build({}), null);
  assert.equal(build({ announcements: 'x' }), null);
  assert.equal(build(null), null);
  assert.deepEqual(build({ announcements: [] }), { zh: [], en: [], ja: [], ko: [] });
});

test('新的在前；沒 date（或寫壞）的排在後面；同一天照 gist 順序；沒 id 的不收', () => {
  const doc = { announcements: [
    { id: 'nodate', title: t('無日期', 'No date') },
    { id: 'old', date: '2026-10-01', title: t('舊', 'Old') },
    { id: 'same-a', date: '2026-10-20', title: t('甲', 'A') },
    { title: t('沒 id', 'No id'), date: '2026-12-01' },
    { id: 'same-b', date: '2026-10-20', title: t('乙', 'B') },
    { id: 'bad', date: '2026-02-30', title: t('壞日期', 'Bad date') },
    'not an object',
  ] };
  assert.deepEqual(build(doc).zh.map((a) => a.id), ['same-a', 'same-b', 'old', 'nodate', 'bad']);
  assert.equal(build(doc).zh.find((a) => a.id === 'bad').date, null);
});

test('日期只收 yyyy-MM-dd，不存在的日期也不收', () => {
  assert.equal(day('2026-11-01'), '2026-11-01');
  for (const bad of ['2026-11-1', '2026-11-01T00:00:00Z', '2026-02-29', 20261101, null]) assert.equal(day(bad), null, String(bad));
});

test('依語系逐欄挑字：zh-Hant-TW → zh-Hant → zh → en；標題與內文都挑不到的不列；按鈕文字挑不到就沒按鈕', () => {
  const doc = { announcements: [
    { id: 'a', title: { zh: '中', en: 'EN' }, body: { 'zh-Hant-TW': '台', ja: '日' }, button: { title: { en: 'Go' }, url: 'https://example.com/' } },
    { id: 'only-ja', title: { ja: 'だけ' } },
  ] };
  const out = build(doc);
  assert.deepEqual([out.zh[0].title, out.zh[0].body], ['中', '台']);
  assert.deepEqual([out.ja[0].title, out.ja[0].body], ['EN', '日']);
  assert.equal(out.ko[0].body, null);
  assert.equal(out.zh[0].button.title, 'Go');
  assert.deepEqual(out.ja.map((a) => a.id), ['a', 'only-ja']);
  assert.deepEqual(out.en.map((a) => a.id), ['a']);
  assert.equal(build({ announcements: [{ id: 'b', title: t('x', 'x'), button: { title: { ja: 'だけ' }, url: 'https://example.com/' } }] }).en[0].button, null);
});

test('圖與連結只收 https；tripezgo.com 的首頁連結換成這一語的首頁、同分頁，其他開新分頁', () => {
  const doc = { announcements: [
    { id: 'a', title: t('x', 'x'), imageURL: 'http://tripezgo.com/a.png', button: { title: t('去', 'Go'), url: 'javascript:alert(1)' } },
    { id: 'b', title: t('x', 'x'), imageURL: 'https://tripezgo.com/a.png', button: { title: t('去', 'Go'), url: 'https://tripezgo.com/#promo' } },
  ] };
  const out = build(doc);
  assert.equal(out.zh[0].image, null);
  assert.equal(out.zh[0].button, null);
  assert.equal(out.zh[1].image, 'https://tripezgo.com/a.png');
  assert.deepEqual(out.zh[1].button, { title: '去', url: '/#promo', external: false });
  assert.deepEqual(out.en[1].button, { title: 'Go', url: '/en/#promo', external: false });
  assert.deepEqual(siteLink(new URL('https://tripezgo.com/privacy.html'), 'ja'), { url: '/privacy.html', external: false });
  assert.deepEqual(siteLink(new URL('https://apps.apple.com/app/id6801536372')), { url: 'https://apps.apple.com/app/id6801536372', external: true });
});

test('/announcements/ 四頁跟產生器、快照與首頁同步（改了首頁或快照要跑 node tools/announcements.mjs --offline）', () => {
  const data = JSON.parse(read('assets/data/announcements.json'));
  for (const page of PAGES) {
    const file = pagePath(page.key).slice(1) + 'index.html';
    assert.equal(read(file), renderPage(page, data[page.key]), file);
  }
});

test('快照裡沒有 gist 的網址（secret gist 永不公開）', () => {
  for (const p of ['assets/data/announcements.json', 'tools/announcements.mjs', '.github/workflows/pages.yml', 'index.html']) {
    assert.ok(!/gist\.github(usercontent)?\.com\/[\w-]+\/[0-9a-f]{20,}/.test(read(p)), p);
  }
});

test('每一語的首頁：導覽列是 功能(#privacy)・公告・藍圖・方案・關於，頁尾與區塊都連到同一語的公告頁', () => {
  for (const page of PAGES) {
    const home = read(pagePath(page.key).replace('announcements/', '').slice(1) + 'index.html');
    const nav = home.slice(home.indexOf('<nav class="site-nav"'), home.indexOf('<details class="nav-menu">'));
    assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), ['#privacy', '#announcements', '#roadmap', '#plans', '#about'], page.key);
    assert.ok(home.includes(`<a class="ann-all" href="${pagePath(page.key)}">`), page.key);
    assert.ok(home.includes(`<a href="${pagePath(page.key)}">`), page.key + ' footer');
  }
});

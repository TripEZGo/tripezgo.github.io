/* 公告（使用者 2026-10-26）：首頁藍圖前一區畫最新 5 則，全部的在 /announcements/。資料是 assets/data/announcements.json，
 * 這裡用假資料蓋掉，不跟著 gist 變。 */
import { test, expect } from '@playwright/test';

const LANGS = ['/', '/en/', '/ja/', '/ko/'];
const today = new Date().toISOString().slice(0, 10);
const item = (id, date, extra = {}) => ({ id, date, title: `標題 ${id}`, body: `內文 ${id}\n第二行`, image: null, button: null, ...extra });
const SIX = [
  item('a', today, { button: { title: '參加活動', url: '/#promo', external: false } }),
  item('b', '2026-09-01', { button: { title: '外站', url: 'https://example.com/', external: true } }),
  item('c', '2026-08-01'), item('d', '2026-07-01'), item('e', '2026-06-01'), item('f', '2026-05-01'),
];
const feed = (page, list) => page.route(/\/assets\/data\/announcements\.json/, (r) => r.fulfill({
  json: { zh: list, en: list, ja: list, ko: list },
}));

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const lang of LANGS) {
  test(`home: announcements sit right before the roadmap, newest as the big card, then up to 4 more rows: ${lang}`, async ({ page }) => {
    await feed(page, SIX);
    await page.goto(lang);
    const ids = await page.locator('main > section[id]').evaluateAll((s) => s.map((e) => e.id));
    expect(ids.indexOf('announcements')).toBe(ids.indexOf('roadmap') - 1);
    const sec = page.locator('#announcements');
    await expect(sec).toBeVisible();
    await expect(sec.locator('.ann-feature h3')).toHaveText('標題 a');
    await expect(sec.locator('.ann-feature .ann-new')).toBeVisible();
    await expect(sec.locator('.ann-item')).toHaveCount(4);   // 最多 5 則：大卡 1 ＋ 4 行
    await expect(sec.locator('.ann-all')).toHaveAttribute('href', `${lang}announcements/`);
  });
}

test('home: the button stays on the page for site links and opens a new tab for others; rows expand to show the body', async ({ page }) => {
  await feed(page, SIX);
  await page.goto('/');
  await expect(page.locator('.ann-feature .btn')).toHaveAttribute('href', '#promo');   // 同一頁：只留錨點
  await expect(page.locator('.ann-feature .btn')).not.toHaveAttribute('target', '_blank');
  const row = page.locator('.ann-item').first();
  await expect(row.locator('.ann-text')).toBeHidden();
  await row.locator('summary').click();
  await expect(row.locator('.ann-text')).toHaveText('內文 b\n第二行');
  await expect(row.locator('.ann-link')).toHaveAttribute('target', '_blank');
});

test('home: text from the feed is escaped, never parsed as HTML', async ({ page }) => {
  await feed(page, [item('x', today, { title: '<img src=x onerror="window.__pwned=1">' })]);
  await page.goto('/');
  await expect(page.locator('.ann-feature h3')).toHaveText('<img src=x onerror="window.__pwned=1">');
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});

for (const [name, fulfil] of [['empty', (r) => r.fulfill({ json: { zh: [] } })], ['missing', (r) => r.fulfill({ status: 404 })]]) {
  test(`home: no announcements (${name}) → the whole section stays hidden`, async ({ page }) => {
    await page.route(/\/assets\/data\/announcements\.json/, fulfil);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#announcements')).toBeHidden();
  });
}

for (const lang of LANGS) {
  test(`header: 功能 jumps to #privacy, 公告 to #announcements, no separate privacy link: ${lang}`, async ({ page }) => {
    await page.goto(lang);
    const hrefs = await page.locator('.site-header .site-nav > a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['#privacy', '#announcements', '#roadmap', '#plans', '#about']);
  });

  test(`/announcements/: every announcement from the snapshot, the header marks this page, languages switch to the same page: ${lang}`, async ({ page }) => {
    await page.goto(`${lang}announcements/`);
    const data = await (await page.request.get('/assets/data/announcements.json')).json();
    const key = { '/': 'zh', '/en/': 'en', '/ja/': 'ja', '/ko/': 'ko' }[lang];
    const list = data[key];
    if (list.length) await expect(page.locator('.an-entry')).toHaveCount(list.length);
    else await expect(page.locator('.an-empty')).toBeVisible();
    await expect(page.locator('.site-nav > a[aria-current="page"]')).toHaveAttribute('href', `${lang}announcements/`);
    for (const a of await page.locator('.lang-list .lang').all()) await expect(a).toHaveAttribute('href', /\/announcements\/$/);
  });
}

test('/announcements/: a link to #<id> outlines that card', async ({ page }) => {
  const data = await (await page.request.get('/assets/data/announcements.json')).json();
  test.skip(!data.zh.length, '快照裡沒有公告');
  await page.goto(`/announcements/#${data.zh[0].id}`);
  const ring = await page.locator('.an-entry:target .an-card').evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).not.toBe('none');
});

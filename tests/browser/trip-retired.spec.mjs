/* 票 35／S60：舊公開連結一律顯示「這個連結已停用」。黃金檔裡的每一條真連結打開，看到的都是這一句——
 * 不讀 CloudKit、不載 trip/ 底下的任何 JS、沒有 CSP 違規；# 後面是什麼、帶什麼查詢字串都一樣。 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const golden = JSON.parse(readFileSync(new URL('../fixtures/golden-v1.json', import.meta.url), 'utf8'));
const dayzones = JSON.parse(readFileSync(new URL('../fixtures/golden-v1-dayzones.json', import.meta.url), 'utf8'));
const links = [...golden.cases, ...dayzones.cases].map((c) => c.url);

async function watch(page) {
  const requests = [];
  const violations = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
  return { requests, violations: async () => violations.concat(await page.evaluate(() => window.__csp || [])) };
}

test('黃金檔的每一條真連結（含每一天各帶時區那份）都只顯示「這個連結已停用」，沒有網路、沒有 trip/ 的 JS', async ({ page }) => {
  expect(links.length).toBeGreaterThan(2);
  for (const url of links) {
    const w = await watch(page);
    await page.goto('/trip/' + new URL(url).hash);
    await expect(page.locator('h1:visible')).toHaveText('這個連結已停用');
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('TripEZGo 行程');
    expect(w.requests.filter((u) => /apple-cloudkit|apple-mapkit|\/trip\/[a-z]+\.js/.test(u))).toEqual([]);
    expect(await w.violations()).toEqual([]);
  }
});

for (const suffix of ['', '#', '#not-a-link', '#' + 'a'.repeat(32) + '.' + 'b'.repeat(43), '?open=1#x', '?ckWebAuthToken=tok#x', '?mode=embed#x']) {
  test('/trip/' + suffix.slice(0, 24) + ' 也一樣', async ({ page }) => {
    const w = await watch(page);
    await page.goto('/trip/' + suffix);
    await expect(page.locator('h1:visible')).toHaveText('這個連結已停用');
    expect(w.requests.filter((u) => /apple-cloudkit|apple-mapkit/.test(u))).toEqual([]);
    expect(await w.violations()).toEqual([]);
  });
}

const SENTENCES = {
  'zh-TW': ['zh-Hant', '這個連結已停用'],
  'zh-HK': ['zh-Hant', '這個連結已停用'],
  'zh-CN': ['zh-Hans', '这个链接已停用'],
  en: ['en', 'This link has been disabled'],
  'en-US': ['en', 'This link has been disabled'],
  ja: ['ja', 'このリンクは無効になりました'],
  ko: ['ko', '이 링크는 사용이 중지되었습니다'],
  fr: ['en', 'This link has been disabled'],
};
for (const [locale, [lang, sentence]] of Object.entries(SENTENCES)) {
  test.describe('瀏覽器語言 ' + locale, () => {
    test.use({ locale });
    test('只顯示該語言那一句，html lang 與分頁標題跟著', async ({ page }) => {
      await page.goto('/trip/#' + new URL(links[0]).hash.slice(1));
      await expect(page.locator('h1:visible')).toHaveText(sentence);
      await expect(page.locator('h1:visible')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(sentence + ' — TripEZGo');
    });
  });
}

test.describe('沒有 JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('五種語言都看得到', async ({ page }) => {
    await page.goto('/trip/#x');
    await expect(page.locator('h1:visible')).toHaveCount(5);
  });
});

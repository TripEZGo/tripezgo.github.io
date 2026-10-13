/* 官網 ?mode=embed（2026-10-12）：App 設定的 WebView 開首頁、聯絡我們、隱私權政策、使用條款。 */
import { test, expect } from '@playwright/test';

const LANGS = ['/', '/en/', '/ja/', '/ko/'];
const HIDDEN = ['.site-header', '.hero', '.site-footer', '.fab-dl', '.plans-cta', '.nav-menu', '.fab-qr', 'a[href*="apps.apple.com"]'];

// 外站（MapKit、Google 表單、字型）一律擋掉：測的是這個站自己的頁
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
});

async function expectAllHidden(page, home) {
  // 首頁的頁首留著當章節定位列，只藏品牌和語言選單
  for (const sel of home ? [...HIDDEN.filter((s) => s !== '.site-header'), '.site-header .brand', '.site-header .lang-menu'] : HIDDEN) {
    const loc = page.locator(sel);
    for (let i = 0; i < (await loc.count()); i++) await expect(loc.nth(i), sel).toBeHidden();
  }
}

for (const lang of LANGS) {
  for (const path of ['', 'privacy.html', 'terms.html', 'contact/']) {
    test(`embed hides chrome and download buttons: ${lang}${path}`, async ({ page }) => {
      await page.goto(`${lang}${path}?mode=embed`);
      await expect(page.locator('html')).toHaveClass(/\bembed\b/);
      await expectAllHidden(page, path === '');
      // 首頁的浮動下載鈕要捲動後才出現：捲到底再看一次
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await expectAllHidden(page, path === '');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator('link[rel="canonical"]')).not.toHaveAttribute('href', /mode=embed/);
    });

    test(`embed tags same-site links, leaves anchors and other sites alone: ${lang}${path}`, async ({ page }) => {
      await page.goto(`${lang}${path}?mode=embed`);
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const h of hrefs) {
        if (h.startsWith('#')) continue;
        if (/^(https?:|mailto:)/.test(h) && !h.startsWith(page.url().split('/').slice(0, 3).join('/'))) { expect(h, h).not.toContain('mode=embed'); continue; }
        expect(h, h).toMatch(/[?&]mode=embed(?:&|#|$)/);
      }
    });

    test(`without mode=embed nothing changes: ${lang}${path}`, async ({ page }) => {
      await page.goto(`${lang}${path}`);
      await expect(page.locator('html')).not.toHaveClass(/\bembed\b/);
      await expect(page.locator('.site-header')).toBeVisible();
      await expect(page.locator('.site-footer')).toBeVisible();
      if (path === '') await expect(page.locator('.hero')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      const tagged = await page.locator('a[href*="mode=embed"]').count();
      expect(tagged).toBe(0);
    });
  }
}

test('embed home: section jump bar sits on top, each chip lands its section just below it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // 不等平滑捲動
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const lang of LANGS) {
      await page.goto(`${lang}?mode=embed`);
      const chips = page.locator('.site-header .site-nav > a[href^="#"]');
      await expect(chips).toHaveCount(4);
      for (let i = 0; i < 4; i++) await expect(chips.nth(i)).toBeVisible();
      const bar = await page.locator('.site-header').evaluate((el) => el.getBoundingClientRect());
      expect(bar.top).toBeLessThanOrEqual(1);
      expect(bar.height).toBeLessThan(70);
      const first = await page.locator('main > section:visible').first().evaluate((el) => el.getBoundingClientRect().top);
      expect(first).toBeLessThanOrEqual(bar.bottom + 1);
      for (const id of ['plans', 'about', 'privacy']) {
        await page.locator(`.site-header .site-nav > a[href="#${id}"]`).click();
        await page.waitForTimeout(100);
        expect(await page.locator('.site-header').evaluate((el) => el.getBoundingClientRect().top), id).toBeLessThanOrEqual(1);
        const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
        const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
        if (max > 1) expect(top, `${lang} ${width} #${id}`).toBeGreaterThanOrEqual(bar.height - 2);
      }
    }
  }
});

test('embed legal pages start near the top', async ({ page }) => {
  await page.goto('/terms.html?mode=embed');
  expect(await page.locator('h1').evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(140);
});

for (const lang of LANGS) {
  // 聯絡頁原本嵌 iframe，使用者 2026-10-12 改判成一顆開新分頁的按鈕（f12e0e0）：驗按鈕連到這一語、預選好語言
  test(`contact page links to the form in its language, language preselected: ${lang}`, async ({ page }) => {
    await page.goto(`${lang}contact/`);
    await expect(page.locator('iframe')).toHaveCount(0);
    const cta = page.locator('main a.cta');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('docs.google.com/forms/');
    expect(href).toContain('usp=pp_url');
    expect(decodeURIComponent(href)).toContain('entry.986219665=' + { '/': '繁體中文', '/en/': 'English', '/ja/': '日本語', '/ko/': '한국어' }[lang]);
    await expect(page.locator('main a[href="mailto:contact@tripezgo.com"]')).toBeVisible();
  });

  test(`terms has a Data Sources section: ${lang}`, async ({ page }) => {
    await page.goto(`${lang}terms.html`);
    const sec = page.locator('h2#t20');
    await expect(sec).toBeVisible();
    for (const t of ['GeoNames', 'CC BY 4.0', 'IANA', 'Unicode License v3', 'OpenCC', 'Apache License 2.0']) {
      await expect(page.locator('main a', { hasText: t }).first()).toBeVisible();
    }
    await expect(page.locator('main')).toContainText('© Unicode, Inc.');
    await expect(page.locator('.toc a[href="#t20"]')).toHaveCount(1);
  });
}

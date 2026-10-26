/* 藍圖（使用者 2026-10-13）：首頁獨立一區的橫向時間軸，卡片在線上下交錯；載入時只捲外框、把「進行中」置中。 */
import { test, expect } from '@playwright/test';

const LANGS = ['/', '/en/', '/ja/', '/ko/'];

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const lang of LANGS) {
  test(`roadmap sits between features and plans, one #roadmap, one milestone in progress: ${lang}`, async ({ page }) => {
    await page.goto(lang);
    const ids = await page.locator('main > section[id]').evaluateAll((s) => s.map((e) => e.id));
    expect(ids.indexOf('roadmap')).toBe(ids.indexOf('plans') - 1);
    expect(ids.indexOf('roadmap')).toBeGreaterThan(ids.indexOf('features'));
    await expect(page.locator('#roadmap')).toHaveCount(1);
    await expect(page.locator('.rm-item.is-now')).toHaveCount(1);   // 1.5.0 進行中（同時只標一張）
    await expect(page.locator('.rm-item[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('.rm-item.is-now[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('.rm-item.is-planned')).toHaveCount(3);   // 1.6.0、1.7.0，加上時程未定的那一張
    await expect(page.locator('.rm-item').last()).toHaveClass(/is-planned/);
    await expect(page.locator('.site-header .site-nav > a[href="#roadmap"]')).toHaveCount(1);
  });
}

for (const width of [390, 1280]) {
  test(`on load the current card is centred inside the frame, the page itself does not scroll sideways: ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const lang of LANGS) {
      await page.goto(lang);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const off = await page.evaluate(() => {
        const s = document.querySelector('.rm-scroller').getBoundingClientRect();
        const c = document.querySelector('.rm-item[aria-current="step"]').getBoundingClientRect();
        return Math.abs((c.left + c.width / 2) - (s.left + s.width / 2));
      });
      expect(off, lang).toBeLessThan(4);
    }
  });
}

test('cards alternate above and below the line; arrows step one milestone', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const sides = await page.locator('.rm-item').evaluateAll((items) => items.map((it) => {
    const dot = it.querySelector('.rm-dot').getBoundingClientRect(), card = it.querySelector('.rm-card').getBoundingClientRect();
    return card.bottom <= dot.top ? 'above' : card.top >= dot.bottom ? 'below' : 'overlap';
  }));
  sides.forEach((s, i) => expect(s, `#${i + 1}`).toBe(i % 2 ? 'below' : 'above'));
  const centred = () => page.evaluate(() => {
    const s = document.querySelector('.rm-scroller').getBoundingClientRect();
    return [...document.querySelectorAll('.rm-item')].findIndex((it) => { const r = it.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - (s.left + s.width / 2)) < 4; });
  });
  const start = await centred();
  await page.locator('.rm-btn[data-dir="-1"]').click();
  await page.waitForTimeout(200);
  expect(await centred()).toBe(start - 1);
});

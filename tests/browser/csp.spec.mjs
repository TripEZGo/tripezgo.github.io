/* 安全稽核 L16：open/、join/ 的 meta CSP 擋得住不該跑的東西，但不擋這幾頁自己要做的事（trip/ 已是停用頁，見 trip-retired.spec.mjs）。
 * 每一條都收 securitypolicyviolation 事件與 console 的 CSP 訊息，有任何一筆就紅。 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const dated = JSON.parse(readFileSync(new URL('../fixtures/golden-v1.json', import.meta.url), 'utf8')).cases.find((c) => c.name === 'dated');

async function watchViolations(page) {
  const seen = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) seen.push(m.text()); });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
  return async () => seen.concat(await page.evaluate(() => window.__csp || []).catch(() => []));
}

test('open/：舊的公開連結只顯示「已停用」，頁首頁尾照常畫，沒有任何 CSP 違規', async ({ page }) => {
  const violations = await watchViolations(page);
  const link = dated.url.replace(/^https:\/\/[^/]+/, 'https://www.tripezgo.com');
  await page.goto('/open/#' + encodeURIComponent(link));
  /* 公開連結已停用：只告訴他停用了，沒有「在 App 中打開」 */
  await expect(page.locator('h1')).toHaveText('這個連結已停用');
  await expect(page.getByTestId('open-app')).toBeHidden();
  await expect(page.getByTestId('open-get')).toBeHidden();
  await expect(page.locator('header.site-header .brand')).toBeVisible();
  await expect(page.locator('footer.site-footer a').first()).toBeVisible();
  expect(await violations()).toEqual([]);
});

test('open/：不認得的連結只顯示「不完整」，沒有 CSP 違規', async ({ page }) => {
  const violations = await watchViolations(page);
  await page.goto('/open/#' + encodeURIComponent('https://evil.example/trip/#x'));
  await expect(page.getByTestId('open-app')).toBeHidden();
  expect(await violations()).toEqual([]);
});

test('join/：非 Android 照舊轉到 /open/，邀請連結帶過去；沒有 CSP 違規', async ({ page }) => {
  const violations = await watchViolations(page);
  await page.goto('/join/#s=AbC_-123');
  await page.waitForURL(/\/open\/#/);
  await expect(page.getByTestId('open-kind')).toHaveText('旅程邀請');
  expect(await violations()).toEqual([]);
});

test('join/：Android 帶了不合格的片段不會叫起 App，改走 /open/ 顯示「不完整」（I5）', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('/join/#abc;S.browser_fallback_url=https://evil.example');
  await page.waitForURL(/\/open\/#/);
  await expect(page.getByTestId('open-app')).toBeHidden();
  await ctx.close();
});

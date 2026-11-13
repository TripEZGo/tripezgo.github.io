/* 加入共享：跳轉頁 /open/（使用者要求 2026-09-26）。
 *
 * 沒裝 App：加入頁（/join/）轉去 /open/#<正式連結>；那一頁第一下把正式連結存進剪貼簿，第二下去下載。
 * 公開連結（/trip/）1.10.0 起停用（票 35）：/open/ 認得它，但只顯示「已停用」，沒有按鈕、不存剪貼簿。 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const dated = JSON.parse(readFileSync(new URL('../fixtures/golden-v1.json', import.meta.url), 'utf8')).cases.find((c) => c.name === 'dated');
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const JOIN = 'https://www.tripezgo.com/join/#aHR0cHM6Ly93d3cuaWNsb3VkLmNvbS9zaGFyZS8wQUJjZF9FRi1naA';

/** 把某個正式主機名的請求轉給本機測試伺服器——頁面以為自己在那個網域上。
 *  要在 setup（假 config／CloudKit）**之前**掛：Playwright 的 route 後掛的先比對。 */
async function serveAs(page, host) {
  await page.route('https://' + host + '/**', async (route) => {
    const u = new URL(route.request().url());
    try {
      const r = await route.fetch({ url: 'http://localhost:4173' + u.pathname + u.search });
      await route.fulfill({ status: r.status(), headers: r.headers(), body: await r.body() });
    } catch (err) { /* 頁面已經關了 */ }
  });
}

test.describe('iPhone、沒裝 App', () => {
  test.use({ userAgent: IPHONE });

  test('舊的公開連結：只顯示「已停用」，沒有按鈕、剪貼簿沒被寫', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await serveAs(page, 'tripezgo.com');
    await page.goto('https://tripezgo.com/open/#' + encodeURIComponent(dated.url));
    await expect(page.locator('h1')).toHaveText('這個連結已停用');
    await expect(page.getByTestId('open-app')).toBeHidden();
    await expect(page.getByTestId('open-get')).toBeHidden();
    await expect(page.getByTestId('open-kind')).toHaveText('');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('');
  });

  test('加入共享：/join/ 轉到同一頁，存的是那條邀請連結', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await serveAs(page, 'tripezgo.com');
    await page.goto('https://tripezgo.com/join/' + new URL(JOIN).hash);
    await page.waitForURL('https://tripezgo.com/open/**');
    await expect(page.getByTestId('open-kind')).toHaveText('旅程邀請');
    await expect(page.getByTestId('open-app')).toHaveAttribute('href', JOIN);
    await page.getByTestId('open-get').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(JOIN);
    /* 第二下才離開：去 App Store */
    const get = page.getByTestId('open-get');
    await expect(get).toHaveText('前往下載');
    await expect(page.locator('h1')).toHaveText('連結已經存起來了');
    await expect(get).toHaveAttribute('href', 'https://apps.apple.com/app/id6801536372');
    await page.route('https://apps.apple.com/**', (route) => route.fulfill({ contentType: 'text/html', body: 'App Store' }));
    await get.click();
    await page.waitForURL('https://apps.apple.com/app/id6801536372');
  });
});

test('/open/ 不是誰都能用的轉址器：不是我們的連結就說不完整', async ({ page }) => {
  await serveAs(page, 'tripezgo.com');
  await page.goto('https://tripezgo.com/open/#' + encodeURIComponent('https://evil.example/trip/#x'));
  await expect(page.locator('h1')).toHaveText('這條連結不完整');
  await expect(page.getByTestId('open-app')).toBeHidden();
});

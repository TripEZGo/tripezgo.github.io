/* 安全稽核 L16：trip/、open/、join/ 的 meta CSP 擋得住不該跑的東西，但不擋這幾頁自己要做的事。
 * 每一條都收 securitypolicyviolation 事件與 console 的 CSP 訊息，有任何一筆就紅。 */
import { test, expect } from '@playwright/test';
import { AUTHOR, dated, fakeCloudKit, pathOf, recordOf, useConfig } from './fake-cloudkit.mjs';
import { fakeMapKit } from './fake-mapkit.mjs';

/* 「別的網站」用 127.0.0.1 對 localhost 來假裝；Chromium 預設不准這種公開→本機的 iframe，關掉那道檢查。 */
test.use({ launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests'] } });

async function watchViolations(page) {
  const seen = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) seen.push(m.text()); });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
  return async () => seen.concat(await page.evaluate(() => window.__csp || []).catch(() => []));
}

test('trip/：載入、切到地圖（MapKit JS）、換語言，沒有任何 CSP 違規', async ({ page }) => {
  const violations = await watchViolations(page);
  await fakeMapKit(page);
  await useConfig(page, { mapkitToken: 'test-mapkit-jwt' });
  await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } } });
  await page.goto(pathOf(dated));
  await expect(page.locator('h1')).toHaveText(dated.plaintext.trip.name);
  await page.locator('[data-view="map"]').click();
  await expect(page.getByTestId('map-section')).toBeVisible();
  expect(await page.evaluate(() => window.__mk.maps.length)).toBeGreaterThan(0);
  expect(await violations()).toEqual([]);
});

test('trip/：行內 script 與外站腳本進不來（CSP 真的在擋）', async ({ page }) => {
  await useConfig(page);
  await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } } });
  await page.goto(pathOf(dated));
  await expect(page.locator('h1')).toBeVisible();
  const result = await page.evaluate(() => new Promise((resolve) => {
    const hits = [];
    document.addEventListener('securitypolicyviolation', (e) => hits.push(e.violatedDirective));
    const inline = document.createElement('script');
    inline.textContent = 'window.__pwned = 1';
    document.head.appendChild(inline);
    const ext = document.createElement('script');
    ext.src = 'https://example.com/x.js';
    document.head.appendChild(ext);
    setTimeout(() => resolve({ hits, pwned: window.__pwned === 1 }), 300);
  }));
  expect(result.pwned).toBe(false);
  expect(result.hits.length).toBeGreaterThanOrEqual(2);
});

test('trip/：被別的網站的 iframe 嵌入時，行程與地圖照常畫，沒有 CSP 違規', async ({ page }) => {
  const seen = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) seen.push(m.text()); });
  await fakeMapKit(page);
  await useConfig(page, { mapkitToken: 'test-mapkit-jwt' });
  await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } } });
  await page.route('http://127.0.0.1:4173/evil', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><iframe id="f" src="' + new URL(pathOf(dated), 'http://localhost:4173').href + '" width="1000" height="900"></iframe>',
  }));
  await page.goto('http://127.0.0.1:4173/evil');
  const frame = page.frameLocator('#f');
  await expect(frame.locator('h1')).toHaveText(dated.plaintext.trip.name);
  await expect(frame.locator('html')).not.toHaveCSS('display', 'none');
  await frame.locator('[data-view="map"]').click();
  await expect(frame.getByTestId('map-section')).toBeVisible();
  const inner = page.frames().find((f) => f.url().includes('/trip/'));
  expect(await inner.evaluate(() => window.__mk.maps.length)).toBeGreaterThan(0);
  expect(await inner.evaluate(() => window.top !== window.self)).toBe(true);
  expect(seen).toEqual([]);
});

/* 使用者裁定 2026-10-20：能嵌入，但嵌入的那一份唯讀——沒有登入、沒有停止分享，換成一條回本站的連結。 */
async function framed(page, { token = false } = {}) {
  const seen = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) seen.push(m.text()); });
  await useConfig(page);
  const ck = await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } }, users: { 'tok-1': AUTHOR } });
  await page.route('http://127.0.0.1:4173/evil', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><iframe id="f" src="' + new URL(pathOf(dated), 'http://localhost:4173').href + '" width="1000" height="900"></iframe>',
  }));
  if (token) {
    /* 作者 token 在 iframe 的 origin（localhost:4173）的 sessionStorage 裡——先在本層登入過，再嵌進去。 */
    await page.addInitScript(() => { if (location.port === '4173' && location.hostname === 'localhost') sessionStorage.setItem('tez.auth.token.production', 'tok-1'); });
  }
  await page.goto('http://127.0.0.1:4173/evil');
  return { frame: page.frameLocator('#f'), ck, seen };
}

test('trip/ 被嵌入：沒有登入與停止分享，只有一條在 tripezgo.com 開啟的連結', async ({ page }) => {
  const { frame, seen } = await framed(page);
  await expect(frame.locator('h1')).toHaveText(dated.plaintext.trip.name);
  const link = frame.getByTestId('open-on-site');
  await expect(link).toHaveText('在 tripezgo.com 開啟');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener');
  await expect(link).toHaveAttribute('href', 'http://localhost:4173' + pathOf(dated));
  for (const id of ['author-entry', 'sign-in', 'author-stop', 'stop-go']) await expect(frame.getByTestId(id)).toHaveCount(0);
  await expect(frame.locator('[data-author]')).toHaveCount(0);
  expect(seen).toEqual([]);
});

test('trip/ 被嵌入：連結跟著頁內語言換（中、英、日）', async ({ page }) => {
  const { frame } = await framed(page);
  await expect(frame.locator('h1')).toBeVisible();
  const link = frame.getByTestId('open-on-site');
  for (const [k, text] of [['en', 'Open on tripezgo.com'], ['ja', 'tripezgo.com で開く'], ['zh', '在 tripezgo.com 開啟']]) {
    await frame.locator('#lang [data-lang="' + k + '"]').click();
    await expect(link).toHaveText(text);
  }
});

test('trip/ 被嵌入：sessionStorage 裡已經有作者 token 也不用它（不問 users/current、不出現作者卡片）', async ({ page }) => {
  const { frame, ck } = await framed(page, { token: true });
  await expect(frame.locator('h1')).toHaveText(dated.plaintext.trip.name);
  await expect(frame.getByTestId('open-on-site')).toBeVisible();
  await page.waitForTimeout(500);
  expect(ck.calls.filter((c) => c.path !== 'records/lookup')).toEqual([]);
  await expect(frame.locator('[data-author]')).toHaveCount(0);
});

test('trip/ 在最上層：作者入口照舊、沒有「在 tripezgo.com 開啟」', async ({ page }) => {
  await useConfig(page);
  await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } } });
  await page.goto(pathOf(dated));
  await expect(page.getByTestId('author-entry')).toBeVisible();
  await expect(page.getByTestId('open-on-site')).toHaveCount(0);
  await page.getByTestId('author-entry').click();
  await expect(page.getByTestId('sign-in')).toBeVisible();
});

test('open/：網址收得下、跳轉頁照常畫，沒有任何 CSP 違規', async ({ page }) => {
  const violations = await watchViolations(page);
  const link = dated.url.replace(/^https:\/\/[^/]+/, 'https://www.tripezgo.com');
  await page.goto('/open/#' + encodeURIComponent(link));
  await expect(page.getByTestId('open-kind')).toHaveText('公開旅程');
  await expect(page.getByTestId('open-app')).toBeVisible();
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

test('對照組：同一個 token 在最上層會被用（出現作者卡片），所以被嵌入時沒用它是真的沒用', async ({ page }) => {
  await useConfig(page);
  const ck = await fakeCloudKit(page, { stores: { production: { [dated.recordName]: recordOf(dated) } }, users: { 'tok-1': AUTHOR } });
  await page.addInitScript(() => sessionStorage.setItem('tez.auth.token.production', 'tok-1'));
  await page.goto(pathOf(dated));
  await expect(page.getByTestId('author-stop')).toBeVisible();
  expect(ck.calls.some((c) => c.path === 'users/current')).toBe(true);
});

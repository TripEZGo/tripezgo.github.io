/* 票 35：公開連結（/trip/）整個停用。頁面只說「這個連結已停用」，不讀資料、不解密、不載 cloudkit.js。
 * 瀏覽器端的行為在 tests/browser/trip-retired.spec.mjs；這裡守靜態的那一半。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../trip/index.html', import.meta.url), 'utf8');

test('五種語言（繁中、en、ja、ko、简中）各有一句，沒有 JS 時全部可見', () => {
  const heads = [...html.matchAll(/<h1 lang="([^"]+)">([^<]+)<\/h1>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(Object.fromEntries(heads), {
    'zh-Hant': '這個連結已停用',
    en: 'This link has been disabled',
    ja: 'このリンクは無効になりました',
    ko: '이 링크는 사용이 중지되었습니다',
    'zh-Hans': '这个链接已停用',
  });
  assert.doesNotMatch(html, /<h1[^>]*\shidden/);
});

test('不載 cloudkit.js、app.js 或任何外部腳本，不提 CloudKit 與 MapKit', () => {
  const live = html.replace(/<!--[\s\S]*?-->/g, '');   /* 註解可以提，標記與腳本不行 */
  assert.doesNotMatch(live, /<script[^>]*\ssrc=/);
  assert.doesNotMatch(live, /cloudkit|mapkit|importmap|app\.js|core\.js/i);
  assert.doesNotMatch(live, /https?:\/\//);
});

test('不進搜尋引擎、不送 Referer', () => {
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
});

test('文案只有「已停用」那一句，沒有推銷', () => {
  const body = html.slice(html.indexOf('<body>'), html.indexOf('<script>'));
  assert.equal([...body.matchAll(/<(h1|p|a|button)\b/g)].filter((m) => m[1] !== 'h1').length, 0);
});

/* 票 34：share-styles/manifest.json 是 App 下載分享模板的入口。
 * 守三件事：manifest 的欄位與 SHA-256 對得上實際檔案；模板沒有 JS、沒有外部資源；只有該發佈的東西會上正式站。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { shareStylesFilter } from '../../tools/stage-pages.mjs';

const dir = new URL('../../share-styles/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

test('manifest：contractVersion 是 1，有雜誌一個風格，A4 與 Letter 兩份', () => {
  assert.equal(manifest.contractVersion, 1);
  assert.deepEqual(manifest.styles.map((s) => s.id), ['magazine']);
  const [magazine] = manifest.styles;
  assert.equal(typeof magazine.version, 'number');
  assert.deepEqual(magazine.files, { a4: 'magazine/template.html', letter: 'magazine/template-letter.html' });
  assert.deepEqual(Object.keys(magazine.sha256).sort(), ['a4', 'letter']);
});

test('manifest：每份檔案存在，SHA-256 與實際位元組一致（模板改了沒重跑 manifest.py 會在這裡紅）', () => {
  for (const style of manifest.styles) {
    for (const [paper, rel] of Object.entries(style.files)) {
      assert.ok(existsSync(new URL(rel, dir)), rel);
      assert.match(style.sha256[paper], /^[0-9a-f]{64}$/);
      assert.equal(style.sha256[paper], sha(readFileSync(new URL(rel, dir))), style.id + ' ' + paper + '：重跑 python3 share-styles/_src/manifest.py');
    }
  }
});

test('模板是純 HTML＋CSS：沒有 <script，沒有 http(s):// 或 // 開頭的外部資源', () => {
  for (const style of manifest.styles) {
    for (const rel of Object.values(style.files)) {
      const html = readFileSync(new URL(rel, dir), 'utf8');
      assert.doesNotMatch(html, /<script/i, rel + ' 有 <script');
      assert.doesNotMatch(html, /https?:\/\//i, rel + ' 有 http(s):// 的外部資源');
      assert.doesNotMatch(html, /(?:src|href)\s*=\s*["']\/\//i, rel + ' 有 // 開頭的外部資源');
      assert.doesNotMatch(html, /@import|url\(\s*["']?(?:https?:)?\/\//i, rel + ' 的 CSS 載外部資源');
      assert.doesNotMatch(html, /\son[a-z]+\s*=/i, rel + ' 有行內事件處理');
    }
  }
});

test('模板裡的圖只有範例資料（相對於 _sample）或 data:，不指向任何會上正式站的東西', () => {
  for (const style of manifest.styles) {
    for (const rel of Object.values(style.files)) {
      const html = readFileSync(new URL(rel, dir), 'utf8');
      for (const [, src] of html.matchAll(/\ssrc\s*=\s*"([^"]*)"/g)) assert.match(src, /^(?:\.\.\/_sample\/|data:)/, rel + ' src=' + src.slice(0, 60));
    }
  }
});

test('正式站只發佈 manifest.json 與模板；產生器、預覽、範例、徽章、開發用的 index 與 README 都不上', () => {
  const abs = (p) => '/repo/share-styles' + (p ? '/' + p : '');
  for (const ok of ['', 'manifest.json', 'magazine', 'magazine/template.html', 'magazine/template-letter.html']) assert.equal(shareStylesFilter(abs(ok)), true, ok);
  for (const no of ['_src', '_src/build.py', '_preview', '_preview/magazine/p-01.jpg', '_sample', '_sample/cover-dome.jpg', '_badge', '_badge/badge.html', 'index.html', 'README.md', 'magazine/preview.png']) {
    assert.equal(shareStylesFilter(abs(no)), false, no);
  }
});

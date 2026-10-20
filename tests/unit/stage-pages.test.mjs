/* Pages 只發佈白名單（安全稽核 I6）：根目錄的每個項目都要分類，發佈清單不能指向不存在的東西。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { audit, PUBLISH, KEEP_OUT } from '../../tools/stage-pages.mjs';

const root = new URL('../../', import.meta.url);

test('repo 根目錄的每一個項目都分過類，而且發佈清單裡的都存在', () => {
  assert.deepEqual(audit(readdirSync(root)), { unclassified: [], missing: [] });
});

test('新增沒分類的根目錄項目會被抓到；發佈清單的項目不見了也會', () => {
  const entries = readdirSync(root).filter((e) => e !== 'trip').concat('secrets');
  assert.deepEqual(audit(entries), { unclassified: ['secrets'], missing: ['trip'] });
});

test('同一個項目不會同時出現在發佈與不發佈', () => {
  assert.deepEqual(PUBLISH.filter((p) => KEEP_OUT.includes(p)), []);
});

test('開發用的東西不在發佈清單裡', () => {
  for (const dev of ['tools', 'tests', 'CONTEXT.md', 'README.md', 'package.json', '.github']) assert.ok(!PUBLISH.includes(dev), dev);
});

test('頁面實際引用的頂層路徑都在發佈清單裡（首頁用 iframe 載 /screens/）', () => {
  const html = readFileSync(new URL('assets/js/home.js', root), 'utf8');
  assert.match(html, /\/screens\//);
  assert.ok(PUBLISH.includes('screens'));
});

test('pages.yml 上傳的是 _site，不是整個根目錄', () => {
  const yml = readFileSync(new URL('.github/workflows/pages.yml', root), 'utf8');
  assert.match(yml, /node tools\/stage-pages\.mjs/);
  assert.match(yml, /upload-pages-artifact@[0-9a-f]{40} # v[0-9.]+\n\s+with:\n\s+path: _site/);
});

test('每個 workflow 的 action 都釘到完整 commit SHA，並且宣告 permissions', () => {
  for (const f of ['pages.yml', 'cleanup.yml', 'test.yml']) {
    const yml = readFileSync(new URL('.github/workflows/' + f, root), 'utf8');
    for (const [, ref] of yml.matchAll(/^\s*(?:- )?uses:\s*(\S+)/gm)) assert.match(ref, /@[0-9a-f]{40}$/, f + ' ' + ref);
    assert.match(yml, /^permissions:/m, f);
  }
});

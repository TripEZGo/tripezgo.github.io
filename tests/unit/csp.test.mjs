/* trip/、open/、join/ 的 meta CSP、referrer、防 framing，以及 /join/ 的片段驗證（安全稽核 L16、I5）。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAGES, stampCsp, inlineScriptHashes } from '../../tools/stamp-csp.mjs';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const policyOf = (html) => {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/);
  assert.ok(m, 'CSP meta');
  return Object.fromEntries(m[1].split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
};

for (const page of PAGES) {
  test(page + '：CSP 的行內 script 雜湊跟頁面現在的內容一致（改了行內 script 要跑 node tools/stamp-csp.mjs）', () => {
    const html = read(page);
    assert.equal(html, stampCsp(html));
    const sources = policyOf(html)['script-src'];
    for (const h of inlineScriptHashes(html)) assert.ok(sources.includes(h), h);
  });

  test(page + '：預設全擋、script 不准 unsafe-inline／unsafe-eval、沒有行內事件屬性', () => {
    const html = read(page);
    const p = policyOf(html);
    assert.deepEqual(p['default-src'], ["'none'"]);
    assert.deepEqual(p['base-uri'], ["'none'"]);
    assert.deepEqual(p['form-action'], ["'none'"]);
    assert.ok(!p['script-src'].some((s) => /unsafe-/.test(s)));
    assert.doesNotMatch(html, /\son[a-z]+\s*=\s*["']/i);
  });

  test(page + '：referrer 是 no-referrer，而且 CSP 與 referrer 在第一個 <script> 之前', () => {
    const html = read(page);
    assert.match(html, /<meta name="referrer" content="no-referrer">/);
    const firstScript = html.indexOf('<script');
    assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < firstScript);
  });
}

test('trip/：連線只准 CloudKit 與 MapKit，腳本只准自己與 MapKit JS', () => {
  const p = policyOf(read('trip/index.html'));
  assert.deepEqual(p['connect-src'], ['https://api.apple-cloudkit.com', 'https://*.apple-mapkit.com', 'https://*.ls.apple.com']);
  assert.ok(p['script-src'].includes('https://cdn.apple-mapkit.com'));
  assert.ok(!('frame-src' in p) && p['default-src'][0] === "'none'");
});

test('trip/：被別人的 iframe 包住時藏起來並試著跳出去', () => {
  const html = read('trip/index.html');
  assert.match(html, /window\.top !== window\.self/);
  assert.match(html, /documentElement\.style\.display = 'none'/);
  assert.match(html, /window\.top\.location\.replace/);
});

test('open/、join/ 沒有任何對外連線的權限', () => {
  for (const page of ['open/index.html', 'join/index.html']) assert.ok(!('connect-src' in policyOf(read(page))), page);
});

test('I5：/join/ 的 Android 分支用的片段 regex，跟 /open/ 認 join 連結的 regex 的 # 以後那段一模一樣', () => {
  const open = read('open/index.html').match(/var JOIN = \/\^https:\\\/\\\/\(www\\\.\)\?tripezgo\\\.com\\\/join\\\/(#.*)\$\/;/)[1];
  const join = read('join/index.html').match(/\/\^(#\(s=\)\?\[A-Za-z0-9_-\]\+=\{0,2\})\$\/\.test\(location\.hash\)/)[1];
  assert.equal(join, open);
});

test('I5：Android 的 intent:// 只在片段合格時才組出來', () => {
  const html = read('join/index.html');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const run = (hash) => {
    let to = null;
    const location = { hash, replace: (u) => { to = u; } };
    new Function('location', 'navigator', 'document', script)(location, { userAgent: 'Mozilla/5.0 (Linux; Android 14)' }, {});
    return to;
  };
  assert.match(run('#s=AbC_-123=='), /^intent:\/\/www\.tripezgo\.com\/join\/#s=AbC_-123==#Intent;/);
  assert.match(run('#AbC'), /^intent:\/\//);
  for (const bad of ['#a;b', '#a#Intent;package=evil;end', '#', '', '#a b', '#%3Bend', '#a/b', '#a===']) {
    assert.match(run(bad) ?? '', /^\/open\/#/, JSON.stringify(bad));
  }
});

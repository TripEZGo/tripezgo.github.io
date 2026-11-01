import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stampAnalytics } from '../../tools/stage-pages.mjs';
const script = readFileSync(new URL('../../assets/js/analytics.js', import.meta.url), 'utf8');
function run(hostname, search = '', embedded = false) {
  const tags = [], window = {}; window.self = window; window.top = embedded ? {} : window;
  vm.runInNewContext(script, {window, location: {hostname, search}, URLSearchParams, document: {createElement: () => ({}), head: {appendChild: tag => tags.push(tag)}}});
  return {tags, window};
}
test('only production standalone pages load GA and initialize the supplied measurement ID', () => {
  for (const host of ['tripezgo.com', 'www.tripezgo.com']) {
    const {tags, window} = run(host);
    assert.equal(tags.length, 1);
    assert.equal(tags[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-MMDNPN68XK');
    assert.equal(tags[0].async, true);
    assert.equal(window.dataLayer[1][0], 'config');
    assert.equal(window.dataLayer[1][1], 'G-MMDNPN68XK');
  }
  for (const args of [['localhost'], ['127.0.0.1'], ['tripezgo.github.io'], ['tripezgo.com', '?mode=embed'], ['tripezgo.com', '', true]]) {
    const {tags, window} = run(...args); assert.equal(tags.length, 0); assert.equal(window.dataLayer, undefined);
  }
});
test('staging injection is idempotent', () => {
  const once = stampAnalytics('<html><head></head><body></body></html>');
  assert.equal(stampAnalytics(once), once);
  assert.match(once, /analytics.js/);
});

/* ?mode=embed（2026-10-12）：判斷寫在 <head> 的 inline script，第一次繪製前就生效。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMBED_HEAD, TARGETS, stamp } from '../../tools/embed.mjs';
import { PAGES } from '../../tools/gen-contact.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('home, privacy, terms and contact in four languages carry the embed block inside <head> (run node tools/embed.mjs)', () => {
  for (const rel of [...TARGETS, ...PAGES.map((p) => p.out)]) {
    const html = readFileSync(join(root, rel), 'utf8');
    const at = html.indexOf(EMBED_HEAD);
    assert.ok(at > 0 && at < html.indexOf('</head>'), rel);
    assert.equal(html.split('<!-- embed:start').length, 2, rel + ' has exactly one block');
  }
});

test('stamping is idempotent', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.equal(stamp(stamp(html)), html);
});

test('canonical stays on the plain URL', () => {
  for (const rel of TARGETS) assert.doesNotMatch(readFileSync(join(root, rel), 'utf8'), /rel="canonical" href="[^"]*mode=embed/, rel);
});

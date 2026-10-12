import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, render, formLink } from '../../tools/gen-contact.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('every contact page is up to date with the generator and the homepages (run node tools/gen-contact.mjs)', () => {
  for (const page of PAGES) assert.equal(readFileSync(join(root, page.out), 'utf8'), render(page), page.out);
});

test('each contact page links to the form in its own language and every homepage footer links to its contact page', () => {
  for (const page of PAGES) {
    const html = readFileSync(join(root, page.out), 'utf8');
    assert.ok(html.includes(`href="${formLink(page)}"`), page.out);
    assert.ok(!html.includes('<iframe'), page.out + ' 不再嵌 iframe');
    const home = readFileSync(join(root, page.home.slice(1), 'index.html'), 'utf8');
    assert.ok(home.includes(`href="${page.home}contact/"`), page.home + ' footer');
  }
});

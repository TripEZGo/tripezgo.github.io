import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preferredLanguage, rewriteContent, stageLanguage, languageEntry } from '../../tools/language-sites.mjs';
import { mkdtempSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { runInNewContext } from 'node:vm';
import { pathToFileURL } from 'node:url';

test('language negotiation respects priority, regional tags, exclusions and fallback', () => {
  for (const [input, expected] of [['', 'en'], ['fr-FR', 'en'], ['ja-JP,en;q=0.8', 'ja'], ['en;q=0.3,ko-KR;q=0.9', 'ko'], ['zh-TW', 'zh-tw'], ['zh-Hant', 'zh-tw'], ['zh-CN', 'zh-cn'], ['zh-Hans-CN', 'zh-cn'], ['zh-SG', 'zh-cn'], ['zh-Hans', 'zh-cn'], ['zh-HK', 'zh-tw'], ['zh', 'zh-tw'], ['ja;q=0,en;q=0.5', 'en'], ['fr,ko;q=0.8', 'ko']]) assert.equal(preferredLanguage(input), expected);
});

test('static entry reads browser languages and preserves path, query and fragment', () => {
  const html = languageEntry('<html lang="en"><body><main><h1>Plan your trip</h1></main></body></html>');
  assert.match(html, /navigator.languages/);
  assert.match(html, /location.pathname \+ location.search \+ location.hash/);
  assert.match(html, /<main><h1>Plan your trip<\/h1><\/main>/);
  for (const [languages, expected] of [[['ja-JP'], 'ja'], [['fr-FR'], 'en']]) {
    let destination;
    runInNewContext(html.match(/<script data-language-redirect>([\s\S]*?)<\/script>/)[1], {
      navigator: { languages },
      location: { pathname: '/', search: '?utm_source=test', hash: '#about', replace: value => { destination = value; } },
    });
    assert.equal(destination, `https://${expected}.tripezgo.com/?utm_source=test#about`);
  }
  assert.doesNotThrow(() => runInNewContext(html.match(/<script data-language-redirect>([\s\S]*?)<\/script>/)[1], {
    navigator: {}, location: { replace() { throw new Error('Navigation blocked'); } },
  }));
});

test('each language publishes root content, its CNAME, and legacy redirects', () => {
  for (const lang of ['router', 'en', 'zh-tw', 'ja', 'ko']) {
    const dir = mkdtempSync(tmpdir() + '/tripezgo-language-');
    const root = pathToFileURL(dir + '/');
    try {
      for (const name of ['index.html', 'privacy.html', 'terms.html', 'contact', 'announcements', 'en', 'ja', 'ko', 'trip', 'sitemap.xml', 'robots.txt']) cpSync(new URL('../../' + name, import.meta.url), new URL(name, root), { recursive: true });
      const originalTrip = readFileSync(new URL('trip/core.js', root), 'utf8');
      stageLanguage(root, lang);
      assert.equal(readFileSync(new URL('CNAME', root), 'utf8').trim(), lang === 'router' ? 'tripezgo.com' : lang + '.tripezgo.com');
      assert.equal(readFileSync(new URL('trip/core.js', root), 'utf8'), originalTrip);
      const html = readFileSync(new URL('index.html', root), 'utf8');
      const sitemap = readFileSync(new URL('sitemap.xml', root), 'utf8');
      if (lang === 'router') {
        assert.match(html, /navigator.languages/);
        assert.match(html, /<html lang="en"/);
        assert.match(html, /<main[ >]/);
        assert.match(html, /<h1[ >]/);
        assert.match(html, /rel="canonical" href="https:\/\/en.tripezgo.com\/"/);
        assert.ok(html.includes(readFileSync(new URL('../../en/index.html', import.meta.url), 'utf8').match(/<h1[\s\S]*?<\/h1>/)[0]));
        assert.match(sitemap, /<sitemapindex /);
      } else {
        const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
        assert.equal(locations.length, 5);
        assert.ok(locations.every(url => url.startsWith('https://' + lang + '.tripezgo.com/')));
        for (const name of ['index.html', 'privacy.html', 'terms.html', 'contact/index.html', 'announcements/index.html']) {
          const page = readFileSync(new URL(name, root), 'utf8');
          assert.ok(page.includes('rel="canonical" href="https://' + lang + '.tripezgo.com/' + name.replace(/index\.html$/, '') + '"'));
          for (const code of ['en', 'zh-tw', 'ja', 'ko']) assert.ok(page.includes('https://' + code + '.tripezgo.com/'));
        }
      }
      if (lang !== 'router') assert.match(html, new RegExp('https://' + lang + '.tripezgo.com/'));
      assert.match(readFileSync(new URL('en/contact/index.html', root), 'utf8'), /location.replace/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test('metadata, navigation and announcements migrate without rewriting assets or external links', () => {
  assert.equal(rewriteContent('"https://tripezgo.com/en/privacy.html" "/ja/#about" "/#promo" "/assets/a.png" "https://example.com/"'), '"https://en.tripezgo.com/privacy.html" "https://ja.tripezgo.com/#about" "https://zh-tw.tripezgo.com/#promo" "/assets/a.png" "https://example.com/"');
});

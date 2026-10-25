/* 全站共用的頁尾（使用者要求 2026-09-26：公開頁與 /open/ 的頁首頁尾跟首頁同一份）。
 *
 * 首頁三個語言版本（/、/en/、/ja/）的頁尾逐字搬過來；樣式在 /assets/css/chrome.css。
 * 首頁另有 /ko/，但公開頁與 /open/ 沒有韓文介面，所以這裡沒有 ko 那一份，只在連結裡多一個 한국어。
 * 公開頁是在頁內切語言的，所以頁尾用這一支照當下的語言畫，而不是寫死在 HTML 裡。 */
const FOOTER = {
  zh: {
    home: '/', label: 'TripEZGo 首頁', tag: '旅行規劃、旅途所需一次搞定。', width: '32ch', nav: '頁尾導覽',
    links: [['/privacy.html', '隱私權政策'], ['/terms.html', '使用者條款'], ['/#about', '關於'], ['/contact/', '聯絡我們'],
      ['/en/', 'English', 'en'], ['/ja/', '日本語', 'ja'], ['/ko/', '한국어', 'ko']],
    made: 'Powered by <a href="https://zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a>',   // 寫死的 HTML（作者連結），不是使用者資料
  },
  en: {
    home: '/en/', label: 'TripEZGo home', tag: 'Plan the trip, carry what it needs — all in one app.', width: '34ch', nav: 'Footer',
    links: [['/en/privacy.html', 'Privacy Policy'], ['/en/terms.html', 'Terms of Use'], ['/en/#about', 'About'], ['/en/contact/', 'Contact'],
      ['/', '繁體中文', 'zh-Hant'], ['/ja/', '日本語', 'ja'], ['/ko/', '한국어', 'ko']],
    made: 'Powered by <a href="https://en.zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a>',   // 寫死的 HTML（作者連結），不是使用者資料
  },
  ja: {
    home: '/ja/', label: 'TripEZGo ホーム', tag: '旅の計画も、旅先で要るものも、これひとつで。', width: '32ch', nav: 'フッター',
    links: [['/ja/privacy.html', 'プライバシーポリシー'], ['/ja/terms.html', '利用規約'], ['/ja/#about', 'このアプリについて'], ['/ja/contact/', 'お問い合わせ'],
      ['/', '繁體中文', 'zh-Hant'], ['/en/', 'English', 'en'], ['/ko/', '한국어', 'ko']],
    made: 'Powered by <a href="https://jp.zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a>',   // 寫死的 HTML（作者連結），不是使用者資料
  },
};

// 社群連結（使用者 2026-10-25）；圖示是 Simple Icons（CC0），樣式在 chrome.css 的 .footer-social
const SOCIAL = '<p class="footer-social"><a href="https://www.instagram.com/tripezgo/" target="_blank" rel="noopener"><span class="m m-ig" aria-hidden="true"></span>Instagram</a><a href="https://www.threads.com/@tripezgo" target="_blank" rel="noopener"><span class="m m-th" aria-hidden="true"></span>Threads</a></p>';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const marks = '<span class="m m-mark" role="img" aria-hidden="true"></span><span class="m m-word" role="img" aria-hidden="true"></span>';

/** 頁首左邊那個標誌連結（回那個語言的首頁）。 */
export function brandHtml(lang) {
  const f = FOOTER[lang] || FOOTER.zh;
  return '<a class="brand" href="' + f.home + '" aria-label="' + esc(f.label) + '">' + marks + '</a>';
}

/** `<footer class="site-footer">` 裡面那一整塊。 */
export function footerHtml(lang) {
  const f = FOOTER[lang] || FOOTER.zh;
  const links = f.links.map(([href, text, hl]) => '<a href="' + href + '"'
    + (hl ? ' hreflang="' + hl + '" lang="' + hl + '"' : '')
    + (href.startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' + esc(text) + '</a>').join('');   // 聯絡表單等站外連結開新視窗
  return '<div class="wrap"><div class="footer-top"><div>' + brandHtml(lang)
    + '<p style="margin:12px 0 0;max-width:' + f.width + '">' + esc(f.tag) + '</p>' + SOCIAL + '</div>'
    + '<nav class="footer-links" aria-label="' + esc(f.nav) + '">' + links + '</nav></div>'
    + '<div class="footer-bottom"><span>© 2026 TripEZGo</span><span>' + f.made + '</span></div></div>';
}

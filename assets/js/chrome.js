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
    author: 'https://zhgchg.li/',   // 頁尾「Produced by ZhgChg.Li」徽章連到的作者網站（同語言）
    heads: ['網站', '條款', '語言', '追蹤我們'],
  },
  en: {
    home: '/en/', label: 'TripEZGo home', tag: 'Plan the trip, carry what it needs — all in one app.', width: '34ch', nav: 'Footer',
    links: [['/en/privacy.html', 'Privacy Policy'], ['/en/terms.html', 'Terms of Use'], ['/en/#about', 'About'], ['/en/contact/', 'Contact'],
      ['/', '繁體中文', 'zh-Hant'], ['/ja/', '日本語', 'ja'], ['/ko/', '한국어', 'ko']],
    author: 'https://en.zhgchg.li/',   // 頁尾「Produced by ZhgChg.Li」徽章連到的作者網站（同語言）
    heads: ['Site', 'Legal', 'Language', 'Follow'],
  },
  ja: {
    home: '/ja/', label: 'TripEZGo ホーム', tag: '旅の計画も、旅先で要るものも、これひとつで。', width: '32ch', nav: 'フッター',
    links: [['/ja/privacy.html', 'プライバシーポリシー'], ['/ja/terms.html', '利用規約'], ['/ja/#about', 'このアプリについて'], ['/ja/contact/', 'お問い合わせ'],
      ['/', '繁體中文', 'zh-Hant'], ['/en/', 'English', 'en'], ['/ko/', '한국어', 'ko']],
    author: 'https://jp.zhgchg.li/',   // 頁尾「Produced by ZhgChg.Li」徽章連到的作者網站（同語言）
    heads: ['サイト', '規約', '言語', 'フォロー'],
  },
};

// 社群連結（使用者 2026-10-25；2026-11-09 搬到頁尾右側自成一欄、加 LinkedIn）。
// Instagram／Threads 圖示是 Simple Icons（CC0），LinkedIn 是官方品牌素材；樣式在 chrome.css 的 .footer-social
const SOCIAL = [['Instagram', 'https://www.instagram.com/tripezgo/', 'm-ig'], ['Threads', 'https://www.threads.com/@tripezgo', 'm-th'],
  ['LinkedIn', 'https://www.linkedin.com/company/tripezgo/home/', 'm-li']];

// 頁尾左欄的「Produced by ZhgChg.Li」徽章（取代原本頁尾右下的 Powered by 那行）；明暗各一張，跟系統深淺色切換
const produced = (url) => '<p class="footer-produced"><a href="' + url + '" target="_blank" rel="noopener"><picture>'
  + '<source srcset="/assets/img/produced-by-zhgchgli-dark.svg" media="(prefers-color-scheme: dark)">'
  + '<img src="/assets/img/produced-by-zhgchgli-light.svg" width="141" height="54" alt="Produced by ZhgChg.Li"></picture></a></p>';

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
  const a = ([href, text, hl]) => '<li><a href="' + href + '"'
    + (hl ? ' hreflang="' + hl + '" lang="' + hl + '"' : '')
    + (href.startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' + esc(text) + '</a></li>';   // 聯絡表單等站外連結開新視窗
  // 頁尾 A 款（Open Design 稿 site-footer-redesign，使用者 2026-11-09）：網站／條款／語言三組，社群自成第四組
  const langs = f.links.filter((l) => l[2]);
  const legal = f.links.filter((l) => !l[2] && /(privacy|terms)\.html$/.test(l[0]));
  const site = f.links.filter((l) => !langs.includes(l) && !legal.includes(l));
  const group = (cls, head, items) => '<div class="footer-group footer-group--' + cls + '"><h2 class="footer-heading">' + esc(head)
    + '</h2><ul>' + items.map(a).join('') + '</ul></div>';
  const social = '<div class="footer-social"><h2 class="footer-heading">' + esc(f.heads[3]) + '</h2><ul>'
    + SOCIAL.map(([t, u, c]) => '<li><a href="' + u + '" target="_blank" rel="noopener"><span class="m ' + c + '" aria-hidden="true"></span>' + t + '</a></li>').join('')
    + '</ul></div>';
  return '<div class="wrap"><div class="footer-top"><div class="footer-brand">' + brandHtml(lang)
    + '<p style="margin:12px 0 0;max-width:' + f.width + '">' + esc(f.tag) + '</p>' + produced(f.author) + '</div>'
    + '<div class="footer-nav"><nav class="footer-links" aria-label="' + esc(f.nav) + '">'
    + group('site', f.heads[0], site) + group('legal', f.heads[1], legal) + group('lang', f.heads[2], langs) + '</nav>'
    + social + '</div></div>'
    + '<div class="footer-bottom"><span>© 2026 TripEZGo</span></div></div>';
}

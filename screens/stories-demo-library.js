// 歡迎頁「不用打開 App」「資料與工具」（demo-glance、demo-library）。寫法見 autoplay.js 檔頭。打包進 App：tools/app-demos.mjs。
// 每一輪都由殼（demo.html）在背景重開起始那一頁，所以不必把狀態收回原樣。
export const STORIES = {
  // 引導頁（ADR-0050）：資料頁（筆記）→ 切到購物清單 → 點一項、標已購買、填實付金額（1.6.0：掃描與匯率換算搬去主頁小工具，資料分頁沒有工具箱，這支不再展示）
  'lib-scan-fx': [
    { page: 'notes', wait: 900 },
    { page: 'notes', tap: '.seg > .seg-t:nth-child(4)' },
    { page: 'shop', wait: 600 },
    { page: 'shop', tap: '.card[data-i="1"]' },
    { page: 'shop', tap: '[data-pick="bought"]' },
    { page: 'shop', type: '.pd input', text: '4620' },
    { page: 'shop', tap: '.pd .go' },
    { page: 'shop', wait: 1800 },
  ],
  // 不用打開 App：鎖定畫面（即時動態，撥時間條看它跟著走）→ 主畫面 Widget（勾待辦）→ Siri 問下一個行程
  // 換頁走 __auto.next（各頁自己 go() 到下一頁）
  'demo-glance': [
    { page: 'lock', wait: 900 },
    { page: 'lock', drag: '.lk-scrub-thumb', dx: 80, dy: 0, hold: 100, ms: 900 },
    { page: 'lock', wait: 700 },
    { page: 'lock', drag: '.lk-scrub-thumb', dx: 70, dy: 0, hold: 100, ms: 800 },
    { page: 'lock', wait: 900 },
    { page: 'lock', call: 'next' },
    { page: 'widget', wait: 800 },
    { page: 'widget', tap: '.td-w .ck:not(.on)' },
    { page: 'widget', wait: 900 },
    { page: 'widget', tap: '.td-w .ck:not(.on)' },
    { page: 'widget', wait: 1200 },
    { page: 'widget', call: 'next' },
    { page: 'siri', wait: 600 },
    { page: 'siri', tap: '.sugg button[data-i="1"]' },
    { page: 'siri', wait: 3600 },
  ],

  // 資料與工具（1.6.0）：筆記 → 切到購物清單（標已購買）
  'demo-library': [
    { page: 'notes', wait: 700 },
    { page: 'notes', tap: '.seg > .seg-t:nth-child(4)' },
    { page: 'shop', wait: 600 },
    { page: 'shop', tap: '.card[data-i="1"]' },
    { page: 'shop', tap: '[data-pick="bought"]' },
    { page: 'shop', type: '.pd input', text: '4620' },
    { page: 'shop', tap: '.pd .go' },
    { page: 'shop', wait: 1800 },
  ],
};

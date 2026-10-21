// 歡迎頁「地圖」「旅伴」（demo-map、demo-mates）。寫法見 autoplay.js 檔頭。打包進 App：tools/app-demos.mjs。
// 畫面是 map-demo.html（離線地圖，map-static.js）。每一輪由殼（demo.html）在背景重開起始那一頁，所以不必把狀態收回原樣。
export const STORIES = {
  // 引導頁（ADR-0050）：點嚴島神社圖釘 → 步行鈕開始導航 → 停在導航卡（頁面以 nowalk=1 載入，導航不模擬移動）→ 一輪結束
  'map-pin-walk': [
    { wait: 1300 },
    { tap: '[data-auto="d2-itsukushima"]' },
    { wait: 1300 },
    { tap: '#card [data-act="walk"]' },
    { wait: 3500 },
  ],
  // 引導頁（ADR-0050）：只有地圖（focus=mates）→ 點一位旅伴 → 卡片出現並停住 → 一輪結束
  'mates-map': [
    { wait: 1100 },
    { tap: '[data-auto="m0"]' },
    { wait: 3300 },
  ],
  // 地圖：第 2 天的圖釘與步行路程 → 點嚴島神社的圖釘（卡片）→ 步行鈕開始導航（藍點沿路走、導航卡數字跟著變）→ ✕ 結束（先問、確認）
  'demo-map': [
    { wait: 1300 },
    { tap: '[data-auto="d2-itsukushima"]' },
    { wait: 1300 },
    { tap: '#card [data-act="walk"]' },
    { wait: 3600 },
    { tap: '#card [data-act="end"]' },
    { wait: 500 },
    { tap: '.tz-alert .acts span.destr' },
    { wait: 1500 },
  ],

  // 旅伴：旅程共編的旅伴清單（往下捲一下）→ 地圖上開著位置共享，逐一點開三位旅伴（「更新於 X」、灰掉的那一位）
  'demo-mates': [
    { page: 'members', wait: 1100 },
    { page: 'members', scroll: '.scroller', by: 220 },
    { page: 'members', wait: 700 },
    { page: 'members', call: 'next' },
    { page: 'map-demo', wait: 1100 },
    { page: 'map-demo', tap: '[data-auto="m0"]' },
    { page: 'map-demo', wait: 1400 },
    { page: 'map-demo', tap: '[data-auto="m1"]' },
    { page: 'map-demo', wait: 1400 },
    { page: 'map-demo', tap: '[data-auto="m2"]' },
    { page: 'map-demo', wait: 1400 },
    { page: 'map-demo', tap: '#card [data-act="close"]' },
    { page: 'map-demo', wait: 1100 },
  ],
};

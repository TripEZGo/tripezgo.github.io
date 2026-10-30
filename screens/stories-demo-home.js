// 主頁的新示範（1.6.0，ADR-0050 的引導頁＋付費牆；tools/app-demos.mjs）：demo-home、demo-pw-home。寫法見 autoplay.js 檔頭。
// 使用者 2026-10-30 裁定：引導頁不 zoom，整支畫面照順序播（主頁 → 長按進編輯 → 拖一張小工具換位置 → 完成）；
// 付費牆不放毛玻璃，Premium 的主頁左右滑過第 1、2、3 頁。
export const STORIES = {
  // 官網首頁的主頁段（data-screen=home）：同引導頁那一段，不 zoom
  home: [
    { wait: 1400 },
    { press: '.cv-dates', hold: 520 },
    { wait: 700 },
    { drag: '.card[data-id="fx"]', dx: -150, dy: 0, hold: 320, ms: 600 },
    { wait: 500 },
    { tap: '.cv-done', hide: true },
    { wait: 900 },
  ],
  // 引導頁 home（once、crop=safe）：版面＝即時動態（中）、待辦（小）、匯率（小）、總覽（中）。
  // 長按封面 → 進編輯（卡片輕晃、左上「−」）→ 拖「匯率換算」到「今日待辦」上（兩張小卡對調）→ 點「完成」
  'demo-home': [
    { wait: 1400 },
    { press: '.cv-dates', hold: 520 },
    { wait: 700 },
    { drag: '.card[data-id="fx"]', dx: -150, dy: 0, hold: 320, ms: 600 },
    { wait: 500 },
    { tap: '.cv-done', hide: true },
    { wait: 900 },
  ],
  // 付費牆 pw-home-pages（loop、box、nohand）：Premium。第 1 頁 → 往左滑到第 2 頁 → 第 3 頁 → 滑回第 1 頁，循環
  'demo-pw-home': [
    { wait: 1500 },
    { swipe: '.pager', dx: -170, dy: 0, ms: 380 },
    { wait: 1500 },
    { swipe: '.pager', dx: -170, dy: 0, ms: 380 },
    { wait: 1500 },
    { swipe: '.pager', dx: 170, dy: 0, ms: 380 },
    { swipe: '.pager', dx: 170, dy: 0, ms: 380 },
    { wait: 700 },
  ],
};

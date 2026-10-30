// 主頁的新示範（1.6.0，ADR-0050 的引導頁＋付費牆；tools/app-demos.mjs）：demo-home、demo-pw-home。寫法見 autoplay.js 檔頭。
// 鏡頭（zoomCover／zoomOut／zoomLive）與 unlock 是 home.html 掛在 window.__auto 的函式（互動模式才有）：
// 鏡頭是「整個畫面放大再平移」＝畫面局部＋zoom in／out，不是縮小整支手機。
export const STORIES = {
  // 引導頁 home（once、crop=safe）：封面（旅程名、第 N 天進度）→ 拉遠露出小工具畫布 → 長按封面進編輯 → 拖匯率換算到總覽上換位置
  // → 點「完成」→ zoom 到即時動態卡（倒數每秒走）
  'demo-home': [
    { call: 'zoomCover' },
    { call: 'zoomOut' },
    { press: '.cv-dates', hold: 520 },
    { drag: '.card[data-id="fx"]', dx: -93, dy: -187, hold: 320, ms: 600 },
    { tap: '.cv-done', hide: true },
    { call: 'zoomLive' },
  ],
  // 付費牆 pw-home-pages（loop、box、nohand）：第 1 頁 → 往左滑到第 2 頁（免費帳號蓋著毛玻璃）→ 毛玻璃溶掉 → 第 3 頁 → 回第 1 頁
  'demo-pw-home': [
    { wait: 1300 },
    { swipe: '.pager', dx: -170, dy: 0, ms: 380 },
    { wait: 1300 },
    { call: 'unlock' },
    { wait: 500 },
    { swipe: '.pager', dx: -170, dy: 0, ms: 380 },
    { wait: 1100 },
    { swipe: '.pager', dx: 170, dy: 0, ms: 380 },
    { swipe: '.pager', dx: 170, dy: 0, ms: 380 },
    { wait: 700 },
  ],
};

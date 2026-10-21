// 歡迎頁「行程規劃」三格局部畫面（ADR-0050）：demo-plan-calendar、demo-plan-event。寫法見 autoplay.js 檔頭。
// 第三格（路程）沿用 stories-plan.js 的 leg。每一輪都收在起始畫面（行事曆回到第 2 天、表單由 autoplay 重新載入）。
export const STORIES = {
  // 行事曆 ↔ 時間軸（第 2 天）：切時間軸 → 往下捲 → 換到第 3 天 → 回第 2 天 → 切回行事曆
  'demo-plan-calendar': [
    { page: 'calendar', tap: '#mode' },
    { page: 'timeline', scroll: '.grid', by: 240 },
    { page: 'timeline', tap: '.chip:nth-child(3)' },
    { page: 'timeline', scroll: '.grid', by: 200 },
    { page: 'timeline', tap: '.chip:nth-child(2)' },
    { page: 'timeline', tap: '.head-act' },
    { page: 'calendar', wait: 700 },
  ],
  // 新增行程（event-new.html）：搜尋欄打字 → 點建議清單第一列（地點卡、標題、類型跟著帶出來）→ 往下捲到時間 → 改開始時間 → 加入行程
  'demo-plan-event': [
    { tap: '#q' },
    { call: 'typeQuery' },
    { wait: 500 },
    { tap: '.srow[data-i="0"]' },
    { wait: 900 },
    { scroll: '.xbody', by: 170 },
    { tap: '#rs' },
    { wait: 700 },
    { tap: '#go' },
    { wait: 1500 },
  ],
};

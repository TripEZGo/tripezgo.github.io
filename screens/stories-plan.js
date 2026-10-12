// 規劃那幾支手機的自動示範（行事曆、行程詳情、路程、總覽）。步驟寫法見 autoplay.js 檔頭。
// 每一輪都收在跟起始畫面一樣的狀態（或由 autoplay 重新載入起始網址、清掉這支手機的 demo 狀態）。
export const STORIES = {
  // 03・旅程分頁第 2 天：行事曆 ↔ 時間軸切換（使用者 2026-10-11：不示範拖曳、改時間）。
  // 行事曆先往上捲到 00:00 之上（App 1.3.0：待排區「未指定日」那一列＋「開始」書擋，在捲動內容裡）再捲回來
  // → 時間軸 → 往下捲 → 換到第 3 天 → 回第 2 天 → 切回行事曆（第 2 天＝起始畫面）。
  calendar: [
    { page: 'calendar', scroll: '.grid', by: -640 },
    { wait: 1200 },
    { page: 'calendar', call: 'calendarHome' },
    { page: 'calendar', tap: '#mode' },
    { page: 'timeline', scroll: '.grid', by: 260 },
    { page: 'timeline', tap: '.chip:nth-child(3)' },
    { page: 'timeline', scroll: '.grid', by: 220 },
    { page: 'timeline', tap: '.chip:nth-child(2)' },
    { page: 'timeline', tap: '.head-act' },
  ],

  // 01・桃園機場報到的行程詳情：勾待辦 → 開附件預覽再關 → 延後 30 分（toast）→ 我不去了／改回要去 → 提前 30 分、取消勾選，回到原樣。
  'event-airport': [
    { page: 'event', tap: '#todos [data-todo="0"]' },
    { page: 'event', tap: '.file:nth-last-child(2)' },
    { page: 'event', tap: '.pclose' },
    { page: 'event', tap: '[data-act="shift"]' },
    { page: 'event', tap: '.wcol[data-u="m"] .wr[data-v="30"]' },
    { page: 'event', tap: '.wcol[data-u="h"] .wr[data-v="0"]' },
    { page: 'event', tap: '[data-apply]' },
    { wait: 1800 },
    { page: 'event', tap: '[data-act="cancel"]' },
    { page: 'event', tap: '[data-act="cancel"]' },
    { page: 'event', tap: '[data-act="shift"]' },
    { page: 'event', tap: '.schip[data-dir="0"]' },
    { page: 'event', tap: '.wcol[data-u="m"] .wr[data-v="30"]' },
    { page: 'event', tap: '.wcol[data-u="h"] .wr[data-v="0"]' },
    { page: 'event', tap: '[data-apply]' },
    { wait: 1800 },
    { page: 'event', tap: '#todos [data-todo="0"]' },
  ],

  // 02・路程檢視（渡輪那一段）：三班輪流選，候車／早到跟著變，回到預設那一班。紙一直開著（使用者 2026-10-11）。
  // 註：這一段三班都趕得上（最晚那班 09:10 到、渡輪 09:10 開＝剛好接上），所以沒有轉琥珀的那一班。
  leg: [
    { page: 'leg', tap: '[data-run="0"]' },
    { page: 'leg', tap: '[data-run="2"]' },
    { page: 'leg', tap: '[data-run="1"]' },
  ],

  // 04／hero 右・總覽：附件 → 待辦（勾一條）→ 回行程 → 往上捲到「總覽」那一區與「日程行程」→ 展開再收合「待排行程」
  // （App 1.3.0：日程行程底下的可收合子 section，預設收合）→ 收合再展開一天。
  overview: [
    { page: 'overview', tap: '.seg div:nth-child(2)' },
    { page: 'overview', tap: '.seg div:nth-child(3)' },
    { page: 'overview', tap: '.page[data-page="2"] [data-todo="k0"] .box' },
    { page: 'overview', tap: '.seg div:nth-child(1)' },
    { page: 'overview', scroll: '.page[data-page="0"]', by: -900 },
    { wait: 900 },
    { page: 'overview', tap: '.page[data-page="0"] [data-group="u"]' },
    { wait: 1200 },
    { page: 'overview', tap: '.page[data-page="0"] [data-group="u"]' },
    { page: 'overview', tap: '.page[data-page="0"] .hdr[data-day="1"]' },
    { page: 'overview', tap: '.page[data-page="0"] .hdr[data-day="1"]' },
  ],
};

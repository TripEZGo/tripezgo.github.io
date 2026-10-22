// 付費牆的新示範（ADR-0050，tools/app-demos.mjs）：pw-live、pw-unlimited、pw-no-ads、pw-members。寫法見 autoplay.js 檔頭。
// 每一支都是單頁、播完一輪由 autoplay 重新載入起始網址（回到起始畫面），所以不必把畫面收回原樣。
export const STORIES = {
  // 即時動態：鎖定畫面上的卡片，時間往前走——進行中 → 候車 → 移動中（步行倒數）→ 下一個行程進行中（__auto.advance 跳到下一個時刻）
  'pw-live': [
    { wait: 1300 },
    { call: 'advance' },
    { wait: 1700 },
    { call: 'advance' },
    { wait: 1700 },
    { call: 'advance' },
    { wait: 1500 },
    { call: 'advance' },
    { wait: 1700 },
  ],

  // 去廣告：總覽清單夾著兩則原生廣告，去廣告之後一則一則收掉
  'pw-no-ads': [
    { wait: 1800 },
    { call: 'remove' },
    { wait: 2600 },
  ],

  // 旅程不限數量：免費版保留 3 趟，這裡連續再新增 6 趟（按「新增旅程」，新的一趟落在「籌劃中」最上面；旅程數指示 3 / 3 → N 趟 · 不限）
  'pw-unlimited': [
    { wait: 700 },
    { tap: '#new' },
    { wait: 550 },
    { tap: '#new' },
    { wait: 550 },
    { tap: '#new' },
    { wait: 550 },
    { tap: '#new' },
    { wait: 550 },
    { tap: '#new' },
    { wait: 550 },
    { tap: '#new' },
    { wait: 550 },
    { wait: 1800 },
  ],

  // 旅伴不限人數：作者＋兩位旅伴，再一位一位透過連結加進來（越過免費版的 3 位）
  'pw-members': [
    { wait: 900 },
    { call: 'join' },
    { wait: 700 },
    { call: 'join' },
    { wait: 700 },
    { call: 'join' },
    { wait: 700 },
    { call: 'join' },
    { wait: 1800 },
  ],
};

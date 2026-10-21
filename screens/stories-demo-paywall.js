// 付費牆的新示範（ADR-0050，tools/app-demos.mjs）：pw-live、pw-unlimited、pw-no-ads、pw-members。寫法見 autoplay.js 檔頭。
// 每一支都是單頁、播完一輪由 autoplay 重新載入起始網址（回到起始畫面），所以不必把畫面收回原樣。
export const STORIES = {
  // 旅程不限數量：免費版保留 3 趟，這裡再新增 3 趟（按「新增旅程」，新的一趟落在「籌劃中」最上面）
  'pw-unlimited': [
    { wait: 700 },
    { tap: '#new' },
    { wait: 500 },
    { tap: '#new' },
    { wait: 500 },
    { tap: '#new' },
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

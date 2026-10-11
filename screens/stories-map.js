// 地圖那三支手機的自動示範（screens/autoplay.js 讀，寫法見它的檔頭）。三支都在 stories.js 的 INPLACE：
// 播完原地從頭再來、不重新載入，所以每一支最後都要回到起始那一幀——收卡片、回到原本那一天、
// 鏡頭先動畫回到載入時的取景（__auto.home），再由 __auto.reset 把狀態（導航、選取、日期列）不帶動畫歸位。
// 地圖上的圖釘／商家／旅伴是 MapKit 的 annotation，互動模式下帶 data-auto＝行程 key／商家 id／旅伴 id（map-live.js）。
// 挑的那幾顆都是首頁取景（pan=0，近一級）之後看得到、沒被別的圖釘或卡片蓋住的（Playwright 量過）。
const close = { tap: '#card [data-act="close"]' };
const backToStart = [{ call: 'home' }, { call: 'reset' }];

export const STORIES = {
  // 05 左：打開地圖的預設樣子（今天＝第 2 天早上，人在宮島表參道）。點行程圖釘 → 卡片 → 關；點商家 → 商家卡 → 關；
  // 換到第 3 天再回今天。
  'map-route': [
    { tap: '[data-auto="d2-momijidani"]' },     // 5 紅葉谷公園 → 行程卡
    close,
    { tap: '[data-auto="s162"]' },              // Lawson（宮島）→ 商家卡
    close,
    { tap: '.chip[data-day="3"]' },             // 換到第 3 天（尾道）
    { wait: 1200 },
    { tap: '.chip[data-day="2"]' },             // 回到今天（frameDay 動畫回到同一個取景）
    { wait: 1000 },
    ...backToStart,
  ],

  // 05 右：點一家超商 → 商家卡 → 卡上的步行鈕從藍點導航過去（整條線框進來）→ ✕ 結束（先問、確認）。
  'map-live': [
    { tap: '[data-auto="s27"]' },               // 7-ELEVEN
    { tap: '#card [data-act="walk"]' },         // 步行導航到這一家
    { wait: 1500 },
    { tap: '#card [data-act="end"]' },          // 結束步行導航？
    { tap: '#alert [data-a="end"]' },           // 結束導航
    { wait: 600 },
    ...backToStart,                             // 回到載入時那一趟導航（原爆圓頂）
  ],

  // 06 位置共享：近一級之後三位擺不進同一幀，逐一把鏡頭移到那一位再點開（「更新於 X」、灰掉的那一位）
  'map-mates': [
    { tap: '[data-auto="m0"]' },
    { call: 'mate1' },
    { tap: '[data-auto="m1"]' },
    { call: 'mate2' },
    { tap: '[data-auto="m2"]' },
    close,
    ...backToStart,
  ],
};

// 自動操作示範的腳本（screens/autoplay.js 讀）。key＝首頁 home.js 的畫面名（SCREEN_OF 的 key）。
// 分三份寫（三組人各寫各的，避免互相覆寫），這裡合起來。每一步的寫法見 autoplay.js 檔頭。
import { STORIES as A } from './stories-plan.js';
import { STORIES as B } from './stories-map.js';
import { STORIES as C } from './stories-tools.js';
export const STORIES = { ...A, ...B, ...C };

// 播完一輪原地從頭再來、不重新載入的故事：地圖（MapKit 重載一次要好幾秒，地圖會整片重畫）。
// 這些故事的最後一步必須回到起始狀態（卡片收起、導航關閉、回到原本那天）。
export const INPLACE = new Set(['map-live', 'map-route', 'map-mates']);

// 自動操作示範的腳本（screens/autoplay.js 讀）。key＝首頁 home.js 的畫面名（SCREEN_OF 的 key）。
// 分三份寫（三組人各寫各的，避免互相覆寫），這裡合起來。每一步的寫法見 autoplay.js 檔頭。
// 版本號跟著自己的網址走（?v=，home.js 蓋的），三份腳本才不會拿到瀏覽器快取裡的舊版
const V = new URL(import.meta.url).search;
const [{ STORIES: A }, { STORIES: B }, { STORIES: C }] = await Promise.all(['plan', 'map', 'tools'].map((n) => import(`./stories-${n}.js${V}`)));
export const STORIES = { ...A, ...B, ...C };

// 播完一輪原地從頭再來、不重新載入的故事：地圖（MapKit 重載一次要好幾秒，地圖會整片重畫）。
// 這些故事的最後一步必須回到起始狀態（卡片收起、導航關閉、回到原本那天）。
export const INPLACE = new Set(['map-live', 'map-route', 'map-mates']);

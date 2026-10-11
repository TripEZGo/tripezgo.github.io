# 首頁 iPhone 外框：每段放哪個畫面（使用者 2026-10-11 裁定）

每段一支 iPhone 外框，裡面是 `screens/` 的 HTML 複刻畫面（互動模式，見 INTERACTIVE.md）。先前「文字欄互動小元件」那一套
（assets/js/demos/、`.demo-slot`）全部拿掉，規則搬進畫面裡。

| 段落 | 外框裡的畫面 | 互動 |
|---|---|---|
| Hero | 行事曆／地圖／總覽 三支（沿用） | 分頁列可切換 |
| 隱私與離線 | 沿用 HTML 畫的卡片（未要求換） | 網路開關 |
| 01 安排行程 | **行程檢視頁**（event.html） | 我不去了、延後／提前、刪除、待辦打勾、附件 |
| 02 路程 | **路程檢視頁**（leg.html） | 選班次、早到幾分、關閉 |
| 03 行事曆／時間軸 | **旅程分頁**（calendar.html） | 拖曳（15 分對齊、按住 0.42 秒）、間隔不足、切時間軸、切日期、點行程開詳情 |
| 04 總覽 | **總覽分頁**（overview.html） | 行程／附件／待辦清單 三分頁、收合日期、待辦打勾 |
| 05 地圖 | **地圖頁，用 MapKit JS 畫真的地圖**（新檔 map-live.html） | 預設：第 2 天路線＋超商標記＋旅伴共享位置＋**步行導航到其中一個地標**；點圖釘出卡片 |
| 06 旅伴 | 沿用 members／share-location | 開關、點旅伴 |
| 不用打開 App | 沿用 lock／widget | 時間推進、待辦打勾 |
| 小工具 | **一支手機放小工具分頁**，讓使用者自己切 筆記／掃描／匯率換算／購物清單 | 各頁照 App 操作 |
| 整合・分享進來 | **先是一則 IG 風格的社群貼文**→ 按分享 → 系統分享選單 → 選 TripEZGo → 分享延伸畫面 → 存好 | 一路點下去 |
| 整合・行事曆 | **Apple 行事曆的畫面，顯示同步進去的結果**（不用開關） | 無（靜態） |
| 整合・公開分享 | 沿用畫的（未要求換） | — |
| AI | 沿用對話示意 | — |

## MapKit JS

- token：`trip/config.js` 的 `mapkitToken`（origin 限 `https://tripezgo.com`）。本機測試用 Playwright `page.route('https://tripezgo.com/**')` 把請求接到本機檔案，讓頁面跑在那個 origin 下。
- 超商：用 App 內建的日本超商／百貨圖資（App repo 找 POI 資料檔），挑第 2 天路線附近幾家。
- 旅伴位置：範例資料（三語名字），新鮮度照 App 規則。
- 步行導航：`mapkit.Directions`（transportType walking）從目前位置到一個地標，畫出路線＋底部導航卡（照 map-nav.html 的卡片樣子與字串）。
- 截圖模式：MapKit 在無頭 Chromium 能畫就照畫；不能的話截圖沿用 map-nav 那張。

## 注意

- IG 風格貼文：不要用 Instagram 的商標與標誌，畫一則「看起來像社群 App 的貼文」即可（使用者原話是 mock instagram 貼文——介面風格可以像，不放對方的 logo 與名稱字樣）。

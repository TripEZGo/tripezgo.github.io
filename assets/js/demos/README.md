# 首頁互動小元件（assets/js/demos/）

首頁每個功能區塊都是「左欄文字＋互動小元件、右欄真實截圖」，**兩者同時顯示、沒有切換**。小元件放在文字欄重點清單下方的
`<div class="demo-slot" data-lazy-demo="<name>">`，捲到附近才載入（assets/js/home.js）：

- `assets/js/demos/<name>.js` —— `export default function (el, ctx)`，自己 `el.innerHTML`、自己綁事件
- `assets/css/demos/<name>.css` —— 這個小元件的樣式；**所有選擇器都以 `.d-<name>` 開頭**，不准碰別的元素

`ctx = { lang: 'zh'|'en'|'ja', trip, cats, pick }`
- `trip`：App 內建範本「山陽 6 日」的完整 JSON（assets/data/sanyo-<lang>.json）。`days[].events[]`（key/title/start/end/category/place{name,latitude,longitude}/todos/links/leg{mode,transitKind,durationMinutes,runs,selectedRunIndex}/isCancelled/notes）、`allDayEvents`、`unscheduledEvents`、`markers`、`notes`、`todos`、`links`
- `cats`：行程類型 → 該語言名稱
- `pick({zh, en, ja})`：取當前語言

共用工具在 `_shared.js`：`esc toMin hhmm duration swatch swatchFill dayEvents reduced`。

## 規則

1. **照 App 的實作，不照印象。** 互動要表現的行為（吸附幾分鐘、什麼時候警告、取消長什麼樣、共享哪些欄位）先去 App 原始碼找答案：
   `/Users/zhgchgli/Projects/tripezgo/App/iOS/Modules/`（Domain 的 UseCase、UI 的 Components、各功能模組）。檔頭註解寫出處（檔名＋你依據的那條規則）。
2. **字照 App 的字串表**：`/Users/zhgchgli/Projects/tripezgo/Scripts/i18n/maps/*.json`（每筆有 zh-Hant-TW／en／ja）。三語都要有。用詞：旅伴、作者、共編、待辦、即時動態。
3. **資料用範本**，範本沒有的（旅伴名字、價格、掃描紀錄、匯率）才在檔內寫三語範例。
4. **這是網站上的小插畫，不是 App 的複製品**：用網站的 token（`var(--page) --surface --fg --muted --border --border-soft --accent --accent-ink --accent-wash --success --warn --danger --radius-md --radius-lg --shadow-md`），深色模式會自己跟著。尺寸：功能區塊的文字欄寬 300–486px；小工具／整合卡片裡約 200–300px（手機兩欄時約 140px）；AI 區塊半欄。截圖就在旁邊，小元件是**讓人動手體驗截圖講的那件事**，不要再畫一次同一張截圖，手機 320px 寬也不能橫向溢出。線條 icon 用 `<svg class="i"><use href="#i-…"/></svg>`（index.html 的 sprite 有：check calendar pin users clip todo train link swap route bag nav island widget bell wave note fx cart qr plug cloud eyeoff key shift clock phone lock plus image）或自己內嵌 24×24 stroke 路徑。
5. 可及性：可操作的東西用 `<button>`／`<input>`，狀態用 aria-pressed / aria-checked / aria-live；尊重 `reduced`（prefers-reduced-motion）。不要自動播放無止境的動畫。
6. 不准改 index.html、home.js、home.css、_shared.js、別人的小元件。需要共用的東西寫在報告裡。不要 commit。

## 驗收

本機伺服器 `http://localhost:8770/`（網站 repo 根目錄的 `python3 -m http.server 8770`；沒在跑就自己開）。用 Playwright：打開首頁 → `[data-lazy-demo="<name>"]` scrollIntoView、等它載入 → 截圖 → 操作 → 截圖；`?` 沒有 console error；1280 與 390、320 寬 `document.documentElement.scrollWidth` 等於視窗寬。英日文：網址加 `?demo-lang=en` 或 `?demo-lang=ja`（只影響小元件的語言，給本機測試用）。

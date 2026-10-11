# screens/ 的互動模式

首頁把 `screens/<page>.html` 放進 iPhone 外框（iframe，`?lang=…&interactive=1`）。畫面要能像 App 一樣點、拖、切換。

## 鐵則

1. **截圖模式不准變。** `tools/screens.mjs` 不帶 `interactive`，渲染結果必須跟現在一模一樣（`node tools/screens.mjs compare <name> "<query>"` 疊圖照舊）。所有互動都包在 `if (interactive)` 裡（`import { interactive, go } from './chrome.js'`），初始畫面不准因為互動而改版。
2. **照 App 的實作。** 行為（吸附、警告、取消的樣子、延後規則、計數、排序、哪些欄位共享…）先去 `/Users/zhgchgli/Projects/tripezgo/App/iOS/Modules` 找，檔內註明出處。`assets/js/demos/*.js` 是先前做好的網站小元件，裡面的規則已經查過、出處寫在檔頭——**直接搬過來用**，但畫面要用 App 自己的樣子（這個畫面現有的元件與 class），不是小元件的網站樣式。
3. **字照 App 字串表**（`/Users/zhgchgli/Projects/tripezgo/Scripts/i18n/maps/*.json`），三語。
4. **換畫面用 `go(page, query)`**（保留語言與互動模式）。分頁列已經會換（`TAB_PAGES`）。sheet 類（行程詳情、路程）點右上關閉或往下拖要回到底下那一頁。
5. **狀態**：跨畫面要記住的（例如在行事曆拖過的時間、在詳情按了取消）放 `sessionStorage`（key 前綴 `tz-demo:`），在 iframe 內各自獨立；重新整理首頁就重來。用 try/catch 包起來。
6. 觸控與滑鼠都要能用（pointer events）；可點的元素加 `data-tap` 拿按壓回饋（screen.css）。iframe 裡不要攔捲動以外的系統手勢。
7. 不准改別人負責的畫面、`chrome.js`／`screen.css`（需要共用的寫在報告裡），不准 commit。

## 驗收

1. `node tools/screens.mjs compare <name> "<query>"`：截圖模式疊圖跟改之前一樣。
2. 直接開 `http://localhost:8770/screens/<page>.html?lang=zh-Hant-TW&interactive=1`（402×874 視窗）用 Playwright 操作、截圖；en／ja 各一次；沒有 console error。
3. 在首頁上（http://localhost:8770/）捲到那支手機，用 `page.frameLocator('…iframe')` 操作一次，確認外框裡也正常。

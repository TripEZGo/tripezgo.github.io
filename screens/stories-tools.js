// 資料分頁（原「小工具」）與整合那幾支手機的自動示範腳本（每一步的寫法見 autoplay.js 檔頭）。
// key＝首頁 home.js 的畫面名（SCREEN_OF 的 key）。notes 那一支照 App 的路跨頁（工具鈕 → 掃描器／匯率 modal，step.page 寫明在哪一頁）；
// 其餘待在自己那一頁。一輪結束要回到起始的樣子，下一輪才接得上。
export const STORIES = {
  // 資料分頁（筆記）：照 App 的路——右上工具鈕 → 挑「掃描 QR Code」→ 滿版掃描器，對準掃到（結果紙）→ 收紙 →
  // ✕ 回筆記 → 工具鈕 → 挑「匯率換算」→ modal 開著鍵盤、現值全選，直接打 3000 取代 → ✕ 回筆記（回到起始的樣子）
  notes: [
    { page: 'notes', tap: '.head-tool' },
    { tap: '.tz-menu [data-tool="scan"]' },
    { page: 'scan', wait: 600 },
    { page: 'scan', tap: '.cam' },
    { page: 'scan', wait: 2300 },
    { page: 'scan', tap: '.tz-dim.on' },
    { page: 'scan', wait: 400 },
    { page: 'scan', call: 'reset' },
    { page: 'scan', tap: '.cam .x' },
    { page: 'notes', tap: '.head-tool' },
    { tap: '.tz-menu [data-tool="fx"]' },
    { page: 'fx', wait: 400 },
    { page: 'fx', tap: '.kb [data-k="3"]' },
    { page: 'fx', tap: '.kb [data-k="0"]' },
    { page: 'fx', tap: '.kb [data-k="0"]' },
    { page: 'fx', tap: '.kb [data-k="0"]' },
    { page: 'fx', wait: 1500 },
    { page: 'fx', call: 'reset' },
    { page: 'fx', tap: '.xs .tz-x' },
    { page: 'notes', wait: 600 },
  ],
  // 掃描器（直接開這一頁）：對準掃到新網址（結果紙）→ 收紙 →「掃描紀錄」鈕開紀錄紙（剛掃的在最上面）→ ✕ 收 → 歸零
  scan: [
    { tap: '.cam' },
    { wait: 2300 },
    { tap: '.tz-dim.on' },
    { wait: 600 },
    { tap: '.hist-btn' },
    { wait: 2200 },
    { tap: '.hs .tz-x' },
    { wait: 800 },
    { call: 'reset' },
  ],
  // 匯率換算 modal（直接開這一頁）：開著就是左格全選、鍵盤上來——直接打 1000 取代 → 完成（記進最近換算）→ 歸零
  fx: [
    { tap: '.kb [data-k="1"]' },               // 只示範輸入 1000 換算成 JPY（使用者 2026-10-12）
    { tap: '.kb [data-k="0"]' },
    { tap: '.kb [data-k="0"]' },
    { tap: '.kb [data-k="0"]' },
    { wait: 1200 },
    { tap: '.kb [data-done]' },
    { wait: 1500 },
    { call: 'reset' },
  ],
  // 購物清單：開熊野筆 → 已購買（填實付）→ 計數變了 → 篩伴手禮 → 全部 → 再開熊野筆退回待購買 → 收卡片（回到起始）
  shop: [
    { tap: '.card[data-i="1"]' },
    { tap: '[data-pick="bought"]' },
    { type: '.pd input', text: '4620' },
    { tap: '.pd .go' },
    { wait: 900 },
    { tap: '.chip[data-cat="souv"]' },
    { tap: '.chip[data-cat=""]' },
    { tap: '.card[data-i="1"]' },
    { tap: '[data-pick="bought"].pressed' },
    { tap: '.tz-alert .destr' },
    { tap: '.tz-dim.on' },
  ],
  // 02・靈感（1.4.0，首頁 02 區塊）：網頁 → 分享 → 選單挑 TripEZGo → 存成靈感（儲存）→ 成功（兩秒自己收回網頁）→ 接到 App 的「資料 › 靈感」
  // （跨頁：share-web 的 __auto.openApp 換頁）→ 點最上面那一則 → 檢視紙上「新增關聯」→ 挑「行程」→ 行事曆上多了一則（第 2 天晚上，描邊閃兩下）。
  // 一輪結束由首頁重新載入起始網址（網頁），所以不必把狀態收回原樣。
  'inspiration-flow': [
    { page: 'share-web', tap: '[data-act="share"]' },
    { page: 'share-web', tap: '[data-act="tripezgo"]' },
    { page: 'share-web', wait: 600 },
    { page: 'share-web', tap: '.xfoot .primary' },
    { page: 'share-web', wait: 2500 },
    { page: 'share-web', call: 'openApp' },
    { page: 'inspiration', wait: 700 },
    { page: 'inspiration', tap: '.row[data-i="0"]' },
    { page: 'inspiration', tap: '[data-act="link"]' },
    { page: 'inspiration', tap: '[data-dest="event"]' },
    { page: 'calendar', wait: 3200 },
  ],
  // IG 分享：分享 → 分享選單 → TripEZGo → 等讀完網址（儲存才亮）→ 切到「筆記」分段 → 儲存 → 成功（兩秒自己收回貼文）
  'share-ig': [
    { tap: '[data-act="share"]' },
    { tap: '[data-act="tripezgo"]' },
    { wait: 900 },
    { tap: '.seg.kinds [data-kind="note"]' },
    { tap: '.xsave:not(.off)[data-act="save"]' },
    { wait: 2600 },
  ],
  // 地圖 App 分享：地點頁「分享」→ 分享選單 → TripEZGo → 等讀完（地點卡帶進來、類型從「景點」預選成「水族館」）→ 儲存成行程 →
  // 成功（兩秒自己收回地點頁，回到起始）
  'share-gmap': [
    { tap: '[data-act="share"]' },
    { tap: '[data-act="tripezgo"]' },
    { wait: 1100 },
    { tap: '.xsave:not(.off)[data-act="save"]' },
    { wait: 2600 },
  ],
  // Apple 行事曆：靜態畫面，當天往下捲一點再捲回來
  'apple-calendar': [
    { scroll: '.grid', by: 200 },
    { wait: 900 },
    { scroll: '.grid', by: -200 },
  ],
  // Siri：輪流點建議的說法，問句打出來、回答浮上來；最後回到起始那一句
  // 只問「下一個行程是什麼」（使用者 2026-10-12）
  siri: [
    { tap: '.sugg button[data-i="1"]' },
    { wait: 3200 },
  ],
};

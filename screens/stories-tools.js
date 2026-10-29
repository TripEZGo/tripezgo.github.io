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
  // （跨頁：share-web 的 __auto.openApp 換頁）→ 點最上面那一則 → 檢視紙上「新增關聯」→ 挑「行程」→ 直接開出新行程的檢視行程紙（描述＋網址、og 縮圖附件）並停在那裡（使用者 2026-10-21）。
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
    { page: 'event', wait: 3200 },
  ],
  // 靈感空狀態（1.6.0 D145）：一頁一頁點著看。①–⑨ 把 TripEZGo 加進分享列（share-gmi?setup=1），⑩–⑫ 接 insp-chain 的地圖那一半（步驟原樣）
  'insp-gmaps-setup': [
    { stop: true, n: 1 },
    { page: 'share-gmi', cam: '[data-act="share"]', k: 2 }, { badge: '[data-act="share"]', n: 1 }, { wait: 500 },
    { page: 'share-gmi', tap: '[data-act="share"]' }, { badge: false }, { wait: 450 }, { cam: false },
    { stop: true, n: 2 },
    { cam: '.ss-row.apps', k: 1.6 }, { badge: '.ss-row.apps', n: 2 }, { wait: 400 },
    { swipe: '.ss-row.apps', dx: -260, dy: 0, ms: 600 }, { badge: false }, { wait: 300 }, { cam: false },
    { stop: true, n: 3 },
    { cam: '[data-act="more"]', k: 2 }, { badge: '[data-act="more"]', n: 3 }, { wait: 400 },
    { tap: '[data-act="more"]' }, { badge: false }, { wait: 450 }, { cam: false },
    { stop: true, n: 4 },
    { cam: '[data-act="apl-edit"]', k: 2 }, { badge: '[data-act="apl-edit"]', n: 4 }, { wait: 400 },
    { tap: '[data-act="apl-edit"]' }, { badge: false }, { wait: 300 }, { cam: false },
    { stop: true, n: 5 },
    { badge: '.apl-body', n: 5 }, { wait: 400 }, { scroll: '.apl-body', by: 700 }, { badge: false }, { wait: 300 },
    { stop: true, n: 6 },
    { cam: '[data-act="apl-toggle"]', k: 2 }, { badge: '[data-act="apl-toggle"]', n: 6 }, { wait: 400 },
    { tap: '[data-act="apl-toggle"]' }, { badge: false }, { wait: 300 }, { cam: false },
    { stop: true, n: 7 },
    { cam: '[data-act="apl-add"]', k: 2 }, { badge: '[data-act="apl-add"]', n: 7 }, { wait: 400 },
    { tap: '[data-act="apl-add"]' }, { badge: false }, { wait: 400 }, { cam: false },
    { stop: true, n: 8 },
    { cam: '[data-act="apl-done"]', k: 2 }, { badge: '[data-act="apl-done"]', n: 8 }, { wait: 400 },
    { tap: '[data-act="apl-done"]' }, { badge: false }, { wait: 600 }, { cam: false },
    { stop: true, n: 9 },
    { cam: '[data-act="tripezgo"]', k: 2 }, { badge: '[data-act="tripezgo"]', n: 9 }, { wait: 400 },
    { page: 'share-gmi', tap: '[data-act="tripezgo"]' }, { badge: false }, { cam: false },
    { page: 'share-gmi', wait: 600 },
    { stop: true, n: 10 },
    { cam: '.xfoot .primary', k: 1.6 }, { badge: '.xfoot .primary', n: 10 }, { wait: 400 },
    { page: 'share-gmi', tap: '.xfoot .primary' }, { badge: false }, { cam: false },
    { page: 'share-gmi', wait: 2600 },   // 已存成靈感 → 兩秒後自己收回來源頁（同 insp-chain）
    { stop: true, n: 11 },
    { page: 'share-gmi', call: 'openApp' },
    { page: 'inspiration', wait: 900 },
    { cam: '.row[data-i="0"]', k: 1.8 }, { badge: '.row[data-i="0"]', n: 11 }, { wait: 400 },
    { page: 'inspiration', tap: '.row[data-i="0"]' }, { badge: false }, { cam: false },
    { stop: true, n: 12 },
    { badge: '[data-act="link"]', n: 12 }, { wait: 400 },
    { page: 'inspiration', tap: '[data-act="link"]', hide: true }, { badge: false },
    { page: 'inspiration', wait: 300 },
    { cam: '[data-dest="event"]', k: 1.8 }, { badge: '[data-dest="event"]', n: 12 }, { wait: 400 },
    { page: 'inspiration', tap: '[data-dest="event"]' }, { badge: false }, { cam: false },
    { page: 'event', wait: 3200 },
  ],
  'insp-chain': [
    { page: 'share-igi', tap: '[data-act="share"]' },
    { page: 'share-igi', tap: '[data-act="tripezgo"]' },
    { page: 'share-igi', wait: 600 },
    { page: 'share-igi', tap: '.xfoot .primary' },
    { page: 'share-igi', wait: 2600 },   // 已存成靈感 → 兩秒後自己收回來源頁
    { page: 'share-igi', call: 'next' },
    { page: 'share-gmi', wait: 700 },
    { page: 'share-gmi', tap: '[data-act="share"]' },
    { page: 'share-gmi', tap: '[data-act="tripezgo"]' },
    { page: 'share-gmi', wait: 600 },
    { page: 'share-gmi', tap: '.xfoot .primary' },
    { page: 'share-gmi', wait: 2600 },   // 已存成靈感 → 兩秒後自己收回來源頁（正常速度）
    { page: 'share-gmi', call: 'openApp' },
    { page: 'inspiration', wait: 900 },
    { page: 'inspiration', tap: '.row[data-i="0"]' },
    { page: 'inspiration', tap: '[data-act="link"]', hide: true },
    { page: 'inspiration', wait: 300 },   // 引導頁（ADR-0050）：等「新增關聯」選單滑到定位，手指才落在「行程」那一列（滑動中量位置會落到最下面的「地圖標記」）
    { page: 'inspiration', tap: '[data-dest="event"]' },
    { page: 'event', wait: 3200 },
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

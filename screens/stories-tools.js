// 小工具與整合那幾支手機的自動示範腳本（每一步的寫法見 autoplay.js 檔頭）。
// 每支手機是首頁上獨立的一張卡，故事都待在自己那一頁，不切分頁。一輪結束要回到起始的樣子，下一輪才接得上。
export const STORIES = {
  // 掃描：掃到新網址（結果紙）→ 收紙、關相機 → 再掃一次，掃到旅伴掃過的那段（移到最上面）→ 歸零
  scan: [
    { tap: '.btn' },
    { wait: 2300 },
    { tap: '.tz-dim.on' },
    { tap: '.cam .x' },
    { tap: '.btn' },
    { wait: 2300 },
    { tap: '.tz-dim.on' },
    { tap: '.cam .x' },
    { wait: 800 },
    { call: 'reset' },
  ],
  // 匯率換算：左格打 3000 → 對調 → 點最近換算的一筆 → 歸零
  fx: [
    { tap: '.cell[data-side="source"]' },
    { tap: '.kb [data-k="del"]' },
    { tap: '.kb [data-k="del"]' },
    { tap: '.kb [data-k="del"]' },
    { tap: '.kb [data-k="del"]' },
    { tap: '.kb [data-k="1"]' },               // 只示範輸入 1000 換算成 JPY（使用者 2026-10-12）
    { tap: '.kb [data-k="0"]' },
    { tap: '.kb [data-k="0"]' },
    { tap: '.kb [data-k="0"]' },
    { wait: 1800 },
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
  // IG 分享：分享 → 分享選單 → TripEZGo → 等補完 → 儲存 → 成功（兩秒自己收回貼文）
  'share-ig': [
    { tap: '[data-act="share"]' },
    { tap: '[data-act="tripezgo"]' },
    { wait: 900 },
    { tap: '.xbtn.r:not(.off)[data-act="save"]' },
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

// 1.11.0 AI 規劃行程流程動畫（ai-flow.html）的字：五語（簡體是人寫的，不是繁簡轉換）。
// 來源標記：[App] ＝ Scripts/i18n/maps 的字串表（key 寫在旁邊）；[擬] ＝ 稿上的示範內容（使用者自己的截圖、AI 的回覆、旅程資料），
// 或畫面上 App 還沒有對應字串的步驟字，由人逐語寫。5 語一格一格對齊，順序：hant、hans、en、ja、ko。
const L = { hant: 'zh-Hant-TW', hans: 'zh-Hans', en: 'en', ja: 'ja', ko: 'ko' };

// 每筆：[hant, hans, en, ja, ko]
const T = {
  // ── 畫布 ──
  kScreenshot: ['截圖', '截图', 'Screenshot', 'スクリーンショット', '스크린샷'],        // [App] planningcanvas.kind.screenshot
  kPdf: ['PDF', 'PDF', 'PDF', 'PDF', 'PDF'],                                               // [App] planningcanvas.kind.pdf
  kText: ['文字', '文字', 'Text', 'テキスト', '텍스트'],                                    // [App] kind.text
  kUrl: ['網址', '网址', 'Link', 'URL', '링크'],                                            // [App] kind.url
  kInsp: ['靈感', '灵感', 'Inspiration', 'インスピレーション', '영감'],                     // [App] kind.inspiration
  placeholder: ['想說點什麼？', '想说点什么？', "What's on your mind?", '何か伝えたいことは？', '하고 싶은 말이 있나요?'],   // [App] chat.placeholder（hans/ja/ko 取自字串表）
  stamp: ['完成', '完成', 'Done', '完了', '완료'],                                          // [App] stamp.done
  // 機票（BR132）截圖
  tkAir: ['長榮航空', '长荣航空', 'EVA AIR', 'エバー航空', '에바항공'],
  tkBoard: ['登機證', '登机牌', 'BOARDING PASS', '搭乗券', '탑승권'],
  tkSeat: ['座位 32A', '座位 32A', 'Seat 32A', '座席 32A', '좌석 32A'],
  tkGate: ['登機門 C5', '登机口 C5', 'Gate C5', '搭乗口 C5', '게이트 C5'],
  // JR 周遊券
  tkJr5: ['5 日券', '5 日券', '5-DAY', '5日券', '5일권'],
  tkJrName: ['關西廣域<br>周遊券', '关西广域<br>周游券', 'Kansai Wide<br>Area Pass', '関西ワイド<br>エリアパス', '간사이 와이드<br>에리어 패스'],
  tkAdult: ['成人', '成人', 'Adult', '大人', '성인'],
  // USJ 門票
  tkUsj1: ['1 日券', '1 日券', '1-DAY', '1デイ', '1일권'],
  tkUsjPax: ['成人 1 名', '成人 1 名', 'Adult ×1', '大人 1名', '성인 1명'],
  pdfName: ['Booking.com 確認信.pdf', 'Booking.com 确认信.pdf', 'Booking.com confirmation.pdf', 'Booking.com 予約確認.pdf', 'Booking.com 예약 확인.pdf'],
  pdfShort: ['Booking.com.pdf', 'Booking.com.pdf', 'Booking.com.pdf', 'Booking.com.pdf', 'Booking.com.pdf'],
  textDay2: ['Day2 清水寺 → 二年坂三年坂 → 錦市場 → 伏見稻荷', 'Day2 清水寺 → 二年坂三年坂 → 锦市场 → 伏见稻荷',
    'Day 2: Kiyomizu-dera → Ninenzaka → Nishiki Market → Fushimi Inari', '2日目：清水寺 → 二年坂 → 錦市場 → 伏見稲荷', '2일차: 기요미즈데라 → 니넨자카 → 니시키 시장 → 후시미 이나리'],
  textDay2Short: ['Day2 清水寺 → 二年坂', 'Day2 清水寺 → 二年坂', 'Day 2 plan', '2日目の予定', '2일차 일정'],
  urlTitle: ['京都紅葉 10 大名所完整攻略', '京都红叶 10 大名所完整攻略', 'Kyoto autumn leaves: top 10 spots', '京都の紅葉 名所10選 完全ガイド', '교토 단풍 명소 10곳 완벽 가이드'],
  urlShort: ['京都紅葉 10 大名所', '京都红叶 10 大名所', 'Kyoto autumn top 10', '京都 紅葉10選', '교토 단풍 10선'],
  inspName: ['%Arabica 京都東山', '%Arabica 京都东山', '%Arabica Higashiyama', '%Arabica 京都東山', '%Arabica 교토 히가시야마'],
  inspShort: ['%Arabica 東山', '%Arabica 东山', '%Arabica', '%Arabica', '%Arabica'],
  textDay3: ['Day3 嵐山竹林、搭小火車，晚上回大阪', 'Day3 岚山竹林、坐小火车，晚上回大阪',
    'Day 3: Arashiyama, scenic train, Osaka', '3日目：嵐山の竹林、トロッコ列車、夜は大阪へ', '3일차: 아라시야마 대나무 숲, 토롯코 열차, 저녁에 오사카로'],
  textDay3Short: ['Day3 嵐山竹林', 'Day3 岚山竹林', 'Day 3 plan', '3日目の予定', '3일차 일정'],
  // ── 讀取 ──
  userMsg: ['照這些排，第 2 天晚上留空', '照这些排，第 2 天晚上留空', 'Plan these in, and keep day 2 evening free', 'これで組んで。2日目の夜は空けて', '이대로 짜 주세요. 2일차 저녁은 비워 두고요'],
  found: ['讀到', '读到', 'Found', '読み取り結果', '읽은 내용'],
  rdAir: ['長榮 BR132 電子機票', '长荣 BR132 电子机票', 'EVA Air BR132 e-ticket', 'エバー航空 BR132 eチケット', '에바항공 BR132 e-티켓'],
  rdAirSub: ['航班 2 段', '航班 2 段', '2 flights', 'フライト 2区間', '항공편 2구간'],
  rdJr: ['JR 關西廣域周遊券', 'JR 关西广域周游券', 'JR Kansai Wide Area Pass', 'JR 関西ワイドエリアパス', 'JR 간사이 와이드 에리어 패스'],
  rdJrSub: ['票券 1 張', '票券 1 张', '1 pass', 'パス 1枚', '패스 1장'],
  rdUsj: ['USJ 門票', 'USJ 门票', 'USJ ticket', 'USJ チケット', 'USJ 입장권'],
  rdUsjSub: ['門票 1 張', '门票 1 张', '1 ticket', 'チケット 1枚', '입장권 1장'],
  rdPdfSub: ['住宿 3 晚', '住宿 3 晚', '3-night stay', '宿泊 3泊', '숙박 3박'],
  rdTextSub: ['地點 5 個、有時間', '地点 5 个、有时间', '5 places, with times', 'スポット 5か所・時刻あり', '장소 5곳, 시간 있음'],
  rdUrlSub: ['地點 10 個', '地点 10 个', '10 places', 'スポット 10か所', '장소 10곳'],
  reading: [n => `讀取卡片 ${n}／4`, n => `读取卡片 ${n}／4`, n => `Reading cards ${n} of 4`, n => `カードを読み取り中 ${n}／4`, n => `카드 읽는 중 ${n}/4`],   // [App] plan.step.readingprogress
  st1: ['讀取 8 則', '读取 8 条', 'Read 8 items', '8件を読み取り', '8개 읽기'],
  st2: ['合併 8 則', '合并 8 条', 'Merge 8 items', '8件を統合', '8개 병합'],
  st3: ['對地點', '对地点', 'Match places', '場所を照合', '장소 대조'],
  st4: ['排第 2 天', '排第 2 天', 'Plan day 2', '2日目を組む', '2일차 짜기'],
  st5: ['看天氣', '看天气', 'Check the weather', '天気を確認', '날씨 확인'],
  st6: ['寫總覽筆記', '写总览笔记', 'Write the overview note', '概要ノートを作成', '개요 노트 작성'],
  // ── 預覽 ──
  aiReply: ['回程班機是 11/30，旅程多一天。第 2 天下午有雨，伏見稻荷排在 15:00 前；晚上照你說的留空。', '回程航班是 11/30，旅程多一天。第 2 天下午有雨，伏见稻荷排在 15:00 前；晚上照你说的留空。',
    'Your return flight is 11/30, so the trip gains a day. Rain is expected on the afternoon of day 2, so Fushimi Inari goes before 15:00. The evening stays free, as you asked.',
    '帰りの便は11/30なので、旅程が1日増えます。2日目の午後は雨予報のため、伏見稲荷は15:00までに。夜はご希望どおり空けてあります。',
    '귀국 항공편이 11/30이라 여행이 하루 늘었어요. 2일차 오후에 비가 와서 후시미 이나리는 15:00 전에 넣었고, 저녁은 말씀하신 대로 비워 두었어요.'],
  chgModify: ['修改', '修改', 'Edit', '変更', '수정'],                                       // [App] adjust.op.modify
  tripDates: ['旅程日期', '旅程日期', 'Trip dates', '旅行の日付', '여행 날짜'],
  tripDatesVal: ['11/26 – 11/29 → 11/26 – 11/30', '11/26 – 11/29 → 11/26 – 11/30', '11/26 – 11/29 → 11/26 – 11/30', '11/26 – 11/29 → 11/26 – 11/30', '11/26 – 11/29 → 11/26 – 11/30'],
  dayHead: [(n, d, w) => `第 ${n} 天 · ${d}（${w}）`, (n, d, w) => `第 ${n} 天 · ${d}（${w}）`, (n, d, w) => `Day ${n} · ${d} (${w})`, (n, d, w) => `${n} 日目 · ${d}（${w}）`, (n, d, w) => `${n}일째 · ${d} (${w})`],   // [App] preview.daywithdate
  wd: [['四', '五', '六', '日', '一'], ['四', '五', '六', '日', '一'], ['Thu', 'Fri', 'Sat', 'Sun', 'Mon'], ['木', '金', '土', '日', '月'], ['목', '금', '토', '일', '월']],
  wxClear: ['晴', '晴', 'Clear', '晴れ', '맑음'],                                           // [App] home.weather.condition.clear
  wxRain: ['下午雨', '下午雨', 'PM rain', '午後は雨', '오후 비'],
  flight1: ['BR132 台北 → 大阪關西', 'BR132 台北 → 大阪关西', 'BR132 Taipei → Osaka Kansai', 'BR132 台北 → 大阪関西', 'BR132 타이베이 → 오사카 간사이'],
  flight2: ['BR131 大阪關西 → 台北', 'BR131 大阪关西 → 台北', 'BR131 Osaka Kansai → Taipei', 'BR131 大阪関西 → 台北', 'BR131 오사카 간사이 → 타이베이'],
  hotel: ['Hotel 京都三條', 'Hotel 京都三条', 'Hotel Kyoto Sanjo', 'ホテル京都三条', '호텔 교토 산조'],
  hotelSub: ['入住 3 晚', '入住 3 晚', '3 nights', '3泊', '3박'],                           // [App] label.checkin 是「入住」，這裡是行內說明
  allday: ['全日', '全天', 'All day', '終日', '하루 종일'],                                  // [App] preview.allday
  kiyomizu: ['清水寺', '清水寺', 'Kiyomizu-dera', '清水寺', '기요미즈데라'],
  ninen: ['二年坂・三年坂', '二年坂・三年坂', 'Ninenzaka & Sannenzaka', '二年坂・三年坂', '니넨자카·산넨자카'],
  nishiki: ['錦市場', '锦市场', 'Nishiki Market', '錦市場', '니시키 시장'],
  fushimi: ['伏見稻荷大社', '伏见稻荷大社', 'Fushimi Inari Taisha', '伏見稲荷大社', '후시미 이나리 신사'],
  asLiteral: ['照原文', '照原文', 'As written', '原文どおり', '원문 그대로'],
  gap: ['12:00 – 13:00 空檔', '12:00 – 13:00 空档', '12:00 – 13:00 Free time', '12:00 – 13:00 空き時間', '12:00 – 13:00 여유 시간'],   // [App] domain.legmode.idle
  more35: ['第 3–5 天 · 7 則', '第 3–5 天 · 7 条', 'Days 3–5 · 7 items', '3〜5日目 · 7件', '3–5일차 · 7개'],
  more15: ['第 1–5 天 · 12 則', '第 1–5 天 · 12 条', 'Days 1–5 · 12 items', '1〜5日目 · 12件', '1–5일차 · 12개'],
  clear: ['清除對話', '清除对话', 'Clear Chat', 'チャットを消去', '대화 지우기'],                // [App] adjust.clear
  bamboo: ['嵐山竹林小徑', '岚山竹林小径', 'Arashiyama Bamboo Grove', '嵐山の竹林の小径', '아라시야마 대나무 숲길'],
  bambooSub: ['竹林', '竹林', 'Bamboo grove', '竹林', '대나무 숲'],
  kixTpe: ['13:30 KIX → 15:35 TPE', '13:30 KIX → 15:35 TPE', '13:30 KIX → 15:35 TPE', '13:30 KIX → 15:35 TPE', '13:30 KIX → 15:35 TPE'],
  tpeKix: ['08:50 TPE → 12:20 KIX', '08:50 TPE → 12:20 KIX', '08:50 TPE → 12:20 KIX', '08:50 TPE → 12:20 KIX', '08:50 TPE → 12:20 KIX'],
  noteTitle: ['總覽筆記', '总览笔记', 'Overview Note', '概要ノート', '개요 노트'],                // [App] preview.overviewnote
  noteBody: ['京都 3 晚、大阪 1 天；第 2 天下午雨，伏見稻荷排在上午。', '京都 3 晚、大阪 1 天；第 2 天下午雨，伏见稻荷排在上午。', '3 nights in Kyoto, 1 day in Osaka. Rain on day 2 afternoon, so Fushimi Inari is in the morning.',
    '京都3泊、大阪1日。2日目の午後は雨のため、伏見稲荷は午前に。', '교토 3박, 오사카 1일. 2일차 오후에 비가 와서 후시미 이나리는 오전에 넣었어요.'],
  notPlaced: ['沒排進去 · 3', '没排进去 · 3', 'Not Scheduled · 3', '入りきらなかった項目 · 3', '배정되지 않은 항목 · 3'],   // [App] preview.notplanned
  sagano: ['嵯峨野小火車', '嵯峨野小火车', 'Sagano Scenic Railway', '嵯峨野トロッコ列車', '사가노 토롯코 열차'],
  saganoSub: ['文字 · 沒有空檔', '文字 · 没有空档', 'Text · no gap', 'テキスト · 空きなし', '텍스트 · 빈 시간 없음'],   // [App] ui.nogap.phrase
  eikando: ['永觀堂', '永观堂', 'Eikan-do', '永観堂', '에이칸도'],
  tofuku: ['東福寺', '东福寺', 'Tofuku-ji', '東福寺', '도후쿠지'],
  applyN: [n => `套用 ${n} 則`, n => `套\u2060用 ${n} 则`, n => `Apply ${n}`, n => `${n} 件を適用`, n => `${n}개 적용`],   // [App] chat.apply.events
  // ── 已套用 ──
  preview: ['預覽', '预览', 'Preview', 'プレビュー', '미리보기'],                              // [App] tripshare.preview.title
  applied: ['已套用', '已应用', 'Applied', '適用済み', '적용됨'],                              // [App] adjust.applied
  added: [n => `已加入 ${n} 則行程`, n => `已添加 ${n} 则行程`, n => `Added ${n} events`, n => `${n} 件の予定を追加しました`, n => `일정 ${n}개를 추가했습니다`],   // [App] preview.addedtoast
  view: ['查看', '查看', 'View', '見る', '보기'],
  // ── 行事曆 ──
  calAllday: ['全日', '全天', 'All-day', '終日', '종일'],                                   // [App] ui.allday
  calGreet: ['11月26日 · 週四', '11月26日 · 周四', 'Nov 26 · Thu', '11月26日 · 木', '11월 26일 · 목'],
  calTitle: ['京都 5 日', '京都 5 日', 'Kyoto in 5 Days', '京都 5日間', '교토 5일'],
  calStay: ['Hotel 京都三條（3 晚）', 'Hotel 京都三条（3 晚）', 'Hotel Kyoto Sanjo (3 nights)', 'ホテル京都三条（3泊）', '호텔 교토 산조 (3박)'],
};

export const strings = (lang) => {
  const i = { 'zh-Hant-TW': 0, 'zh-Hans': 1, en: 2, ja: 3, ko: 4 }[lang] ?? 0;
  const o = {};
  for (const [k, v] of Object.entries(T)) o[k] = v[i];
  return o;
};
export { L };

// 地圖分頁，地圖用 MapKit JS 畫真的（首頁 05）。介面層（頁首、日期列、搜尋、分享藥丸、浮動鈕、卡片）沿用 map.js／map.css。
//
// 預設畫面：第 2 天的行程圖釘、附近的超商與藥妝店、三位旅伴的共享位置，以及一條**正在進行的步行導航**
// （本通商店街南口 → 原爆圓頂，mapkit.Directions 步行）。選廣島市區這一段而不是宮島：宮島上只有一家超商、
// 而且被渡輪那顆圖釘蓋掉（商家擠到行程時讓行程贏，TripMapShopPin.priority）——市區這一段看得到好幾家。互動模式（interactive=1）才掛點擊：圖釘出卡片、✕ 收、
// 地圖可拖可縮、日期列換天（離開導航的那一天就結束導航）、卡片上的步行鈕開始導航、導航卡 ✕ 先問再結束。
//
// 照 App（/Users/zhgchgli/Projects/tripezgo/App/iOS/Modules）：
// - 圖釘：UI/…/TripMap/TripMapAnnotation.swift `TripMapPinView` —— MKMarkerAnnotationView 的圓頭尖尾、頭裡是類型
//   圖示（EventTypeIcons，網站這份是 trip/icons.js 由 tools/gen-icons.mjs 產生的）、顏色＝類型色組的 base；
//   取消的轉灰＋0.55 透明、不進路線、沒有站號；自訂標記灰褐、沒有號碼；單日時右上角掛「那一天第幾站」、
//   「全部」掛「第幾天」（badge(for:)）。待排行程與標記每一天都畫；全日行程只畫在開始那一天（MapViewModel.place(for:)）。
// - 路線：一段一條、依造訪順序（TripMapView.redrawRoute）；**設過交通方式畫實線、沒設畫虛線**（TripMapLeg.isSolidLine）；
//   步行那幾段問 MKDirections 拿真的路，大眾運輸與其他畫兩站之間的直線（MapKit 給不出大眾運輸的幾何）。
//   線是 WalkingRouteRenderer 的魚骨：tzAccentInk、3pt、底線 0.85、每 40pt 一枚 8/2 的箭頭（TripMapMetrics.route*）；
//   線上膠囊寫距離（TripMapLegLabel、TripTextFormatter.distance：公尺不寫小數、公里一位）。
//   **導航進行中旅程線整組不畫**（TripMapMetrics：MAP-NAV-HIDE-LEGS，2026-09-26）。
// - 步行導航：tzWalkingRoute #5cc6c3、6pt、底線 0.85、10/3 箭頭（TripMapMetrics.walkingRoute*）；
//   卡片 MapNavigationCard ＋ Map/…/MapViewController.card(from:)：路口動作照 WalkingNavigationUseCase.linking
//   （兩段的出入方位差 <20 直行、<50 靠左右、≥150 迴轉、其餘左右轉），距離照 walkingDistance（公制一公里內寫公尺、
//   英制 1000 英尺內寫英尺）；轉彎時單位寫「公尺後」（map.walkingnav.unit.then）；✕ 先問「結束步行導航？」（navEnd*）。
// - 商家：R16。資料是 App 出貨的資料源（TripEZGoData/ShopCatalog/ShopFeedSource.swift `live` 那八份 gist），
//   2026-10-11 抓下來、只留第 1、2 天各站 1.5 公里內的（screens/data/shops-sanyo.json）。
//   圖釘 TripMapShopPin.swift（36×26 磚、白緣、選中翻品牌色＋放大 1.28），店面 ShopBrandArt.swift（照抄成 SVG），
//   **地圖上看得到的地面在 3 公里以內才畫**（TripMapMetrics.shopVisibleMaxSpanMetres）。
//   營業狀態 Domain/Model/ShopOpenState.swift（一週攤平成一條軸、合併相鄰段、≤60 分＝即將打烊），用店的時區（Asia/Tokyo）。
//   店名 Shop.title（招牌＋店名）＋ MapViewModel+Shops.readable（假名招牌換成當地叫法）。
// - 旅伴：LiveMateAnnotation.swift、MapPlaceCard.configure(_ mate:)、ShopCardSection.configure(mateNamed:)；
//   一小時沒更新（LivePosition.coldAfter）整顆灰、照樣點得開；「更新於 X」是 RelativeDateTimeFormatter(.full)。
//   名字與顏色同 share-location.html 的樣本。自己那一顆是系統藍點，不當旅伴畫。
import { fmt, params, lang, t, loadTrip, loadCategories, categoryName, chrome, swatchClass, ready, ICON, interactive, toMin, duration, DEV } from './chrome.js';
// trip/config.js（MapKit token）與 trip/icons.js（類型圖示）在 screens/ 外面：截圖工具只服務 screens/，所以動態載入，
// 拿不到就走底圖那一條。
let CONFIG, MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID;

const d = document.getElementById('d');
const [trip, shopData] = await Promise.all([loadTrip(), fetch('./data/shops-sanyo.json').then(r => r.json()), loadCategories()]);
const todayNo = +(params.get('today') || 1);
const start = new Date((params.get('start') || '2026-10-10') + 'T00:00:00');
const dateOf = n => new Date(start.getTime() + (n - 1) * 864e5);
const today = dateOf(todayNo);
const NAV_DAY = 2;

// App 的字串（Scripts/i18n/maps/Map.json、UI.json）
const S = {
  'zh-Hant-TW': { all: '全部', search: '搜尋地標或地址', live: '分享我的位置', liveOn: '正在分享位置', openEvent: '開啟行程細節', openInMaps: '在地圖開啟',
    open24: '24 小時營業', open: x => `營業中 · ${x} 打烊`, openNow: '營業中', soon: x => `即將打烊 · ${x}`, closed: x => `休息中 · ${x} 開始營業`,
    closedNow: '休息中', unknown: '營業時間不明', note: s => `資料更新於 ${s}，實際狀況可能有所不同。`, noteDate: '2026/10/10',
    updated: s => `更新於 ${s}`, wiu: '對方的定位授權只到「使用 App 期間」。TripEZGo 被系統關掉之後，你看到的會停在最後一次更新的位置。',
    man: { straight: '繼續直行', slightLeft: '靠左', left: '左轉', slightRight: '靠右', right: '右轉', uTurn: '迴轉', arrive: '抵達' },
    then: u => `${u}後`, status: (a, b) => `步行導航 · 還有 ${a} · ${b}`, headingTo: s => `前往 ${s}`, openDest: '開啟終點',
    endTitle: '結束步行導航？', endMsg: '圖上那條路線與導航都會收起來。', cancel: '取消', endConfirm: '結束導航',
    signage: { donki: '唐吉訶德', matsukiyo: '松本清', daikoku: '大國藥妝' },
    unit: { m: '公尺', km: '公里' },
    // 退回底圖時那一份（同 map.js：基準圖上那一趟導航，飯店 → 7-ELEVEN 広島若草町）
    poster: { man: '繼續直行', dist: '360', unit: '公尺', status: '步行導航 · 還有 710 公尺 · 9 分', dest: '前往 広島若草町' } },
  en: { all: 'All', search: 'Search a landmark or address', live: 'Share my location', liveOn: 'Sharing location', openEvent: 'Open event details', openInMaps: 'Open in Maps',
    open24: 'Open 24 hours', open: x => `Open · closes ${x}`, openNow: 'Open', soon: x => `Closing soon · ${x}`, closed: x => `Closed · opens ${x}`,
    closedNow: 'Closed', unknown: 'Hours unknown', note: s => `Data updated ${s}. Actual hours may differ.`, noteDate: '10/10/2026',
    updated: s => `Updated ${s}`, wiu: 'They allowed location only while using the app. If iOS shuts TripEZGo down, you keep seeing their last known spot.',
    man: { straight: 'Continue straight', slightLeft: 'Keep left', left: 'Turn left', slightRight: 'Keep right', right: 'Turn right', uTurn: 'Make a U-turn', arrive: 'Arrive' },
    then: u => `${u} ahead`, status: (a, b) => `Walking · ${a} · ${b} left`, headingTo: s => `Heading to ${s}`, openDest: 'Open destination',
    endTitle: 'End walking navigation?', endMsg: 'The route on the map and the navigation will both stop.', cancel: 'Cancel', endConfirm: 'End navigation',
    signage: { donki: 'Don Quijote', matsukiyo: 'Matsukiyo', daikoku: 'Daikoku Drug' },
    unit: { ft: 'feet', mi: 'miles' },
    poster: { man: 'Continue straight', dist: '0.2', unit: 'miles', status: 'Walking · 0.4 miles · 9 min left', dest: 'Heading to 広島若草町' } },
  ja: { all: 'すべて', search: 'ランドマークや住所を検索', live: '現在地を共有', liveOn: '位置を共有中', openEvent: '予定の詳細を開く', openInMaps: 'マップで開く',
    open24: '24 時間営業', open: x => `営業中・${x} 閉店`, openNow: '営業中', soon: x => `まもなく閉店・${x}`, closed: x => `休業中・${x} 開店`,
    closedNow: '営業時間外', unknown: '営業時間不明', note: s => `データ更新日 ${s}。実際とは異なる場合があります。`, noteDate: '2026/10/10',
    updated: s => `${s}に更新`, wiu: '相手の位置情報の許可は「App の使用中」までです。iOS が TripEZGo を終了させると、最後に更新された位置が表示され続けます。',
    man: { straight: '直進', slightLeft: '左寄り', left: '左折', slightRight: '右寄り', right: '右折', uTurn: 'Uターン', arrive: '到着' },
    then: u => `${u} 先`, status: (a, b) => `徒歩ナビ · 残り ${a} · ${b}`, headingTo: s => `${s} へ移動中`, openDest: '目的地を開く',
    endTitle: '徒歩ナビを終了しますか？', endMsg: 'マップ上のルートとナビの両方が終了します。', cancel: 'キャンセル', endConfirm: 'ナビを終了',
    signage: {},
    unit: { m: 'm', km: 'km' },
    poster: { man: '直進', dist: '360', unit: 'm', status: '徒歩ナビ · 残り 710 m · 9 分', dest: '広島若草町 へ移動中' } },
  // ko：同上幾份字串表的 ko 欄。資料日期照 DateFormatter yMd／yM 在 ko 的寫法（「2026. 10. 10.」「2026. 10.」）；
  // 單位照 MeasurementFormatter（ko：m／km；狀態列跟 App 一樣用空白接起來，MapViewController.navigation）
  ko: { all: '전체', search: '랜드마크나 주소 검색', live: '내 위치 공유', liveOn: '위치 공유 중', openEvent: '일정 상세 열기', openInMaps: '지도에서 열기',
    open24: '24시간 영업', open: x => `영업 중 · ${x} 마감`, openNow: '영업 중', soon: x => `곧 마감 · ${x}`, closed: x => `휴무 · ${x} 영업 시작`,
    closedNow: '영업 종료', unknown: '영업시간 정보 없음', note: s => `${s} 기준 데이터입니다. 실제와 다를 수 있습니다.`, noteDate: '2026. 10. 10.',
    updated: s => `${s} 업데이트`, wiu: '상대는 앱 사용 중에만 위치를 허용했습니다. iOS가 TripEZGo를 종료하면 마지막으로 업데이트된 위치가 계속 보입니다.',
    man: { straight: '계속 직진', slightLeft: '왼쪽으로', left: '좌회전', slightRight: '오른쪽으로', right: '우회전', uTurn: '유턴', arrive: '도착' },
    then: u => `${u} 앞`, status: (a, b) => `도보 내비 · ${a} · ${b} 남음`, headingTo: s => `${s}(으)로 이동 중`, openDest: '목적지 열기',
    endTitle: '도보 내비게이션을 종료할까요?', endMsg: '지도의 경로와 내비게이션이 모두 종료됩니다.', cancel: '취소', endConfirm: '내비게이션 종료',
    signage: { donki: '돈키호테', matsukiyo: '마츠모토키요시', daikoku: '다이코쿠 드러그' },
    unit: { m: 'm', km: 'km' },
    poster: { man: '계속 직진', dist: '360', unit: 'm', status: '도보 내비 · 710 m · 9분 남음', dest: '広島若草町(으)로 이동 중' } },
}[lang] || {};
const LOCALE = { 'zh-Hant-TW': 'zh-TW', en: 'en-US', ja: 'ja', ko: 'ko-KR' }[lang] || 'zh-TW';
const IMPERIAL = lang === 'en';   // 基準圖的英文是 en-US（英制），同 map.js
const dayLabel = n => lang === 'ja' ? `${n} 日目` : t.day(n);
const TABS_JA = ['概要', '旅行', 'マップ', '資料', '設定'];   // 1.3.0：ツール → 資料

// ── 旅伴樣本（同 share-location.html：名字、顏色）。位置在第 2 天下午的和平公園一帶，更新時間是相對於畫面上的 9:41 ──
const MATE_NAMES = { 'zh-Hant-TW': ['小雯', '凱文', '美琪'], en: ['Mia', 'Ken', 'Sara'], ja: ['美咲', '健太', 'さくら'], ko: ['지우', '민준', '서연'] }[lang] || ['小雯', '凱文', '美琪'];
const MATES = [
  { id: 'm0', name: MATE_NAMES[0], colour: 'eat', at: [34.39505, 132.45300], ageMin: 2, wiu: true },
  { id: 'm1', name: MATE_NAMES[1], colour: 'stay', at: [34.39290, 132.45380], ageMin: 14 },
  { id: 'm2', name: MATE_NAMES[2], colour: 'shop', at: [34.39430, 132.45560], ageMin: 75 },   // 超過一小時 → 灰（三人收攏在和平公園一帶，06 鏡頭才拉得近）
];
const COLD_MIN = 60;   // LivePosition.coldAfter
const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always', style: 'long' });
const ago = m => m < 60 ? rtf.format(-m, 'minute') : rtf.format(-Math.floor(m / 60), 'hour');
// 自己（系統的藍點＋App 自己畫的朝向扇）。每一支擺在範例行程那一刻合理的地方：
// - 導航（預設）：本通商店街南口一帶——步行導航的起點就是這一點
// - nav=0（打開地圖的預設樣子，第 2 天早上 9:41）：剛下渡輪、走在往表參道商店街的路上（9:30–10:05 那一則），面向下一站嚴島神社
// - focus=mates（位置共享）：和平紀念公園裡（和平之鐘一帶），跟旅伴在一起，面向小雯
const ME_MODE = params.get('focus') === 'mates' ? 'mates' : params.get('nav') === '0' ? 'route' : 'nav';
const ME = { nav: [34.39240, 132.45880], route: [34.30080, 132.32215], mates: [34.39400, 132.45265] }[ME_MODE];

// ── 距離（TripTextFormatter.distance／walkingDistance） ──
function distParts(metres) {
  if (IMPERIAL) {
    const ft = metres / 0.3048;
    return ft < 1000 ? { v: Math.round(ft), u: S.unit.ft, coarse: false } : { v: +(metres / 1609.344).toFixed(1), u: S.unit.mi, coarse: true };
  }
  return metres < 1000 ? { v: Math.round(metres), u: S.unit.m, coarse: false } : { v: +(metres / 1000).toFixed(1), u: S.unit.km, coarse: true };
}
const numFmt = (v, coarse) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: coarse ? 1 : 0 }).format(v);
function legDistance(metres) {
  if (metres < 1) return null;
  const unit = IMPERIAL ? (metres / 0.3048 < 1000 ? 'foot' : 'mile') : (metres < 1000 ? 'meter' : 'kilometer');
  const v = { foot: metres / 0.3048, mile: metres / 1609.344, meter: metres, kilometer: metres / 1000 }[unit];
  return new Intl.NumberFormat(LOCALE, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: unit === 'foot' || unit === 'meter' ? 0 : 1 }).format(v);
}
const R = 6371000, rad = x => x * Math.PI / 180;
const metresBetween = (a, b) => { const la = rad((a[0] + b[0]) / 2); const x = rad(b[1] - a[1]) * Math.cos(la), y = rad(b[0] - a[0]); return Math.hypot(x, y) * R; };
const bearing = (a, b) => { const la = rad((a[0] + b[0]) / 2); const deg = Math.atan2((b[1] - a[1]) * Math.cos(la), b[0] - a[0]) * 180 / Math.PI; return deg < 0 ? deg + 360 : deg; };

// ── icon ──
const IC = { ...ICON,
  turnLeft: '<path d="M18 20v-7.6A3.4 3.4 0 0 0 14.6 9H7.2M10.6 5.6 7.2 9l3.4 3.4"/>',
  turnRight: '<path d="M6 20v-7.6A3.4 3.4 0 0 1 9.4 9h7.4M13.4 5.6 16.8 9l-3.4 3.4"/>',
  turnSlightLeft: '<path d="M15 20v-6.4A3.4 3.4 0 0 0 13.2 11.2L8.4 6.4M8.4 11.2V6.4h4.8"/>',
  turnSlightRight: '<path d="M9 20v-6.4A3.4 3.4 0 0 1 10.8 11.2l4.8-4.8M15.6 11.2V6.4h-4.8"/>',
  turnAround: '<path d="M8 20V9a4 4 0 0 1 8 0v6M12.6 11.6 16 15l3.4-3.4"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  locate: '<path d="M20.5 3.5 3.5 10.6l7.3 2.6 2.6 7.3z"/>',
};
const MAN_ICON = { straight: 'turnStraight', slightLeft: 'turnSlightLeft', left: 'turnLeft', slightRight: 'turnSlightRight', right: 'turnRight', uTurn: 'turnAround', arrive: 'mapPin' };
const SW = { plus: 2, close: 2, turnStraight: 2, turnLeft: 2, turnRight: 2, turnSlightLeft: 2, turnSlightRight: 2, turnAround: 2, nearby: 1.8, walking: 1.8, mapPin: 1.8, infoFill: 0, chevDown: 1.8, locate: 1.8 };
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke-width="${SW[n] ?? 1.8}">${IC[n]}</g></svg>`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const glyph = cat => `<svg class="glyph" viewBox="0 0 15 15" aria-hidden="true"><path fill-rule="evenodd" d="${MAKI[MAKI_OF_TYPE[cat] || DEFAULT_ICON_ID] || MAKI.marker}"/></svg>`;

// ── 店面：ShopBrandArt.draw 照抄成 SVG（viewBox 59×40；淺色主題的 facade=tzMuted、glass=tzBorder、sign=tzSurface） ──
const LOOKS = {
  seven: { bands: ['#F58220', '#007D48', '#EE1C25'], primary: '#F58220', mark: '7' },
  familymart: { bands: ['#009A44', '#0068B7', '#009A44'], primary: '#009A44', mark: 'F' },
  lawson: { solid: '#0068B7', primary: '#0068B7', mark: 'L' },
  biccamera: { bands: ['#E60012', '#F5A200', '#E60012'], primary: '#E60012', mark: 'B', structure: 'tower' },
  donki: { bands4: ['#D32D26', '#FFFFFF', '#2C67B2', '#2C67B2'], primary: '#FDF250', ink: '#D32D26', mark: 'ド', base: 12.6, structure: 'tower' },
  yodobashi: { solid: '#C8102E', primary: '#C8102E', mark: 'ヨ', base: 12.6, structure: 'tower' },
  matsukiyo: { solid: '#F5C800', primary: '#0A2E86', ink: '#FDF250', panel: '#0A2E86', mark: 'マ', base: 12.6, structure: 'drug' },
  daikoku: { solid: '#FFD900', primary: '#FFD900', ink: '#FFFFFF', panel: '#A5121A', mark: '大', base: 12.6, structure: 'drug' },
};
function shopArt(brand) {
  const L = LOOKS[brand] || {}, facade = '#7c6f63', glass = '#dbd5cd', sign = '#fbf8f4';
  const r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  let s = '';
  if (L.solid) s += r(0, 0, 59, 15, L.solid);
  else if (L.bands4) { s += r(0, 0, 59, 15, '#fff'); L.bands4.forEach((c, i) => { s += r(0, i * 3.75, 59, 3.75, c); }); }
  else { s += r(0, 0, 59, 15, sign); [[0, 6.5], [8, 2.5], [12, 3]].forEach(([y, h], i) => { if (L.bands?.[i]) s += r(0, y, 59, h, L.bands[i]); }); }
  s += r(36, 3, 13.5, 12, L.panel || '#fff');
  if (L.mark) s += `<text x="42.75" y="${L.base || 13}" text-anchor="middle" font-family="-apple-system, 'Hiragino Sans', sans-serif" font-weight="700" font-size="11" fill="${L.ink || L.primary}">${L.mark}</text>`;
  s += r(4.5, 15, 51, 25, facade);
  const p = L.primary || facade;
  if ((L.structure || 'shop') === 'shop') s += r(9.5, 22, 20.5, 11, glass) + r(36, 18.5, 13.5, 5.5, p) + r(36, 24, 13.5, 16, glass);
  else if (L.structure === 'tower') s += r(8, 18, 43.5, 5, glass) + r(8, 25, 43.5, 5, glass) + r(8, 31.4, 43.5, 2.2, p) + r(36, 33.6, 13.5, 6.4, glass);
  else s += r(8, 16.2, 43.5, 2.2, p) + r(8, 18.4, 43.5, 21.6, glass) + r(21.3, 18.4, 1.8, 21.6, facade) + r(36.4, 18.4, 1.8, 21.6, facade);
  return `<svg viewBox="0 0 59 40" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}

// ── 商家：資料 → 畫得出來的那一份 ──
const BRAND_SIGN = { seven: '7-ELEVEN', familymart: 'FamilyMart', lawson: 'Lawson', daikoku: 'ダイコクドラッグ' };
const SIGN_ORIGINAL = { donki: 'ドン・キホーテ', matsukiyo: 'マツモトキヨシ', daikoku: 'ダイコクドラッグ' };
function shopTitle(s) {
  const sign = BRAND_SIGN[s.brand] || '';
  let title = sign ? `${sign} ${s.name}` : s.name;
  const loc = S.signage[s.brand], orig = SIGN_ORIGINAL[s.brand];
  if (loc && orig) title = title.replace(orig, loc).replace(orig.replace('・', '･'), loc);
  return title;
}
// ShopOpenState.of —— 「現在」＝畫面上的 9:41，店的時區（Asia/Tokyo）。今天＝第 todayNo 天。
const NOW_DOW = today.getDay(), NOW_MIN = 9 * 60 + 41;
const parseHM = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
function shopState(hours) {
  const win = hours.map(h => {
    if (!h) return null;
    const o = parseHM(h[0]), c = parseHM(h[1]);
    if (o == null || c == null || o >= 1440 || c === o) return null;
    return { o, c };
  });
  if (win.every(w => !w)) return { tone: 'unknown' };
  if (win.every(w => w && w.o === 0 && w.c >= 1440)) return { tone: 'open', label: S.open24 };
  const W = 1440 * 7, axis = [];
  win.forEach((w, i) => { if (!w) return; const ds = i * 1440; axis.push([ds + w.o, ds + (w.c > w.o ? w.c : w.c + 1440)]); });
  const rep = [...axis.map(([a, b]) => [a - W, b - W]), ...axis, ...axis.map(([a, b]) => [a + W, b + W])].sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const iv of rep) { const last = merged[merged.length - 1]; if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]); else merged.push([...iv]); }
  const pos = NOW_DOW * 1440 + NOW_MIN;
  const clock = m => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const span = merged.find(([a, b]) => a <= pos && pos < b);
  if (span) {
    const left = span[1] - pos;
    if (left <= 60) return { tone: 'soon', label: S.soon(clock(span[1])) };
    return { tone: 'open', label: left < 1440 ? S.open(clock(span[1])) : S.openNow };
  }
  if (!win[NOW_DOW]) return { tone: 'unknown' };
  const next = merged.find(([a]) => a > pos);
  const daysAway = next ? Math.floor(next[0] / 1440) - Math.floor(pos / 1440) : 99;
  return { tone: 'closed', label: daysAway <= 1 ? S.closed(clock(next[0])) : S.closedNow };
}
// 手動更新的那幾份只寫到月（MapViewModel+Shops.drawable：text.monthYear）；每天更新的寫到日——同 map.js 寫成畫面上的「今天」
function monthYear(iso) {
  const dt = new Date(iso), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1;
  return lang === 'en' ? `${m}/${y}` : lang === 'ko' ? `${y}. ${m}.` : `${y}/${m}`;   // ko：DateFormatter yM＝「y. M.」
}
const SHOPS = shopData.stores.map((s, i) => {
  const st = shopState(s.hours);
  return { ...s, id: `s${i}`, title: shopTitle(s), state: st.tone === 'unknown' ? { tone: 'unknown', label: S.unknown } : st,
    note: S.note(shopData.feeds[s.brand]?.cadence === 'manual' ? monthYear(shopData.feeds[s.brand].generatedAt) : S.noteDate) };
});

// ── 圖上的行程（MapViewModel.place(for:)） ──
const places = [];
for (const dd of trip.days) for (const e of dd.events) if (e.place) places.push({ id: e.key, kind: 'event', day: dd.day, ev: e, at: [e.place.latitude, e.place.longitude], cancelled: !!e.isCancelled });
for (const a of trip.allDayEvents) if (a.place) places.push({ id: a.key, kind: 'event', day: a.fromDay, ev: a, at: [a.place.latitude, a.place.longitude], allDay: true });
for (const u of trip.unscheduledEvents) if (u.place) places.push({ id: u.key, kind: 'pending', day: null, ev: u, at: [u.place.latitude, u.place.longitude] });
for (const m of trip.markers) places.push({ id: m.key, kind: 'marker', day: null, ev: { title: m.name, category: m.category, notes: m.notes, place: { name: m.name } }, at: [m.latitude, m.longitude] });
const byId = Object.fromEntries(places.map(p => [p.id, p]));
const routes = Object.fromEntries(trip.days.map(dd => [dd.day, dd.events
  .filter(e => e.place && !e.isCancelled && e.start).sort((a, b) => toMin(a.start) - toMin(b.start)).map(e => byId[e.key])]));

// ── 介面層（1.10.0，ADR-0091）：地圖滿版；搜尋列浮在最上面、下面一列圖層晶片、再下面分享藥丸；
//    天數晶片搬進底部面板（小＝grabber＋依日程／附近＋天數晶片；中＝容器高 60%，寬大於高 45%）。
//    面板根頁：依日程選一天＝全日／上午／下午／晚上／待排各一列（MapCarouselRows），選全部＝每天一列；
//    卡＝150 寬、4:3 圖（封面→類型圖示方塊）、名稱 2 行、時刻（MapCarouselCardCell）。點圖釘＝面板換成那一則的頁（MapPlaceCard）。
//    參考圖：App repo agent-notes/fixes-1120/walk/final-318/04、44、45、62、64；acceptance-1100/map-panel-table/*。
const G = DEV.w === 1032 ? { searchTop: 92, safeBottom: 20, ratio: .6, right: 0 }
  : DEV.bar ? { searchTop: 14, safeBottom: 34, ratio: .45, right: DEV.bar }
  : { searchTop: 72, safeBottom: 83, ratio: .6, right: 0 };
const HEADER_H = 128;   // 分段上緣 37 ＋ 31 ＋ 間距 8 ＋ 晶片 44 ＋ 下 8（參考圖 04-map 量：小＝面板頂 663／874）
const DETENT = { small: DEV.h - G.safeBottom - HEADER_H, medium: Math.round(DEV.h * (1 - G.ratio)) };
const L10 = {
  'zh-Hant-TW': { byDay: '依日程', nearby: '附近', morning: '上午', afternoon: '下午', evening: '晚上', allDay: '全日', inProgressSuffix: '・進行中', upcomingSuffix: '・即將開始', pending: '待排',
    chips: ['行程', '餐廳', '咖啡', '博物館', '公園', '大眾運輸', '停車場', '購物'], openEvent: '開啟行程細節', inMaps: '在地圖開啟', viewInsp: '查看靈感', edit: '編輯' },
  en: { byDay: 'By Day', nearby: 'Nearby', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', allDay: 'All-day', pending: 'Unscheduled',
    chips: ['Trip', 'Restaurants', 'Cafés', 'Museums', 'Parks', 'Transit', 'Parking', 'Shopping'], inProgressSuffix: ' · now', upcomingSuffix: ' · up next', openEvent: 'Open event details', inMaps: 'Open in Maps', viewInsp: 'View Inspiration', edit: 'Edit' },
  ja: { byDay: '日程順', nearby: '近く', morning: '午前', afternoon: '午後', evening: '夜', allDay: '終日', inProgressSuffix: '・進行中', upcomingSuffix: '・まもなく開始', pending: '未定',
    chips: ['旅程', 'レストラン', 'カフェ', '博物館', '公園', '公共交通', '駐車場', 'ショッピング'], openEvent: '予定の詳細を開く', inMaps: 'マップで開く', viewInsp: 'インスピレーションを見る', edit: '編集' },
  ko: { byDay: '일정별', nearby: '주변', morning: '오전', afternoon: '오후', evening: '저녁', allDay: '종일', inProgressSuffix: ' · 진행 중', upcomingSuffix: ' · 곧 시작', pending: '미정',
    chips: ['일정', '음식점', '카페', '박물관', '공원', '대중교통', '주차장', '쇼핑'], openEvent: '일정 상세 열기', inMaps: '지도에서 열기', viewInsp: '영감 보기', edit: '편집' },
}[lang] || {};
const CHIP_ICON = [null, 'restaurant', 'cafe', 'museum', 'park', 'rail-metro', 'parking', 'shop'];
const LIVE_ON = params.get('focus') === 'mates';
// nav=0 是「打開地圖的預設樣子」：選在今天，看今天的路線與標記（App 開地圖時預選今天）
let day = params.get('nav') === '0' ? todayNo : NAV_DAY;
const chipHtml = () => [`<div class="chip all${day == null ? ' on' : ''}" data-day=""${interactive ? ' data-tap' : ''}><b>${S.all}</b></div>`].concat(Array.from({ length: trip.dayCount }, (_, i) => {
  const n = i + 1, dt = dateOf(n), isToday = n === todayNo;
  return `<div class="chip${n === day ? ' on' : ''}" data-day="${n}"${interactive ? ' data-tap' : ''}><b>${isToday ? '<i></i>' : ''}${isToday ? t.today : dayLabel(n)}</b>
    <span>${t.shortDate(dt.getMonth() + 1, dt.getDate())} ${t.weekday[dt.getDay()]}</span></div>`;
})).join('');
const sv = (inner, sw = 1.8) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const SLIDERS = '<path d="M6 3.9v16.2M12 3.9v16.2M18 3.9v16.2"/><circle cx="6" cy="9.6" r="2.1" fill="var(--card)"/><circle cx="12" cy="15.3" r="2.1" fill="var(--card)"/><circle cx="18" cy="6.9" r="2.1" fill="var(--card)"/>';
const CAL_EVENT = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/><rect x="6.5" y="13.5" width="7" height="4" rx="1"/>';
const SEARCH = '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>';
const INFO = '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/>';
const CHEV_L = '<path d="M15 4.5 7.5 12l7.5 7.5"/>';
const maki = id => MAKI && MAKI[id] ? `<svg viewBox="0 0 15 15" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${MAKI[id]}"/></svg>` : '';
try { ({ MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID } = await import('../trip/icons.js')); } catch {}
const railHtml = () => `<div class="lchip ic" aria-label="map settings">${sv(SLIDERS, 1.5)}</div>` + L10.chips.map((c, i) =>
  `<div class="lchip on">${i === 0 ? sv(CAL_EVENT, 1.7) : maki(CHIP_ICON[i])}<span>${c}</span>${i === 7 ? sv('<path d="m7 10 5 5 5-5"/>', 2) : ''}</div>`).join('');
d.insertAdjacentHTML('beforeend', `<div class="mk" id="mk"></div>
  <div class="search">${sv(SEARCH, 2)}<span>${S.search}</span></div>
  <div class="lrail"><div class="lrail-in">${railHtml()}</div></div>
  <div class="live${LIVE_ON ? ' on' : ''}"><i></i>${LIVE_ON ? S.liveOn : S.live}</div>
  <div id="fabSlot"></div>
  <div class="pnl" id="pnl"><div class="grab"></div>
    <div class="seg"><b class="on">${L10.byDay}</b><b>${L10.nearby}</b></div>
    <div class="pchips" id="chips">${chipHtml()}</div>
    <div class="pbody" id="cardSlot"></div></div>`);
d.style.setProperty('--search-top', `${G.searchTop}px`);
d.style.setProperty('--right-inset', `${G.right}px`);
chrome(d, { tab: 3 });
const mkEl = document.getElementById('mk');
const pnl = document.getElementById('pnl');

// ── 面板內容 ──
const cardSlot = document.getElementById('cardSlot');
const fabSlot = document.getElementById('fabSlot');
const tap = interactive ? ' data-tap' : '';
const imgOf = e => (e.images && e.images[0] && trip.images?.[e.images[0]]) ? `img/tpl/${e.images[0]}.jpg` : null;
const partOf = e => { const m = toMin(e.start); return m < 720 ? 'morning' : m < 1080 ? 'afternoon' : 'evening'; };
// Domain.LiveIntensity：現在（畫面上的 9:41）落在今天某一則裡＝1；落在同一天兩則的空檔裡，剛結束的那一則 1−t、下一則 t；已取消、全日、待排不算
const INTENSITY = (() => {
  const out = {}; out.next = null;
  const items = places.filter(p => p.kind === 'event' && !p.allDay && !p.cancelled && p.day === todayNo && p.ev.start && p.ev.end)
    .map(p => ({ id: p.id, from: toMin(p.ev.start), to: toMin(p.ev.end) }));
  const inside = items.filter(i => i.from <= NOW_MIN && NOW_MIN < i.to);
  if (inside.length) { inside.forEach(i => out[i.id] = 1); return out; }
  const before = items.filter(i => i.to <= NOW_MIN).sort((a, b) => b.to - a.to)[0];
  const after = items.filter(i => i.from > NOW_MIN).sort((a, b) => a.from - b.from)[0];
  if (before && after) { const t = (NOW_MIN - before.to) / (after.from - before.to); if (1 - t > 0) out[before.id] = 1 - t; if (t > 0) { out[after.id] = t; out.next = after.id; } }
  return out;
})();
function cardHtml(p) {
  const ev = p.ev, src = imgOf(ev);
  const pic = src ? `<img src="${src}" alt="">` : `<div class="tile ${swatchClass(ev.category)}">${glyph(ev.category)}</div>`;
  let when = p.allDay ? L10.allDay : p.kind === 'pending' ? L10.pending : ev.start;
  // MapCarouselCardCell.secondLine：第二行只放「時刻・狀態」。「・進行中」只有 k = 1（真的在行程裡）；空檔裡只有下一則接「・即將開始」，前一則什麼都不接
  const k = INTENSITY[p.id] || 0, live = k >= 1, upcoming = k > 0 && !live && INTENSITY.next === p.id;   // 空檔裡只有下一則接「・即將開始」，前一則什麼都不接
  if (live) when += L10.inProgressSuffix; else if (upcoming) when += L10.upcomingSuffix;
  // 距離牌（MapDistanceChip，定稿 c）：有使用者位置（複刻裡的「我」＝ME）才有，照片右上角；取消的牌子跟照片一起淡
  const m = Math.round(metresBetween(ME, p.at));
  const chip = `<div class="pdist">${legDistance(m) || ''}</div>`;
  const dot = k > 0 ? `<i class="pcdot ${swatchClass(ev.category)}"></i>` : '';
  return `<div class="pcard${p.cancelled ? ' cancelled' : ''}${k > 0 ? ' lit' : ''}"${k > 0 ? ` style="--k:${k.toFixed(3)}"` : ''} data-id="${p.id}"${tap}><div class="pimg">${pic}${chip}</div>
    <div class="pname">${dot}<span>${fmt(ev.title)}</span></div><div class="ptime">${fmt(when)}</div></div>`;
}
function rowsHtml() {
  const rows = [];
  if (day == null) {
    for (const dd of trip.days) {
      const cards = places.filter(p => p.kind === 'event' && p.day === dd.day).sort(byStart);
      if (cards.length) rows.push([dayLabel(dd.day), cards]);   // 參考圖 44：選「全部」時列標題只有「第 N 天」
    }
  } else {
    const cards = places.filter(p => p.kind === 'event' && p.day === day);
    const all = cards.filter(p => p.allDay);
    if (all.length) rows.push([L10.allDay, all]);
    for (const part of ['morning', 'afternoon', 'evening']) {
      const c = cards.filter(p => !p.allDay && partOf(p.ev) === part).sort(byStart);
      if (c.length) rows.push([L10[part], c]);
    }
  }
  return rows.map(([title, cards]) => `<div class="prow-h">${fmt(title)}</div><div class="prow"><div class="prow-in">${cards.map(cardHtml).join('')}</div></div>`).join('');
}
const byStart = (a, b) => (a.allDay ? -1 : 0) - (b.allDay ? -1 : 0) || toMin(a.ev.start || '00:00') - toMin(b.ev.start || '00:00');
const roundBtn = (inner, act) => `<div class="rbtn" data-act="${act}"${tap}>${inner}</div>`;
function pageHead(title, sub, extra) {
  return `<div class="pg-head"><div class="pg-text"><div class="pg-title">${fmt(title)}</div>${sub ? `<div class="pg-sub">${fmt(sub)}</div>` : ''}</div>
    <div class="pg-btns">${roundBtn(icon('walking'), 'walk')}${roundBtn(sv(INFO, 2), 'info')}${roundBtn(sv('<path d="M6 6l12 12M18 6 6 18"/>', 2), 'close')}</div></div>${extra || ''}`;
}
const actions = (a, b) => `<div class="pg-acts"><div class="pact primary">${a}</div>${b ? `<div class="pact">${b}</div>` : ''}</div>`;
function placePageHtml(p, { noHead } = {}) {
  const ev = p.ev, src = imgOf(ev);
  const detail = p.kind === 'marker' || p.kind === 'pending' ? null : p.allDay ? t.allDay : `${dayLabel(p.day)} · ${ev.start} – ${ev.end}`;
  const tag = ev.category ? `<div class="pg-tagrow"><span class="c-tag ${p.kind === 'marker' ? 'sw-misc' : swatchClass(ev.category)}">${categoryName(ev.category)}</span>${detail ? `<span class="pg-detail">${fmt(detail)}</span>` : ''}</div>` : '';
  const acts = p.kind === 'marker' ? actions(L10.inMaps, L10.edit) : actions(L10.openEvent, L10.inMaps);
  const photos = src ? `<div class="pg-photos"><img src="${src}" alt=""></div>` : '';
  const sub = p.kind !== 'marker' && ev.place?.name && ev.place.name !== ev.title ? ev.place.name : null;
  const addr = ev.place?.address ? `<div class="pg-sec"><div class="pg-sec-h">${S.address || ''}</div><div class="pg-sec-b">${fmt(ev.place.address)}</div></div>` : '';
  return (noHead ? `<div class="pg-head"><div class="pg-text"><div class="pg-title">${fmt(ev.title)}</div>${sub ? `<div class="pg-sub">${fmt(sub)}</div>` : ''}</div></div>` : pageHead(ev.title, sub)) + tag + acts + photos + (S.address ? addr : '');
}
function shopPageHtml(s) {
  return pageHead(s.title, s.address) + `<div class="pg-tagrow"><span class="c-status ${s.state.tone}"><i></i>${esc(s.state.label)}</span></div>` + actions(L10.inMaps) + `<div class="pg-note">${fmt(s.note)}</div>`;
}
function matePageHtml(m) {
  return pageHead(m.name, S.updated(ago(m.ageMin))) + actions(L10.inMaps) + (m.wiu ? `<div class="pg-note">${fmt(S.wiu)}</div>` : '');
}
function navPageHtml(n) {
  const dest = n.target && byId[n.target.id];
  return `<div class="nv-head">${roundBtn(sv(CHEV_L, 2), 'back')}<div class="nv-badge">${icon(MAN_ICON[n.man] || 'turnStraight')}</div>
      <div class="nv-text"><div class="nv-man">${esc(n.manText)}</div><div class="nv-dist"><b>${esc(n.dist)}</b><span>${esc(n.unit)}</span></div></div>
      ${roundBtn(sv('<path d="M6 6l12 12M18 6 6 18"/>', 2), 'end')}</div>
    <div class="nv-bar"><b style="width:${(n.progress * 100).toFixed(1)}%"></b></div>
    <div class="nv-status">${fmt(n.status)}</div><div class="nv-line"></div>
    ${dest ? placePageHtml(dest, { noHead: true }) : `<div class="pg-head"><div class="pg-text"><div class="pg-title">${fmt(n.dest)}</div></div></div>`}`;
}
function jaWrap(root) {
  if (lang !== 'ja' || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement.closest('[lang="en"], svg') || !/[0-9A-Za-z]/.test(node.data)) continue;
    const span = document.createElement('span');
    span.innerHTML = node.data.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/ ?(?:[0-9A-Za-z][0-9A-Za-z/:.' -]*[0-9A-Za-z]|[0-9A-Za-z]) ?/g, m => `<span lang="en">${m}</span>`);
    node.replaceWith(span);
  }
}
let isPoster = false;
let panelTop = LIVE_ON ? DETENT.small : DETENT.medium;
function setPanel(html, detent) {
  panelTop = DETENT[detent] ?? DETENT.medium;
  pnl.style.top = `${panelTop}px`;
  pnl.classList.toggle('small', detent === 'small');
  pnl.classList.toggle('page', !!html && !html.includes('prow'));   // 推進來的頁（地點、導航）蓋掉根頁的分段與天數晶片（參考圖 64）
  cardSlot.innerHTML = html || '';
  d.style.setProperty('--legal-bottom', `${DEV.h - panelTop + 8}px`);
  // 定位鈕：右 16、跟著面板頂緣（底邊離面板頂 16）；面板到「大」才藏
  fabSlot.innerHTML = isPoster ? '' : `<div class="fab loc" style="top:${panelTop - 16 - 52}px">${icon('locate')}</div>`;
  jaWrap(cardSlot);
  if (lang === 'en') cardSlot.querySelectorAll('.pg-detail, .nv-status').forEach(el => { el.innerHTML = el.innerHTML.replace(/ · /g, '<span class="mdot"> · </span>'); });
}
const setCard = html => setPanel(html, html ? 'medium' : (LIVE_ON ? 'small' : 'medium'));
['search', 'live'].forEach(c => jaWrap(d.querySelector('.' + c)));
jaWrap(d.querySelector('#chips')); jaWrap(d.querySelector('.lrail'));
// 導航中：狀態列 9:41 後面一枚定位箭頭、地圖分頁的 icon 掛一顆點（同 map.js）
function setNavChrome(on) {
  const sb = d.querySelector('.sb');
  d.querySelector('.tab-dot')?.remove();
  if (!sb) { if (on) d.querySelectorAll('.tab')[3].insertAdjacentHTML('beforeend', '<i class="tab-dot"></i>'); return; }   // Duo：沒有狀態列（時刻在垂直列裡，沒有定位箭頭）
  sb.classList.toggle('locating', on);
  sb.querySelector('.sb-loc')?.remove();
  if (!on) return;
  d.querySelector('.sb-time').insertAdjacentHTML('afterend', `<svg class="sb-loc" viewBox="0 0 13 13" aria-hidden="true"><path d="M1.2 5.6 11.8 1.2 7.4 11.8 6.4 6.6Z"/></svg>`);
  d.querySelectorAll('.tab')[3].insertAdjacentHTML('beforeend', '<i class="tab-dot"></i>');
}

// ── 退回底圖：MapKit 起不來（token 只認 tripezgo.com） → 畫成 map-nav.html 那一張 ──
function poster() {
  isPoster = true;
  mkEl.className = 'map';
  mkEl.style.backgroundImage = `url(img/${{ en: 'en/', ja: 'ja/', ko: 'en/' }[lang] || ''}map-nav.jpg)`;   // ko 沒有模擬器底圖，借英文那一份
  const P = S.poster;
  setPanel(navPageHtml({ man: 'straight', manText: P.man, dist: P.dist, unit: P.unit, status: P.status, dest: P.dest, progress: 0 }), 'medium');
  setNavChrome(true);
  mkEl.dataset.mode = 'poster';
  ready();
}

// ── MapKit ──
async function loadMapKit(timeoutMs = 9000) {
  ({ CONFIG } = await import('../trip/config.js'));
  // 本機預覽：tripezgo.com 以外的網域讀 tools/mapkit-dev-token.mjs 簽的那張（不進 repo；沒有就照舊退回底圖）
  if (location.hostname !== 'tripezgo.com') {
    try { const { DEV } = await import('./.mapkit-dev-token.js'); if (DEV.origin === location.origin) CONFIG = { ...CONFIG, mapkitToken: DEV.token }; } catch {}
  }
  ({ MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID } = await import('../trip/icons.js'));
  return new Promise((resolve, reject) => {
    if (!CONFIG.mapkitToken) return reject(new Error('no token'));
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const el = document.createElement('script');
    el.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    el.crossOrigin = 'anonymous';
    el.onerror = () => { clearTimeout(timer); reject(new Error('cdn')); };
    el.onload = () => {
      const mk = window.mapkit;
      mk.addEventListener('configuration-change', e => { if (e.status === 'Initialized') { clearTimeout(timer); resolve(mk); } });
      mk.addEventListener('error', e => { clearTimeout(timer); reject(new Error(e.status || 'mapkit error')); });
      mk.init({ authorizationCallback: done => done(CONFIG.mapkitToken), language: { 'zh-Hant-TW': 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko' }[lang] || 'zh-Hant' });
    };
    document.head.appendChild(el);
  });
}

let mk;
try { mk = await loadMapKit(); } catch (err) { poster(); }
if (mk) await live(mk);

async function live(mk) {
  const C = (a) => new mk.Coordinate(a[0], a[1]);
  const map = new mk.Map(mkEl, {
    showsCompass: mk.FeatureVisibility.Hidden, showsScale: mk.FeatureVisibility.Hidden,
    showsZoomControl: false, showsMapTypeControl: false, showsUserLocationControl: false,
    // 首頁外框裡帶 pan=0：可以點，但不拖不縮——拖曳與滾輪要留給頁面捲動
    isRotationEnabled: false, isScrollEnabled: interactive && params.get('pan') !== '0', isZoomEnabled: interactive && params.get('pan') !== '0',
    colorScheme: mk.Map.ColorSchemes.Light,
    // Apple 標誌與法律資訊放在分頁列上面（基準圖也是）：底邊讓出分頁列那一段
    padding: new mk.Padding(0, 0, 0, 0),
  });
  const css = getComputedStyle(document.documentElement);
  const ACCENT_INK = css.getPropertyValue('--teal300').trim() || '#1d7370';
  const WALK = '#5cc6c3';   // SemanticColors.tzWalkingRoute（淺色）
  const swatchBase = (() => { const probe = document.createElement('span'); d.appendChild(probe);
    const memo = {}; return cat => { const k = swatchClass(cat); if (!memo[k]) { probe.className = k; probe.style.color = 'var(--sw-base)'; memo[k] = getComputedStyle(probe).color; } return memo[k]; }; })();

  // ── 圖釘 ──
  const pinAnn = {};   // id → { ann, el }
  function pinFor(p, badge) {
    const grey = p.kind === 'marker' || p.cancelled;
    const el = document.createElement('div');
    el.className = `pin${grey ? ' grey' : ''}${p.cancelled ? ' cancelled' : ''}`;
    if (interactive) el.dataset.auto = p.id;   // 自動示範（autoplay.js）點得到指定那一顆
    if (!grey) el.style.color = swatchBase(p.ev.category);
    el.innerHTML = `<svg class="balloon" viewBox="0 0 28 34" aria-hidden="true"><path d="M14 34C12.6 30.9 10.4 28.4 8.6 26.9A14 14 0 1 1 19.4 26.9C17.6 28.4 15.4 30.9 14 34Z"/></svg>
      <i class="ring"></i>${glyph(p.ev.category)}${badge != null ? `<b class="badge">${badge}</b>` : ''}<span class="lbl">${fmt(p.ev.title)}</span>`;
    const ann = new mk.Annotation(C(p.at), () => el, {
      title: p.ev.title, data: { kind: 'place', id: p.id }, enabled: interactive, calloutEnabled: false,
      displayPriority: p.cancelled ? mk.Annotation.DisplayPriority.Low : mk.Annotation.DisplayPriority.Required,
      collisionMode: mk.Annotation.CollisionMode.Circle, size: { width: 28, height: 34 },
    });
    pinAnn[p.id] = { ann, el };
    return ann;
  }
  // ── 商家 ──
  const shopAnn = {};
  function shopFor(s) {
    const el = document.createElement('div');
    el.className = 'shop';
    if (interactive) el.dataset.auto = s.id;
    el.style.setProperty('--brand', LOOKS[s.brand]?.primary || '#7c6f63');
    el.innerHTML = `<div class="brick">${shopArt(s.brand)}</div><svg class="tail" viewBox="0 0 10 8"><path d="M0 0h10L5 8z"/></svg>`;
    const ann = new mk.Annotation(C([s.lat, s.lon]), () => el, {
      title: `${s.title}, ${s.state.label}`, data: { kind: 'shop', id: s.id }, enabled: interactive, calloutEnabled: false,
      displayPriority: mk.Annotation.DisplayPriority.Low, collisionMode: mk.Annotation.CollisionMode.Circle, size: { width: 36, height: 33 },
    });
    shopAnn[s.id] = { ann, el };
    return ann;
  }
  // ── 旅伴與自己 ──
  const mateAnn = {};
  for (const m of MATES) {
    const el = document.createElement('div');
    const stale = m.ageMin >= COLD_MIN;
    el.className = `mate sw-${m.colour}${stale ? ' stale' : ''}${m.wiu ? ' dashed' : ''}`;
    if (interactive) el.dataset.auto = m.id;
    el.innerHTML = `<div class="h">${esc([...m.name][0].toUpperCase())}</div><i class="pr"></i><span class="bub">${fmt(m.name)}</span>`;
    const ann = new mk.Annotation(C(m.at), () => el, {
      title: m.name, data: { kind: 'mate', id: m.id }, enabled: interactive, calloutEnabled: false, anchorOffset: new DOMPoint(0, -15),
      displayPriority: mk.Annotation.DisplayPriority.High, size: { width: 30, height: 30 },
    });
    mateAnn[m.id] = { ann, el, m };
  }
  // 朝向扇：HeadingConeView（84×84、往正上方開 60°、從半徑 18 才開始畫、tzAccentInk 0.22 往外淡出、壓在藍點底下）。
  // 方向＝這一刻面向哪裡：導航時朝目的地、宮島早上朝嚴島神社、位置共享朝小雯。
  const faceTo = { nav: byId['d2-genbaku-dome'].at, route: byId['d2-itsukushima'].at, mates: MATES[0].at }[ME_MODE];
  const coneSvg = (() => {
    const R = 42, r = 18, h = 30 * Math.PI / 180, pt = (rad, a) => `${(42 + rad * Math.sin(a)).toFixed(2)} ${(42 - rad * Math.cos(a)).toFixed(2)}`;
    return `<svg class="cone" viewBox="0 0 84 84" style="transform:rotate(${bearing(ME, faceTo).toFixed(1)}deg)" aria-hidden="true">
      <defs><radialGradient id="cone-g" gradientUnits="userSpaceOnUse" cx="42" cy="42" r="59.4">
        <stop offset="0" stop-color="${ACCENT_INK}" stop-opacity=".22"/><stop offset="${(r / R).toFixed(4)}" stop-color="${ACCENT_INK}" stop-opacity=".22"/>
        <stop offset="1" stop-color="${ACCENT_INK}" stop-opacity="0"/></radialGradient></defs>
      <path d="M${pt(r, -h)} A${r} ${r} 0 0 1 ${pt(r, h)} L${pt(R, h)} A${R} ${R} 0 0 0 ${pt(R, -h)} Z" fill="url(#cone-g)"/></svg>`;
  })();
  // 置中的標註（藍點、旅伴、箭頭、距離膠囊）：MapKit JS 預設把元素的**底邊中點**對到座標上，anchorOffset 的 y 往上為正，
  // 要讓圓心落在座標上就是往下挪半個高（-h/2）。先前寫成 +h/2，整顆浮在座標上方一個元素高——
  // 藍點離導航線的起點差 22pt、魚骨箭頭離線 8–10pt（使用者回報 2026-10-12：路線沒有從藍點出發）。
  const meAnn = new mk.Annotation(C(ME), () => { const el = document.createElement('div'); el.className = 'me'; el.innerHTML = coneSvg; return el; },
    { enabled: false, anchorOffset: new DOMPoint(0, -11), displayPriority: mk.Annotation.DisplayPriority.Required, size: { width: 22, height: 22 } });

  // ── 線：魚骨（底線＋每 40pt 一枚箭頭）。箭頭照螢幕距離擺，每次移動、縮放完重擺（同 trip/app.js 的做法） ──
  let legOverlays = [], legPills = [], walkOverlay = null, chevrons = [];
  let legLines = [];      // [{ path: [[lat,lon]…], solid }]
  let walkPath = null;    // [[lat,lon]…]
  function placeChevrons() {
    map.removeAnnotations(chevrons); chevrons = [];
    const r = mkEl.getBoundingClientRect();
    const box = { x0: r.left - 10, y0: r.top - 10, x1: r.right + 10, y1: r.bottom + 10 };
    const lines = [...(walkPath ? [] : legLines.map(l => ({ ...l, size: 8, width: 2, colour: ACCENT_INK }))),
      ...(walkPath ? [{ path: walkPath, size: 10, width: 3, colour: WALK }] : [])];
    for (const l of lines) {
      const pts = l.path.map(a => map.convertCoordinateToPointOnPage(C(a)));
      let carry = 20;   // 第一枚在 20pt
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
        if (len === 0) continue;
        let s = carry;
        for (; s < len; s += 40) {
          const x = a.x + dx * s / len, y = a.y + dy * s / len;
          if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1 || chevrons.length > 400) continue;
          const at = map.convertPointOnPageToCoordinate(new DOMPoint(x, y));
          const turn = Math.atan2(dy, dx) * 180 / Math.PI;
          const sz = l.size, w = l.width, colour = l.colour;
          chevrons.push(new mk.Annotation(at, () => {
            const c = document.createElement('div'); c.className = 'chev'; c.style.width = c.style.height = `${sz}px`;
            c.innerHTML = `<svg viewBox="0 0 10 10" style="transform:rotate(${turn.toFixed(1)}deg)"><path d="M3 1 7 5 3 9" stroke="${colour}" stroke-width="${(w * 10 / sz).toFixed(2)}"/></svg>`;
            return c;
          }, { enabled: false, anchorOffset: new DOMPoint(0, -sz / 2), displayPriority: 100, size: { width: sz, height: sz } }));
        }
        carry = s - len;
      }
    }
    map.addAnnotations(chevrons);
  }

  // ── 旅程線（步行那幾段問 Directions，其他畫直線） ──
  const legCache = new Map();
  function walkingDirections(from, to) {
    return new Promise(res => {
      new mk.Directions().route({ origin: C(from), destination: C(to), transportType: mk.Directions.Transport.Walking }, (err, r) => {
        if (err || !r?.routes?.length) return res(null);
        res(r.routes[0]);
      });
    });
  }
  const routePath = route => route.polyline.points.map(p => [p.latitude, p.longitude]);
  async function legsFor(n) {
    const out = [];
    const days = n == null ? trip.days.map(x => x.day) : [n];
    for (const dn of days) {
      const r = routes[dn];
      for (let i = 1; i < r.length; i++) {
        const a = r[i - 1], b = r[i], mode = b.ev.leg?.fromKey === a.id ? b.ev.leg.mode : null;
        if (metresBetween(a.at, b.at) < 1) continue;
        const key = `${a.id}>${b.id}`;
        if (!legCache.has(key)) {
          let leg = { path: [a.at, b.at], solid: !!mode, metres: metresBetween(a.at, b.at) };
          if (mode === 'walking') {
            const route = await walkingDirections(a.at, b.at);
            leg = route ? { path: routePath(route), solid: true, metres: route.distance } : { ...leg, solid: false };   // 問不到＝虛線
          }
          legCache.set(key, leg);
        }
        out.push(legCache.get(key));
      }
    }
    return out;
  }
  function drawLegs(legs) {
    map.removeOverlays(legOverlays); map.removeAnnotations(legPills);
    legLines = legs;
    legOverlays = legs.map(l => new mk.PolylineOverlay(l.path.map(C), {
      style: new mk.Style({ strokeColor: ACCENT_INK, strokeOpacity: 0.85, lineWidth: 3, lineCap: 'round', lineJoin: 'round', lineDash: l.solid ? [] : [6, 18] }),
    }));
    legPills = legs.map(l => {
      const txt = legDistance(l.metres); if (!txt) return null;
      // 線的一半長度那一點
      let total = 0; const seg = []; for (let i = 1; i < l.path.length; i++) { const m = metresBetween(l.path[i - 1], l.path[i]); seg.push(m); total += m; }
      let acc = 0, mid = l.path[0];
      for (let i = 0; i < seg.length; i++) { if (acc + seg[i] >= total / 2) { const f = seg[i] ? (total / 2 - acc) / seg[i] : 0; mid = [l.path[i][0] + (l.path[i + 1][0] - l.path[i][0]) * f, l.path[i][1] + (l.path[i + 1][1] - l.path[i][1]) * f]; break; } acc += seg[i]; }
      return new mk.Annotation(C(mid), () => { const p = document.createElement('div'); p.className = 'legpill'; p.textContent = txt; return p; },
        { enabled: false, anchorOffset: new DOMPoint(0, -11), displayPriority: mk.Annotation.DisplayPriority.Low, collisionMode: mk.Annotation.CollisionMode.Rectangle });
    }).filter(Boolean);
    map.addOverlays(legOverlays); map.addAnnotations(legPills);
  }

  // ── 這一天要畫哪些圖釘 ──
  let shown = [];
  function drawPins() {
    map.removeAnnotations(shown.map(id => pinAnn[id].ann));
    const all = day == null;
    const vis = places.filter(p => p.kind !== 'event' || all || p.day === day);
    shown = vis.map(p => {
      const i = p.kind === 'event' && !all ? routes[day].indexOf(p) : -1;
      const badge = p.kind !== 'event' || p.cancelled ? null : all ? p.day : i >= 0 ? i + 1 : null;
      pinFor(p, badge); return p.id;
    });
    map.addAnnotations(shown.map(id => pinAnn[id].ann));
    // 藍點壓在最上面（MapKit 照加入的先後疊）：換天重畫圖釘後把它拿起來重放一次
    if (map.annotations.includes(meAnn)) { map.removeAnnotation(meAnn); map.addAnnotation(meAnn); }
  }

  // ── 商家：看得到的地面在 3 公里以內才畫 ──
  let shopsOn = false;
  const allShopAnns = SHOPS.map(shopFor);
  function spanMetres() {
    const r = map.region, la = r.center.latitude;
    return Math.max(r.span.latitudeDelta * 111320, r.span.longitudeDelta * 111320 * Math.cos(rad(la)));
  }
  function syncShops() {
    const want = spanMetres() <= 3000;
    if (want === shopsOn) return;
    shopsOn = want;
    if (want) map.addAnnotations(allShopAnns); else map.removeAnnotations(allShopAnns.filter(a => a !== selAnn()));
  }

  // ── 選取與卡片 ──
  let sel = null;   // { kind, id }
  let nav = null;   // { target, dest, steps, total, secs, path }
  const selAnn = () => sel && ({ place: pinAnn, shop: shopAnn, mate: mateAnn }[sel.kind][sel.id]?.ann);
  function paintSelection() {
    for (const { el } of Object.values(pinAnn)) el.classList.remove('sel');
    for (const { el } of Object.values(shopAnn)) el.classList.remove('sel');
    for (const { el } of Object.values(mateAnn)) el.classList.remove('sel');
    if (sel) ({ place: pinAnn, shop: shopAnn, mate: mateAnn }[sel.kind][sel.id]?.el.classList.add('sel'));
  }
  function showCard() {
    paintSelection();
    if (sel?.kind === 'place') setPanel(placePageHtml(byId[sel.id]), 'medium');
    else if (sel?.kind === 'shop') setPanel(shopPageHtml(SHOPS.find(s => s.id === sel.id)), 'medium');
    else if (sel?.kind === 'mate') setPanel(matePageHtml(MATES.find(m => m.id === sel.id)), 'medium');
    else if (nav) setPanel(navPageHtml({ ...nav.card, target: nav.target }), 'medium');
    else setPanel(rowsHtml(), LIVE_ON ? 'small' : 'medium');
  }

  // ── 步行導航（WalkingNavigationUseCase.linking ＋ progress、MapViewController.card(from:)） ──
  function linking(route) {
    const segs = route.steps.map(s => ({ path: (s.path || []).flat().map(c => [c.latitude, c.longitude]), metres: s.distance }))
      .filter(s => s.path.length >= 2 && s.metres > 0);
    return segs.map((s, i) => {
      if (i + 1 >= segs.length) return { ...s, man: 'arrive' };
      const last = s.path[s.path.length - 1];
      const from = [...s.path].reverse().find(p => metresBetween(p, last) > 0.5);
      const next = segs[i + 1].path, first = next[0], to = next.find(p => metresBetween(first, p) > 0.5);
      if (!from || !to) return { ...s, man: 'straight' };
      let delta = (bearing(first, to) - bearing(from, last)) % 360;
      if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
      const mag = Math.abs(delta);
      const man = mag < 20 ? 'straight' : mag >= 150 ? 'uTurn' : mag < 50 ? (delta < 0 ? 'slightLeft' : 'slightRight') : (delta < 0 ? 'left' : 'right');
      return { ...s, man };
    });
  }
  function navCard(n, here) {
    // progress：離「這裡」最近的那一截，剩到那一步結尾多遠、整段還剩多遠
    let best = null;
    n.steps.forEach((st, si) => {
      const lens = []; let geo = 0;
      for (let i = 1; i < st.path.length; i++) { const l = metresBetween(st.path[i - 1], st.path[i]); lens.push(l); geo += l; }
      if (!geo) return;
      lens.forEach((len, k) => {
        const a = st.path[k], b = st.path[k + 1], la = rad(a[0]);
        const v = p => [rad(p[1] - a[1]) * Math.cos(la) * R, rad(p[0] - a[0]) * R];
        const e = v(b), h = v(here), f = len ? Math.min(Math.max((h[0] * e[0] + h[1] * e[1]) / (len * len), 0), 1) : 0;
        const dev = Math.hypot(h[0] - e[0] * f, h[1] - e[1] * f);
        if (best && dev >= best.dev) return;
        const rest = (len * (1 - f) + lens.slice(k + 1).reduce((x, y) => x + y, 0)) * (st.metres / geo);
        best = { si, dev, rest };
      });
    });
    const later = n.steps.slice(best.si + 1).reduce((x, s) => x + s.metres, 0);
    const remaining = best.rest + later, man = n.steps[best.si].man;
    const toMan = distParts(best.rest), left = distParts(remaining);
    const isTurn = !['straight', 'arrive'].includes(man);
    const mins = Math.max(1, Math.round(n.secs * (remaining / n.total) / 60));
    return { man, manText: S.man[man], dist: numFmt(toMan.v, toMan.coarse), unit: isTurn ? S.then(toMan.u) : toMan.u,
      status: S.status(`${numFmt(left.v, left.coarse)} ${left.u}`, duration(mins)), dest: S.headingTo(n.dest),
      progress: Math.min(Math.max((n.total - remaining) / n.total, 0), 1) };
  }
  function fitPadding() {
    // walkingRouteFitPadding 48；上面讓過日期列＋搜尋＋藥丸，下面讓過卡片
    // 1.10.0：上面讓過搜尋列＋圖層晶片＋分享藥丸，下面讓過面板頂緣（面板高度由 setPanel 定）
    return new mk.Padding(G.searchTop + (panelTop < DEV.h * .6 && !DEV.bar ? 56 : 128 + 14), 20 + 30 + G.right, 16, 20);   // iPhone 面板到中：地圖只剩上面一條，晶片列也讓給圖釘（晶片列底下是透明的）；Duo 橫的：照樣讓過晶片列
  }
  async function startNav(target) {
    const route = await walkingDirections(ME, target.at);
    if (!route) return false;   // App：「沒有步行路線」那張紙；這裡就不開始
    // 線的兩端接到藍點與目的地上：MapKit 給的 polyline 從「吸附到路上的那一點」開始、停在路邊，
    // 跟藍點／圖釘差幾十公尺，畫出來像是從空中某一點出發（使用者回報 2026-10-12）
    const path = routePath(route);
    if (metresBetween(path[0], ME) > 0.5) path.unshift(ME);
    if (metresBetween(path[path.length - 1], target.at) > 0.5) path.push(target.at);
    nav = { target, dest: target.name, steps: linking(route), total: route.distance, secs: route.expectedTravelTime, path };
    nav.card = navCard(nav, ME);
    walkPath = nav.path;
    if (walkOverlay) map.removeOverlay(walkOverlay);
    walkOverlay = new mk.PolylineOverlay(walkPath.map(C), { style: new mk.Style({ strokeColor: WALK, strokeOpacity: 0.85, lineWidth: 6, lineCap: 'round', lineJoin: 'round' }) });
    drawLegs([]);   // 導航進行中旅程線整組不畫（MAP-NAV-HIDE-LEGS）
    map.addOverlay(walkOverlay);
    sel = null; showCard(); setNavChrome(true);
    if (interactive && ready.done) {
      // 使用者按步行鈕開始的導航：照 App 把整條線框進來（藍點與目的地兩端都看得到），不再近一級
      // 上面多讓 40：目的地那顆圖釘是從座標往上長的（磚＋尖 33），只讓座標的話整顆會躲到「分享我的位置」藥丸底下
      const pd = fitPadding();
      fitItems([walkOverlay, meAnn], { padding: pd }, true);   // 1.10.0：框進搜尋列以下、面板以上那一條
    } else {
      // 載入時那一趟：首頁近一級，以藍點為不動點（自己一定在畫面裡），再往左挪開右邊那一列浮動鈕
      frame([walkOverlay, meAnn], { padding: fitPadding() }, [ME], false);
      if (ZOOM_IN) { const mr = mkEl.getBoundingClientRect(), at = map.convertCoordinateToPointOnPage(C(ME)); centerAt(ME, at.x - mr.left > DEV.w - 142 ? DEV.w - 152 : at.x - mr.left, at.y - mr.top); }
    }
    placeChevrons();
    return true;
  }
  async function endNav() {
    nav = null; walkPath = null;
    if (walkOverlay) map.removeOverlay(walkOverlay); walkOverlay = null;
    setNavChrome(false); showCard();
    drawLegs(await legsFor(day)); placeChevrons();
  }

  // ── 首頁外框（pan=0）再近一級：照 showItems 取好的景，以內容的中心為不動點把跨度減半（MapKit 一級＝兩倍）。
  //    先不帶動畫算出終點，要動畫才退回原處再 setRegionAnimated；同一個 task 裡改回去，畫面不會閃。
  //    截圖工具不帶 pan=0，取景照舊。
  const ZOOM_IN = interactive && params.get('pan') === '0';
  // 1.10.0：面板蓋住下半——自己算區域：把這些點框進「搜尋列以下、面板以上」那一條（map.padding 不動，Apple 標誌與法律資訊另由 CSS 跟著面板）
  function fitItems(items, opts, animate) {
    const pts = items.flatMap(it => it.points ? it.points : it.coordinate ? [it.coordinate] : []);
    if (!pts.length) return;
    const lats = pts.map(c => c.latitude), lons = pts.map(c => c.longitude);
    const p = opts.padding, W = DEV.w, H = DEV.h;
    const top = p.top + 34, bottom = DEV.h - panelTop + p.bottom, left = p.left + 16, right = p.right + 16;   // 圖釘從座標往上長 34，上面多讓 40
    const bandH = Math.max(H - top - bottom, 60), bandW = Math.max(W - left - right, 60);
    const cLat = (Math.min(...lats) + Math.max(...lats)) / 2, cLon = (Math.min(...lons) + Math.max(...lons)) / 2, cos = Math.cos(rad(cLat));
    const minSpan = opts.minimumSpan ? opts.minimumSpan.latitudeDelta : 0.002;
    const latSpan = Math.max((Math.max(...lats) - Math.min(...lats)) * H / bandH, (Math.max(...lons) - Math.min(...lons)) * cos * H / bandW, minSpan * H / bandH);
    const lonSpan = latSpan * W / H / cos;
    const bandCY = top + bandH / 2, bandCX = left + bandW / 2;
    const center = new mk.Coordinate(cLat - (H / 2 - bandCY) / H * latSpan, cLon + (W / 2 - bandCX) / W * lonSpan);
    const r = new mk.CoordinateRegion(center, new mk.CoordinateSpan(latSpan, lonSpan));
    if (animate) map.setRegionAnimated(r, true); else map.region = r;
  }
  function frame(items, opts, focus, animate) {
    if (!ZOOM_IN) return fitItems(items, opts, animate);
    const before = map.region;
    fitItems(items, opts, false);
    const r = map.region, c = r.center;
    const lats = focus.map(a => a[0]), lons = focus.map(a => a[1]);
    const f = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lons) + Math.max(...lons)) / 2];
    const target = new mk.CoordinateRegion(new mk.Coordinate(f[0] + (c.latitude - f[0]) / 2, f[1] + (c.longitude - f[1]) / 2),
      new mk.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2));
    if (animate) { map.region = before; map.setRegionAnimated(target, true); } else map.region = target;
  }

  // 把一點移到地圖可見區的正中偏上（卡片打開也蓋不到）：首頁位置共享那一支逐一看旅伴時用
  function centerOn(at, animate) { centerAt(at, mkEl.getBoundingClientRect().width / 2, 300, animate); }
  // 把 at 移到地圖區裡 (x, y) 那一點（地圖區左上為原點），跨度不變
  function centerAt(at, x, y, animate) {
    const r = map.region, mr = mkEl.getBoundingClientRect();
    const want = map.convertPointOnPageToCoordinate(new DOMPoint(mr.left + x, mr.top + y));
    const t = new mk.CoordinateRegion(new mk.Coordinate(r.center.latitude + at[0] - want.latitude, r.center.longitude + at[1] - want.longitude), r.span);
    if (animate) map.setRegionAnimated(t, true); else map.region = t;
  }
  // focus=mates：鏡頭框旅伴與自己，拉近看。近一級之後三位擺不進同一幀（相距約 650 公尺），從第一位（小雯）開始
  function frameMates() {
    frame([...Object.values(mateAnn).map(x => x.ann), meAnn], { padding: new mk.Padding(175, 36 + (DEV.bar || 0), 130, 36), minimumSpan: new mk.CoordinateSpan(0.0025, 0.0025) }, MATES.map(m => m.at), false);
    if (ZOOM_IN) centerOn(MATES[0].at, false);
  }

  // ── 鏡頭：這一天最大的一串相近站（相鄰 3 公里內）框進來 ──
  function frameDay() {
    const seq = day == null ? trip.days.flatMap(x => routes[x.day]) : routes[day];
    let best = [], cur = [];
    for (const p of seq) { if (cur.length && metresBetween(cur[cur.length - 1].at, p.at) > 3000) { if (cur.length > best.length) best = cur; cur = []; } cur.push(p); }
    if (cur.length > best.length) best = cur;
    const anns = best.map(p => pinAnn[p.id]?.ann).filter(Boolean);
    if (anns.length) frame(anns, { padding: fitPadding(), minimumSpan: new mk.CoordinateSpan(0.004, 0.004) }, day === todayNo && ME_MODE === 'route' ? [ME] : best.map(p => p.at), interactive && ready.done);
  }

  // ── 初始：第 2 天、旅伴、自己、導航到嚴島神社 ──
  drawPins();
  showCard();   // 1.10.0：面板先就位（根頁＝這一天的照片卡），取景才知道下面要讓多少
  map.addAnnotations([...Object.values(mateAnn).map(x => x.ann), meAnn]);
  // nav=0：不導航，只看這一天的路程標記（首頁 05 的第二支手機）
  const target = byId['d2-genbaku-dome'];
  const ok = params.get('nav') === '0' ? false : await startNav({ kind: 'place', id: target.id, at: target.at, name: target.ev.title });
  if (!ok) { drawLegs(await legsFor(day)); if (params.get('focus') !== 'mates') frameDay(); }
  // focus=mates：首頁 06「位置共享」——鏡頭只框旅伴與自己，拉近看，不開任何卡片
  if (params.get('focus') === 'mates') frameMates();
  map.addEventListener('region-change-end', () => { syncShops(); placeChevrons(); });
  // 第一次取景完成才把地圖露出來：不讓人看到 MapKit 預設的世界地圖再跳到目標
  requestAnimationFrame(() => setTimeout(() => mkEl.dataset.framed = '1', 350));
  syncShops(); placeChevrons();
  mkEl.dataset.mode = 'live';
  // sel=<行程 key>：一打開就點了那一顆圖釘（面板換成那一則的地點頁；官網首頁主圖 map-place 用）
  if (params.get('sel') && byId[params.get('sel')]) {
    const p = byId[params.get('sel')]; sel = { kind: 'place', id: p.id };
    const a = selAnn(); if (a) a.selected = true; showCard();
    centerAt(p.at, DEV.w / 2 - G.right / 2, (G.searchTop + 150 + panelTop) / 2, false);
  }
  // 底圖圖磚沒有「畫完了」的事件：等一下再交給截圖工具
  setTimeout(() => { ready.done = true; ready(); }, 2500);

  if (!interactive) return;

  // ── 互動 ──
  map.addEventListener('select', e => {
    const data = e.annotation?.data; if (!data?.kind) return;
    sel = { kind: data.kind, id: data.id }; showCard();
  });
  const closeCard = () => { const a = selAnn(); sel = null; if (a) a.selected = false; if (!shopsOn) syncShops(); showCard(); };
  cardSlot.addEventListener('click', async e => {
    const pc = e.target.closest('.pcard');
    if (pc && !e.target.closest('[data-act]')) { const p = byId[pc.dataset.id]; if (p) { sel = { kind: 'place', id: p.id }; const a = selAnn(); if (a) a.selected = true; showCard(); map.setCenterAnimated(C(p.at), true); } return; }
    const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
    if (act === 'close' || act === 'back') closeCard();
    else if (act === 'end') confirmEnd();
    else if (act === 'dest' && nav) {
      const tg = nav.target; sel = { kind: tg.kind, id: tg.id };
      const a = selAnn(); if (a) a.selected = true; showCard();
    } else if (act === 'walk' && sel) {
      const s = sel;
      const at = s.kind === 'place' ? byId[s.id].at : s.kind === 'shop' ? (x => [x.lat, x.lon])(SHOPS.find(x => x.id === s.id)) : MATES.find(x => x.id === s.id).at;
      const name = s.kind === 'place' ? byId[s.id].ev.title : s.kind === 'shop' ? SHOPS.find(x => x.id === s.id).name : MATES.find(x => x.id === s.id).name;
      const a = selAnn(); if (a) a.selected = false;
      if (s.kind === 'place') { const p = byId[s.id]; if (p.day != null && day != null && p.day !== day) { /* 走到別天的點：照樣導航，日期列不動 */ } }
      await startNav({ ...s, at, name });
    }
  });
  function confirmEnd() {
    d.insertAdjacentHTML('beforeend', `<div class="alert-scrim" id="alert"><div class="alert" role="alertdialog">
      <div class="alert-b"><div class="alert-t">${S.endTitle}</div><div class="alert-m">${S.endMsg}</div></div>
      <div class="alert-row"><button class="preferred" data-a="cancel"${tap}>${S.cancel}</button><button class="destructive" data-a="end"${tap}>${S.endConfirm}</button></div></div></div>`);
    document.getElementById('alert').addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return;
      document.getElementById('alert').remove();
      if (a === 'end') endNav();
    });
  }
  // 首頁自動示範（autoplay.js）一輪播完在原地從頭再來（stories.js 的 INPLACE）：回到載入時那一幀——
  // 收卡片、關警示、回到原本那一天、導航回到初始那一趟（nav=0 就關掉）、鏡頭照初始取景，全部不帶動畫。
  const chipsScroll0 = document.getElementById('chips').scrollLeft;
  const home0 = map.region;   // 載入時的取景（一輪播完先動畫回到這裡，再 reset）
  const settle = () => new Promise(r => setTimeout(r, 900));
  window.__auto = {
    home() { map.setRegionAnimated(home0, true); return settle(); },
    mate0() { centerOn(MATES[0].at, true); return settle(); },
    mate1() { centerOn(MATES[1].at, true); return settle(); },
    mate2() { centerOn(MATES[2].at, true); return settle(); },
    async reset() {
      document.getElementById('alert')?.remove();
      const a = selAnn(); if (a) a.selected = false; sel = null;
      const wasDone = ready.done; ready.done = false;   // startNav／frameDay 只在 ready.done 時帶動畫
      try {
        const day0 = params.get('nav') === '0' ? todayNo : NAV_DAY;
        if (day !== day0) { day = day0; document.getElementById('chips').innerHTML = chipHtml(); jaWrap(document.getElementById('chips')); drawPins(); }
        document.getElementById('chips').scrollLeft = chipsScroll0;
        if (nav) { nav = null; walkPath = null; if (walkOverlay) map.removeOverlay(walkOverlay); walkOverlay = null; setNavChrome(false); }
        const ok = params.get('nav') === '0' ? false : await startNav({ kind: 'place', id: target.id, at: target.at, name: target.ev.title });
        // 載入時不導航的那兩支沒畫過卡片也沒畫浮動鈕（初始那一幀就是這樣），照樣清空；導航那一支 startNav 已經畫好導航卡
        if (!ok) { showCard(); }
        if (!ok) { drawLegs(await legsFor(day)); if (params.get('focus') !== 'mates') frameDay(); }
        if (params.get('focus') === 'mates') frameMates();
        syncShops(); placeChevrons();
      } finally { ready.done = wasDone; }
    },
  };
  document.getElementById('chips').addEventListener('click', async e => {
    const c = e.target.closest('[data-day]'); if (!c) return;
    const n = c.dataset.day ? +c.dataset.day : null;
    if (n === day) return;
    day = n;
    document.getElementById('chips').innerHTML = chipHtml(); jaWrap(document.getElementById('chips'));
    const a = selAnn(); if (a) a.selected = false; sel = null;
    // 離開導航那一天就結束導航
    if (nav && (nav.target.kind !== 'place' || byId[nav.target.id]?.day !== day)) { nav = null; walkPath = null; if (walkOverlay) map.removeOverlay(walkOverlay); walkOverlay = null; setNavChrome(false); }
    showCard();
    drawPins();
    frameDay();
    drawLegs(nav ? [] : await legsFor(day)); placeChevrons();
  });
}

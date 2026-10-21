// 從別的 App 分享進來（share-ig.html、share-gmap.html 共用）：
//   ② iOS 系統分享選單 → ③ TripEZGo 分享延伸（1.3.0 分享紙 v2）→ ④ 存好了（兩秒自己關上）→ 回到 ①。
// ① 底下那個別人的 App 由各頁自己畫，交一個 `.host-app` 圖層進來，上面要有一顆 [data-act="share"]。
//
// ② 系統分享選單：iOS 26 的系統元件，照記憶中的版面畫——沒有 ref/ 可量。TripEZGo 那一格用 img/app-icon-180.png。
//    字是 iOS 自己的字，照各語系的系統用詞寫。
//
// ③ 分享延伸：照 App（/Users/zhgchgli/Projects/tripezgo/App/iOS，main 1.3.0）
//   - 畫面：Modules/ShareForm/.../ShareFormViewController.swift（buildForm 的順序：來源列、分段、四段各自的欄、存進哪一趟）；
//     元件與數字：Modules/UI/.../Components/Share/ShareFormParts.swift（ShareFormMetrics）、TypeTitleRow.swift、
//     EventFormControls.swift（ChipControl、FormTextField、MenuPickerButton）、ShareGroup／ShareRow／ShareTagRow、ShareMetrics。
//   - 右上「儲存」：SheetNavTextAction——一行 accent-ink 的字，不是 iOS 26 `.done` 的藍色膠囊（aca36629c，1.3.0 走查 20b／21a）。
//   - 值：Modules/ShareForm/.../ShareFormViewModel.swift——
//       分段預設「行程」（memory.lastTarget ?? .event；這支 iframe 裡沒有上一次）；
//       讀網址時：來源列「正在解析網址資訊」、標題與描述畫骨架、圖片那一格骨架、儲存停用（canSave: !isReading）；
//       類型先亮 EventType.newEventName（sight），讀完照標題預選（ADR-0031）：模型 ≥ 0.96 → 地點類別 → 其他；
//         標記兩層都沒答案就不選（虛線「類型」）。「依地點」只在類型是照地點帶的時候寫（titleFollowsPlaceType）。
//       suggestedTitle：行程／標記先拿地點名、再拿 og 標題；筆記先 og 標題、再地點名；購物先品名、再 og 標題。
//         標題正好是地點名（不是 og 標題）時不掛「自網頁」。
//       suggestedDescription：og 描述＋空一行＋網址；標記只有 og 描述、不附網址。
//       地點：行程「不指定地點 · 網址裡沒有座標…」（讀完）／「不指定地點」（讀之前）；有座標畫地點卡＋「自網址」，× 拿掉之後類型當場重問（60f9d5ca5）。
//       標記沒有地點：「選擇地點 · 用「…」搜尋」紅框＋「必選」＋一行說明，不能存。
//       筆記：標籤列固定一顆 share；私人筆記開關只在共編的旅程畫（範例旅程沒共編，不畫）。
//       時間：待排（預設，哪一天不指定）／全日／時間（第 1 天 09:00–10:00，defaultStart；範例旅程沒在進行中 → 第 1 天）。
//   - 地圖連結（Google 地圖、Apple 地圖）不帶 og 圖片與 og 描述（db19837d6，ReadSharedLinkUseCase.withoutImageAndDescription）。
//   - 字：Scripts/i18n/maps/ShareForm.json（shareform.*）、TripEZGoShare.json（share.*）、Domain.json（類型、購物分類、時區城市）。
//
// ④ 存好了：TripEZGoShare/ShareResultViewController.swift——導覽列收起、綠勾、share.done.<種類>，內文是 share.text.quoted
//    包住的名字＋換行＋旅程名（ShareViewController 的 summary：[圖片沒存進去?, tripName]）；successLinger 兩秒自己關上，
//    completeRequest 連系統分享選單一起收掉。
import { fmt, lang, interactive, params, swatchClass, categoryName } from './chrome.js';
import { IS } from './inspiration-strings.js';

const LANG = { 'zh-Hant-TW': 'zh', en: 'en', ja: 'ja', ko: 'ko' }[lang] || 'zh';

// ── App 字串（ShareForm.json／TripEZGoShare.json／Domain.json） ──
export const F = {
  zh: {
    titleEvent: '新增行程', titleShopping: '存到購物清單', titleNote: '存到筆記', titleMarker: '新增地圖標記',
    cancel: '取消', save: '儲存', kinds: ['行程', '購物', '筆記', '標記'],
    info: '資訊', time: '時間', place: '地點', desc: '描述', attach: '附件', trip: '存進哪一趟', tripRow: '旅程',
    itemName: '商品名稱', cats: '分類', itemImage: '商品圖片', price: '參考價格',
    priceHint: '網頁標了價格與幣別才帶；沒標就空著，幣別用這一趟在換的那一種。',
    title: '標題', content: '內容', filing: '歸檔', tag: '標籤',
    fromPage: '自網頁', fromPlace: '依地點', fromLink: '自網址', required: '必填', requiredChoice: '必選',
    reading: '正在解析網址資訊',
    modes: ['時間', '全日', '待排'], dayCaption: '哪一天', start: '開始', end: '結束', unspecified: '不指定', day: n => `第 ${n} 天`,
    pendingHint: '還沒排時間。指定了哪一天，它會出現在那一天的最上面；不指定就留在「待排行程」。',
    allDayHintUndated: '只能選這一趟的日子。',
    noPlace: '不指定地點 · 網址裡沒有座標，要加地點回 App 再選', noPlaceShort: '不指定地點',
    pickLead: '選擇地點 · 用「', pickTail: '」搜尋', pick: '選擇地點',
    needsPlace: '標記要有地點才能儲存。網址裡沒有座標，選一個地點吧。',
    titlePh: '標題', descPh: '描述', itemPh: '沒有名字的商品', typeNone: '類型',
    imageRemoved: '不存網頁圖片', restore: '復原',
    doneEvent: '已加進行程', doneShopping: '已加進購物清單', doneNote: '已存到筆記', doneMarker: '已加到地圖',
    quoted: s => `「${s}」`, zone: '東京',
    shopCats: ['藥妝', '衣服', '紀念品', '食品', '精品', '3C 電器', '雜貨', '其他'],
  },
  en: {
    titleEvent: 'Add Event', titleShopping: 'Save to Shopping', titleNote: 'Save to Notes', titleMarker: 'Add Map Marker',
    cancel: 'Cancel', save: 'Save', kinds: ['Event', 'Shopping', 'Note', 'Marker'],
    info: 'Info', time: 'Time', place: 'Place', desc: 'Notes', attach: 'Attachment', trip: 'Save to trip', tripRow: 'Trip',
    itemName: 'Item name', cats: 'Categories', itemImage: 'Item photo', price: 'Reference price',
    priceHint: "Filled in only when the page states a price and currency; otherwise left empty, in this trip's exchange currency.",
    title: 'Title', content: 'Content', filing: 'Filing', tag: 'Tag',
    fromPage: 'From page', fromPlace: 'From place', fromLink: 'From link', required: 'Required', requiredChoice: 'Required',
    reading: 'Reading the link…',
    modes: ['Time', 'All-day', 'Unscheduled'], dayCaption: 'Day', start: 'Starts', end: 'Ends', unspecified: 'Not specified', day: n => `Day ${n}`,
    pendingHint: 'No time yet. Pick a day and it shows at the top of that day; otherwise it stays in Unscheduled.',
    allDayHintUndated: "Only this trip's days.",
    noPlace: 'No place · The link has no coordinates; add a place in the app.', noPlaceShort: 'No place',
    pickLead: 'Choose a place · search “', pickTail: '”', pick: 'Choose a place',
    needsPlace: 'A marker needs a place to save. The link has no coordinates — choose one.',
    titlePh: 'Title', descPh: 'Notes', itemPh: 'Unnamed item', typeNone: 'Type',
    imageRemoved: 'Page image not saved', restore: 'Undo',
    doneEvent: 'Added to your plans', doneShopping: 'Added to your shopping list', doneNote: 'Saved to Notes', doneMarker: 'Added to the map',
    quoted: s => `“${s}”`, zone: 'Tokyo',
    shopCats: ['Drugstore', 'Clothing', 'Souvenirs', 'Food', 'Luxury', 'Electronics', 'Daily Goods', 'Other'],
  },
  ja: {
    titleEvent: '予定を追加', titleShopping: '買い物リストに保存', titleNote: 'メモに保存', titleMarker: 'マップにマーカーを追加',
    cancel: 'キャンセル', save: '保存', kinds: ['予定', '買い物', 'メモ', 'マーカー'],
    info: '情報', time: '時間', place: '場所', desc: 'メモ', attach: '添付ファイル', trip: '保存先の旅程', tripRow: '旅程',
    itemName: '商品名', cats: 'カテゴリ', itemImage: '商品画像', price: '参考価格',
    priceHint: 'ページに価格と通貨があるときだけ入ります。なければ空欄で、通貨はこの旅程で両替する通貨です。',
    title: 'タイトル', content: '内容', filing: '整理', tag: 'タグ',
    fromPage: 'ページから', fromPlace: '場所から', fromLink: 'リンクから', required: '必須', requiredChoice: '必須',
    reading: 'URL の情報を読み込み中',
    modes: ['時間', '終日', '未定'], dayCaption: '日', start: '開始', end: '終了', unspecified: '指定しない', day: n => `${n}日目`,
    pendingHint: '時間は未定です。日を指定するとその日のいちばん上に表示され、指定しなければ「未定の予定」に残ります。',
    allDayHintUndated: 'この旅程の日だけ選べます。',
    noPlace: '場所なし · リンクに座標がありません。場所はアプリで追加してください。', noPlaceShort: '場所なし',
    pickLead: '場所を選ぶ · 「', pickTail: '」で検索', pick: '場所を選ぶ',
    needsPlace: 'マーカーには場所が必要です。リンクに座標がないので、場所を選んでください。',
    titlePh: 'タイトル', descPh: 'メモ', itemPh: '名前のない商品', typeNone: '種類',
    imageRemoved: 'ページの画像は保存しません', restore: '元に戻す',
    doneEvent: '予定に追加しました', doneShopping: '買い物リストに追加しました', doneNote: 'メモに保存しました', doneMarker: 'マップに追加しました',
    quoted: s => `「${s}」`, zone: '東京',
    shopCats: ['ドラッグストア', '衣類', 'お土産', '食品', 'ブランド品', '家電・電子機器', '雑貨', 'その他'],
  },
  // ko：ShareForm.json／TripEZGoShare.json／Domain.json 的 ko 欄。zone（時刻列右邊的城市）字串表只有
  // domain.zone.city.tokyo「도쿄·서울·오키나와」，取第一段
  ko: {
    titleEvent: '일정 추가', titleShopping: '쇼핑 목록에 저장', titleNote: '메모에 저장', titleMarker: '지도에 마커 추가',
    cancel: '취소', save: '저장', kinds: ['일정', '쇼핑', '메모', '마커'],
    info: '정보', time: '시간', place: '장소', desc: '설명', attach: '첨부 파일', trip: '저장할 여행', tripRow: '여행',
    itemName: '상품명', cats: '카테고리', itemImage: '상품 이미지', price: '참고 가격',
    priceHint: '페이지에 가격과 통화가 있을 때만 채워집니다. 없으면 비워 두고, 통화는 이 여행에서 환전하는 통화입니다.',
    title: '제목', content: '내용', filing: '정리', tag: '태그',
    fromPage: '페이지에서', fromPlace: '장소 기준', fromLink: '링크에서', required: '필수', requiredChoice: '필수',
    reading: 'URL 정보를 확인하는 중',
    modes: ['시간', '종일', '미정'], dayCaption: '날짜', start: '시작', end: '종료', unspecified: '지정 안 함', day: n => `${n}일차`,
    pendingHint: '아직 시간이 없어요. 날짜를 정하면 그날 맨 위에 보이고, 정하지 않으면 「미정 일정」에 남아요.',
    allDayHintUndated: '이 여행의 날만 고를 수 있어요.',
    noPlace: '장소 없음 · 링크에 좌표가 없어요. 장소는 앱에서 추가하세요.', noPlaceShort: '장소 없음',
    pickLead: '장소 선택 · “', pickTail: '” 검색', pick: '장소 선택',
    needsPlace: '마커는 장소가 있어야 저장돼요. 링크에 좌표가 없으니 장소를 골라 주세요.',
    titlePh: '제목', descPh: '설명', itemPh: '이름 없는 상품', typeNone: '유형',
    imageRemoved: '페이지 이미지 저장 안 함', restore: '되돌리기',
    doneEvent: '일정에 추가했습니다', doneShopping: '쇼핑 목록에 추가했습니다', doneNote: '메모에 저장했습니다', doneMarker: '지도에 추가했습니다',
    quoted: s => `‘${s}’`, zone: '도쿄',
    shopCats: ['드러그스토어', '의류', '기념품', '식품', '명품', '전자제품', '생활용품', '기타'],
  },
}[LANG];

// iOS 系統分享選單的字（系統用詞）
const SYS = {
  zh: { people: ['阿哲', '小雯', '媽媽', '旅行群組'], airdrop: 'AirDrop', messages: '訊息', mail: '郵件', notes: '備忘錄',
    copy: '拷貝', readingList: '加入閱讀列表', quickNote: '加入快速備忘錄', editActions: '編輯動作⋯' },
  en: { people: ['Alex', 'Mia', 'Mom', 'Trip crew'], airdrop: 'AirDrop', messages: 'Messages', mail: 'Mail', notes: 'Notes',
    copy: 'Copy', readingList: 'Add to Reading List', quickNote: 'Add to Quick Note', editActions: 'Edit Actions…' },
  ja: { people: ['拓海', '美咲', '母', '旅行グループ'], airdrop: 'AirDrop', messages: 'メッセージ', mail: 'メール', notes: 'メモ',
    copy: 'コピー', readingList: 'リーディングリストに追加', quickNote: 'クイックメモに追加', editActions: 'アクションを編集…' },
  ko: { people: ['현우', '지우', '엄마', '여행 모임'], airdrop: 'AirDrop', messages: '메시지', mail: '메일', notes: '메모',
    copy: '복사', readingList: '읽기 목록에 추가', quickNote: '빠른 메모에 추가', editActions: '동작 편집…' },
}[LANG];

// ── 圖示 ──
// App 的 DesignIcon（check／chevronRight／photo／clock／lock／close／search／picker）
const DI = {
  check: '<path d="M5 13l5 5 9-11"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3 1.8"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  picker: '<path d="m8 10 4-4 4 4M8 14l4 4 4-4"/>',
};
export const di = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${DI[n]}</svg>`;
// 系統選單的線條圖示（系統介面，不是 App 的 DesignIcon）
const G = {
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  glasses: '<circle cx="6.5" cy="14.5" r="3.5"/><circle cx="17.5" cy="14.5" r="3.5"/><path d="M10 14.5c1.3-1 2.7-1 4 0M3 14l1.5-6h2M21 14l-1.5-6h-2"/>',
  qnote: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',
};
const g = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${G[n]}</svg>`;
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// 類型圖示：App 的 EventTypeIcons（Maki），網站 trip/icons.js 是同一份的產物
const { MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID } = await import('../trip/icons.js');
const typeGlyph = key => `<svg viewBox="0 0 15 15" aria-hidden="true"><path fill-rule="evenodd" d="${MAKI[MAKI_OF_TYPE[key] || DEFAULT_ICON_ID] || MAKI.marker}"/></svg>`;

// 選中的類型晶片的底：EventTypeSwatch.chipFill＝類型色 (16% + 4%) 疊 surface（OKLCh.mix，同 chrome.js 那一份的移植）
const RECIPES = {
  eat: [0.452, 0.086, 30], eatLight: [0.510, 0.076, 30], shop: [0.566, 0.079, 74], shopMarket: [0.624, 0.070, 74],
  see: [0.498, 0.058, 150], seeNature: [0.556, 0.051, 150], stay: [0.428, 0.074, 264], stayLodge: [0.486, 0.065, 264],
  move: [0.524, 0.062, 322], moveLocal: [0.582, 0.055, 322], misc: [0.545, 0.022, 65],
};
const lin = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const gam = v => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
function hexToOklch(hex) {
  const [r, gg, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * gg + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * gg + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * gg + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const c = Math.hypot(A, B);
  return { l: L, c, h: c < 1e-6 ? 0 : Math.atan2(B, A) };
}
function oklchToCss({ l, c, h }) {
  const A = c * Math.cos(h), B = c * Math.sin(h);
  const L = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const M = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const S = (l - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  const rgb = [4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S, -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S].map(v => Math.round(Math.min(1, Math.max(0, gam(v))) * 255));
  return `rgb(${rgb.join(',')})`;
}
function mix(a, w, b) {
  let h;
  if (a.c < 1e-6 && b.c < 1e-6) h = 0; else if (a.c < 1e-6) h = b.h; else if (b.c < 1e-6) h = a.h;
  else { let dd = b.h - a.h; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; h = a.h + dd * (1 - w); }
  return { l: a.l * w + b.l * (1 - w), c: a.c * w + b.c * (1 - w), h };
}
const RECIPES_DARK = {   // EventTypeSwatch.dark
  eat: [0.716, 0.057, 30], eatLight: [0.764, 0.050, 30], shop: [0.815, 0.052, 74], shopMarket: [0.863, 0.046, 74],
  see: [0.756, 0.038, 150], seeNature: [0.804, 0.034, 150], stay: [0.695, 0.049, 264], stayLodge: [0.743, 0.043, 264],
  move: [0.779, 0.041, 322], moveLocal: [0.827, 0.036, 322], misc: [0.640, 0.018, 65],
};
const DARK = document.documentElement.dataset.theme === 'dark';
const SURFACE = hexToOklch(DARK ? '#221c17' : '#fbf8f4');
export const chipFill = key => {
  const fam = swatchClass(key).slice(3);
  const [l, c, h] = (DARK ? RECIPES_DARK : RECIPES)[fam] || (DARK ? RECIPES_DARK : RECIPES).misc;
  return oklchToCss(mix({ l, c, h: h * Math.PI / 180 }, DARK ? 0.26 : 0.20, SURFACE));
};

const typeChip = key => key
  ? `<span class="chip ${swatchClass(key)}" data-act="type" style="--sw-chip-fill:${chipFill(key)}">${typeGlyph(key)}${esc(categoryName(key))}</span>`
  : `<span class="chip none" data-act="type">${F.typeNone}</span>`;

// ── ② 系統分享選單 ──
function shareSheet(cfg) {
  const badge = '<svg class="badge" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#34c759"/><path d="M12 6.5c-3.6 0-6.5 2.3-6.5 5.1 0 1.6.9 3 2.4 3.9l-.6 2.2 2.6-1.4c.7.2 1.4.3 2.1.3 3.6 0 6.5-2.3 6.5-5S15.6 6.5 12 6.5z" fill="#fff"/></svg>';
  const tones = ['#7ba6c9,#4f7fa8', '#d9a07a,#b8764f', '#a7b98a,#7d9161', '#b49ad0,#8a6fae'];
  const people = SYS.people.map((n, i) => `<div class="ss-cell"><div class="av" style="background:linear-gradient(${tones[i]})">${[...n][0].toUpperCase()}${badge}</div><span>${n}</span></div>`).join('');
  const app = (bg, inner, name, attrs = '') => `<div class="ss-cell"${attrs}><div class="app" style="background:${bg}">${inner}</div><span>${name}</span></div>`;
  const apps = [
    app('linear-gradient(#f4f4f6,#e4e4e8)', '<svg viewBox="0 0 24 24" class="i" style="stroke:#0a84ff;stroke-width:1.6"><circle cx="12" cy="12" r="2"/><path d="M8.2 15.8a5.4 5.4 0 1 1 7.6 0M5.4 18.6a9.4 9.4 0 1 1 13.2 0"/></svg>', SYS.airdrop),
    app('linear-gradient(#65e073,#2fbf48)', '<svg viewBox="0 0 24 24"><path d="M12 4C6.8 4 3 7.2 3 11.1c0 2.3 1.3 4.3 3.4 5.6l-.9 3.3 3.8-2c.9.2 1.8.3 2.7.3 5.2 0 9-3.2 9-7.2S17.2 4 12 4z" fill="#fff"/></svg>', SYS.messages),
    app('#fff', '<img src="img/app-icon-180.png" alt="">', 'TripEZGo', ' data-act="tripezgo" data-tap'),
    app('linear-gradient(#4fb1ff,#1a73f0)', '<svg viewBox="0 0 24 24" class="i" style="stroke:#fff;stroke-width:1.7"><rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M4 7l8 6 8-6"/></svg>', SYS.mail),
    app('linear-gradient(#fff 0 30%,#fbfbfb 30%)', '<svg viewBox="0 0 24 24" class="i" style="stroke:#c9c9cc;stroke-width:1.2"><path d="M3 11h18M3 15h18M3 19h18"/><rect x="0" y="0" width="24" height="7" fill="#f7c843" stroke="none"/></svg>', SYS.notes),
  ].join('');
  const li = (label, icon, cls = '') => `<div class="ss-li ${cls}">${label}${icon ? g(icon) : ''}</div>`;
  return `
    <div class="ss-head">${cfg.sheetThumb}
      <div class="ss-tt"><b>${fmt(cfg.sheetTitle)}</b><span>${cfg.host}</span></div></div>
    <div class="ss-x" data-act="close-ss" data-tap>${g('x')}</div>
    <div class="ss-row people">${people}</div>
    <div class="ss-sep"></div>
    <div class="ss-row apps">${apps}</div>
    <div class="ss-list" style="top:318px">${li(SYS.copy, 'copy')}${li(SYS.readingList, 'glasses')}${li(SYS.quickNote, 'qnote')}</div>
    <div class="ss-list" style="top:484px">${li(SYS.editActions, '', 'blue')}</div>`;
}

/**
 * 掛上 ②③④ 三層。
 * cfg：
 *   host            來源列寫的網域（URLParts(url).host）
 *   url             分享進來的那一條網址（描述最後一行）
 *   sheetTitle、sheetThumb   系統分享選單頂端那一列
 *   ogTitle、ogDesc  讀到的 og（地圖連結：沒有，db19837d6）
 *   image           { src, caption } | null（地圖連結：null）
 *   place           { name, coord: '34.29527, 132.31547', snap } | null
 *   model           標題丟進行程類型模型、信心 ≥ 0.96 的那一種（Scripts/event-type-model 的模型，在 Mac 上量的）；null ＝ 沒把握
 *   tripName
 */
export function mountShare(d, hostEl, cfg) {
  d.insertAdjacentHTML('beforeend', '<div class="dim" id="dim"></div><div class="ss" id="ss"></div><div class="ext" id="ext"></div>');
  const $ = id => document.getElementById(id);
  hostEl.classList.add('host-app');

  const st = {};
  const fresh = () => Object.assign(st, {
    target: 'event', reading: false, typedTitle: null, typedDesc: {}, imageRemoved: false, placeRemoved: false,
    timing: { mode: 'pending', day: null, start: 540, end: 600 },
    eventType: 'sight', eventSrc: null, markerType: null, markerSrc: null, cats: new Set(),
  });
  fresh();
  // ADR-0031：模型 → 地點類別 → 其他（標記：不選）。地圖連結的地點類別要連出去問，這裡只用得到模型那一層。
  const preselect = () => {
    if (cfg.model) { st.eventType = cfg.model; st.eventSrc = 'model'; st.markerType = cfg.model; st.markerSrc = 'model'; }
    else { st.eventType = 'other'; st.eventSrc = 'fallback'; st.markerType = null; st.markerSrc = 'fallback'; }
  };

  // urlPlace：讀完才有，× 拿掉之後沒有。標題那一層讀的是 page.place 本身（拿掉地點不會讓標題跟著不見）。
  const place = () => (st.reading || st.placeRemoved ? null : cfg.place);
  const suggestedTitle = () => {
    if (st.reading) return { text: '', badge: null };
    const p = cfg.place, og = cfg.ogTitle || '';
    const cands = { shopping: [og], event: [p?.name, og], marker: [p?.name, og], note: [og, p?.name] }[st.target];
    const text = cands.map(x => (x || '').trim()).find(Boolean) || '';
    if (!text) return { text: '', badge: null };
    const fromPlace = text === p?.name && text !== og;
    return { text, badge: fromPlace ? null : F.fromPage };
  };
  const suggestedDesc = () => {
    if (st.reading) return { text: '', badge: null };
    const og = (cfg.ogDesc || '').trim();
    if (st.target === 'marker') return { text: og, badge: og ? F.fromPage : null };
    return { text: [og, cfg.url].filter(Boolean).join('\n\n'), badge: og ? F.fromPage : null };
  };
  const title = () => st.typedTitle ?? suggestedTitle().text;
  const desc = () => st.typedDesc[st.target] ?? suggestedDesc().text;
  const canSave = () => {
    if (cfg.inspiration) return !st.reading;
    if (st.reading) return false;
    const missing = !title().trim();
    if ((st.target === 'event' || st.target === 'marker') && missing) return false;
    if (st.target === 'marker' && !place()) return false;
    return true;
  };

  // ── 畫 ──
  const block = (label, body, { badge = null, req = null, hint = null, err = null, cls = '' } = {}) =>
    `<div class="blk ${cls}"><div class="lbl">${label}${badge ? `<span class="auto">${badge}</span>` : ''}${req ? `<span class="req">${req}</span>` : ''}</div>${body}${hint ? `<div class="hint">${hint}</div>` : ''}${err ? `<div class="err">${err}</div>` : ''}</div>`;
  const sk = (widths, tall) => `<div class="skf${tall ? ' tall' : ''}">${widths.map(w => `<i style="width:${w}%"></i>`).join('')}</div>`;
  const input = (key, value, ph) => interactive
    ? `<input class="inp" type="text" data-in="${key}" value="${esc(value)}" placeholder="${esc(ph)}">`
    : `<div class="inp${value ? '' : ' ph'}">${value ? fmt(value) : ph}</div>`;
  const linkify = s => fmt(s).replace(/https?:\/\/[^\s<]+/g, u => `<span class="u">${u}</span>`);
  const area = (key, value, ph, extraCls = '') => interactive
    ? `<div class="area ${extraCls}${value ? '' : ' ph'}" data-in="${key}" contenteditable="plaintext-only" data-ph="${esc(ph)}">${value ? linkify(value) : ph}</div>`
    : `<div class="area ${extraCls}${value ? '' : ' ph'}">${value ? linkify(value) : ph}</div>`;
  const titleBadge = () => {
    if (st.target === 'event' && st.eventSrc === 'place') return F.fromPlace;
    if (st.target === 'marker' && st.markerSrc === 'place' && st.markerType) return F.fromPlace;
    return st.typedTitle == null ? suggestedTitle().badge : null;
  };
  const titleReq = () => {
    const needs = st.target === 'event' || st.target === 'marker';
    return needs && !st.reading && !title().trim() ? F.required : null;
  };
  const imageSlot = () => {
    if (st.target === 'marker') return '';
    if (st.reading) return '<div class="ogi loading"></div>';
    if (!cfg.image) return '';
    if (st.imageRemoved) return `<div class="dash act">${F.imageRemoved}<span class="undo" data-act="img-restore" data-tap>${F.restore}</span></div>`;
    return `<div class="ogi"><img src="${cfg.image.src}" alt=""><span class="cap">${cfg.image.caption}</span><span class="cx" data-act="img-remove" data-tap>${di('close')}</span></div>`;
  };
  const imageBadge = () => (!st.reading && cfg.image && !st.imageRemoved ? F.fromPage : null);
  const placeCard = p => `<div class="pc"><div class="pc-map" style="background-image:url(${p.snap})"><span class="pin"></span></div>
    <div class="pc-body"><div class="pc-tx"><b>${fmt(p.name)}</b><span>${p.coord}</span></div><span class="cx" data-act="place-remove" data-tap>${di('close')}</span></div></div>`;
  const descBlock = () => block(F.desc, st.reading ? sk([94, 80, 46], true) : area('desc', desc(), F.descPh),
    { badge: st.typedDesc[st.target] == null ? suggestedDesc().badge : null });

  function timeSection() {
    const tm = st.timing;
    const seg = `<div class="seg">${F.modes.map((m, i) => `<span class="${['timed', 'allDay', 'pending'][i] === tm.mode ? 'on' : ''}" data-mode="${['timed', 'allDay', 'pending'][i]}" data-tap>${m}</span>`).join('')}</div>`;
    const dayText = tm.mode === 'pending' ? (tm.day ? F.day(tm.day) : F.unspecified) : F.day(tm.day || 1);
    const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const rows = [`<div class="trow"><span class="k">${F.dayCaption}</span><span class="v">${dayText}${di('picker', 'pop')}</span></div>`];
    if (tm.mode === 'timed') {
      rows.push(`<div class="trow"><span class="v" style="padding-left:2px"><span class="k">${F.start}</span><span class="tm">${clock(tm.start)}</span></span><span class="z">${F.zone}</span></div>`);
      rows.push(`<div class="trow"><span class="v" style="padding-left:2px"><span class="k">${F.end}</span><span class="tm">${clock(tm.end)}</span></span><span class="z">${F.zone}</span></div>`);
    }
    const hint = tm.mode === 'pending' ? F.pendingHint : tm.mode === 'allDay' ? F.allDayHintUndated : null;
    return block(F.time, `<div>${seg}<div class="tbox">${rows.join('')}</div></div>`, { hint });
  }

  function fields() {
    const t = title(), p = place();
    switch (st.target) {
      case 'event': {
        const info = `<div class="info">${typeChip(st.eventType)}${st.reading ? sk([70]) : input('title', t, F.titlePh)}</div>`;
        const placeBody = p ? placeCard(p) : `<div class="dash">${st.reading ? F.noPlaceShort : F.noPlace}</div>`;
        const img = imageSlot();
        return [
          block(F.info, info, { badge: titleReq() ? null : titleBadge(), req: titleReq() }),
          timeSection(),
          block(F.place, placeBody, { badge: p ? F.fromLink : null }),
          descBlock(),
          img ? block(F.attach, img, { badge: imageBadge() }) : '',
        ].join('');
      }
      case 'shopping': {
        const img = imageSlot();
        return [
          block(F.itemName, st.reading ? sk([70]) : input('title', t, F.itemPh), { badge: titleBadge() }),
          block(F.cats, `<div class="rail">${F.shopCats.map((c, i) => `<span class="fc${st.cats.has(i) ? ' on' : ''}" data-cat="${i}" data-tap>${c}</span>`).join('')}</div>`),
          img ? block(F.itemImage, img, { badge: imageBadge() }) : '',
          block(F.price, `<div class="price"><div class="cur">JPY</div><div class="amt">0</div></div>`, { hint: F.priceHint }),
          descBlock(),
        ].join('');
      }
      case 'note': {
        const img = imageSlot();
        const body = st.reading ? sk([94, 80, 46], true)
          : `<div class="nb">${img}${area('desc', desc(), F.descPh)}</div>`;
        return [
          block(F.title, st.reading ? sk([70]) : input('title', t, F.titlePh), { badge: titleBadge() }),
          block(F.content, body, { badge: st.typedDesc.note == null ? suggestedDesc().badge : null }),
          block(F.filing, `<div class="grp"><div class="row"><span class="lab">${F.tag}</span><span class="tagv"><span class="chipx">share</span></span>${di('chevronRight', 'chev')}</div></div>`),
        ].join('');
      }
      case 'marker': {
        const info = `<div class="info">${typeChip(st.markerType)}${st.reading ? sk([70]) : input('title', t, F.titlePh)}</div>`;
        const kw = t.trim();
        const pick = `<div class="pick${st.reading ? '' : ' bad'}">${di('search')}<span class="kw">${kw ? `${F.pickLead}<b>${fmt(kw)}</b>${F.pickTail}` : F.pick}</span>${di('chevronRight', 'chev')}</div>`;
        return [
          block(F.info, info, { badge: titleReq() ? null : titleBadge(), req: titleReq() }),
          descBlock(),
          block(F.place, p ? placeCard(p) : pick, {
            badge: p ? F.fromLink : null, req: p ? null : F.requiredChoice, err: !p && !st.reading ? F.needsPlace : null,
          }),
        ].join('');
      }
    }
    return '';
  }

  // 1.4.0 分享紙「存成靈感」（ShareSheetViewController，設計 X 線 A1–A3、A5、A7）：左上圓形 ✕（SheetCloseButton）、標題、
  // 分享進來的東西本身（ShareSourceBox：網址等寬、照字斷行，不抓 og、沒有骨架）、「旅程」一列（日曆圖示＋旅程名＋›）、
  // 「類型」一列（✦ 自動＋›）；儲存是釘在底部的大主按鈕。結果卡同 ④（share.done.inspiration）。
  function inspirationForm() {
    const X = IS[{ zh: 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' }[LANG]];
    const cal = '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>';
    const link = '<svg class="i" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
    const spark = '<svg class="i" viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>';
    return `
      <div class="xnav"><div class="xclose" data-act="cancel" data-tap>${di('close')}</div>
        <div class="ttl">${X['shareform.title.inspiration']}</div></div>
      <div class="xbody">
        <div class="srcbox">${link}<span>${esc(cfg.url)}</span></div>
        ${block(X['shareform.label.trip'], `<div class="grp"><div class="row"><span class="ricon">${cal}</span><span class="lab">${fmt(cfg.tripName)}</span>${di('chevronRight', 'chev')}</div></div>`)}
        ${block(X['shareform.label.eventtype'], `<div class="grp"><div class="row"><span class="ricon">${spark}</span><span class="lab">${X['ui.typepicker.auto']}</span>${di('chevronRight', 'chev')}</div></div>`)}
      </div>
      <div class="xfoot"><div class="primary" data-act="save" data-tap>${X['shareform.action.save']}</div></div>`;
  }

  function extForm() {
    if (cfg.inspiration) return inspirationForm();
    const ttl = { event: F.titleEvent, shopping: F.titleShopping, note: F.titleNote, marker: F.titleMarker }[st.target];
    const src = st.reading
      ? `<div class="src">${di('clock')}<span class="m">${F.reading}</span></div>`
      : `<div class="src">${di('lock')}<span class="h">${cfg.host}</span></div>`;
    const kinds = ['event', 'shopping', 'note', 'marker'];
    const seg = `<div class="seg kinds">${F.kinds.map((k, i) => `<span class="${kinds[i] === st.target ? 'on' : ''}" data-kind="${kinds[i]}" data-tap>${k}</span>`).join('')}</div>`;
    return `
      <div class="xnav"><div class="xbtn" data-act="cancel" data-tap>${F.cancel}</div>
        <div class="ttl">${ttl}</div>
        <div class="xsave${canSave() ? '' : ' off'}" data-act="save" data-tap>${F.save}</div></div>
      <div class="xbody">${src}${seg}${fields()}
        ${block(F.trip, `<div class="grp"><div class="row"><span class="lab">${F.tripRow}</span><span class="val">${fmt(cfg.tripName)}</span>${di('chevronRight', 'chev')}</div></div>`)}
      </div>`;
  }

  function extDone() {
    if (cfg.inspiration) {
      const X = IS[{ zh: 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' }[LANG]];
      return `<div class="res"><div class="badge50">${di('check')}</div><h2>${X['share.done.inspiration']}</h2><p>${fmt(`${F.quoted(cfg.ogTitle)}\n${cfg.tripName}`)}</p></div>`;
    }
    const what = title().trim() || cfg.host;
    const head = { event: F.doneEvent, shopping: F.doneShopping, note: F.doneNote, marker: F.doneMarker }[st.target];
    return `<div class="res"><div class="badge50">${di('check')}</div><h2>${head}</h2><p>${fmt(`${F.quoted(what)}\n${cfg.tripName}`)}</p></div>`;
  }

  function show(step) {
    const dim = $('dim'), ss = $('ss'), ext = $('ext');
    if (step === 'post') {
      hostEl.classList.remove('back'); dim.classList.remove('on'); ss.classList.remove('on', 'back'); ext.classList.remove('on');
      return;
    }
    if (!ss.innerHTML) ss.innerHTML = shareSheet(cfg);
    if (step === 'sheet') {
      hostEl.classList.remove('back'); dim.classList.add('on'); ss.classList.add('on'); ss.classList.remove('back'); ext.classList.remove('on');
      return;
    }
    // ext / done：延伸那一張蓋上來，底下的 App 與分享選單往後退
    hostEl.classList.add('back'); dim.classList.add('on'); ss.classList.add('on', 'back');
    const body = ext.querySelector('.xbody'), top = body ? body.scrollTop : 0;
    ext.innerHTML = step === 'done' ? extDone() : extForm();
    const nb = ext.querySelector('.xbody'); if (nb) nb.scrollTop = top;
    ext.classList.add('on');
  }

  // 截圖模式：?step=post|sheet|ext|done（預設 post）；ext 畫讀完的樣子
  const step = interactive ? 'post' : (params.get('step') || 'post');
  if (!interactive && step !== 'post') {
    for (const el of [hostEl, $('dim'), $('ss'), $('ext')]) el.style.transition = 'none';
    preselect();
  }
  show(step);

  return {
    step,
    wire(setDark) {
      if (!interactive) return;
      let timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      const close = () => { timers.forEach(clearTimeout); timers = []; setDark(false); show('post'); setTimeout(() => { $('ss').innerHTML = ''; }, 420); };
      d.addEventListener('click', (e) => {
        const a = e.target.closest('[data-act]'), kind = e.target.closest('[data-kind]'), mode = e.target.closest('[data-mode]'), cat = e.target.closest('[data-cat]');
        if (kind) { if (kind.dataset.kind !== st.target) { st.target = kind.dataset.kind; show('ext'); } return; }
        if (mode) {
          const m = mode.dataset.mode, tm = st.timing;
          if (m !== tm.mode) {
            // ShareFormViewModel.setTimingMode：全日、時間一定有一天（沒選過 → defaultDay＝第 1 天）；時間先帶 09:00–10:00
            const day = tm.day ?? 1;
            st.timing = m === 'pending' ? { ...tm, mode: m } : m === 'allDay' ? { ...tm, mode: m, day } : { mode: m, day, start: 540, end: 600 };
            show('ext');
          }
          return;
        }
        if (cat) { const i = +cat.dataset.cat; st.cats.has(i) ? st.cats.delete(i) : st.cats.add(i); cat.classList.toggle('on'); return; }
        if (!a) { if (e.target === $('dim') && !$('ext').classList.contains('on')) close(); return; }
        const act = a.dataset.act;
        if (act === 'share') show('sheet');
        else if (act === 'close-ss') close();
        else if (act === 'tripezgo') {
          if (cfg.inspiration) { fresh(); setDark(true); show('ext'); return; }   // 靈感：不抓 og、沒有讀取中那一段（ADR-0037）
          // 每一次打開都是一張新的紙（ShareViewController 每次新建）：先畫表單、儲存停用，讀完網址才填進去
          fresh(); st.reading = true;
          setDark(true); show('ext');
          later(() => { st.reading = false; show('ext'); }, 900);
          // 讀完之後才照標題預選類型（askForType(pausing: false)）——晶片從「景點」換成模型那一種
          later(() => { preselect(); show('ext'); }, 1250);
        } else if (act === 'cancel') close();
        else if (act === 'save') {
          if (!canSave()) return;
          timers.forEach(clearTimeout); timers = [];
          if (st.eventSrc == null) preselect();
          show('done');
          // ShareResultViewController.successLinger：兩秒自己關上，completeRequest 連分享選單一起收
          later(close, 2000);
        } else if (act === 'img-remove') { st.imageRemoved = true; show('ext'); }
        else if (act === 'img-restore') { st.imageRemoved = false; show('ext'); }
        else if (act === 'place-remove') {
          // 60f9d5ca5：地點拿掉，類型當場重問——照地點帶的那一種與「依地點」都不成立了（模型那一層不受影響）
          st.placeRemoved = true; show('ext');
        }
      });
      d.addEventListener('input', (e) => {
        const k = e.target.dataset?.in; if (!k) return;
        const v = e.target.isContentEditable ? e.target.innerText : e.target.value;
        if (k === 'title') st.typedTitle = v; else st.typedDesc[st.target] = v;
        e.target.classList.toggle('ph', false);
        const blk = e.target.closest('.blk'); blk?.querySelector('.lbl .auto')?.remove();
        $('ext').querySelector('.xsave')?.classList.toggle('off', !canSave());
      });
      d.addEventListener('focusin', (e) => {
        // contenteditable 的 placeholder：點進去時清掉
        if (e.target.matches?.('.area.ph')) { e.target.textContent = ''; }
      });
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
    },
  };
}

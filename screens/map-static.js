// 離線地圖（ADR-0050，打包進 App 的「地圖」「旅伴」示範）：畫面照 map-live.js，差別只有底圖——
// 真的 MapKit 畫出來的宮島表參道一帶，事先截成靜態圖（img/mapdemo-<lang>-<theme>.webp，tools/app-demos-capture-map.mjs；
// 淺色與深色、三語各一張），四角座標在 data/mapdemo.json。鏡頭在這張圖之內平移、縮放（CSS transform），沒有 MapKit、沒有網路。
// 路線也是事先錄的：步行那幾段 MapKit Directions 回的結果在 data/mapdemo-routes.json（tools/app-demos-capture-routes.mjs）。
//
// 參數：?lang= &theme=dark &embed=1 &still=1 &interactive=1 &auto=<故事> &focus=mates
//   預設（地圖示範）：第 2 天的圖釘與步行路程，點圖釘出卡片、卡片上的步行鈕開始導航（藍點沿路走、導航卡數字跟著變）、✕ 先問再結束。
//   focus=mates（旅伴示範）：「正在分享位置」、三位旅伴的位置（位置樣本同 share-location.html）、點開看「更新於 X」。
// 照 App 的部分（圖釘、旅伴、卡片、導航卡、距離膠囊）見 map-live.js 檔頭；這裡只把 MapKit 換成「圖＋座標換算」。
import { fmt, params, lang, t, loadTrip, loadCategories, categoryName, chrome, swatchClass, ready, ICON, interactive, still, toMin, duration } from './chrome.js';
import { alert } from './tools.js';
import { MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID } from '../trip/icons.js';

const d = document.getElementById('d');
const MATES_MODE = params.get('focus') === 'mates';
const [trip, bounds, routes] = await Promise.all([loadTrip(), fetch('./data/mapdemo.json').then((r) => r.json()), fetch('./data/mapdemo-routes.json').then((r) => r.json()), loadCategories()]);
const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
const IMG_LANG = ['zh-Hant-TW', 'en', 'ja'].includes(lang) ? lang : 'en';
const IMG = `img/mapdemo-${IMG_LANG}-${theme}.webp`;
const todayNo = 2, start = new Date('2026-10-10T00:00:00');
const dateOf = (n) => new Date(start.getTime() + (n - 1) * 864e5);
const today = dateOf(todayNo);
const dayLabel = (n) => (lang === 'ja' ? `${n} 日目` : t.day(n));
const VW = 402, VH = 746;   // 地圖區（y=128 往下）

// App 的字串（Scripts/i18n/maps/Map.json、UI.json；同 map-live.js）
const S = {
  'zh-Hant-TW': { all: '全部', search: '搜尋地標或地址', live: '分享我的位置', liveOn: '正在分享位置', openEvent: '開啟行程細節', openInMaps: '在地圖開啟',
    updated: (s) => `更新於 ${s}`, wiu: '對方的定位授權只到「使用 App 期間」。TripEZGo 被系統關掉之後，你看到的會停在最後一次更新的位置。',
    man: { straight: '繼續直行', slightLeft: '靠左', left: '左轉', slightRight: '靠右', right: '右轉', uTurn: '迴轉', arrive: '抵達' },
    then: (u) => `${u}後`, status: (a, b) => `步行導航 · 還有 ${a} · ${b}`, headingTo: (s) => `前往 ${s}`, openDest: '開啟終點',
    endTitle: '結束步行導航？', endMsg: '圖上那條路線與導航都會收起來。', cancel: '取消', endConfirm: '結束導航', unit: { m: '公尺', km: '公里' } },
  en: { all: 'All', search: 'Search a landmark or address', live: 'Share my location', liveOn: 'Sharing location', openEvent: 'Open event details', openInMaps: 'Open in Maps',
    updated: (s) => `Updated ${s}`, wiu: 'They allowed location only while using the app. If iOS shuts TripEZGo down, you keep seeing their last known spot.',
    man: { straight: 'Continue straight', slightLeft: 'Keep left', left: 'Turn left', slightRight: 'Keep right', right: 'Turn right', uTurn: 'Make a U-turn', arrive: 'Arrive' },
    then: (u) => `${u} ahead`, status: (a, b) => `Walking · ${a} · ${b} left`, headingTo: (s) => `Heading to ${s}`, openDest: 'Open destination',
    endTitle: 'End walking navigation?', endMsg: 'The route on the map and the navigation will both stop.', cancel: 'Cancel', endConfirm: 'End navigation', unit: { ft: 'feet', mi: 'miles' } },
  ja: { all: 'すべて', search: 'ランドマークや住所を検索', live: '現在地を共有', liveOn: '位置を共有中', openEvent: '予定の詳細を開く', openInMaps: 'マップで開く',
    updated: (s) => `${s}に更新`, wiu: '相手の位置情報の許可は「App の使用中」までです。iOS が TripEZGo を終了させると、最後に更新された位置が表示され続けます。',
    man: { straight: '直進', slightLeft: '左寄り', left: '左折', slightRight: '右寄り', right: '右折', uTurn: 'Uターン', arrive: '到着' },
    then: (u) => `${u} 先`, status: (a, b) => `徒歩ナビ · 残り ${a} · ${b}`, headingTo: (s) => `${s} へ移動中`, openDest: '目的地を開く',
    endTitle: '徒歩ナビを終了しますか？', endMsg: 'マップ上のルートとナビの両方が終了します。', cancel: 'キャンセル', endConfirm: 'ナビを終了', unit: { m: 'm', km: 'km' } },
}[lang] || null;
const L = S || {};
const LOCALE = { 'zh-Hant-TW': 'zh-TW', en: 'en-US', ja: 'ja' }[lang] || 'en-US';
const IMPERIAL = lang === 'en';
const TABS_JA = ['概要', '旅行', 'マップ', '資料', '設定'];

// ── 座標 ↔ 圖上的點（圖 603×1044pt，四角座標在 mapdemo.json；範圍只有 3 公里見方，線性換算的誤差可以忽略） ──
const W = bounds.w, H = bounds.h;
const toPx = ([lat, lon]) => [(lon - bounds.west) / (bounds.east - bounds.west) * W, (bounds.north - lat) / (bounds.north - bounds.south) * H];
const R = 6371000, rad = (x) => x * Math.PI / 180;
const metresBetween = (a, b) => { const la = rad((a[0] + b[0]) / 2); return Math.hypot(rad(b[1] - a[1]) * Math.cos(la), rad(b[0] - a[0])) * R; };
const bearing = (a, b) => { const la = rad((a[0] + b[0]) / 2); const deg = Math.atan2((b[1] - a[1]) * Math.cos(la), b[0] - a[0]) * 180 / Math.PI; return deg < 0 ? deg + 360 : deg; };

// ── 距離（TripTextFormatter.distance／walkingDistance，同 map-live.js） ──
function distParts(metres) {
  if (IMPERIAL) { const ft = metres / 0.3048; return ft < 1000 ? { v: Math.round(ft), u: L.unit.ft, coarse: false } : { v: +(metres / 1609.344).toFixed(1), u: L.unit.mi, coarse: true }; }
  return metres < 1000 ? { v: Math.round(metres), u: L.unit.m, coarse: false } : { v: +(metres / 1000).toFixed(1), u: L.unit.km, coarse: true };
}
const numFmt = (v, coarse) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: coarse ? 1 : 0 }).format(v);
function legDistance(metres) {
  const unit = IMPERIAL ? (metres / 0.3048 < 1000 ? 'foot' : 'mile') : (metres < 1000 ? 'meter' : 'kilometer');
  const v = { foot: metres / 0.3048, mile: metres / 1609.344, meter: metres, kilometer: metres / 1000 }[unit];
  return new Intl.NumberFormat(LOCALE, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: unit === 'foot' || unit === 'meter' ? 0 : 1 }).format(v);
}

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
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke-width="${SW[n] ?? 1.8}">${IC[n]}</g></svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const glyph = (cat) => `<svg class="glyph" viewBox="0 0 15 15" aria-hidden="true"><path fill-rule="evenodd" d="${MAKI[MAKI_OF_TYPE[cat] || DEFAULT_ICON_ID] || MAKI.marker}"/></svg>`;

// ── 圖上的行程：第 2 天、落在這張圖裡的（MapViewModel.place(for:)；站號＝那一天的第幾站） ──
const dayEvents = trip.days.find((x) => x.day === todayNo).events.filter((e) => e.place && !e.isCancelled && e.start).sort((a, b) => toMin(a.start) - toMin(b.start));
const inImage = (p) => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;
const places = dayEvents.map((e, i) => ({ id: e.key, ev: e, no: i + 1, at: [e.place.latitude, e.place.longitude] })).filter((p) => inImage(toPx(p.at)));
const byId = Object.fromEntries(places.map((p) => [p.id, p]));
// 行程線：錄下來的步行路段（渡輪 → 表參道 → 嚴島神社 → 紅葉谷）
const routeBy = (a, b) => routes.find((r) => metresBetween(r.from, a.at) < 3 && metresBetween(r.to, b.at) < 3);
const legs = [];
for (let i = 1; i < dayEvents.length; i++) {
  const a = byId[dayEvents[i - 1].key], b = byId[dayEvents[i].key];
  const r = a && b && routeBy(a, b); if (r) legs.push({ path: r.path, metres: r.distance });
}
const NAV_ROUTES = Object.fromEntries(places.map((p, i) => [p.id, i ? routeBy(places[i - 1], p) : null]).filter(([, r]) => r));

// ── 旅伴樣本（名字與顏色同 share-location.html；位置擺在表參道到嚴島神社之間，圖上的點） ──
const MATE_NAMES = { 'zh-Hant-TW': ['小雯', '凱文', '美琪'], en: ['Mia', 'Ken', 'Sara'], ja: ['美咲', '健太', 'さくら'] }[lang] || ['Mia', 'Ken', 'Sara'];
const MATES = [
  { id: 'm0', name: MATE_NAMES[0], colour: 'eat', px: [150, 330], ageMin: 2, wiu: true },
  { id: 'm1', name: MATE_NAMES[1], colour: 'stay', px: [130, 520], ageMin: 14 },
  { id: 'm2', name: MATE_NAMES[2], colour: 'shop', px: [410, 440], ageMin: 75 },   // 超過一小時 → 灰
];
const COLD_MIN = 60;   // LivePosition.coldAfter
const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always', style: 'long' });
const ago = (m) => (m < 60 ? rtf.format(-m, 'minute') : rtf.format(-Math.floor(m / 60), 'hour'));
const ME_AT = MATES_MODE ? null : [34.29945, 132.32215];   // 剛走完表參道，面向嚴島神社
const ME_PX = MATES_MODE ? [235, 300] : toPx(ME_AT);

// ── 介面層（同 map-live.js） ──
d.insertAdjacentHTML('beforeend', `<div class="mk" id="mk"><div class="layer" id="layer"><img src="${IMG}" width="${W}" height="${H}" alt="" draggable="false">
    <svg id="lines" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"></svg></div><div class="pins" id="pins"></div></div>
  <div class="head"><div class="greet">${`${t.monthDay(today.getMonth() + 1, today.getDate())} · ${t.weekday[today.getDay()]}`.replace(/[0-9]+/g, (m) => (lang === 'ja' ? m : `<span lang="en">${m}</span>`))}</div>
  <div class="title">${fmt(trip.title).replace(/[　-鿿＀-￯]+/g, (m) => `<span class="cjk">${m}</span>`)}</div></div>`);
const chipHtml = () => [`<div class="chip all"><b>${L.all}</b></div>`].concat(Array.from({ length: trip.dayCount }, (_, i) => {
  const n = i + 1, dt = dateOf(n), isToday = n === todayNo;
  return `<div class="chip${isToday ? ' on' : ''}"><b>${isToday ? '<i></i>' : ''}${isToday ? t.today : dayLabel(n)}</b><span>${t.shortDate(dt.getMonth() + 1, dt.getDate())} ${t.weekday[dt.getDay()]}</span></div>`;
})).join('');
d.insertAdjacentHTML('beforeend', `<div class="chips" id="chips">${chipHtml()}</div>
  <div class="search">${L.search}</div>
  <div class="live${MATES_MODE ? ' on' : ''}"><i></i>${MATES_MODE ? L.liveOn : L.live}</div>
  <div class="fab on" style="top:242px">${icon('infoFill')}</div>
  <div id="cardSlot"></div><div id="fabSlot"></div>`);
// 日文頁：西文包成 lang="en"（同 map-live.js）
function jaWrap(root) {
  if (lang !== 'ja' || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement.closest('[lang="en"], .head, svg') || !/[0-9A-Za-z]/.test(node.data)) continue;
    const span = document.createElement('span');
    span.innerHTML = node.data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/ ?(?:[0-9A-Za-z][0-9A-Za-z/:.' -]*[0-9A-Za-z]|[0-9A-Za-z]) ?/g, (m) => `<span lang="en">${m}</span>`);
    node.replaceWith(span);
  }
}
['chips', 'search', 'live'].forEach((c) => jaWrap(d.querySelector(c === 'chips' ? '#chips' : '.' + c)));
chrome(d, { tab: 2 });
if (lang === 'ja') d.querySelectorAll('.tab span').forEach((el, i) => { el.textContent = TABS_JA[i]; });

// ── 鏡頭：cam = 圖上哪一點在地圖區正中（cx, cy）、放大倍率 z。底圖是 2x 的圖，z 在 0.75–1.5 之間都清楚 ──
const mkEl = document.getElementById('mk'), layer = document.getElementById('layer'), pinsEl = document.getElementById('pins'), linesEl = document.getElementById('lines');
const cam = { cx: 300, cy: 393, z: 1 };
const clampCam = (c) => { const z = Math.min(1.5, Math.max(0.75, c.z)); return { z, cx: Math.min(W - VW / 2 / z, Math.max(VW / 2 / z, c.cx)), cy: Math.min(H - VH / 2 / z, Math.max(VH / 2 / z, c.cy)) }; };
const scr = (p) => [VW / 2 + (p[0] - cam.cx) * cam.z, VH / 2 + (p[1] - cam.cy) * cam.z];
function setCam(c) {
  Object.assign(cam, clampCam(c));
  layer.style.transform = `translate(${VW / 2 - cam.cx * cam.z}px,${VH / 2 - cam.cy * cam.z}px) scale(${cam.z})`;
  for (const el of pinsEl.children) { const [x, y] = scr(JSON.parse(el.dataset.px)); el.style.left = `${x}px`; el.style.top = `${y}px`; }
}
const settle = (ms = 950) => new Promise((r) => setTimeout(r, ms));
// 把 p 移到地圖區的 (x, y)（地圖區左上為原點），倍率不變
const centerAt = (p, x, y) => setCam({ ...cam, cx: p[0] - (x - VW / 2) / cam.z, cy: p[1] - (y - VH / 2) / cam.z });

// ── 圖釘、旅伴、藍點 ──
let sel = null;   // { kind: 'place'|'mate', id }
let nav = null;
const swBase = (cat) => { const probe = document.createElement('span'); probe.className = swatchClass(cat); probe.style.color = 'var(--sw-base)'; d.appendChild(probe); const c = getComputedStyle(probe).color; probe.remove(); return c; };
const addPin = (cls, html, px, attrs = {}) => {
  const el = document.createElement('div'); el.className = cls; el.innerHTML = html; el.dataset.px = JSON.stringify(px);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  pinsEl.append(el); return el;
};
const placeEls = {}, mateEls = {};
for (const p of places) {
  const el = addPin('pin', `<svg class="balloon" viewBox="0 0 28 34" aria-hidden="true"><path d="M14 34C12.6 30.9 10.4 28.4 8.6 26.9A14 14 0 1 1 19.4 26.9C17.6 28.4 15.4 30.9 14 34Z"/></svg>
    <i class="ring"></i>${glyph(p.ev.category)}<b class="badge">${p.no}</b><span class="lbl">${fmt(p.ev.title)}</span>`, toPx(p.at), interactive ? { 'data-auto': p.id } : {});
  el.style.color = swBase(p.ev.category); placeEls[p.id] = el;
}
// 標籤避讓（MapKit 的 collision）：離已經有標籤的圖釘太近的，標籤不畫
{
  const kept = [];
  for (const p of places) {
    const [x, y] = toPx(p.at);
    if (kept.some(([kx, ky]) => Math.abs(kx - x) < 120 && Math.abs(ky - y) < 36)) placeEls[p.id].querySelector('.lbl').hidden = true; else kept.push([x, y]);
  }
}
if (MATES_MODE) for (const m of MATES) {
  const stale = m.ageMin >= COLD_MIN;
  mateEls[m.id] = addPin(`mate sw-${m.colour}${stale ? ' stale' : ''}${m.wiu ? ' dashed' : ''}`, `<div class="h">${esc([...m.name][0].toUpperCase())}</div><i class="pr"></i><span class="bub">${fmt(m.name)}</span>`, m.px, interactive ? { 'data-auto': m.id } : {});
}
// 朝向扇（HeadingConeView）：面向嚴島神社（地圖示範）、面向小雯（旅伴示範）
const faceTo = MATES_MODE ? MATES[0].px : toPx(byId['d2-itsukushima'].at);
const coneDeg = (() => { const dx = faceTo[0] - ME_PX[0], dy = faceTo[1] - ME_PX[1]; return (Math.atan2(dx, -dy) * 180 / Math.PI).toFixed(1); })();
const ACCENT_INK = getComputedStyle(document.documentElement).getPropertyValue('--teal300').trim() || '#1d7370';
const coneSvg = (() => {
  const Rr = 42, r = 18, h = 30 * Math.PI / 180, pt = (rad2, a) => `${(42 + rad2 * Math.sin(a)).toFixed(2)} ${(42 - rad2 * Math.cos(a)).toFixed(2)}`;
  return `<svg class="cone" viewBox="0 0 84 84" style="transform:rotate(${coneDeg}deg)" aria-hidden="true">
    <defs><radialGradient id="cone-g" gradientUnits="userSpaceOnUse" cx="42" cy="42" r="59.4">
      <stop offset="0" stop-color="${ACCENT_INK}" stop-opacity=".22"/><stop offset="${(r / Rr).toFixed(4)}" stop-color="${ACCENT_INK}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${ACCENT_INK}" stop-opacity="0"/></radialGradient></defs>
    <path d="M${pt(r, -h)} A${r} ${r} 0 0 1 ${pt(r, h)} L${pt(Rr, h)} A${Rr} ${Rr} 0 0 0 ${pt(Rr, -h)} Z" fill="url(#cone-g)"/></svg>`;
})();
const meEl = addPin('me', coneSvg, ME_PX);
let mePx = ME_PX;
const moveMe = (px) => { mePx = px; meEl.dataset.px = JSON.stringify(px); const [x, y] = scr(px); meEl.style.left = `${x}px`; meEl.style.top = `${y}px`; };

// ── 線：旅程線（accentInk、3pt、距離膠囊）與導航線（tzWalkingRoute #5cc6c3、6pt）；箭頭每 40pt 一枚 ──
const WALK = '#5cc6c3';
function chevrons(pts, size, width, colour) {
  let out = '', carry = 20;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (!len) continue;
    let s = carry;
    for (; s < len; s += 40) {
      const x = a[0] + dx * s / len, y = a[1] + dy * s / len, turn = Math.atan2(dy, dx) * 180 / Math.PI, k = size / 10;
      out += `<path d="M3 1 7 5 3 9" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(1)}) scale(${k}) translate(-5 -5)" fill="none" stroke="${colour}" stroke-width="${(width / k).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    }
    carry = s - len;
  }
  return out;
}
const line = (path, colour, width, opacity) => `<polyline points="${path.map((p) => toPx(p).map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${colour}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
let pills = [];
function drawLegs(on) {
  pills.forEach((p) => p.remove()); pills = [];
  if (!on) { linesEl.innerHTML = ''; return; }
  linesEl.innerHTML = legs.map((l) => line(l.path, ACCENT_INK, 3, 0.85) + chevrons(l.path.map(toPx), 8, 2, ACCENT_INK)).join('');
  for (const l of legs) {   // 距離膠囊（TripMapLegLabel）：線的一半長度那一點
    const pts = l.path, seg = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const m = metresBetween(pts[i - 1], pts[i]); seg.push(m); total += m; }
    let acc = 0, mid = pts[0];
    for (let i = 0; i < seg.length; i++) { if (acc + seg[i] >= total / 2) { const f = seg[i] ? (total / 2 - acc) / seg[i] : 0; mid = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; break; } acc += seg[i]; }
    pills.push(addPin('legpill', legDistance(l.metres), toPx(mid)));
  }
}
function drawWalk(path) {
  linesEl.innerHTML = path ? line(path, WALK, 6, 0.85) + chevrons(path.map(toPx), 10, 3, WALK) : '';
}

// ── 卡片（同 map-live.js） ──
const cardSlot = document.getElementById('cardSlot'), fabSlot = document.getElementById('fabSlot');
const tap = interactive ? ' data-tap' : '';
const navCardHtml = (n) => `<div class="card" id="card" data-kind="nav">
  <div class="n-head"><div class="n-ico">${icon(MAN_ICON[n.man] || 'turnStraight')}</div>
    <div class="n-text"><div class="n-man">${esc(n.manText)}</div><div class="n-dist"><b>${esc(n.dist)}</b><span>${esc(n.unit)}</span></div></div>
    <div class="c-btn" data-act="end"${tap}>${icon('close')}</div></div>
  <div class="n-status">${fmt(n.status)}</div>
  <div class="n-bar"><b style="width:${(n.progress * 100).toFixed(1)}%"></b></div>
  <div class="n-dest"><i></i>${fmt(n.dest)}</div>
  <div class="c-action" data-act="dest"${tap}>${L.openDest}</div></div>`;
function placeCardHtml(p) {
  const ev = p.ev;
  return `<div class="card" id="card" data-kind="place">
    <div class="c-head"><div class="c-text"><div class="c-title">${fmt(ev.title)}</div>
      ${ev.place?.name ? `<div class="c-sub">${fmt(ev.place.name)}</div>` : ''}
      <div class="c-detail">${fmt(`${dayLabel(todayNo)} · ${ev.start} – ${ev.end}`)}</div></div>
      <div class="c-btn" data-act="walk"${tap}>${icon('walking')}</div><div class="c-btn" data-act="close"${tap}>${icon('close')}</div></div>
    ${ev.category ? `<div class="c-tag ${swatchClass(ev.category)}">${categoryName(ev.category)}</div>` : ''}
    ${ev.notes ? `<div class="c-notes">${fmt(ev.notes)}</div>` : ''}
    <div class="c-action">${L.openEvent}</div></div>`;
}
const mateIcon = (m, stale) => {
  const c = stale ? 'var(--muted-on-sunken)' : 'var(--sw-base)';
  return `<svg class="sw-${m.colour}" viewBox="0 0 23 23" style="width:23px;height:23px;display:block">
    <circle cx="11.5" cy="11.5" r="10.5" fill="none" style="stroke:${c}" stroke-width="2"${m.wiu ? ' stroke-dasharray="3 2"' : ''}/>
    <text x="11.5" y="15.6" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="700" font-size="12" style="fill:${c}">${esc([...m.name][0].toUpperCase())}</text></svg>`;
};
const mateCardHtml = (m) => `<div class="card" id="card" data-kind="mate">
  <div class="c-head"><div class="c-art mate-ic">${mateIcon(m, m.ageMin >= COLD_MIN)}</div>
    <div class="c-text"><div class="c-title">${fmt(m.name)}</div></div>
    <div class="c-btn" data-act="walk"${tap}>${icon('walking')}</div><div class="c-btn" data-act="close"${tap}>${icon('close')}</div></div>
  <div class="c-shop"><div class="c-status is-mate"><i></i>${esc(L.updated(ago(m.ageMin)))}</div>
    <div class="c-open">${icon('mapPin')}${L.openInMaps}</div>
    ${m.wiu ? `<div class="c-note">${fmt(L.wiu)}</div>` : ''}</div></div>`;
function setCard(html) {
  cardSlot.innerHTML = html || ''; fabSlot.innerHTML = '';
  const card = document.getElementById('card');
  if (card) {
    const top = card.getBoundingClientRect().top - d.getBoundingClientRect().top, locTop = top - 40.33 - 52, nearTop = locTop - 12 - 52;
    fabSlot.innerHTML = `<div class="fab" style="top:${nearTop}px">${icon('nearby')}</div><div class="fab loc" style="top:${locTop}px">${icon('locate')}</div>
      <div class="deck-toggle" style="top:${top - 26.6}px">${icon('chevDown')}</div>`;
  } else {
    fabSlot.innerHTML = `<div class="fab" style="top:${874 - 83 - 196}px">${icon('plus')}</div><div class="fab" style="top:${874 - 83 - 132}px">${icon('nearby')}</div>
      <div class="fab loc" style="top:${874 - 83 - 68}px">${icon('locate')}</div>`;
  }
  jaWrap(card);
  if (lang === 'en') d.querySelectorAll('.c-detail, .n-status').forEach((el) => { el.innerHTML = el.innerHTML.replace(/ · /g, '<span class="mdot"> · </span>'); });
}
const cardTopOnMap = () => { const c = document.getElementById('card'); return c ? c.getBoundingClientRect().top - d.getBoundingClientRect().top - 128 : VH - 16; };
// 導航中：狀態列 9:41 後面一枚定位箭頭、地圖分頁的 icon 掛一顆點（同 map-live.js）
function setNavChrome(on) {
  const sb = d.querySelector('.sb');
  if (!sb) return;
  sb.classList.toggle('locating', on); sb.querySelector('.sb-loc')?.remove(); d.querySelector('.tab-dot')?.remove();
  if (!on) return;
  d.querySelector('.sb-time').insertAdjacentHTML('afterend', '<svg class="sb-loc" viewBox="0 0 13 13" aria-hidden="true"><path d="M1.2 5.6 11.8 1.2 7.4 11.8 6.4 6.6Z"/></svg>');
  d.querySelectorAll('.tab')[2].insertAdjacentHTML('beforeend', '<i class="tab-dot"></i>');
}
function paintSelection() {
  for (const el of [...Object.values(placeEls), ...Object.values(mateEls)]) el.classList.remove('sel');
  if (sel) ({ place: placeEls, mate: mateEls }[sel.kind][sel.id]?.classList.add('sel'));
}
function showCard() {
  paintSelection();
  if (sel?.kind === 'place') setCard(placeCardHtml(byId[sel.id]));
  else if (sel?.kind === 'mate') setCard(mateCardHtml(MATES.find((m) => m.id === sel.id)));
  else if (nav) setCard(navCardHtml(nav.card));
  else setCard('');
}

// ── 步行導航（WalkingNavigationUseCase.linking ＋ progress，同 map-live.js；路線用事先錄好的） ──
function linking(route) {
  const segs = route.steps.map((s) => ({ path: s.path, metres: s.distance })).filter((s) => s.path.length >= 2 && s.metres > 0);
  return segs.map((s, i) => {
    if (i + 1 >= segs.length) return { ...s, man: 'arrive' };
    const last = s.path[s.path.length - 1], from = [...s.path].reverse().find((p) => metresBetween(p, last) > 0.5);
    const next = segs[i + 1].path, first = next[0], to = next.find((p) => metresBetween(first, p) > 0.5);
    if (!from || !to) return { ...s, man: 'straight' };
    let delta = (bearing(first, to) - bearing(from, last)) % 360;
    if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
    const mag = Math.abs(delta);
    return { ...s, man: mag < 20 ? 'straight' : mag >= 150 ? 'uTurn' : mag < 50 ? (delta < 0 ? 'slightLeft' : 'slightRight') : (delta < 0 ? 'left' : 'right') };
  });
}
function navCard(n, here) {
  let best = null;   // 離「這裡」最近的那一截，剩到那一步結尾多遠、整段還剩多遠
  n.steps.forEach((st, si) => {
    const lens = []; let geo = 0;
    for (let i = 1; i < st.path.length; i++) { const l = metresBetween(st.path[i - 1], st.path[i]); lens.push(l); geo += l; }
    if (!geo) return;
    lens.forEach((len, k) => {
      const a = st.path[k], b = st.path[k + 1], la = rad(a[0]);
      const v = (p) => [rad(p[1] - a[1]) * Math.cos(la) * R, rad(p[0] - a[0]) * R];
      const e = v(b), h = v(here), f = len ? Math.min(Math.max((h[0] * e[0] + h[1] * e[1]) / (len * len), 0), 1) : 0;
      const dev = Math.hypot(h[0] - e[0] * f, h[1] - e[1] * f);
      if (best && dev >= best.dev) return;
      best = { si, dev, rest: (len * (1 - f) + lens.slice(k + 1).reduce((x, y) => x + y, 0)) * (st.metres / geo) };
    });
  });
  const remaining = best.rest + n.steps.slice(best.si + 1).reduce((x, s) => x + s.metres, 0), man = n.steps[best.si].man;
  const toMan = distParts(best.rest), left = distParts(remaining), isTurn = !['straight', 'arrive'].includes(man);
  const mins = Math.max(1, Math.round(n.secs * (remaining / n.total) / 60));
  return { man, manText: L.man[man], dist: numFmt(toMan.v, toMan.coarse), unit: isTurn ? L.then(toMan.u) : toMan.u,
    status: L.status(`${numFmt(left.v, left.coarse)} ${left.u}`, duration(mins)), dest: L.headingTo(n.dest),
    progress: Math.min(Math.max((n.total - remaining) / n.total, 0), 1) };
}
const fromPxLatLon = (px) => [bounds.north - px[1] / H * (bounds.north - bounds.south), bounds.west + px[0] / W * (bounds.east - bounds.west)];
let walker = null;   // 藍點沿著路線走
function pointAlong(path, f) {   // path：lat/lon；f：0–1（照距離）
  const seg = []; let total = 0;
  for (let i = 1; i < path.length; i++) { const m = metresBetween(path[i - 1], path[i]); seg.push(m); total += m; }
  let want = total * f;
  for (let i = 0; i < seg.length; i++) { if (want <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, want / seg[i]) : 0; return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]; } want -= seg[i]; }
  return path[path.length - 1];
}
function startNav(p, { animate = true, progress = 0 } = {}) {
  const route = NAV_ROUTES[p.id]; if (!route) return false;
  const path = route.path.map((x) => x.slice());
  if (metresBetween(path[0], ME_AT) > 0.5) path.unshift(ME_AT);
  nav = { target: p, dest: p.ev.title, steps: linking(route), total: route.distance, secs: route.secs, path };
  nav.card = navCard(nav, ME_AT);
  sel = null; drawLegs(false); drawWalk(path); showCard(); setNavChrome(true);
  // 照 App 把整條線框進來（藍點與目的地兩端都看得到）：上面讓過日期列＋搜尋＋藥丸，下面讓過卡片
  const pts = [...path.map(toPx), ME_PX], xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys) ];
  const top = 265 - 128 + 14 + 40, bottom = cardTopOnMap() - 16, left = 20, right = 20 + 52 + 12;
  const z = Math.min(1.35, (VW - left - right) / Math.max(1, bx[1] - bx[0]), (bottom - top) / Math.max(1, by[1] - by[0]));
  setCam({ z, cx: (bx[0] + bx[1]) / 2 - ((left - right) / 2) / z, cy: (by[0] + by[1]) / 2 - ((top + bottom) / 2 - VH / 2) / z });
  walkStop(); walkStart(progress, animate);
  return true;
}
function walkStart(from, animate) {
  const path = nav.path;
  const at = (f, redraw) => {
    const ll = pointAlong(path, f); moveMe(toPx(ll));
    if (!redraw) return;
    nav.card = navCard(nav, ll);
    if (document.getElementById('card')?.dataset.kind === 'nav') setCard(navCardHtml(nav.card));
  };
  if (!animate) { at(from, true); return; }
  const t0 = performance.now(), SPAN = 9000, MAXF = 0.5;   // 走到一半就停（示範在那之前就按結束）
  let last = 0;
  const tick = (now) => {
    if (!nav) return;
    const f = Math.min(MAXF, (now - t0) / SPAN * MAXF);
    at(f, now - last > 250);   // 導航卡的字不必每幀重畫：每 250ms 一次
    if (now - last > 250) last = now;
    if (f < MAXF) walker = requestAnimationFrame(tick);
  };
  // 鏡頭先到位（緩動 0.9 秒）藍點才開始走：藍點走的時候不套轉場，不然會慢半拍
  walker = setTimeout(() => { meEl.classList.add('walking'); walker = requestAnimationFrame(tick); }, 950);
}
function walkStop() { if (walker) { cancelAnimationFrame(walker); clearTimeout(walker); } walker = null; meEl.classList.remove('walking'); }
function endNav() {
  walkStop(); nav = null; setNavChrome(false);
  moveMe(ME_PX); drawWalk(null); drawLegs(true); showCard(); frameHome();
}
const HOME = MATES_MODE ? { cx: 260, cy: 430, z: 1 } : { cx: 300, cy: 393, z: 1 };
const frameHome = () => setCam(HOME);

// ── 初始 ──
setCam(HOME);
drawLegs(true);
showCard();
if (still) {   // 減少動態：地圖示範停在導航進行中、旅伴示範停在點開小雯
  if (MATES_MODE) { sel = { kind: 'mate', id: 'm0' }; showCard(); centerAt(MATES[0].px, VW / 2, 300); }
  else startNav(byId['d2-itsukushima'], { animate: false, progress: 0.3 });
}
await mkEl.querySelector('img').decode().catch(() => {});
// 載入那一幀不要有轉場；之後的鏡頭移動才緩動
requestAnimationFrame(() => requestAnimationFrame(() => mkEl.classList.add('anim')));
ready();

// ── 互動 ──
if (interactive && !still) {
  const select = (kind, id) => {
    sel = { kind, id };
    showCard();
    if (kind === 'place') centerAt(toPx(byId[id].at), VW / 2, 250);
    else centerAt(MATES.find((m) => m.id === id).px, VW / 2, 250);
  };
  pinsEl.addEventListener('click', (e) => {
    const el = e.target.closest('.pin, .mate'); if (!el || nav) return;
    const id = Object.entries({ ...placeEls, ...mateEls }).find(([, v]) => v === el)?.[0]; if (!id) return;
    select(el.classList.contains('mate') ? 'mate' : 'place', id);
  });
  const closeCard = () => { sel = null; showCard(); frameHome(); };
  cardSlot.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
    if (act === 'close') closeCard();
    else if (act === 'end') {
      alert(d, { title: L.endTitle, message: L.endMsg, actions: [
        { label: L.cancel, style: 'cancel', preferred: true },
        { label: L.endConfirm, style: 'destructive', run: endNav }] });
    } else if (act === 'walk' && sel?.kind === 'place') startNav(byId[sel.id]);
  });
}

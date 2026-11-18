// 地圖分頁 1.11.0 的介面層（滿版地圖＋底部面板）：map-live.js 與 map-static.js 共用。
// 照 App：ADR-0091／spec.md（地圖滿版、搜尋列與一列圖層晶片浮在上面、分享藥丸、兩顆浮動鈕貼在面板上緣、
// 一塊「中」高度的底部面板：grabber、天數晶片、輪播〔每天一列、待排行程一列〕、「還沒設地點 · N」一行）。
// 字串都是 App 的（Scripts/i18n/maps/Map.json、UI.json）：行程 map.layer.trips、餐廳／咖啡／博物館 map.nearby.*、
// 待排行程 ui.map.carousel.unscheduled、還沒設地點 · N ui.map.placeless.row。
// 版面數字量自實機截圖（agent-notes/map-bottom-panel/ticket-04，iPhone 17 Pro 402×874）：搜尋列 y 72–116、
// 晶片列 y 124–164、分享藥丸 y 169–200、面板「中」＝容器 60%（容器寬大於高的畫面 45%，ADR-0091 §1）。
import { DEV } from './chrome.js';

const STR = {
  'zh-Hant-TW': { trips: '行程', restaurant: '餐廳', cafe: '咖啡', museum: '博物館', unscheduled: '待排行程', placeless: n => `還沒設地點 · ${n}` },
  en: { trips: 'Trip', restaurant: 'Restaurants', cafe: 'Cafés', museum: 'Museums', unscheduled: 'Unscheduled events', placeless: n => `No place yet · ${n}` },
  ja: { trips: '旅程', restaurant: 'レストラン', cafe: 'カフェ', museum: '博物館', unscheduled: '未定の予定', placeless: n => `場所未設定 · ${n}` },
  ko: { trips: '일정', restaurant: '음식점', cafe: '카페', museum: '박물관', unscheduled: '미정 일정', placeless: n => `장소 미설정 · ${n}` },
};

// 幾何（座標都是畫面上的 pt）。iPad 同一塊全寬面板；Duo 橫放（寬大於高）面板 45%、右邊讓出垂直列
export function geom() {
  const landscape = DEV.w > DEV.h;
  const panelH = Math.round(DEV.h * (landscape ? 0.45 : 0.6) * 10) / 10;
  const top = DEV.h - panelH;
  const bar = DEV.bar || 0;
  const searchTop = 72 + DEV.top;
  return { panelH, panelTop: top, searchTop, chipTop: searchTop + 52, liveTop: searchTop + 97, right: bar, fabLeft: DEV.w - bar - 16 - 52,
    fabLoc: top - 16 - 52 };
}

const SLIDERS = '<path d="M6 4v16M12 4v16M18 4v16"/><circle cx="6" cy="14" r="2.2" fill="var(--card)"/><circle cx="12" cy="8" r="2.2" fill="var(--card)"/><circle cx="18" cy="15" r="2.2" fill="var(--card)"/>';
const CAL = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>';

// 1.11.0 起浮動鈕只剩定位（＋鈕在 ADR-0091 C13／C14 刪掉了，放位置模式取代）
// 搜尋列、圖層晶片列、分享藥丸（地圖上面那一疊）。MAKI 是 trip/icons.js 的圖示表（可能還沒載到，沒有就只畫字）
export function topHtml({ lang, searchText, liveText, liveOn, MAKI }) {
  const S = STR[lang] || STR.en, g = geom();
  const mk = id => MAKI?.[id] ? `<svg class="gl" viewBox="0 0 15 15" aria-hidden="true"><path fill-rule="evenodd" d="${MAKI[id]}"/></svg>` : '';
  const pills = [
    `<div class="fpill"><svg class="gl" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAL}</svg>${S.trips}</div>`,
    `<div class="fpill">${mk('restaurant')}${S.restaurant}</div>`, `<div class="fpill">${mk('cafe')}${S.cafe}</div>`, `<div class="fpill">${mk('museum')}${S.museum}</div>`,
  ].join('');
  return `<div class="search" style="top:${g.searchTop}px;right:${20 + g.right}px">${searchText}</div>
    <div class="frow" style="top:${g.chipTop}px;right:${g.right}px"><div class="fbtn"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${SLIDERS}</svg></div>${pills}</div>
    <div class="live${liveOn ? ' on' : ''}" style="top:${g.liveTop}px"><i></i>${liveText}</div>`;
}

// 面板外殼：grabber ＋ 內容（#pbody 由呼叫端換內容）
export function shellHtml() {
  const g = geom();
  return `<div class="panel" id="panel" style="top:${g.panelTop}px;height:${g.panelH + 40}px;right:${g.right}px"><div class="grab"></div><div class="pbody" id="pbody"></div></div>`;
}

const glyphOf = (MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID, cat) => `<svg class="tg" viewBox="0 0 15 15" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="${MAKI[MAKI_OF_TYPE[cat] || DEFAULT_ICON_ID] || MAKI.marker}"/></svg>`;

// 根頁：天數晶片＋輪播＋（全部時）「還沒設地點」。h 是 map-live 的 helper 集：fmt、esc、swatchBase、tap、lang
export function rootHtml({ lang, h, day, chipHtml, trip, routes, places, placelessCount, MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID, dayHeader }) {
  const S = STR[lang] || STR.en;
  const tile = p => {
    const ev = p.ev, grey = p.kind === 'marker' || p.cancelled;
    const fill = grey ? 'var(--muted)' : h.swatchBase(ev.category);
    const time = p.kind === 'event' && ev.start ? `<div class="tm">${h.esc(ev.start)}</div>` : '';
    return `<div class="tcard" data-pid="${p.id}"${h.tap}><div class="tile" style="background:${fill}">${MAKI ? glyphOf(MAKI, MAKI_OF_TYPE, DEFAULT_ICON_ID, ev.category) : ''}</div>
      <div class="tt">${h.fmt(ev.title)}</div>${time}</div>`;
  };
  const row = list => `<div class="trow">${list.map(tile).join('')}</div>`;
  let body = '';
  if (day == null) {
    for (const dd of trip.days) { const list = routes[dd.day] || []; if (list.length) body += `<div class="sh">${dayHeader(dd.day)}</div>${row(list)}`; }
    const pend = places.filter(p => p.kind === 'pending');
    if (pend.length) body += `<div class="sh">${S.unscheduled}</div>${row(pend)}`;
    if (placelessCount > 0) body += `<div class="plr"><span>${S.placeless(placelessCount)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></div>`;
  } else body = row(routes[day] || []);
  return `<div class="pchips" id="chips">${chipHtml()}</div><div class="pscroll">${body}</div>`;
}

// 互動模式（首頁 iPhone 外框裡）跨畫面要記住的東西：在行事曆拖過的時刻、詳情裡按的我不去了／延後／刪除、
// 打勾的待辦、路程選的班次、釘的每日開始／結束行程。**只有 interactive 才讀寫**——截圖模式一個字都不碰。
//
// 存在 sessionStorage（key 前綴 tz-demo:），再用 window.name 分開：首頁上每一支手機各是一個 iframe，同一個
// origin 的 sessionStorage 是共用的，而 window.name 跟著那一個 iframe 走（換頁留著、首頁重新整理就換新的）。
// 路程頁背景那一層行事曆是巢狀 iframe，它的 window.name 是空的——由網址的 sid 帶過去。
import { params } from './chrome.js';

const SID = (() => {
  const given = params.get('sid');
  if (given) return given;
  try {
    if (!/^tzd[a-z0-9]+$/.test(window.name)) window.name = 'tzd' + Math.random().toString(36).slice(2, 9);
    return window.name;
  } catch { return 'tzd'; }
})();
export const sid = SID;
const KEY = `tz-demo:${SID}`;

export function loadState() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveState(s) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 私密視窗等：這一頁照樣能玩，只是不記 */ }
}
/** 改一則行程的覆寫（state.ev[key]），存起來，回傳新的整份 */
export function patchEvent(key, patch) {
  const s = loadState();
  s.ev = s.ev || {};
  s.ev[key] = { ...(s.ev[key] || {}), ...patch };
  saveState(s);
  return s;
}
export function patchState(patch) {
  const s = { ...loadState(), ...patch };
  saveState(s);
  return s;
}

export const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const clock = m => m >= 1440 ? '24:00' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** 把存起來的覆寫套到剛讀進來的範本上（就地改）。 */
export function applyState(trip, s = loadState()) {
  const ev = s.ev || {};
  const deleted = new Set(Object.keys(ev).filter(k => ev[k].deleted));
  for (const day of trip.days) {
    // 刪除＝整筆移除，「附件與相鄰的路程設定會一併移除」（UIStrings.deleteEventMessage）：
    // 下一則掛在它身上的那一段路程（leg.fromKey 指著它）也拿掉。
    day.events = day.events.filter(e => !deleted.has(e.key));
    for (const e of day.events) {
      const o = ev[e.key];
      if (e.leg && deleted.has(e.leg.fromKey)) delete e.leg;
      if (!o) continue;
      if (o.start) e.start = o.start;
      if (o.end) e.end = o.end;
      if ('cancelled' in o) e.isCancelled = o.cancelled;
      if (o.run != null && e.leg && e.leg.runs) e.leg.selectedRunIndex = o.run;
    }
  }
  trip.allDayEvents = trip.allDayEvents.filter(a => !deleted.has(a.key));
  for (const a of trip.allDayEvents) {
    const o = ev[a.key];
    if (!o) continue;
    if ('cancelled' in o) a.isCancelled = o.cancelled;
    if (o.openingDays) a.openingDays = o.openingDays;
    if (o.closingDays) a.closingDays = o.closingDays;
  }
  return trip;
}

/** 待辦：存的是打了勾的那幾條（索引） */
export const doneTodos = (key, s = loadState()) => new Set((s.ev && s.ev[key] && s.ev[key].done) || []);

/**
 * Domain/Model/EventShift.swift `EventShift.from(_:in:by:)`（規則與出處見 assets/js/demos/event-actions.js 檔頭）：
 * 錨點自己也挪，加上同一天開始時刻 ≥ 它的每一則；已取消的不挪；時長不變；只動同一天，延後夾在 24:00、
 * 提前夾在 00:00（`shifted(start:end:by:)`）。events：[{key, start, end, cancelled}]（分鐘），就地改。
 */
export function shiftFrom(anchor, events, minutes) {
  let moved = 0, clamped = 0, blocked = 0;
  if (!minutes || anchor.cancelled) return { moved, clamped, blocked };
  const from = anchor.start;
  for (const e of events) {
    if (e.cancelled || e.start < from) continue;
    const lowest = -e.start;
    const highest = e.end <= 1440 ? 1440 - e.end : Math.max(1440 - 1 - e.start, 0);
    const allowed = Math.min(Math.max(minutes, Math.min(lowest, 0)), Math.max(highest, 0));
    if (!allowed) { blocked++; continue; }
    if (allowed !== minutes) clamped++;
    e.start += allowed; e.end += allowed; moved++;
  }
  return { moved, clamped, blocked };
}

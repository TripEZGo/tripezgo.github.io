// 互動模式：「行事曆高度」——行事曆與時間軸兩頁共用的雙指縮放（只在 interactive 用，截圖模式永遠是 1 倍）。
//
// App：TripCalendar/CalendarZoom.swift、TripCalendarView（handlePinch／endPinch／PinchZoomBadge）、
// DayView.setZoom、TimelineAxis（2026-10-11 起時間軸也吃這個倍率，be815dfb5）。
// - 八格 [1, 1.5, 2, 3, 4, 6, 8, 10]，1 倍＝預設＝最小。捏的過程連續，放手吸到**對數上最近**的一格（0.2 秒 ease-out）。
// - 過了 1 倍或 10 倍有阻力：超出那一段在對數上換成 L·(1 − e^(−x/L))，L = ln(1.15)（最多再拉 15%）。
// - 中點那一分鐘留在手指底下（CalendarZoomAnchor）。
// - 捏的時候格線頂端下 13pt 正中間一顆「N 倍」膠囊（深底 88%、白字、13pt 粗體等寬數字、內距 5／14.5），放手 0.6 秒後淡出。
// - 它是一個設定：全 App 一個值。這裡存在 demo-state 那一份（state.zoom），行事曆↔時間軸換頁留著。
// 網頁上的輸入：觸控兩指（touch 事件）；觸控板捏合（Chrome／Firefox 的 ctrl+wheel、Safari 的 gesture 事件）。
import { loadState, patchState } from './demo-state.js';
import { lang } from './chrome.js';

export const FACTORS = [1, 1.5, 2, 3, 4, 6, 8, 10];
const MIN = FACTORS[0], MAX = FACTORS[FACTORS.length - 1], LIMIT = Math.log(1.15);

export const nearest = raw => {
  const t = Math.log(Math.max(raw, 1e-6));
  return FACTORS.reduce((a, b) => (Math.abs(Math.log(b) - t) < Math.abs(Math.log(a) - t) ? b : a));
};
export const resisted = raw => {
  const band = x => LIMIT * (1 - Math.exp(-x / LIMIT));
  if (raw > MAX) return MAX * Math.exp(band(Math.log(raw / MAX)));
  if (raw < MIN) return MIN / Math.exp(band(Math.log(MIN / Math.max(raw, 1e-6))));
  return raw;
};
export const loadZoom = () => nearest(+(loadState().zoom || 1));
const saveZoom = f => patchState({ zoom: f });

// UI.json calendarZoomValue「%@ 倍」
const factorText = f => ({ en: `${f}×`, ko: `${f}배` }[lang] || `${f} 倍`);

/**
 * 接上雙指縮放。
 * @param el      收手勢的那一塊（格線那一個捲動容器）
 * @param device  畫膠囊的那一層（.device）
 * @param opts.get()                         現在的倍率
 * @param opts.set(factor, viewY)            換成這個倍率，畫面上 viewY 那一點（相對 el 的頂端）的那一分鐘不動
 * @param opts.begin(viewY)                  開始捏：記下中點那一分鐘
 * @param opts.canBegin(target)              拖曳已經拿起來時不開始（先開始的那一個贏）
 */
export function attachPinch(el, device, { get, set, begin, canBegin = () => true }) {
  const badge = document.createElement('div');
  badge.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);z-index:45;pointer-events:none;'
    + 'padding:5px 14.5px;border-radius:99px;background:rgba(31,25,20,.88);color:#fff;'
    + 'font:700 13px/16px var(--font);font-variant-numeric:tabular-nums;white-space:nowrap;opacity:0;transition:opacity .15s';
  device.appendChild(badge);
  let hideTimer = null, snapRaf = null, pinch = null, level = null;
  const showBadge = f => {
    clearTimeout(hideTimer);
    badge.style.top = (el.getBoundingClientRect().top - device.getBoundingClientRect().top + 13) + 'px';
    badge.textContent = factorText(f);
    badge.style.transition = 'none'; badge.style.opacity = '1';
  };
  const hideBadgeLater = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { badge.style.transition = 'opacity .15s'; badge.style.opacity = '0'; }, 600);
  };
  const vy = clientY => clientY - el.getBoundingClientRect().top;

  function start(clientY) {
    if (snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; }
    const f = get();
    pinch = { from: f, factor: f, viewY: vy(clientY), limitBuzzed: false };
    level = nearest(f);
    begin(pinch.viewY);
    showBadge(level);
  }
  function update(scale, clientY) {
    if (!pinch) return;
    const prev = pinch.factor;
    const f = resisted(pinch.from * scale);
    pinch.factor = f; pinch.viewY = vy(clientY);
    set(f, pinch.viewY);
    const now = nearest(f);
    if (now !== level) { level = now; showBadge(now); try { navigator.vibrate?.(4); } catch { /* 不支援 */ } }
    if (!pinch.limitBuzzed && ((f >= MAX && f > prev) || (f <= MIN && f < prev))) {
      pinch.limitBuzzed = true; try { navigator.vibrate?.(8); } catch { /* 不支援 */ }
    }
  }
  function end() {
    if (!pinch) return;
    const { factor: from, viewY } = pinch;
    pinch = null;
    const to = nearest(from);
    saveZoom(to);
    hideBadgeLater();
    if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { set(to, viewY); return; }
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / 200), eased = 1 - (1 - t) ** 3;
      set(t >= 1 ? to : from + (to - from) * eased, viewY);
      snapRaf = t < 1 ? requestAnimationFrame(step) : null;
    };
    snapRaf = requestAnimationFrame(step);
  }

  // 觸控：兩指
  let d0 = 0;
  const dist = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
  const mid = ts => (ts[0].clientY + ts[1].clientY) / 2;
  el.addEventListener('touchstart', e => {
    if (e.touches.length === 2 && !pinch && canBegin(e.target)) { d0 = dist(e.touches) || 1; start(mid(e.touches)); }
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (!pinch || e.touches.length < 2) return;
    if (e.cancelable) e.preventDefault();
    update(dist(e.touches) / d0, mid(e.touches));
  }, { passive: false });
  const touchEnd = e => { if (pinch && e.touches.length < 2) end(); };
  el.addEventListener('touchend', touchEnd);
  el.addEventListener('touchcancel', touchEnd);

  // 觸控板：ctrl+wheel（Chrome、Firefox、Edge 把捏合送成這個）
  let wheelScale = 1, wheelEnd = null;
  el.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (!pinch) { if (!canBegin(e.target)) return; wheelScale = 1; start(e.clientY); }
    wheelScale *= Math.exp(-e.deltaY / 100);
    update(wheelScale, e.clientY);
    clearTimeout(wheelEnd); wheelEnd = setTimeout(end, 180);
  }, { passive: false });
  // Safari 的捏合
  el.addEventListener('gesturestart', e => { e.preventDefault(); if (!pinch && canBegin(e.target)) start(e.clientY); });
  el.addEventListener('gesturechange', e => { e.preventDefault(); update(e.scale, e.clientY); });
  el.addEventListener('gestureend', e => { e.preventDefault(); end(); });

}

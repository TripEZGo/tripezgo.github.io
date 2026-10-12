// 互動模式：行事曆待排區拖進時段之後，那一則「排進了哪一天幾點」（總覽、行事曆、時間軸三頁共用）。
// 存在 demo-state.js 那一份裡（state.placed，同一個 window.name 分開的 sessionStorage），截圖模式不讀不寫。
//
// App：TripCalendarViewModel+Pending.schedulePending —— 放開就把那一則寫成「這一天 開始 … 開始 + 預計長度」，
// 時區是主要時區；預計長度 0 當一小時（pendingLength / EventWhen.defaultDurationMinutes）。排好之後它就不再是待排：
// 從每一天的「未指定日」那一列消失、也從總覽的「待排行程」消失。
import { loadState, patchState, clock } from './demo-state.js';

export const pendingLength = u => (u.durationMinutes > 0 ? u.durationMinutes : 60);

/** 把存起來的「排進了哪裡」套到剛讀進來的範本上（就地改）。要在 demo-state 的 applyState 之前呼叫：
 *  排好之後在行事曆上再拖動它，那一份時刻覆寫（state.ev）才套得上。 */
export function applyPlaced(trip, s = loadState()) {
  const placed = s.placed || {};
  trip.unscheduledEvents = (trip.unscheduledEvents || []).filter(u => {
    const p = placed[u.key];
    const day = p && trip.days.find(d => d.day === p.day);
    if (!day) return true;
    day.events.push({ ...u, start: clock(p.start), end: clock(p.end), placed: true });
    return false;
  });
  return trip;
}

/** 記下一則待排排進了哪一天幾點（分鐘）。 */
export function placePending(key, day, start, end) {
  const s = loadState();
  patchState({ placed: { ...(s.placed || {}), [key]: { day, start, end } } });
}

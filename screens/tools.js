// 小工具分頁（筆記／掃描／匯率換算／購物清單）四支畫面共用的互動零件。只在互動模式（interactive）下用。
//
// - subTabs：抬頭底下那條四格切換（App：SubTabContainerViewController）——點一格，白色那顆滑過去，再換畫面。
// - remember：跨畫面要記住的狀態放 sessionStorage（tz-demo: 前綴，INTERACTIVE.md 第 5 條）。
// - alert：UIAlertController(.alert)。購物「退回待購買？」用（ShoppingCardViewController.confirmUnbought）。
// - sheet：由下而上的頁面紙（.pageSheet，大 detent）——抓桿、往下拖或點後面那一層收掉。
// 外觀照 event.html 已量好的系統 sheet（頂 62、圓角 12、抓桿 36×5）。
import { go } from './chrome.js';

export const SUB_PAGES = ['notes', 'scan', 'fx', 'shop'];

const CSS = `
.is-interactive .seg-t { cursor: pointer; }
.is-interactive .seg-pill { transition: left .28s cubic-bezier(.3,.7,.2,1); }
.tz-dim { position: absolute; inset: 0; z-index: 44; background: rgba(0,0,0,0); transition: background .3s; }
.tz-dim.on { background: rgba(0,0,0,.28); }
.tz-sheet { position: absolute; left: 0; right: 0; top: 62px; bottom: 0; z-index: 45; background: var(--page);
  border-radius: 12px 12px 0 0; overflow: hidden; transform: translateY(100%); transition: transform .34s cubic-bezier(.2,.8,.2,1);
  box-shadow: 0 -2px 18px rgba(0,0,0,.08); touch-action: none; }
.tz-sheet.on { transform: none; }
.tz-sheet.drag { transition: none; }
.tz-sheet .tz-grab { position: absolute; left: 183px; top: 5px; width: 36px; height: 5px; border-radius: 2.5px; background: #c1c1c3; z-index: 3; }
.tz-alert-wrap { position: absolute; inset: 0; z-index: 48; display: grid; place-items: center; background: rgba(0,0,0,0); transition: background .2s; }
.tz-alert-wrap.on { background: rgba(0,0,0,.2); }
.tz-alert { width: 300px; border-radius: 34px; background: rgba(255,255,255,.97); padding: 22px 18px 16px; text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,.18); transform: scale(1.12); opacity: 0; transition: transform .22s, opacity .2s; }
.tz-alert-wrap.on .tz-alert { transform: none; opacity: 1; }
.tz-alert b { display: block; font: 600 17px/22px var(--font); color: #000; }
.tz-alert p { margin-top: 6px; font: 400 15px/20px var(--font); color: #3c3c43; }
.tz-alert .acts { margin-top: 18px; display: flex; gap: 10px; }
.tz-alert .acts span { flex: 1; height: 48px; border-radius: 24px; background: rgba(120,120,128,.14); display: grid; place-items: center;
  font: 500 17px/20px var(--font); color: #000; cursor: pointer; padding: 0 8px; }
.tz-alert .acts span.pref { font-weight: 600; }
.tz-alert .acts span.destr { color: #e5372b; }
.tz-alert .acts span:active { background: rgba(120,120,128,.26); }
`;
let styled = false;
export function style() {
  if (styled) return; styled = true;
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
}

/** 抬頭那條四格切換：點了白色那顆滑過去，滑完換到那一格的畫面。 */
export function subTabs(device, current) {
  style();
  const pill = device.querySelector('.seg-pill');
  device.querySelectorAll('.seg-t').forEach((el, i) => {
    el.dataset.tap = '';
    el.addEventListener('click', () => {
      if (i === current) return;
      pill.style.left = `${2 + i * 90.3}px`;
      device.querySelectorAll('.seg-t').forEach((t, k) => t.classList.toggle('on', k === i));
      setTimeout(() => go(SUB_PAGES[i]), 220);
    });
  });
}

/** sessionStorage：讀不到（私密視窗、被擋）就當作沒有，照樣能用。 */
export function remember(key, fallback) {
  const k = `tz-demo:${key}`;
  let value = fallback;
  try { const raw = sessionStorage.getItem(k); if (raw) value = JSON.parse(raw); } catch { /* 用預設 */ }
  return {
    get: () => value,
    set: (v) => { value = v; try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* 只活在這一頁 */ } },
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** UIAlertController(.alert)：actions = [{ label, style: 'cancel'|'destructive'|'default', preferred, run }] */
export function alert(device, { title, message, actions }) {
  style();
  const wrap = document.createElement('div');
  wrap.className = 'tz-alert-wrap';
  wrap.innerHTML = `<div class="tz-alert" role="alertdialog"><b>${esc(title)}</b>${message ? `<p>${esc(message)}</p>` : ''}
    <div class="acts">${actions.map((a, i) => `<span data-i="${i}" class="${a.style === 'destructive' ? 'destr' : ''}${a.preferred ? ' pref' : ''}">${esc(a.label)}</span>`).join('')}</div></div>`;
  device.append(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('on')));
  wrap.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
    wrap.classList.remove('on');
    setTimeout(() => wrap.remove(), 200);
    actions[+b.dataset.i].run?.();
  }));
}

/**
 * 頁面紙（.pageSheet、large detent）。html 是紙裡的內容；回傳 { el, close }。
 * 收法：往下拖超過 110pt（或甩一下）、點後面那一層。onClose 在收完之後叫。
 */
export function sheet(device, html, { onClose } = {}) {
  style();
  const dim = document.createElement('div');
  dim.className = 'tz-dim';
  const el = document.createElement('div');
  el.className = 'tz-sheet';
  el.innerHTML = `<div class="tz-grab"></div>${html}`;
  device.append(dim, el);
  requestAnimationFrame(() => requestAnimationFrame(() => { dim.classList.add('on'); el.classList.add('on'); }));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    el.classList.remove('drag', 'on'); el.style.transform = '';
    dim.classList.remove('on');
    setTimeout(() => { dim.remove(); el.remove(); onClose?.(); }, 340);
  };
  dim.addEventListener('click', close);
  // 往下拖：從紙的上緣那一段（抓桿＋導覽列，前 60pt）或紙裡捲到頂的時候
  let y0 = null, t0 = 0, dy = 0;
  el.addEventListener('pointerdown', (e) => {
    const top = el.getBoundingClientRect().top;
    const scale = el.getBoundingClientRect().height / el.offsetHeight || 1;
    if ((e.clientY - top) / scale > 60 || e.target.closest('[data-tap],button,input')) return;
    y0 = e.clientY; t0 = performance.now(); dy = 0; el.classList.add('drag'); el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    const scale = el.getBoundingClientRect().height / el.offsetHeight || 1;
    dy = Math.max(0, (e.clientY - y0) / scale);
    el.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (y0 === null) return;
    const fast = dy / Math.max(1, performance.now() - t0) > .5;
    y0 = null; el.classList.remove('drag');
    if (dy > 110 || (fast && dy > 30)) close(); else el.style.transform = '';
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  return { el, close };
}

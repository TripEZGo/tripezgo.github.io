// 「資料」分頁（1.3.0 起；原「小工具」）的畫面共用零件。
// App：TripEZGo/App/WidgetsTabCoordinator.swift ＋ Modules/Widgets/…/LibraryViewModel.swift ＋
//      UI/…/Foundation/SubTabContainer.swift（抬頭、右上工具鈕、兩格切換）。
// 分格只剩 筆記／購物清單；掃描與匯率換算收進抬頭右上那顆工具鈕 → 「挑一個」的紙（MenuSheetViewController）
// → 掃描器（滿版，scan.html）或匯率換算 modal（fx.html）。設計稿 ui-card-v130.html 第 1–5 節。
//
// - libraryHead：抬頭「資料」＋右上工具鈕（HeadIconButton，工具箱）＋兩格切換。截圖模式與互動模式同一份（notes／shop）。
// - toolsMenu：「工具」那張挑一個的紙。notes.html／shop.html 帶 menu=1 時一進來就開著（截圖用）。
// - closeX：清單紙導覽列右上那顆 ✕（SheetCloseButton：36 的 tzSunken 圓、16 的 ✕、accentInk、筆畫 2.2）。
// 以下只在互動模式（interactive）下用：
// - subTabs：抬頭底下那條切換（SubTabContainerViewController）——點一格，白色那顆滑過去，再換畫面。
// - remember：跨畫面要記住的狀態放 sessionStorage（tz-demo: 前綴，INTERACTIVE.md 第 5 條）。
// - alert：UIAlertController(.alert)。購物「退回待購買？」用（ShoppingCardViewController.confirmUnbought）。
// - sheet：由下而上的頁面紙（.pageSheet，大 detent）——抓桿、往下拖或點後面那一層收掉。
// 外觀照 event.html 已量好的系統 sheet（頂 62、圓角 12、抓桿 36×5）。
import { go, lang, interactive, params, ipad } from './chrome.js';
import { IS } from './inspiration-strings.js';

/** 三格（LibraryViewModel.Subtab：inspiration、notes、shopping，1.4.0 起靈感在第一格），順序就是分格的順序 */
export const SUB_PAGES = ['inspiration', 'notes', 'shop'];

// App 的字（Scripts/i18n/maps/Widgets.json：widgets.tab.title、subtab.*、tools.*、scan.card.*）
export const LIB = {
  'zh-Hant-TW': { title: '資料', subs: [IS['zh-Hant-TW']['widgets.subtab.inspiration'], '筆記', '購物清單'], tools: '工具',
    scan: '掃描 QR Code', scanSub: '網址、文字，或旅程的共編邀請', fx: '匯率換算', fxSub: '兩種貨幣互換，兩邊的金額都能打', close: '關閉' },
  en: { title: 'Library', subs: [IS.en['widgets.subtab.inspiration'], 'Notes', 'Shopping'], tools: 'Tools',
    scan: 'Scan a QR Code', scanSub: 'Links, text, or a trip invite', fx: 'Currency Converter', fxSub: 'Convert between two currencies — type in either amount', close: 'Close' },
  ja: { title: '資料', subs: [IS.ja['widgets.subtab.inspiration'], 'メモ', '買い物'], tools: 'ツール',
    scan: 'QR コードをスキャン', scanSub: 'URL、テキスト、旅行の共同編集の招待', fx: '通貨換算', fxSub: '2 つの通貨を相互に換算。どちらの金額も入力できます', close: '閉じる' },
  ko: { title: '자료', subs: [IS.ko['widgets.subtab.inspiration'], '메모', '쇼핑'], tools: '도구',
    scan: 'QR 코드 스캔', scanSub: '링크, 텍스트 또는 여행 공동 편집 초대', fx: '환율 변환', fxSub: '두 통화를 서로 환산하고, 양쪽 금액 모두 입력할 수 있습니다', close: '닫기' },
}[lang] || null;
const L = LIB || {};

// DesignIcon.swift：toolbox（IC.toolA，1.3.0 新畫，筆畫 1.8）、scan（1.7）、swapArrows（2）、close（2）
export const LIB_ICON = {
  toolbox: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6v1.9"/><path d="M3 12.5h6.5M14.5 12.5H21"/><rect x="9.5" y="11" width="5" height="3.2" rx=".8"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><rect x="7.5" y="7.5" width="3.5" height="3.5" rx=".6"/><rect x="13" y="7.5" width="3.5" height="3.5" rx=".6"/><rect x="7.5" y="13" width="3.5" height="3.5" rx=".6"/><path d="M13 13h1.5v1.5M16.5 16.5H15"/>',
  swapArrows: '<path d="M7 4v16l-3-3M17 20V4l3 3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const icon = (n, w) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="stroke-width:${w}">${LIB_ICON[n]}</svg>`;

// 分格切換的幾何（iOS 26 UISegmentedControl，系統元件）：四格時量到的白色那顆寬 86.7、間距 3.6、左右各 2——
// 三格（1.4.0 起）照同一組數字：寬 (362 − 4 − 2 × 3.6) ÷ 3 ＝ 116.93、一格一步 120.53
// iPad：軌道 992 寬（左右照舊 20），同一條式子 → (992 − 4 − 7.2) ÷ 3 ＝ 326.93、一步 330.53
const SEG_W = ipad ? 326.93 : 116.93, SEG_STEP = ipad ? 330.53 : 120.53;
const segLeft = i => 2 + i * SEG_STEP;

/* 抬頭（SubTabContainer：上 12+2、左右 20、標題 xxl semibold −0.02em；切換列上 4+6、高 ≥44）＋
   右上工具鈕（HeadIconButton：44 命中、23 圖示、墨色、無底；top＝安全區 62＋12−4、trailing＝20−8，同總覽的分享鈕 346／70） */
const LIB_CSS = `
@font-face { font-family: "TZTitleCJK"; src: local("PingFangTC-Semibold"), local("PingFang TC Semibold"); font-weight: 600;
  unicode-range: U+3000-30FF, U+3400-9FFF, U+FF00-FFEF; size-adjust: 95%; }
.wg-title { position: absolute; left: 20px; right: 102px; top: 75.4px; font: 600 var(--t-xxl)/34px var(--font); letter-spacing: -.56px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
html[lang^="zh"] .wg-title { font-family: "TZTitleCJK", var(--font); }
.head-tool { position: absolute; left: 346px; top: 70px; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: var(--ink); z-index: 2; }
.head-tool svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.seg { position: absolute; left: 20px; width: 362px; top: 119.67px; height: 45px; border-radius: 22.5px; background: var(--sys-seg-bg); }
.seg-pill { position: absolute; top: 2.33px; height: 40.33px; width: ${SEG_W}px; border-radius: 20.2px; background: var(--sys-seg-pill);
  box-shadow: 0 0 0 .5px rgba(0,0,0,.03), 0 2px 6px rgba(0,0,0,.04); }
.seg-t { position: absolute; top: 0; height: 45px; width: ${SEG_W}px; display: grid; place-items: center;
  font: 400 var(--t-sm)/16px var(--font); color: var(--sys-seg-ink); white-space: nowrap; box-sizing: border-box; padding: 0 8px; }
.seg-t > span { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }   /* UISegmentedControl：塞不下的格名收成 … */
.seg-t.on { font-weight: 700; color: var(--ink); }
.is-interactive .head-tool { cursor: pointer; } .is-interactive .head-tool:active { background: var(--surface); }
/* 「工具」挑一個的紙（MenuSheetViewController）：custom detent＝貼內容高、iOS 26 浮動紙四邊內縮 8、圓角 Radius.lg 12、抓桿；
   內容 安全區上緣＋16、左右 20；抬頭 base semibold、之後 12；一列 上下 12 左右 4、最矮 56、圖示 20（muted）、間距 12、
   標題 base ink＋副標 xs muted（間 1）；兩列之間一條 border-soft，從 32 起畫 */
.tz-menu-dim { position: absolute; inset: 0; z-index: 44; background: var(--sys-dim); }
.tz-menu { position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 45; background: var(--page); border-radius: 12px;
  box-shadow: 0 0 30px rgba(0,0,0,.1); padding: 20px 20px 26px; }
.tz-menu .tz-grab { position: absolute; left: 50%; margin-left: -18px; top: 5px; width: 36px; height: 5px; border-radius: 2.5px; background: var(--sys-grab); }
.tz-menu h3 { font: 600 var(--t-base)/18px var(--font); color: var(--ink); margin-bottom: 12px; }
.tz-menu .tz-mrow { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 4px; }
.tz-menu .tz-mrow { position: relative; }
.tz-menu .tz-mrow + .tz-mrow::before { content: ""; position: absolute; left: 32px; right: 0; top: 0; border-top: 1px solid var(--border-soft); }
.tz-menu .tz-mrow svg { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--muted); stroke-linecap: round; stroke-linejoin: round; }
.tz-menu .tz-mrow b { display: block; font: 400 var(--t-base)/18px var(--font); color: var(--ink); }
.tz-menu .tz-mrow span span { display: block; margin-top: 1px; font: 400 var(--t-xs)/14.3px var(--font); color: var(--muted); }
.is-interactive .tz-menu .tz-mrow { cursor: pointer; border-radius: 10px; } .is-interactive .tz-menu .tz-mrow:active { background: var(--surface); }
.is-interactive .tz-menu-dim { transition: opacity .3s; } .tz-menu-dim.off { opacity: 0; }
.is-interactive .tz-menu { transition: transform .34s cubic-bezier(.2,.8,.2,1); } .tz-menu.off { transform: translateY(110%); }
/* SheetCloseButton（清單紙導覽列右上那顆 ✕）：36 的 tzSunken 圓、✕ 16、accentInk、筆畫 2.2；iOS 26 的共用玻璃底關掉 */
.tz-x { position: absolute; width: 36px; height: 36px; border-radius: 50%; background: var(--sunken); display: grid; place-items: center; color: var(--accent-ink); }
.tz-x svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
.is-interactive .tz-x { cursor: pointer; }
/* 導覽列標題（系統，17 semibold；sheet 頂下 16、高 44） */
.tz-navt { position: absolute; left: 70px; right: 70px; top: 16px; height: 44px; display: grid; place-items: center;
  font: 600 17px/22px var(--font); color: var(--sys-label); white-space: nowrap; overflow: hidden; }
/* iPad（?device=ipad）：抬頭往下 34、拉寬（擷取 05：標題中線 127、切換列 155–197，跟 iPhone 各 +34） */
.ipad .wg-title { top: 109.4px; }
.ipad .head-tool { left: 976px; top: 104px; }
.ipad .seg { top: 153.67px; width: 992px; }
`;
let libStyled = false;
export function libStyle() {
  if (libStyled) return; libStyled = true;
  document.head.insertAdjacentHTML('beforeend', `<style>${LIB_CSS}</style>`);
}
export const closeX = (cls = '') => `<div class="tz-x ${cls}" role="button" aria-label="${L.close}" data-tap>${icon('close', 2.2)}</div>`;

/** 抬頭「資料」＋右上工具鈕＋兩格切換（current＝0 靈感／1 筆記／2 購物清單）。截圖模式也畫。 */
export function libraryHead(device, current) {
  libStyle();
  device.insertAdjacentHTML('beforeend', `<div class="wg-title">${L.title}</div>
    <div class="head-tool" role="button" aria-label="${L.tools}" data-tap>${icon('toolbox', 1.8)}</div>
    <div class="seg"><div class="seg-pill" style="left:${segLeft(current)}px"></div>
    ${L.subs.map((x, i) => `<div class="seg-t${i === current ? ' on' : ''}" style="left:${segLeft(i)}px"><span>${x}</span></div>`).join('')}</div>`);
  // 截圖：帶 menu=1 就畫成「點了工具鈕」那一刻（紙開著）
  if (params.get('menu') === '1') toolsMenu(device, { from: SUB_PAGES[current], instant: true });
  if (interactive) device.querySelector('.head-tool').addEventListener('click', () => toolsMenu(device, { from: SUB_PAGES[current] }));
}

/**
 * 「工具」挑一個的紙（LibraryViewModel.tools：掃描在上、匯率在下，不記上次挑的）。
 * 點一列：紙先收完（MenuSheetViewController 的規矩），接著開掃描器（scan.html，滿版）或匯率 modal（fx.html）。
 * 往下拉、點外面都只是收掉。
 */
export function toolsMenu(device, { from = 'notes', instant = false } = {}) {
  libStyle();
  if (device.querySelector('.tz-menu')) return;
  const dim = document.createElement('div'), el = document.createElement('div');
  dim.className = 'tz-menu-dim'; el.className = 'tz-menu';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', L.tools);
  el.innerHTML = `<div class="tz-grab"></div><h3>${L.tools}</h3>
    <div class="tz-mrow" data-tool="scan" data-tap>${icon('scan', 1.7)}<span><b>${L.scan}</b><span>${L.scanSub}</span></span></div>
    <div class="tz-mrow" data-tool="fx" data-tap>${icon('swapArrows', 2)}<span><b>${L.fx}</b><span>${L.fxSub}</span></span></div>`;
  if (!instant) { dim.classList.add('off'); el.classList.add('off'); }
  device.append(dim, el);
  if (!instant) requestAnimationFrame(() => requestAnimationFrame(() => { dim.classList.remove('off'); el.classList.remove('off'); }));
  if (!interactive) return;
  let closed = false;
  const close = (then) => {
    if (closed) return; closed = true;
    dim.classList.add('off'); el.classList.add('off');
    setTimeout(() => { dim.remove(); el.remove(); then?.(); }, 340);
  };
  dim.addEventListener('click', () => close());
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]')?.dataset.tool; if (!t) return;
    close(() => go(t, `from=${from}`));
  });
  // 往下拉收掉
  let y0 = null, dy = 0;
  el.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-tool]')) return; y0 = e.clientY; dy = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
  el.addEventListener('pointermove', (e) => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 === null) return; y0 = null; el.style.transition = ''; el.style.transform = ''; if (dy > 60) close(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

const CSS = `
.is-interactive .seg-t { cursor: pointer; }
.is-interactive .seg-pill { transition: left .28s cubic-bezier(.3,.7,.2,1); }
.tz-dim { position: absolute; inset: 0; z-index: 44; background: rgba(0,0,0,0); transition: background .3s; }
.tz-dim.on { background: var(--sys-dim-on); }
.tz-sheet { position: absolute; left: 0; right: 0; top: 62px; bottom: 0; z-index: 45; background: var(--page);
  border-radius: 12px 12px 0 0; overflow: hidden; transform: translateY(100%); transition: transform .34s cubic-bezier(.2,.8,.2,1);
  box-shadow: 0 -2px 18px rgba(0,0,0,.08); touch-action: none; }
.tz-sheet.on { transform: none; }
.tz-sheet.drag { transition: none; }
.tz-sheet .tz-grab { position: absolute; left: 183px; top: 5px; width: 36px; height: 5px; border-radius: 2.5px; background: var(--sys-grab); z-index: 3; }
.tz-alert-wrap { position: absolute; inset: 0; z-index: 48; display: grid; place-items: center; background: rgba(0,0,0,0); transition: background .2s; }
.tz-alert-wrap.on { background: var(--sys-dim); }
.tz-alert { width: 300px; border-radius: 34px; background: var(--sys-alert-bg); padding: 22px 18px 16px; text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,.18); transform: scale(1.12); opacity: 0; transition: transform .22s, opacity .2s; }
.tz-alert-wrap.on .tz-alert { transform: none; opacity: 1; }
.tz-alert b { display: block; font: 600 17px/22px var(--font); color: var(--sys-label); }
.tz-alert p { margin-top: 6px; font: 400 15px/20px var(--font); color: var(--sys-label-2); }
.tz-alert .acts { margin-top: 18px; display: flex; gap: 10px; }
.tz-alert .acts span { flex: 1; height: 48px; border-radius: 24px; background: var(--sys-alert-btn); display: grid; place-items: center;
  font: 500 17px/20px var(--font); color: var(--sys-label); cursor: pointer; padding: 0 8px; }
.tz-alert .acts span.pref { font-weight: 600; }
.tz-alert .acts span.destr { color: var(--sys-red); }
.tz-alert .acts span:active { background: var(--sys-alert-btn-on); }
`;
let styled = false;
export function style() {
  if (styled) return; styled = true;
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
}

/** 抬頭那條兩格切換：點了白色那顆滑過去，滑完換到那一格的畫面。 */
export function subTabs(device, current) {
  style();
  const pill = device.querySelector('.seg-pill');
  device.querySelectorAll('.seg-t').forEach((el, i) => {
    el.dataset.tap = '';
    el.addEventListener('click', () => {
      if (i === current) return;
      pill.style.left = `${segLeft(i)}px`;
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

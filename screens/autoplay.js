// 自動操作示範：首頁外框裡的每支手機自己照腳本點、拖、打字，像有人在操作。
//
// 網址帶 auto=<故事名>（首頁 home.js 加；截圖工具不加）。故事在 screens/stories.js：
//   STORIES[name] = [ { page:'calendar', tap:'.ev[data-key="d2-ferry"]' }, { wait: 800 }, ... ]
// 每一步之間固定停 GAP（500ms）。跨頁的步驟（點了會 go() 換頁）會把進度存進 sessionStorage，
// 新頁載入後從下一步接著做；step.page 寫明那一步該在哪一頁，不對就先等頁面換過來。
// 一輪做完：清掉這支手機自己的狀態、回到起始網址，從頭再來。
//
// 暫停：滑鼠移上首頁那支手機會出現暫停鈕（home.js 畫在外框上，postMessage 進來）；使用者自己動手
// （isTrusted 的 pointerdown）也會暫停並通知外框。手機捲出畫面時外框也會送 pause。
//
// 步驟：
//   { tap: sel }                         點一下（觸控圓點＋click）
//   { press: sel, hold: 600 }            按住（長按）
//   { drag: sel, dx: 0, dy: 66, hold: 450, ms: 600 }   按住後拖（pointer 事件，給可拖的元件用）
//   { swipe: sel, dx: -200, dy: 0, ms: 350 }           快滑（不按住）
//   { type: sel, text: '1500' }          逐字輸入（每字 120ms）
//   { scroll: sel, by: 200 }             捲動容器
//   { wait: ms }                         多停一下
//   { call: 'name' }                     呼叫頁面掛在 window.__auto[name] 的函式（真的沒辦法用點的時候才用）
// 所有選擇器都在這支 iframe 的 document 裡找；找不到就等最多 2 秒，再找不到跳過這一步。
const { STORIES, INPLACE } = await import('./stories.js' + new URL(import.meta.url).search);   // 版本號一路帶下去

const GAP = 500;
const params = new URLSearchParams(location.search);
const story = params.get('auto');
const steps = STORIES[story] || [];
// fast=1（App 內的示範，殼 tools/app-demos-shell.html 帶；首頁不帶，照舊）：出現就開始播、每一步之間一律 500ms。
// 開場不等、開頭只有 wait 的步驟跳過；其餘 wait 都收成 500ms，只有標了 keep:true 的（等動畫跑完／等讀完網址）照原值。
const FAST = params.get('fast') === '1';
const wms = (s) => FAST && !s.keep ? Math.min(s.wait, GAP) : s.wait;
let lead = 0;
if (FAST) while (lead < steps.length && steps[lead].wait && !steps[lead].tap && !steps[lead].call && !steps[lead].press && !steps[lead].drag && !steps[lead].swipe && !steps[lead].type && !steps[lead].scroll) lead++;
const KEY = `tz-auto:${window.name || story}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let stepNo = 0;
let atStop = false;   // 停在某一頁的結尾：只有 step:true 的 play 才放得走（一般的 play 可能是殼先前送出、這時才到的）
// 進度回報給首頁（外框底下的進度條，使用者 2026-10-12）。照每一步「大概要多久」算，條才會跟著動畫等速走：
// 每一步開始時送 from→to 跟這一步的毫秒數，首頁那邊用線性動畫補；暫停時送 hold，條停在原地。
const est = (s) => (s.wait ? wms(s) : 0) + (s.call || s.wait ? 0 : 420) + (s.tap ? 380 : 0) + (s.press ? s.hold || 600 : 0)
  + (s.drag || s.swipe ? (s.swipe ? 0 : s.hold ?? 450) + (s.ms || (s.swipe ? 350 : 650)) : 0)
  + (s.type ? 120 * s.text.length : 0) + (s.scroll ? 450 : 0) + GAP;
const END = 1500, cum = steps.reduce((a, s) => (a.push(a.at(-1) + est(s)), a), [0]), total = cum.at(-1) + END;
const progress = (data) => parent.postMessage({ type: 'tz-auto-progress', ...data }, '*');
const stepProgress = (i) => progress({ from: cum[i] / total, to: (i < steps.length ? cum[i + 1] : total) / total, ms: i < steps.length ? est(steps[i]) : END });

// 一開始是停著的：首頁確認這支手機捲進畫面（35% 以上）才送 play 過來；捲出去送 pause
let paused = true, waiters = [];
const untilPlaying = () => paused ? new Promise((r) => waiters.push(r)) : Promise.resolve();
// 外框帶 anims 的暫停：畫面裡正在跑的 CSS 動畫與轉場也停住、繼續時只放開剛才被停住的（引導頁長按暫停，ADR-0050）。
// 跨來源的外框碰不到這一頁的 document，所以由這一頁自己做。
let heldAnims = [], animsHold = false;
function holdAnimations(on) {
  if (!on) { heldAnims.forEach((a) => { try { a.play(); } catch {} }); heldAnims = []; return; }
  for (const a of document.getAnimations()) if (a.playState === 'running') { a.pause(); heldAnims.push(a); }
}
function setPaused(p, tell = true) {
  paused = p;
  progress(p ? { hold: true } : {});
  if (!p) { waiters.splice(0).forEach((r) => r()); }
  if (tell) parent.postMessage({ type: 'tz-auto', paused: p }, '*');
}
addEventListener('message', (e) => {
  if (e.data?.type !== 'tz-auto-ctl') return;
  if (e.data.cmd === 'play' && atStop) { if (!e.data.step) return; atStop = false; }
  setPaused(e.data.cmd === 'pause', false);
  animsHold = e.data.cmd === 'pause' && e.data.anims === true;
  holdAnimations(animsHold);   // anims：引導頁長按暫停才帶；首頁自己的暫停不凍動畫
});
// 準備好了：跟首頁要一次現在該播還是該停（首頁在 iframe load 時送的那一則可能早於這裡）
parent.postMessage({ type: 'tz-auto-hello' }, '*');
// 使用者自己動手：暫停，讓他操作
addEventListener('pointerdown', (e) => { if (e.isTrusted && !paused) setPaused(true); }, true);

// ── 手勢：手指圖示（指尖對準觸控點）＋指尖的漣漪／長按的擴散圈／拖曳的軌跡 ──
const hand = document.createElement('div');
hand.className = 'auto-hand';
hand.innerHTML = `<span class="auto-ring"></span><svg viewBox="0 0 40 48" aria-hidden="true">
  <path d="M15.5 4.5c-1.9 0-3.3 1.5-3.3 3.3v18.4l-2.9-2.9c-1.4-1.4-3.6-1.5-5-.2-1.4 1.3-1.5 3.5-.2 4.9l9.7 11.3c2.4 2.8 5.9 4.4 9.6 4.4h4.1c6.1 0 11.1-5 11.1-11.1V21.7c0-1.8-1.5-3.3-3.3-3.3s-3.3 1.5-3.3 3.3v-1.6c0-1.8-1.5-3.3-3.3-3.3s-3.3 1.5-3.3 3.3v-1.3c0-1.8-1.5-3.3-3.3-3.3-.9 0-1.7.3-2.3.9V7.8c0-1.8-1.5-3.3-3.3-3.3z"
    fill="#fff" stroke="#1f1914" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M18.8 22.5v7M25.4 22.5v7M32 23.5v6" stroke="#1f1914" stroke-width="1.8" stroke-linecap="round"/></svg>`;
document.documentElement.append(hand);
const css = document.createElement('style');
css.textContent = `
.home{visibility:hidden}   /* 原生 Home 指示條：首頁外框在同一個位置畫成進度條（使用者 2026-10-12） */
.auto-hand{position:fixed;left:0;top:0;width:44px;height:52px;pointer-events:none;z-index:99999;opacity:0;
  transform:translate(-15.5px,-4.5px);transition:opacity .2s,left .38s cubic-bezier(.3,.7,.3,1),top .38s cubic-bezier(.3,.7,.3,1);
  filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}
.auto-hand.on{opacity:1}
.auto-hand svg{position:absolute;inset:0;width:44px;height:52px;transform-origin:15.5px 4.5px;transition:transform .12s}
.auto-hand.down svg{transform:scale(.88) translateY(2px)}
.auto-ring{position:absolute;left:15.5px;top:4.5px;width:0;height:0;border-radius:50%;}
.auto-ring::before{content:"";position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;
  background:rgba(47,145,142,.35);border:2px solid rgba(47,145,142,.85);transform:scale(0);opacity:0}
.auto-hand.tap .auto-ring::before{animation:auto-ripple .5s ease-out}
.auto-hand.hold .auto-ring::before{animation:auto-hold var(--hold,.6s) linear forwards}
@keyframes auto-ripple{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.25);opacity:0}}
@keyframes auto-hold{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1);opacity:.9}}
.auto-badge{position:fixed;z-index:99997;width:34px;height:34px;margin:-34px 0 0 -17px;border-radius:50%;background:#1d7370;color:#fff;
  font:700 17px/34px system-ui,-apple-system,sans-serif;text-align:center;pointer-events:none;opacity:0;transform:scale(.6);
  transition:opacity .2s,transform .2s;box-shadow:0 3px 8px rgba(0,0,0,.25)}
.auto-badge.on{opacity:1;transform:none;animation:auto-bob 1.2s ease-in-out infinite}
.auto-badge::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid rgba(47,145,142,.7);animation:auto-pulse 1.2s ease-out infinite}
@keyframes auto-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes auto-pulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.7);opacity:0}}
@media (prefers-reduced-motion: reduce){.auto-badge.on,.auto-badge::after{animation:none}}
.auto-trail{position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:rgba(47,145,142,.5);
  pointer-events:none;z-index:99998;animation:auto-trail .5s ease-out forwards}
@keyframes auto-trail{to{opacity:0;transform:scale(.3)}}`;
document.head.append(css);
const dot = hand;   // 舊名字：下面的程式用 dot
const flash = (cls) => { hand.classList.remove(cls); void hand.offsetWidth; hand.classList.add(cls); };
const trail = (x, y) => { const t = document.createElement('div'); t.className = 'auto-trail'; t.style.left = x + 'px'; t.style.top = y + 'px'; document.documentElement.append(t); setTimeout(() => t.remove(), 520); };
// 只捲 iframe 裡的捲動容器，讓元素露出來
function reveal(el) {
  for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (!/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) continue;
    const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
    if (r.top < pr.top) p.scrollTop -= pr.top - r.top + 12; else if (r.bottom > pr.bottom) p.scrollTop += r.bottom - pr.bottom + 12;
    if (r.left < pr.left) p.scrollLeft -= pr.left - r.left + 12; else if (r.right > pr.right) p.scrollLeft += r.right - pr.right + 12;
  }
}
const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
let jumpNext = false;   // 引導頁（ADR-0050）：手指被 hide 收起後，下次出現直接出現在目標上（不從舊位置滑過來）
async function moveDot(x, y) {
  if (jumpNext && !dot.classList.contains('on')) { dot.style.transition = 'none'; dot.style.left = x + 'px'; dot.style.top = y + 'px'; void dot.offsetWidth; dot.style.transition = ''; jumpNext = false; }
  else { dot.style.left = x + 'px'; dot.style.top = y + 'px'; }
  dot.classList.add('on'); await sleep(FAST && params.get('nohand') === '1' ? 0 : 420);   // 手指游標藏起來（付費牆）就不必等它滑過去
}

async function find(sel) {
  for (let t = 0; t < 20; t++) { const el = document.querySelector(sel); if (el) return el; await sleep(100); }
  return null;
}
const pe = (type, x, y, el, extra = {}) => el.dispatchEvent(new PointerEvent(type, {
  bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch', isPrimary: true,
  clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1, ...extra }));

const CAM_MS = 400;
function camTo(sel, k) {
  const dv = document.getElementById('d'); if (!dv) return;
  dv.style.transformOrigin = '0 0';
  dv.style.transition = `transform ${CAM_MS}ms cubic-bezier(.3,.7,.3,1)`;
  if (!sel) { dv.style.transform = ''; return; }
  const el = document.querySelector(sel); if (!el) return;
  const W = dv.offsetWidth, H = dv.offsetHeight;
  const prev = dv.style.transform; dv.style.transition = 'none'; dv.style.transform = ''; void dv.offsetWidth;   // 量未放大時的位置
  const r = el.getBoundingClientRect(), dr = dv.getBoundingClientRect();
  dv.style.transform = prev; void dv.offsetWidth; dv.style.transition = `transform ${CAM_MS}ms cubic-bezier(.3,.7,.3,1)`;
  const fx = r.left - dr.left + r.width / 2, fy = r.top - dr.top + r.height / 2;
  const top = new URLSearchParams(location.search).get('embed') ? 54 : 0;   // crop=safe：看得到的範圍從狀態列底下開始
  const cx = W / 2, cy = top + (H - top) / 2;
  const tx = Math.min(0, Math.max(W - W * k, cx - k * fx)), ty = Math.min(-top * (k - 1) * 0, Math.max(H - H * k, cy - k * fy));
  dv.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
}
const badgeEl = document.createElement('div');
badgeEl.className = 'auto-badge';
function badgeAt(sel, n) {
  if (!sel) { badgeEl.classList.remove('on'); return; }
  const el = document.querySelector(sel); if (!el) return;
  const r = el.getBoundingClientRect();
  badgeEl.textContent = n;
  badgeEl.style.left = (r.left + r.width / 2) + 'px';
  badgeEl.style.top = Math.max(26, r.top - 4) + 'px';
  document.documentElement.append(badgeEl);
  requestAnimationFrame(() => badgeEl.classList.add('on'));
}
async function run(step) {
  if (step.stop) { stepNo = step.n; parent.postMessage({ type: 'tz-auto-stop', n: step.n }, '*'); atStop = true; setPaused(true); return; }
  if (step.cam !== undefined) { camTo(step.cam || null, step.k || 2); return sleep(CAM_MS + 60); }
  if (step.badge !== undefined) { badgeAt(step.badge || null, step.n); return sleep(step.badge ? 250 : 120); }
  if (step.wait) return sleep(wms(step));
  if (step.call) return window.__auto?.[step.call]?.();
  const el = await find(step.tap || step.press || step.drag || step.swipe || step.type || step.scroll);
  if (!el) return;
  reveal(el);   // 不用 scrollIntoView：它會連首頁（iframe 外面）一起捲
  const [x, y] = centre(el);
  if (step.scroll) { await moveDot(x, y); el.scrollBy({ top: step.by, behavior: 'smooth' }); await sleep(450); return; }
  await moveDot(x, y);
  if (step.tap) {
    dot.classList.add('down'); flash('tap'); pe('pointerdown', x, y, el); await sleep(130);
    pe('pointerup', x, y, el); dot.classList.remove('down');
    el.click(); await sleep(250); if (step.hide) { dot.classList.remove('on'); jumpNext = true; } return;   // 引導頁（ADR-0050）：hide＝點完先收起手指（選單蓋住按鈕時，手指不要停在選單的某一列上）
  }
  if (step.press) {
    dot.style.setProperty('--hold', (step.hold || 600) + 'ms'); dot.classList.add('down', 'hold'); pe('pointerdown', x, y, el); await sleep(step.hold || 600);
    pe('pointerup', x, y, el); dot.classList.remove('down', 'hold'); return;
  }
  if (step.drag || step.swipe) {
    const hold = step.swipe ? 0 : (step.hold ?? 450), ms = step.ms || (step.swipe ? 350 : 650);
    if (hold) dot.style.setProperty('--hold', hold + 'ms');
    dot.classList.add('down'); if (hold) dot.classList.add('hold'); pe('pointerdown', x, y, el); await sleep(hold);
    const n = Math.max(8, Math.round(ms / 16)), dx = step.dx || 0, dy = step.dy || 0;
    for (let i = 1; i <= n; i++) {
      const px = x + dx * i / n, py = y + dy * i / n;
      dot.style.transition = 'opacity .2s'; dot.style.left = px + 'px'; dot.style.top = py + 'px'; if (i % 3 === 0) trail(px, py);
      pe('pointermove', px, py, document.elementFromPoint(px, py) || el); await sleep(ms / n);
    }
    pe('pointerup', x + dx, y + dy, document.elementFromPoint(x + dx, y + dy) || el);
    dot.style.transition = ''; dot.classList.remove('down', 'hold'); return;
  }
  if (step.type) {
    el.focus?.({ preventScroll: true }); el.click();
    for (const ch of step.text) {
      flash('tap');
      if ('value' in el) { el.value += ch; el.dispatchEvent(new Event('input', { bubbles: true })); }
      else el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
      await sleep(120);
    }
  }
}

function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; } }
function save(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
const here = () => location.pathname.split('/').pop().replace(/\.html$/, '');

async function main() {
  if (!steps.length) return;
  let st = load();
  if (!st || st.start == null) { st = { start: location.href, i: lead }; save(st); }
  if (paused && animsHold) holdAnimations(true);   // 停在第一幀等播放：頁面剛畫好才起跑的動畫也一起停住
  if (!FAST || st.i !== lead) await sleep(GAP);                               // 開場跟每一步一樣只停 500ms（使用者 2026-10-12）
  while (true) {
    for (; st.i < steps.length; ) {
      await untilPlaying();
      const step = steps[st.i];
      if (step.page && step.page !== here()) { await sleep(200); continue; }   // 還沒換到該頁（剛點了 go()）
      stepProgress(st.i);
      st.i += 1; save(st);                        // 先記下一步：這一步若換頁，新頁接著做
      await run(step);
      await sleep(step.cam !== undefined || step.badge !== undefined || step.stop ? 0 : GAP);   // 鏡頭、號碼、停：不另外停 GAP（一頁一頁點著看時才不拖）
    }
    // 一輪結束：多停一下
    stepProgress(steps.length); await sleep(END); await untilPlaying();
    progress({ reset: true });
    // 地圖類：原地從第一步重來，不重新載入（故事最後一步已回到起始狀態）
    if (INPLACE.has(story)) { st = { start: st.start, i: 0 }; save(st); continue; }
    // 其他：請首頁在背景開一份新的、淡入蓋過這份（不在這裡 reload，才不會閃白）
    save({ start: st.start, i: 0 });
    parent.postMessage({ type: 'tz-auto-loop' }, '*');
    return;
  }
}
// 畫面畫好（ready）再開始
const go = () => (document.body.dataset.ready === '1' ? main() : setTimeout(go, FAST ? 20 : 150));
go();

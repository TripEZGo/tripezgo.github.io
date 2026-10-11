// 讓 AI 幫你排行程：挑一句話 → 你的訊息 → AI 呼叫 TripEZGo 的 MCP 工具 → 行程出現在那一天 → AI 回話。
//
// 照 App 的實作（/Users/zhgchgli/Projects/tripezgo/App/iOS/Modules/AILink）：
//   - 工具名稱逐字取自 Sources/AILink/Tools/*.swift 的 `name:`：get_trip、list_events、search_place、
//     create_event、update_event、set_leg（另有 create_todo、create_marker、create_note… 這裡用不到）。
//     參數名稱也照 inputSchema：search_place 的 `query`；create_event 的 `dayNumber`／`startTime`／`placeId`。
//   - create_event 的說明：地點用 search_place 回來的 placeId（「also fills the title and the type」），
//     所以每一則行程前面都先有一次 search_place。路程用 set_leg 另外接（「change those with set_leg」）。
//   - 每一次寫入在 App 的連線紀錄記一筆（AILinkActivity）：「新增行程」「修改行程」「新增路程」「修改路程」
//     ——ailink.activity.*；小標「這次連線做了什麼」＋「N 項」——ailink.log.title／.count。
//   - 已連線那一行：ailink.status.connected「已連線 · %@」，%@ 是 MCP clientInfo.name（例如 Claude Code）。
//   - **同一個 Wi-Fi**：ailink.step.wifi、ailink.nowifi.body——電腦上的 AI 只能透過同一個 Wi-Fi 找到手機，
//     行動網路與個人熱點都不行。
//   - 交通方式的字：Domain.json domain.legmode.*；時長：_shared.js duration（domain.duration.*）。
// 對話內容、京都的行程與 AI 的回覆是網站自己寫的三語範例（範本旅程裡沒有）。全程 ≤ 4 秒；減少動態時直接畫完。
import { esc, duration, reduced } from './_shared.js';

const S = {
  zh: {
    connected: '已連線 · Claude Code', wifi: '電腦和這支手機要連<b>同一個 Wi-Fi</b>',
    pick: '選一句話問 AI', again: '再播一次', trip: '京都 4 日', day: '第 2 天', log: (n) => `${n} 項`,
    empty: '這一天還沒有行程',
    act: { addEvent: '新增行程', updEvent: '修改行程', addLeg: '新增路程', updLeg: '修改路程' },
    modes: { walking: '步行', transit: '大眾運輸' },
  },
  en: {
    connected: 'Connected · Claude Code', wifi: 'Connect your computer and this phone to <b>the same Wi-Fi</b>',
    pick: 'Pick something to ask', again: 'Play again', trip: 'Kyoto in 4 Days', day: 'Day 2', log: (n) => `${n} changes`,
    empty: 'Nothing planned for this day yet',
    act: { addEvent: 'Added event', updEvent: 'Changed event', addLeg: 'Added leg', updLeg: 'Changed leg' },
    modes: { walking: 'Walking', transit: 'Transit' },
  },
  ja: {
    connected: '接続済み · Claude Code', wifi: 'パソコンとこのスマホを<b>同じ Wi-Fi</b> につなぎます',
    pick: 'AI に聞いてみる', again: 'もう一度再生', trip: '京都 4 日間', day: '2 日目', log: (n) => `${n} 件`,
    empty: 'この日はまだ予定がありません',
    act: { addEvent: '予定を追加', updEvent: '予定を変更', addLeg: '移動を追加', updLeg: '移動を変更' },
    modes: { walking: '徒歩', transit: '公共交通' },
  },
};

// 京都第 2 天的行程（三語）。id 是這一天的那一則，leg 是「進這一則的那段路」。
const PLACES = {
  inari: { zh: '伏見稻荷大社', en: 'Fushimi Inari Taisha', ja: '伏見稲荷大社' },
  kiyo: { zh: '清水寺', en: 'Kiyomizu-dera', ja: '清水寺' },
  lunch: { zh: '午餐：二年坂 湯豆腐', en: 'Lunch: yudofu on Ninenzaka', ja: '昼食：二年坂で湯豆腐' },
  gion: { zh: '祇園白川 散步', en: 'Stroll along Gion Shirakawa', ja: '祇園白川を散歩' },
  dinner: { zh: '晚餐：先斗町 京料理', en: 'Dinner: Kyoto cuisine in Pontocho', ja: '夕食：先斗町で京料理' },
  sanju: { zh: '三十三間堂', en: 'Sanjūsangen-dō', ja: '三十三間堂' },
};
const BASE = [
  { id: 'a', p: 'inari', s: '08:00', e: '09:30' },
  { id: 'b', p: 'kiyo', s: '10:00', e: '11:30', leg: ['transit', 30] },
  { id: 'c', p: 'lunch', s: '11:45', e: '12:45', leg: ['walking', 15] },
];

// 三句話：每一句有起點（那一天原本的樣子）、工具呼叫的順序與每一步對那一天做了什麼、最後的回覆。
const PROMPTS = [
  {
    ask: { zh: '幫我排京都第二天', en: 'Plan day 2 of my Kyoto trip', ja: '京都の 2 日目を組んで' },
    start: [],
    steps: [
      ['get_trip'],
      ['search_place', 'inari'], ['create_event', 'inari', { add: BASE[0] }],
      ['search_place', 'kiyo'], ['create_event', 'kiyo', { add: { ...BASE[1], leg: null } }],
      ['search_place', 'lunch'], ['create_event', 'lunch', { add: { ...BASE[2], leg: null } }],
      ['set_leg', 'kiyo', { leg: ['b', BASE[1].leg] }], ['set_leg', 'lunch', { leg: ['c', BASE[2].leg] }],
    ],
    reply: {
      zh: '第 2 天排好了：一早去伏見稻荷避開人潮，搭京阪到清水寺，中午在二年坂吃湯豆腐。兩段路程也接上了，打開 App 就看得到。',
      en: 'Day 2 is set: Fushimi Inari early to beat the crowds, the Keihan line over to Kiyomizu-dera, then yudofu on Ninenzaka for lunch. Both legs are in — open the app to see it.',
      ja: '2 日目を組みました。朝いちばんに伏見稲荷で混雑を避け、京阪で清水寺へ、お昼は二年坂で湯豆腐。移動も 2 区間つないであります。アプリで確認できます。',
    },
  },
  {
    ask: { zh: '下午加一段祇園散步，晚餐找附近的', en: 'Add a Gion walk this afternoon, and dinner nearby', ja: '午後に祇園の散歩、夕食も近くで' },
    start: BASE,
    steps: [
      ['list_events'],
      ['search_place', 'gion'], ['create_event', 'gion', { add: { id: 'd', p: 'gion', s: '14:00', e: '15:30' } }],
      ['search_place', 'dinner'], ['create_event', 'dinner', { add: { id: 'e', p: 'dinner', s: '18:00', e: '19:30' } }],
      ['set_leg', 'gion', { leg: ['d', ['walking', 20]] }], ['set_leg', 'dinner', { leg: ['e', ['walking', 10]] }],
    ],
    reply: {
      zh: '加好了：吃完午餐走 20 分到祇園白川，傍晚再走 10 分到先斗町吃晚餐。中間空著的時間可以回飯店休息。',
      en: 'Done: a 20-minute walk from lunch to Gion Shirakawa, then 10 minutes on foot to Pontocho for dinner. The gap in between is free time.',
      ja: '追加しました。昼食のあと徒歩 20 分で祇園白川へ、夕方は徒歩 10 分で先斗町の夕食へ。あいだの時間はホテルで休めます。',
    },
  },
  {
    ask: { zh: '早上下雨的話，伏見稻荷換成室內的', en: 'If it rains, swap Fushimi Inari for somewhere indoors', ja: '朝が雨なら、伏見稲荷を屋内に変えて' },
    start: BASE,
    steps: [
      ['list_events'],
      ['search_place', 'sanju'], ['update_event', 'sanju', { upd: ['a', { p: 'sanju', s: '08:30', e: '09:30' }] }],
      ['set_leg', 'kiyo', { leg: ['b', ['walking', 20], true] }],
    ],
    reply: {
      zh: '換成三十三間堂了：整座在室內，八點半開門，下雨也不怕；走到清水寺只要 20 分，後面的行程都不用動。',
      en: 'Swapped in Sanjūsangen-dō: it’s all indoors and opens at 8:30, so rain won’t matter, and it’s a 20-minute walk to Kiyomizu-dera — nothing after it has to move.',
      ja: '三十三間堂に変えました。すべて屋内で 8:30 開門、雨でも安心です。清水寺まで徒歩 20 分なので、そのあとの予定はそのままです。',
    },
  },
];

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

export default function (el, ctx) {
  const L = ctx.lang in S ? ctx.lang : 'zh';
  const T = S[L];
  let timers = [], running = false, current = null;
  let day = [], marks = {}, changes = 0, fresh = null;

  const root = document.createElement('div');
  root.className = 'd-ai-chat';
  root.innerHTML = `
    <div class="d-ai-chat__top"><svg class="i"><use href="#i-plug"/></svg><span>TripEZGo MCP</span>
      <span class="d-ai-chat__status"><i></i>${esc(T.connected)}</span></div>
    <div class="d-ai-chat__log" aria-live="polite"></div>
    <div class="d-ai-chat__day">
      <div class="d-ai-chat__dayhead"><b>${esc(T.trip)} · ${esc(T.day)}</b><small class="d-ai-chat__count"></small></div>
      <ul class="d-ai-chat__list"></ul>
    </div>
    <div class="d-ai-chat__prompts" role="group" aria-label="${esc(T.pick)}"></div>
    <p class="d-ai-chat__wifi"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.6a5 5 0 0 1 6.8 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/></svg><span>${T.wifi}</span></p>`;
  el.append(root);
  const log = root.querySelector('.d-ai-chat__log');
  const list = root.querySelector('.d-ai-chat__list');
  const count = root.querySelector('.d-ai-chat__count');
  const promptsEl = root.querySelector('.d-ai-chat__prompts');

  const drawDay = () => {
    const sorted = [...day].sort((a, b) => toMin(a.s) - toMin(b.s));
    list.innerHTML = sorted.length ? sorted.map((ev, i) => {
      const m = marks[ev.id] || {};
      const leg = ev.leg && i > 0 ? `<li class="d-ai-chat__leg${m.leg ? ' is-mark' : ''}${fresh === 'leg:' + ev.id ? ' is-fresh' : ''}"><span>${esc(T.modes[ev.leg[0]])} · ${esc(duration(ev.leg[1]))}</span>${
        m.leg ? `<em>${esc(m.leg)}</em>` : ''}</li>` : '';
      return `${leg}<li class="d-ai-chat__ev${m.ev ? ' is-mark' : ''}${fresh === ev.id ? ' is-fresh' : ''}"><span class="d-ai-chat__t">${ev.s}</span>
        <span class="d-ai-chat__n">${esc(PLACES[ev.p][L])}</span>${m.ev ? `<em>${esc(m.ev)}</em>` : ''}</li>`;
    }).join('') : `<li class="d-ai-chat__empty">${esc(T.empty)}</li>`;
    count.textContent = changes ? T.log(changes) : '';
  };

  const apply = (fx) => {
    if (!fx) return;
    fresh = fx.add?.id ?? fx.upd?.[0] ?? (fx.leg ? 'leg:' + fx.leg[0] : null);
    if (fx.add) { day.push({ ...fx.add }); marks[fx.add.id] = { ...marks[fx.add.id], ev: T.act.addEvent }; changes++; }
    if (fx.upd) { const [id, patch] = fx.upd; Object.assign(day.find((d) => d.id === id), patch); marks[id] = { ...marks[id], ev: T.act.updEvent }; changes++; }
    if (fx.leg) { const [id, leg, upd] = fx.leg; day.find((d) => d.id === id).leg = leg; marks[id] = { ...marks[id], leg: upd ? T.act.updLeg : T.act.addLeg }; changes++; }
    drawDay();
  };

  const drawPrompts = () => {
    promptsEl.innerHTML = `<p class="d-ai-chat__pick">${esc(T.pick)}</p>${current !== null && !running ? `<button type="button" class="d-ai-chat__again" data-i="${current}">
        <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(T.again)}</button>` : ''}
      ${PROMPTS.map((p, i) => i === current ? '' : `<button type="button" class="d-ai-chat__ask" data-i="${i}"${running ? ' disabled' : ''}>${esc(p.ask[L])}</button>`).join('')}`;
  };

  const chipFor = (name) => {
    const last = log.lastElementChild;
    if (last?.classList.contains('d-ai-chat__tools')) {
      const prev = last.lastElementChild;
      if (prev?.dataset.tool === name) { const n = +prev.dataset.n + 1; prev.dataset.n = n; prev.querySelector('small').textContent = `×${n}`; return; }
      last.insertAdjacentHTML('beforeend', `<span class="d-ai-chat__chip" data-tool="${name}" data-n="1"><svg class="i"><use href="#i-check"/></svg><code>${name}</code><small></small></span>`);
      return;
    }
    log.insertAdjacentHTML('beforeend', `<div class="d-ai-chat__tools"><span class="d-ai-chat__chip" data-tool="${name}" data-n="1"><svg class="i"><use href="#i-check"/></svg><code>${name}</code><small></small></span></div>`);
  };

  // typed：第一次捲進畫面時自動送出，訊息一個字一個字打出來（像有人在問）
  const play = (i, typed = false) => {
    timers.forEach(clearTimeout); timers = [];
    const P = PROMPTS[i];
    current = i; running = !reduced;
    day = P.start.map((d) => ({ ...d })); marks = {}; changes = 0; fresh = null;
    log.innerHTML = `<p class="d-ai-chat__me"></p>`;
    drawDay(); drawPrompts();
    const at = (ms, fn) => (reduced ? fn() : timers.push(setTimeout(fn, ms)));
    const me = log.firstElementChild, chars = Array.from(P.ask[L]);
    const cps = L === 'en' ? 30 : 70, t0 = typed && !reduced ? chars.length * cps + 300 : 0;
    if (t0) chars.forEach((_, k) => at(k * cps, () => { me.textContent = chars.slice(0, k + 1).join(''); }));
    else me.textContent = P.ask[L];
    const step = Math.min(320, 2500 / P.steps.length);
    P.steps.forEach(([tool, , fx], k) => at(t0 + 450 + k * step, () => { chipFor(tool); apply(fx); }));
    at(t0 + 450 + P.steps.length * step + 250, () => {
      log.insertAdjacentHTML('beforeend', `<p class="d-ai-chat__ai">${esc(P.reply[L])}</p>`);
      running = false; drawPrompts();
      promptsEl.querySelector('button')?.focus({ preventScroll: true });
    });
  };

  promptsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b && !b.disabled) play(+b.dataset.i);
  });
  // 一開始：那一天是空的，三句話等你挑
  day = []; drawDay(); drawPrompts();
  // 整個元件捲進畫面上方四分之三時，停 500ms 再自動送出第一句；只播一次，不重播（使用者 2026-10-12）。
  // 一露出就播的話，人還沒捲到、還沒在看，四秒就播完了——看起來像沒播。
  let armed = null;
  const io = new IntersectionObserver(([e]) => {
    clearTimeout(armed);
    if (!e.isIntersecting || e.intersectionRatio < 0.99) return;
    armed = setTimeout(() => { io.disconnect(); if (current === null) play(0, true); }, 500);
  }, { threshold: [0, 0.99], rootMargin: '0px 0px -25% 0px' });
  io.observe(root);
}

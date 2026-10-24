// 首頁的互動示意：用畫的、可以操作，不是截圖。
//
//   [data-demo="offline"]  隱私段：關掉網路照樣能新增行程，iCloud 那列等網路回來才同步
//   [data-demo="runs"]     路程段：第 2 天早餐 → 渡輪的三個班次；錯過一班就換下一班，全錯過才警告
//   [data-demo="live"]     即時動態：拖時間，鎖定畫面上的目前行程、剩餘時間、下一站跟著變
//   [data-demo="widget"]   Widget：今天的行程＋可以打勾的待辦
//
// 行程資料是 App 內建範本「山陽 6 日」的第 2 天（assets/js/home-data.js，由 tools/gen-home-data.py 產生）。
// 這裡的字只是示意的標籤；用詞照 App 的字串表（旅伴、共編、待辦、即時動態）。
import { DATA } from './home-data.js';

const LANG = document.documentElement.lang.startsWith('ja') ? 'ja' : document.documentElement.lang.startsWith('en') ? 'en'
  : document.documentElement.lang.startsWith('ko') ? 'ko' : 'zh';
// offline／runs／live／widget 這四個示意沒有韓文（首頁目前也沒放）；韓文頁萬一用到就用英文
const D = DATA[LANG] ?? DATA.en;
const T = {
  zh: {
    net: '網路', on: '開', off: '關', offlineBadge: '離線中', thisPhone: '這台 iPhone', all: '全部資料',
    add: '新增行程', added: '新行程',
    synced: '已同步到 iCloud', waiting: '等網路恢復，自動同步', syncing: '同步中…',
    cloud: 'iCloud 加密備份與同步', coedit: '旅伴共編', coeditOn: '走 iCloud 共享', coeditOff: '恢復連線後旅伴就看得到',
    chips: ['行程', '附件', '待辦', '筆記', '購物清單', '照片'],
    from: '飯店免費早餐', to: 'JR 宮島渡輪 09:10 開', walk: '先走 18 分到廣島車站',
    early: m => m > 0 ? `早到 ${m} 分` : '剛好趕上', missed: '我錯過這班了', reset: '重來',
    warn: '已經沒有趕得上 09:10 渡輪的班次了——改搭下一班渡輪，或把後面的行程一起延後。',
    nextRun: '下一班已經排好',
    now: '現在', left: m => `還剩 ${m} 分`, next: '下一站', leg: { walking: m => `步行 ${m} 分`, transit: m => `大眾運輸 ${m} 分`, other: m => `移動 ${m} 分`, driving: m => `開車 ${m} 分` },
    moving: '移動中', arrive: '抵達', dayDone: '今天的行程都結束了', notYet: '第一個行程',
    today: '今天', todo: '待辦清單', ofTodos: (a, b) => `${a}/${b}`, drag: '拖動時間看看',
  },
  en: {
    net: 'Network', on: 'On', off: 'Off', offlineBadge: 'Offline', thisPhone: 'This iPhone', all: 'All your data',
    add: 'Add event', added: 'New event',
    synced: 'Synced to iCloud', waiting: 'Will sync when you’re back online', syncing: 'Syncing…',
    cloud: 'Encrypted iCloud backup and sync', coedit: 'Co-editing with companions', coeditOn: 'Through iCloud sharing', coeditOff: 'Companions see it once you reconnect',
    chips: ['Events', 'Files', 'To-dos', 'Notes', 'Shopping list', 'Photos'],
    from: 'Free hotel breakfast', to: 'JR Miyajima Ferry, departs 09:10', walk: 'Walk 18 min to Hiroshima Station first',
    early: m => m > 0 ? `${m} min early` : 'Just in time', missed: 'I missed this one', reset: 'Start over',
    warn: 'No train left that makes the 09:10 ferry — take a later ferry, or push the rest of the day back.',
    nextRun: 'The next one is already lined up',
    now: 'Now', left: m => `${m} min left`, next: 'Next', leg: { walking: m => `Walk ${m} min`, transit: m => `Transit ${m} min`, other: m => `Travel ${m} min`, driving: m => `Drive ${m} min` },
    moving: 'On the way', arrive: 'Arrive', dayDone: 'That’s it for today', notYet: 'First up',
    today: 'Today', todo: 'To-Dos', ofTodos: (a, b) => `${a}/${b}`, drag: 'Drag the time',
  },
  ja: {
    net: 'ネットワーク', on: 'オン', off: 'オフ', offlineBadge: 'オフライン', thisPhone: 'この iPhone', all: 'すべてのデータ',
    add: '予定を追加', added: '新しい予定',
    synced: 'iCloud と同期済み', waiting: '通信が戻ったら自動で同期', syncing: '同期中…',
    cloud: 'iCloud で暗号化バックアップ・同期', coedit: '旅の仲間と共同編集', coeditOn: 'iCloud 共有で', coeditOff: '通信が戻れば旅の仲間にも届きます',
    chips: ['予定', '添付', 'やること', 'メモ', '買い物リスト', '写真'],
    from: 'ホテルの無料朝食', to: 'JR 宮島フェリー 09:10 発', walk: 'まず広島駅まで徒歩 18 分',
    early: m => m > 0 ? `${m} 分前に到着` : 'ぎりぎり間に合う', missed: 'この便に乗り遅れた', reset: 'やり直す',
    warn: '09:10 のフェリーに間に合う便はもうありません。次のフェリーにするか、このあとの予定をまとめて後ろへずらしましょう。',
    nextRun: '次の便はもう用意済み',
    now: '現在', left: m => `残り ${m} 分`, next: '次', leg: { walking: m => `徒歩 ${m} 分`, transit: m => `公共交通 ${m} 分`, other: m => `移動 ${m} 分`, driving: m => `車 ${m} 分` },
    moving: '移動中', arrive: '到着', dayDone: '今日の予定はすべて終わりました', notYet: '最初の予定',
    today: '今日', todo: 'やることリスト', ofTodos: (a, b) => `${a}/${b}`, drag: '時刻を動かしてみる',
  },
}[LANG in DATA ? LANG : 'en'];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 隱私＋離線 ───────────────────────────────────────────────────────── */
function offline(el) {
  let online = true, added = 0, timer;
  const render = (state) => {
    el.innerHTML = `
      <div class="vault-card${online ? '' : ' is-offline'}">
        <div class="vault-head"><svg class="i"><use href="#i-phone"/></svg><b>${T.thisPhone}</b>
          ${online ? `<span>${T.all}</span>` : `<span class="badge-off">${T.offlineBadge}</span>`}</div>
        <div class="demo-net">
          <span>${T.net}</span>
          <button class="switch" role="switch" aria-checked="${online}" aria-label="${T.net}"><i></i></button>
        </div>
        <ul class="vault-chips">${T.chips.map(c => `<li>${esc(c)}</li>`).join('')}${
          Array.from({ length: added }, (_, i) => `<li class="is-added${i === added - 1 && state === 'add' ? ' is-pop' : ''}">${T.added} ${i + 1}</li>`).join('')}
          <li class="add"><button type="button" class="demo-add"><svg class="i"><use href="#i-plus"/></svg>${T.add}</button></li></ul>
        <div class="vault-row"><svg class="i"><use href="#i-lock"/></svg><b>${T.cloud}</b>
          <span class="sync ${state === 'syncing' ? 'is-syncing' : online ? 'is-ok' : 'is-wait'}" aria-live="polite">${
            state === 'syncing' ? T.syncing : online ? T.synced : T.waiting}</span></div>
        <div class="vault-row"><svg class="i"><use href="#i-users"/></svg><b>${T.coedit}</b><span>${online ? T.coeditOn : T.coeditOff}</span></div>
      </div>`;
    el.querySelector('.switch').onclick = () => {
      online = !online; clearTimeout(timer);
      if (online) { render('syncing'); timer = setTimeout(() => render(), reduced ? 0 : 1100); } else render();
    };
    el.querySelector('.demo-add').onclick = () => {
      added = Math.min(added + 1, 3); render('add');
      if (online) { clearTimeout(timer); render('syncing'); timer = setTimeout(() => render(), reduced ? 0 : 900); }
    };
  };
  render();
}

/* ── 班次備案 ─────────────────────────────────────────────────────────── */
function runs(el) {
  const ferry = D.day.find(e => e.key === 'd2-ferry');
  const R = ferry.leg.runs; const ferryAt = toMin(ferry.start);
  let pick = ferry.leg.selectedRunIndex ?? 0, gone = 0;
  const render = () => {
    const allGone = gone >= R.length;
    el.innerHTML = `
      <div class="demo-card runs-card">
        <div class="runs-ends"><span class="dot"></span><b>${esc(D.day[0].title)}</b><small>${D.day[0].start} – ${D.day[0].end}</small></div>
        <p class="runs-walk">${T.walk}</p>
        <div class="runs-chips" role="radiogroup">${R.map((r, i) => `
          <button type="button" role="radio" aria-checked="${i === pick && !allGone}" class="run${i === pick && !allGone ? ' on' : ''}${i < gone ? ' gone' : ''}"
            ${i < gone ? 'disabled' : ''} data-i="${i}"><b>${r.departure}</b><small>${esc(r.name)}</small></button>`).join('')}</div>
        ${allGone ? `<div class="runs-warn" role="alert"><svg class="i"><use href="#i-bell"/></svg><span>${T.warn}</span></div>` : (() => {
          const r = R[pick]; const early = ferryAt - toMin(r.arrival);
          return `<div class="runs-pick"><svg class="i"><use href="#i-train"/></svg><div><b>${esc(r.name)}</b>
            <span>${r.departure} → ${r.arrival} · ${esc(T.early(early))}</span></div></div>`; })()}
        <div class="runs-ends"><span class="dot is-end"></span><b>${T.to}</b></div>
        <div class="runs-actions">${allGone
          ? `<button type="button" class="btn-mini" data-act="reset">${T.reset}</button>`
          : `<button type="button" class="btn-mini" data-act="miss">${T.missed}</button>${gone ? `<span class="runs-note">${T.nextRun}</span>` : ''}`}</div>
      </div>`;
    el.querySelectorAll('.run:not([disabled])').forEach(b => b.onclick = () => { pick = +b.dataset.i; render(); });
    const act = el.querySelector('[data-act]');
    act.onclick = () => {
      if (act.dataset.act === 'reset') { gone = 0; pick = ferry.leg.selectedRunIndex ?? 0; }
      else { gone = pick + 1; pick = gone; }
      render(); el.querySelector('[data-act]')?.focus();
    };
  };
  render();
}

/* ── 即時動態 ─────────────────────────────────────────────────────────── */
function stateAt(t) {
  const E = D.day;
  for (let i = 0; i < E.length; i++) {
    const s = toMin(E[i].start), e = toMin(E[i].end);
    if (t < s) {
      const prev = E[i - 1];
      return prev ? { kind: 'moving', from: prev, to: E[i], left: s - t, total: s - toMin(prev.end) }
                  : { kind: 'before', to: E[i], left: s - t };
    }
    if (t < e) return { kind: 'at', ev: E[i], left: e - t, total: e - s, next: E[i + 1] };
  }
  return { kind: 'done' };
}
function live(el) {
  const first = toMin(D.day[0].start) - 20, last = toMin(D.day.at(-1).end) + 10;
  el.innerHTML = `
    <div class="lock">
      <div class="lock-clock"><small>${esc(D.title.split(/[｜|—]/)[0].trim())}</small><b class="lock-time">10:41</b></div>
      <div class="la" aria-live="polite"></div>
      <label class="lock-scrub"><span>${T.drag}</span>
        <input type="range" min="${first}" max="${last}" step="1" value="${toMin('10:41')}" aria-label="${T.drag}"></label>
    </div>`;
  const la = el.querySelector('.la'), tm = el.querySelector('.lock-time'), range = el.querySelector('input');
  const legText = (ev) => ev?.leg ? (T.leg[ev.leg.mode] || T.leg.other)(ev.leg.durationMinutes) : '';
  const draw = () => {
    const t = +range.value; tm.textContent = hhmm(t);
    const st = stateAt(t);
    let html;
    if (st.kind === 'at') {
      const pct = Math.round(100 * (1 - st.left / st.total));
      html = `<div class="la-top"><span class="la-app"><span class="la-mark"></span>TripEZGo</span><span>${T.now}</span></div>
        <div class="la-main"><b>${esc(st.ev.title)}</b><span class="la-left">${T.left(st.left)}</span></div>
        <div class="la-bar"><i style="width:${pct}%"></i></div>
        <div class="la-sub">${st.next ? `<span>${T.next} · ${esc(st.next.title)}</span><span>${st.next.start}${legText(st.next) ? ' · ' + legText(st.next) : ''}</span>` : `<span>${T.dayDone}</span>`}</div>`;
    } else if (st.kind === 'moving') {
      const pct = Math.round(100 * (1 - st.left / st.total));
      html = `<div class="la-top"><span class="la-app"><span class="la-mark"></span>TripEZGo</span><span>${T.moving}</span></div>
        <div class="la-main"><b>${esc(st.to.title)}</b><span class="la-left">${T.arrive} ${st.to.start}</span></div>
        <div class="la-bar is-leg"><i style="width:${pct}%"></i></div>
        <div class="la-sub"><span>${esc(legText(st.to))}</span><span>${T.left(st.left)}</span></div>`;
    } else if (st.kind === 'before') {
      html = `<div class="la-top"><span class="la-app"><span class="la-mark"></span>TripEZGo</span><span>${T.notYet}</span></div>
        <div class="la-main"><b>${esc(st.to.title)}</b><span class="la-left">${st.to.start}</span></div>`;
    } else {
      html = `<div class="la-top"><span class="la-app"><span class="la-mark"></span>TripEZGo</span></div><div class="la-main"><b>${T.dayDone}</b></div>`;
    }
    la.innerHTML = html;
  };
  range.oninput = draw; draw();
}

/* ── Widget ──────────────────────────────────────────────────────────── */
function widget(el) {
  const done = new Set();
  const t0 = toMin('10:41');
  const upcoming = D.day.filter(e => toMin(e.end) > t0).slice(0, 4);
  const render = () => {
    el.innerHTML = `
      <div class="home-screen">
        <div class="wg wg-medium">
          <div class="wg-head"><span class="la-mark"></span><b>${T.today}</b><small>${esc(D.title.split(/[｜|—]/)[0].trim())}</small></div>
          <ul class="wg-list">${upcoming.map((e, i) => `<li${i === 0 ? ' class="is-now"' : ''}><span class="t">${e.start}</span><span class="n">${esc(e.title)}</span></li>`).join('')}</ul>
        </div>
        <div class="wg wg-medium">
          <div class="wg-head"><svg class="i"><use href="#i-todo"/></svg><b>${T.todo}</b><small>${T.ofTodos(done.size, D.todos.length)}</small></div>
          <ul class="wg-todos">${D.todos.map((t, i) => `<li><button type="button" role="checkbox" aria-checked="${done.has(i)}" data-i="${i}" class="${done.has(i) ? 'on' : ''}">
            <span class="box"><svg class="i"><use href="#i-check"/></svg></span><span class="txt">${esc(t)}</span></button></li>`).join('')}</ul>
          <p class="wg-owner">${esc(D.todoOwner)}</p>
        </div>
      </div>`;
    el.querySelectorAll('[role="checkbox"]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; done.has(i) ? done.delete(i) : done.add(i); render(); el.querySelector(`[data-i="${i}"]`).focus();
    });
  };
  render();
}


/* ── 隱私：資料流向圖（版面由 OpenDesign 設計，2026-10-12）────────────────
   同一個 Apple 帳號的框裡是你的 iPhone、iPad 與 Apple iCloud；旅伴在框外。
   「iCloud 同步備份」打開 → iPhone↔iCloud、iCloud↔iPad 出現流動的傳輸線；
   「旅程共編」打開 → iCloud 分三條線到三位旅伴。共編要先開同步，關同步會連帶關共編。
   圖上不寫「加密」（使用者 2026-10-12）。預設兩個都開；捲到才自動示範；使用者按過開關就停。線段照節點實際位置畫，任何寬度都接得準。 */
function flow(el) {
  const F = {
    zh: { head: '資料流向', account: '你的 Apple 帳號', me: '你的 iPhone', ipad: '你的 iPad', cloud: 'Apple iCloud', cloudOn: '備份與同步', cloudOff: '未開啟',
          mates: ['小美', '阿哲', 'Yuki'],
          sync: 'iCloud 同步備份', syncSub: 'iPhone 與 iPad 同步', share: '旅程共編', shareSub: '邀請旅伴一起編輯行程', shareLocked: '需先開啟 iCloud 同步',
          off: '目前資料只存在這台 iPhone 上。', synced: 'iPhone 與 iPad 透過你的 iCloud 同步。', shared: '經 iCloud 同步，並與 3 位旅伴共編。' },
    en: { head: 'Where your data goes', account: 'Your Apple Account', me: 'Your iPhone', ipad: 'Your iPad', cloud: 'Apple iCloud', cloudOn: 'Backup & sync', cloudOff: 'Off',
          mates: ['Mia', 'Ken', 'Yuki'],
          sync: 'iCloud backup & sync', syncSub: 'Sync between iPhone and iPad', share: 'Co-editing', shareSub: 'Plan the trip together with companions', shareLocked: 'Turn on iCloud sync first',
          off: 'Your data stays on this iPhone.', synced: 'iPhone and iPad sync through your iCloud.', shared: 'Synced through iCloud, co-edited with 3 companions.' },
    ja: { head: 'データの流れ', account: 'あなたの Apple アカウント', me: 'あなたの iPhone', ipad: 'あなたの iPad', cloud: 'Apple iCloud', cloudOn: 'バックアップと同期', cloudOff: 'オフ',
          mates: ['ミカ', 'ケン', 'ユキ'],
          sync: 'iCloud バックアップ<wbr>と同期', syncSub: 'iPhone と iPad を同期', share: '共同編集', shareSub: '旅の仲間と一緒に予定を編集', shareLocked: '先に iCloud 同期をオンに',
          off: 'データはこの iPhone の中だけにあります。', synced: 'iPhone と iPad があなたの iCloud で同期。', shared: 'iCloud で同期し、旅の仲間 3 人と共同編集。' },
    ko: { head: '데이터 흐름', account: '내 Apple 계정', me: '내 iPhone', ipad: '내 iPad', cloud: 'Apple iCloud', cloudOn: '백업 및 동기화', cloudOff: '꺼짐',
          mates: ['지민', '현우', 'Yuki'],
          sync: 'iCloud 백업 및 동기화', syncSub: 'iPhone과 iPad 동기화', share: '공동 편집', shareSub: '동행과 함께 일정 편집', shareLocked: '먼저 iCloud 동기화를 켜세요',
          off: '데이터는 이 iPhone에만 있습니다.', synced: 'iPhone과 iPad가 내 iCloud로 동기화됩니다.', shared: 'iCloud로 동기화하고, 동행 3명과 공동 편집 중.' },
  }[LANG] ;
  const ico = {
    phone: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 5.2h3"/></svg>',
    ipad: '<svg viewBox="0 0 24 24"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.6h2"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7.3 18.5h9.9a3.9 3.9 0 0 0 .5-7.77A5.6 5.6 0 0 0 6.9 11.6a3.45 3.45 0 0 0 .4 6.9z"/></svg>',
  };
  const wire = (cls, edge) => `<g class="pf-wire ${cls}" data-edge="${edge}"><path class="pf-track"/><path class="pf-flow"/></g>`;
  el.innerHTML = `<div class="pf-card">
    <p class="pf-status" aria-live="polite"></p>
    <div class="pf-stage" data-sync="true" data-share="true">
      <div class="pf-account">
        <p class="pf-account-label">${F.account}</p>
        <div class="pf-devices">
          <div class="pf-node pf-phone"><span class="pf-tile">${ico.phone}</span><span class="pf-nm"><b>${F.me}</b></span></div>
          <div class="pf-node pf-ipad"><span class="pf-tile">${ico.ipad}</span><span class="pf-nm"><b>${F.ipad}</b></span></div>
        </div>
        <div class="pf-node pf-cloud"><span class="pf-tile">${ico.cloud}</span><span class="pf-nm"><b>${F.cloud}</b><small class="pf-cloud-state"></small></span></div>
      </div>
      <div class="pf-mates">${F.mates.map(n => `<div class="pf-node pf-mate"><span class="pf-tile" aria-hidden="true">${[...n][0]}</span><span class="pf-nm"><b>${n}</b></span></div>`).join('')}</div>
      <svg class="pf-wires" aria-hidden="true">${wire('a', 'phone')}${wire('a', 'ipad')}${wire('b', 'mate-1')}${wire('b', 'mate-2')}${wire('b', 'mate-3')}</svg>
    </div>
    <ul class="pf-settings">
      <li class="pf-setting"><label><b id="pf-sync-t">${F.sync}</b><span id="pf-sync-d">${F.syncSub}</span></label>
        <button class="pf-sw" data-sw="sync" type="button" role="switch" aria-checked="true" aria-labelledby="pf-sync-t" aria-describedby="pf-sync-d"></button></li>
      <li class="pf-setting pf-row-share"><label><b id="pf-share-t">${F.share}</b><span id="pf-share-d"></span></label>
        <button class="pf-sw" data-sw="share" type="button" role="switch" aria-checked="true" aria-labelledby="pf-share-t" aria-describedby="pf-share-d"></button></li>
    </ul></div>`;

  const stage = el.querySelector('.pf-stage');
  const swA = el.querySelector('[data-sw="sync"]'), swB = el.querySelector('[data-sw="share"]');
  let sync = true, share = true, user = false, visible = false;
  const render = () => {
    const b = sync && share;
    stage.dataset.sync = sync; stage.dataset.share = b;
    swA.setAttribute('aria-checked', String(sync)); swB.setAttribute('aria-checked', String(b));
    swB.setAttribute('aria-disabled', String(!sync));
    el.querySelector('.pf-row-share').classList.toggle('is-locked', !sync);
    el.querySelector('#pf-share-d').textContent = sync ? F.shareSub : F.shareLocked;
    el.querySelector('.pf-cloud-state').textContent = sync ? F.cloudOn : F.cloudOff;
    el.querySelector('.pf-status').textContent = !sync ? F.off : !b ? F.synced : F.shared;
  };
  swA.addEventListener('click', () => { user = true; sync = !sync; if (!sync) share = false; render(); });
  swB.addEventListener('click', () => { if (!sync) return; user = true; share = !share; render(); });

  const GAP = 6;
  const box = (n) => { const r = n.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top, w: r.width, h: r.height }; };
  const pt = (n, side) => { const k = box(n);
    return side === 'left' ? [k.l - GAP, k.t + k.h / 2] : side === 'right' ? [k.r + GAP, k.t + k.h / 2]
      : side === 'top' ? [k.l + k.w / 2, k.t - GAP] : [k.l + k.w / 2, k.b + GAP]; };
  const hCurve = ([x1, y1], [x2, y2]) => { const m = (x1 + x2) / 2; return `M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}`; };
  const vCurve = ([x1, y1], [x2, y2]) => { const m = (y1 + y2) / 2; return `M${x1} ${y1}C${x1} ${m} ${x2} ${m} ${x2} ${y2}`; };
  const draw = (name, d) => stage.querySelectorAll(`[data-edge="${name}"] path`).forEach(p => p.setAttribute('d', d));
  const layout = () => {
    const cloud = el.querySelector('.pf-cloud'), cloudTile = cloud.querySelector('.pf-tile');
    const hub = pt(cloudTile, 'left');
    draw('phone', hCurve(pt(el.querySelector('.pf-phone .pf-tile'), 'right'), hub));
    draw('ipad', hCurve(hub, pt(el.querySelector('.pf-ipad .pf-tile'), 'right')));
    const below = box(el.querySelector('.pf-mates')).t > box(cloud).b;   // 窄版：旅伴排在框下方
    el.querySelectorAll('.pf-mate .pf-tile').forEach((t, i) => draw(`mate-${i + 1}`,
      below ? vCurve(pt(cloud, 'bottom'), pt(t, 'top')) : hCurve(pt(cloudTile, 'right'), pt(t, 'left'))));
  };
  render(); layout();
  new ResizeObserver(layout).observe(stage);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(el);
  // 自動示範：全開 → 關共編 → 關同步 → 開同步 → 開共編；使用者自己按過就不再自動
  const steps = [() => { share = false; }, () => { sync = false; }, () => { sync = true; }, () => { share = true; }, () => {}];
  let k = 0;
  setInterval(() => {
    if (user || !visible || reduced) return;
    steps[k % steps.length](); k += 1; render();
  }, 2200);
}

const DEMOS = { offline, runs, live, widget, flow };
document.querySelectorAll('[data-demo]').forEach(el => DEMOS[el.dataset.demo]?.(el));

/* ── 互動小元件：放在文字欄，捲到附近才載入 ────────────────────────────
   <div class="demo-slot" data-lazy-demo="calendar"></div>
   → 載入 assets/js/demos/<name>.js（default export (el, ctx)）與 assets/css/demos/<name>.css。
   沒有 JS 就是空的，截圖照樣在另一側。 */
import { loadTrip, loadCats, LANG as L2, pick } from './demos/_shared.js';
// 示範模組與樣式的版本號（tools/stamp-home.mjs 依 demos/ 內容雜湊蓋上）：Cloudflare 快取 4 小時，不帶版本手機會一直跑舊的
const DEMO_V = '6a8979d247';
const mount = async (el) => {
  const name = el.dataset.lazyDemo;
  el.innerHTML = '<div class="ms-loading"></div>';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = `/assets/css/demos/${name}.css?v=${DEMO_V}`; document.head.append(css);
  try {
    const [mod, trip, cats] = await Promise.all([import(`./demos/${name}.js?v=${DEMO_V}`), loadTrip(), loadCats()]);
    el.innerHTML = '';
    mod.default(el, { lang: L2, trip, cats, pick });
  } catch (e) { el.innerHTML = ''; el.hidden = true; console.warn('demo', name, e); }
};
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { io.unobserve(en.target); mount(en.target); }
}), { rootMargin: '400px 0px' });
document.querySelectorAll('[data-lazy-demo]').forEach((el) => io.observe(el));

/* ── iPhone 外框裡的 App 畫面 ────────────────────────────────────────────
   每張 App 截圖（/assets/img/shots/v2/<lang>/<name>.webp）本來就是 screens/<page>.html 渲染出來的。
   捲到附近時，同一張圖換成那個 HTML 畫面的互動版（iframe，interactive=1）：看起來一模一樣，但可以點。
   沒有 JS、或還沒捲到的時候，就是那張圖。 */
const SCREEN_OF = {
  calendar: ['calendar', 'day=2'], timeline: ['timeline', 'day=2'], overview: ['overview', ''],
  'event-extra': ['event', 'extra=1'], 'event-airport': ['event', 'event=d1-airport&extra=1'], leg: ['leg', ''], map: ['map', ''], 'map-place': ['map-place', ''],
  'map-store': ['map-store', ''], 'map-nav': ['map-nav', ''], members: ['members', ''],
  'share-location': ['share-location', ''], lock: ['lock', ''], widget: ['widget', ''],
  note: ['note', ''], fx: ['fx', ''], shop: ['shop', ''], scan: ['scan', ''],
  notes: ['notes', ''], toolbox: ['notes', 'menu=1'], 'scan-history': ['scan', 'hist=1'], 'fx-nokbd': ['fx', 'kbd=0'],
  'map-live': ['map-live', 'pan=0'], 'map-route': ['map-live', 'pan=0&nav=0&today=2&start=2026-10-09'], 'map-mates': ['map-live', 'pan=0&nav=0&today=2&start=2026-10-09&focus=mates'], 'share-ig': ['share-ig', ''], 'share-gmap': ['share-gmap', ''], 'inspiration-flow': ['share-web', ''], inspiration: ['inspiration', ''], 'apple-calendar': ['apple-calendar', ''], siri: ['siri', ''],
};
const SCREEN_LANG = { zh: 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' }[L2];
const [ZOOM, CLOSE, PLAYHINT] = pick({ zh: ['放大，自己玩玩看', '關閉', '親自玩玩看'], en: ['Open full screen and try it', 'Close', 'Try it yourself'], ja: ['拡大して自分で試す', '閉じる', '実際に触ってみよう'],
  ko: ['크게 열어 직접 써 보기', '닫기', '직접 써 보세요'] });
// 全螢幕試玩：一個 <dialog>，裡面一支放大的手機（同一個畫面，互動但不自動播放）
let playDlg;
function openPlay(page, q, title) {
  if (!playDlg) {
    playDlg = document.createElement('dialog');
    playDlg.className = 'play-dlg';
    playDlg.innerHTML = `<div class="play-wrap"><figure class="ph shot phone play-phone"><iframe width="402" height="874"></iframe></figure>
      <p class="play-hint"></p><button type="button" class="play-x" aria-label="${CLOSE}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`;
    document.body.append(playDlg);
    playDlg.querySelector('.play-x').onclick = () => playDlg.close();
    playDlg.addEventListener('click', (e) => { if (e.target === playDlg) playDlg.close(); });
    playDlg.addEventListener('close', () => { playDlg.querySelector('iframe').src = 'about:blank'; document.documentElement.style.overflow = ''; phones.forEach((f) => f._auto?.apply()); });
    new ResizeObserver(() => fitPlay()).observe(playDlg);
  }
  const fr = playDlg.querySelector('iframe');
  fr.name = `play-${Date.now()}`;
  fr.title = title;
  fr.src = `/screens/${page}.html?lang=${SCREEN_LANG}&interactive=1${q ? '&' + q : ''}`;
  playDlg.querySelector('.play-hint').textContent = PLAYHINT;
  document.documentElement.style.overflow = 'hidden';
  playDlg.showModal(); fitPlay();
}
function fitPlay() {
  const f = playDlg?.querySelector('.play-phone'); if (!f) return;
  const h = Math.min(innerHeight - 120, 874), w = Math.min(h * 402 / 874, innerWidth - 48);
  f.style.setProperty('--w', w + 'px');
  f.querySelector('iframe').style.transform = `scale(${w / 402})`;
}
const DIRECT = new Set(['lock']);
// autoplay.js＋stories*.js 的內容雜湊（tools/stamp-home.mjs 蓋）：帶進 iframe 網址，改了腳本手機不會用到快取裡的舊版
const AUTO_V = '8e2293d731';
const NO_AUTO = new Set(['note', 'members', 'lock', 'widget', 'apple-calendar', 'scan', 'fx', 'fx-nokbd', 'siri']);   // 沒有東西可演的、或使用者自己拖比較好的
addEventListener('message', (e) => {
  if (e.data?.type === 'tz-esc' && playDlg?.open) { playDlg.close(); return; }
  if (e.data?.type === 'tz-auto-hello') { for (const f of phones) if (f._fr?.contentWindow === e.source) f._auto?.apply(); return; }
  if (e.data?.type === 'tz-lock-state') {
    const f = phones.find((p) => p._fr?.contentWindow === e.source); if (!f) return;
    const x = f._ext || (f._ext = lockSlider(f, e.data.label0));
    x.update(e.data.f, e.data.label);
    return;
  }
  if (e.data?.type === 'tz-auto-progress') {
    const f = phones.find((p) => [...p.querySelectorAll('iframe')].some((fr) => fr.contentWindow === e.source));
    const bar = f?.querySelector('.auto-prog > i'); if (!bar) return;
    const d = e.data;
    if (d.reset) { bar.style.transition = 'none'; bar.style.width = '0'; return; }
    if (d.hold) { bar.style.width = getComputedStyle(bar).width; bar.style.transition = 'none'; return; }   // 停在現在的位置
    if (d.from == null) return;
    // 這一步：從 from 線性走到 to，花這一步的時間
    bar.style.transition = 'none'; bar.style.width = (d.from * 100).toFixed(2) + '%'; void bar.offsetWidth;
    bar.style.transition = `width ${d.ms}ms linear`; bar.style.width = (d.to * 100).toFixed(2) + '%';
    return;
  }
  if (e.data?.type === 'tz-auto-loop') { for (const f of phones) if (f._fr?.contentWindow === e.source) reloop(f); return; }
  if (e.data?.type === 'tz-nav') {
    const old = [...document.querySelectorAll('.ph.shot.phone > iframe')].find((fr) => fr.contentWindow === e.source);
    if (old && new URL(e.data.url).origin === location.origin) { e.source.postMessage({ type: 'tz-nav-ok' }, '*'); navSwap(old, e.data.url); }
    return;
  }
});
// 捲出畫面就暫停（省電、也不會在看不到的地方自己換頁），捲回來就繼續
const vio = new IntersectionObserver((es) => es.forEach((en) => {
  const a = en.target._auto; if (!a) return;
  a.st.visible = en.isIntersecting; a.apply();
}), { threshold: 0.35 });
const phones = [...document.querySelectorAll('figure.ph.shot')].filter((f) => {
  const m = f.querySelector('img')?.getAttribute('src')?.match(/\/shots\/v2\/\w+\/([\w-]+)\.webp$/);
  const key = f.dataset.screenPage || m?.[1];   // data-screen-page：圖還是舊的，畫面換成新的那一支
  if (!m || !SCREEN_OF[key]) return false;
  f.dataset.screen = key; f.classList.add('phone'); return true;
});
// 外框粗細用像素寬算（--wpx）：--w 有時是百分比，拿百分比去乘在 box-shadow 裡無效，整個外框會被丟掉
// 一輪播完：背景開一份新的（新的 name＝乾淨的狀態），畫好後淡入蓋過舊的，再拿掉舊的——不閃白
function reloop(f) {
  const old = f._fr, nf = document.createElement('iframe');
  nf.width = 402; nf.height = 874; nf.title = old.title; nf.className = 'is-next';
  nf.name = `${old.name.replace(/r\d+$/, '')}r${Date.now()}`;   // 新的 name＝乾淨的狀態；要符合 demo-state 的 tzd[a-z0-9]+，不然會被換成亂數
  nf.src = f._src;
  nf.addEventListener('load', () => setTimeout(() => {
    f._fr = nf; f._auto?.apply();
    nf.classList.remove('is-next');
    setTimeout(() => old.remove(), 400);
  }, 700), { once: true });
  f.append(nf); fit(f);
}
// 畫面裡換頁（行事曆↔時間軸、換日、開詳情…）：新的一頁在背景載好、畫完，再瞬間換掉舊的。
// 同一個 name，畫面自己的狀態（sessionStorage）接得上；標題列與分頁列位置不變，看起來只有中間在換。
function navSwap(old, url) {
  const nf = document.createElement('iframe');
  nf.width = 402; nf.height = 874; nf.title = old.title; nf.className = 'is-next';
  // 沿用舊那一頁「實際的」window.name：示範進度與畫面狀態都掛在它底下，換了就從第一步重來、卡在等頁面（2026-10-12）
  nf.name = old.contentWindow?.name || old.name;
  nf.style.transform = old.style.transform; nf.style.transition = 'none';
  nf.src = url;
  nf.addEventListener('load', () => {
    const t0 = Date.now();
    const swap = () => {
      if (nf.contentDocument?.body?.dataset.ready !== '1' && Date.now() - t0 < 1500) return setTimeout(swap, 30);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        nf.classList.remove('is-next'); old.remove();
        const f = phones.find((p) => p._fr === old);
        if (f) { f._fr = nf; f._auto?.apply(); }
      }));
    };
    swap();
  }, { once: true });
  old.after(nf);
}
const fit = (f) => { f.style.setProperty('--wpx', f.clientWidth + 'px'); f.querySelectorAll('iframe').forEach((fr) => { fr.style.transform = `scale(${f.clientWidth / 402})`; }); };
const ro = new ResizeObserver((es) => es.forEach((e) => fit(e.target)));
function mountPhone(f) {
  if (f._mounted) return; f._mounted = true;
  const [page, q] = SCREEN_OF[f.dataset.screen];
  // MapKit JS 的 token 只認 tripezgo.com；本機用 tools/mapkit-dev-token.mjs 簽的那張（只認 localhost:8770）。
  // 其他網域兩張都沒有，地圖畫不出來，留著預覽圖就好
  if (page === 'map-live' && !['tripezgo.com', 'localhost'].includes(location.hostname)) return;
  const fr = document.createElement('iframe');
  // 自動示範只給有東西可操作的段落：Hero 三張與筆記不跑（使用者 2026-10-11）
  const auto = !f.closest('.hero') && !NO_AUTO.has(f.dataset.screen);
  fr.src = `/screens/${page}.html?lang=${SCREEN_LANG}&interactive=1${auto ? '&auto=' + f.dataset.screen + '&av=' + AUTO_V : ''}${f.dataset.screen === 'lock' ? '&ext=1' : ''}${q ? '&' + q : ''}`;
  // 每支手機自己的狀態 id（autoplay、demo-state 用）。demo-state 只認 tzd[a-z0-9]+，其他的會被它換成亂數
  fr.name = `tzdp${phones.indexOf(f)}${f.dataset.screen.replace(/[^a-z0-9]/g, '')}`;
  fr.title = f.querySelector('img').alt; fr.width = 402; fr.height = 874;
  const isMap = page === 'map-live';
  if (!isMap) fr.loading = 'lazy';
  // 地圖：iframe 的 load 只代表 HTML 到了，MapKit 還沒取完景（畫面一片白）。先蓋著預覽圖＋轉圈，畫面回報 ready 才換上（使用者 2026-10-12）
  if (isMap) f.insertAdjacentHTML('beforeend', '<span class="ph-loading" aria-hidden="true"></span>');
  const live = () => { f.classList.add('is-live'); f._auto?.apply(); };   // 載入前送的 play/pause 會掉，載入後補送一次
  fr.addEventListener('load', () => {
    if (!isMap) return live();
    const t0 = Date.now();
    const wait = () => (fr.contentDocument?.body?.dataset.ready === '1' || Date.now() - t0 > 12000 ? live() : setTimeout(wait, 100));
    wait();
  });
  f._fr = fr; f._src = fr.src;
  f.append(fr); fit(f); ro.observe(f);
  // 點手機畫面＝全螢幕打開，自己玩（首頁上這支只負責示範，不直接操作）。
  const st = { visible: false };   // visible 由 vio 回報；捲進畫面才播
  const hit = document.createElement('button');
  hit.type = 'button'; hit.className = 'phone-hit'; hit.setAttribute('aria-label', ZOOM); hit.title = ZOOM;
  hit.onclick = () => { openPlay(page, q, f.querySelector('img').alt); apply(); };
  // 沒有暫停鈕，使用者也停不了（使用者 2026-10-12）：只在捲出畫面、或全螢幕試玩開著的時候停，關掉就接著播
  const apply = () => {
    const p = !st.visible || !!playDlg?.open;
    f._fr?.contentWindow?.postMessage({ type: 'tz-auto-ctl', cmd: p ? 'pause' : 'play' }, '*');
  };
  f._auto = { st, apply };
  // 鎖定畫面：時間條要在首頁上直接拖，不蓋「點了就全螢幕」那一層
  f.append(...(DIRECT.has(f.dataset.screen) ? [] : [hit]));
  if (auto) f.insertAdjacentHTML('beforeend', '<span class="auto-prog" aria-hidden="true"><i></i></span>');
  if (auto) f.classList.add('has-prog');
  vio.observe(f);
}
// 鎖定畫面的時間拉桿：畫在手機外面、手機底下（使用者 2026-10-12）。拖、點軌道、鍵盤都轉成 tz-lock-set 送進畫面
function lockSlider(f, name) {
  f.classList.add('has-ext');
  f.insertAdjacentHTML('beforeend', `<div class="lk-ext" role="slider" tabindex="0" aria-label="${name}" aria-valuemin="0" aria-valuemax="100">
    <div class="lk-ext-t"></div><div class="lk-ext-track"><div class="lk-ext-fill"></div><div class="lk-ext-thumb"></div></div></div>`);
  const el = f.querySelector('.lk-ext'), track = el.querySelector('.lk-ext-track');
  let cur = 0, last = 0, pid = null;   // last：最後送進去的值（畫面回報 cur 是非同步的，放開時要用 last）
  const send = (v, dragging = false) => { last = Math.min(1, Math.max(0, v)); f._fr?.contentWindow?.postMessage({ type: 'tz-lock-set', f: last, dragging }, '*'); };
  const fromX = (x) => { const r = track.getBoundingClientRect(); return (x - r.left) / r.width; };
  el.addEventListener('pointerdown', (e) => { pid = e.pointerId; el.classList.add('active'); try { el.setPointerCapture(pid); } catch {} send(fromX(e.clientX), true); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === pid) send(fromX(e.clientX), true); });
  const end = (e) => { if (e.pointerId !== pid) return; pid = null; el.classList.remove('active'); send(last); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', (e) => {   // 07:00–21:00 共 14 小時：←→ 15 分、PageUp/Down 1 小時
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 4, PageDown: -4 }[e.key];
    if (step) send(cur + step / 56); else if (e.key === 'Home') send(0); else if (e.key === 'End') send(1); else return;
    e.preventDefault();
  });
  return { update(v, label) {
    cur = v; const pct = (v * 100).toFixed(2) + '%';
    el.querySelector('.lk-ext-fill').style.width = pct; el.querySelector('.lk-ext-thumb').style.left = pct;
    el.querySelector('.lk-ext-t').textContent = label; el.setAttribute('aria-valuenow', Math.round(v * 100)); el.setAttribute('aria-valuetext', label);
  } };
}
// 一般畫面捲到附近（300px）才載；地圖提早很多（MapKit 要拉 SDK 跟圖磚），捲到時已經畫好（使用者 2026-10-12）
const lazyIO = (margin) => new IntersectionObserver((es, io) => es.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); mountPhone(en.target); } }), { rootMargin: margin });
const pio = lazyIO('300px 0px'), mio = lazyIO('2000px 0px');
phones.forEach((f) => { (SCREEN_OF[f.dataset.screen][0] === 'map-live' ? mio : pio).observe(f); ro.observe(f); fit(f); });

/* ── 右下角「立即下載 App」：捲過 hero 才出現；最底下的下載區看得到時收起來（使用者 2026-10-12） ── */
{
  const fab = document.querySelector('.fab-dl');
  const hero = document.querySelector('.hero');
  const ends = [...document.querySelectorAll('main .btn-primary[href*="apps.apple.com"]')].filter((a) => !a.closest('.hero, .promo'));   // 活動的兌換鈕不是下載鈕
  if (fab && hero) {
    fab.hidden = false;
    let past = false; const seen = new Set();
    const sync = () => fab.classList.toggle('is-on', past && !seen.size);
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(hero);
    const eio = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); sync(); });
    ends.forEach((a) => eio.observe(a));
    // 捲動中淡出、停下來 250ms 再淡入（使用者 2026-10-12）
    let idle = 0;
    addEventListener('scroll', () => { fab.classList.add('is-scrolling'); clearTimeout(idle); idle = setTimeout(() => fab.classList.remove('is-scrolling'), 250); }, { passive: true });
  }
}

/* 語言下拉：點選單外面或按 Esc 就收起來 */
{
  const menu = document.querySelector('.lang-menu');
  if (menu) {
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  }
}

/* ── 背景故事的「我的遊記」：tools/journals.mjs 從部落格 sitemap 產的 assets/data/journals.json（使用者 2026-10-12）。
   橫向捲動、最新的在前；韓文頁用英文版（部落格沒有韓文）。 ── */
{
  const box = document.querySelector('[data-journals]');
  if (box) {
    const key = { zh: 'zh', en: 'en', ja: 'ja', ko: 'en' }[LANG] || 'zh';
    const fmt = new Intl.DateTimeFormat({ zh: 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' }[LANG] || 'zh-Hant-TW', { year: 'numeric', month: 'short' });
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const day = new Date().toISOString().slice(0, 10);   // 一天換一次網址：CI 每天重產，快取最多舊一天
    fetch(`/assets/data/journals.json?d=${day}`).then((r) => (r.ok ? r.json() : [])).then((items) => {
      const cards = items.map((it) => it[key] || it.en || it.zh).map((p, i) => ({ ...p, date: items[i].date, image: items[i].image }))
        .filter((p) => p && p.url && p.title);
      if (!cards.length) { box.previousElementSibling?.matches('h3') && (box.previousElementSibling.hidden = true); box.hidden = true; return; }
      box.innerHTML = `<ul class="jr-row">${cards.map((p) => `<li><a class="jr-card" href="${esc(p.url)}" target="_blank" rel="noopener">
        <img src="${esc(p.image)}" alt="" loading="lazy" decoding="async"><span class="jr-date">${esc(fmt.format(new Date(p.date)))}</span>
        <span class="jr-title">${esc(p.title)}</span></a></li>`).join('')}</ul>`;
    }).catch(() => { box.hidden = true; });
  }
}

/* 手機版漢堡選單：點了某一項、點外面或按 Esc 就收起來 */
{
  const nav = document.querySelector('.nav-menu');
  if (nav) {
    nav.addEventListener('click', (e) => { if (e.target.closest('.nav-list a')) nav.open = false; });
    document.addEventListener('click', (e) => { if (nav.open && !nav.contains(e.target)) nav.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.open) { nav.open = false; nav.querySelector('summary').focus(); } });
  }
}

/* 藍圖：橫向時間軸（使用者 2026-10-13）。載入時只捲外框、把「進行中」那張置中，不帶動整頁（不用 scrollIntoView）；
   桌機有左右箭頭與滑鼠拖曳，手機直接滑 */
{
  const root = document.getElementById('roadmap');
  const sc = root?.querySelector('.rm-scroller');
  if (sc) {
    const frame = root.querySelector('.rm-frame');
    const prev = root.querySelector('.rm-btn[data-dir="-1"]'), next = root.querySelector('.rm-btn[data-dir="1"]');
    const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const centerOf = (el) => { const s = sc.getBoundingClientRect(), r = el.getBoundingClientRect(); return sc.scrollLeft + (r.left - s.left) - (s.width - r.width) / 2; };
    const sync = () => {
      const max = sc.scrollWidth - sc.clientWidth, atStart = sc.scrollLeft <= 2, atEnd = sc.scrollLeft >= max - 2;
      frame.toggleAttribute('data-at-start', atStart); frame.toggleAttribute('data-at-end', atEnd);
      prev.disabled = atStart; next.disabled = atEnd;
    };
    // 字型、版面晚到會讓卡片位置變；使用者還沒動過外框之前，每次都重新置中
    let touched = false;
    // 沒有「進行中」的時候（例如只剩一張即將推出的修正版），改以「即將推出」那張置中，不然一打開停在最舊那一端
    const now = root.querySelector('.rm-item.is-now') || root.querySelector('.rm-item.is-soon');
    const center = () => { if (now && !touched) { sc.style.scrollSnapType = 'none'; sc.scrollLeft = centerOf(now); sc.style.scrollSnapType = ''; } sync(); };
    center();
    document.fonts?.ready.then(center);
    addEventListener('load', center);
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((t) => sc.addEventListener(t, () => { touched = true; }, { passive: true }));
    sc.addEventListener('scroll', sync, { passive: true });
    new ResizeObserver(() => { center(); }).observe(sc);
    // 箭頭：一次走一個里程碑（相鄰兩張只錯開半張，不能用卡寬當步長）
    const items = [...sc.querySelectorAll('.rm-item')];
    const nearest = () => items.reduce((a, b) => (Math.abs(centerOf(a) - sc.scrollLeft) <= Math.abs(centerOf(b) - sc.scrollLeft) ? a : b));
    [prev, next].forEach((b) => b.addEventListener('click', () => {
      touched = true;
      const i = Math.max(0, Math.min(items.length - 1, items.indexOf(nearest()) + Number(b.dataset.dir)));
      sc.scrollTo({ left: centerOf(items[i]), behavior: smooth });
    }));
    let x0 = 0, left0 = 0, dragging = false;
    sc.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; dragging = true; x0 = e.clientX; left0 = sc.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 3) sc.classList.add('is-dragging');
      if (sc.classList.contains('is-dragging')) sc.scrollLeft = left0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      if (!sc.classList.contains('is-dragging')) return;
      const target = nearest();
      sc.classList.remove('is-dragging');
      sc.scrollTo({ left: centerOf(target), behavior: smooth });
    });
  }
}

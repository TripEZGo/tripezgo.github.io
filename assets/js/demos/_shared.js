// 首頁互動小元件的共用工具。每個小元件是 assets/js/demos/<name>.js，default export 一支 (el, ctx) => void。
//
//   el   要畫進去的容器（[data-demo="<name>"]），小元件自己 innerHTML、自己綁事件
//   ctx  { lang: 'zh'|'en'|'ja'|'ko', trip: <範本 JSON>, cats: { category: 名稱 }, pick(obj) => obj[lang] }
//
// 行程資料是 App 內建範本「山陽 6 日」（assets/data/sanyo-<lang>.json，由 tools/sync-screen-data.py 從 App repo 複製）。
// 規則照 App 的實作（各小元件檔頭註明出處），不是照印象。
export const LANG = (() => {
  // ?demo-lang=en|ja|ko 只給本機測試用：在繁中首頁上用英日韓文跑小元件
  const l = new URLSearchParams(location.search).get('demo-lang') || document.documentElement.lang;
  return l.startsWith('ja') ? 'ja' : l.startsWith('en') ? 'en' : l.startsWith('ko') ? 'ko' : 'zh';
})();
// 韓文首頁是後來加的（2026-10-12）：還沒有韓文的字先用英文，不要讓韓文頁冒出中文
export const pick = (o) => o[LANG] ?? (LANG === 'ko' ? o.en : undefined) ?? o.zh;
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const hhmm = (m) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** App 的時長字串（Domain.json domain.duration.*） */
export const duration = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  const f = pick({
    zh: [(m) => `${m} 分`, (h) => `${h} 小時`, (h, m) => `${h} 小時 ${m} 分`],
    en: [(m) => `${m} min`, (h) => `${h} h`, (h, m) => `${h} h ${m} min`],
    ja: [(m) => `${m} 分`, (h) => `${h} 時間`, (h, m) => `${h} 時間 ${m} 分`],
    ko: [(m) => `${m}분`, (h) => `${h}시간`, (h, m) => `${h}시간 ${m}분`],
  });
  return !h ? f[0](m) : m ? f[2](h, m) : f[1](h);
};

/** 行程類型 → 色組（照 App 的 EventTypeSwatch.swift 分組與 OKLCH 配方）。回傳 CSS 顏色字串。 */
const SWATCH = {
  move: ['flight', 'airport', 'ferry', 'harbor', 'hsr', 'train', 'station'],
  moveLocal: ['transport', 'metro', 'bus', 'taxi', 'driving', 'carrental', 'cycling', 'cablecar', 'fuel', 'chargingstation', 'parking'],
  see: ['sight', 'museum', 'artgallery', 'temple', 'castle', 'show'],
  seeNature: ['park', 'mountain', 'beach', 'waterfall', 'viewpoint', 'onsen', 'aquarium', 'zoo', 'diving'],
  eat: ['dining', 'fastfood'], eatLight: ['cafe', 'bar', 'dessert', 'bakery'],
  stay: ['lodging', 'hotel'], stayLodge: ['guesthouse', 'camping'],
  shop: ['shopping', 'conveniencestore', 'souvenir'], shopMarket: ['market'],
};
const RECIPE = {
  eat: [0.452, 0.086, 30], eatLight: [0.510, 0.076, 30], shop: [0.566, 0.079, 74], shopMarket: [0.624, 0.070, 74],
  see: [0.498, 0.058, 150], seeNature: [0.556, 0.051, 150], stay: [0.428, 0.074, 264], stayLodge: [0.486, 0.065, 264],
  move: [0.524, 0.062, 322], moveLocal: [0.582, 0.055, 322], misc: [0.545, 0.022, 65],
};
const GROUP = Object.fromEntries(Object.entries(SWATCH).flatMap(([g, list]) => list.map((c) => [c, g])));
export const swatch = (category) => { const [l, c, h] = RECIPE[GROUP[category] || 'misc']; return `oklch(${l} ${c} ${h})`; };
/** 卡片底色：swatch 混一點進頁面底色 */
export const swatchFill = (category) => `color-mix(in oklab, ${swatch(category)} 16%, var(--page))`;

let tripP, catsP;
// assets/data/ 只有中英日三份範本（tools/sync-screen-data.py）；韓文頁讀英文那份，小元件照樣畫得出來
const DATA_LANG = ['zh', 'en', 'ja'].includes(LANG) ? LANG : 'en';
export const loadTrip = () => (tripP ??= fetch(`/assets/data/sanyo-${DATA_LANG}.json`).then((r) => r.json()));
export const loadCats = () => (catsP ??= fetch('/assets/data/categories.json').then((r) => r.json()).then((c) => c[DATA_LANG === 'zh' ? 'zh-Hant-TW' : DATA_LANG]));

/** 一天的定時行程（有 start/end 的），照時間排好 */
export const dayEvents = (trip, n) => (trip.days.find((d) => d.day === n)?.events ?? []).filter((e) => e.start && e.end);

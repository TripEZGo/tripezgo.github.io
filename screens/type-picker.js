// 商品類型（1.7.0，ADR-0065）：26 種、依 8 大類分群、每種一枚圖示——購物表單的「類型｜品名」與類型選擇紙、靈感的「地點｜商品」分段共用。
// 資料照 App：Domain/ProductType.swift（key、大類、順序）、UI/ProductTypeSwatch.swift（8 大類的色）、UI/Components/Foundation/ProductTypeIcons.swift
// （24 格的實心圖示，路徑一字不動）、字串 domain.producttype.*／domain.shoppingcategory.*（Scripts/i18n/maps/Domain.json）、
// 紙的版面 UI/Components/Foundation/EventTypePickerViewController.swift（分段、搜尋、群標題、晶片 WrappingStack 間距 8、群間 16）。
import { lang } from './chrome.js';
import { di } from './share-ext.js';

const L = { 'zh-Hant-TW': 0, en: 1, ja: 2, ko: 3 }[lang] ?? 1;
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// [zh-Hant-TW, en, ja, ko]
const NAME = {
  cookie: ['餅乾', 'Cookies', 'クッキー', '쿠키'], wagashi: ['和菓子', 'Wagashi', '和菓子', '화과자'],
  cake_dessert: ['蛋糕甜點', 'Cakes & Desserts', 'ケーキ・スイーツ', '케이크·디저트'], chocolate_candy: ['巧克力糖果', 'Chocolate & Candy', 'チョコ・キャンディ', '초콜릿·사탕'],
  charm_badge: ['吊飾徽章', 'Charms & Pins', 'キーホルダー・バッジ', '키링·뱃지'],
  savory_snack: ['鹹味零食', 'Savory Snacks', 'スナック菓子', '스낵'], instant_meal: ['泡麵便當', 'Instant Meals & Bento', 'カップ麺・お弁当', '라면·도시락'],
  seasoning: ['調味料', 'Seasonings', '調味料', '조미료'], tea_coffee: ['茶咖啡飲品', 'Tea & Coffee', 'お茶・コーヒー', '차·커피·음료'],
  bottled_alcohol: ['瓶裝酒', 'Bottled Alcohol', 'お酒（瓶）', '병 주류'], canned_alcohol: ['罐裝酒', 'Canned Alcohol', 'お酒（缶）', '캔 주류'],
  medicine: ['藥品', 'Medicine', '医薬品', '의약품'], supplement: ['保健食品', 'Supplements', 'サプリ', '건강기능식품'],
  face_mask: ['面膜', 'Face Masks', 'フェイスマスク', '마스크팩'], skincare: ['保養品', 'Skincare', 'スキンケア', '스킨케어'],
  makeup: ['彩妝', 'Makeup', 'コスメ', '메이크업'], bath_hair: ['洗沐髮品', 'Bath & Hair', 'バス・ヘアケア', '바디·헤어케어'],
  apparel: ['衣服', 'Apparel', '衣類', '의류'], shoes: ['鞋子', 'Shoes', '靴', '신발'], bag_wallet: ['包包皮夾', 'Bags & Wallets', 'バッグ・財布', '가방·지갑'],
  accessory: ['配件飾品', 'Accessories', 'アクセサリー', '액세서리'], luxury_goods: ['精品', 'Luxury', 'ブランド品', '명품'],
  figure_plush: ['公仔娃娃', 'Figures & Plush', 'フィギュア・ぬいぐるみ', '피규어·인형'], stationery_goods: ['文具雜貨', 'Stationery & Goods', '文具・雑貨', '문구·잡화'],
  electronics_appliance: ['3C家電', 'Electronics', '家電・電子機器', '전자제품'], other_product: ['其他', 'Other', 'その他', '기타'],
};
// 群標題＝8 大類的名字（ShoppingCategory.displayName）；順序＝ProductType 宣告的順序
const GROUPS = [
  { cat: 'souvenir', title: ['紀念品', 'Souvenirs', 'お土産', '기념품'], hex: '#b0503c', names: ['cookie', 'wagashi', 'cake_dessert', 'chocolate_candy', 'charm_badge'] },
  { cat: 'food', title: ['食品', 'Food', '食品', '식품'], hex: '#8a5a3a', names: ['savory_snack', 'instant_meal', 'seasoning', 'tea_coffee', 'bottled_alcohol', 'canned_alcohol'] },
  { cat: 'drugstore', title: ['藥妝', 'Drugstore', 'ドラッグストア', '드러그스토어'], hex: '#4a8a6a', names: ['medicine', 'supplement', 'face_mask', 'skincare', 'makeup', 'bath_hair'] },
  { cat: 'clothing', title: ['衣服', 'Clothing', '衣類', '의류'], hex: '#5a6a9a', names: ['apparel', 'shoes', 'bag_wallet', 'accessory'] },
  { cat: 'luxury', title: ['精品', 'Luxury', 'ブランド品', '명품'], hex: '#7a5a86', names: ['luxury_goods'] },
  { cat: 'goods', title: ['雜貨', 'Daily Goods', '雑貨', '생활용품'], hex: '#4a5a8a', names: ['figure_plush', 'stationery_goods'] },
  { cat: 'electronics', title: ['3C 電器', 'Electronics', '家電・電子機器', '전자제품'], hex: '#3f6f7d', names: ['electronics_appliance'] },
  { cat: 'other', title: ['其他', 'Other', 'その他', '기타'], hex: '#857868', names: ['other_product'] },
];
export const PRODUCT_GROUPS = GROUPS;
export const productName = k => NAME[k]?.[L] ?? k;
const GROUP_OF = Object.fromEntries(GROUPS.flatMap(g => g.names.map(n => [n, g])));

// ProductTypeIcons.glyphs：24 格；p＝<path d>（e＝evenodd）、c＝<circle>、l＝淡白（destinationOut，alpha）
const P = (d, e) => ({ d, e }), C = (cx, cy, r) => ({ cx, cy, r }), LT = (d, a) => ({ d, l: a });
const ICON = {
  cookie: [P('M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zM8.5 7a1.4 1.4 0 1 0 0 2.8A1.4 1.4 0 0 0 8.5 7zm6.5 1.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm-4 4.5a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm5 2.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z', 1)],
  wagashi: [C(12, 5.2, 3.2), C(12, 11.6, 3.2), C(12, 18, 3.2), P('M11.3 1h1.4v22h-1.4z')],
  cake_dessert: [P('M3 13h18v8H3z'), P('M3 11.2 19.5 6.6A1.5 1.5 0 0 1 21 8.1v3.1H3z'), P('M15.5 2.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z')],
  chocolate_candy: [P('M8 8.5h8a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7z'), P('M2 7.5 6.5 12 2 16.5zM22 7.5 17.5 12 22 16.5z')],
  savory_snack: [P('M5 3h14l-1.2 3 1.2 15H5l1.2-15z'), LT('M9 11.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0z', 0.55)],
  instant_meal: [P('M3 7h18l-2.2 14H5.2z'), P('M2.5 4h19v2.2h-19z')],
  seasoning: [P('M9 2h6v3H9z'), P('M7.5 5.5h9l1.3 3.2V21H6.2V8.7z')],
  tea_coffee: [P('M3 8h14v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z'), P('M17 9h1.5a3 3 0 0 1 0 6H17v-2h1.5a1 1 0 0 0 0-2H17z'),
    P('M7 2.5c1 1.3 1 2.4 0 3.6h1.6c1-1.2 1-2.3 0-3.6zM11 2.5c1 1.3 1 2.4 0 3.6h1.6c1-1.2 1-2.3 0-3.6z')],
  bottled_alcohol: [P('M10 1.5h4v5.2c2 1 3 2.8 3 5V22H7V11.7c0-2.2 1-4 3-5z')],
  canned_alcohol: [P('M7.5 2h9l1.5 2.5v15L16.5 22h-9L6 19.5v-15z')],
  medicine: [P('M8.5 3.5a5 5 0 0 1 7.1 0l4.9 4.9a5 5 0 0 1-7.1 7.1l-4.9-4.9a5 5 0 0 1 0-7.1zM3.5 8.5l7.1 7.1-2.1 2.1A5 5 0 0 1 1.4 10.6z')],
  supplement: [P('M8 2h8v3H8z'), P('M6 6h12v16H6zm5 4.5v2.5H8.5v2H11v2.5h2V15h2.5v-2H13v-2.5z', 1)],
  face_mask: [P('M12 2c4.6 0 8 3.5 8 9 0 6.5-4 11-8 11s-8-4.5-8-11c0-5.5 3.4-9 8-9zM8.5 9a1.5 1.2 0 1 0 0 2.4 1.5 1.2 0 0 0 0-2.4zm7 0a1.5 1.2 0 1 0 0 2.4 1.5 1.2 0 0 0 0-2.4zM10 16.5h4a2 1.2 0 0 1-4 0z', 1)],
  skincare: [P('M4 9h16v12H4z'), P('M5.5 5h13v3h-13z')],
  makeup: [P('M9.5 2.5 14.5 5v6h-5z'), P('M8 12h8v3.5H8zM7 16.5h10V22H7z')],
  bath_hair: [P('M11 1.5h5v2h-3v2.2H11z'), P('M8 6.5h8l1 3V22H7V9.5z')],
  apparel: [P('M8.5 3 12 5l3.5-2L22 7l-2.5 4-2.5-1.3V21H7V9.7L4.5 11 2 7z')],
  shoes: [P('M2 12.5c3 .5 5-.5 6.5-3.5l3 1.5c1.5 2.5 4.5 3 8 3.5a2.5 2.5 0 0 1 2.5 2.5V18H2z'), P('M2 19h20v2H2z')],
  bag_wallet: [P('M8 7.5a4 4 0 0 1 8 0h3.5L21 21H3L4.5 7.5zm2 0h4a2 2 0 0 0-4 0z', 1)],
  accessory: [P('M4 15c0-5 3.6-9 8-9s8 4 8 9z'), P('M2 16h20v2.5H2z')],
  luxury_goods: [P('M6.5 3h11L22 9l-10 12L2 9z')],
  charm_badge: [P('M8 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z', 1),
    P('M10.5 9.5h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 9 20v-9a1.5 1.5 0 0 1 1.5-1.5z')],
  figure_plush: [P('M5.5 2.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm13 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'), P('M12 4.5a8 8 0 1 1 0 16 8 8 0 0 1 0-16z')],
  stationery_goods: [P('M16.5 2.5 21.5 7.5 9 20H4v-5z'), P('M3 21h18v1.5H3z')],
  electronics_appliance: [P('M12 3a9 9 0 0 1 9 9v6.5a2.5 2.5 0 0 1-2.5 2.5H16v-8h3v-.5a7 7 0 0 0-14 0v.5h3v8H5.5A2.5 2.5 0 0 1 3 18.5V12a9 9 0 0 1 9-9z')],
  other_product: [P('M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z')],
};
export const productGlyph = k => {
  const pieces = ICON[k] || ICON.other_product;
  const lt = pieces.find(p => p.l);
  const id = `pg-${k}`;
  const body = pieces.filter(p => !p.l).map(p => p.cx != null ? `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"/>` : `<path d="${p.d}"${p.e ? ' fill-rule="evenodd"' : ''}/>`).join('');
  return lt
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><mask id="${id}"><rect width="24" height="24" fill="#fff"/><path d="${lt.d}" fill="#000" fill-opacity="${lt.l}"/></mask><g mask="url(#${id})">${body}</g></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
};

// ── 顏色：ProductTypeSwatch（淺色＝設計稿 --c-*；深色＝同色相、明度上移到至少 .72、彩度 ×.66）、chipFill＝20%（深 26%）疊 surface、chipStroke＝45% 疊 border ──
const lin = v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const gam = v => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
function toOk(hex) {
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const c = Math.hypot(A, B);
  return { l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_, c, h: c < 1e-6 ? 0 : Math.atan2(B, A) };
}
function toCss({ l, c, h }) {
  const A = c * Math.cos(h), B = c * Math.sin(h);
  const L = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3, M = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3, S = (l - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  const rgb = [4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S, -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S, -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S]
    .map(v => Math.round(Math.min(1, Math.max(0, gam(v))) * 255));
  return `rgb(${rgb.join(',')})`;
}
function mix(a, w, b) {
  let h;
  if (a.c < 1e-6 && b.c < 1e-6) h = 0; else if (a.c < 1e-6) h = b.h; else if (b.c < 1e-6) h = a.h;
  else { let dd = b.h - a.h; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; h = a.h + dd * (1 - w); }
  return { l: a.l * w + b.l * (1 - w), c: a.c * w + b.c * (1 - w), h };
}
const DARK = document.documentElement.dataset.theme === 'dark';
const SURFACE = toOk(DARK ? '#221c17' : '#fbf8f4'), BORDER = toOk(DARK ? '#382f27' : '#dbd5cd');
export function productSwatch(k) {
  const g = GROUP_OF[k] || GROUPS[7];
  let base = toOk(g.hex);
  if (DARK) base = { ...base, l: Math.max(base.l, 0.72), c: base.c * 0.66 };
  return { base: toCss(base), fill: toCss(mix(base, (DARK ? 0.22 : 0.16) + 0.04, SURFACE)), stroke: toCss(mix(base, 0.45, BORDER)) };
}

// 晶片：選中＝類型色的淡底＋45% 邊＋實色圖示＋粗體（share-ext.css 的 .chip）；沒選＝sunken 底、border、墨色圖示、一般字
export const productChip = (k, sel = true) => {
  const s = productSwatch(k);
  return sel
    ? `<span class="tpchip" style="--sw-base:${s.base};--sw-chip-fill:${s.fill};--sw-chip-stroke:${s.stroke}">${productGlyph(k)}${esc(productName(k))}</span>`
    : `<span class="tpchip off">${productGlyph(k)}${esc(productName(k))}</span>`;
};

export const TP = {
  title: ['類型', 'Type', '種類', '종류'][L], search: ['搜尋類型', 'Search types', '種類を検索', '유형 검색'][L],
  seg: [['地點', '商品'], ['Place', 'Product'], ['場所', '商品'], ['장소', '상품']][L], none: ['未指定', 'Not set', '未指定', '지정 안 함'][L],
  done: ['完成', 'Done', '完了', '완료'][L],
};

export const TP_CSS = `
/* 類名一律 tp- 開頭：靈感頁自己也有 .chip／.seg／.ttl，不能撞 */
.tpchip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px; border-radius: 22px; box-sizing: border-box; white-space: nowrap;
  border: 1px solid var(--sw-chip-stroke); background: var(--sw-chip-fill); font: 700 var(--t-sm)/16px var(--font); color: var(--ink); }
.tpchip svg { width: 16px; height: 16px; fill: var(--sw-base); flex: none; }
.tpchip.off { background: var(--sunken); border-color: var(--border); font-weight: 400; } .tpchip.off svg { fill: var(--ink); }
.tpdim { position: absolute; inset: 0; z-index: 60; background: var(--sys-dim); }
.tp { position: absolute; left: 0; right: 0; top: 70px; bottom: 0; z-index: 61; background: var(--page); border-radius: 12px 12px 0 0; overflow: hidden; }
.tp .tpgrab { position: absolute; left: 50%; margin-left: -18px; top: 5px; width: 36px; height: 5px; border-radius: 2.5px; background: var(--sys-grab); }
.tp .tpttl { position: absolute; left: 80px; right: 80px; top: 16px; height: 44px; display: grid; place-items: center; font: 600 17px/22px var(--font); color: var(--sys-label, var(--ink)); margin: 0; }
.tp .tpdone { position: absolute; right: 16px; top: 16px; height: 44px; padding: 0 6px; display: grid; place-items: center; font: 600 var(--t-lg)/22px var(--font); color: var(--accent-ink); }
.tp .tpin { position: absolute; left: 0; right: 0; top: 70px; bottom: 0; overflow: hidden; padding: 0 20px; }
.tp .tpseg { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; height: 36px; padding: 2px; border-radius: 18px; background: #eeeeef; margin-bottom: 8px; }
.tp .tpseg span { display: grid; place-items: center; border-radius: 16px; font: 400 var(--t-sm)/16px var(--font); color: var(--ink); white-space: nowrap; overflow: hidden; }
.tp .tpseg span.on { background: #fff; font-weight: 600; box-shadow: 0 0 0 .5px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.08); }
html[data-theme="dark"] .tp .tpseg { background: var(--sys-seg-bg); } html[data-theme="dark"] .tp .tpseg span.on { background: var(--sys-seg-pill); box-shadow: none; }
.tp .tpsch { position: relative; margin-bottom: 8px; }
.tp .tpsch svg { position: absolute; left: 12px; top: 14px; width: 16px; height: 16px; fill: none; stroke: var(--muted); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tp .tpinp { box-sizing: border-box; min-height: 44px; padding: 10px 12px 10px 38px; border: 1px solid var(--border); border-radius: 8px; background: var(--page); font: 400 var(--t-base)/22px var(--font); color: var(--muted); }
.tp .tpgh { margin: 16px 0 8px; font: 600 var(--t-xs)/14.3px var(--font); color: var(--muted); } .tp .tpgh:first-of-type { margin-top: 8px; }
.tp .tpwrap { display: flex; flex-wrap: wrap; gap: 8px; }
`;

// 類型選擇紙（EventTypePickerViewController）：標題「類型」、（分段時）地點｜商品、搜尋、8 大類各一群的晶片。selected＝亮著的那幾種。
// seg:true＝分段（靈感）；done:true＝右上「完成」（可複選的篩選那一張）
export function pickerSheet({ selected = [], seg = false, done = false } = {}) {
  const sel = new Set(selected);
  return `<div class="tpdim"></div><div class="tp"><div class="tpgrab"></div><div class="tpttl">${TP.title}</div>${done ? `<div class="tpdone">${TP.done}</div>` : ''}
    <div class="tpin">${seg ? `<div class="tpseg"><span>${TP.seg[0]}</span><span class="on">${TP.seg[1]}</span></div>` : ''}
      <div class="tpsch">${di('search')}<div class="tpinp">${TP.search}</div></div>
      ${GROUPS.map(g => `<div class="tpgh">${g.title[L]}</div><div class="tpwrap">${g.names.map(n => productChip(n, sel.has(n))).join('')}</div>`).join('')}</div></div>`;
}

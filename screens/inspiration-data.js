// 靈感那一組畫面（inspiration.html、share-web.html、calendar.html 的 added=1）共用的示範資料。
// 字與版面照 App 1.4.0（出處見各頁檔頭）；這裡只放「內容」：一則剛從網頁分享進來的靈感（NEW）與清單裡原本就有的幾則（OLD）。
// 網頁是虛構的（沒有任何一家的商標與名稱），網域用 .example。
import { lang } from './chrome.js';

export const HOST = 'hiroshima-notes.example';
export const URL_ = `https://${HOST}/cafe`;

// 新進來的那一則：網頁 → 分享 → 靈感 → 關聯成行程。行程那一端：第 2 天晚餐（19:00–20:00）之後的空檔，類型 cafe。
const NEW = {
  'zh-Hant-TW': {
    site: '旅人手帖', title: '紙屋町的老咖啡館', byline: '文・小林　3 分鐘閱讀',
    p: ['從廣電紙屋町站走兩分鐘，巷子裡有一間開了四十年的純喫茶。厚切吐司配濃咖啡，營業到晚上十一點。', '吧台只有八個位子，晚上九點前來比較不用等。'],
    desc: '開了四十年的純喫茶，厚切吐司配濃咖啡，營業到晚上十一點。', place: '紙屋町的老咖啡館',
  },
  en: {
    site: 'Wayfarer Notes', title: 'A 40-year-old coffee house in Kamiyacho', byline: 'By Kobayashi · 3 min read',
    p: ['Two minutes from Kamiyacho tram stop, down a side street, is a kissaten that has been pouring coffee for forty years. Thick toast, strong coffee, open until 11 pm.', 'Only eight seats at the counter — come before nine to skip the wait.'],
    desc: 'A kissaten forty years in. Thick toast, strong coffee, open until 11 pm.', place: 'Kamiyacho coffee house',
  },
  ja: {
    site: '旅人手帖', title: '紙屋町の老舗喫茶店', byline: '文・小林　読了 3 分',
    p: ['広電の紙屋町駅から歩いて 2 分、路地に四十年続く純喫茶があります。厚切りトーストに濃いめのコーヒー、夜 11 時まで営業。', 'カウンターは 8 席だけ。夜 9 時前なら待たずに入れます。'],
    desc: '四十年続く純喫茶。厚切りトーストに濃いめのコーヒー、夜 11 時まで営業。', place: '紙屋町の喫茶店',
  },
  ko: {
    site: '여행수첩', title: '가미야초의 오래된 카페', byline: '글 · 고바야시　3분 읽기',
    p: ['히로덴 가미야초역에서 걸어서 2분, 골목 안에 사십 년째 이어온 킷사텐이 있어요. 두툼한 토스트와 진한 커피, 밤 11시까지 영업해요.', '카운터는 8석뿐이라 밤 9시 전에 가면 기다리지 않아요.'],
    desc: '사십 년째 이어온 킷사텐. 두툼한 토스트와 진한 커피, 밤 11시까지 영업.', place: '가미야초 카페',
  },
}[lang] || null;
export const N = NEW;

// 行事曆上的結果（calendar.html?added=1）：第 2 天 20:15–21:15（前一則燒肉 19:00–20:00），類型 cafe
export const ADDED_EVENT = { key: 'new-from-inspiration', title: NEW?.title, start: '20:15', end: '21:15', category: 'cafe', place: { name: NEW?.place }, fresh: true };

// 清單裡原本就有的幾則（照新到舊）。source：App 認得的站（Domain.json domain.inspiration.source.*）或 null（寫網域 host）；
// when：{ k: 'hours', n } | { k: 'yesterday', t } | { k: 'date', m, d }；cats：分類小標；type：行程類型 key；thumb：縮圖（null＝沒有圖，畫分類圖示）
const OLD = {
  'zh-Hant-TW': [
    { title: '退潮時走到大鳥居腳下', source: 'instagram', when: { k: 'hours', n: 3 }, cats: ['image', 'link'], type: 'sight', thumb: 'img/note-photo.svg', unread: true,
      desc: '比想像中還要大。下午三點前後的光最好拍，記得先查潮汐表。', link: 'photos.example/p/C9mTz2kQx4', n: 4 },
    { title: '宮島水族館', source: 'googlemaps', when: { k: 'yesterday', t: '21:08' }, cats: ['place'], type: 'aquarium', thumb: 'img/share-gmap-snap.webp', linked: true,
      desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima', place: true },
    { title: '牡蠣要先訂位，午餐前去', source: null, host: null, when: { k: 'date', m: 10, d: 7 }, cats: ['text'], type: 'dining', thumb: null,
      desc: '牡蠣屋人多，十一點前到。招牌是烤牡蠣與牡蠣飯。' },
    { title: '瀨戶內檸檬甜點', source: 'threads', when: { k: 'date', m: 10, d: 6 }, cats: ['image', 'link'], type: 'dessert', thumb: 'img/shop-lemon.svg',
      desc: '尾道這間檸檬塔據說要早點去，下午常常賣完。', link: 'threads.example/p/Cx83', n: 1 },
  ],
  en: [
    { title: 'Walking out to the great torii at low tide', source: 'instagram', when: { k: 'hours', n: 3 }, cats: ['image', 'link'], type: 'sight', thumb: 'img/note-photo.svg', unread: true,
      desc: 'Much bigger up close. The light is best around 3 pm — check the tide table first.', link: 'photos.example/p/C9mTz2kQx4', n: 4 },
    { title: 'Miyajima Aquarium', source: 'googlemaps', when: { k: 'yesterday', t: '21:08' }, cats: ['place'], type: 'aquarium', thumb: 'img/share-gmap-snap.webp', linked: true,
      desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima', place: true },
    { title: 'Book the oyster place before lunch', source: null, host: null, when: { k: 'date', m: 10, d: 7 }, cats: ['text'], type: 'dining', thumb: null,
      desc: 'It fills up — get there before 11. Grilled oysters and oyster rice are the thing to order.' },
    { title: 'Setouchi lemon sweets', source: 'threads', when: { k: 'date', m: 10, d: 6 }, cats: ['image', 'link'], type: 'dessert', thumb: 'img/shop-lemon.svg',
      desc: 'The lemon tart in Onomichi reportedly sells out by the afternoon.', link: 'threads.example/p/Cx83', n: 1 },
  ],
  ja: [
    { title: '干潮で大鳥居の足元まで', source: 'instagram', when: { k: 'hours', n: 3 }, cats: ['image', 'link'], type: 'sight', thumb: 'img/note-photo.svg', unread: true,
      desc: '近くで見ると想像以上に大きい。15時ごろの光がいちばん。潮見表を先にチェック。', link: 'photos.example/p/C9mTz2kQx4', n: 4 },
    { title: '宮島水族館', source: 'googlemaps', when: { k: 'yesterday', t: '21:08' }, cats: ['place'], type: 'aquarium', thumb: 'img/share-gmap-snap.webp', linked: true,
      desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima', place: true },
    { title: '牡蠣は先に予約、ランチ前に', source: null, host: null, when: { k: 'date', m: 10, d: 7 }, cats: ['text'], type: 'dining', thumb: null,
      desc: '牡蠣屋は混むので 11 時前に。焼き牡蠣とかきめしが名物。' },
    { title: '瀬戸内レモンのスイーツ', source: 'threads', when: { k: 'date', m: 10, d: 6 }, cats: ['image', 'link'], type: 'dessert', thumb: 'img/shop-lemon.svg',
      desc: '尾道のレモンタルトは午後には売り切れることが多いそう。', link: 'threads.example/p/Cx83', n: 1 },
  ],
  ko: [
    { title: '썰물 때 큰 도리이 발밑까지', source: 'instagram', when: { k: 'hours', n: 3 }, cats: ['image', 'link'], type: 'sight', thumb: 'img/note-photo.svg', unread: true,
      desc: '가까이서 보면 생각보다 훨씬 커요. 오후 3시쯤 빛이 가장 좋으니 조석표를 먼저 확인하세요.', link: 'photos.example/p/C9mTz2kQx4', n: 4 },
    { title: '미야지마 수족관', source: 'googlemaps', when: { k: 'yesterday', t: '21:08' }, cats: ['place'], type: 'aquarium', thumb: 'img/share-gmap-snap.webp', linked: true,
      desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima', place: true },
    { title: '굴 맛집은 점심 전에 예약', source: null, host: null, when: { k: 'date', m: 10, d: 7 }, cats: ['text'], type: 'dining', thumb: null,
      desc: '굴 가게는 붐비니 11시 전에 가세요. 구운 굴과 굴밥이 대표 메뉴예요.' },
    { title: '세토내 레몬 디저트', source: 'threads', when: { k: 'date', m: 10, d: 6 }, cats: ['image', 'link'], type: 'dessert', thumb: 'img/shop-lemon.svg',
      desc: '오노미치의 레몬 타르트는 오후에 품절되는 일이 많다고 해요.', link: 'threads.example/p/Cx83', n: 1 },
  ],
}[lang] || [];
export const OLD_ITEMS = OLD;

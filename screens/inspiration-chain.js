// 引導頁「分享」示範（story insp-chain）專用的資料：IG 貼文 → Google 地圖「宮島水族館」→ 新增關聯 → 行程。
// 和首頁的靈感示範（inspiration-data.js）完全分開：首頁那條不 import 這支，這條也不碰 inspiration-data.js 的 N／ADDED_EVENT／URL_。
// 只有帶 chain=1 的 inspiration.html／event.html 才用它（share-gmi 的 openApp 帶過去）。三語（ko 順手補上）各自一份，不寫死中文。
// 字與 share-igi.html／share-gmi.html 頁面上的對得上：貼文標題＝og 標題、地點名＝地圖頁。
import { lang } from './chrome.js';

export const CHAIN_HOST = 'photos.example';
export const CHAIN_LINK = 'photos.example/p/C9mTz2kQx4';
export const CHAIN_URL = 'https://maps.example/place/miyajima-aquarium';

const BY_LANG = {
  'zh-Hant-TW': {
    ig: { title: '退潮時走到大鳥居腳下', desc: '比想像中還要大。下午三點前後的光最好拍，記得先查潮汐表。 #宮島 #嚴島神社' },
    gm: { title: '宮島水族館', desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima', place: '宮島水族館' },
  },
  en: {
    ig: { title: 'Walking out to the great torii at low tide', desc: 'Much bigger up close. The light is best around 3 pm — check the tide table first. #Miyajima #Itsukushima' },
    gm: { title: 'Miyajima Public Aquarium', desc: '10-3 Miyajimacho, Hatsukaichi, Hiroshima 739-0534', place: 'Miyajima Public Aquarium' },
  },
  ja: {
    ig: { title: '干潮で大鳥居の足元まで', desc: '近くで見ると想像以上に大きい。15時ごろの光がいちばん。潮見表を先にチェック。 #宮島 #厳島神社' },
    gm: { title: '宮島水族館', desc: '〒739-0534 広島県廿日市市宮島町10-3', place: '宮島水族館' },
  },
  ko: {
    ig: { title: '썰물 때 큰 도리이 발밑까지', desc: '가까이서 보면 생각보다 훨씬 커요. 오후 3시쯤 빛이 가장 좋으니 조석표를 먼저 확인하세요. #미야지마 #이쓰쿠시마신사' },
    gm: { title: '미야지마 수족관', desc: '739-0534 히로시마현 하쓰카이치시 미야지마초 10-3', place: '미야지마 수족관' },
  },
};
const T = BY_LANG[lang] || BY_LANG['zh-Hant-TW'];

export const IG = { ...T.ig, link: CHAIN_LINK };
export const GM = { ...T.gm, url: CHAIN_URL };
// 行事曆上的結果：第 2 天 20:15–21:15，類型 aquarium
export const CHAIN_EVENT = { key: 'new-from-inspiration', title: GM.title, start: '20:15', end: '21:15', category: 'aquarium', place: { name: GM.place }, fresh: true };

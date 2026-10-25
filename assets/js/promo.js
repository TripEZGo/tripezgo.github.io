// 首頁的限時活動「分享到社群，免費兌換一年 Premium」（使用者 2026-10-24；設計稿 Open Design tripezgo/site-home-v2.html #promo）。
//
//   .promo-jump   第一屏的醒目入口，點了捲到 #promo
//   #promo        三步驟：1 複製文案 → 2 分享到社群並回到這頁 → 3 前往 App Store 兌換
//
// 兩個都先 hidden：活動還沒結束才打開（沒有 JS、或倒數歸零都不出現，不會掛著過期的活動）。
// 步驟一步一步解鎖：還沒輪到的步驟變淡但按得到，按了跳 alert 說還差哪一步。
// 第 3 步只是引導順序，不是驗證：兌換網址本來就公開，碼是 App Store Connect 的自訂優惠代碼。
// 文案每語 26 則，進來隨機抽一則，「換一個」換成另一則；每則都濃縮十大特色的一部分，而且都留著 tripezgo.com。
// 頁面上的固定字在 index.html，英日韓由 tools/home-i18n.py 翻；這裡只放會變的字。

const END = Date.parse('2026-12-31T23:59:59+08:00');
const SITE = 'https://tripezgo.com/';

const LANG = document.documentElement.lang.startsWith('ja') ? 'ja' : document.documentElement.lang.startsWith('en') ? 'en'
  : document.documentElement.lang.startsWith('ko') ? 'ko' : 'zh';

const T = {
  zh: {
    left: (d, hms) => `${d} 天 ${hms}`,
    copied: '已複製', copyFailed: '請手動複製', copy: '複製文案',
    need1: '請先完成步驟 1：複製文案。',
    need2: '請先完成步驟 2：分享到社群，分享完回到這一頁就能兌換。',
    ready: '謝謝你的分享！按上面的按鈕到 App Store 兌換。',
    captions: [
      '最近出去玩，行程都排在 TripEZGo\n・行事曆＋時間軸，每天怎麼走一眼看完\n・社群、地圖看到的靈感一鍵收進來\n・每天的行程在地圖上連成路線\n・車票、訂位、待辦都掛在行程上\n・兩站之間的路程，時間不夠先提醒\n・整趟旅程一頁看完\n・旅伴一起編，路上還能分享位置\n・鎖定畫面就看得到下一站\n・筆記、QR Code、匯率換算都帶著\n・不用帳號，資料只在手機和 iCloud，沒網路也能用\ntripezgo.com\n#TripEZGo #旅行規劃',
      '排行程終於不用開 Excel 了\nTripEZGo 把每天的行程排在行事曆和時間軸上，地圖直接畫出路線；車票、訂位、待辦掛在行程裡，路上鎖定畫面就看得到下一站。\n旅伴可以一起編，不用註冊、沒網路也能用。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '推一個 iPhone／iPad 旅行規劃 App：TripEZGo\n・行事曆、時間軸、地圖三種看法\n・社群看到的景點一鍵存成靈感\n・路程時間不夠會先提醒\n・旅伴共編、路上共享位置\n・即時動態、Widget 看下一站\n・免帳號，資料只在 iCloud\ntripezgo.com\n#TripEZGo #旅行規劃',
      '出發前的我：把票券、訂位、待辦都掛進 TripEZGo 的行程裡。\n出發後的我：鎖定畫面看下一站、地圖看路線、點一下就打開車票。\n不用帳號，沒網路也能用\ntripezgo.com\n#TripEZGo',
      '以前規劃旅行要開五個 App：筆記、地圖、行事曆、匯率、截圖相簿。\n現在一個 TripEZGo 就搞定：行程、路線、票券、待辦、靈感、匯率換算、QR Code 掃描全部在裡面。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '跟朋友出國最怕行程對不上。\n用 TripEZGo 大家一起編同一份行程，路上還能分享位置，走散了也找得到\n行程、路線、票券、待辦都在同一個 App。\ntripezgo.com\n#TripEZGo #旅伴',
      '自由行神器 TripEZGo\n・一天一天排，空檔一眼看出來\n・兩個行程之間的路程自動排好時間\n・每天的路線畫在地圖上\n・票券、訂位掛在行程上，到現場點了就開\n・鎖定畫面直接看下一站\ntripezgo.com\n#TripEZGo #自由行',
      '在 IG、Threads、Google 地圖看到想去的店？\n分享到 TripEZGo 存成靈感，之後一鍵排進行程，地圖上還會幫你標出順路的店\ntripezgo.com\n#TripEZGo #旅行靈感',
      '我很在意隱私，所以選 TripEZGo：不用註冊帳號，行程只存在自己的手機和 iCloud，同步、備份、跟旅伴共享都走 iCloud\n功能也沒少：行事曆、時間軸、地圖路線、票券待辦、即時動態都有。\ntripezgo.com\n#TripEZGo',
      '國外沒網路也不怕\nTripEZGo 離線也能看行程、改行程、開票券；匯率換算、QR Code 掃描、筆記都內建。\n回到有網路再同步到 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '整趟旅程一頁看完\nTripEZGo 的總覽把每天的行程、附件、待辦整理好，要找什麼點一下就到；切到行事曆看時間、切到地圖看路線。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '用 TripEZGo 排行程超快：\n1. 社群、地圖看到的地方存成靈感\n2. 排進行事曆\n3. 兩站之間的路程排好時間\n4. 票券、待辦掛上去\n5. 出發！鎖定畫面看下一站\ntripezgo.com\n#TripEZGo #旅行規劃',
      '誰懂旅行時一直解鎖手機找下一站的痛\nTripEZGo 的即時動態和 Widget 直接把下一站、怎麼去放在鎖定畫面，連 App 都不用開。\n行程規劃、地圖、票券、旅伴共編也都在裡面。\ntripezgo.com\n#TripEZGo',
      '一句話介紹 TripEZGo：排行程、帶票券、查交通、跟旅伴共編，出發後也跟著你走的旅行 App。\n免帳號、離線可用、資料只在你的 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '下次出國就用 TripEZGo\n每天的行程排在時間軸上，路程時間不夠會先提醒；車票、餐廳訂位掛在行程上，到現場點開就好；匯率換算直接在 App 裡算。\ntripezgo.com\n#TripEZGo #自由行',
      '旅行規劃 App 用過不少，最後留下 TripEZGo：\n・行事曆＋時間軸＋地圖三種模式\n・靈感收集\n・路程提醒\n・旅伴共編＋位置共享\n・即時動態、Widget\n・筆記、QR Code、匯率換算\n・不用帳號\ntripezgo.com\n#TripEZGo',
      '給每次旅行都負責排行程的那個朋友\nTripEZGo 讓你把行程、交通、票券、待辦排好，再邀大家一起看、一起改；出發後鎖定畫面就看得到下一站。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '行程不是一張表，是一條路線\nTripEZGo 把每天的行程連成地圖上的路線，兩站之間要多久一目了然，順路的店也標好了。\ntripezgo.com\n#TripEZGo',
      '旅行的所有東西，終於收在同一個地方：\n行程、路線、車票、訂位、待辦、筆記、靈感、匯率\nTripEZGo，iPhone、iPad 都能用，不用註冊。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '最近發現的寶藏 App：TripEZGo\n排行程有行事曆、時間軸、地圖三種看法，旅伴可以一起編；出門後即時動態顯示下一站，沒網路也能看。免費下載！\ntripezgo.com\n#TripEZGo',
      '錯過這班車怎麼辦？TripEZGo 在兩個行程之間排好路程，時間不夠會先提醒\n加上地圖路線、票券、待辦、旅伴共編，一個 App 搞定整趟旅行。\ntripezgo.com\n#TripEZGo',
      '規劃旅行的三個煩惱，TripEZGo 都解決了：\n・行程散在各處 → 行事曆＋總覽一頁看完\n・不知道怎麼走 → 地圖路線＋路程時間\n・旅伴意見多 → 大家一起編同一份行程\ntripezgo.com\n#TripEZGo #旅行規劃',
      '免註冊、免登入、免費下載的旅行規劃 App：TripEZGo\n行程、路線、票券、待辦、靈感、筆記、匯率換算全部帶著走，資料只在你的手機和 iCloud。\ntripezgo.com\n#TripEZGo',
      '打開 TripEZGo，今天要去哪、怎麼去、幾點出發、票在哪，一眼就知道\n不想打開也行，鎖定畫面和 Widget 直接顯示下一站。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '和旅伴出遊的正確打開方式\n1. 一起在 TripEZGo 排行程\n2. 每天的路線在地圖上看\n3. 票券、待辦掛在行程上\n4. 路上分享位置不怕走散\n5. 鎖定畫面看下一站\ntripezgo.com\n#TripEZGo',
      'TripEZGo 十大功能懶人包\n行事曆／時間軸・靈感收集・地圖路線・票券待辦・路程提醒・旅程總覽・旅伴共編・位置共享・即時動態與 Widget・筆記 QR 匯率工具\n不用帳號，資料只在 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
    ],
  },
  en: {
    left: (d, hms) => `${d}d ${hms}`,
    copied: 'Copied', copyFailed: 'Copy it by hand', copy: 'Copy caption',
    need1: 'Finish step 1 first: copy the caption.',
    need2: 'Finish step 2 first: share it on social media, then come back to this page to redeem.',
    ready: 'Thanks for sharing! Tap the button above to redeem on the App Store.',
    captions: [
      'All my trips are planned in TripEZGo now\n• Calendar + timeline: each day at a glance\n• Save ideas from social media and maps in one tap\n• Each day’s plans joined into a route on the map\n• Tickets, bookings and to-dos attached to each plan\n• Travel between stops, with a heads-up when time is tight\n• The whole trip on one page\n• Co-edit with your travel companions and share your location on the road\n• Your next stop right on the Lock Screen\n• Notes, QR code scanner, currency converter built in\n• No account, your data stays on your phone and in iCloud, works offline\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Finally, no more planning trips in a spreadsheet\nTripEZGo lays out each day on a calendar and a timeline and draws the route on a map. Tickets, bookings and to-dos live on each plan, and the Lock Screen shows your next stop.\nCo-edit with your travel companions. No sign-up, works offline.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'A travel planner for iPhone and iPad I can recommend: TripEZGo\n• Calendar, timeline and map views\n• Save places from social media as ideas in one tap\n• A heads-up when there’s not enough time to get there\n• Co-edit with companions, share your location on the road\n• Live Activity and widgets for your next stop\n• No account, your data stays in iCloud\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Me before the trip: tickets, bookings and to-dos all attached to my plans in TripEZGo.\nMe on the trip: next stop on the Lock Screen, route on the map, tickets one tap away.\nNo account, works offline\ntripezgo.com\n#TripEZGo',
      'Planning a trip used to mean five apps: notes, maps, calendar, currency, a camera roll full of screenshots.\nNow TripEZGo does it all: plans, routes, tickets, to-dos, ideas, currency converter and QR code scanner in one place.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'The worst part of traveling with friends: nobody’s on the same plan.\nWith TripEZGo everyone edits the same trip, and you can share locations on the road so no one gets lost\nPlans, routes, tickets and to-dos in one app.\ntripezgo.com\n#TripEZGo #TravelBuddies',
      'The independent traveler’s secret weapon TripEZGo\n• Plan day by day and spot the gaps at a glance\n• Travel time between plans, worked out for you\n• Every day’s route drawn on the map\n• Tickets and bookings on each plan, open them on the spot\n• Your next stop right on the Lock Screen\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Found a place you want to go on Instagram, Threads or Google Maps?\nShare it to TripEZGo as an idea, add it to your plans in one tap later, and the map shows which spots are on the way\ntripezgo.com\n#TripEZGo #TravelInspiration',
      'Privacy matters to me, so I use TripEZGo: no account, trips stay on my phone and in my iCloud, and sync, backup and sharing with companions all go through iCloud\nNothing missing either: calendar, timeline, map routes, tickets, to-dos and Live Activity.\ntripezgo.com\n#TripEZGo',
      'No signal abroad? No problem\nTripEZGo works offline: view and edit your plans and open your tickets. Currency converter, QR code scanner and notes are built in.\nIt syncs to iCloud once you’re back online.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'The whole trip on one page\nTripEZGo’s Overview gathers every day’s plans, files and to-dos, so anything is a tap away. Switch to the calendar for times or the map for routes.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Planning with TripEZGo is fast:\n1. Save places from social media and maps as ideas\n2. Put them on the calendar\n3. Travel time between stops is planned for you\n4. Attach tickets and to-dos\n5. Go! Your next stop is on the Lock Screen\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Who else keeps unlocking their phone on a trip just to check the next stop?\nTripEZGo’s Live Activity and widgets put your next stop and how to get there on the Lock Screen, no need to open the app.\nPlanning, maps, tickets and co-editing are all in there too.\ntripezgo.com\n#TripEZGo',
      'TripEZGo in one sentence: plan the days, carry your tickets, check your connections and co-edit with companions, in a travel app that comes with you when you go.\nNo account, works offline, your data stays in your iCloud.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Using TripEZGo on my next trip abroad\nEach day on a timeline with a heads-up when a connection is tight; train tickets and restaurant bookings on each plan, ready to open; currency conversion right in the app.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'I’ve tried plenty of travel planners. TripEZGo is the one I kept:\n• Calendar + timeline + map\n• Idea collection\n• Travel-time alerts\n• Co-editing + location sharing\n• Live Activity and widgets\n• Notes, QR code scanner, currency converter\n• No account\ntripezgo.com\n#TripEZGo',
      'For the friend who always plans the trip\nTripEZGo lets you lay out plans, travel, tickets and to-dos, then invite everyone to view and edit together. On the road, the next stop is right on the Lock Screen.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'A trip isn’t a table, it’s a route\nTripEZGo joins each day’s plans into a route on the map, shows how long each leg takes, and marks the spots along the way.\ntripezgo.com\n#TripEZGo',
      'Everything for the trip, finally in one place:\nPlans, routes, tickets, bookings, to-dos, notes, ideas, currency\nTripEZGo, for iPhone and iPad, no sign-up.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'A hidden gem I just found: TripEZGo\nCalendar, timeline and map views for planning, co-editing with companions, a Live Activity with your next stop on the road, and it works offline. Free to download!\ntripezgo.com\n#TripEZGo',
      'Missed your train? TripEZGo plans the travel between your stops and warns you when time is tight\nAdd map routes, tickets, to-dos and co-editing, and one app covers the whole trip.\ntripezgo.com\n#TripEZGo',
      'Three trip-planning headaches TripEZGo fixes:\n• Plans scattered everywhere → calendar + Overview, all on one page\n• Not sure how to get there → map routes + travel times\n• Everyone has an opinion → co-edit one shared trip\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'No sign-up, no login, free to download: TripEZGo\nPlans, routes, tickets, to-dos, ideas, notes and a currency converter, all with you, and your data stays on your phone and in iCloud.\ntripezgo.com\n#TripEZGo',
      'Open TripEZGo and you know where you’re going today, how to get there, when to leave and where your tickets are\nDon’t want to open it? The Lock Screen and widgets show your next stop.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'How to travel with friends, the right way\n1. Plan together in TripEZGo\n2. See each day’s route on the map\n3. Attach tickets and to-dos to each plan\n4. Share locations so no one gets lost\n5. Next stop on the Lock Screen\ntripezgo.com\n#TripEZGo',
      'TripEZGo’s top 10 features\nCalendar/timeline · Ideas · Map routes · Tickets & to-dos · Travel-time alerts · Trip Overview · Co-editing · Location sharing · Live Activity & widgets · Notes, QR & currency tools\nNo account, your data stays in iCloud.\ntripezgo.com\n#TripEZGo #TravelPlanning',
    ],
  },
  ja: {
    left: (d, hms) => `${d}日 ${hms}`,
    copied: 'コピーしました', copyFailed: '手動でコピーしてください', copy: '文章をコピー',
    need1: '先にステップ 1 の「文章をコピー」を済ませてください。',
    need2: '先にステップ 2 を済ませてください。SNS でシェアして、このページに戻ると引き換えできます。',
    ready: 'シェアありがとうございます！上のボタンから App Store で引き換えてください。',
    captions: [
      '最近の旅行は、予定をぜんぶ TripEZGo で組んでいます\n・カレンダー＋タイムラインで毎日の流れがひと目でわかる\n・SNS やマップで見つけた場所をワンタップで保存\n・毎日の予定がマップ上でルートにつながる\n・切符・予約・やることを予定にまとめて\n・予定と予定のあいだの移動、時間が足りないと先に知らせてくれる\n・旅全体を 1 ページで\n・旅の仲間と共同編集、旅先では位置も共有\n・次の行き先はロック画面で\n・メモ・QR コード・為替換算もそろってる\n・アカウント不要、データはスマホと iCloud だけ、オフラインでも使える\ntripezgo.com\n#TripEZGo #旅行計画',
      'もう Excel で旅程表を作らなくていい\nTripEZGo なら毎日の予定をカレンダーとタイムラインに並べて、ルートはマップに表示。切符や予約、やることは予定にまとめて、旅先ではロック画面で次の行き先がわかります。\n旅の仲間と一緒に編集できて、登録不要、オフラインでも使えます。\ntripezgo.com\n#TripEZGo #旅行計画',
      'iPhone・iPad の旅行プランナーならこれ：TripEZGo\n・カレンダー・タイムライン・マップの 3 つの表示\n・SNS で見つけたスポットをワンタップで保存\n・移動の時間が足りないと先にお知らせ\n・旅の仲間と共同編集、旅先で位置を共有\n・ライブアクティビティとウィジェットで次の行き先\n・アカウント不要、データは iCloud だけ\ntripezgo.com\n#TripEZGo #旅行計画',
      '出発前のわたし：切符も予約もやることも、ぜんぶ TripEZGo の予定にまとめる。\n出発後のわたし：ロック画面で次の行き先、マップでルート、切符はワンタップ。\nアカウント不要、オフラインでも使える\ntripezgo.com\n#TripEZGo',
      '前は旅行の計画にアプリを 5 つ使っていました。メモ、マップ、カレンダー、為替、スクショだらけの写真アプリ。\nいまは TripEZGo ひとつ。予定、ルート、切符、やること、行きたい場所、為替換算、QR コード読み取りまで全部入り。\ntripezgo.com\n#TripEZGo #旅行計画',
      '友だちとの旅行でいちばん困るのは、予定がそろわないこと。\nTripEZGo ならみんなで同じ旅程を編集できて、旅先では位置を共有できるから、はぐれても見つけられます\n予定・ルート・切符・やることをひとつのアプリで。\ntripezgo.com\n#TripEZGo #旅の仲間',
      '個人旅行の心強い味方 TripEZGo\n・1 日ずつ組めて、空き時間もひと目でわかる\n・予定と予定のあいだの移動時間も組み込める\n・毎日のルートをマップに表示\n・切符や予約は予定にまとめて、現地でタップして開くだけ\n・次の行き先はロック画面で\ntripezgo.com\n#TripEZGo #個人旅行',
      'Instagram や Threads、Google マップで行きたいお店を見つけたら？\nTripEZGo にシェアして保存、あとからワンタップで予定に追加。通り道にあるお店もマップで教えてくれます\ntripezgo.com\n#TripEZGo #旅のアイデア',
      'プライバシーを大事にしたいから TripEZGo：アカウント登録なし、旅程は自分のスマホと iCloud だけ。同期もバックアップも、旅の仲間との共有もすべて iCloud 経由\n機能もそろってます。カレンダー、タイムライン、マップのルート、切符ややること、ライブアクティビティまで。\ntripezgo.com\n#TripEZGo',
      '海外で電波がなくても大丈夫\nTripEZGo はオフラインでも予定を見て、直して、切符を開けます。為替換算、QR コード読み取り、メモも内蔵。\nネットにつながったら iCloud に同期。\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅全体を 1 ページで\nTripEZGo の概要は、毎日の予定・添付・やることをまとめて、探しものはタップひとつ。カレンダーに切り替えれば時間、マップならルートがわかります。\ntripezgo.com\n#TripEZGo #旅行計画',
      'TripEZGo なら旅程づくりがあっという間：\n1. SNS やマップで見つけた場所を保存\n2. カレンダーに並べる\n3. 予定のあいだの移動時間も組み込む\n4. 切符とやることを予定にまとめる\n5. 出発！次の行き先はロック画面で\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅先で次の行き先を見るたびにスマホのロックを解除する、あの面倒さ\nTripEZGo のライブアクティビティとウィジェットなら、次の行き先と行き方がロック画面に。アプリを開く必要もありません。\n旅程づくり、マップ、切符、旅の仲間との共同編集もこれひとつ。\ntripezgo.com\n#TripEZGo',
      'TripEZGo をひと言でいうと：予定を組んで、切符を持って、移動を調べて、旅の仲間と共同編集。出発したあとも一緒に歩く旅行アプリ。\nアカウント不要、オフライン対応、データはあなたの iCloud だけ。\ntripezgo.com\n#TripEZGo #旅行計画',
      '次の海外旅行は TripEZGo で\n毎日の予定をタイムラインに並べて、移動時間が足りないと先にお知らせ。電車の切符やレストランの予約は予定にまとめて、現地で開くだけ。為替換算もアプリの中で。\ntripezgo.com\n#TripEZGo #個人旅行',
      '旅行プランナーはいろいろ試して、最後に残ったのが TripEZGo：\n・カレンダー＋タイムライン＋マップの 3 モード\n・行きたい場所の保存\n・移動時間のお知らせ\n・旅の仲間と共同編集＋位置の共有\n・ライブアクティビティ、ウィジェット\n・メモ、QR コード、為替換算\n・アカウント不要\ntripezgo.com\n#TripEZGo',
      'いつも旅程を組む係のあなたへ\nTripEZGo で予定・移動・切符・やることを組んだら、みんなを招待して一緒に見て、一緒に直せます。出発したら次の行き先はロック画面で。\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅程は表じゃなくて、ルートだ\nTripEZGo は毎日の予定をマップ上のルートにつなげて、移動にどれくらいかかるかもひと目で。通り道のお店も表示します。\ntripezgo.com\n#TripEZGo',
      '旅に要るものが、やっとひとつの場所に：\n予定、ルート、切符、予約、やること、メモ、アイデア、為替\nTripEZGo、iPhone でも iPad でも、登録不要。\ntripezgo.com\n#TripEZGo #旅行計画',
      '最近見つけた神アプリ：TripEZGo\nカレンダー・タイムライン・マップの 3 つの表示で旅程を組めて、旅の仲間と共同編集。旅先ではライブアクティビティが次の行き先を表示、オフラインでも見られます。無料でダウンロード！\ntripezgo.com\n#TripEZGo',
      '乗り遅れたらどうする？TripEZGo は予定と予定のあいだの移動を組んで、時間が足りないと先に知らせてくれます\nマップのルート、切符、やること、共同編集まで。旅のすべてがこのアプリひとつ。\ntripezgo.com\n#TripEZGo',
      '旅行計画の 3 つの悩み、TripEZGo が解決：\n・予定があちこちに散らばる → カレンダー＋概要で 1 ページに\n・行き方がわからない → マップのルート＋移動時間\n・みんなの意見がばらばら → 同じ旅程を一緒に編集\ntripezgo.com\n#TripEZGo #旅行計画',
      '登録なし、ログインなし、無料でダウンロードできる旅行プランナー：TripEZGo\n予定、ルート、切符、やること、行きたい場所、メモ、為替換算をぜんぶ持ち歩けて、データはスマホと iCloud だけ。\ntripezgo.com\n#TripEZGo',
      'TripEZGo を開けば、今日どこへ行くか、どう行くか、何時に出るか、切符はどこか、ひと目でわかる\n開かなくても大丈夫。ロック画面とウィジェットに次の行き先が出ます。\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅の仲間と出かけるときの正解\n1. TripEZGo でみんなで旅程を組む\n2. 毎日のルートをマップで見る\n3. 切符とやることを予定にまとめる\n4. 旅先では位置を共有して、はぐれない\n5. 次の行き先はロック画面で\ntripezgo.com\n#TripEZGo',
      'TripEZGo の 10 大機能まとめ\nカレンダー／タイムライン・アイデア保存・マップのルート・切符とやること・移動時間のお知らせ・旅の概要・共同編集・位置の共有・ライブアクティビティとウィジェット・メモ・QR・為替のツール\nアカウント不要、データは iCloud だけ。\ntripezgo.com\n#TripEZGo #旅行計画',
    ],
  },
  ko: {
    left: (d, hms) => `${d}일 ${hms}`,
    copied: '복사했어요', copyFailed: '직접 복사해 주세요', copy: '문구 복사',
    need1: '먼저 1단계 ‘문구 복사’를 끝내 주세요.',
    need2: '먼저 2단계를 끝내 주세요. SNS에 공유한 뒤 이 페이지로 돌아오면 교환할 수 있어요.',
    ready: '공유해 주셔서 고마워요! 위 버튼을 눌러 App Store에서 교환하세요.',
    captions: [
      '요즘 여행 일정은 전부 TripEZGo로 짜요\n・캘린더＋타임라인으로 하루 동선이 한눈에\n・SNS나 지도에서 본 곳을 한 번에 저장\n・날마다의 일정이 지도 위 경로로 이어져요\n・승차권·예약·할 일을 일정에 붙여 두기\n・일정 사이 이동, 시간이 모자라면 미리 알려 줘요\n・여행 전체를 한 페이지로\n・동행과 공동 편집, 여행 중에는 위치도 공유\n・다음 목적지는 잠금 화면에서\n・메모·QR 코드·환율 계산까지\n・계정 없이, 데이터는 내 폰과 iCloud에만, 오프라인에서도 OK\ntripezgo.com\n#TripEZGo #여행계획',
      '이제 엑셀로 여행 일정 짜지 않아도 돼요\nTripEZGo는 날마다의 일정을 캘린더와 타임라인에 놓고 지도에 경로를 그려 줘요. 승차권·예약·할 일은 일정에 붙여 두고, 여행 중에는 잠금 화면에서 다음 목적지를 확인해요.\n동행과 함께 편집하고, 회원가입 없이 오프라인에서도 써요.\ntripezgo.com\n#TripEZGo #여행계획',
      'iPhone·iPad 여행 플래너 추천: TripEZGo\n・캘린더·타임라인·지도 세 가지 보기\n・SNS에서 본 장소를 한 번에 저장\n・이동 시간이 모자라면 미리 알림\n・동행과 공동 편집, 여행 중 위치 공유\n・라이브 액티비티·위젯으로 다음 목적지\n・계정 없이, 데이터는 iCloud에만\ntripezgo.com\n#TripEZGo #여행계획',
      '출발 전의 나: 승차권, 예약, 할 일을 전부 TripEZGo 일정에 붙여 두기.\n출발 후의 나: 잠금 화면으로 다음 목적지, 지도로 경로, 승차권은 한 번 탭.\n계정 없이, 오프라인에서도 OK\ntripezgo.com\n#TripEZGo',
      '예전엔 여행 계획에 앱을 다섯 개나 썼어요. 메모, 지도, 캘린더, 환율, 스크린숏 가득한 사진첩.\n이젠 TripEZGo 하나로 끝. 일정, 경로, 승차권, 할 일, 가고 싶은 곳, 환율 계산, QR 코드 스캔까지 다 들어 있어요.\ntripezgo.com\n#TripEZGo #여행계획',
      '친구랑 여행 갈 때 제일 곤란한 건 일정이 안 맞는 것.\nTripEZGo로 다 같이 같은 일정을 편집하고, 여행 중에는 위치를 공유해서 길이 엇갈려도 찾을 수 있어요\n일정·경로·승차권·할 일을 앱 하나로.\ntripezgo.com\n#TripEZGo #동행',
      '자유여행 필수 앱 TripEZGo\n・하루씩 짜고 빈 시간도 한눈에\n・일정 사이 이동 시간까지 일정에\n・날마다의 경로를 지도에\n・승차권·예약은 일정에 붙여 두고 현장에서 탭 한 번\n・다음 목적지는 잠금 화면에서\ntripezgo.com\n#TripEZGo #자유여행',
      'Instagram, Threads, Google 지도에서 가고 싶은 가게를 찾았다면?\nTripEZGo에 공유해서 저장하고, 나중에 한 번에 일정에 넣어요. 가는 길에 있는 가게도 지도에 표시해 줘요\ntripezgo.com\n#TripEZGo #여행영감',
      '개인정보가 중요해서 TripEZGo를 써요. 회원가입 없이, 일정은 내 폰과 iCloud에만. 동기화·백업·동행과의 공유도 전부 iCloud로\n기능도 빠짐없어요. 캘린더, 타임라인, 지도 경로, 승차권·할 일, 라이브 액티비티까지.\ntripezgo.com\n#TripEZGo',
      '해외에서 인터넷이 안 돼도 괜찮아요\nTripEZGo는 오프라인에서도 일정을 보고, 고치고, 승차권을 열 수 있어요. 환율 계산, QR 코드 스캔, 메모도 내장.\n인터넷이 연결되면 iCloud에 동기화돼요.\ntripezgo.com\n#TripEZGo #여행계획',
      '여행 전체를 한 페이지로\nTripEZGo의 한눈에 보기는 날마다의 일정·첨부·할 일을 모아 두어서, 찾는 건 탭 한 번이면 돼요. 캘린더로 바꾸면 시간, 지도로 바꾸면 경로.\ntripezgo.com\n#TripEZGo #여행계획',
      'TripEZGo로 일정 짜기, 정말 빨라요:\n1. SNS·지도에서 본 곳을 저장\n2. 캘린더에 놓기\n3. 일정 사이 이동 시간까지\n4. 승차권·할 일 붙이기\n5. 출발! 다음 목적지는 잠금 화면에서\ntripezgo.com\n#TripEZGo #여행계획',
      '여행 중에 다음 목적지 보려고 계속 잠금 해제하는 그 귀찮음\nTripEZGo의 라이브 액티비티와 위젯이 다음 목적지와 가는 방법을 잠금 화면에 띄워 줘요. 앱을 열 필요도 없어요.\n일정 짜기, 지도, 승차권, 동행과 공동 편집도 다 들어 있어요.\ntripezgo.com\n#TripEZGo',
      'TripEZGo를 한 문장으로: 일정 짜고, 승차권 챙기고, 이동 확인하고, 동행과 함께 편집하고, 출발한 뒤에도 함께 다니는 여행 앱.\n계정 없이, 오프라인 지원, 데이터는 내 iCloud에만.\ntripezgo.com\n#TripEZGo #여행계획',
      '다음 해외여행은 TripEZGo로\n날마다의 일정을 타임라인에 놓고, 이동 시간이 모자라면 미리 알려 줘요. 기차표·식당 예약은 일정에 붙여 두고 현장에서 열기만. 환율 계산도 앱 안에서.\ntripezgo.com\n#TripEZGo #자유여행',
      '여행 플래너 앱 여러 개 써 보고 결국 남은 건 TripEZGo:\n・캘린더＋타임라인＋지도 세 가지 모드\n・가고 싶은 곳 저장\n・이동 시간 알림\n・동행과 공동 편집＋위치 공유\n・라이브 액티비티, 위젯\n・메모, QR 코드, 환율 계산\n・계정 필요 없음\ntripezgo.com\n#TripEZGo',
      '여행 갈 때마다 일정 짜는 담당인 그 친구에게\nTripEZGo로 일정·이동·승차권·할 일을 짜 두고, 다 같이 초대해서 함께 보고 함께 고쳐요. 출발하면 다음 목적지는 잠금 화면에서.\ntripezgo.com\n#TripEZGo #여행계획',
      '여행 일정은 표가 아니라 경로예요\nTripEZGo는 날마다의 일정을 지도 위 경로로 잇고, 이동에 얼마나 걸리는지 한눈에 보여 줘요. 가는 길의 가게도 표시해 줘요.\ntripezgo.com\n#TripEZGo',
      '여행에 필요한 모든 것이 드디어 한곳에:\n일정, 경로, 승차권, 예약, 할 일, 메모, 아이디어, 환율\nTripEZGo, iPhone·iPad에서, 회원가입 없이.\ntripezgo.com\n#TripEZGo #여행계획',
      '요즘 찾은 보물 같은 앱: TripEZGo\n캘린더·타임라인·지도 세 가지 보기로 일정을 짜고, 동행과 함께 편집해요. 여행 중에는 라이브 액티비티가 다음 목적지를 보여 주고, 오프라인에서도 볼 수 있어요. 무료 다운로드!\ntripezgo.com\n#TripEZGo',
      '기차를 놓치면 어떡하지? TripEZGo는 일정 사이 이동을 짜 두고, 시간이 모자라면 미리 알려 줘요\n지도 경로, 승차권, 할 일, 공동 편집까지. 여행 전체를 앱 하나로.\ntripezgo.com\n#TripEZGo',
      '여행 계획의 세 가지 고민, TripEZGo가 해결:\n・일정이 여기저기 흩어짐 → 캘린더＋한눈에 보기로 한 페이지에\n・어떻게 가야 할지 모름 → 지도 경로＋이동 시간\n・동행마다 의견이 다름 → 같은 일정을 함께 편집\ntripezgo.com\n#TripEZGo #여행계획',
      '회원가입·로그인 없이 무료로 받는 여행 플래너: TripEZGo\n일정, 경로, 승차권, 할 일, 가고 싶은 곳, 메모, 환율 계산을 전부 들고 다니고, 데이터는 내 폰과 iCloud에만.\ntripezgo.com\n#TripEZGo',
      'TripEZGo를 열면 오늘 어디 가는지, 어떻게 가는지, 몇 시에 나가는지, 승차권은 어디 있는지 한눈에\n열기 싫어도 괜찮아요. 잠금 화면과 위젯에 다음 목적지가 떠요.\ntripezgo.com\n#TripEZGo #여행계획',
      '동행과 여행 가는 올바른 방법\n1. TripEZGo에서 함께 일정 짜기\n2. 날마다의 경로를 지도로 보기\n3. 승차권·할 일을 일정에 붙이기\n4. 여행 중 위치 공유로 길 잃지 않기\n5. 다음 목적지는 잠금 화면에서\ntripezgo.com\n#TripEZGo',
      'TripEZGo 10대 기능 한 번에 보기\n캘린더/타임라인 · 아이디어 저장 · 지도 경로 · 승차권과 할 일 · 이동 시간 알림 · 여행 한눈에 보기 · 공동 편집 · 위치 공유 · 라이브 액티비티와 위젯 · 메모·QR·환율 도구\n계정 없이, 데이터는 iCloud에만.\ntripezgo.com\n#TripEZGo #여행계획',
    ],
  },
}[LANG];

const root = document.getElementById('promo');
const jump = document.querySelector('.promo-jump');

if (root && Date.now() < END) start();

function start() {
  root.hidden = false;
  if (jump) jump.hidden = false;

  // 倒數到 END；歸零就把活動整個收掉
  const cd = root.querySelector('.cd');
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const left = END - Date.now();
    if (left <= 0) { root.hidden = true; if (jump) jump.hidden = true; return; }
    const s = Math.floor(left / 1000);
    cd.textContent = T.left(Math.floor(s / 86400), `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();

  // 文案：隨機抽一則；「換一個」一定換到另一則
  const captionEl = root.querySelector('.caption');
  let pick = Math.floor(Math.random() * T.captions.length), text = T.captions[pick];
  captionEl.textContent = text;
  // 網址在按下去那一刻才組，才會帶到當下顯示的那則
  // 各家的分享網址（使用者 2026-10-24 在 iPhone 上實測後改）：
  //   LINE   social-plugins.line.me/lineit/share 會跳轉錯誤 → 官方的 line.me/R/share?text=，直接進 LINE App
  //   X      x.com/intent 在 iPhone 上只開網頁 → 手機先用 twitter://post 開 App，1.5 秒後還在這頁（沒裝 App）才退回網頁
  //   Facebook  sharer.php 被 Facebook App 接走後什麼都不做、系統分享表也不對 → 手機在這一頁換到 www.facebook.com/sharer/sharer.php
  //             （Facebook 只收網址，文案第 1 步已經複製了）
  const shareUrl = (net) => ({
    threads: 'https://www.threads.com/intent/post?text=' + encodeURIComponent(text),
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SITE),
    x: 'https://x.com/intent/post?text=' + encodeURIComponent(text),
    line: 'https://line.me/R/share?text=' + encodeURIComponent(text),
  })[net];
  const mobile = () => matchMedia('(pointer: coarse)').matches;

  // stage 是現在該做的那一步
  const steps = [...root.querySelectorAll('.step')];
  const redeem = root.querySelector('.btn-redeem'), hint = root.querySelector('.redeem-hint');
  let stage = 1, shared = false;
  const KEY = 'tripezgo-promo';
  const remember = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ pick })); } catch {} };
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && T.captions[saved.pick]) { pick = saved.pick; text = T.captions[pick]; captionEl.textContent = text; stage = 3; }
  } catch {}
  const render = () => {
    steps.forEach((li, i) => { li.classList.toggle('is-locked', i + 1 > stage); li.classList.toggle('is-complete', i + 1 < stage); });
    if (stage >= 3) { redeem.removeAttribute('aria-disabled'); hint.textContent = T.ready; }
    else redeem.setAttribute('aria-disabled', 'true');
  };
  const allowed = (need, e) => { if (stage >= need) return true; e.preventDefault(); alert(stage === 1 ? T.need1 : T.need2); return false; };
  const advance = (to) => { if (stage < to) { stage = to; render(); } };
  render();

  const copyBtn = root.querySelector('[data-act="copy"]'), copyLabel = copyBtn.querySelector('span');
  // 換一個：複製過但還沒分享的話，回到第 1 步重新複製（不然貼出去的是舊的那則）
  root.querySelector('[data-act="shuffle"]').addEventListener('click', () => {
    pick = (pick + 1 + Math.floor(Math.random() * (T.captions.length - 1))) % T.captions.length;
    text = T.captions[pick]; captionEl.textContent = text;
    copyBtn.classList.remove('is-done'); copyLabel.textContent = T.copy;
    if (stage === 2) { stage = 1; render(); }
  });
  // 複製：先在同一個手勢裡同步複製（隱藏 textarea＋execCommand），按下去當下就變「已複製」；
  // iPhone Safari 等 navigator.clipboard 的 Promise 時第一下看起來沒反應（使用者 2026-10-24），這條只在同步複製失敗時才走。
  const copied = (ok) => { copyLabel.textContent = ok ? T.copied : T.copyFailed; copyBtn.classList.add('is-done'); advance(2); };
  copyBtn.addEventListener('click', () => {
    const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';   // 16px：iOS 不會因為選取而放大頁面
    document.body.append(ta); ta.select(); ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); getSelection()?.removeAllRanges();
    if (ok || !navigator.clipboard) return copied(ok);
    navigator.clipboard.writeText(text).then(() => copied(true), () => copied(false));
  });
  // 按過分享、而且從社群那一頁回來（分頁重新可見或視窗重新取得焦點）才算完成第 2 步
  root.querySelectorAll('a[data-net]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (!allowed(2, e)) return;
      const net = a.dataset.net;
      a.classList.add('is-done');
      if (mobile() && net === 'x') {
        e.preventDefault(); shared = true;
        location.href = 'twitter://post?message=' + encodeURIComponent(text);
        setTimeout(() => { if (document.visibilityState === 'visible') location.href = shareUrl('x'); }, 1500);
      } else if (mobile() && net === 'facebook') {
        // 點連結會被 Facebook App 接走（sharer.php 在 App 裡沒反應），系統分享表也不對（使用者 2026-10-24 實測兩次）：
        // 在這一頁直接換到網頁版分享框，程式換頁不會觸發 App 的 universal link。分享完按返回回來，記得的進度接著用。
        e.preventDefault(); remember(); shared = true;
        location.href = shareUrl('facebook');   // 使用者指定 www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ftripezgo.com%2F
      } else {
        a.href = shareUrl(net); shared = true;
      }
    });
  });
  // 其他：系統分享表（share extension），帶著當下那則文案；瀏覽器沒有 navigator.share 就不顯示
  const more = root.querySelector('[data-act="more"]');
  if (navigator.share) {
    more.hidden = false;
    more.addEventListener('click', (e) => {
      if (!allowed(2, e)) return;
      more.classList.add('is-done');
      navigator.share({ text }).then(() => { shared = true; advance(3); }).catch(() => {});
    });
  }
  const back = () => { if (shared && document.visibilityState === 'visible') advance(3); };
  document.addEventListener('visibilitychange', back);
  window.addEventListener('focus', back);
  // 按了兌換：第 4 步（回 App 恢復購買）亮起來
  redeem.addEventListener('click', (e) => { if (allowed(3, e)) advance(4); });
}

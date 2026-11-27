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
  : document.documentElement.lang.startsWith('ko') ? 'ko' : document.documentElement.lang === 'zh-Hans' ? 'hans' : 'zh';

const T = {
  zh: {
    left: (d, hms) => `${d} 天 ${hms}`,
    copied: '已複製', copyFailed: '手動複製', copy: '複製文案',
    need1: '先完成步驟 1：複製文案。',
    need2: '先完成步驟 2：分享到社群。分享後回到這頁，可以兌換。',
    ready: '已完成分享。按上面的按鈕，到 App Store 兌換。',
    captions: [
      '最近出去玩，行程都排在 TripEZGo\n・行事曆＋時間軸，每天的行程與路程\n・社群、地圖看到的靈感分享進來存成靈感\n・每天的行程在地圖上連成路線\n・車票、訂位、待辦都掛在行程上\n・兩站之間的路程，時間不夠先提醒\n・總覽一天一頁\n・旅伴一起編，旅途中可以分享位置\n・鎖定畫面就看得到下一站\n・筆記、QR Code、匯率換算都帶著\n・不用帳號，資料只在手機和 iCloud，沒網路也能用\ntripezgo.com\n#TripEZGo #旅行規劃',
      '排行程不用開 Excel\nTripEZGo 把每天的行程排在行事曆和時間軸上，地圖直接畫出路線；車票、訂位、待辦掛在行程裡，路上鎖定畫面就看得到下一站。\n旅伴可以一起編，不用註冊、沒網路也能用。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '推一個 iPhone／iPad 旅行規劃 App：TripEZGo\n・行事曆、時間軸、地圖三種看法\n・社群看到的景點分享進來存成靈感\n・路程時間不夠會先提醒\n・旅伴共編、路上共享位置\n・即時動態、Widget 看下一站\n・免帳號，資料只在 iCloud\ntripezgo.com\n#TripEZGo #旅行規劃',
      '出發前的我：把票券、訂位、待辦都掛進 TripEZGo 的行程裡。\n出發後的我：鎖定畫面看下一站、地圖看路線、點一下就打開車票。\n不用帳號，沒網路也能用\ntripezgo.com\n#TripEZGo',
      '以前規劃旅行要開五個 App：筆記、地圖、行事曆、匯率、截圖相簿。\n現在一個 TripEZGo 可以完成：行程、路線、票券、待辦、靈感、匯率換算、QR Code 掃描全部在裡面。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '跟朋友出國最怕行程對不上。\n用 TripEZGo 大家一起編同一份行程，旅途中可以分享位置，旅伴的位置顯示在地圖上\n行程、路線、票券、待辦都在同一個 App。\ntripezgo.com\n#TripEZGo #旅伴',
      '自由行好用的 App TripEZGo\n・一天一天排，空檔顯示在行事曆上\n・兩個行程之間的路程自動排好時間\n・每天的路線畫在地圖上\n・票券、訂位掛在行程上，到現場點了就開\n・鎖定畫面直接看下一站\ntripezgo.com\n#TripEZGo #自由行',
      '在 IG、Threads、Google 地圖看到想去的店？\n分享到 TripEZGo 存成靈感，之後排進行程，地圖上還會幫你標出沿路店家\ntripezgo.com\n#TripEZGo #旅行靈感',
      '我很在意隱私，所以選 TripEZGo：不用註冊帳號，行程只存在自己的手機和 iCloud，同步、備份、跟旅伴共享都走 iCloud\n功能也沒少：行事曆、時間軸、地圖路線、票券待辦、即時動態都有。\ntripezgo.com\n#TripEZGo',
      '國外沒網路也不怕\nTripEZGo 離線也能看行程、改行程、開票券；匯率換算、QR Code 掃描、筆記都內建。\n回到有網路再同步到 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '總覽一天一頁\nTripEZGo 的總覽把每天的行程、附件、待辦整理好，要找什麼點一下就到；切到行事曆看時間、切到地圖看路線。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '用 TripEZGo 排行程超快：\n1. 社群、地圖看到的地方存成靈感\n2. 排進行事曆\n3. 兩站之間的路程排好時間\n4. 票券、待辦掛上去\n5. 出發！鎖定畫面看下一站\ntripezgo.com\n#TripEZGo #旅行規劃',
      '誰懂旅行時一直解鎖手機找下一站的痛\nTripEZGo 的即時動態和 Widget 在鎖定畫面顯示下一站與路程，連 App 都不用開。\n行程規劃、地圖、票券、旅伴共編也都在裡面。\ntripezgo.com\n#TripEZGo',
      '一句話介紹 TripEZGo：排行程、帶票券、排路程、跟旅伴共編，出發後也跟著你走的旅行 App。\n免帳號、離線可用、資料只在你的 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '下次出國就用 TripEZGo\n每天的行程排在時間軸上，路程時間不夠會先提醒；車票、餐廳訂位掛在行程上，到現場點開就好；匯率換算直接在 App 裡算。\ntripezgo.com\n#TripEZGo #自由行',
      '旅行規劃 App 用過不少，最後留下 TripEZGo：\n・行事曆＋時間軸＋地圖三種模式\n・靈感收集\n・路程提醒\n・旅伴共編＋位置分享\n・即時動態、Widget\n・筆記、QR Code、匯率換算\n・不用帳號\ntripezgo.com\n#TripEZGo',
      '給每次旅行都負責排行程的那個朋友\nTripEZGo 讓你把行程、路程、票券、待辦排好，再邀大家一起看、一起改；出發後鎖定畫面就看得到下一站。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '行程不是一張表，是一條路線\nTripEZGo 把每天的行程連成地圖上的路線，兩站之間要多久直接顯示，沿路店家也標好了。\ntripezgo.com\n#TripEZGo',
      '旅行的所有東西，終於收在同一個地方：\n行程、路線、車票、訂位、待辦、筆記、靈感、匯率\nTripEZGo，iPhone、iPad 都能用，不用註冊。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '最近發現的App：TripEZGo\n排行程有行事曆、時間軸、地圖三種看法，旅伴可以一起編；出門後即時動態顯示下一站，沒網路也能看。免費下載！\ntripezgo.com\n#TripEZGo',
      '錯過這班車怎麼辦？TripEZGo 在兩個行程之間排好路程，時間不夠會先提醒\n加上地圖路線、票券、待辦、旅伴共編，一個 App 管整趟旅行。\ntripezgo.com\n#TripEZGo',
      '規劃旅行的三個煩惱，TripEZGo 都解決了：\n・行程散在各處 → 行事曆＋總覽一頁看完\n・不知道怎麼走 → 地圖路線＋路程時間\n・旅伴意見多 → 大家一起編同一份行程\ntripezgo.com\n#TripEZGo #旅行規劃',
      '免註冊、免登入、免費下載的旅行規劃 App：TripEZGo\n行程、路線、票券、待辦、靈感、筆記、匯率換算全部帶著走，資料只在你的手機和 iCloud。\ntripezgo.com\n#TripEZGo',
      '打開 TripEZGo，今天要去哪、怎麼去、幾點出發、票在哪，都在畫面上\n不想打開也行，鎖定畫面和 Widget 直接顯示下一站。\ntripezgo.com\n#TripEZGo #旅行規劃',
      '和旅伴出遊的正確打開方式\n1. 一起在 TripEZGo 排行程\n2. 每天的路線在地圖上看\n3. 票券、待辦掛在行程上\n4. 旅途中分享位置\n5. 鎖定畫面看下一站\ntripezgo.com\n#TripEZGo',
      'TripEZGo 十大功能懶人包\n行事曆／時間軸・靈感收集・地圖路線・票券待辦・路程提醒・旅程總覽・旅伴共編・位置分享・即時動態與 Widget・筆記 QR 匯率工具\n不用帳號，資料只在 iCloud。\ntripezgo.com\n#TripEZGo #旅行規劃',
    ],
  },
  en: {
    left: (d, hms) => `${d}d ${hms}`,
    copied: 'Copied', copyFailed: 'Copy it manually', copy: 'Copy caption',
    need1: 'Finish step 1 first: copy the caption.',
    need2: 'Finish step 2 first: share it on social media. Then come back to this page to redeem.',
    ready: 'Sharing is complete. Tap the button above to redeem on the App Store.',
    captions: [
      'All my trips are planned in TripEZGo now\n• Calendar + timeline: each day’s events and legs\n• Share ideas from social media and maps in, saved as inspirations\n• Each day’s events joined into a route on the map\n• Tickets, bookings and to-dos attached to each event\n• Legs between stops, with a warning when time is short\n• Overview: one page per day\n• Co-edit with companions, and share your location during the trip\n• Your next stop right on the Lock Screen\n• Notes, QR code scanner and currency converter built in\n• No account. Your data stays on your phone and in iCloud. Works offline\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Plan a trip without opening Excel\nTripEZGo puts each day’s events on a calendar and a timeline, and draws the route on a map. Tickets, bookings and to-dos are attached to events, and the Lock Screen shows your next stop.\nCompanions can co-edit. No sign-up, and it works offline.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'A travel planner app for iPhone and iPad I can recommend: TripEZGo\n• Calendar, timeline and map views\n• Share places from social media in and save them as inspirations\n• A warning when there is not enough time for a leg\n• Companion co-editing, location sharing on the road\n• Live Activity and widgets for your next stop\n• No account. Your data stays in iCloud\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Me before the trip: tickets, bookings and to-dos all attached to my plans in TripEZGo.\nMe on the trip: next stop on the Lock Screen, route on the map, tickets one tap away.\nNo account, works offline\ntripezgo.com\n#TripEZGo',
      'Planning a trip used to mean five apps: notes, maps, calendar, currency and a photo album full of screenshots.\nNow one app, TripEZGo, does all of it: events, routes, tickets, to-dos, inspirations, currency conversion and QR code scanning are all in it.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'The worst part of traveling with friends is plans that do not match.\nWith TripEZGo everyone edits the same trip. During the trip you can share your location, and companions appear on the map\nEvents, routes, tickets and to-dos are in one app.\ntripezgo.com\n#TripEZGo #TravelBuddies',
      'A handy app for independent travel: TripEZGo\n• Plan day by day, and gaps show on the calendar\n• The leg between two events gets its travel time automatically\n• Every day’s route drawn on the map\n• Tickets and bookings attached to events. Tap to open them on the spot\n• Your next stop right on the Lock Screen\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Spotted a place you want to go on Instagram, Threads or Google Maps?\nShare it to TripEZGo to save it as an inspiration. Add it to your events later, and the map marks the shops along the way\ntripezgo.com\n#TripEZGo #TravelInspiration',
      'Privacy matters to me, so I use TripEZGo: no account, trips stay on my phone and in my iCloud, and sync, backup and sharing with companions all go through iCloud\nNothing missing either: calendar, timeline, map routes, tickets, to-dos and Live Activity.\ntripezgo.com\n#TripEZGo',
      'No signal abroad? No problem\nTripEZGo works offline: view and edit your plans and open your tickets. Currency converter, QR code scanner and notes are built in.\nIt syncs to iCloud once you are back online.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Overview: one page per day\nTripEZGo’s Overview gathers each day’s events, files and to-dos, so anything is a tap away. Switch to the calendar for times or to the map for routes.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Planning with TripEZGo is fast:\n1. Save places from social media and maps as ideas\n2. Put them on the calendar\n3. Travel time between stops is planned for you\n4. Attach tickets and to-dos\n5. Go! Your next stop is on the Lock Screen\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Who else keeps unlocking their phone on a trip just to check the next stop?\nTripEZGo’s Live Activity and widgets show your next stop and the leg to it on the Lock Screen, with no need to open the app.\nPlanning, maps, tickets and co-editing are all in there too.\ntripezgo.com\n#TripEZGo',
      'TripEZGo in one sentence: plan events, carry tickets, plan legs and co-edit with companions, in a travel app that goes with you after you leave.\nNo account, works offline, your data stays in your iCloud.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'Using TripEZGo on my next trip abroad\nEach day on a timeline with a heads-up when a connection is tight; train tickets and restaurant bookings on each plan, ready to open; currency conversion right in the app.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'I have tried plenty of travel planners. TripEZGo is the one I kept:\n• Calendar + timeline + map\n• Inspirations\n• Leg reminders\n• Co-editing + location sharing\n• Live Activity and widgets\n• Notes, QR code scanner, currency converter\n• No account\ntripezgo.com\n#TripEZGo',
      'For the friend who always plans the trip\nTripEZGo lets you set up events, legs, tickets and to-dos, then invite everyone to view and edit together. After you leave, the next stop is right on the Lock Screen.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'A trip is not a table, it is a route\nTripEZGo joins each day’s events into a route on the map, shows how long each leg takes, and marks the shops along the way.\ntripezgo.com\n#TripEZGo',
      'Everything for the trip, finally in one place:\nPlans, routes, tickets, bookings, to-dos, notes, ideas, currency\nTripEZGo, for iPhone and iPad, no sign-up.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'An app I found recently: TripEZGo\nPlan events in a calendar, timeline or map view, and co-edit with companions. After you set off, the Live Activity shows your next stop, and it works offline. Free to download!\ntripezgo.com\n#TripEZGo',
      'What if you miss the train? TripEZGo plans the leg between two events and warns you when time is short\nAdd map routes, tickets, to-dos and co-editing, and one app handles the whole trip.\ntripezgo.com\n#TripEZGo',
      'Three trip-planning headaches TripEZGo fixes:\n• Plans scattered everywhere → calendar + Overview, all on one page\n• Not sure how to get there → map routes + travel times\n• Everyone has an opinion → co-edit one shared trip\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'No sign-up, no login, free to download: TripEZGo\nPlans, routes, tickets, to-dos, ideas, notes and a currency converter, all with you, and your data stays on your phone and in iCloud.\ntripezgo.com\n#TripEZGo',
      'Open TripEZGo and the screen shows where you go today, how to get there, when to leave and where your tickets are\nYou do not have to open it. The Lock Screen and widgets show your next stop.\ntripezgo.com\n#TripEZGo #TravelPlanning',
      'The right way to travel with companions\n1. Plan events together in TripEZGo\n2. See each day’s route on the map\n3. Attach tickets and to-dos to events\n4. Share locations during the trip\n5. Next stop on the Lock Screen\ntripezgo.com\n#TripEZGo',
      'TripEZGo’s top 10 features\nCalendar/timeline · Inspirations · Map routes · Tickets & to-dos · Leg reminders · Trip Overview · Co-editing · Location sharing · Live Activity & widgets · Notes, QR & currency tools\nNo account. Your data stays in iCloud.\ntripezgo.com\n#TripEZGo #TravelPlanning',
    ],
  },
  ja: {
    left: (d, hms) => `${d}日 ${hms}`,
    copied: 'コピーしました', copyFailed: '手動でコピーしてください', copy: '文章をコピー',
    need1: '先にステップ 1 の「文章をコピー」を済ませてください。',
    need2: '先にステップ 2 を済ませてください。SNS でシェアして、このページに戻ると引き換えできます。',
    ready: 'シェアが完了しました。上のボタンから App Store で引き換えてください。',
    captions: [
      '最近の旅行は、予定をぜんぶ TripEZGo で組んでいます\n・カレンダー＋タイムラインで、毎日の予定と移動\n・SNS や地図で見つけた場所を共有して、インスピレーションに保存\n・毎日の予定が地図上でルートにつながる\n・チケット・予約・やることを予定に追加\n・予定と予定のあいだの移動、時間が足りないと先に通知\n・概要は 1 日 1 ページ\n・旅の仲間と共同編集、旅程中は位置を共有できる\n・次の行き先はロック画面で\n・メモ・QR コード・為替換算もそろっている\n・アカウント不要、データは端末と iCloud だけ、オフラインでも使える\ntripezgo.com\n#TripEZGo #旅行計画',
      'Excel を開かずに旅程を組める\nTripEZGo なら毎日の予定をカレンダーとタイムラインに並べ、ルートは地図に表示。チケット、予約、やることは予定に追加し、旅程中はロック画面で次の行き先がわかります。\n旅の仲間と一緒に編集できます。登録不要、オフラインでも使えます。\ntripezgo.com\n#TripEZGo #旅行計画',
      'iPhone・iPad の旅行プランナーならこれ：TripEZGo\n・カレンダー・タイムライン・地図の 3 つの表示\n・SNS で見つけた場所を共有して、インスピレーションに保存\n・移動の時間が足りないと先に通知\n・旅の仲間と共同編集、旅先で位置を共有\n・ライブアクティビティとウィジェットで次の行き先\n・アカウント不要、データは iCloud だけ\ntripezgo.com\n#TripEZGo #旅行計画',
      '出発前のわたし：切符も予約もやることも、ぜんぶ TripEZGo の予定にまとめる。\n出発後のわたし：ロック画面で次の行き先、地図でルート、切符はワンタップ。\nアカウント不要、オフラインでも使える\ntripezgo.com\n#TripEZGo',
      '以前は旅行の計画に App を 5 つ使っていました。メモ、地図、カレンダー、為替、スクリーンショットだらけの写真 App。\nいまは TripEZGo ひとつで済みます。予定、ルート、チケット、やること、インスピレーション、為替換算、QR コード読み取りが全部入っています。\ntripezgo.com\n#TripEZGo #旅行計画',
      '友だちとの旅行でいちばん困るのは、予定がそろわないこと。\nTripEZGo ならみんなで同じ旅程を編集でき、旅程中は位置を共有できます。旅の仲間の位置は地図に表示されます\n予定・ルート・チケット・やることをひとつの App で。\ntripezgo.com\n#TripEZGo #旅の仲間',
      '個人旅行に便利な App、TripEZGo\n・1 日ずつ組めて、空き時間はカレンダーに表示\n・予定と予定のあいだの移動時間を自動で組み込み\n・毎日のルートを地図に表示\n・チケットや予約は予定に追加。現地でタップして開くだけ\n・次の行き先はロック画面で\ntripezgo.com\n#TripEZGo #個人旅行',
      'Instagram や Threads、Google マップで行きたいお店を見つけたら？\nTripEZGo に共有してインスピレーションに保存。あとから予定に追加でき、道沿いのお店も地図に表示します\ntripezgo.com\n#TripEZGo #旅のアイデア',
      'プライバシーを大事にしたいから TripEZGo：アカウント登録なし、旅程は自分の端末と iCloud だけ。同期もバックアップも、旅の仲間との共有もすべて iCloud 経由\n機能もそろってます。カレンダー、タイムライン、地図のルート、切符ややること、ライブアクティビティまで。\ntripezgo.com\n#TripEZGo',
      '海外で電波がなくても大丈夫\nTripEZGo はオフラインでも予定を見て、直して、切符を開けます。為替換算、QR コード読み取り、メモも内蔵。\nネットにつながったら iCloud に同期。\ntripezgo.com\n#TripEZGo #旅行計画',
      '概要は 1 日 1 ページ\nTripEZGo の概要は、毎日の予定・添付・やることをまとめて、探しものはタップひとつ。カレンダーに切り替えれば時間、地図ならルートがわかります。\ntripezgo.com\n#TripEZGo #旅行計画',
      'TripEZGo なら旅程づくりがあっという間：\n1. SNS や地図で見つけた場所を保存\n2. カレンダーに並べる\n3. 予定のあいだの移動時間も組み込む\n4. 切符とやることを予定にまとめる\n5. 出発！次の行き先はロック画面で\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅先で次の行き先を見るたびに端末のロックを解除する、あの面倒さ\nTripEZGo のライブアクティビティとウィジェットなら、次の行き先と移動がロック画面に。App を開く必要もありません。\n旅程づくり、地図、チケット、旅の仲間との共同編集もこれひとつ。\ntripezgo.com\n#TripEZGo',
      'TripEZGo をひと言でいうと：予定を組み、チケットを持ち、移動を組み、旅の仲間と共同編集。出発したあとも一緒に歩く旅行 App。\nアカウント不要、オフライン対応、データはあなたの iCloud だけ。\ntripezgo.com\n#TripEZGo #旅行計画',
      '次の海外旅行は TripEZGo で\n毎日の予定をタイムラインに並べて、移動時間が足りないと先にお知らせ。電車の切符やレストランの予約は予定にまとめて、現地で開くだけ。為替換算も App の中で。\ntripezgo.com\n#TripEZGo #個人旅行',
      '旅行プランナーはいろいろ試して、最後に残ったのが TripEZGo：\n・カレンダー＋タイムライン＋地図の 3 モード\n・インスピレーション\n・移動の通知\n・旅の仲間と共同編集＋位置の共有\n・ライブアクティビティ、ウィジェット\n・メモ、QR コード、為替換算\n・アカウント不要\ntripezgo.com\n#TripEZGo',
      'いつも旅程を組む係のあなたへ\nTripEZGo で予定・移動・チケット・やることを組んだら、みんなを招待して一緒に見て、一緒に直せます。出発したら次の行き先はロック画面で。\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅程は表ではなく、ルートだ\nTripEZGo は毎日の予定を地図上のルートにつなげ、移動にかかる時間を表示します。道沿いのお店も表示します。\ntripezgo.com\n#TripEZGo',
      '旅に要るものが、やっとひとつの場所に：\n予定、ルート、切符、予約、やること、メモ、アイデア、為替\nTripEZGo、iPhone でも iPad でも、登録不要。\ntripezgo.com\n#TripEZGo #旅行計画',
      '最近見つけた App：TripEZGo\nカレンダー・タイムライン・地図の 3 つの表示で旅程を組めて、旅の仲間と共同編集。出発後はライブアクティビティが次の行き先を表示、オフラインでも見られます。無料でダウンロード！\ntripezgo.com\n#TripEZGo',
      '乗り遅れたらどうする？TripEZGo は予定と予定のあいだの移動を組み、時間が足りないと先に通知します\n地図のルート、チケット、やること、共同編集まで。ひとつの App で旅全体を管理できます。\ntripezgo.com\n#TripEZGo',
      '旅行計画の 3 つの悩み、TripEZGo が解決：\n・予定があちこちに散らばる → カレンダー＋概要で 1 ページに\n・行き方がわからない → 地図のルート＋移動時間\n・みんなの意見がばらばら → 同じ旅程を一緒に編集\ntripezgo.com\n#TripEZGo #旅行計画',
      '登録なし、ログインなし、無料でダウンロードできる旅行プランナー：TripEZGo\n予定、ルート、切符、やること、行きたい場所、メモ、為替換算をぜんぶ持ち歩けて、データは端末と iCloud だけ。\ntripezgo.com\n#TripEZGo',
      'TripEZGo を開けば、今日どこへ行くか、どう行くか、何時に出るか、チケットはどこか、画面に表示されます\n開かなくても大丈夫。ロック画面とウィジェットに次の行き先が出ます。\ntripezgo.com\n#TripEZGo #旅行計画',
      '旅の仲間と出かけるときの正解\n1. TripEZGo でみんなで旅程を組む\n2. 毎日のルートを地図で見る\n3. チケットとやることを予定に追加\n4. 旅程中は位置を共有\n5. 次の行き先はロック画面で\ntripezgo.com\n#TripEZGo',
      'TripEZGo の 10 大機能まとめ\nカレンダー／タイムライン・インスピレーション・地図のルート・チケットとやること・移動の通知・旅程の概要・共同編集・位置の共有・ライブアクティビティとウィジェット・メモ・QR・為替のツール\nアカウント不要、データは iCloud だけ。\ntripezgo.com\n#TripEZGo #旅行計画',
    ],
  },
  hans: {
    left: (d, hms) => `${d} 天 ${hms}`,
    copied: '已复制', copyFailed: '手动复制', copy: '复制文案',
    need1: '先完成步骤 1：复制文案。',
    need2: '先完成步骤 2：分享到社交媒体。分享后回到这页，可以兑换。',
    ready: '已完成分享。点上面的按钮，到 App Store 兑换。',
    captions: [
      '最近出去玩，行程都排在 TripEZGo\n・日历＋时间轴，每天的行程与路程\n・社交媒体、地图上看到的灵感分享进来，存成灵感\n・每天的行程在地图上连成路线\n・车票、订位、待办都挂在行程上\n・两站之间的路程，时间不够会先提醒\n・总览一天一页\n・旅伴一起编，旅途中可以分享位置\n・锁屏上就能看到下一站\n・笔记、二维码、汇率换算都带着\n・不用账号，数据只在手机和 iCloud，没有网络也能用\ntripezgo.com\n#TripEZGo #旅行规划',
      '排行程不用开 Excel\nTripEZGo 把每天的行程排在日历和时间轴上，地图直接画出路线；车票、订位、待办挂在行程里，路上锁屏就能看到下一站。\n旅伴可以一起编，不用注册、没有网络也能用。\ntripezgo.com\n#TripEZGo #旅行规划',
      '推荐一个 iPhone／iPad 旅行规划 App：TripEZGo\n・日历、时间轴、地图三种看法\n・社交媒体上看到的景点分享进来，存成灵感\n・路程时间不够会先提醒\n・旅伴共编、路上分享位置\n・实时活动、小组件看下一站\n・免账号，数据只在 iCloud\ntripezgo.com\n#TripEZGo #旅行规划',
      '出发前的我：把票券、订位、待办都挂进 TripEZGo 的行程里。\n出发后的我：锁屏看下一站、地图看路线、点一下就打开车票。\n不用账号，没网也能用\ntripezgo.com\n#TripEZGo',
      '以前规划旅行要开五个 App：笔记、地图、日历、汇率、截图相册。\n现在一个 TripEZGo 可以完成：行程、路线、票券、待办、灵感、汇率换算、二维码扫描全部在里面。\ntripezgo.com\n#TripEZGo #旅行规划',
      '和朋友出国最怕行程对不上。\n用 TripEZGo 大家一起编同一份行程，旅途中可以分享位置，旅伴的位置显示在地图上\n行程、路线、票券、待办都在同一个 App 里。\ntripezgo.com\n#TripEZGo #旅伴',
      '自由行好用的 App TripEZGo\n・一天一天排，空档显示在日历上\n・两个行程之间的路程自动排好时间\n・每天的路线画在地图上\n・票券、订位挂在行程上，到现场点一下就能打开\n・锁屏直接看下一站\ntripezgo.com\n#TripEZGo #自由行',
      '在 IG、Threads、Google 地图看到想去的店？\n分享到 TripEZGo 存成灵感，之后排进行程，地图上还会帮你标出沿路店铺\ntripezgo.com\n#TripEZGo #旅行灵感',
      '我很在意隐私，所以选了 TripEZGo：不用注册账号，行程只存在自己的手机和 iCloud，同步、备份、和旅伴共享都走 iCloud\n功能也不少：日历、时间轴、地图路线、票券待办、实时活动都有。\ntripezgo.com\n#TripEZGo',
      '在国外没网也不怕\nTripEZGo 离线也能看行程、改行程、打开票券；汇率换算、扫描二维码、笔记都内置。\n回到有网络的地方再同步到 iCloud。\ntripezgo.com\n#TripEZGo #旅行规划',
      '总览一天一页\nTripEZGo 的总览把每天的行程、附件、待办整理好，要找什么点一下就到；切到日历看时间、切到地图看路线。\ntripezgo.com\n#TripEZGo #旅行规划',
      '用 TripEZGo 排行程超快：\n1. 社交媒体、地图上看到的地方存成灵感\n2. 排进日历\n3. 两站之间的路程排好时间\n4. 挂上票券、待办\n5. 出发！锁屏上看下一站\ntripezgo.com\n#TripEZGo #旅行规划',
      '谁懂旅行时一直解锁手机找下一站的痛\nTripEZGo 的实时活动和小组件在锁屏上显示下一站与路程，连 App 都不用开。\n行程规划、地图、票券、旅伴共编也都在里面。\ntripezgo.com\n#TripEZGo',
      '一句话介绍 TripEZGo：排行程、带票券、排路程、和旅伴共编，出发后也一直跟着你的旅行 App。\n免账号、离线可用、数据只在你的 iCloud。\ntripezgo.com\n#TripEZGo #旅行规划',
      '下次出国就用 TripEZGo\n每天的行程排在时间轴上，路程时间不够会先提醒；车票、餐厅订位挂在行程上，到了现场点开就行；汇率换算直接在 App 里算。\ntripezgo.com\n#TripEZGo #自由行',
      '旅行规划 App 用过不少，最后留下 TripEZGo：\n・日历＋时间轴＋地图三种模式\n・灵感收集\n・路程提醒\n・旅伴共编＋位置分享\n・实时活动、小组件\n・笔记、二维码、汇率换算\n・不用账号\ntripezgo.com\n#TripEZGo',
      '给每次旅行都负责排行程的那个朋友\nTripEZGo 让你把行程、路程、票券、待办排好，再邀大家一起看、一起改；出发后锁屏上就能看到下一站。\ntripezgo.com\n#TripEZGo #旅行规划',
      '行程不是一张表，是一条路线\nTripEZGo 把每天的行程连成地图上的路线，两站之间要多久直接显示，沿路店铺也标好了。\ntripezgo.com\n#TripEZGo',
      '旅行要用的所有东西，终于收在同一个地方：\n行程、路线、车票、订位、待办、笔记、灵感、汇率\nTripEZGo，iPhone、iPad 都能用，不用注册。\ntripezgo.com\n#TripEZGo #旅行规划',
      '最近发现的 App：TripEZGo\n排行程有日历、时间轴、地图三种看法，旅伴可以一起编；出门后实时活动显示下一站，没有网络也能看。免费下载！\ntripezgo.com\n#TripEZGo',
      '错过这班车怎么办？TripEZGo 在两个行程之间排好路程，时间不够会先提醒\n加上地图路线、票券、待办、旅伴共编，一个 App 管整趟旅行。\ntripezgo.com\n#TripEZGo',
      '规划旅行的三个烦恼，TripEZGo 都解决了：\n・行程散落各处 → 日历＋总览一页看完\n・不知道怎么走 → 地图路线＋路程时间\n・旅伴意见多 → 大家一起编同一份行程\ntripezgo.com\n#TripEZGo #旅行规划',
      '免注册、免登录、免费下载的旅行规划 App：TripEZGo\n行程、路线、票券、待办、灵感、笔记、汇率换算全都带着走，数据只在你的手机和 iCloud。\ntripezgo.com\n#TripEZGo',
      '打开 TripEZGo，今天要去哪、怎么去、几点出发、票在哪，都在屏幕上\n不想打开也行，锁屏和小组件直接显示下一站。\ntripezgo.com\n#TripEZGo #旅行规划',
      '和旅伴出游的正确打开方式\n1. 一起在 TripEZGo 排行程\n2. 每天的路线在地图上看\n3. 票券、待办挂在行程上\n4. 旅途中分享位置\n5. 锁屏看下一站\ntripezgo.com\n#TripEZGo',
      'TripEZGo 十大功能懒人包\n日历／时间轴・灵感收集・地图路线・票券待办・路程提醒・旅程总览・旅伴共编・位置分享・实时活动和小组件・笔记 二维码 汇率工具\n不用账号，数据只在 iCloud。\ntripezgo.com\n#TripEZGo #旅行规划',
    ],
  },
  ko: {
    left: (d, hms) => `${d}일 ${hms}`,
    copied: '복사했어요', copyFailed: '직접 복사하세요', copy: '문구 복사',
    need1: '먼저 1단계 ‘문구 복사’를 끝내세요.',
    need2: '먼저 2단계를 끝내세요. SNS에 공유한 뒤 이 페이지로 돌아오면 교환할 수 있어요.',
    ready: '공유가 완료되었습니다. 위 버튼을 눌러 App Store에서 교환하세요.',
    captions: [
      '최근 여행 일정은 전부 TripEZGo로 짭니다\n・캘린더＋타임라인으로 매일의 일정과 이동\n・SNS와 지도에서 본 장소를 공유해 영감으로 저장\n・매일의 일정이 지도에서 동선으로 이어짐\n・승차권, 예약, 할 일을 일정에 추가\n・일정 사이의 이동, 시간이 부족하면 먼저 알림\n・개요는 하루 한 페이지\n・동행과 함께 편집하고, 여행 중에는 위치를 공유\n・다음 장소는 잠금 화면에서\n・메모, QR 코드, 환율 계산도 내장\n・계정 불필요, 데이터는 내 기기와 iCloud에만, 오프라인에서도 사용\ntripezgo.com\n#TripEZGo #여행계획',
      'Excel 없이 일정을 짭니다\nTripEZGo는 매일의 일정을 캘린더와 타임라인에 배치하고, 지도에 동선을 그립니다. 승차권, 예약, 할 일은 일정에 추가하고, 여행 중에는 잠금 화면에서 다음 장소를 확인합니다.\n동행과 함께 편집할 수 있습니다. 회원가입 없이, 오프라인에서도 사용합니다.\ntripezgo.com\n#TripEZGo #여행계획',
      'iPhone·iPad 여행 플래너 앱 추천: TripEZGo\n・캘린더, 타임라인, 지도 세 가지 보기\n・SNS에서 본 장소를 공유해 영감으로 저장\n・이동 시간이 부족하면 먼저 알림\n・동행 공동 편집, 여행 중 위치 공유\n・라이브 액티비티와 위젯으로 다음 장소 확인\n・계정 불필요, 데이터는 iCloud에만\ntripezgo.com\n#TripEZGo #여행계획',
      '출발 전의 나: 승차권, 예약, 할 일을 전부 TripEZGo 일정에 붙여 두기.\n출발 후의 나: 잠금 화면으로 다음 목적지, 지도로 경로, 승차권은 한 번 탭.\n계정 없이, 오프라인에서도 OK\ntripezgo.com\n#TripEZGo',
      '예전에는 여행을 계획하려면 앱을 다섯 개 열어야 했습니다. 메모, 지도, 캘린더, 환율, 스크린샷 사진첩.\n이제는 TripEZGo 하나로 됩니다. 일정, 경로, 승차권, 할 일, 영감, 환율 계산, QR 코드 스캔이 모두 들어 있습니다.\ntripezgo.com\n#TripEZGo #여행계획',
      '친구와 해외여행을 갈 때 가장 곤란한 것은 일정이 서로 다른 것입니다.\nTripEZGo에서는 모두 같은 여행을 함께 편집하고, 여행 중에 위치를 공유할 수 있습니다. 동행의 위치가 지도에 표시됩니다\n일정, 경로, 승차권, 할 일이 한 앱에 있습니다.\ntripezgo.com\n#TripEZGo #동행',
      '자유여행에 좋은 앱 TripEZGo\n・하루씩 짜고, 빈 시간은 캘린더에 표시\n・일정 사이의 이동 시간을 자동으로 배치\n・매일의 동선을 지도에 표시\n・승차권과 예약을 일정에 추가, 현장에서 탭해서 열기\n・다음 장소는 잠금 화면에서\ntripezgo.com\n#TripEZGo #자유여행',
      'Instagram, Threads, Google 지도에서 가고 싶은 가게를 봤나요?\nTripEZGo로 공유해 영감으로 저장하세요. 나중에 일정에 넣으면 지도에 길가의 가게도 표시됩니다\ntripezgo.com\n#TripEZGo #여행영감',
      '개인정보가 중요해서 TripEZGo를 써요. 회원가입 없이, 일정은 내 폰과 iCloud에만. 동기화·백업·동행과의 공유도 전부 iCloud로\n기능도 빠짐없어요. 캘린더, 타임라인, 지도 경로, 승차권·할 일, 라이브 액티비티까지.\ntripezgo.com\n#TripEZGo',
      '해외에서 인터넷이 안 돼도 괜찮아요\nTripEZGo는 오프라인에서도 일정을 보고, 고치고, 승차권을 열 수 있어요. 환율 계산, QR 코드 스캔, 메모도 내장.\n인터넷이 연결되면 iCloud에 동기화돼요.\ntripezgo.com\n#TripEZGo #여행계획',
      '개요는 하루 한 페이지\nTripEZGo의 개요는 매일의 일정, 첨부, 할 일을 정리해 두어 원하는 것을 한 번 탭하면 찾을 수 있습니다. 캘린더로 전환하면 시간을, 지도로 전환하면 동선을 볼 수 있습니다.\ntripezgo.com\n#TripEZGo #여행계획',
      'TripEZGo로 일정 짜기, 정말 빨라요:\n1. SNS·지도에서 본 곳을 저장\n2. 캘린더에 놓기\n3. 일정 사이 이동 시간까지\n4. 승차권·할 일 붙이기\n5. 출발! 다음 목적지는 잠금 화면에서\ntripezgo.com\n#TripEZGo #여행계획',
      '여행 중 다음 장소를 보려고 계속 잠금을 푸는 불편함, 공감하시나요\nTripEZGo의 라이브 액티비티와 위젯은 잠금 화면에 다음 장소와 이동을 표시해, 앱을 열 필요도 없습니다.\n일정 계획, 지도, 승차권, 동행 공동 편집도 모두 들어 있습니다.\ntripezgo.com\n#TripEZGo',
      'TripEZGo를 한마디로: 일정을 짜고, 승차권을 챙기고, 이동을 짜고, 동행과 공동 편집하는, 출발한 뒤에도 함께하는 여행 앱.\n계정 불필요, 오프라인 지원, 데이터는 내 iCloud에만.\ntripezgo.com\n#TripEZGo #여행계획',
      '다음 해외여행은 TripEZGo로\n날마다의 일정을 타임라인에 놓고, 이동 시간이 모자라면 미리 알려 줘요. 기차표·식당 예약은 일정에 붙여 두고 현장에서 열기만. 환율 계산도 앱 안에서.\ntripezgo.com\n#TripEZGo #자유여행',
      '여행 플래너 앱을 많이 써 봤지만, 마지막까지 남은 것은 TripEZGo:\n・캘린더＋타임라인＋지도 세 가지 모드\n・영감\n・이동 알림\n・동행 공동 편집＋위치 공유\n・라이브 액티비티, 위젯\n・메모, QR 코드, 환율 계산\n・계정 불필요\ntripezgo.com\n#TripEZGo',
      '여행 때마다 일정을 맡는 친구에게\nTripEZGo에서 일정, 이동, 승차권, 할 일을 정리하고 모두를 초대해 함께 보고 함께 고치세요. 출발하면 다음 장소를 잠금 화면에서 볼 수 있습니다.\ntripezgo.com\n#TripEZGo #여행계획',
      '일정은 표가 아니라 동선입니다\nTripEZGo는 매일의 일정을 지도 위 동선으로 이어 주고, 두 장소 사이의 소요 시간을 표시합니다. 길가의 가게도 표시됩니다.\ntripezgo.com\n#TripEZGo',
      '여행에 필요한 모든 것이 드디어 한곳에:\n일정, 경로, 승차권, 예약, 할 일, 메모, 아이디어, 환율\nTripEZGo, iPhone·iPad에서, 회원가입 없이.\ntripezgo.com\n#TripEZGo #여행계획',
      '최근 발견한 앱: TripEZGo\n캘린더, 타임라인, 지도 세 가지 보기로 일정을 짜고, 동행과 함께 편집할 수 있습니다. 출발 후에는 라이브 액티비티가 다음 장소를 표시하고, 오프라인에서도 볼 수 있습니다. 무료 다운로드!\ntripezgo.com\n#TripEZGo',
      '열차를 놓치면 어떡하죠? TripEZGo는 일정 사이의 이동을 짜 두고, 시간이 부족하면 먼저 알려 줍니다\n지도 동선, 승차권, 할 일, 동행 공동 편집까지. 앱 하나로 여행 전체를 관리합니다.\ntripezgo.com\n#TripEZGo',
      '여행 계획의 세 가지 고민, TripEZGo가 해결:\n・일정이 여기저기 흩어짐 → 캘린더＋개요로 한 페이지에\n・어떻게 가야 할지 모름 → 지도 경로＋이동 시간\n・동행마다 의견이 다름 → 같은 일정을 함께 편집\ntripezgo.com\n#TripEZGo #여행계획',
      '회원가입·로그인 없이 무료로 받는 여행 플래너: TripEZGo\n일정, 경로, 승차권, 할 일, 가고 싶은 곳, 메모, 환율 계산을 전부 들고 다니고, 데이터는 내 폰과 iCloud에만.\ntripezgo.com\n#TripEZGo',
      'TripEZGo를 열면 오늘 어디로 가는지, 어떻게 가는지, 몇 시에 출발하는지, 승차권이 어디 있는지 화면에 표시됩니다\n열지 않아도 됩니다. 잠금 화면과 위젯에 다음 장소가 표시됩니다.\ntripezgo.com\n#TripEZGo #여행계획',
      '동행과 여행하는 올바른 방법\n1. TripEZGo에서 함께 일정 짜기\n2. 매일의 동선을 지도에서 보기\n3. 승차권과 할 일을 일정에 추가\n4. 여행 중 위치 공유\n5. 다음 장소는 잠금 화면에서\ntripezgo.com\n#TripEZGo',
      'TripEZGo 10대 기능 한눈에\n캘린더/타임라인・영감・지도 동선・승차권과 할 일・이동 알림・여행 개요・동행 공동 편집・위치 공유・라이브 액티비티와 위젯・메모, QR, 환율 도구\n계정 불필요, 데이터는 iCloud에만.\ntripezgo.com\n#TripEZGo #여행계획',
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

#!/usr/bin/env python3
"""從繁中首頁 index.html 產生 en/index.html 與 ja/index.html。

繁中是母版：版面、區塊、截圖位置都只改 index.html，再跑這支。
英日文只換字（逐字對照表在下面）、換截圖路徑、換連結與 <head>。
表裡沒有對到的中文字串會讓這支直接失敗——寧可擋下，不要上線一頁中英夾雜。

用詞照 App 的字串表（Scripts/i18n/maps）：旅伴 Companion／旅の仲間、共編 co-edit／共同編集、
總覽 Overview／概要、附件 Files／添付、待辦 To-Dos／やることリスト、即時動態 Live Activity／ライブアクティビティ、
小工具 Tools／ツール。

用法：python3 tools/home-i18n.py
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

# 開發故事的文章連結：zhgchg.li 每篇都有英日版（文章頁的 hreflang），英日首頁連到同語言那一篇
POSTS = {
  '2cbc121a1b7c': ('https://en.zhgchg.li/posts/okinawa-summer-5-day-self-drive-tour-snorkeling-aquarium-entertainment-highlights-2cbc121a1b7c/',
                   'https://jp.zhgchg.li/posts/%E6%B2%96%E7%B8%845%E6%97%A5%E8%87%AA%E9%A7%95%E6%97%85%E8%A1%8C-%E9%9D%92%E3%81%AE%E6%B4%9E%E7%AA%9F%E6%B5%AE%E6%BD%9C-%E7%BE%8E%E3%82%89%E6%B5%B7%E6%B0%B4%E6%97%8F%E9%A4%A8-%E3%82%A2%E3%83%A1%E3%83%AA%E3%82%AB%E3%83%B3%E3%83%93%E3%83%AC%E3%83%83%E3%82%B8%E8%A6%B3%E5%85%89%E3%82%AC%E3%82%A4%E3%83%89-2cbc121a1b7c/'),
  '31b9b3a63abc': ('https://en.zhgchg.li/posts/travel-journals/sanyo-region-travel-guide-6-day-hiroshima-okayama-itinerary-for-freedom-seekers-31b9b3a63abc/',
                   'https://jp.zhgchg.li/posts/z-%E5%BA%A6%E6%97%85%E8%A1%8C%E9%81%8A%E8%A8%98/%E5%B1%B1%E9%99%BD%E5%9C%B0%E5%8D%80%E8%87%AA%E7%94%B1%E8%A1%8C-%E5%BB%A3%E5%B3%B6-%E5%B2%A1%E5%B1%B1%E3%82%92%E5%B7%A1%E3%82%8B6%E6%97%A5%E9%96%93%E3%81%AE%E6%97%85%E3%83%97%E3%83%A9%E3%83%B3-%E8%A6%B3%E5%85%89%E3%82%B9%E3%83%9D%E3%83%83%E3%83%88%E3%81%A8%E7%A7%BB%E5%8B%95%E6%94%BB%E7%95%A5-31b9b3a63abc/'),
  '7b8a0563c157': ('https://en.zhgchg.li/posts/travel-journals/nagoya-one-day-quick-trip-peach-aviation-flight-experience-and-travel-tips-7b8a0563c157/',
                   'https://jp.zhgchg.li/posts/z-%E5%BA%A6%E6%97%85%E8%A1%8C%E9%81%8A%E8%A8%98/%E5%90%8D%E5%8F%A4%E5%B1%8B%E4%B8%80%E6%97%A5%E5%BF%AB%E9%96%83%E8%87%AA%E7%94%B1%E8%A1%8C-%E6%A8%82%E6%A1%83%E8%88%AA%E7%A9%BA%E6%A9%9F%E7%A5%A8%E6%94%BB%E7%95%A5%E3%81%A8%E8%A6%B3%E5%85%89%E3%82%B9%E3%83%9D%E3%83%83%E3%83%88%E7%B4%B9%E4%BB%8B-7b8a0563c157/'),
  'aacd5f5cacd1': ('https://en.zhgchg.li/posts/travel-journals/san-in-kansai-7-day-solo-trip-explore-izumo-matsue-tottori-himeji-osaka-kobe-aacd5f5cacd1/',
                   'https://jp.zhgchg.li/posts/z-%E5%BA%A6%E6%97%85%E8%A1%8C%E9%81%8A%E8%A8%98/%E5%B1%B1%E9%99%B0%E5%B3%B6%E6%A0%B9%E5%87%BA%E9%9B%B2%E6%9D%BE%E6%B1%9F%E9%B3%A5%E5%8F%96%E9%96%A2%E8%A5%BF7%E6%97%A5%E8%87%AA%E7%94%B1%E8%A1%8C-%E4%BA%A4%E9%80%9A1000km-%E6%AD%A9%E6%95%B010%E4%B8%87%E6%AD%A9%E3%81%AE%E6%97%85%E7%A8%8B%E3%82%AC%E3%82%A4%E3%83%89-aacd5f5cacd1/'),
  'd78e0b15a08a': ('https://en.zhgchg.li/posts/travel-journals/kyushu-10-day-solo-travel-guide-explore-fukuoka-nagasaki-kumamoto-efficiently-d78e0b15a08a/',
                   'https://jp.zhgchg.li/posts/z-%E5%BA%A6%E6%97%85%E8%A1%8C%E9%81%8A%E8%A8%98/%E4%B9%9D%E5%B7%9E%E8%87%AA%E7%94%B1%E8%A1%8C-%E7%A6%8F%E5%B2%A1-%E9%95%B7%E5%B4%8E-%E7%86%8A%E6%9C%AC%E3%82%92%E5%B7%A1%E3%82%8B10%E6%97%A5%E9%96%93%E3%81%AE%E7%8B%AC%E3%82%8A%E6%97%85%E3%82%AC%E3%82%A4%E3%83%89-d78e0b15a08a/'),
}

T = {
  # chrome
  '跳到主要內容': ('Skip to main content', 'メインコンテンツへ移動'),
  '隱私': ('Privacy', 'プライバシー'),
  '功能': ('Features', '機能'),
  '方案': ('Pricing', '料金'),
  'TripEZGo 首頁': ('TripEZGo home', 'TripEZGo ホーム'),
  '主要導覽': ('Main', 'メイン'),
  '頁尾導覽': ('Footer', 'フッター'),
  '隱私權政策': ('Privacy Policy', 'プライバシーポリシー'),
  '使用者條款': ('Terms of Use', '利用規約'),
  '聯絡我們': ('Contact', 'お問い合わせ'),
  '旅行規劃、旅途所需一次搞定。': ('Plan the trip, carry what it needs — all in one app.', '旅の計画も、旅先で要るものも、これひとつで。'),
  'Made for iPhone &amp; iPad · 支援 6 種語言': ('Made for iPhone &amp; iPad · Available in 6 languages', 'Made for iPhone &amp; iPad · 6 言語に対応'),
  # hero
  'iPhone 與 iPad 旅行規劃': ('Trip planning for iPhone and iPad', 'iPhone・iPad の旅行プランナー'),
  '旅行規劃、旅途所需': ('Plan the trip, carry what it needs —', '旅の計画も、旅先で要るものも、'),
  '一次搞定': ('all in one app', 'これひとつで'),
  '排行程、帶票券、查交通，出發後也跟著你走。': ('Plan the days, keep the tickets, check the connections — and take it all with you when you go.',
                                              '予定を組んで、チケットをまとめて、移動を調べる。出発したあとも、そのまま持ち歩けます。'),
  '在 App Store 下載': ('Download on the App Store', 'App Store でダウンロード'),
  '看看它怎麼運作': ('See how it works', '使い方を見る'),
  '免註冊': ('No sign-up', '登録不要'),
  '離線可用': ('Works offline', 'オフラインで使える'),
  '免費下載': ('Free to download', '無料でダウンロード'),
  # privacy
  '隱私與安全': ('Privacy and security', 'プライバシーと安全'),
  '你的旅程，': ('Your trips live', 'あなたの旅行は、'),
  '只在你的手機': ('only on your phone', 'あなたの iPhone と'),
  '和你的 iCloud': ('and in your iCloud', 'あなたの iCloud だけに'),
  '閱讀完整隱私權政策 →': ('Read the full privacy policy →', 'プライバシーポリシー全文を読む →'),
  '筆記': ('Notes', 'メモ'),
  # 01 安排行程
  '01 · 安排行程': ('01 · Plan events', '01 · 予定を組む'),
  '該帶的，': ('Everything you need,', '持っていくものは、'),
  '都掛在行程上': ('attached to the event', '予定にまとめて'),
  '車票、訂位、待辦跟著行程走，到現場點了就開。': ('Tickets, bookings and to-dos stay with the event. When you get there, one tap opens them.',
                                             'チケットも予約もやることも、予定と一緒に。現地ではタップするだけで開けます。'),
  '照片、檔案、電子車票連結': ('Photos, files and e-ticket links', '写真・ファイル・電子チケットのリンク'),
  '出發前逐項打勾的待辦': ('To-dos to tick off before you leave', '出発前にチェックするやること'),
  # 03 行事曆／時間軸
  '今天怎麼走，': ("Today's plan,", '今日の回り方が、'),
  '一眼看完': ('at a glance', 'ひと目でわかる'),
  '行程、空檔、路上要多久，排在同一條時間上。': ('Events, free time and travel time, laid out on a single line of time.',
                                            '予定も空き時間も移動時間も、1本の時間軸に。'),
  '停留多久、空檔多少': ('How long you stay, how much time is free', '滞在時間と空き時間'),
  '行事曆、時間軸隨時切換': ('Switch between calendar and timeline anytime', 'カレンダーとタイムラインをいつでも切り替え'),
  # 05 地圖
  '下一站在哪，': ("Where's next?", '次はどこへ。'),
  '地圖告訴你': ('The map shows you', 'マップが教えてくれる'),
  '每天的行程連成路線，順路的店也標在上面。': ("Each day's events join into a route, with the shops along the way marked too.",
                                          '1日の予定がルートでつながり、道沿いのお店も表示されます。'),
  '每日路線與路程': ('Daily routes and legs', '1日のルートと移動'),
  '標記想去的地方': ('Pin the places you want to go', '行きたい場所にマーカー'),
  '日本超商、百貨藥妝圖資': ('Japanese convenience stores, department stores and drugstores', '日本のコンビニ・百貨店・ドラッグストア'),
  '支援步行導航': ('Walking directions', '徒歩ナビ'),
  # 04 總覽
  '04 · 總覽模式': ('04 · Overview', '04 · 概要'),
  '整趟旅程，': ('The whole trip,', '旅行まるごと、'),
  '一頁看完': ('on one page', '1ページで'),
  '行程、附件、待辦，要找的東西點一下就到。': ('Events, files and to-dos — whatever you need is one tap away.',
                                         '予定・添付・やること。探しものはタップひとつで。'),
  # 06 旅伴
  '一起排，': ('Plan together,', '一緒に組んで、'),
  '一起出發': ('travel together', '一緒に出発'),
  '旅伴一起編行程、筆記與附件。路上分享位置，走散了也找得到彼此。':
      ('Companions edit events, notes and files together. Share your location on the road, so you can find each other if you split up.',
       '旅の仲間と予定・メモ・添付を共同編集。旅先では現在地を共有して、はぐれてもお互いを見つけられます。'),
  # lock screen
  '不用打開 App': ('Without opening the app', 'アプリを開かずに'),
  '不用解鎖，': ('No unlocking —', 'ロックを解除しなくても、'),
  '下一站就在鎖定畫面': ('your next stop is on the Lock Screen', '次の行き先はロック画面に'),
  '現在在哪、還能待多久、下一站怎麼去。': ("Where you are, how long you have left, and how to get to the next stop.",
                                     '今どこにいて、あとどれだけいられて、次へどう行くか。'),
  '即時動態': ('Live Activity', 'ライブアクティビティ'),
  # tools
  '小工具': ('Tools', 'ツール'),
  '路上用得到的，': ('What you need on the road,', '旅先で使うものは、'),
  '都帶著': ('all in one place', 'ぜんぶここに'),
  '匯率換算': ('Currency', '為替換算'),
  '待購清單': ('Shopping list', '買い物リスト'),
  'QR Code 掃描': ('QR code scanner', 'QR コードスキャン'),
  # AI
  '讓 AI': ('Let AI', 'AI に'),
  '幫你排行程': ('plan it for you', '予定を組んでもらう'),
  '內建 MCP，接上你的 AI Agent，說一句「幫我排京都第二天」，行程就進來了。':
      ('Built-in MCP connects your AI agent. Say "Plan day two in Kyoto for me" and the events appear.',
       'MCP を内蔵。AI エージェントにつないで「京都の2日目を組んで」と頼めば、予定が入ります。'),
  # plans
  '免費開始，': ('Start free,', '無料ではじめて、'),
  '需要再升級': ('upgrade when you need to', '必要なときにアップグレード'),
  '免費版': ('Free', '無料版'),
  '旅程數': ('Trips', '旅行の数'),
  '3 趟': ('3', '3 件'),
  '垃圾桶也算': ('trash included', 'ゴミ箱の分も含む'),
  '不限': ('Unlimited', '無制限'),
  '每趟旅伴': ('Companions per trip', '旅行ごとの旅の仲間'),
  '3 位': ('3', '3 人'),
  '廣告': ('Ads', '広告'),
  '有': ('Yes', 'あり'),
  '無廣告': ('No ads', '広告なし'),
  '行事曆／時間軸、地圖、總覽': ('Calendar / timeline, map, overview', 'カレンダー／タイムライン・マップ・概要'),
  '附件、待辦、路程與班次備案': ('Files, to-dos, legs and backup departures', '添付・やること・移動と代わりの便'),
  '旅伴共編、分享位置': ('Co-editing and location sharing', '共同編集・現在地の共有'),
  '小工具（筆記、匯率、待購清單）': ('Tools (notes, currency, shopping list)', 'ツール（メモ・為替・買い物リスト）'),
  'iCloud 同步與備份': ('iCloud sync and backup', 'iCloud 同期とバックアップ'),
  '匯入匯出': ('Import and export', '読み込み・書き出し'),
  'AI Agent 整合': ('AI agent integration', 'AI エージェント連携'),
  'Apple／Google 行事曆整合': ('Apple / Google Calendar integration', 'Apple／Google カレンダー連携'),
  'Premium 提供週、月、年自動續訂或一次買斷，可隨時在 App Store 的訂閱設定取消。':
      ('Premium is available as a weekly, monthly or yearly subscription, or a one-time purchase. Cancel anytime in your App Store subscription settings.',
       'Premium は週・月・年の自動更新サブスクリプション、または買い切り。App Store のサブスクリプション設定からいつでも解約できます。'),
  '不支援': ('Not included', '対象外'),
  '支援': ('Included', '対象'),
  # alt text
  '地圖模式：第 2 天在宮島，行程依序連成步行路線，嚴島神社的卡片上有步行導航鈕':
      ("Map: day 2 on Miyajima, with events joined into a walking route and Itsukushima Shrine's card showing a walking-directions button",
       'マップ：2日目の宮島。予定が徒歩ルートでつながり、厳島神社のカードに徒歩ナビのボタン'),
  '行事曆模式：山陽 6 日的第 2 天，行程沿時間排開，早餐與渡輪之間標著 JR 山陽本線的班次':
      ('Calendar: day 2 of the six-day San\'yō trip, events laid out by time, with the JR San\'yō Line departure between breakfast and the ferry',
       'カレンダー：山陽 6 日間の2日目。予定が時間順に並び、朝食とフェリーのあいだに JR 山陽本線の便'),
  '總覽：今天的行程依時間列出，行程之間標著步行時間與間隔': ("Overview: today's events listed by time, with walking time and gaps between them",
                                                    '概要：今日の予定が時間順に並び、予定のあいだに徒歩時間と間隔'),
  '路程：三個班次並排，選中的那一班顯示發車、抵達與候車時間':
      ('Leg: three departures side by side; the selected one shows departure, arrival and waiting time',
       '移動：3つの便が並び、選んだ便の発車・到着・待ち時間を表示'),
  '旅程共編：分享開關、邀請連結與 QR Code，下方列出旅伴': ('Trip sharing: the sharing switch, invite link and QR code, with companions listed below',
                                                   '旅程の共同編集：共有スイッチ、招待リンクと QR コード、その下に旅の仲間'),
  '主畫面 Widget：今天的行程與匯率換算': ("Home Screen widgets: today's events and a currency converter", 'ホーム画面のウィジェット：今日の予定と為替換算'),
  '筆記：圖文筆記，@ 連到行程，日文句子可以朗讀': ('Notes: text and photos, @ links to events, and Japanese phrases that can be read aloud',
                                          'メモ：写真と文字のメモ。@ で予定にリンクし、フレーズは読み上げも'),
  '匯率換算：台幣與日圓互換，下方是最近的換算紀錄': ('Currency: converting between two currencies, with recent conversions below', '為替換算：2つの通貨を換算し、下に最近の換算履歴'),
  '購物清單：待購、已購、不買了的件數，商品依分類排成照片格': ('Shopping list: counts of to-buy, bought and skipped items, with items in a photo grid by category',
                                                    '買い物リスト：購入予定・購入済み・やめたの件数と、カテゴリ別の写真グリッド'),
  'QR Code 掃描：打開就是鏡頭，對準就掃到，紀錄旅伴也看得到': ('QR code scanner: opens straight to the camera, scans on sight, and keeps a history your companions can see',
                                                     'QR コードスキャン：開くとすぐカメラ。かざすだけで読み取り、履歴は旅の仲間も見られる'),
  # ── 2026-10-11 照手稿重排之後新增的字串 ──
  # 用詞：路程 leg／移動、全日 all-day／終日、待排 unscheduled／未定、標記 marker／マーカー、
  # 步行導航 walking directions／徒歩ナビ、位置共享 location sharing／位置の共有（App 字串表）。
  # 展開介紹與開發故事是手稿原文：譯成口語短句，不逐字對；段落與清單結構照母版。
  '展開介紹': ('Read more', 'くわしく見る'),
  # 右下角浮動下載卡片（QR 圖三語共用）
  '立即下載 App': ('Get the App', '今すぐダウンロード'),
  'App Store 下載 QR Code': ('QR code to download on the App Store', 'App Store ダウンロード用 QR コード'),
  '用 iPhone 掃描下載': ('Scan with your iPhone', 'iPhone で読み取ってダウンロード'),
  # 隱私
  '不用帳號，我們沒有伺服器，也看不到你的行程。備份、同步、共享都走 iCloud；沒有網路也能編輯。':
      ('No account. We run no server and never see your trips. Backup, sync and sharing all go through iCloud — and you can edit without a connection.',
       'アカウントは不要。私たちはサーバーを持たず、あなたの予定を見ることもありません。バックアップ・同期・共有はすべて iCloud で。通信がなくても編集できます。'),
  '<p><b>隱私與資料安全優先</b>：AI 大行其道之下，資料安全與隱私更需要被重視。TripEZGo 採用不自建伺服器的設計，我們沒有自己的伺服器來保存你的旅遊資料；你的資料只會存在你的裝置上，或透過 Apple iCloud 備份與跨裝置同步，即使是多人共編旅程，也同樣透過 iCloud 共享來實現。</p>':
      ('<p><b>Privacy and data security come first.</b> With AI everywhere, keeping your data safe and private matters more than ever. TripEZGo is built without a server of its own, so we have nowhere to keep your travel data. It lives on your device, or in Apple iCloud for backup and sync across your devices. Even when several people co-edit a trip, it runs on iCloud sharing.</p>',
       '<p><b>プライバシーとデータの安全を最優先に</b>：AI が当たり前になった今、データの安全とプライバシーはこれまで以上に大切です。TripEZGo は自前のサーバーを持たない設計なので、あなたの旅行データを預かる場所は私たちの側にありません。データはあなたの端末か、Apple の iCloud（バックアップと端末間の同期）にだけ保存されます。みんなで旅程を共同編集するときも、iCloud 共有を使います。</p>'),
  '所有旅程資料，包含附件檔案、圖片，都只存在你的手機或你的 iCloud；你可以自己匯入匯出備份，或直接用 iCloud 備份同步。':
      ('Everything in your trips, files and photos included, stays on your phone or in your iCloud. Export and import backups yourself, or just let iCloud back up and sync.',
       '旅行のデータは、添付ファイルや写真も含めて、あなたの iPhone か iCloud にだけ。バックアップは自分で書き出し・読み込みもできるし、iCloud のバックアップと同期に任せることもできます。'),
  '<p><b>支援離線編輯</b>：因為所有資料都存在你的手機，即使沒有網路也能存取、編輯所有資料；有開啟 iCloud 備份同步或共享的話，會在有網路時同步。</p>':
      ("<p><b>Works offline.</b> Everything lives on your phone, so you can open and edit all of it without a connection. If iCloud backup and sync or sharing is on, your changes sync once you're back online.</p>",
       '<p><b>オフラインでも編集できる</b>：データはすべて iPhone の中にあるので、通信がなくても見ることも編集することもできます。iCloud のバックアップと同期や共有をオンにしていれば、つながったときに同期されます。</p>'),
  '資料流向示意：資料存在這台 iPhone；打開 iCloud 同步備份後，傳到你的 Apple iCloud 並同步到 iPad；再打開旅程共編，透過 iCloud 共享給三位旅伴':
      ('How your data flows: it lives on this iPhone; turn on iCloud backup and sync and it goes to your Apple iCloud and syncs to your iPad; turn on trip sharing and it reaches three companions through iCloud sharing',
       'データの流れ：データはこの iPhone に。iCloud のバックアップと同期をオンにすると、あなたの Apple iCloud に送られ、iPad とも同期。さらに旅程の共同編集をオンにすると、iCloud 共有で 3 人の旅の仲間へ'),
  '資料存在這台 iPhone，透過你的 Apple iCloud 備份同步；旅程共編也走 iCloud 共享。':
      ('Your data stays on this iPhone and is backed up and synced through your Apple iCloud. Trip sharing runs on iCloud sharing too.',
       'データはこの iPhone に保存され、あなたの Apple iCloud でバックアップと同期。旅程の共同編集も iCloud 共有で。'),
  # 01 安排行程
  '地點搜尋，也能直接貼 Google 地圖網址': ('Search for a place, or just paste a Google Maps link', '場所を検索、Google マップのリンクを貼るだけでも'),
  '起迄不同時區、全日、待排行程': ('Different start and end time zones, all-day and unscheduled events', '出発と到着で違うタイムゾーン、終日・未定の予定'),
  '行程所需要的資料我們都考慮到了！你可以在行程設定：': ("We've thought of everything an event needs. For each event you can set:", '予定に要る情報は、ひと通りそろっています。予定ごとに設定できるのは：'),
  '<li><b>地點</b>：支援地點名稱搜尋、地址搜尋，或直接貼上 Google 地圖網址或地址</li>':
      ('<li><b>Place</b>: search by name or address, or just paste a Google Maps link or an address</li>',
       '<li><b>場所</b>：名前や住所で検索。Google マップのリンクや住所をそのまま貼り付けても OK</li>'),
  '<li><b>類型／標題</b>：輸入地點時會自動帶入、推導類型</li>':
      ('<li><b>Type / title</b>: filled in as you enter a place, with the type worked out for you</li>',
       '<li><b>種類／タイトル</b>：場所を入れると自動で入り、種類も推測します</li>'),
  '<li><b>附件</b>：支援上傳圖片（從照片 App）、上傳檔案（從檔案 App）、儲存網址（例如電子車票）</li>':
      ('<li><b>Files</b>: add photos (from the Photos app), files (from the Files app), or links (an e-ticket, say)</li>',
       '<li><b>添付</b>：写真（写真アプリから）、ファイル（ファイルアプリから）、URL（電子チケットなど）を保存</li>'),
  '<li><b>時間</b>：支援起迄不同時區（例如台北起飛、沖繩落地）、全日行程（例如住宿飯店）、待排行程（時間未定）</li>':
      ('<li><b>Time</b>: different start and end time zones (take off in Taipei, land in Okinawa), all-day events (a hotel stay), and unscheduled events (no time set yet)</li>',
       '<li><b>時間</b>：出発と到着で違うタイムゾーン（台北で離陸、沖縄に着陸など）、終日の予定（ホテルの宿泊など）、未定の予定（時間がまだ決まっていないもの）</li>'),
  '<li><b>待辦事項</b>：例如記得訂位</li>': ('<li><b>To-dos</b>: “remember to book a table,” for example</li>', '<li><b>やること</b>：「忘れずに予約」など</li>'),
  '行程建立後支援「取消」（保留但顯示刪除線）、「刪除」（完全移除）、「延後／提前」（這個行程跟後面的行程一起延後或提前 X 小時 Y 分鐘）。':
      ('Once an event is in, you can cancel it (it stays, struck through), delete it (gone for good), or move it later or earlier — it and every event after it shift by X hours and Y minutes.',
       '作った予定は「キャンセル」（残したまま取り消し線を表示）、「削除」（完全に消す）、「後ろへ／前へずらす」（この予定とそれ以降の予定をまとめて X 時間 Y 分ずらす）ができます。'),
  '行程詳情：桃園機場報到，待辦清單與附件——網頁連結、PDF 電子登機證與護照照片':
      ('Event details: check-in at Taoyuan Airport, with a to-do list and files — a web link, a PDF boarding pass and a passport photo',
       '予定の詳細：桃園空港でのチェックイン。やることリストと添付（Web リンク、PDF の電子搭乗券、パスポートの写真）'),
  # 02 路程
  '02 · 路程': ('02 · Legs', '02 · 移動'),
  '錯過這班車，': ('Miss this train?', '乗り遅れても、'),
  '下一班已經排好': ('The next one is already lined up', '次の便はもう用意済み'),
  '兩個行程之間就是一段路程，時間不夠會先提醒你。': ("Between two events there's a leg — and if there isn't enough time, you'll hear about it first.",
                                              '予定と予定のあいだには移動があります。時間が足りなければ先にお知らせ。'),
  '步行、開車、大眾運輸，自動估算時間': ('Walking, driving or transit, with the time estimated for you', '徒歩・車・公共交通。所要時間は自動で計算'),
  '路程比空檔還久，先跳警告': ('A warning when the leg takes longer than the gap', '移動が空き時間より長ければ、先に警告'),
  '多組班次，旅途中提醒最接近的那一班': ('Several departures, with a reminder for the nearest one on the day', '便をいくつも登録、旅先ではいちばん近い便をお知らせ'),
  '兩個行程之間都可以設定一段路程，路程就是交通方式，可以設定步行、開車、大眾運輸，不同的交通方式會算出兩點之間的預估時間；如果兩個行程的間隔比路程花的時間還短，會出現警告（例如兩個行程只隔 30 分鐘，但開車實際要 1 小時）。':
      ('You can set a leg between any two events. A leg is how you get there — walking, driving or transit — and each gives you an estimated travel time between the two places. If the gap between the events is shorter than the leg, you get a warning (say they are 30 minutes apart, but the drive actually takes an hour).',
       '予定と予定のあいだには、移動を設定できます。移動とは交通手段のこと。徒歩・車・公共交通から選ぶと、2 地点間の所要時間の目安が出ます。予定の間隔が移動にかかる時間より短いときは警告が出ます（たとえば予定の間が 30 分しかないのに、車で実際は 1 時間かかる場合）。'),
  '特別優化的是大眾運輸：可以預先輸入多筆班次，旅途中會依照最接近現在的班次提醒你；提早到了或是錯過了，都能當機立斷，馬上跳到下一班火車或公車。':
      ("Transit gets special care. Enter several departures ahead of time, and on the day you're reminded of the one closest to now. Early, or just missed it? Decide on the spot and jump straight to the next train or bus.",
       '特に力を入れたのが公共交通です。便を前もって何本か登録しておけば、旅先ではいまにいちばん近い便をお知らせ。早く着いても、乗り遅れても、その場で次の電車やバスに切り替えられます。'),
  # 03 行事曆／時間軸
  '03 · 行事曆／時間軸': ('03 · Calendar / Timeline', '03 · カレンダー／タイムライン'),
  '一拖一拉就能安排、調整行程': ('Drag to plan and rearrange events', 'ドラッグするだけで予定を組んだり動かしたり'),
  '<p><b>行事曆模式</b>：你的行程就是一個行事曆事件，除了瀏覽直覺，安排行程時也最好用——一拖一拉就能排好行程，要改也只要拖曳就能換位置；規劃階段還不確定誰先誰後的行程，可以很快地調整。</p>':
      ("<p><b>Calendar view</b>: every event sits on a calendar, just like an appointment. It's easy to read, and it's the easiest way to plan — drag to place an event, drag again to move it. Still not sure what comes first? Rearranging takes seconds.</p>",
       '<p><b>カレンダー表示</b>：予定はそのままカレンダーの予定として並びます。見やすいだけでなく、組み立てるときにもいちばん便利。ドラッグで置いて、変えたいときもドラッグで動かすだけ。順番がまだ決まらない予定も、さっと入れ替えられます。</p>'),
  '<p><b>時間軸模式</b>：如果你習慣用時間軸看行程，也可以切換過去。今天幾點幾分要去哪？停留多久？路程多久？一目瞭然。</p>':
      ("<p><b>Timeline view</b>: if you'd rather read your day as a timeline, switch over. Where to be and when, how long to stay, how long to get there — all at a glance.</p>",
       '<p><b>タイムライン表示</b>：タイムラインで見るほうがしっくりくるなら、切り替えもできます。何時何分にどこへ行くか、どれだけいるか、移動にどれだけかかるかがひと目でわかります。</p>'),
  # 04 總覽
  '整趟行程按日分組': ('The whole trip, grouped by day', '旅行全体を日ごとに'),
  '每一天的附件集中在一起': ("Each day's files in one place", 'その日の添付をひとまとめに'),
  '哪一天、哪個行程還有待辦，一看就知道': ('See at a glance which day, and which event, still has to-dos', 'どの日のどの予定にやることが残っているか、ひと目でわかる'),
  '總覽模式讓你一頁掌握整趟行程安排；除此之外，這裡也會依照每一天分組整理行程的附件與待辦事項，在這邊就能快速打開每個行程的附件，或是知道哪一天的哪一個行程還有待辦。':
      ("Overview puts the whole trip on one page. It also gathers every event's files and to-dos, grouped by day — so you can open any event's files right here, or see which event on which day still has to-dos.",
       '概要では、旅行全体の予定を1ページで見渡せます。予定の添付ややることも日ごとにまとめてあるので、ここから各予定の添付をすぐ開いたり、どの日のどの予定にやることが残っているかを確かめたりできます。'),
  # 05 地圖
  '05 · 地圖模式': ('05 · Map', '05 · マップ'),
  '你每天安排的行程，只要設定好地點，就能在地圖上快速掌握行程彼此之間的位置關係與路線。':
      ("Give your events a place, and the map shows how each day's events sit in relation to one another, and the route between them.",
       '予定に場所を設定しておけば、1日の予定どうしの位置関係とルートが、マップでさっとつかめます。'),
  '除了行程的標記，也能新增想去的地點標記，方便旅途中隨時看看附近還有哪些景點；另外還內建多家超商、百貨圖資，附近有沒有超商百貨，一打開就知道。':
      ("Besides your events, you can drop markers on places you'd like to go, so on the road you can always check what else is nearby. Convenience stores and department stores from several chains are built in too — open the map and you'll see if one is close.",
       '予定のほかに、行きたい場所にもマーカーを置けるので、旅先で近くに何があるかをいつでも見返せます。コンビニや百貨店のデータもいくつも内蔵。近くにあるかどうかは、開けばすぐわかります。'),
  '支援步行導航：附近看到一個想去的景點、不知道怎麼走？直接點開始導航就知道。':
      ('Walking directions, too: spotted somewhere nearby but not sure how to get there? Tap to start navigating and just follow along.',
       '徒歩ナビにも対応：近くに行ってみたい場所を見つけたけれど、行き方がわからない？ナビを開始すればすぐわかります。'),
  '打開地圖的預設畫面：今天的行程依序編號、連成路線，旁邊是自訂標記與附近的超商':
      ("The map as it opens: today's events numbered in order and joined into a route, with your own markers and nearby convenience stores alongside",
       'マップを開いたときの画面：今日の予定が番号順にルートでつながり、そばに自分のマーカーと近くのコンビニ'),
  '地圖：第 2 天，正在步行導航到原爆圓頂，沿途標出超商與旅伴的位置':
      ('Map: day 2, with walking directions under way to the Atomic Bomb Dome and convenience stores and companions marked along the route',
       'マップ：2日目、原爆ドームへ徒歩ナビ中。道沿いにコンビニと旅の仲間の位置'),
  # 06 旅伴共編、位置共享
  '06 · 旅伴共編、位置共享': ('06 · Co-editing and location sharing', '06 · 共同編集・位置の共有'),
  '邀請旅伴一起安排同一趟': ('Invite companions to plan the same trip with you', '旅の仲間を招待して、同じ旅行を一緒に組む'),
  '旅途中互相看到位置': ("See each other's location on the road", '旅先でお互いの位置がわかる'),
  '筆記、附件、待辦、待購清單可以選擇要不要共享': ('Choose whether notes, files, to-dos and the shopping list are shared', 'メモ・添付・やること・買い物リストは、共有するかどうかを選べる'),
  '支援旅程共享共編，讓旅伴們一起完成這趟旅程；旅途進行中，旅伴可以開啟位置共享，互相照顧彼此安全，走散了也找得到彼此。':
      ("Share a trip and co-edit it, so your companions build it with you. Once you're on the road, companions can turn on location sharing to look out for each other — and find each other if you get separated.",
       '旅程を共有して共同編集すれば、旅の仲間と一緒に旅行を作れます。旅の途中は位置の共有をオンにすれば、お互いの安全を見守れて、はぐれても見つけられます。'),
  '筆記、附件、待辦事項、待購清單，都可以設定要不要共編共享。': ('Notes, files, to-dos and the shopping list can each be shared for co-editing, or kept to yourself.',
                                                 'メモ・添付・やること・買い物リストは、それぞれ共有して共同編集するかどうかを設定できます。'),
  '位置共享：旅伴的位置出現在地圖上，灰色的是超過一小時沒更新': ("Location sharing: companions on the map; the gray ones haven't updated in over an hour",
                                                  '位置の共有：旅の仲間の位置がマップに表示され、グレーは 1 時間以上更新がない人'),
  # 不用打開 App
  '即時動態：鎖定畫面與動態島，隨時看進行中的行程': ('Live Activity: the current event on the Lock Screen and in the Dynamic Island, anytime',
                                            'ライブアクティビティ：ロック画面とダイナミックアイランドで、進行中の予定をいつでも'),
  '推播：出發前、行程開始前、還有待辦時提醒你': ('Notifications: before you set off, before an event starts, and while to-dos are still open',
                                         '通知：出発前、予定の開始前、やることが残っているときにお知らせ'),
  'Widget：主畫面、鎖定畫面放今天的行程，待辦直接打勾': ("Widgets: today's events on your Home Screen and Lock Screen, with to-dos you can tick off right there",
                                                'ウィジェット：ホーム画面とロック画面に今日の予定。やることはその場でチェック'),
  '支援豐富的 Widget，你可以把需要的資訊直接放到主畫面或鎖定畫面，快速查看、存取。':
      ('A wide range of widgets puts what you need right on your Home Screen or Lock Screen, ready to check and open.',
       '豊富なウィジェットで、必要な情報をホーム画面やロック画面に置いて、すぐに確認・アクセスできます。'),
  '旅程進行中的即時動態，讓你不用解鎖手機，拿出來瞄一眼就知道目前行程的停留時間、路程資訊與下一個行程。':
      ("While a trip is under way, the Live Activity means you don't even have to unlock your phone: one glance tells you how long you have at the current event, how you're getting to the next one, and what it is.",
       '旅行中はライブアクティビティのおかげで、iPhone のロックを解除しなくても、ちらっと見るだけで今の予定の滞在時間、移動の情報、次の予定がわかります。'),
  '旅程開始前、行程開始前、還有待辦事項時，都會推播通知你。': ("You'll get a notification before a trip begins, before each event starts, and while to-dos are still open.",
                                                '旅行の開始前、予定の開始前、やることが残っているときに、通知でお知らせします。'),
  '鎖定畫面：即時動態顯示嚴島神社進行中、剩餘時間與下一站，底下疊著 TripEZGo 的推播通知':
      ('Lock Screen: the Live Activity shows Itsukushima Shrine under way, the time left and the next stop, with TripEZGo notifications stacked below',
       'ロック画面：ライブアクティビティに厳島神社が進行中、残り時間と次の行き先。その下に TripEZGo の通知'),
  # 小工具
  '內建豐富的旅途小工具，一個 App 搞定所有事。': ('Plenty of travel tools built in — one app for all of it.', '旅に役立つツールを内蔵。アプリひとつで全部まかなえます。'),
  '圖文都能記，不會當地語言也能唸給你聽': ("Text and photos — and it reads phrases aloud when you don't speak the language", '写真も文字も。現地の言葉が話せなくても読み上げてくれる'),
  '一開一掃留下紀錄，旅伴也看得到': ("Open, scan, and it's saved — your companions see it too", '開いて読み取れば履歴に残り、旅の仲間も見られる'),
  '使用當日匯率，沒網路也能算': ("Uses today's rate, and works offline", 'その日のレートで、通信がなくても計算'),
  '還有什麼沒買一看就知，比價買最便宜': ("See what's left to buy, and compare prices to get the cheapest", 'まだ買っていないものがひと目でわかり、値段を比べていちばん安く'),
  '<li><b>筆記</b>：支援豐富的圖文編輯，還特別支援朗讀，不會當地語言也可以直接唸給對方聽。</li>':
      ("<li><b>Notes</b>: rich text-and-photo editing, plus read-aloud — don't speak the language? Let your phone say it for you.</li>",
       '<li><b>メモ</b>：写真も文字も自由に編集でき、読み上げにも対応。現地の言葉が話せなくても、そのまま相手に聞かせられます。</li>'),
  '<li><b>匯率換算</b>：使用當日匯率，沒網路也能換算。</li>':
      ("<li><b>Currency</b>: uses today's rate, and converts even without a connection.</li>",
       '<li><b>為替換算</b>：その日のレートで、通信がなくても換算できます。</li>'),
  '<li><b>待購清單</b>：想買什麼都記在這裡，還有什麼沒買一看就知道；也可以記下各家價格，讓你買到最便宜的。</li>':
      ("<li><b>Shopping list</b>: write down everything you want to buy and see at a glance what's still left. Note each shop's price too, so you get the cheapest one.</li>",
       '<li><b>買い物リスト</b>：買いたいものをここにまとめておけば、まだ買っていないものがひと目でわかります。お店ごとの値段も記録できるので、いちばん安いところで買えます。</li>'),
  '<li><b>QR Code 掃描</b>：一開一掃並留下紀錄，旅伴也能直接看到。</li>':
      ("<li><b>QR code scanner</b>: open it, scan, and it's saved to a history your companions can see too.</li>",
       '<li><b>QR コードスキャン</b>：開いて読み取るだけで履歴に残り、旅の仲間もそのまま見られます。</li>'),
  # 整合
  '整合': ('Integrations', '連携'),
  '跟 iPhone 上的其他 App，': ('Works with the other apps', 'iPhone のほかのアプリと、'),
  '接在一起': ('on your iPhone', 'つながる'),
  '從其他 App 分享進來': ('Share in from other apps', 'ほかのアプリから共有'),
  'Google 地圖、Instagram、Threads 看到的地方，分享一下就存進來': ("Found a place in Google Maps, Instagram or Threads? Share it and it's saved",
                                                       'Google マップや Instagram、Threads で見つけた場所を、共有するだけで保存'),
  '分享進來：在社群 App 的貼文按分享，選 TripEZGo，就存成筆記': ("Sharing in: tap Share on a post in a social app, pick TripEZGo, and it's saved as a note",
                                                   '共有で取り込み：SNS アプリの投稿で共有をタップして TripEZGo を選ぶと、メモとして保存'),
  '行程直接同步到你的行事曆': ('Your events sync straight to your calendar', '予定をそのままカレンダーに同期'),
  'Apple 行事曆的單日檢視：TripEZGo 同步進去的第 2 天行程': ("Apple Calendar's day view: day 2's events, synced in from TripEZGo",
                                                  'Apple カレンダーの日表示：TripEZGo から同期された2日目の予定'),
  # 「、」不在 CJK 範圍，腳本抓不到，要自己列
  'Siri、Apple Intelligence': ('Siri and Apple Intelligence', 'Siri・Apple Intelligence'),
  # Siri 問句與 screens/siri.html 一致
  '問一句「下一個行程是什麼」，不用打開 App 就有答案': ("Ask “What's my next event?” and get the answer without opening the app",
                                           '「次の予定は何？」と聞くだけで、アプリを開かなくても答えがわかる'),
  '問 Siri「下一個行程是什麼」：現在是嚴島神社，接下來是紅葉谷公園，11:30 開始':
      ("Asking Siri “What's my next event?”: Itsukushima Shrine now, then Momijidani Park at 11:30",
       'Siri に「次の予定は何？」：今は厳島神社、次は紅葉谷公園で 11:30 から'),
  '<p><b>從其他 App 分享進來</b>：看到想去的地方？同事推薦的景點？直接在 Google 地圖、Instagram、Threads 等 App 裡點分享、選 TripEZGo，就能把資料存進來。</p>':
      ("<p><b>Share in from other apps</b>: found somewhere you want to go, or a spot a coworker recommended? Tap Share in Google Maps, Instagram, Threads or another app, pick TripEZGo, and it's saved.</p>",
       '<p><b>ほかのアプリから共有</b>：行きたい場所を見つけた？同僚のおすすめスポット？Google マップや Instagram、Threads などのアプリで共有をタップして TripEZGo を選べば、そのまま保存できます。</p>'),
  '<p><b>Apple／Google 行事曆整合</b>：可以把行程直接同步到你的行事曆上。</p>':
      ('<p><b>Apple / Google Calendar integration</b>: sync your events straight to your calendar.</p>',
       '<p><b>Apple／Google カレンダー連携</b>：予定をそのままカレンダーに同期できます。</p>'),
  '<p><b>Siri、Apple Intelligence</b>：可以直接問 Siri、Apple Intelligence 行程安排，快速存取行程。</p>':
      ('<p><b>Siri and Apple Intelligence</b>: ask Siri or Apple Intelligence about your plans and get to your events fast.</p>',
       '<p><b>Siri・Apple Intelligence</b>：Siri や Apple Intelligence に予定を聞いて、すばやく確認できます。</p>'),
  '<p><b>公開分享</b>：支援把旅程公開分享給所有人，方便你跟全世界的旅行者分享你的行程安排。公開分享只會分享行程標題、地點、時間安排，不會公開行程描述、附件與待辦清單。</p>':
      ('<p><b>Public sharing</b>: make a trip public so travelers anywhere can see your plan. Only event titles, places and times are shared — never descriptions, files or to-do lists.</p>',
       '<p><b>公開共有</b>：旅程を誰でも見られるように公開して、世界中の旅行者とプランを共有できます。公開されるのは予定のタイトル・場所・時間だけ。予定のメモ・添付・やることリストは公開されません。</p>'),
  # AI
  '手機與電腦在同一個 Wi-Fi 底下時，可以直接用 MCP 連接 TripEZGo App，請 AI Agent 幫你把旅程安排好。':
      ('When your phone and computer are on the same Wi-Fi, connect your AI agent to the TripEZGo app over MCP and have it plan the trip for you.',
       'iPhone とパソコンが同じ Wi-Fi につながっていれば、MCP で TripEZGo アプリに接続して、AI エージェントに旅程を組んでもらえます。'),
  # 方案
  '免費就能用，付費更好用。': ('Free to use, better with Premium.', '無料でしっかり使えて、有料ならもっと便利に。'),
  'Widget、Siri': ('Widgets, Siri', 'ウィジェット・Siri'),
  '為什麼要收費': ('Why charge at all?', 'なぜ有料なのか'),
  '定價是我最苦惱的一件事：這個工具的出發點，是希望真的能幫到自由行的旅行者；但現實上也必須要有收費，才能走得更遠。':
      ('Pricing was the thing I agonized over most. I built this to genuinely help people who travel on their own — but realistically, it has to earn something to keep going.',
       '値段をどうするかは、いちばん悩んだところです。もともと個人旅行をする人の役に本当に立ちたくて作ったツールですが、続けていくには、やはり収益も必要です。'),
  '目前的成本：每月 200 美元的 AI 費用、每年 99 美元的 Apple Developer Program，加上每週約 30 小時的個人開發時間。':
      ('What it costs right now: US$200 a month for AI, US$99 a year for the Apple Developer Program, plus about 30 hours a week of my own time building it.',
       '今かかっているコスト：AI に月 200 ドル、Apple Developer Program に年 99 ドル、それに週およそ 30 時間の個人開発の時間。'),
  '所以 TripEZGo 還是以「免費就能用、付費更好用」為出發點，免費版與 Premium 只有這幾項差異：無廣告、旅程數（免費版同時保留 3 趟，超過要先刪掉舊的）、每趟旅伴（免費版 3 位）、即時動態、Apple／Google 行事曆整合。Premium 提供週訂閱、月訂閱、年訂閱與終身買斷。':
      ('So TripEZGo starts from “free to use, better with Premium.” Free and Premium differ in just these ways: no ads, the number of trips (Free keeps 3 at a time — delete an old one to make room), companions per trip (3 on Free), Live Activity, and Apple / Google Calendar integration. Premium comes as a weekly, monthly or yearly subscription, or a lifetime purchase.',
       'だから TripEZGo は「無料でしっかり使えて、有料ならもっと便利に」が基本です。無料版と Premium の違いはこれだけ：広告なし、旅行の数（無料版は同時に 3 件まで。超えたら古い旅行を先に削除）、旅行ごとの旅の仲間（無料版は 3 人）、ライブアクティビティ、Apple／Google カレンダー連携。Premium には週・月・年のサブスクリプションと、買い切りがあります。'),
  # 開發背景
  '開發背景': ('Behind the app', '開発の背景'),
  '一個常常獨旅的 iOS 工程師，為什麼自己做了一個旅遊規劃 App': ('Why an iOS engineer who often travels solo built his own trip planner',
                                                   'ひとり旅の多い iOS エンジニアが、旅行プランナーを自分で作った理由'),
  '展開故事': ('Read the story', 'ストーリーを読む'),
  '背景': ('How it started', 'はじまり'),
  '<p>之前自由行都有給力的旅伴，我主要當 P 人；2023 年 9 月人生第一次獨旅去「<a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">名古屋一日快閃</a>」之後，獨旅的開關就被打開了，就像大家說的，只有 0 次跟無數次。</p>':
      ('<p>On past trips I always had great companions who did the planning, and I mostly went with the flow. Then in September 2023 I took my first-ever solo trip — <a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">a one-day dash to Nagoya</a> — and something switched on. Like people say: you either never do it, or you never stop.</p>',
       '<p>これまでの個人旅行には頼れる旅の仲間がいて、私はほぼ計画におまかせの P タイプでした。それが 2023 年 9 月、人生初のひとり旅で「<a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">名古屋日帰り弾丸旅</a>」に行ってから、ひとり旅のスイッチが入ってしまいました。よく言うとおり、0 回か、何度もか、のどちらかなんです。</p>'),
  '<p>中間又去了好幾趟：「<a href="https://zhgchg.li/posts/d78e0b15a08a/" target="_blank" rel="noopener">九州 10 日獨旅</a>」、「<a href="https://zhgchg.li/posts/31b9b3a63abc/" target="_blank" rel="noopener">山陽地區廣島岡山 6 日獨旅</a>」、「<a href="https://zhgchg.li/posts/aacd5f5cacd1/" target="_blank" rel="noopener">山陰地區島根鳥取＋姬路神戶 7 日獨旅</a>」、中部地區名古屋伊勢三重 10 日獨旅……等等。</p>':
      ("<p>Plenty more followed: <a href=\"https://zhgchg.li/posts/d78e0b15a08a/\" target=\"_blank\" rel=\"noopener\">10 days solo in Kyushu</a>, <a href=\"https://zhgchg.li/posts/31b9b3a63abc/\" target=\"_blank\" rel=\"noopener\">6 days solo in Hiroshima and Okayama</a>, <a href=\"https://zhgchg.li/posts/aacd5f5cacd1/\" target=\"_blank\" rel=\"noopener\">7 days solo through Shimane, Tottori, Himeji and Kobe</a>, 10 days solo around Nagoya, Ise and Mie… and so on.</p>",
       '<p>その後も何度も出かけました。「<a href="https://zhgchg.li/posts/d78e0b15a08a/" target="_blank" rel="noopener">九州 10 日間ひとり旅</a>」「<a href="https://zhgchg.li/posts/31b9b3a63abc/" target="_blank" rel="noopener">山陽・広島岡山 6 日間ひとり旅</a>」「<a href="https://zhgchg.li/posts/aacd5f5cacd1/" target="_blank" rel="noopener">山陰・島根鳥取＋姫路神戸 7 日間ひとり旅</a>」、中部・名古屋伊勢三重 10 日間ひとり旅……などなど。</p>'),
  '<p>不管是出發前的行程安排，還是旅行當中的掌控，自由行、獨旅一切都要靠自己；需要一個工具能記錄和追蹤這些事。我試過很多種方式，沒有一個完美符合我的需求——<b>AI 當道，加上本身就是 iOS 開發者，想一想，為什麼不自己做一款？</b></p>':
      ("<p>Planning before you leave, keeping on top of things once you're there — when you travel on your own, and especially solo, it's all on you. I needed a tool to keep track of all of it. I tried plenty of approaches, and none fit quite right. <b>With AI everywhere, and being an iOS developer myself, I thought: why not build one?</b></p>",
       '<p>出発前の計画も、旅行中の段取りも、個人旅行やひとり旅ではすべて自分次第。それを記録して追いかけられる道具が必要でした。いろいろ試しましたが、ぴったり合うものはひとつもありませんでした。<b>AI の時代だし、自分は iOS エンジニア。だったら自分で作ればいいじゃないか、と。</b></p>'),
  'Apple 備忘錄／Obsidian／Notion／Google 文件': ('Apple Notes / Obsidian / Notion / Google Docs', 'Apple メモ／Obsidian／Notion／Google ドキュメント'),
  'Apple 備忘錄裡的山陰關西行：每一天一則筆記，貼著地圖截圖、班次與轉乘時間':
      ("A San'in and Kansai trip in Apple Notes: one note per day, with map screenshots, departures and transfer times pasted in",
       'Apple メモの山陰・関西旅行：1日ごとに1つのメモ。地図のスクリーンショット、便と乗り換え時間を貼り付け'),
  '這是我最一開始旅行用的規劃工具，優點是簡單好用，一打開就是富文本編輯器，可以隨意插入行程標題、圖片、附加檔案。':
      ("This is what I first planned trips with. The upside is that it's simple: open it and you're in a rich text editor, free to drop in event titles, images and attachments however you like.",
       '最初に旅行の計画に使っていたのがこれです。良いところはシンプルで使いやすいこと。開けばすぐリッチテキストエディタで、予定のタイトルや画像、ファイルを自由に入れられます。'),
  '缺點也是「隨意」這件事：沒有固定的格式，很難一眼看出整趟旅程的安排；行程一長，滾動找資料很痛苦；旅行進行中也沒辦法快速定位到目前的行程；行程如果有異動更是麻煩。另外也不支援通知、行事曆、行程地圖、Widget 等功能。':
      ("The downside is that same freedom. There's no fixed format, so it's hard to see the whole trip at a glance. Once the plan gets long, scrolling to find things is painful; on the road there's no quick way to jump to where you are now; and when plans change, it's a real hassle. And there are no notifications, calendar, trip map or widgets.",
       '悪いところも、その「自由さ」です。決まった形がないので、旅行全体の流れがひと目でつかみにくい。予定が長くなるとスクロールして探すのがつらく、旅行中も今の予定にすぐ飛べません。予定が変わったときはなおさら面倒です。通知やカレンダー、予定のマップ、ウィジェットにも対応していません。'),
  '體驗上，我覺得在搜集景點或排大綱的階段蠻好用的，可以快速把大致的行程記下來；但在細節安排、或是旅程進行中查看，就不太方便。':
      ("In practice, I found it great for collecting places and sketching an outline — you can get a rough plan down fast. But for working out the details, or checking things mid-trip, it's not very handy.",
       '使ってみた感想としては、行きたい場所を集めたり大まかな流れを組んだりする段階ではとても便利で、ざっくりした予定をすばやく書き留められます。でも細かい段取りや、旅行中に見返すとなると、あまり使い勝手がよくありません。'),
  'Apple 行事曆／Google 日曆': ('Apple Calendar / Google Calendar', 'Apple カレンダー／Google カレンダー'),
  'Apple 行事曆的週檢視：沖繩自由行每天的行程與交通排成一格一格的事件':
      ("Apple Calendar's week view: each day of an Okinawa trip, with plans and travel laid out as blocks of events",
       'Apple カレンダーの週表示：沖縄旅行の毎日の予定と移動が、ひとつずつの予定として並ぶ'),
  '<p>最近一次去「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖繩自由行</a>」，我們是用 Apple／Google 行事曆排行程。優點是規劃起來非常方便，一拖一拉一放就能建立行程，要改時間也是拖一下就好；整趟旅程一目瞭然，哪裡有空檔、哪裡待太久都能馬上知道；旅行進行中也能設定通知，馬上知道這個行程預計待多久、下一個行程是什麼，要臨時調整也很容易；也支援通知、Widget。</p>':
      ("<p>On my most recent trip, <a href=\"https://zhgchg.li/posts/2cbc121a1b7c/\" target=\"_blank\" rel=\"noopener\">Okinawa on our own</a>, we planned everything in Apple / Google Calendar. Planning is really easy: drag, drop, and the event's there; changing a time is just another drag. You can see the whole trip at a glance — where the gaps are, where you're staying too long. On the road you can set alerts, so you know right away how long you've got here and what's next, and last-minute changes are easy. Notifications and widgets work too.</p>",
       '<p>最近の「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖縄の個人旅行</a>」では、Apple／Google カレンダーで予定を組みました。良いところは計画がとても楽なこと。ドラッグして置くだけで予定ができ、時間を変えるのもドラッグひとつ。旅行全体がひと目でわかり、どこに空き時間があるか、どこで長居しすぎかもすぐわかります。旅行中も通知を設定すれば、この予定にどれだけいるか、次は何かがすぐわかり、急な変更も簡単。通知やウィジェットにも対応しています。</p>'),
  '缺點是資料分散：沒有一個總覽可以查看待辦、附件或筆記，也沒有地圖檢視。畢竟行事曆工具專注的是「事件」本身，事件彼此之間是獨立的；但旅程安排上有些資訊是跨行程的，例如車票、伴手禮清單、筆記，或是我跑完 A 行程後時間還很多，想知道其他天有哪些行程是順路的、可以改成今天去。':
      ("The downside is that things end up scattered. There's no overview of your to-dos, files or notes, and no map view. A calendar is all about the event itself, and each event stands on its own. But some trip information cuts across events: train tickets, a souvenir list, notes. Or say I finish event A with plenty of time left — I want to know which events on other days are on the way and could move to today.",
       '悪いところは、情報がばらばらになること。やることや添付、メモを見渡せる概要も、マップ表示もありません。カレンダーはあくまで一つひとつの「予定」が主役で、予定どうしは独立しています。でも旅の計画には、予定をまたぐ情報もあります。たとえば切符、おみやげリスト、メモ。あるいは A の予定を終えてまだ時間がたっぷりあるとき、ほかの日の予定で通り道にあって今日に回せるものはどれか、知りたくなります。'),
  '其他旅行規劃 App': ('Other trip-planning apps', 'ほかの旅行プランニングアプリ'),
  '也試了幾個電商集團做的旅行規劃 App，各有亮眼的功能，例如總覽看行程、直接用地點新增行程、自動安排時間、地圖功能；但體驗上我覺得都更偏向社交和電商服務，畢竟對公司來說，產品是要能變現的。':
      ("I also tried a few trip planners from big e-commerce groups. Each had standout features — an overview of your plans, adding events straight from a place, automatic scheduling, maps. But in use, they all felt geared more toward social and shopping. Fair enough: for a company, a product has to make money.",
       'EC 大手が作った旅行プランニングアプリもいくつか試しました。予定を一覧できる概要、場所からそのまま予定を追加、時間の自動割り振り、マップ機能など、それぞれ光る機能はありました。でも使ってみると、どれも SNS や EC のサービス寄りに感じました。会社にとって、プロダクトは収益化できなければならないので、当然ではあります。'),
  '所以就有了 TripEZGo——旅行規劃、旅途所需一次搞定。': ("And so there's TripEZGo — plan the trip, carry what it needs, all in one app.",
                                              'そうして生まれたのが TripEZGo。旅の計画も、旅先で要るものも、これひとつで。'),
}

HEAD = {
    'en': dict(title='TripEZGo — Plan the trip, carry what it needs, all in one app',
               desc="TripEZGo is a trip planner for iPhone and iPad. Events on a calendar and a timeline, with tickets, files and to-dos attached; a map of each day's route and Japan's convenience stores and department stores; co-edit with companions and share your location on the road; your next stop on the Lock Screen. Your data stays on your device and in your own iCloud."),
    'ja': dict(title='TripEZGo — 旅の計画も、旅先で要るものも、これひとつで',
               desc='TripEZGo は iPhone・iPad の旅行プランナー。予定はカレンダーとタイムラインに、チケット・添付・やることは予定に。マップで1日のルートと日本のコンビニ・百貨店をチェックし、旅の仲間と共同編集、旅先では現在地を共有。次の行き先はロック画面に。データはあなたの端末と iCloud だけに。'),
}

def build(lang):
    i = 0 if lang == 'en' else 1
    old = open(os.path.join(ROOT, lang, 'index.html'), encoding='utf-8').read()
    head = old[:old.index('<link rel="stylesheet"')]
    h = HEAD[lang]
    head = re.sub(r'<title>[^<]*</title>', f'<title>{h["title"]}</title>', head)
    for attr in ('name="description"', 'property="og:description"'):
        head = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{h["desc"]}">', head)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{h["title"]}">', head)
    # 樣式表與 home.js 這幾行照母版帶過來（home.js 負責把截圖換成互動畫面，少了它英日頁只剩靜態圖）
    head += SRC[SRC.index('<link rel="stylesheet"'):SRC.index('<script type="application/ld+json">')]
    jsonld = old[old.index('<script type="application/ld+json">'):]
    jsonld = jsonld[:jsonld.index('</script>') + 9]
    jsonld = re.sub(r'"description": "[^"]*"', '"description": ' + json.dumps(h['desc'], ensure_ascii=False), jsonld)

    body = SRC[SRC.index('<body>'):SRC.index('</body>')]
    body = re.sub(r'<!--.*?-->\n?', '', body, flags=re.S)  # 註解是繁中的設計說明，英日頁不帶
    missing = set()
    # 含 HTML 的對照（展開介紹、開發故事裡整段的 <p>／<li>）先整段換成佔位符：
    # 段落裡有 <b>、<a>，拆成碎片逐句翻會不自然；佔位符也讓日文譯文裡的漢字不會再被當成沒對到的中文。
    # 母版那一段只要改了一個字，整段就對不到，碎片會被下面的檢查抓出來，腳本照樣失敗。
    held = []
    for k, v in T.items():
        if '<' in k and k in body:
            used.add(k); held.append(v[i])
            body = body.replace(k, f'\x00{len(held) - 1}\x00')
    def tr(t):
        if t in T: used.add(t); return T[t][i]
        if re.search(r'[一-鿿]', t): missing.add(t)
        return t
    def text(m):
        raw = m.group(1); t = raw.strip()
        return '>' + raw.replace(t, tr(t)) + '<' if t else m.group(0)
    body = re.sub(r'>([^<>]+)<', text, body)
    body = re.sub(r'(alt|aria-label|title)="([^"]+)"', lambda m: f'{m.group(1)}="{tr(m.group(2))}"', body)
    body = re.sub(r'\x00(\d+)\x00', lambda m: held[int(m.group(1))], body)
    if lang == 'en':
        # 中文標題的片段之間不需要空白，英文要：nb 片段、<em> 前面補一個
        body = re.sub(r'(?<=[^\s>])(<span class="nb">|<em>)', r' \1', body)
        body = body.replace('</span><span class="nb">', '</span> <span class="nb">')
    # 連結與語言切換
    body = body.replace('/assets/img/shots/v2/zh/', f'/assets/img/shots/v2/{lang}/')
    body = body.replace('href="/privacy.html"', f'href="/{lang}/privacy.html"').replace('href="/terms.html"', f'href="/{lang}/terms.html"')
    body = body.replace('class="brand" href="/"', f'class="brand" href="/{lang}/"')
    for pid, urls in POSTS.items():
        body = body.replace(f'https://zhgchg.li/posts/{pid}/', urls[0 if lang == 'en' else 1])
    # 頁首的語言下拉：上面顯示這一頁的語言，選單裡放另外兩種
    zh_link = '<a class="lang" href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>'
    en_link = '<a class="lang" href="/en/" hreflang="en" lang="en">English</a>'
    ja_link = '<a class="lang" href="/ja/" hreflang="ja" lang="ja">日本語</a>'
    assert '<summary>繁體中文</summary>' in body and en_link in body and ja_link in body, '母版頁首的語言下拉變了，這裡要跟著改'
    if lang == 'en':
        body = body.replace('<summary>繁體中文</summary>', '<summary>English</summary>', 1)
        body = body.replace(en_link, zh_link, 1)
        body = body.replace('<a href="/en/" hreflang="en" lang="en">English</a>', '<a href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>')
    else:
        body = body.replace('<summary>繁體中文</summary>', '<summary>日本語</summary>', 1)
        body = body.replace(ja_link, en_link, 1)
        body = body.replace(en_link, zh_link, 1)
        body = body.replace('<a href="/ja/" hreflang="ja" lang="ja">日本語</a>', '<a href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>')
    # 語言名稱本身要留原文（中文／繁體中文／日本語），上面替換後再檢查一次
    missing -= {'中文', '繁體中文', '日本語'}
    if missing:
        sys.exit(f'{lang}: 沒有對照的中文字串：\n' + '\n'.join(sorted(missing)))
    out = head + jsonld + '\n</head>\n' + body + '</body>\n</html>\n'
    open(os.path.join(ROOT, lang, 'index.html'), 'w', encoding='utf-8').write(out)
    print('wrote', lang)

used = set()
for l in ('en', 'ja'):
    build(l)
# 母版已經拿掉的字串留在表裡只會誤導下一個改的人：列出來，回頭刪掉
stale = sorted(set(T) - used)
if stale:
    print('對照表裡母版已經用不到的條目：\n' + '\n'.join(stale), file=sys.stderr)

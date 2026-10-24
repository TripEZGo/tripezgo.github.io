#!/usr/bin/env python3
"""從繁中首頁 index.html 產生 en/index.html、ja/index.html 與 ko/index.html。

繁中是母版：版面、區塊、截圖位置都只改 index.html，再跑這支。
英日韓文只換字（逐字對照表在下面，每條 (en, ja, ko)）、換截圖路徑、換連結與 <head>。
表裡沒有對到的中文字串會讓這支直接失敗——寧可擋下，不要上線一頁中英夾雜。

用詞照 App 的字串表（Scripts/i18n/maps）：旅伴 Companion／旅の仲間、共編 co-edit／共同編集、
總覽 Overview／概要、附件 Files／添付、待辦 To-Dos／やることリスト、即時動態 Live Activity／ライブアクティビティ、
小工具 Tools／ツール。
韓文以 App Store 韓文介紹（App repo fastlane/metadata/ko/description.txt）為準：旅伴 동행、共編 공동 편집、
待排 미정、總覽 한눈에 보기、附件 첨부、待辦 할 일、即時動態 라이브 액티비티、資料 자료、工具 도구、Widget 위젯。

用法：python3 tools/home-i18n.py
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

# 開發故事的文章連結：zhgchg.li 每篇都有英日版（文章頁的 hreflang），英日首頁連到同語言那一篇；
# 沒有韓文版，韓文首頁連到英文那一篇
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

LANGS = ['en', 'ja', 'ko']   # T 每條的三欄就是這個順序
NAMES = {'en': 'English', 'ja': '日本語', 'ko': '한국어'}

T = {
  # chrome
  '跳到主要內容': ('Skip to main content', 'メインコンテンツへ移動', '메인 콘텐츠로 건너뛰기'),
  '隱私': ('Privacy', 'プライバシー', '개인정보'),
  '選單': ('Menu', 'メニュー', '메뉴'),
  '功能': ('Features', '機能', '기능'),
  '方案': ('Pricing', '料金', '요금제'),
  'TripEZGo 首頁': ('TripEZGo home', 'TripEZGo ホーム', 'TripEZGo 홈'),
  '主要導覽': ('Main', 'メイン', '메인'),
  '頁尾導覽': ('Footer', 'フッター', '바닥글'),
  '隱私權政策': ('Privacy Policy', 'プライバシーポリシー', '개인정보 처리방침'),
  '使用者條款': ('Terms of Use', '利用規約', '이용약관'),
  '聯絡我們': ('Contact', 'お問い合わせ', '문의하기'),
  '旅行規劃、旅途所需一次搞定。': ('Plan the trip, carry what it needs — all in one app.', '旅の計画も、旅先で要るものも、これひとつで。', '여행 계획부터 여행길에 필요한 것까지, 앱 하나로.'),
  '<span>Powered by <a href="https://zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a></span>': ('<span>Powered by <a href="https://en.zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a></span>', '<span>Powered by <a href="https://jp.zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a></span>', '<span>Powered by <a href="https://en.zhgchg.li/" target="_blank" rel="noopener">zhgchgli</a></span>'),
  # hero
  'iPhone 與 iPad 旅行規劃': ('Travel planner for iPhone and iPad', 'iPhone・iPad の旅行プランナー', 'iPhone·iPad 여행 플래너'),
  '旅行規劃、旅途所需': ('Plan the trip, carry what it needs —', '旅の計画も、旅先で要るものも、', '여행 계획부터 여행길에 필요한 것까지,'),
  '一次搞定': ('all in one app', 'これひとつで', '앱 하나로'),
  '行事曆排行程、旅伴一起編，出發後也跟著你走。': ('Plan the days on a calendar, edit with your travel companions — and take it all with you when you go.',
                                              'カレンダーで予定を組んで、旅の仲間と一緒に編集。出発したあとも、そのまま持ち歩けます。',
                                              '캘린더로 일정을 짜고 동행과 함께 편집하고, 출발한 뒤에도 그대로 들고 다니세요.'),
  '在 App Store 下載': ('Download on the App Store', 'App Store でダウンロード', 'App Store에서 다운로드'),
  '功能介紹': ('Features', '機能紹介', '기능 소개'),
  '免註冊': ('No sign-up', '登録不要', '회원가입 없음'),
  '離線可用': ('Works offline', 'オフラインで使える', '오프라인 사용 가능'),
  '免費下載': ('Free to download', '無料でダウンロード', '무료 다운로드'),
  # privacy
  '隱私與安全': ('Privacy and security', 'プライバシーと安全', '개인정보와 안전'),
  '你的旅程，': ('Your trips live', 'あなたの旅行は、', '내 여행은'),
  '只在你的手機': ('only on your phone', 'あなたの iPhone と', '내 iPhone과'),
  '和你的 iCloud': ('and in your iCloud', 'あなたの iCloud だけに', '내 iCloud에만'),
  '閱讀完整隱私權政策 →': ('Read the full privacy policy →', 'プライバシーポリシー全文を読む →', '개인정보 처리방침 전문 읽기 →'),
  '筆記': ('Notes', 'メモ', '메모'),
  # 01 安排行程
  '04 · 安排行程': ('04 · Plan events', '04 · 予定を組む', '04 · 일정 짜기'),
  '該帶的，': ('Everything you need,', '持っていくものは、', '챙길 것은,'),
  '都掛在行程上': ('attached to the event', '予定にまとめて', '모두 일정에 달아 두세요'),
  '車票、訂位、待辦跟著行程走，到現場點了就開。': ('Tickets, bookings and to-dos stay with the event. When you get there, one tap opens them.',
                                             'チケットも予約もやることも、予定と一緒に。現地ではタップするだけで開けます。',
                                             '승차권, 예약, 할 일이 일정과 함께. 현장에서는 탭 한 번이면 열려요.'),
  '照片、檔案、電子車票連結': ('Photos, files and e-ticket links', '写真・ファイル・電子チケットのリンク', '사진, 파일, 전자 승차권 링크'),
  '出發前逐項打勾的待辦': ('To-dos to tick off before you leave', '出発前にチェックするやること', '출발 전에 하나씩 체크하는 할 일'),
  # 03 行事曆／時間軸
  '今天怎麼走，': ("Today's plan,", '今日の回り方が、', '오늘의 동선,'),
  '一眼看完': ('at a glance', 'ひと目でわかる', '한눈에'),
  '行程、空檔、路上要多久，排在同一條時間上。': ('Events, free time and travel time, laid out on a single line of time.',
                                            '予定も空き時間も移動時間も、1本の時間軸に。',
                                            '일정, 빈 시간, 이동 시간을 하나의 시간 축에.'),
  '停留多久、空檔多少': ('How long you stay, how much time is free', '滞在時間と空き時間', '머무는 시간과 빈 시간'),
  '行事曆、時間軸隨時切換': ('Switch between calendar and timeline anytime', 'カレンダーとタイムラインをいつでも切り替え', '캘린더와 타임라인을 언제든 전환'),
  # 05 地圖
  '下一站在哪，': ("Where's next?", '次はどこへ。', '다음은 어디로?'),
  '地圖告訴你': ('The map shows you', 'マップが教えてくれる', '지도가 알려 줍니다'),
  '每天的行程連成路線，順路的店也標在上面。': ("Each day's events join into a route, with the shops along the way marked too.",
                                          '1日の予定がルートでつながり、道沿いのお店も表示されます。',
                                          '하루의 일정이 동선으로 이어지고, 가는 길의 가게도 표시돼요.'),
  '每日路線與路程': ('Daily routes and legs', '1日のルートと移動', '날마다의 동선과 이동'),
  '標記想去的地方': ('Pin the places you want to go', '行きたい場所にマーカー', '가고 싶은 곳에 마커'),
  '日本超商、百貨藥妝圖資': ('Japanese convenience stores, department stores and drugstores', '日本のコンビニ・百貨店・ドラッグストア', '일본 편의점·백화점·드럭스토어 정보'),
  '支援步行導航': ('Walking directions', '徒歩ナビ', '도보 길 안내'),
  # 04 總覽
  '06 · 總覽模式': ('06 · Overview', '06 · 概要', '06 · 한눈에 보기'),
  '整趟旅程，': ('The whole trip,', '旅行まるごと、', '여행 전체를'),
  '一頁看完': ('on one page', '1ページで', '한 페이지에'),
  '行程、附件、待辦，要找的東西點一下就到。': ('Events, files and to-dos — whatever you need is one tap away.',
                                         '予定・添付・やること。探しものはタップひとつで。',
                                         '일정, 첨부, 할 일. 찾는 것은 탭 한 번이면 나와요.'),
  # 06 旅伴
  '一起排，': ('Plan together,', '一緒に組んで、', '함께 짜고,'),
  '一起出發': ('travel together', '一緒に出発', '함께 떠나요'),
  '旅伴一起編行程、筆記與附件。路上分享位置，走散了也找得到彼此。':
      ('Companions edit events, notes and files together. Share your location on the road, so you can find each other if you split up.',
       '旅の仲間と予定・メモ・添付を共同編集。旅先では現在地を共有して、はぐれてもお互いを見つけられます。',
       '동행과 일정·메모·첨부를 공동 편집. 여행길에서는 위치를 공유해, 서로 떨어져도 찾을 수 있어요.'),
  # lock screen
  '不用打開 App': ('Without opening the app', 'アプリを開かずに', '앱을 열지 않아도'),
  '不用解鎖，': ('No unlocking —', 'ロックを解除しなくても、', '잠금을 풀지 않아도,'),
  '下一站就在鎖定畫面': ('your next stop is on the Lock Screen', '次の行き先はロック画面に', '다음 목적지는 잠금 화면에'),
  '現在在哪、還能待多久、下一站怎麼去。': ("Where you are, how long you have left, and how to get to the next stop.",
                                     '今どこにいて、あとどれだけいられて、次へどう行くか。',
                                     '지금 어디에 있는지, 얼마나 더 머물 수 있는지, 다음 목적지까지 어떻게 가는지.'),
  '即時動態': ('Live Activity', 'ライブアクティビティ', '라이브 액티비티'),
  # tools
  '路上用得到的，': ('What you need on the road,', '旅先で使うものは、', '여행길에 필요한 것은,'),
  '都帶著': ('all in one place', 'ぜんぶここに', '모두 여기에'),
  '匯率換算': ('Currency', '為替換算', '환율 변환'),
  '購物清單': ('Shopping list', '買い物リスト', '쇼핑 목록'),
  '資料': ('Library', '資料', '자료'),
  '工具': ('Tools', 'ツール', '도구'),
  '資料與工具': ('Library & tools', '資料とツール', '자료와 도구'),
  '資料與工具（筆記、購物清單、掃描、匯率換算）': ('Library & tools (notes, shopping list, scanner, currency)', '資料とツール（メモ・買い物リスト・スキャン・為替）', '자료와 도구(메모, 쇼핑 목록, 스캔, 환율 변환)'),
  'QR Code 掃描': ('QR code scanner', 'QR コードスキャン', 'QR 코드 스캔'),
  # AI
  '讓 AI': ('Let AI', 'AI に', 'AI에게'),
  '幫你排行程': ('plan it for you', '予定を組んでもらう', '일정을 맡기세요'),
  '內建 MCP，接上你的 AI Agent，說一句「幫我排京都第二天」，行程就進來了。':
      ('Built-in MCP connects your AI agent. Say "Plan day two in Kyoto for me" and the events appear.',
       'MCP を内蔵。AI エージェントにつないで「京都の2日目を組んで」と頼めば、予定が入ります。',
       'MCP 내장. AI 에이전트를 연결하고 “교토 둘째 날 일정 짜 줘”라고 말하면 일정이 들어옵니다.'),
  # plans
  '免費開始，': ('Start free,', '無料ではじめて、', '무료로 시작하고,'),
  '需要再升級': ('upgrade when you need to', '必要なときにアップグレード', '필요할 때 업그레이드'),
  '免費版': ('Free', '無料版', '무료 버전'),
  '旅程數': ('Trips', '旅行の数', '여행 수'),
  '同時只能擁有 3 趟': ('3 at a time', '同時に3件', '동시에 3개까지'),
  '包含垃圾桶': ('trash included', 'ゴミ箱込み', '휴지통 포함'),
  '不限': ('Unlimited', '無制限', '무제한'),
  '每趟旅伴': ('Companions per trip', '旅行ごとの旅の仲間', '여행마다 동행'),
  '3 位': ('3', '3 人', '3명'),
  '廣告': ('Ads', '広告', '광고'),
  '有': ('Yes', 'あり', '있음'),
  '無廣告': ('No ads', '広告なし', '광고 없음'),
  '行事曆／時間軸、地圖、總覽': ('Calendar / timeline, map, overview', 'カレンダー／タイムライン・マップ・概要', '캘린더/타임라인, 지도, 한눈에 보기'),
  '附件、待辦、路程與班次備案': ('Files, to-dos, legs and backup departures', '添付・やること・移動と代わりの便', '첨부, 할 일, 이동과 대체 편'),
  '旅伴共編、分享位置': ('Co-editing and location sharing', '共同編集・現在地の共有', '동행과 공동 편집, 위치 공유'),
  'iCloud 同步與備份': ('iCloud sync and backup', 'iCloud 同期とバックアップ', 'iCloud 동기화와 백업'),
  '匯入匯出': ('Import and export', '読み込み・書き出し', '가져오기·내보내기'),
  'AI Agent 整合': ('AI agent integration', 'AI エージェント連携', 'AI 에이전트 연동'),
  'Apple／Google 行事曆整合': ('Apple / Google Calendar integration', 'Apple／Google カレンダー連携', 'Apple/Google 캘린더 연동'),
  'Premium 提供週、月、年自動續訂或一次買斷，可隨時在 App Store 的訂閱設定取消。':
      ('Premium is available as a weekly, monthly or yearly subscription, or a one-time purchase. Cancel anytime in your App Store subscription settings.',
       'Premium は週・月・年の自動更新サブスクリプション、または買い切り。App Store のサブスクリプション設定からいつでも解約できます。',
       'Premium은 주간·월간·연간 자동 갱신 구독 또는 한 번 구매로 이용할 수 있으며, App Store의 구독 설정에서 언제든 해지할 수 있습니다.'),
  '不支援': ('Not included', '対象外', '미포함'),
  '支援': ('Included', '対象', '포함'),
  # alt text
  '地圖模式：第 2 天在宮島，行程依序連成步行路線，嚴島神社的卡片上有步行導航鈕':
      ("Map: day 2 on Miyajima, with events joined into a walking route and Itsukushima Shrine's card showing a walking-directions button",
       'マップ：2日目の宮島。予定が徒歩ルートでつながり、厳島神社のカードに徒歩ナビのボタン',
       '지도: 미야지마에서의 2일차. 일정이 도보 동선으로 이어지고, 이쓰쿠시마 신사 카드에 도보 길 안내 버튼'),
  '行事曆模式：山陽 6 日的第 2 天，行程沿時間排開，早餐與渡輪之間標著 JR 山陽本線的班次':
      ('Calendar: day 2 of the six-day San\'yō trip, events laid out by time, with the JR San\'yō Line departure between breakfast and the ferry',
       'カレンダー：山陽 6 日間の2日目。予定が時間順に並び、朝食とフェリーのあいだに JR 山陽本線の便',
       '캘린더: 산요 6일 여행의 2일차. 일정이 시간순으로 놓이고, 아침 식사와 페리 사이에 JR 산요 본선 열차 편'),
  '總覽：今天的行程依時間列出，行程之間標著步行時間與間隔': ("Overview: today's events listed by time, with walking time and gaps between them",
                                                    '概要：今日の予定が時間順に並び、予定のあいだに徒歩時間と間隔',
                                                    '한눈에 보기: 오늘 일정이 시간순으로 나열되고, 일정 사이에 도보 시간과 간격'),
  '路程：三個班次並排，選中的那一班顯示發車、抵達與候車時間':
      ('Leg: three departures side by side; the selected one shows departure, arrival and waiting time',
       '移動：3つの便が並び、選んだ便の発車・到着・待ち時間を表示',
       '이동: 세 개의 편이 나란히 놓이고, 선택한 편에 출발·도착·대기 시간 표시'),
  '旅程共編：分享開關、邀請連結與 QR Code，下方列出旅伴': ('Trip sharing: the sharing switch, invite link and QR code, with companions listed below',
                                                   '旅程の共同編集：共有スイッチ、招待リンクと QR コード、その下に旅の仲間',
                                                   '여행 공동 편집: 공유 스위치, 초대 링크와 QR 코드, 아래에 동행 목록'),
  '主畫面 Widget：今天的行程與匯率換算': ("Home Screen widgets: today's events and a currency converter", 'ホーム画面のウィジェット：今日の予定と為替換算', '홈 화면 위젯: 오늘 일정과 환율 변환'),
  '筆記：圖文筆記，@ 連到行程，日文句子可以朗讀': ('Notes: text and photos, @ links to events, and Japanese phrases that can be read aloud',
                                          'メモ：写真と文字のメモ。@ で予定にリンクし、フレーズは読み上げも',
                                          '메모: 사진과 글, @로 일정에 연결하고, 일본어 문장은 읽어 주기도'),
  '匯率換算：台幣與日圓互換，下方是最近的換算紀錄': ('Currency: converting between two currencies, with recent conversions below', '為替換算：2つの通貨を換算し、下に最近の換算履歴', '환율 변환: 두 통화를 변환하고, 아래에 최근 변환 기록'),
  '購物清單：待購、已購、不買了的件數，商品依分類排成照片格': ('Shopping list: counts of to-buy, bought and skipped items, with items in a photo grid by category',
                                                    '買い物リスト：購入予定・購入済み・やめたの件数と、カテゴリ別の写真グリッド',
                                                    '쇼핑 목록: 살 것·구매함·안 사기 개수와 카테고리별 사진 그리드'),
  'QR Code 掃描：打開就是鏡頭，對準就掃到，紀錄旅伴也看得到': ('QR code scanner: opens straight to the camera, scans on sight, and keeps a history your companions can see',
                                                     'QR コードスキャン：開くとすぐカメラ。かざすだけで読み取り、履歴は旅の仲間も見られる',
                                                     'QR 코드 스캔: 열자마자 카메라, 비추기만 하면 스캔, 기록은 동행도 볼 수 있음'),
  # ── 2026-10-11 照手稿重排之後新增的字串 ──
  # 用詞：路程 leg／移動、全日 all-day／終日、待排 unscheduled／未定、標記 marker／マーカー、
  # 步行導航 walking directions／徒歩ナビ、位置共享 location sharing／位置の共有（App 字串表）。
  # 展開介紹與開發故事是手稿原文：譯成口語短句，不逐字對；段落與清單結構照母版。
  '展開介紹': ('Read more', 'くわしく見る', '자세히 보기'),
  # 右下角浮動下載卡片（QR 圖三語共用）
  '立即下載 App': ('Get the App', '今すぐダウンロード', '지금 앱 다운로드'),
  'App Store 下載 QR Code': ('QR code to download on the App Store', 'App Store ダウンロード用 QR コード', 'App Store 다운로드 QR 코드'),
  '用 iPhone 掃描下載': ('Scan with your iPhone', 'iPhone で読み取ってダウンロード', 'iPhone으로 스캔해 다운로드'),
  # 隱私
  '不用帳號，我們沒有伺服器，也看不到你的行程。備份、同步、共享都走 iCloud；沒有網路也能編輯。':
      ('No account. We run no server and never see your trips. Backup, sync and sharing all go through iCloud — and you can edit without a connection.',
       'アカウントは不要。私たちはサーバーを持たず、あなたの予定を見ることもありません。バックアップ・同期・共有はすべて iCloud で。通信がなくても編集できます。',
       '계정은 필요 없어요. 저희는 서버가 없어 여러분의 일정을 볼 수 없습니다. 백업·동기화·공유는 모두 iCloud로, 인터넷이 없어도 편집할 수 있어요.'),
  '<p><b>隱私與資料安全優先</b>：AI 大行其道之下，資料安全與隱私更需要被重視。TripEZGo 採用不自建伺服器的設計，我們沒有自己的伺服器來保存你的旅遊資料；你的資料只會存在你的裝置上，或透過 Apple iCloud 備份與跨裝置同步，即使是多人共編旅程，也同樣透過 iCloud 共享來實現。</p>':
      ('<p><b>Privacy and data security come first.</b> With AI everywhere, keeping your data safe and private matters more than ever. TripEZGo is built without a server of its own, so we have nowhere to keep your travel data. It lives on your device, or in Apple iCloud for backup and sync across your devices. Even when several people co-edit a trip, it runs on iCloud sharing.</p>',
       '<p><b>プライバシーとデータの安全を最優先に</b>：AI が当たり前になった今、データの安全とプライバシーはこれまで以上に大切です。TripEZGo は自前のサーバーを持たない設計なので、あなたの旅行データを預かる場所は私たちの側にありません。データはあなたの端末か、Apple の iCloud（バックアップと端末間の同期）にだけ保存されます。みんなで旅程を共同編集するときも、iCloud 共有を使います。</p>',
       '<p><b>개인정보와 데이터 보안이 우선</b>: AI가 일상이 된 지금, 데이터 보안과 개인정보는 그 어느 때보다 중요합니다. TripEZGo는 자체 서버 없이 만들어서, 여러분의 여행 데이터를 보관할 곳이 저희 쪽에는 없습니다. 데이터는 여러분의 기기, 또는 Apple iCloud(백업과 기기 간 동기화)에만 저장됩니다. 여럿이 여행을 공동 편집할 때도 iCloud 공유를 사용합니다.</p>'),
  '所有旅程資料，包含附件檔案、圖片，都只存在你的手機或你的 iCloud；你可以自己匯入匯出備份，或直接用 iCloud 備份同步。':
      ('Everything in your trips, files and photos included, stays on your phone or in your iCloud. Export and import backups yourself, or just let iCloud back up and sync.',
       '旅行のデータは、添付ファイルや写真も含めて、あなたの iPhone か iCloud にだけ。バックアップは自分で書き出し・読み込みもできるし、iCloud のバックアップと同期に任せることもできます。',
       '여행 데이터는 첨부 파일과 사진까지 모두 내 iPhone이나 내 iCloud에만 있습니다. 백업 파일을 직접 내보내고 가져올 수도 있고, iCloud 백업·동기화에 맡길 수도 있어요.'),
  '<p><b>支援離線編輯</b>：因為所有資料都存在你的手機，即使沒有網路也能存取、編輯所有資料；有開啟 iCloud 備份同步或共享的話，會在有網路時同步。</p>':
      ("<p><b>Works offline.</b> Everything lives on your phone, so you can open and edit all of it without a connection. If iCloud backup and sync or sharing is on, your changes sync once you're back online.</p>",
       '<p><b>オフラインでも編集できる</b>：データはすべて iPhone の中にあるので、通信がなくても見ることも編集することもできます。iCloud のバックアップと同期や共有をオンにしていれば、つながったときに同期されます。</p>',
       '<p><b>오프라인에서도 편집</b>: 모든 데이터가 iPhone 안에 있으니, 인터넷이 없어도 보고 편집할 수 있습니다. iCloud 백업·동기화나 공유를 켜 두었다면, 다시 연결되는 대로 동기화됩니다.</p>'),
  '資料流向示意：資料存在這台 iPhone；打開 iCloud 同步備份後，傳到你的 Apple iCloud 並同步到 iPad；再打開旅程共編，透過 iCloud 共享給三位旅伴':
      ('How your data flows: it lives on this iPhone; turn on iCloud backup and sync and it goes to your Apple iCloud and syncs to your iPad; turn on trip sharing and it reaches three companions through iCloud sharing',
       'データの流れ：データはこの iPhone に。iCloud のバックアップと同期をオンにすると、あなたの Apple iCloud に送られ、iPad とも同期。さらに旅程の共同編集をオンにすると、iCloud 共有で 3 人の旅の仲間へ',
       '데이터 흐름: 데이터는 이 iPhone에 있습니다. iCloud 백업·동기화를 켜면 내 Apple iCloud로 전송되고 iPad와도 동기화되며, 여행 공동 편집까지 켜면 iCloud 공유로 동행 세 명에게 전달됩니다'),
  '資料存在這台 iPhone，透過你的 Apple iCloud 備份同步；旅程共編也走 iCloud 共享。':
      ('Your data stays on this iPhone and is backed up and synced through your Apple iCloud. Trip sharing runs on iCloud sharing too.',
       'データはこの iPhone に保存され、あなたの Apple iCloud でバックアップと同期。旅程の共同編集も iCloud 共有で。',
       '데이터는 이 iPhone에 저장되고, 내 Apple iCloud로 백업·동기화됩니다. 여행 공동 편집도 iCloud 공유로 이루어집니다.'),
  # 01 安排行程
  '地點搜尋，也能直接貼 Google 地圖網址': ('Search for a place, or just paste a Google Maps link', '場所を検索、Google マップのリンクを貼るだけでも', '장소 검색, Google 지도 링크를 붙여 넣기만 해도'),
  '起迄不同時區、全日、待排行程': ('Different start and end time zones, all-day and unscheduled events', '出発と到着で違うタイムゾーン、終日・未定の予定', '출발·도착 시간대가 다른 일정, 종일·미정 일정'),
  '行程所需要的資料我們都考慮到了！你可以在行程設定：': ("We've thought of everything an event needs. For each event you can set:", '予定に要る情報は、ひと通りそろっています。予定ごとに設定できるのは：', '일정에 필요한 정보는 빠짐없이 챙겼어요. 일정마다 설정할 수 있는 것:'),
  '<li><b>地點</b>：支援地點名稱搜尋、地址搜尋，或直接貼上 Google 地圖網址或地址</li>':
      ('<li><b>Place</b>: search by name or address, or just paste a Google Maps link or an address</li>',
       '<li><b>場所</b>：名前や住所で検索。Google マップのリンクや住所をそのまま貼り付けても OK</li>',
       '<li><b>장소</b>: 이름이나 주소로 검색하거나, Google 지도 링크나 주소를 그대로 붙여 넣으세요</li>'),
  '<li><b>類型／標題</b>：輸入地點時會自動帶入、推導類型</li>':
      ('<li><b>Type / title</b>: filled in as you enter a place, with the type worked out for you</li>',
       '<li><b>種類／タイトル</b>：場所を入れると自動で入り、種類も推測します</li>',
       '<li><b>유형/제목</b>: 장소를 입력하면 자동으로 채워지고, 유형도 추측해 줍니다</li>'),
  '<li><b>附件</b>：支援上傳圖片（從照片 App）、上傳檔案（從檔案 App）、儲存網址（例如電子車票）</li>':
      ('<li><b>Files</b>: add photos (from the Photos app), files (from the Files app), or links (an e-ticket, say)</li>',
       '<li><b>添付</b>：写真（写真アプリから）、ファイル（ファイルアプリから）、URL（電子チケットなど）を保存</li>',
       '<li><b>첨부</b>: 사진(사진 앱에서), 파일(파일 앱에서), 링크(전자 승차권 등) 저장</li>'),
  '<li><b>時間</b>：支援起迄不同時區（例如台北起飛、沖繩落地）、全日行程（例如住宿飯店）、待排行程（時間未定）</li>':
      ('<li><b>Time</b>: different start and end time zones (take off in Taipei, land in Okinawa), all-day events (a hotel stay), and unscheduled events (no time set yet)</li>',
       '<li><b>時間</b>：出発と到着で違うタイムゾーン（台北で離陸、沖縄に着陸など）、終日の予定（ホテルの宿泊など）、未定の予定（時間がまだ決まっていないもの）</li>',
       '<li><b>시간</b>: 출발과 도착 시간대가 다른 일정(타이베이에서 이륙해 오키나와에 착륙 등), 종일 일정(호텔 숙박 등), 미정 일정(시간이 아직 정해지지 않은 것)</li>'),
  '<li><b>待辦事項</b>：例如記得訂位</li>': ('<li><b>To-dos</b>: “remember to book a table,” for example</li>', '<li><b>やること</b>：「忘れずに予約」など</li>', '<li><b>할 일</b>: “잊지 말고 예약하기” 같은 것</li>'),
  '行程建立後支援「取消」（保留但顯示刪除線）、「刪除」（完全移除）、「延後／提前」（這個行程跟後面的行程一起延後或提前 X 小時 Y 分鐘）。':
      ('Once an event is in, you can cancel it (it stays, struck through), delete it (gone for good), or move it later or earlier — it and every event after it shift by X hours and Y minutes.',
       '作った予定は「キャンセル」（残したまま取り消し線を表示）、「削除」（完全に消す）、「後ろへ／前へずらす」（この予定とそれ以降の予定をまとめて X 時間 Y 分ずらす）ができます。',
       '만든 일정은 ‘취소’(남겨 두고 취소선 표시), ‘삭제’(완전히 지우기), ‘뒤로/앞으로’(이 일정과 이후 일정을 함께 X시간 Y분 옮기기)를 할 수 있어요.'),
  '行程詳情：桃園機場報到，待辦清單與附件——網頁連結、PDF 電子登機證與護照照片':
      ('Event details: check-in at Taoyuan Airport, with a to-do list and files — a web link, a PDF boarding pass and a passport photo',
       '予定の詳細：桃園空港でのチェックイン。やることリストと添付（Web リンク、PDF の電子搭乗券、パスポートの写真）',
       '일정 상세: 타오위안 공항 체크인. 할 일 목록과 첨부(웹 링크, PDF 전자 탑승권, 여권 사진)'),
  # 02 路程
  '05 · 路程': ('05 · Legs', '05 · 移動', '05 · 이동'),
  '錯過這班車，': ('Miss this train?', '乗り遅れても、', '이번 열차를 놓쳐도,'),
  '下一班已經排好': ('The next one is already lined up', '次の便はもう用意済み', '다음 편이 이미 잡혀 있어요'),
  '兩個行程之間就是一段路程，時間不夠會先提醒你。': ("Between two events there's a leg — and if there isn't enough time, you'll hear about it first.",
                                              '予定と予定のあいだには移動があります。時間が足りなければ先にお知らせ。',
                                              '일정과 일정 사이가 곧 이동. 시간이 모자라면 먼저 알려 줍니다.'),
  '步行、開車、大眾運輸，自動估算時間': ('Walking, driving or transit, with the time estimated for you', '徒歩・車・公共交通。所要時間は自動で計算', '도보·자동차·대중교통, 걸리는 시간은 자동으로 계산'),
  '路程比空檔還久，先跳警告': ('A warning when the leg takes longer than the gap', '移動が空き時間より長ければ、先に警告', '이동 시간이 빈 시간보다 길면 미리 경고'),
  '多組班次，旅途中提醒最接近的那一班': ('Several departures, with a reminder for the nearest one on the day', '便をいくつも登録、旅先ではいちばん近い便をお知らせ', '여러 편을 저장하고, 여행 중에는 가장 가까운 편을 알림'),
  '兩個行程之間都可以設定一段路程，路程就是交通方式，可以設定步行、開車、大眾運輸，不同的交通方式會算出兩點之間的預估時間；如果兩個行程的間隔比路程花的時間還短，會出現警告（例如兩個行程只隔 30 分鐘，但開車實際要 1 小時）。':
      ('You can set a leg between any two events. A leg is how you get there — walking, driving or transit — and each gives you an estimated travel time between the two places. If the gap between the events is shorter than the leg, you get a warning (say they are 30 minutes apart, but the drive actually takes an hour).',
       '予定と予定のあいだには、移動を設定できます。移動とは交通手段のこと。徒歩・車・公共交通から選ぶと、2 地点間の所要時間の目安が出ます。予定の間隔が移動にかかる時間より短いときは警告が出ます（たとえば予定の間が 30 分しかないのに、車で実際は 1 時間かかる場合）。',
       '일정과 일정 사이에는 이동을 설정할 수 있습니다. 이동은 곧 교통수단이에요. 도보·자동차·대중교통 중에서 고르면 두 지점 사이의 예상 소요 시간이 나옵니다. 일정 사이 간격이 이동에 걸리는 시간보다 짧으면 경고가 나타나요(예를 들어 일정 사이가 30분뿐인데 자동차로 실제 1시간이 걸리는 경우).'),
  '特別優化的是大眾運輸：可以預先輸入多筆班次，旅途中會依照最接近現在的班次提醒你；提早到了或是錯過了，都能當機立斷，馬上跳到下一班火車或公車。':
      ("Transit gets special care. Enter several departures ahead of time, and on the day you're reminded of the one closest to now. Early, or just missed it? Decide on the spot and jump straight to the next train or bus.",
       '特に力を入れたのが公共交通です。便を前もって何本か登録しておけば、旅先ではいまにいちばん近い便をお知らせ。早く着いても、乗り遅れても、その場で次の電車やバスに切り替えられます。',
       '특히 공을 들인 것은 대중교통입니다. 여러 편을 미리 입력해 두면, 여행 중에는 지금과 가장 가까운 편을 알려 줍니다. 일찍 도착했든 놓쳤든, 그 자리에서 바로 다음 열차나 버스로 바꿀 수 있어요.'),
  # 03 行事曆／時間軸
  '01 · 行事曆／時間軸': ('01 · Calendar / Timeline', '01 · カレンダー／タイムライン', '01 · 캘린더/타임라인'),
  '一拖一拉就能安排、調整行程': ('Drag to plan and rearrange events', 'ドラッグするだけで予定を組んだり動かしたり', '끌어다 놓기만 하면 일정을 짜고 바꿀 수 있어요'),
  '還沒決定時間的地方，拖進時段就排好': ("Drag an unscheduled place onto a time and it's planned", '未定の予定は時間帯へドラッグするだけ', '시간을 못 정한 곳은 시간대로 끌어다 놓으면 끝'),
  '<p><b>行事曆模式</b>：你的行程就是一個行事曆事件，除了瀏覽直覺，安排行程時也最好用——一拖一拉就能排好行程，要改也只要拖曳就能換位置；規劃階段還不確定誰先誰後的行程，可以很快地調整。</p>':
      ("<p><b>Calendar view</b>: every event sits on a calendar, just like an appointment. It's easy to read, and it's the easiest way to plan — drag to place an event, drag again to move it. Still not sure what comes first? Rearranging takes seconds.</p>",
       '<p><b>カレンダー表示</b>：予定はそのままカレンダーの予定として並びます。見やすいだけでなく、組み立てるときにもいちばん便利。ドラッグで置いて、変えたいときもドラッグで動かすだけ。順番がまだ決まらない予定も、さっと入れ替えられます。</p>',
       '<p><b>캘린더 보기</b>: 일정이 캘린더의 일정으로 그대로 놓입니다. 보기 편할 뿐 아니라 일정을 짤 때도 가장 편해요. 끌어다 놓으면 일정이 생기고, 바꾸고 싶을 때도 끌어서 옮기기만 하면 됩니다. 순서를 아직 못 정한 일정도 금세 바꿀 수 있어요.</p>'),
  '<p><b>時間軸模式</b>：如果你習慣用時間軸看行程，也可以切換過去。今天幾點幾分要去哪？停留多久？路程多久？一目瞭然。</p>':
      ("<p><b>Timeline view</b>: if you'd rather read your day as a timeline, switch over. Where to be and when, how long to stay, how long to get there — all at a glance.</p>",
       '<p><b>タイムライン表示</b>：タイムラインで見るほうがしっくりくるなら、切り替えもできます。何時何分にどこへ行くか、どれだけいるか、移動にどれだけかかるかがひと目でわかります。</p>',
       '<p><b>타임라인 보기</b>: 타임라인으로 보는 게 익숙하다면 전환하세요. 몇 시 몇 분에 어디로 가는지, 얼마나 머무는지, 이동은 얼마나 걸리는지 한눈에 보입니다.</p>'),
  # 04 總覽
  '整趟行程表按日分組': ('Your whole itinerary, grouped by day', '旅行全体を日ごとに', '여행 전체를 날짜별로 묶어서'),
  '每一天的附件集中在一起': ("Each day's files in one place", 'その日の添付をひとまとめに', '하루치 첨부를 한곳에'),
  '哪一天、哪個行程還有待辦，一看就知道': ('See at a glance which day, and which event, still has to-dos', 'どの日のどの予定にやることが残っているか、ひと目でわかる', '어느 날 어느 일정에 할 일이 남았는지 한눈에'),
  '總覽模式讓你一頁掌握整趟行程安排；除此之外，這裡也會依照每一天分組整理行程的附件與待辦事項，在這邊就能快速打開每個行程的附件，或是知道哪一天的哪一個行程還有待辦。':
      ("Overview puts the whole trip on one page. It also gathers every event's files and to-dos, grouped by day — so you can open any event's files right here, or see which event on which day still has to-dos.",
       '概要では、旅行全体の予定を1ページで見渡せます。予定の添付ややることも日ごとにまとめてあるので、ここから各予定の添付をすぐ開いたり、どの日のどの予定にやることが残っているかを確かめたりできます。',
       '한눈에 보기에서는 여행 전체 일정을 한 페이지로 파악할 수 있습니다. 일정의 첨부와 할 일도 날짜별로 정리되어 있어서, 여기서 바로 각 일정의 첨부를 열거나 어느 날 어느 일정에 할 일이 남았는지 확인할 수 있어요.'),
  # 05 地圖
  '03 · 地圖模式': ('03 · Map', '03 · マップ', '03 · 지도'),
  '你每天安排的行程，只要設定好地點，就能在地圖上快速掌握行程彼此之間的位置關係與路線。':
      ("Give your events a place, and the map shows how each day's events sit in relation to one another, and the route between them.",
       '予定に場所を設定しておけば、1日の予定どうしの位置関係とルートが、マップでさっとつかめます。',
       '일정에 장소를 정해 두면, 그날 일정끼리의 위치 관계와 동선을 지도에서 바로 파악할 수 있습니다.'),
  '除了行程的標記，也能新增想去的地點標記，方便旅途中隨時看看附近還有哪些景點；另外還內建多家超商、百貨圖資，附近有沒有超商百貨，一打開就知道。':
      ("Besides your events, you can drop markers on places you'd like to go, so on the road you can always check what else is nearby. Convenience stores and department stores from several chains are built in too — open the map and you'll see if one is close.",
       '予定のほかに、行きたい場所にもマーカーを置けるので、旅先で近くに何があるかをいつでも見返せます。コンビニや百貨店のデータもいくつも内蔵。近くにあるかどうかは、開けばすぐわかります。',
       '일정 말고도 가고 싶은 곳에 마커를 추가할 수 있어서, 여행 중에 근처에 또 뭐가 있는지 언제든 볼 수 있어요. 여러 편의점·백화점 정보도 내장되어 있어, 근처에 있는지 지도를 열자마자 알 수 있습니다.'),
  '支援步行導航：附近看到一個想去的景點、不知道怎麼走？直接點開始導航就知道。':
      ('Walking directions, too: spotted somewhere nearby but not sure how to get there? Tap to start navigating and just follow along.',
       '徒歩ナビにも対応：近くに行ってみたい場所を見つけたけれど、行き方がわからない？ナビを開始すればすぐわかります。',
       '도보 길 안내도 지원: 근처에 가 보고 싶은 곳을 발견했는데 가는 길을 모르겠다면? 길 안내를 시작하면 바로 알 수 있어요.'),
  '打開地圖的預設畫面：今天的行程依序編號、連成路線，旁邊是自訂標記與附近的超商':
      ("The map as it opens: today's events numbered in order and joined into a route, with your own markers and nearby convenience stores alongside",
       'マップを開いたときの画面：今日の予定が番号順にルートでつながり、そばに自分のマーカーと近くのコンビニ',
       '지도를 열었을 때의 기본 화면: 오늘 일정이 순서대로 번호가 매겨져 동선으로 이어지고, 옆에 사용자 마커와 근처 편의점'),
  '地圖：第 2 天，正在步行導航到原爆圓頂，沿途標出超商與旅伴的位置':
      ('Map: day 2, with walking directions under way to the Atomic Bomb Dome and convenience stores and companions marked along the route',
       'マップ：2日目、原爆ドームへ徒歩ナビ中。道沿いにコンビニと旅の仲間の位置',
       '지도: 2일차, 원폭 돔까지 도보 길 안내 중. 가는 길의 편의점과 동행 위치 표시'),
  # 06 旅伴共編、位置共享
  '07 · 旅伴共編、位置共享': ('07 · Co-editing and location sharing', '07 · 共同編集・位置の共有', '07 · 공동 편집, 위치 공유'),
  '邀請旅伴一起安排同一趟': ('Invite companions to plan the same trip with you', '旅の仲間を招待して、同じ旅行を一緒に組む', '동행을 초대해 같은 여행을 함께 짜기'),
  '旅途中互相看到位置': ("See each other's location on the road", '旅先でお互いの位置がわかる', '여행 중 서로의 위치 확인'),
  '筆記、附件、待辦、待購清單可以選擇要不要共享': ('Choose whether notes, files, to-dos and the shopping list are shared', 'メモ・添付・やること・買い物リストは、共有するかどうかを選べる', '메모·첨부·할 일·쇼핑 목록은 공유할지 고를 수 있음'),
  '支援旅程共享共編，讓旅伴們一起完成這趟旅程；旅途進行中，旅伴可以開啟位置共享，互相照顧彼此安全，走散了也找得到彼此。':
      ("Share a trip and co-edit it, so your companions build it with you. Once you're on the road, companions can turn on location sharing to look out for each other — and find each other if you get separated.",
       '旅程を共有して共同編集すれば、旅の仲間と一緒に旅行を作れます。旅の途中は位置の共有をオンにすれば、お互いの安全を見守れて、はぐれても見つけられます。',
       '여행을 공유해 공동 편집하면, 동행과 함께 이번 여행을 완성할 수 있습니다. 여행 중에는 동행이 위치 공유를 켜서 서로의 안전을 챙기고, 떨어져도 서로를 찾을 수 있어요.'),
  '筆記、附件、待辦事項、待購清單，都可以設定要不要共編共享。': ('Notes, files, to-dos and the shopping list can each be shared for co-editing, or kept to yourself.',
                                                 'メモ・添付・やること・買い物リストは、それぞれ共有して共同編集するかどうかを設定できます。',
                                                 '메모·첨부·할 일·쇼핑 목록은 각각 공동 편집으로 공유할지 정할 수 있습니다.'),
  '位置共享：旅伴的位置出現在地圖上，灰色的是超過一小時沒更新': ("Location sharing: companions on the map; the gray ones haven't updated in over an hour",
                                                  '位置の共有：旅の仲間の位置がマップに表示され、グレーは 1 時間以上更新がない人',
                                                  '위치 공유: 동행의 위치가 지도에 표시되고, 회색은 1시간 넘게 업데이트가 없는 사람'),
  # 不用打開 App
  '即時動態：鎖定畫面與動態島，隨時看進行中的行程': ('Live Activity: the current event on the Lock Screen and in the Dynamic Island, anytime',
                                            'ライブアクティビティ：ロック画面とダイナミックアイランドで、進行中の予定をいつでも',
                                            '라이브 액티비티: 잠금 화면과 Dynamic Island에서 진행 중인 일정을 언제든'),
  '推播：出發前、行程開始前、還有待辦時提醒你': ('Notifications: before you set off, before an event starts, and while to-dos are still open',
                                         '通知：出発前、予定の開始前、やることが残っているときにお知らせ',
                                         '알림: 출발 전, 일정 시작 전, 할 일이 남아 있을 때 알려 줌'),
  'Widget：主畫面、鎖定畫面放今天的行程，待辦直接打勾': ("Widgets: today's events on your Home Screen and Lock Screen, with to-dos you can tick off right there",
                                                'ウィジェット：ホーム画面とロック画面に今日の予定。やることはその場でチェック',
                                                '위젯: 홈 화면과 잠금 화면에 오늘 일정, 할 일은 그 자리에서 체크'),
  '支援豐富的 Widget，你可以把需要的資訊直接放到主畫面或鎖定畫面，快速查看、存取。':
      ('A wide range of widgets puts what you need right on your Home Screen or Lock Screen, ready to check and open.',
       '豊富なウィジェットで、必要な情報をホーム画面やロック画面に置いて、すぐに確認・アクセスできます。',
       '다양한 위젯으로 필요한 정보를 홈 화면이나 잠금 화면에 두고 바로 확인하고 열 수 있어요.'),
  '旅程進行中的即時動態，讓你不用解鎖手機，拿出來瞄一眼就知道目前行程的停留時間、路程資訊與下一個行程。':
      ("While a trip is under way, the Live Activity means you don't even have to unlock your phone: one glance tells you how long you have at the current event, how you're getting to the next one, and what it is.",
       '旅行中はライブアクティビティのおかげで、iPhone のロックを解除しなくても、ちらっと見るだけで今の予定の滞在時間、移動の情報、次の予定がわかります。',
       '여행 중에는 라이브 액티비티 덕분에 iPhone 잠금을 풀지 않아도, 슬쩍 보기만 하면 지금 일정에 머무를 시간, 이동 정보, 다음 일정을 알 수 있습니다.'),
  '旅程開始前、行程開始前、還有待辦事項時，都會推播通知你。': ("You'll get a notification before a trip begins, before each event starts, and while to-dos are still open.",
                                                '旅行の開始前、予定の開始前、やることが残っているときに、通知でお知らせします。',
                                                '여행 시작 전, 일정 시작 전, 할 일이 남아 있을 때 알림으로 알려 드려요.'),
  '鎖定畫面：即時動態顯示嚴島神社進行中、剩餘時間與下一站，底下疊著 TripEZGo 的推播通知':
      ('Lock Screen: the Live Activity shows Itsukushima Shrine under way, the time left and the next stop, with TripEZGo notifications stacked below',
       'ロック画面：ライブアクティビティに厳島神社が進行中、残り時間と次の行き先。その下に TripEZGo の通知',
       '잠금 화면: 라이브 액티비티에 진행 중인 이쓰쿠시마 신사와 남은 시간, 다음 목적지. 그 아래 TripEZGo 알림'),
  # 小工具
  '內建豐富的旅途小工具，一個 App 搞定所有事。': ('Plenty of travel tools built in — one app for all of it.', '旅に役立つツールを内蔵。アプリひとつで全部まかなえます。', '여행에 쓸모 있는 도구를 내장해, 앱 하나로 모두 해결.'),
  '圖文都能記，不會當地語言也能唸給你聽': ("Text and photos — and it reads phrases aloud when you don't speak the language", '写真も文字も。現地の言葉が話せなくても読み上げてくれる', '사진도 글도 기록하고, 현지 말을 못 해도 읽어 줘요'),
  '一開一掃留下紀錄，旅伴也看得到': ("Open, scan, and it's saved — your companions see it too", '開いて読み取れば履歴に残り、旅の仲間も見られる', '열고 스캔하면 기록이 남고, 동행도 볼 수 있어요'),
  '使用當日匯率，沒網路也能算': ("Uses today's rate, and works offline", 'その日のレートで、通信がなくても計算', '그날의 환율로, 인터넷이 없어도 계산'),
  '還有什麼沒買一看就知，比價買最便宜': ("See what's left to buy, and compare prices to get the cheapest", 'まだ買っていないものがひと目でわかり、値段を比べていちばん安く', '아직 안 산 것이 한눈에, 가격을 비교해 가장 싸게'),
  '<li><b>筆記</b>：支援豐富的圖文編輯，還特別支援朗讀，不會當地語言也可以直接唸給對方聽。</li>':
      ("<li><b>Notes</b>: rich text-and-photo editing, plus read-aloud — don't speak the language? Let your phone say it for you.</li>",
       '<li><b>メモ</b>：写真も文字も自由に編集でき、読み上げにも対応。現地の言葉が話せなくても、そのまま相手に聞かせられます。</li>',
       '<li><b>메모</b>: 사진과 글을 자유롭게 편집하고, 읽어 주기도 지원해요. 현지 말을 못 해도 그대로 상대에게 들려줄 수 있습니다.</li>'),
  '<li><b>匯率換算</b>：使用當日匯率，沒網路也能換算。</li>':
      ("<li><b>Currency</b>: uses today's rate, and converts even without a connection.</li>",
       '<li><b>為替換算</b>：その日のレートで、通信がなくても換算できます。</li>',
       '<li><b>환율 변환</b>: 그날의 환율로, 인터넷이 없어도 변환할 수 있어요.</li>'),
  '<li><b>待購清單</b>：想買什麼都記在這裡，還有什麼沒買一看就知道；也可以記下各家價格，讓你買到最便宜的。</li>':
      ("<li><b>Shopping list</b>: write down everything you want to buy and see at a glance what's still left. Note each shop's price too, so you get the cheapest one.</li>",
       '<li><b>買い物リスト</b>：買いたいものをここにまとめておけば、まだ買っていないものがひと目でわかります。お店ごとの値段も記録できるので、いちばん安いところで買えます。</li>',
       '<li><b>쇼핑 목록</b>: 사고 싶은 것을 여기에 모아 두면 아직 안 산 것이 한눈에 보여요. 가게마다 가격도 기록해 가장 싼 곳에서 살 수 있습니다.</li>'),
  '<li><b>QR Code 掃描</b>：一開一掃並留下紀錄，旅伴也能直接看到。</li>':
      ("<li><b>QR code scanner</b>: open it, scan, and it's saved to a history your companions can see too.</li>",
       '<li><b>QR コードスキャン</b>：開いて読み取るだけで履歴に残り、旅の仲間もそのまま見られます。</li>',
       '<li><b>QR 코드 스캔</b>: 열고 스캔하기만 하면 기록이 남고, 동행도 바로 볼 수 있어요.</li>'),
  # 藍圖 08.09 那一列還在用（整合區那張卡已併進 02 靈感）
  '從其他 App 分享進來': ('Share in from other apps', 'ほかのアプリから共有', '다른 앱에서 공유해 가져오기'),
  # 02 靈感（1.4.0；原「整合 › 從其他 App 分享進來」併進來。用詞照 App 字串表：Inspiration／インスピレーション／영감、未關聯 Not added／未関連／미연결、新增關聯 Add to…／関連を追加／연결 추가）
  '02 · 靈感': ('02 · Inspiration', '02 · インスピレーション', '02 · 영감'),
  '在哪看到都能存，': ('Saved from anywhere,', 'どこで見ても保存できる、', '어디서 봐도 저장되는 '),
  '靈感': ('inspiration', 'インスピレーション', '영감'),
  '一次收齊': (' all in one place', 'をひとつに', '을 한곳에'),
  'Safari、地圖、社群、相簿分享進來，一鍵變成行程。': ('Share in from Safari, maps, social apps and Photos — then turn it into an event in one tap.',
                                           'Safari・地図・SNS・写真アプリから共有して、ワンタップで予定に。',
                                           'Safari, 지도, SNS, 사진에서 공유해 오면, 한 번에 일정이 돼요.'),
  '網頁、地圖、貼文、照片，分享給 TripEZGo 就先存起來': ("Web pages, places, posts and photos — share them to TripEZGo and they're saved",
                                         'Web ページ・場所・投稿・写真を TripEZGo に共有するだけで、まず保存',
                                         '웹페이지, 장소, 게시물, 사진을 TripEZGo로 공유하면 우선 저장'),
  '標題、預覽圖自動補上，不用整理': ('Title and preview image fill in on their own — no tidying', 'タイトルとプレビュー画像は自動で補完。整理いらず', '제목과 미리보기 이미지가 자동으로 채워져 정리할 필요 없음'),
  '未讀、未關聯，一眼分得清': ('Unread and not-yet-added items are easy to tell apart', '未読・未関連がひと目でわかる', '읽지 않음·미연결이 한눈에 구분'),
  '想排的時候，一鍵變成行程、筆記、購物清單、附件或地圖標記': ("When you're ready, add it to an event, a note, the shopping list, an attachment or a map pin in one tap",
                                              '決まったらワンタップで、予定・メモ・買い物リスト・添付・マップのマーカーに',
                                              '정해지면 한 번에 일정·메모·쇼핑 목록·첨부·지도 마커로'),
  '靈感：在網頁按分享、選 TripEZGo，存進「資料 › 靈感」，再關聯成行事曆上的行程':
      ('Inspiration: tap Share on a web page, pick TripEZGo, save it to Library › Inspiration, then add it to the calendar as an event',
       'インスピレーション：Web ページで共有をタップして TripEZGo を選び、「資料 › インスピレーション」に保存。そこからカレンダーの予定に関連づけ',
       '영감: 웹페이지에서 공유를 누르고 TripEZGo를 고른 뒤 ‘자료 › 영감’에 저장하고, 캘린더의 일정으로 연결'),
  '<p><b>從其他 App 分享進來</b>：看到想去的地方？同事推薦的景點？直接在 Safari、Google 地圖、Instagram、Threads 等 App 裡點分享、選 TripEZGo，就能先存進「資料 › 靈感」。</p>':
      ("<p><b>Share in from other apps</b>: found somewhere you want to go, or a spot a coworker recommended? Tap Share in Safari, Google Maps, Instagram, Threads or another app, pick TripEZGo, and it's saved to Library › Inspiration first.</p>",
       '<p><b>ほかのアプリから共有</b>：行きたい場所を見つけた？同僚のおすすめスポット？Safari や Google マップ、Instagram、Threads などのアプリで共有をタップして TripEZGo を選べば、まず「資料 › インスピレーション」に保存できます。</p>',
       '<p><b>다른 앱에서 공유해 가져오기</b>: 가 보고 싶은 곳을 발견했나요? 동료가 추천한 명소는요? Safari, Google 지도, Instagram, Threads 같은 앱에서 공유를 누르고 TripEZGo를 고르면 먼저 ‘자료 › 영감’에 저장됩니다.</p>'),
  '<p><b>先存起來，再決定</b>：不用當下就決定要排進哪一天。標題與預覽圖會自己補上，還沒看過的標未讀，還沒用到的可以只看「未關聯」。</p>':
      ("<p><b>Save first, decide later</b>: no need to pick a day on the spot. The title and preview image fill in by themselves, anything you haven't opened is marked unread, and you can filter to just what's “Not added”.</p>",
       '<p><b>まず保存、決めるのはあとで</b>：その場でどの日に入れるか決めなくて大丈夫。タイトルとプレビュー画像は自動で補われ、まだ見ていないものには未読の印、まだ使っていないものだけ「未関連」で絞り込めます。</p>',
       '<p><b>먼저 저장하고, 나중에 정하기</b>: 그 자리에서 어느 날에 넣을지 정하지 않아도 돼요. 제목과 미리보기 이미지는 저절로 채워지고, 아직 안 본 것은 읽지 않음으로 표시되며, 아직 쓰지 않은 것만 ‘미연결’로 모아 볼 수 있어요.</p>'),
  '<p><b>一鍵關聯</b>：想排的時候按「新增關聯」，這則靈感可以變成行事曆上的行程、筆記、購物清單、行程附件或地圖標記。</p>':
      ("<p><b>Add in one tap</b>: when you're ready, tap “Add to…” and the inspiration becomes an event on your calendar, a note, a shopping-list item, an event attachment or a map pin.</p>",
       '<p><b>ワンタップで関連づけ</b>：決まったら「関連を追加」を押すと、そのインスピレーションを予定、メモ、買い物リスト、予定の添付ファイル、マップのマーカーにできます。</p>',
       '<p><b>한 번에 연결</b>: 정해지면 ‘연결 추가’를 눌러 이 영감을 캘린더의 일정, 메모, 쇼핑 목록, 일정 첨부 파일, 지도 마커로 만들 수 있어요.</p>'),
  # 整合
  '整合': ('Integrations', '連携', '연동'),
  '跟 iPhone 上的其他 App，': ('Works with the other apps', 'iPhone のほかのアプリと、', 'iPhone의 다른 앱과'),
  '接在一起': ('on your iPhone', 'つながる', '연결됩니다'),
  '行程直接同步到你的行事曆': ('Your events sync straight to your calendar', '予定をそのままカレンダーに同期', '일정을 내 캘린더에 바로 동기화'),
  'Apple 行事曆的單日檢視：TripEZGo 同步進去的第 2 天行程': ("Apple Calendar's day view: day 2's events, synced in from TripEZGo",
                                                  'Apple カレンダーの日表示：TripEZGo から同期された2日目の予定',
                                                  'Apple 캘린더의 하루 보기: TripEZGo에서 동기화된 2일차 일정'),
  # 「、」不在 CJK 範圍，腳本抓不到，要自己列
  'Siri、Apple Intelligence': ('Siri and Apple Intelligence', 'Siri・Apple Intelligence', 'Siri와 Apple Intelligence'),
  # Siri 問句與 screens/siri.html 一致
  '問一句「下一個行程是什麼」，不用打開 App 就有答案': ("Ask “What's my next event?” and get the answer without opening the app",
                                           '「次の予定は何？」と聞くだけで、アプリを開かなくても答えがわかる',
                                           '“다음 일정이 뭐야?”라고 물으면 앱을 열지 않아도 답을 알려 줘요'),
  '問 Siri「下一個行程是什麼」：現在是嚴島神社，接下來是紅葉谷公園，11:30 開始':
      ("Asking Siri “What's my next event?”: Itsukushima Shrine now, then Momijidani Park at 11:30",
       'Siri に「次の予定は何？」：今は厳島神社、次は紅葉谷公園で 11:30 から',
       'Siri에게 “다음 일정이 뭐야?”: 지금은 이쓰쿠시마 신사, 다음은 11:30부터 모미지다니 공원'),
  '<p><b>Apple／Google 行事曆整合</b>：可以把行程直接同步到你的行事曆上。</p>':
      ('<p><b>Apple / Google Calendar integration</b>: sync your events straight to your calendar.</p>',
       '<p><b>Apple／Google カレンダー連携</b>：予定をそのままカレンダーに同期できます。</p>',
       '<p><b>Apple/Google 캘린더 연동</b>: 일정을 내 캘린더에 바로 동기화할 수 있어요.</p>'),
  '<p><b>Siri、Apple Intelligence</b>：可以直接問 Siri、Apple Intelligence 行程安排，快速存取行程。</p>':
      ('<p><b>Siri and Apple Intelligence</b>: ask Siri or Apple Intelligence about your plans and get to your events fast.</p>',
       '<p><b>Siri・Apple Intelligence</b>：Siri や Apple Intelligence に予定を聞いて、すばやく確認できます。</p>',
       '<p><b>Siri와 Apple Intelligence</b>: Siri나 Apple Intelligence에게 일정을 물어보고 빠르게 확인할 수 있어요.</p>'),
  '<p><b>公開分享</b>：支援把旅程公開分享給所有人，方便你跟全世界的旅行者分享你的行程安排。公開分享只會分享行程標題、地點、時間安排，不會公開行程描述、附件與待辦清單。</p>':
      ('<p><b>Public sharing</b>: make a trip public so travelers anywhere can see your plan. Only event titles, places and times are shared — never descriptions, files or to-do lists.</p>',
       '<p><b>公開共有</b>：旅程を誰でも見られるように公開して、世界中の旅行者とプランを共有できます。公開されるのは予定のタイトル・場所・時間だけ。予定のメモ・添付・やることリストは公開されません。</p>',
       '<p><b>공개 공유</b>: 여행을 누구나 볼 수 있게 공개해 전 세계 여행자와 일정을 나눌 수 있습니다. 공개되는 것은 일정 제목, 장소, 시간뿐이며, 일정 설명·첨부·할 일 목록은 공개되지 않습니다.</p>'),
  # AI
  '手機與電腦在同一個 Wi-Fi 底下時，可以直接用 MCP 連接 TripEZGo App，請 AI Agent 幫你把旅程安排好。':
      ('When your phone and computer are on the same Wi-Fi, connect your AI agent to the TripEZGo app over MCP and have it plan the trip for you.',
       'iPhone とパソコンが同じ Wi-Fi につながっていれば、MCP で TripEZGo アプリに接続して、AI エージェントに旅程を組んでもらえます。',
       'iPhone과 컴퓨터가 같은 Wi-Fi에 연결되어 있으면, MCP로 TripEZGo 앱에 접속해 AI 에이전트에게 여행 일정을 맡길 수 있습니다.'),
  # 方案
  '免費就能用，付費更好用。': ('Free to use, better with Premium.', '無料でしっかり使えて、有料ならもっと便利に。', '무료로도 충분히, Premium이면 더 편하게.'),
  'Widget、Siri': ('Widgets, Siri', 'ウィジェット・Siri', '위젯, Siri'),
  '為什麼要收費': ('Why charge at all?', 'なぜ有料なのか', '왜 유료인가요'),
  '定價是我最苦惱的一件事：這個工具的出發點，是希望真的能幫到自由行的旅行者；但現實上也必須要有收費，才能走得更遠。':
      ('Pricing was the thing I agonized over most. I built this to genuinely help people who travel on their own — but realistically, it has to earn something to keep going.',
       '値段をどうするかは、いちばん悩んだところです。もともと個人旅行をする人の役に本当に立ちたくて作ったツールですが、続けていくには、やはり収益も必要です。',
       '가격을 정하는 일이 가장 고민스러웠습니다. 자유여행을 하는 사람들에게 정말 도움이 되고 싶어서 만든 도구지만, 현실적으로 계속 이어 가려면 수익도 필요합니다.'),
  '目前的成本：每月 200 美元的 AI 費用、每年 99 美元的 Apple Developer Program，加上每週約 30 小時的個人開發時間。':
      ('What it costs right now: US$200 a month for AI, US$99 a year for the Apple Developer Program, plus about 30 hours a week of my own time building it.',
       '今かかっているコスト：AI に月 200 ドル、Apple Developer Program に年 99 ドル、それに週およそ 30 時間の個人開発の時間。',
       '현재 드는 비용: AI에 매달 200달러, Apple Developer Program에 매년 99달러, 그리고 매주 30시간 정도의 개인 개발 시간.'),
  '所以 TripEZGo 還是以「免費就能用、付費更好用」為出發點，免費版與 Premium 只有這幾項差異：無廣告、旅程數（免費版同時只能擁有 3 趟，包含垃圾桶）、每趟旅伴（免費版 3 位）、即時動態、Apple／Google 行事曆整合。Premium 提供週訂閱、月訂閱、年訂閱與終身買斷。':
      ('So TripEZGo starts from “free to use, better with Premium.” Free and Premium differ in just these ways: no ads, the number of trips (Free can only own 3 trips at a time, trash included), companions per trip (3 on Free), Live Activity, and Apple / Google Calendar integration. Premium comes as a weekly, monthly or yearly subscription, or a lifetime purchase.',
       'だから TripEZGo は「無料でしっかり使えて、有料ならもっと便利に」が基本です。無料版と Premium の違いはこれだけ：広告なし、旅行の数（無料版は同時に所有できるのは 3 件まで。ゴミ箱の中も含みます）、旅行ごとの旅の仲間（無料版は 3 人）、ライブアクティビティ、Apple／Google カレンダー連携。Premium には週・月・年のサブスクリプションと、買い切りがあります。',
       '그래서 TripEZGo는 ‘무료로도 충분히, Premium이면 더 편하게’를 기본으로 합니다. 무료 버전과 Premium의 차이는 이것뿐입니다: 광고 없음, 여행 수(무료 버전은 동시에 3개까지만 보유 가능, 휴지통 포함), 여행마다 동행(무료 버전은 3명), 라이브 액티비티, Apple/Google 캘린더 연동. Premium은 주간·월간·연간 구독과 평생 구매로 제공됩니다.'),
  # 開發背景
  '背景故事': ('Backstory', '開発ストーリー', '개발 이야기'),
  # ── 藍圖（使用者 2026-10-13：橫向時間軸，從「關於」搬出來） ──
  '藍圖': ('Roadmap', 'ロードマップ', '로드맵'),
  '從一張設計稿，': ('From one design', '一枚のデザインから、', '한 장의 디자인에서'),
  '走到下一站': ('to the next stop', '次の駅へ', '다음 정거장까지'),
  '做完的、正在做的、接下來要做的，都排在這條路線上。': ('What’s done, what’s in progress and what’s next — all on one route.', '終わったこと、進めていること、これからのこと。ぜんぶこの路線の上に。', '끝낸 것, 하고 있는 것, 앞으로 할 것이 모두 이 노선 위에 있어요.'),
  '上一個里程碑': ('Previous milestone', '前のマイルストーン', '이전 마일스톤'),
  '下一個里程碑': ('Next milestone', '次のマイルストーン', '다음 마일스톤'),
  '已完成': ('Done', '完了', '완료'),
  '即將推出': ('Coming soon', 'まもなく公開', '곧 출시'),
  '進行中': ('In progress', '開発中', '진행 중'),
  '時程未定': ('No date yet', '時期未定', '일정 미정'),
  '構想與地基': ('Groundwork', '構想と土台', '구상과 기반'),
  '和 AI 一起規劃架構': ('Planning the architecture with AI', 'AI と一緒に設計を計画', 'AI와 함께 구조 설계'),
  '行事曆核心': ('The calendar core', 'カレンダーの核', '캘린더의 핵심'),
  '時間軸行事曆': ('Timeline calendar', 'タイムラインカレンダー', '타임라인 캘린더'),
  '拖曳改時間、長按新增': ('Drag to reschedule, long-press to add', 'ドラッグで時間変更、長押しで追加', '끌어서 시간 변경, 길게 눌러 추가'),
  '路程（交通）': ('Travel legs between events', '移動（交通）', '이동(교통)'),
  '行程附件': ('Event files', '予定の添付', '일정 첨부'),
  '總覽、地圖、筆記': ('Overview, Map, Notes', '概要・地図・メモ', '한눈에 보기, 지도, 메모'),
  '雲端與系統整合': ('Cloud and system integration', 'クラウドとシステム連携', '클라우드와 시스템 연동'),
  '即時動態、Widget': ('Live Activity, widgets', 'ライブアクティビティ・ウィジェット', '라이브 액티비티, 위젯'),
  'Apple 行事曆整合': ('Apple Calendar integration', 'Apple カレンダー連携', 'Apple 캘린더 연동'),
  '旅程範本、行前提醒': ('Trip templates, pre-trip reminders', '旅行テンプレート・出発前リマインダー', '여행 템플릿, 출발 전 알림'),
  '完整體驗成形': ('The full experience takes shape', '体験がひととおり揃う', '전체 경험이 갖춰지다'),
  '日文萬用句': ('Japanese travel phrases', '日本語の旅行フレーズ', '일본어 여행 회화'),
  '地圖標記、外部導航': ('Map markers, hand-off to map apps', '地図マーカー・外部ナビ', '지도 마커, 외부 내비게이션'),
  'Siri 與 Spotlight': ('Siri and Spotlight', 'Siri と Spotlight', 'Siri와 Spotlight'),
  '深色模式': ('Dark mode', 'ダークモード', '다크 모드'),
  '官網上線': ('Website goes live', '公式サイト公開', '공식 웹사이트 오픈'),
  '排程進階': ('Smarter scheduling', 'スケジュールをもっと柔軟に', '더 유연한 일정 관리'),
  '待排行程': ('Unscheduled events', '未定の予定', '미정 일정'),
  '每日起點與終點': ('Daily start and end points', '毎日の起点と終点', '매일의 출발점과 도착점'),
  '提前／延後': ('Shift earlier / later', '前倒し／後ろ倒し', '앞당기기/미루기'),
  '多組交通方案': ('Multiple route options', '複数の移動プラン', '여러 이동 방안'),
  '大眾運輸班次': ('Transit departures', '公共交通の便', '대중교통 시간표'),
  '走向國際、走進旅途': ('Going global, going on the road', '世界へ、そして旅の途中へ', '세계로, 여행길 위로'),
  '六種語言': ('Six languages', '6 言語に対応', '6개 언어'),
  '即時動態「移動中」': ('“On the move” Live Activity', 'ライブアクティビティ「移動中」', '라이브 액티비티 ‘이동 중’'),
  '跨午夜行程': ('Events past midnight', '日付をまたぐ予定', '자정을 넘기는 일정'),
  '步行導航': ('Walking directions', '徒歩ナビ', '도보 내비게이션'),
  '日本購物圖資': ('Japan shopping map data', '日本の買い物スポットデータ', '일본 쇼핑 지도 데이터'),
  '1.0.0 內部測試': ('1.0.0 beta', '1.0.0 社内テスト', '1.0.0 내부 테스트'),
  '第一個 TestFlight 版本': ('First TestFlight build', '最初の TestFlight ビルド', '첫 TestFlight 빌드'),
  '和旅伴一起': ('Together with companions', '旅の仲間と一緒に', '동행과 함께'),
  '旅伴共編': ('Co-editing with companions', '旅の仲間と共同編集', '동행과 공동 편집'),
  '購物清單、匯率換算': ('Shopping list, currency converter', '買い物リスト・為替換算', '쇼핑 목록, 환율 변환'),
  'Google 日曆整合': ('Google Calendar integration', 'Google カレンダー連携', 'Google 캘린더 연동'),
  '邀請連結': ('Invite links', '招待リンク', '초대 링크'),
  '私人筆記': ('Private notes', 'プライベートメモ', '비공개 메모'),
  '旅途中在一起': ('Together on the road', '旅の途中も一緒に', '여행 중에도 함께'),
  '旅伴位置共享': ('Location sharing with companions', '旅の仲間と位置情報を共有', '동행과 위치 공유'),
  '抵達提醒、鎖定畫面導航': ('Arrival alerts, Lock Screen navigation', '到着通知・ロック画面ナビ', '도착 알림, 잠금 화면 내비게이션'),
  '即時同步': ('Real-time sync', 'リアルタイム同期', '실시간 동기화'),
  '唯讀旅程': ('Read-only trips', '閲覧専用の旅行', '읽기 전용 여행'),
  '支援 iOS 16.2': ('iOS 16.2 support', 'iOS 16.2 に対応', 'iOS 16.2 지원'),
  '上架衝刺': ('Sprint to launch', 'リリースへのラストスパート', '출시 막바지'),
  'Widget 選旅程': ('Pick a trip for each widget', 'ウィジェットで旅行を選択', '위젯에서 여행 선택'),
  '單趟匯出匯入': ('Export / import a single trip', '旅行ごとの書き出し・読み込み', '여행별 내보내기/가져오기'),
  '公開分享旅程連結': ('Public trip links', '旅行の公開リンク', '여행 공개 링크'),
  '送審': ('Submitted for review', '審査に提出', '심사 제출'),
  '旅程時區、先選地點再填行程': ('Trip time zones, pick the place first', '旅行のタイムゾーン、場所から予定を作成', '여행 시간대, 장소부터 고르는 일정 입력'),
  '離線地名資料庫': ('Offline place-name database', 'オフライン地名データベース', '오프라인 지명 데이터베이스'),
  '行事曆縮放、掃描 QR Code': ('Calendar zoom, QR scanner', 'カレンダーのズーム・QR スキャン', '캘린더 확대/축소, QR 코드 스캔'),
  '筆記 @ 提及': ('@-mentions in notes', 'メモで @ メンション', '메모에서 @ 멘션'),
  '連接電腦上的 AI': ('Connect an AI on your computer', 'パソコンの AI と連携', '컴퓨터의 AI와 연결'),
  '多人同時編輯不互相蓋掉': ('Simultaneous edits no longer overwrite each other', '同時に編集しても上書きされない', '동시에 편집해도 서로 덮어쓰지 않음'),
  '分享改版、智慧預選類型': ('Redesigned sharing, smart event-type preselect', '共有をリニューアル、予定タイプの自動選択', '공유 개편, 일정 유형 자동 선택'),
  '從任何 App 收集旅行靈感': ('Collect travel inspiration from any app', 'どのアプリからでも旅のアイデアを集める', '어떤 앱에서든 여행 영감 모으기'),
  '先存起來，之後再變成行程、筆記、購物或地圖標記': ('Save it now; turn it into an event, note, shopping item or map marker later', 'まず保存して、あとで予定・メモ・買い物・地図マーカーに', '먼저 저장하고, 나중에 일정·메모·쇼핑·지도 마커로'),
  '讓 iPhone 讀懂你的訂位': ('Let your iPhone read your bookings', 'iPhone が予約内容を読み取る', 'iPhone이 예약 내용을 읽어 줘요'),
  '機票、車票、住宿確認信，裝置上的 AI 幫你整理成行程': ('Flights, train tickets, hotel confirmations — on-device AI turns them into events', '航空券・乗車券・宿の確認メールを、端末上の AI が予定に整理', '항공권·승차권·숙소 확인 메일을 기기 속 AI가 일정으로 정리'),
  '接下來': ('Up next', 'これから', '다음 계획'),
  'UI／UX Rebranding': ('UI/UX rebranding', 'UI/UX のリブランディング', 'UI/UX 리브랜딩'),
  '記帳與分帳': ('Expense tracking and bill splitting', '支出の記録と割り勘', '가계부와 정산'),
  'Apple 天氣整合': ('Apple Weather integration', 'Apple 天気との連携', 'Apple 날씨 연동'),
  '筆記與附件翻譯': ('Translate notes and attachments', 'メモと添付の翻訳', '메모와 첨부 번역'),
  '1.3.0 上架': ('1.3.0 released', '1.3.0 リリース', '1.3.0 출시'),
  '1.4.0 上架': ('1.4.0 released', '1.4.0 リリース', '1.4.0 출시'),
  '支援 iPhone Duo': ('iPhone Duo support', 'iPhone Duo に対応', 'iPhone Duo 지원'),
  '按鈕、頁首與地圖控制項都讓開側邊那條狀態列，打開、闔上都好按': ('Buttons, headers and map controls stay clear of the side status bar, open or closed', 'ボタン・見出し・地図の操作が横のステータスバーを避けて、開いても閉じても押しやすく', '버튼·헤더·지도 조작이 옆쪽 상태 막대를 피해서, 펼쳐도 접어도 누르기 편해요'),
  '整個 App 更聰明': ('A smarter app, everywhere', 'アプリ全体をもっと賢く', '앱 전체를 더 똑똑하게'),
  '每個功能都加進智慧建議，少填一點、少點幾下': ('Smart suggestions in every feature, so you type and tap less', 'すべての機能にスマートな提案を。入力もタップも少なく', '모든 기능에 스마트 제안을 더해 입력도 탭도 줄여요'),
  '在 App 裡讓 AI 排行程': ('Let AI plan your trip, right in the app', 'アプリの中で AI が旅程づくり', '앱 안에서 AI가 일정 짜기'),
  '說想去哪、玩幾天，不用接電腦也能排好': ('Say where and for how long; no computer needed', '行き先と日数を伝えるだけ。パソコンは要りません', '어디로, 며칠인지만 말하면 컴퓨터 없이도 짜 줘요'),
  '串接 Apple Private Cloud Compute': ('Apple Private Cloud Compute', 'Apple Private Cloud Compute との連携', 'Apple Private Cloud Compute 연동'),
  '裝置上跑不動的 AI，交給 Apple 私有雲，資料不留存': ('Heavier AI runs on Apple’s private cloud, and your data isn’t kept', '端末で処理しきれない AI は Apple のプライベートクラウドへ。データは残りません', '기기에서 감당하기 어려운 AI는 Apple 프라이빗 클라우드로, 데이터는 남지 않아요'),
  'Android 客戶端（純享版）': ('Android app (viewer edition)', 'Android 版（閲覧版）', 'Android 앱(뷰어판)'),
  '查看旅伴分享給你的行程': ('See the trips companions share with you', '旅の仲間が共有した旅行を見る', '동행이 공유한 여행 보기'),
  # ── 關於（使用者 2026-10-12：背景故事、開發團隊；藍圖 2026-10-13 搬出去自成一區） ──
  '關於': ('About', 'このアプリについて', '소개'),
  '誰做的，': ('Who makes it,', 'つくっている人と、', '누가 만들고,'),
  '為什麼做': ('and why', 'なぜ作ったのか', '왜 만들었는지'),
  '開發團隊': ('Team', '開発チーム', '개발팀'),
  '我的遊記': ('My travel journals', '旅行記', '나의 여행기'),
  '創意發想與設計': ('Idea and design', '構想とデザイン', '아이디어와 디자인'),
  '把自己獨旅時的需求整理成一套行程規劃 App 的設計稿': ('Turning what solo trips kept needing into designs for a trip planner', '一人旅で欲しかったものを、旅程アプリのデザインにまとめる', '혼자 여행하며 필요했던 것을 여행 계획 앱 디자인으로 정리'),
  '開始開發': ('Development begins', '開発スタート', '개발 시작'),
  '1.0.0 上架 App Store': ('1.0.0 on the App Store', '1.0.0 App Store で公開', '1.0.0 App Store 출시'),
  '規劃中': ('Planned', '予定', '계획 중'),
  '一個常常獨旅的 iOS 工程師，為什麼自己做了一個旅遊規劃 App': ('Why an iOS engineer who often travels solo built his own trip planner',
                                                   'ひとり旅の多い iOS エンジニアが、旅行プランナーを自分で作った理由',
                                                   '혼자 여행을 자주 다니는 iOS 엔지니어가 여행 계획 앱을 직접 만든 이유'),
  '展開故事': ('Read the story', 'ストーリーを読む', '이야기 펼치기'),
  '背景': ('How it started', 'はじまり', '시작'),
  '<p>之前自由行都有給力的旅伴，我主要當 P 人；2023 年 9 月人生第一次獨旅去「<a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">名古屋一日快閃</a>」之後，獨旅的開關就被打開了，就像大家說的，只有 0 次跟無數次。</p>':
      ('<p>On past trips I always had great companions who did the planning, and I mostly went with the flow. Then in September 2023 I took my first-ever solo trip — <a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">a one-day dash to Nagoya</a> — and something switched on. Like people say: you either never do it, or you never stop.</p>',
       '<p>これまでの個人旅行には頼れる旅の仲間がいて、私はほぼ計画におまかせの P タイプでした。それが 2023 年 9 月、人生初のひとり旅で「<a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">名古屋日帰り弾丸旅</a>」に行ってから、ひとり旅のスイッチが入ってしまいました。よく言うとおり、0 回か、何度もか、のどちらかなんです。</p>',
       '<p>예전 자유여행에는 늘 든든한 동행이 있어서, 저는 주로 계획은 맡기고 따라다니는 P형이었습니다. 그러다 2023년 9월, 인생 첫 혼자 여행으로 <a href="https://zhgchg.li/posts/7b8a0563c157/" target="_blank" rel="noopener">나고야 당일치기</a>를 다녀온 뒤 혼자 여행의 스위치가 켜져 버렸어요. 흔히 말하듯, 0번 아니면 셀 수 없이 많이, 둘 중 하나더라고요.</p>'),
  '<p>中間又去了好幾趟：「<a href="https://zhgchg.li/posts/d78e0b15a08a/" target="_blank" rel="noopener">九州 10 日獨旅</a>」、「<a href="https://zhgchg.li/posts/31b9b3a63abc/" target="_blank" rel="noopener">山陽地區廣島岡山 6 日獨旅</a>」、「<a href="https://zhgchg.li/posts/aacd5f5cacd1/" target="_blank" rel="noopener">山陰地區島根鳥取＋姬路神戶 7 日獨旅</a>」、中部地區名古屋伊勢三重 10 日獨旅……等等。</p>':
      ("<p>Plenty more followed: <a href=\"https://zhgchg.li/posts/d78e0b15a08a/\" target=\"_blank\" rel=\"noopener\">10 days solo in Kyushu</a>, <a href=\"https://zhgchg.li/posts/31b9b3a63abc/\" target=\"_blank\" rel=\"noopener\">6 days solo in Hiroshima and Okayama</a>, <a href=\"https://zhgchg.li/posts/aacd5f5cacd1/\" target=\"_blank\" rel=\"noopener\">7 days solo through Shimane, Tottori, Himeji and Kobe</a>, 10 days solo around Nagoya, Ise and Mie… and so on.</p>",
       '<p>その後も何度も出かけました。「<a href="https://zhgchg.li/posts/d78e0b15a08a/" target="_blank" rel="noopener">九州 10 日間ひとり旅</a>」「<a href="https://zhgchg.li/posts/31b9b3a63abc/" target="_blank" rel="noopener">山陽・広島岡山 6 日間ひとり旅</a>」「<a href="https://zhgchg.li/posts/aacd5f5cacd1/" target="_blank" rel="noopener">山陰・島根鳥取＋姫路神戸 7 日間ひとり旅</a>」、中部・名古屋伊勢三重 10 日間ひとり旅……などなど。</p>',
       '<p>그 뒤로도 여러 번 떠났습니다. <a href="https://zhgchg.li/posts/d78e0b15a08a/" target="_blank" rel="noopener">규슈 10일 혼자 여행</a>, <a href="https://zhgchg.li/posts/31b9b3a63abc/" target="_blank" rel="noopener">산요 지방 히로시마·오카야마 6일 혼자 여행</a>, <a href="https://zhgchg.li/posts/aacd5f5cacd1/" target="_blank" rel="noopener">산인 지방 시마네·돗토리＋히메지·고베 7일 혼자 여행</a>, 주부 지방 나고야·이세·미에 10일 혼자 여행…… 등등.</p>'),
  '<p>不管是出發前的行程安排，還是旅行當中的掌控，自由行、獨旅一切都要靠自己；需要一個工具能記錄和追蹤這些事。我試過很多種方式，沒有一個完美符合我的需求——<b>AI 當道，加上本身就是 iOS 開發者，想一想，為什麼不自己做一款？</b></p>':
      ("<p>Planning before you leave, keeping on top of things once you're there — when you travel on your own, and especially solo, it's all on you. I needed a tool to keep track of all of it. I tried plenty of approaches, and none fit quite right. <b>With AI everywhere, and being an iOS developer myself, I thought: why not build one?</b></p>",
       '<p>出発前の計画も、旅行中の段取りも、個人旅行やひとり旅ではすべて自分次第。それを記録して追いかけられる道具が必要でした。いろいろ試しましたが、ぴったり合うものはひとつもありませんでした。<b>AI の時代だし、自分は iOS エンジニア。だったら自分で作ればいいじゃないか、と。</b></p>',
       '<p>출발 전 일정 짜기도, 여행 중 챙기기도, 자유여행과 혼자 여행은 모든 걸 스스로 해야 합니다. 이런 것들을 기록하고 따라갈 도구가 필요했어요. 여러 방법을 써 봤지만 제게 딱 맞는 건 하나도 없었습니다. <b>AI가 대세인 데다 저 자신이 iOS 개발자이니, 그렇다면 직접 만들면 되지 않을까?</b></p>'),
  'Apple 備忘錄／Obsidian／Notion／Google 文件': ('Apple Notes / Obsidian / Notion / Google Docs', 'Apple メモ／Obsidian／Notion／Google ドキュメント', 'Apple 메모/Obsidian/Notion/Google 문서'),
  'Apple 備忘錄裡的山陰關西行：每一天一則筆記，貼著地圖截圖、班次與轉乘時間':
      ("A San'in and Kansai trip in Apple Notes: one note per day, with map screenshots, departures and transfer times pasted in",
       'Apple メモの山陰・関西旅行：1日ごとに1つのメモ。地図のスクリーンショット、便と乗り換え時間を貼り付け',
       'Apple 메모로 짠 산인·간사이 여행: 하루에 메모 하나씩, 지도 스크린숏과 열차 편, 환승 시간을 붙여 넣음'),
  '這是我最一開始旅行用的規劃工具，優點是簡單好用，一打開就是富文本編輯器，可以隨意插入行程標題、圖片、附加檔案。':
      ("This is what I first planned trips with. The upside is that it's simple: open it and you're in a rich text editor, free to drop in event titles, images and attachments however you like.",
       '最初に旅行の計画に使っていたのがこれです。良いところはシンプルで使いやすいこと。開けばすぐリッチテキストエディタで、予定のタイトルや画像、ファイルを自由に入れられます。',
       '처음 여행을 계획할 때 쓰던 도구입니다. 장점은 간단하고 쓰기 쉽다는 것. 열면 바로 서식 있는 텍스트 편집기라서, 일정 제목, 이미지, 첨부 파일을 자유롭게 넣을 수 있어요.'),
  '缺點也是「隨意」這件事：沒有固定的格式，很難一眼看出整趟旅程的安排；行程一長，滾動找資料很痛苦；旅行進行中也沒辦法快速定位到目前的行程；行程如果有異動更是麻煩。另外也不支援通知、行事曆、行程地圖、Widget 等功能。':
      ("The downside is that same freedom. There's no fixed format, so it's hard to see the whole trip at a glance. Once the plan gets long, scrolling to find things is painful; on the road there's no quick way to jump to where you are now; and when plans change, it's a real hassle. And there are no notifications, calendar, trip map or widgets.",
       '悪いところも、その「自由さ」です。決まった形がないので、旅行全体の流れがひと目でつかみにくい。予定が長くなるとスクロールして探すのがつらく、旅行中も今の予定にすぐ飛べません。予定が変わったときはなおさら面倒です。通知やカレンダー、予定のマップ、ウィジェットにも対応していません。',
       '단점도 바로 그 ‘자유로움’입니다. 정해진 형식이 없어서 여행 전체의 흐름을 한눈에 보기 어렵고, 일정이 길어지면 스크롤하며 찾기가 괴롭고, 여행 중에도 지금 일정으로 바로 갈 수 없습니다. 일정이 바뀌면 더 번거롭고요. 알림, 캘린더, 일정 지도, 위젯 같은 기능도 없습니다.'),
  '體驗上，我覺得在搜集景點或排大綱的階段蠻好用的，可以快速把大致的行程記下來；但在細節安排、或是旅程進行中查看，就不太方便。':
      ("In practice, I found it great for collecting places and sketching an outline — you can get a rough plan down fast. But for working out the details, or checking things mid-trip, it's not very handy.",
       '使ってみた感想としては、行きたい場所を集めたり大まかな流れを組んだりする段階ではとても便利で、ざっくりした予定をすばやく書き留められます。でも細かい段取りや、旅行中に見返すとなると、あまり使い勝手がよくありません。',
       '써 보니, 가고 싶은 곳을 모으거나 대략적인 흐름을 짜는 단계에서는 꽤 편해서 대강의 일정을 빠르게 적어 둘 수 있었어요. 하지만 세부 일정을 짜거나 여행 중에 확인하기에는 불편했습니다.'),
  'Apple 行事曆／Google 日曆': ('Apple Calendar / Google Calendar', 'Apple カレンダー／Google カレンダー', 'Apple 캘린더/Google 캘린더'),
  'Apple 行事曆的週檢視：沖繩自由行每天的行程與交通排成一格一格的事件':
      ("Apple Calendar's week view: each day of an Okinawa trip, with plans and travel laid out as blocks of events",
       'Apple カレンダーの週表示：沖縄旅行の毎日の予定と移動が、ひとつずつの予定として並ぶ',
       'Apple 캘린더의 주 보기: 오키나와 자유여행의 날마다의 일정과 이동이 한 칸 한 칸 일정으로 놓임'),
  '<p>最近一次去「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖繩自由行</a>」，我們是用 Apple／Google 行事曆排行程。優點是規劃起來非常方便，一拖一拉一放就能建立行程，要改時間也是拖一下就好；整趟旅程一目瞭然，哪裡有空檔、哪裡待太久都能馬上知道；旅行進行中也能設定通知，馬上知道這個行程預計待多久、下一個行程是什麼，要臨時調整也很容易；也支援通知、Widget。</p>':
      ("<p>On my most recent trip, <a href=\"https://zhgchg.li/posts/2cbc121a1b7c/\" target=\"_blank\" rel=\"noopener\">Okinawa on our own</a>, we planned everything in Apple / Google Calendar. Planning is really easy: drag, drop, and the event's there; changing a time is just another drag. You can see the whole trip at a glance — where the gaps are, where you're staying too long. On the road you can set alerts, so you know right away how long you've got here and what's next, and last-minute changes are easy. Notifications and widgets work too.</p>",
       '<p>最近の「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖縄の個人旅行</a>」では、Apple／Google カレンダーで予定を組みました。良いところは計画がとても楽なこと。ドラッグして置くだけで予定ができ、時間を変えるのもドラッグひとつ。旅行全体がひと目でわかり、どこに空き時間があるか、どこで長居しすぎかもすぐわかります。旅行中も通知を設定すれば、この予定にどれだけいるか、次は何かがすぐわかり、急な変更も簡単。通知やウィジェットにも対応しています。</p>',
       '<p>가장 최근의 <a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">오키나와 자유여행</a>에서는 Apple/Google 캘린더로 일정을 짰습니다. 장점은 계획하기가 아주 편하다는 것. 끌어다 놓기만 하면 일정이 생기고, 시간을 바꿀 때도 끌기만 하면 됩니다. 여행 전체가 한눈에 보여서 어디에 빈 시간이 있는지, 어디에 너무 오래 머무는지 바로 알 수 있어요. 여행 중에도 알림을 설정하면 이 일정에 얼마나 머무는지, 다음 일정은 무엇인지 바로 알 수 있고, 갑작스러운 변경도 쉽습니다. 알림과 위젯도 지원하고요.</p>'),
  '缺點是資料分散：沒有一個總覽可以查看待辦、附件或筆記，也沒有地圖檢視。畢竟行事曆工具專注的是「事件」本身，事件彼此之間是獨立的；但旅程安排上有些資訊是跨行程的，例如車票、伴手禮清單、筆記，或是我跑完 A 行程後時間還很多，想知道其他天有哪些行程是順路的、可以改成今天去。':
      ("The downside is that things end up scattered. There's no overview of your to-dos, files or notes, and no map view. A calendar is all about the event itself, and each event stands on its own. But some trip information cuts across events: train tickets, a souvenir list, notes. Or say I finish event A with plenty of time left — I want to know which events on other days are on the way and could move to today.",
       '悪いところは、情報がばらばらになること。やることや添付、メモを見渡せる概要も、マップ表示もありません。カレンダーはあくまで一つひとつの「予定」が主役で、予定どうしは独立しています。でも旅の計画には、予定をまたぐ情報もあります。たとえば切符、おみやげリスト、メモ。あるいは A の予定を終えてまだ時間がたっぷりあるとき、ほかの日の予定で通り道にあって今日に回せるものはどれか、知りたくなります。',
       '단점은 정보가 흩어진다는 것. 할 일, 첨부, 메모를 모아 볼 개요도, 지도 보기도 없습니다. 캘린더는 어디까지나 ‘일정’ 하나하나가 주인공이고, 일정끼리는 서로 독립적이니까요. 하지만 여행 계획에는 일정을 넘나드는 정보도 있습니다. 예를 들어 승차권, 기념품 목록, 메모. 또는 A 일정을 마치고도 시간이 넉넉할 때, 다른 날 일정 중 가는 길에 있어서 오늘로 옮길 만한 게 뭔지 알고 싶어지죠.'),
  '其他旅行規劃 App': ('Other trip-planning apps', 'ほかの旅行プランニングアプリ', '다른 여행 계획 앱'),
  '也試了幾個電商集團做的旅行規劃 App，各有亮眼的功能，例如總覽看行程、直接用地點新增行程、自動安排時間、地圖功能；但體驗上我覺得都更偏向社交和電商服務，畢竟對公司來說，產品是要能變現的。':
      ("I also tried a few trip planners from big e-commerce groups. Each had standout features — an overview of your plans, adding events straight from a place, automatic scheduling, maps. But in use, they all felt geared more toward social and shopping. Fair enough: for a company, a product has to make money.",
       'EC 大手が作った旅行プランニングアプリもいくつか試しました。予定を一覧できる概要、場所からそのまま予定を追加、時間の自動割り振り、マップ機能など、それぞれ光る機能はありました。でも使ってみると、どれも SNS や EC のサービス寄りに感じました。会社にとって、プロダクトは収益化できなければならないので、当然ではあります。',
       '대형 이커머스 그룹이 만든 여행 계획 앱도 몇 가지 써 봤습니다. 일정을 한눈에 보는 개요, 장소로 바로 일정 추가, 시간 자동 배치, 지도 기능처럼 저마다 돋보이는 기능이 있었어요. 하지만 써 보니 모두 SNS와 커머스 서비스 쪽에 더 가깝게 느껴졌습니다. 회사 입장에서는 제품이 수익을 내야 하니 당연하겠지요.'),
  '所以就有了 TripEZGo——旅行規劃、旅途所需一次搞定。': ("And so there's TripEZGo — plan the trip, carry what it needs, all in one app.",
                                              'そうして生まれたのが TripEZGo。旅の計画も、旅先で要るものも、これひとつで。',
                                              '그래서 TripEZGo가 탄생했습니다. 여행 계획부터 여행길에 필요한 것까지, 앱 하나로.'),
  # 限時活動（assets/js/promo.js 放會變的字與 26 則文案；這裡是頁面上固定的字）
  '限時活動': ('Limited-time offer', '期間限定', '기간 한정'),
  '分享到社群，免費兌換一年 Premium': ('Share on social media, get a year of Premium free', 'SNS でシェアして、Premium 1 年分を無料で', 'SNS에 공유하고 Premium 1년 무료로 받기'),
  '分享到社群，': ('Share on social media,', 'SNS でシェアして、', 'SNS에 공유하고'),
  '免費兌換一年 Premium': ('get a year of Premium free', 'Premium 1 年分を無料で', 'Premium 1년 무료로'),
  '把 TripEZGo 分享給朋友，就送你一年 Premium：無廣告、旅程與旅伴不限、即時動態、行事曆整合全部打開。':
      ('Share TripEZGo with your friends and get a year of Premium: no ads, unlimited trips and travel companions, Live Activity and calendar integration, all unlocked.',
       'TripEZGo を友だちにシェアすると、Premium を 1 年分プレゼント。広告なし、旅程と旅の仲間は無制限、ライブアクティビティ、カレンダー連携がすべて使えます。',
       'TripEZGo를 친구에게 공유하면 Premium 1년을 드려요. 광고 없음, 여행과 동행 무제한, 라이브 액티비티, 캘린더 연동이 모두 열려요.'),
  # 各語主要市場的 App Store 年訂閱價（2026-10-24 量：美國、日本、韓國）
  'NT$1,290': ('$39.99', '¥6,000', '₩66,000'),
  'NT$0': ('$0', '¥0', '₩0'),
  '兌換倒數': ('Ends in', '引き換え終了まで', '교환 마감까지'),
  '複製這段文案': ('Copy this caption', 'この文章をコピー', '이 문구 복사'),
  '複製文案': ('Copy caption', '文章をコピー', '문구 복사'),
  '換一個': ('Try another', '別の文章にする', '다른 문구'),
  '分享到社群': ('Share on social media', 'SNS でシェア', 'SNS에 공유'),
  '貼文設成公開，記得留著 tripezgo.com。': ('Make the post public and keep tripezgo.com in it.', '投稿は公開にして、tripezgo.com は消さずに残してください。', '게시물은 공개로 설정하고 tripezgo.com은 지우지 마세요.'),
  '完成兌換': ('Redeem', '引き換える', '교환하기'),
  '前往 App Store 兌換': ('Redeem on the App Store', 'App Store で引き換える', 'App Store에서 교환'),
  '分享之後就能兌換。': ('You can redeem once you’ve shared.', 'シェアしたら引き換えられます。', '공유하면 교환할 수 있어요.'),
}

HEAD = {
    'en': dict(title="TripEZGo — Travel Planner & Itinerary App for iPhone and iPad",
               desc="Travel planner and itinerary app for iPhone and iPad: plan days on a calendar, map each route and co-edit with travel companions. No sign-up, works offline. Free."),
    'ja': dict(title="TripEZGo — 旅行計画・旅程表アプリ｜カレンダーで予定、旅の仲間と共同編集",
               desc="iPhone・iPad の旅行計画アプリ。カレンダーで旅程表を作り、移動はタイムラインで、旅の仲間と共同編集。登録不要・オフライン対応、無料でダウンロード。"),
    'ko': dict(title="TripEZGo — 여행 플래너 앱｜캘린더로 일정, 동행과 공동 편집",
               desc="iPhone·iPad 여행 플래너 앱. 캘린더로 일정을 짜고 이동은 타임라인으로, 동행과 함께 편집하세요. 회원가입 없이 오프라인에서도, 무료로 다운로드."),
}

def build(lang):
    i = LANGS.index(lang)
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
    if lang in ('en', 'ko'):
        # 中文標題的片段之間不需要空白，英文、韓文要：nb 片段、<em> 前面補一個
        body = re.sub(r'(?<=[^\s>])(<span class="nb">|<em>)', r' \1', body)
        body = body.replace('</span><span class="nb">', '</span> <span class="nb">')
    # 連結與語言切換
    body = body.replace('/assets/img/shots/v2/zh/', f'/assets/img/shots/v2/{lang}/')
    body = body.replace('href="/privacy.html"', f'href="/{lang}/privacy.html"').replace('href="/terms.html"', f'href="/{lang}/terms.html"')
    body = body.replace('class="brand" href="/"', f'class="brand" href="/{lang}/"')
    body = body.replace('href="/#about"', f'href="/{lang}/#about"')
    body = body.replace('href="/contact/"', f'href="/{lang}/contact/"')   # 頁尾「聯絡我們」→ 各語的聯絡頁   # 頁尾的「關於」：寫成絕對路徑，分享頁照抄頁尾也指得對
    for pid, urls in POSTS.items():
        body = body.replace(f'https://zhgchg.li/posts/{pid}/', urls[1 if lang == 'ja' else 0])
    # 頁首的語言下拉：上面顯示這一頁的語言，選單裡放另外三種——繁中排第一，其餘照母版的順序。
    # 頁尾的語言連結：這一頁的語言換成繁中，留在原位。
    zh_link = '<a class="lang" href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>'
    links = {l: f'<a class="lang" href="/{l}/" hreflang="{l}" lang="{l}">{NAMES[l]}</a>' for l in LANGS}
    assert '<summary>繁體中文</summary>' in body and all(v in body for v in links.values()), '母版頁首的語言下拉變了，這裡要跟著改'
    body = body.replace('<summary>繁體中文</summary>', f'<summary>{NAMES[lang]}</summary>', 1)
    body = body.replace('<div class="lang-list">\n          ', '<div class="lang-list">\n          ' + zh_link + '\n          ', 1)
    body = body.replace('\n          ' + links[lang], '', 1)
    body = body.replace(f'<a href="/{lang}/" hreflang="{lang}" lang="{lang}">{NAMES[lang]}</a>', '<a href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>')
    # 語言名稱本身要留原文（中文／繁體中文／日本語），上面替換後再檢查一次
    missing -= {'中文', '繁體中文', '日本語'}
    if missing:
        sys.exit(f'{lang}: 沒有對照的中文字串：\n' + '\n'.join(sorted(missing)))
    out = head + jsonld + '\n</head>\n' + body + '</body>\n</html>\n'
    open(os.path.join(ROOT, lang, 'index.html'), 'w', encoding='utf-8').write(out)
    print('wrote', lang)

used = set()
for l in LANGS:
    build(l)
# 母版已經拿掉的字串留在表裡只會誤導下一個改的人：列出來，回頭刪掉
stale = sorted(set(T) - used)
if stale:
    print('對照表裡母版已經用不到的條目：\n' + '\n'.join(stale), file=sys.stderr)

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
NAMES = {'en': 'English', 'ja': '日本語', 'ko': '한국어', 'zh-cn': '简体中文'}

T = {
  '旅行 x 音樂 ↗': ('Travel x Music ↗', '旅行 x 音楽 ↗', '여행 x 음악 ↗'),
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
  # 頁尾 A 款的分組小標（2026-11-09）
  '網站': ('Site', 'サイト', '사이트'),
  '條款': ('Legal', '規約', '약관'),
  '語言': ('Language', '言語', '언어'),
  '追蹤我們': ('Follow', 'フォロー', '팔로우'),
  '行程、路程、地圖與旅伴共編。': ('Events, legs, maps and companion co-editing.', '予定、移動、地図、旅の仲間との共同編集。', '일정, 이동, 지도, 동행과 공동 편집.'),
  '<p class="footer-produced"><a href="https://zhgchg.li/" target="_blank" rel="noopener"><picture><source srcset="/assets/img/produced-by-zhgchgli-dark.svg" media="(prefers-color-scheme: dark)"><img src="/assets/img/produced-by-zhgchgli-light.svg" width="141" height="54" alt="Produced by ZhgChg.Li"></picture></a></p>': ('<p class="footer-produced"><a href="https://en.zhgchg.li/" target="_blank" rel="noopener"><picture><source srcset="/assets/img/produced-by-zhgchgli-dark.svg" media="(prefers-color-scheme: dark)"><img src="/assets/img/produced-by-zhgchgli-light.svg" width="141" height="54" alt="Produced by ZhgChg.Li"></picture></a></p>', '<p class="footer-produced"><a href="https://jp.zhgchg.li/" target="_blank" rel="noopener"><picture><source srcset="/assets/img/produced-by-zhgchgli-dark.svg" media="(prefers-color-scheme: dark)"><img src="/assets/img/produced-by-zhgchgli-light.svg" width="141" height="54" alt="Produced by ZhgChg.Li"></picture></a></p>', '<p class="footer-produced"><a href="https://en.zhgchg.li/" target="_blank" rel="noopener"><picture><source srcset="/assets/img/produced-by-zhgchgli-dark.svg" media="(prefers-color-scheme: dark)"><img src="/assets/img/produced-by-zhgchgli-light.svg" width="141" height="54" alt="Produced by ZhgChg.Li"></picture></a></p>'),
  # hero
  'iPhone 與 iPad 旅行規劃': ('Travel planner for iPhone and iPad', 'iPhone・iPad の旅行プランナー', 'iPhone·iPad 여행 플래너'),
  '行程、路程、地圖': ('Events, legs, maps', '予定、移動、地図、', '일정, 이동, 지도,'),
  '與旅伴共編': ('and co-editing', '旅の仲間と共同編集', '동행과 공동 편집'),
  '行事曆排行程，時間軸排路程。旅途中在鎖定畫面看下一站。': ('Plan events on a calendar. Plan legs on a timeline. During the trip, see the next stop on the Lock Screen.', 'カレンダーで予定を組み、タイムラインで移動を組みます。旅程中は、ロック画面で次の目的地を確認できます。', '캘린더로 일정을 짜고, 타임라인으로 이동을 짭니다. 여행 중에는 잠금 화면에서 다음 장소를 확인하세요.'),
  '在 App Store 下載': ('Download on the App Store', 'App Store でダウンロード', 'App Store에서 다운로드'),
  '功能介紹': ('Features', '機能紹介', '기능 소개'),
  '免註冊': ('No sign-up', '登録不要', '회원가입 없음'),
  '離線可用': ('Works offline', 'オフラインで使える', '오프라인 사용 가능'),
  '免費下載': ('Free to download', '無料でダウンロード', '무료 다운로드'),
  # privacy
  '隱私與安全': ('Privacy and security', 'プライバシーと安全', '개인정보와 안전'),
  '你的旅程，': ('Your trips live', 'あなたの旅程は、', '내 여행은'),
  '只在你的裝置': ('only on your device', 'あなたの端末と', '내 기기와'),
  '和你的 iCloud': ('and in your iCloud', 'あなたの iCloud だけに', '내 iCloud에만'),
  '閱讀完整隱私權政策 →': ('Read the full privacy policy →', 'プライバシーポリシー全文を読む →', '개인정보 처리방침 전문 읽기 →'),
  '筆記': ('Notes', 'メモ', '메모'),
  # 01 安排行程
  '05 · 安排行程': ('05 · Plan events', '05 · 予定を組む', '05 · 일정 짜기'),
  '票券與待辦': ('Tickets and to-dos', 'チケットとやることを', '승차권과 할 일을'),
  '加在行程上': ('added to the event', '予定に追加', '일정에 추가'),
  '票券、訂位確認與待辦加在行程上。點附件打開。': ('Add tickets, booking confirmations and to-dos to an event. Tap a file to open it.', 'チケット、予約確認、やることを予定に追加します。添付をタップして開きます。', '승차권, 예약 확인, 할 일을 일정에 추가하세요. 첨부를 탭해서 여세요.'),
  '照片、檔案、電子車票連結': ('Photos, files and e-ticket links', '写真・ファイル・電子チケットのリンク', '사진, 파일, 전자 승차권 링크'),
  '出發前逐項打勾的待辦': ('To-dos to tick off before you leave', '出発前にチェックするやること', '출발 전에 하나씩 체크하는 할 일'),
  # 03 行事曆／時間軸
  '今天的行程與': ('Today’s events and', '今日の予定と', '오늘의 일정과'),
  '路程': ('Legs', '移動', '이동'),
  '行程、空檔與路上時間排在同一條時間軸。': ('Events, free time and travel time share one timeline.', '予定・間隔・移動時間を、1 本のタイムラインに表示します。', '일정, 빈 시간, 이동 시간을 하나의 시간 축에 배치합니다.'),
  '停留多久、空檔多少': ('How long you stay, how much time is free', '滞在時間と空き時間', '머무는 시간과 빈 시간'),
  '行事曆、時間軸隨時切換': ('Switch between calendar and timeline anytime', 'カレンダーとタイムラインをいつでも切り替え', '캘린더와 타임라인을 언제든 전환'),
  # 05 地圖
  '地圖顯示': ('The map shows', '地図が示す', '지도에 표시되는'),
  '每天的路線': ('each day’s route', '毎日のルート', '매일의 동선'),
  '行程連成路線，沿路店家標在地圖上。': ('Events join into a route. Shops along the way are marked on the map.', '予定がルートでつながります。道沿いの店も地図に表示されます。', '일정이 동선으로 이어지고, 길 위의 가게가 지도에 표시돼요.'),
  '每日路線與路程': ('Daily routes and legs', '1日のルートと移動', '날마다의 동선과 이동'),
  '標記想去的地方': ('Pin the places you want to go', '行きたい場所にマーカー', '가고 싶은 곳에 마커'),
  '日本購物店家的位置與營業狀態': ('Locations and open or closed status of stores in Japan', '日本の店舗の場所と営業状況', '일본 상점의 위치와 영업 상태'),
  '支援步行導航': ('Walking directions', '徒歩ナビ', '도보 길 안내'),
  # 04 總覽
  '02 · 總覽模式': ('02 · Overview', '02 · 概要', '02 · 개요'),
  '旅程總覽，': ('Your trip overview,', '旅の概要は、', '여행 개요,'),
  '一天一頁': ('a page a day', '1日1ページ', '하루 한 페이지'),
  '行程卡有封面與待辦，卡與卡之間是路程': ('Event cards show a cover and to-dos. Legs appear between cards.', '予定カードにカバーとやることを表示。カードのあいだに移動を表示', '일정 카드에는 커버와 할 일이, 카드 사이에는 이동이 표시됩니다'),
  # 06 旅伴
  '旅伴共編與': ('Companion co-editing and', '旅の仲間との共同編集と', '동행 공동 편집과'),
  '位置分享': ('location sharing', '位置の共有', '위치 공유'),
  '旅伴一起編行程、筆記與附件。旅途中可以分享位置。': ('Companions edit events, notes and files together. During the trip, you can share your location.', '旅の仲間と予定・メモ・添付を共同編集できます。旅程中は位置を共有できます。', '동행과 일정·메모·첨부를 함께 편집합니다. 여행 중에는 위치를 공유할 수 있습니다.'),
  # lock screen
  '不用打開 App': ('Without opening the app', 'App を開かずに', '앱을 열지 않아도'),
  '即時動態與': ('Live Activity and', 'ライブアクティビティと', '라이브 액티비티와'),
  'Widget': ('widgets', 'ウィジェット', '위젯'),
  '顯示目前行程、剩餘時間與下一站。': ('Shows the current event, time left and next stop.', '現在の予定、残り時間、次の目的地を表示します。', '현재 일정, 남은 시간, 다음 장소를 표시합니다.'),
  '即時動態': ('Live Activity', 'ライブアクティビティ', '라이브 액티비티'),
  # tools
  '靈感、筆記與': ('Inspiration, Notes and', 'インスピレーション、メモ、', '영감, 메모,'),
  
  '匯率換算': ('Currency', '為替換算', '환율 변환'),
  '購物清單': ('Shopping list', '買い物リスト', '쇼핑 목록'),
  '資料': ('Library', '資料', '자료'),
  '工具': ('Tools', 'ツール', '도구'),
  '主頁小工具': ('Home cards', 'ホームのウィジェット', '홈 위젯'),
  # 資料（2026-11-08 改名，主頁小工具自成下一區）
  '右上的「工具」有 QR Code 掃描與匯率換算。': ('The Tools button at the top right has QR code scanning and currency conversion.', '右上の「ツール」に、QR コードのスキャンと為替換算があります。', '오른쪽 위 ‘도구’에 QR 코드 스캔과 환율 계산이 있습니다.'),
  # 主頁小工具（#home-widgets，2026-11-08）：名稱與說明照 App 字串（WidgetCards.json、Home.json）
  '主頁可放': ('Home holds', 'ホームに置けるのは', '홈에 둘 수 있는 것은'),
  '14 種小工具': ('14 cards', '14 種類のウィジェット', '위젯 14가지'),
  '長按可新增、移動小工具，或更改尺寸。每趟旅程各有一份。點一個小工具，預覽它在主頁的樣子。': ('Touch and hold to add a card, move a card or change its size. Each trip has its own layout. Tap a card to preview it on Home.', '長押しでウィジェットの追加・移動・サイズ変更ができます。配置は旅程ごとに保存されます。ウィジェットをタップすると、ホームでの見た目をプレビューできます。', '길게 눌러 위젯을 추가·이동하거나 크기를 바꿉니다. 배치는 여행마다 따로 저장됩니다. 위젯을 누르면 홈에서의 모습을 미리 볼 수 있습니다.'),
  '<span class="hw-name">總覽</span>': ('<span class="hw-name">Overview</span>', '<span class="hw-name">概要</span>', '<span class="hw-name">개요</span>'),
  '<span class="hw-name">靈感</span>': ('<span class="hw-name">Inspiration</span>', '<span class="hw-name">インスピレーション</span>', '<span class="hw-name">영감</span>'),
  '<span class="hw-name">匯率換算</span>': ('<span class="hw-name">Currency converter</span>', '<span class="hw-name">為替換算</span>', '<span class="hw-name">환율 계산기</span>'),
  '<span class="hw-name">QR Code</span>': ('<span class="hw-name">QR Code</span>', '<span class="hw-name">QR コード</span>', '<span class="hw-name">QR 코드</span>'),
  '天氣': ('Weather', '天気', '날씨'),
  '步數': ('Steps', '歩数', '걸음 수'),
  '行程': ('Agenda', '予定', '일정'),
  '附件': ('Files', '添付', '첨부'),
  '待辦清單': ('To-Dos', 'やることリスト', '할 일 목록'),
  '旅程': ('Trips', '旅程', '여행'),
  '檢視筆記': ('Note', 'メモを表示', '메모 보기'),
  '筆記列表': ('Note List', 'メモ一覧', '메모 목록'),
  '小・中・大': ('S · M · L', '小・中・大', 'S · M · L'),
  '中・大': ('M · L', '中・大', 'M · L'),
  '小・中': ('S · M', '小・中', 'S · M'),
  '<span class="hw-sz">小</span>': ('<span class="hw-sz">S</span>', '<span class="hw-sz">小</span>', '<span class="hw-sz">S</span>'),
  '小': ('Small', '小', '작게'),
  '中': ('Medium', '中', '보통'),
  '大': ('Large', '大', '크게'),
  '尺寸': ('Size', 'サイズ', '크기'),
  '這趟旅程的總覽筆記。': ('The Overview note of this trip.', 'この旅程の概要メモ。', '이 여행의 개요 메모.'),
  '這趟旅程每天的天氣，依當天的旅程地點。出發前 10 天內是預報，更遠是往年平均。點一天看詳情。': ('Daily weather for this trip, for the trip place of each day. Within 10 days before departure, it is a forecast. Further out, it is the average of past years. Tap a day for details.', 'この旅程の毎日の天気を、その日の旅程の場所で表示します。出発の 10 日前以内は予報、それより先は例年の平均です。日をタップすると詳細を表示します。', '이 여행의 매일 날씨를 그날의 여행 장소 기준으로 표시합니다. 출발 10일 전 이내는 예보, 그보다 먼 날은 예년 평균입니다. 날짜를 누르면 자세히 볼 수 있습니다.'),
  '旅途中每天的步數、步行距離與爬樓層數。從 Apple 健康讀取，只留在你的裝置上。': ('Steps, walking distance and flights climbed for each day of the trip. Read from Apple Health. Stays on your device.', '旅程中の毎日の歩数、歩行距離、上った階数。Apple のヘルスケアから読み取り、データはこの端末にだけ残ります。', '여행 중 하루 걸음 수, 걸은 거리, 오른 층수. Apple 건강에서 읽으며, 데이터는 내 기기에만 남습니다.'),
  '旅程中的目前行程、倒數與下一站，內容與鎖定畫面的即時動態相同。': ('Current event, countdown and next stop during a trip. Same as the Live Activity on the Lock Screen.', '旅程中の現在の予定、カウントダウン、次の目的地。ロック画面のライブアクティビティと同じ内容です。', '여행 중 현재 일정, 카운트다운, 다음 장소를 보여줘요. 잠금 화면 라이브 액티비티와 내용이 같아요.'),
  '目前的行程、下一站，以及今天還剩幾站。': ('The current event, the next stop and the number of stops left today.', '現在の予定、次の目的地、今日の残り件数。', '현재 일정, 다음 장소, 오늘 남은 장소 수.'),
  '今天要出示的附件，以及隨身文件。': ('Files to show today, and files to carry throughout the trip.', '今日見せる添付と、持ち歩く書類。', '오늘 보여줄 첨부 파일과 늘 휴대하는 서류.'),
  '顯示未完成的待辦，可在這裡打勾。': ('Open to-dos. Tick them off here.', '未完了のやること。ここでチェックできます。', '끝내지 않은 할 일을 표시합니다. 여기서 바로 체크할 수 있습니다.'),
  '要買的項目，以及要在哪一站買。可在這裡打勾。': ('Items to buy and the stop to buy them at. Tick them off here.', '買うものと、買う場所。ここでチェックできます。', '살 항목과 살 장소. 여기서 바로 체크할 수 있습니다.'),
  '顯示上次換算的結果。沒有網路時，用上一次的匯率。': ('Shows the last conversion. Without a network, it uses the last rate.', '前回の換算結果を表示します。ネットワークがないときは、前回のレートを使います。', '지난번 환율 계산 결과를 표시합니다. 인터넷이 없으면 지난번 환율을 사용합니다.'),
  '下一趟旅程的出發日，或目前是第幾天。': ('The departure date of the next trip, or the day of the current trip.', '次の旅程の出発日、または現在何日目か。', '다음 여행의 출발일 또는 이번 여행의 며칠째.'),
  '在主頁顯示一則筆記。': ('Shows one note on Home.', 'ホームにメモを 1 件表示します。', '메모 하나를 홈에 표시합니다.'),
  '一趟旅程的筆記，最近修改的在前。': ('The notes of one trip, most recently changed first.', '1 つの旅程のメモを、新しく更新した順に表示します。', '한 여행의 메모를 최근 수정순으로 표시합니다.'),
  '未讀靈感的數量，以及最新幾則靈感。點一則開啟。': ('The number of unread inspirations, and the latest few. Tap one to open it.', '未読のインスピレーションの件数と、最新の数件。タップすると開きます。', '읽지 않은 영감 수와 최근 영감. 하나를 누르면 열립니다.'),
  '打開掃描器，掃描網址、文字或旅程的共編邀請。掃描紀錄，旅伴也看得到。': ('Opens the scanner for links, text or trip co-editing invites. Companions also see the scan history.', 'スキャナを開き、URL、テキスト、旅程の共同編集の招待を読み取ります。スキャン履歴は旅の仲間にも表示されます。', '스캐너를 열어 링크, 텍스트, 여행 공동 편집 초대를 스캔합니다. 스캔 기록은 동행에게도 보입니다.'),
  '共 14 種，尺寸有小、中、大。免費版只有一頁，Premium 可排多頁。': ('14 cards in small, medium and large. The free version has one page. Premium allows more pages.', '全 14 種類。サイズは小・中・大。無料版は 1 ページ、Premium は複数ページを使えます。', '모두 14가지이며 크기는 작게·보통·크게입니다. 무료 버전은 한 페이지, Premium은 여러 페이지를 쓸 수 있습니다.'),
  '主頁小工具（天氣、步數、行程、待辦、匯率換算、QR Code 等）': ('Home cards (weather, steps, agenda, to-dos, currency converter, QR code and more)', 'ホームのウィジェット（天気・歩数・予定・やること・為替換算・QR コードなど）', '홈 위젯(날씨, 걸음 수, 일정, 할 일, 환율 계산기, QR 코드 등)'),
  '資料（靈感、筆記、購物清單）': ('Library (inspiration, notes, shopping list)', '資料（インスピレーション・メモ・買い物リスト）', '자료(영감, 메모, 쇼핑 목록)'),
  '靈感收集': ('Collect inspiration', 'インスピレーションを集める', '영감 모으기'),
  '分享進來先存著，想排再變成行程': ('Share it in to save it. Turn it into an event later', '共有して先に保存。予定に組むときに予定へ変換', '공유로 먼저 저장하고, 일정에 넣을 때 일정으로 바꿔요'),
  '靈感：從其他 App 分享進來的網頁、地圖與貼文，標著未讀與未關聯，資料分頁右上是通知鈴鐺': ('Inspiration: pages, maps and posts shared in from other apps, marked unread and not added, with the notification bell at the top right of the Library', 'インスピレーション：ほかの App から共有されたページ・地図・投稿。未読と未関連の印つきで、資料タブの右上は通知のベル', '영감: 다른 앱에서 공유해 온 웹페이지·지도·게시물. 읽지 않음·미연결 표시가 붙고, 자료 탭 오른쪽 위는 알림 벨'),
  '<li><b>靈感</b>：Safari、地圖、社群分享進來的內容存在這裡，可以排成行程，或存成筆記、購物清單。</li>': ('<li><b>Inspiration</b>: Items you share from Safari, Maps and social apps are saved here. Plan them as events, or save them as notes or shopping items.</li>', '<li><b>インスピレーション</b>：Safari・地図・SNS から共有した内容をここに保存します。予定にしたり、メモや買い物リストに保存したりできます。</li>', '<li><b>영감</b>: Safari·지도·SNS에서 공유한 내용이 여기에 저장됩니다. 일정으로 짜거나 메모·쇼핑 목록으로 저장할 수 있습니다.</li>'),
  # AI
  '讓 AI': ('Let AI', 'AI に', 'AI에게'),
  '幫你排行程': ('plan it for you', '予定を組んでもらう', '일정을 맡기세요'),
  '內建 MCP，連接你的 AI Agent。說「幫我排京都第二天」，行程直接寫進旅程。': ('Built-in MCP connects your AI agent. Say “Plan day two in Kyoto for me” and the events are added to the trip.', 'MCP を内蔵。AI エージェントを接続して「京都の 2 日目を組んで」と伝えると、予定が旅程に追加されます。', 'MCP 내장. AI 에이전트를 연결하고 “교토 둘째 날 일정 짜 줘”라고 말하면 일정이 여행에 추가됩니다.'),
  # plans
  '免費開始，': ('Start free,', '無料ではじめて、', '무료로 시작하고,'),
  '需要再升級': ('upgrade when you need to', '必要なときにアップグレード', '필요할 때 업그레이드'),
  '免費版': ('Free', '無料版', '무료 버전'),
  # 1.6.0 主頁
  '主頁': ('Home', 'ホーム', '홈'),
  
  '小工具自己排': (' cards, arranged by you', 'のウィジェットを自由に配置', ' 위젯을 직접 배치'),
  '即時動態、待辦、匯率、總覽，長按可移動。': ('Live Activity, to-dos, currency and overview. Touch and hold to move.', 'ライブアクティビティ・やること・為替・概要。長押しで移動できます。', '라이브 액티비티, 할 일, 환율, 개요를 길게 눌러 옮길 수 있어요.'),
  '封面顯示出發倒數，旅途中顯示第幾天': ('The cover shows the countdown to departure, and the day number during the trip', 'カバーに出発までのカウントダウンを表示し、旅程中は何日目かを表示', '커버에 출발 카운트다운을 표시하고, 여행 중에는 며칠째인지 표시'),
  '長按進入編輯，拖一張小工具換位置': ('Press and hold to edit, then drag a card to a new spot', '長押しで編集に入り、ウィジェットをドラッグして並べ替え', '길게 눌러 편집하고, 위젯을 끌어 위치 바꾸기'),
  '小工具可分多頁，左右滑動切換': ('Cards can have several pages. Swipe sideways to switch', 'ウィジェットは複数ページに分けられ、左右にスワイプして切り替え', '위젯을 여러 페이지로 나누고 좌우로 밀어 전환'),
  '主頁：封面顯示山陽 6 日的第 1 天，下面是即時動態、今日待辦、匯率換算與總覽小工具': ('Home: the cover shows day 1 of the 6-day Sanyo trip, with Live Activity, today’s to-dos, currency and overview cards below', 'ホーム：カバーに山陽 6 日の 1 日目、その下にライブアクティビティ・今日のやること・為替換算・概要のウィジェット', '홈: 커버에 산요 6일 여행의 1일째, 그 아래에 라이브 액티비티·오늘 할 일·환율 변환·개요 위젯'),
  '主頁小工具頁數': ('Home card pages', 'ホームのウィジェットのページ数', '홈 위젯 페이지 수'),
  '1 頁': ('1 page', '1 ページ', '1페이지'),
  '旅程數': ('Trips', '旅程の数', '여행 수'),
  '同時只能擁有 3 趟': ('3 at a time', '同時に3件', '동시에 3개까지'),
  '包含垃圾桶': ('trash included', 'ゴミ箱込み', '휴지통 포함'),
  '不限': ('Unlimited', '無制限', '무제한'),
  '每趟旅伴': ('Companions per trip', '旅行ごとの旅の仲間', '여행마다 동행'),
  '3 位': ('3', '3 人', '3명'),
  '廣告': ('Ads', '広告', '광고'),
  '有': ('Yes', 'あり', '있음'),
  '無廣告': ('No ads', '広告なし', '광고 없음'),
  '行事曆／時間軸、地圖、總覽': ('Calendar / timeline, map, overview', 'カレンダー／タイムライン・地図・概要', '캘린더/타임라인, 지도, 개요'),
  '附件、待辦、路程與班次備案': ('Files, to-dos, legs and backup departures', '添付・やること・移動と代わりの便', '첨부, 할 일, 이동과 대체 편'),
  '旅伴共編、位置分享': ('Companion co-editing, location sharing', '旅の仲間との共同編集・位置の共有', '동행 공동 편집, 위치 공유'),
  'iCloud 備份同步': ('iCloud Backup &amp; Sync', 'iCloud バックアップと同期', 'iCloud 백업 및 동기화'),
  '匯入匯出': ('Import and export', '取り込み・書き出し', '가져오기·내보내기'),
  'AI Agent 整合': ('AI agent integration', 'AI エージェント連携', 'AI 에이전트 연동'),
  'Apple／Google 行事曆整合': ('Apple / Google Calendar integration', 'Apple／Google カレンダー連携', 'Apple/Google 캘린더 연동'),
  'Premium 提供週、月、年自動續訂或終身方案，可隨時在 App Store 的訂閱設定取消。': ('Premium is a weekly, monthly or yearly subscription that renews automatically, or a lifetime plan. Cancel at any time in your App Store subscription settings.', 'Premium は、週・月・年の自動更新サブスクリプション、または買い切りです。App Store のサブスクリプション設定からいつでも解約できます。', 'Premium은 주간·월간·연간 자동 갱신 구독 또는 평생 구매로 이용할 수 있으며, App Store의 구독 설정에서 언제든 해지할 수 있습니다.'),
  '不支援': ('Not included', '対象外', '미포함'),
  '支援': ('Included', '対象', '포함'),
  # alt text
  '地圖模式：第 2 天在宮島，行程依序連成步行路線，嚴島神社的卡片上有步行導航鈕': ("Map: day 2 on Miyajima, with events joined into a walking route and Itsukushima Shrine's card showing a walking-directions button", '地図：2日目の宮島。予定が徒歩ルートでつながり、厳島神社のカードに徒歩ナビのボタン', '지도: 미야지마에서의 2일차. 일정이 도보 동선으로 이어지고, 이쓰쿠시마 신사 카드에 도보 길 안내 버튼'),
  '行事曆模式：山陽 6 日的第 2 天，行程沿時間排開，早餐與渡輪之間標著 JR 山陽本線的班次':
      ('Calendar: day 2 of the six-day San\'yō trip, events laid out by time, with the JR San\'yō Line departure between breakfast and the ferry',
       'カレンダー：山陽 6 日間の2日目。予定が時間順に並び、朝食とフェリーのあいだに JR 山陽本線の便',
       '캘린더: 산요 6일 여행의 2일차. 일정이 시간순으로 놓이고, 아침 식사와 페리 사이에 JR 산요 본선 열차 편'),
  '總覽：山陽 6 日的第 1 天，行程卡帶封面，卡上掛著待辦，卡與卡之間標著路程': ("Overview: day 1 of the six-day San'yō trip, event cards with covers and to-dos, and the legs marked between them", '概要：山陽 6 日間の1日目。カバー付きの予定カードとやること、カードのあいだに移動', '개요: 산요 6일 여행의 1일째. 커버와 할 일이 붙은 일정 카드와 그 사이의 이동'),
  '路程：三個班次並排，選中的那一班顯示發車、抵達與候車時間': ('Leg: three departures side by side. The selected one shows departure, arrival and waiting time', '移動：3つの便が並び、選んだ便の発車・到着・待ち時間を表示', '이동: 세 개의 편이 나란히 놓이고, 선택한 편에 출발·도착·대기 시간 표시'),
  '旅程共編：分享開關、邀請連結與 QR Code，下方列出旅伴': ('Trip sharing: the sharing switch, invite link and QR code, with companions listed below',
                                                   '旅程の共同編集：共有スイッチ、招待リンクと QR コード、その下に旅の仲間',
                                                   '여행 공동 편집: 공유 스위치, 초대 링크와 QR 코드, 아래에 동행 목록'),
  '主畫面 Widget：今天的行程與匯率換算': ("Home Screen widgets: today's events and a currency converter", 'ホーム画面のウィジェット：今日の予定と為替換算', '홈 화면 위젯: 오늘 일정과 환율 변환'),
  '筆記：圖文筆記，@ 連到行程，日文句子可以朗讀': ('Notes: text and photos, @ links to events, and Japanese phrases that can be read aloud',
                                          'メモ：写真と文字のメモ。@ で予定にリンクし、フレーズは読み上げも',
                                          '메모: 사진과 글, @로 일정에 연결하고, 일본어 문장은 읽어 주기도'),
  '主頁上的匯率換算小工具：顯示 $100.00 約等於 ¥486，點一下就能開始換算': ('The Currency Converter card on Home: $100.00 shows as about ¥486, tap to start converting', 'ホームの為替換算ウィジェット：$100.00 が約 ¥486 と表示され、タップで換算を開始', '홈의 환율 변환 위젯: $100.00이 약 ¥486으로 표시되고, 탭하면 바로 환산 시작'),
  '購物清單：待購、已購、不買了的件數，商品依分類排成照片格': ('Shopping list: counts of to-buy, bought and skipped items, with items in a photo grid by category',
                                                    '買い物リスト：購入予定・購入済み・やめたの件数と、カテゴリ別の写真グリッド',
                                                    '쇼핑 목록: 살 것·구매함·안 사기 개수와 카테고리별 사진 그리드'),
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
  '不用帳號。我們沒有自己的伺服器，看不到你的資料。沒有網路也能查看與編輯。': ('No account. We do not run a server of our own and cannot see your data. You can view and edit without a network.', 'アカウントは不要です。自社のサーバーはなく、データを見ることはできません。ネットワークがなくても、見ることも編集もできます。', '계정이 필요 없습니다. 자체 서버가 없어 여러분의 데이터를 볼 수 없습니다. 인터넷이 없어도 보고 편집할 수 있습니다.'),
  '<p><b>隱私與資料安全</b>：我們沒有自己的伺服器，看不到你的旅程。資料只存在你的裝置與 iCloud，備份同步與旅程共編都走 iCloud。</p>': ('<p><b>Privacy and data security</b>: We do not run a server of our own and cannot see your trips. Your data is only on your device and in iCloud. Backup &amp; Sync and trip co-editing both use iCloud.</p>', '<p><b>プライバシーとデータの安全</b>：自社のサーバーはなく、あなたの旅程を見ることはできません。データはあなたの端末と iCloud にだけあります。バックアップと同期も、旅程の共同編集も、iCloud を使います。</p>', '<p><b>개인정보와 데이터 보안</b>: 자체 서버가 없어 여러분의 여행을 볼 수 없습니다. 데이터는 내 기기와 iCloud에만 있습니다. 백업 및 동기화와 여행 공동 편집 모두 iCloud를 사용합니다.</p>'),
  '附件與圖片也只存在你的裝置與 iCloud。可以匯出備份檔，或用 iCloud 備份同步。': ('Files and images are also only on your device and in iCloud. You can export a backup file, or use iCloud Backup &amp; Sync.', '添付と画像も、端末と iCloud にだけ保存されます。バックアップファイルを書き出すか、iCloud のバックアップと同期を使えます。', '첨부와 이미지도 내 기기와 iCloud에만 저장됩니다. 백업 파일을 내보내거나 iCloud 백업 및 동기화를 사용할 수 있습니다.'),
  '<p><b>離線可用</b>：沒有網路時，可以查看與編輯所有資料。開啟 iCloud 備份同步或共編時，連上網路後同步。</p>': ('<p><b>Works offline</b>: Without a network, you can view and edit all your data. When iCloud Backup &amp; Sync or co-editing is on, changes sync after you connect to a network.</p>', '<p><b>オフラインで使える</b>：ネットワークがなくても、すべてのデータを見て編集できます。iCloud のバックアップと同期や共同編集をオンにしている場合は、ネットワークに接続したあとに同期します。</p>', '<p><b>오프라인 사용</b>: 인터넷이 없어도 모든 데이터를 보고 편집할 수 있습니다. iCloud 백업 및 동기화나 공동 편집을 켜 두었다면 인터넷에 연결된 뒤에 동기화됩니다.</p>'),
  '資料流向：資料存在這台 iPhone。開啟 iCloud 備份同步後，傳到你的 iCloud，並同步到 iPad。開啟旅程共編後，透過 iCloud 共享給三位旅伴。': ('Data flow: The data is on this iPhone. After you turn on iCloud Backup &amp; Sync, it goes to your iCloud and syncs to your iPad. After you turn on trip co-editing, it is shared through iCloud with three companions.', 'データの流れ：データはこの iPhone にあります。iCloud のバックアップと同期をオンにすると、あなたの iCloud に送られ、iPad に同期されます。旅程の共同編集をオンにすると、iCloud 経由で 3 人の旅の仲間に共有されます。', '데이터 흐름: 데이터는 이 iPhone에 있습니다. iCloud 백업 및 동기화를 켜면 내 iCloud로 전송되어 iPad와 동기화됩니다. 여행 공동 편집을 켜면 iCloud를 통해 동행 세 명에게 공유됩니다.'),
  '資料存在這台 iPhone，透過你的 iCloud 備份同步。旅程共編也走 iCloud。': ('Your data is on this iPhone and uses your iCloud for Backup &amp; Sync. Trip co-editing also uses iCloud.', 'データはこの iPhone にあり、iCloud でバックアップと同期をします。旅程の共同編集も iCloud を使います。', '데이터는 이 iPhone에 있고 내 iCloud로 백업 및 동기화됩니다. 여행 공동 편집도 iCloud를 사용합니다.'),
  # 01 安排行程
  '地點搜尋，也能直接貼 Google 地圖網址': ('Search for a place, or just paste a Google Maps link', '場所を検索、Google マップのリンクを貼るだけでも', '장소 검색, Google 지도 링크를 붙여 넣기만 해도'),
  '起迄不同時區、全日、待排行程': ('Different start and end time zones, all-day and unscheduled events', '出発と到着で違うタイムゾーン、終日・未定の予定', '출발·도착 시간대가 다른 일정, 종일·미정 일정'),
  '每則行程可以設定：': ('You can set these for each event:', '予定ごとに設定できる項目：', '일정마다 설정할 수 있는 항목:'),
  '<li><b>地點</b>：用名稱或地址搜尋，或貼上 Google 地圖網址</li>': ('<li><b>Place</b>: Search by name or address, or paste a Google Maps link</li>', '<li><b>場所</b>：名前や住所で検索、または Google マップのリンクを貼り付け</li>', '<li><b>장소</b>: 이름이나 주소로 검색하거나 Google 지도 링크를 붙여넣기</li>'),
  '<li><b>類型／標題</b>：輸入地點時，自動帶入標題並選好類型</li>': ('<li><b>Type / title</b>: When you enter a place, the title and type are filled in automatically</li>', '<li><b>種類／タイトル</b>：場所を入力すると、タイトルを自動入力し、種類も選びます</li>', '<li><b>유형/제목</b>: 장소를 입력하면 제목이 자동으로 채워지고 유형이 선택됩니다</li>'),
  '<li><b>附件</b>：照片 App 的圖片、檔案 App 的檔案，或網址（例如電子車票）</li>': ('<li><b>Files</b>: Images from the Photos app, files from the Files app, or links (for example, an e-ticket)</li>', '<li><b>添付</b>：写真 App の画像、ファイル App のファイル、URL（電子チケットなど）</li>', '<li><b>첨부</b>: 사진 앱의 이미지, 파일 앱의 파일, 링크(전자 승차권 등)</li>'),
  '<li><b>時間</b>：起點與終點可在不同時區（例如台北起飛、沖繩落地）；全日行程（例如住宿飯店）；待排行程（時間未定）</li>': ('<li><b>Time</b>: Start and end can be in different time zones (take off in Taipei, land in Okinawa). All-day events (a hotel stay). Unscheduled events (no time set).</li>', '<li><b>時間</b>：開始と終了で別のタイムゾーン（台北で離陸、沖縄に着陸など）、終日の予定（ホテルの宿泊など）、未定の予定（時間が未設定）</li>', '<li><b>시간</b>: 시작과 종료의 시간대를 다르게 설정 가능(타이베이 이륙, 오키나와 착륙 등), 종일 일정(호텔 숙박 등), 미정 일정(시간 미설정)</li>'),
  '<li><b>待辦事項</b>：例如記得訂位</li>': ('<li><b>To-dos</b>: “remember to book a table,” for example</li>', '<li><b>やること</b>：「忘れずに予約」など</li>', '<li><b>할 일</b>: “잊지 말고 예약하기” 같은 것</li>'),
  '行程可以取消（保留並加刪除線）、刪除（完全移除），或延後／提前（連同後面的行程一起移動 X 小時 Y 分鐘）。': ('Cancel an event to keep it with a strikethrough. Delete it to remove it completely. Move it later or earlier, and the events after it move with it by X hours and Y minutes.', '予定は、キャンセル（残して取り消し線を付ける）、削除（完全に消す）、後ろへ／前へずらす（後ろの予定と一緒に X 時間 Y 分移動）ができます。', '일정은 취소(남기고 취소선 추가), 삭제(완전히 제거), 미루기/앞당기기(뒤의 일정과 함께 X시간 Y분 이동)를 할 수 있습니다.'),
  '行程詳情：桃園機場報到，待辦清單與附件——網頁連結、PDF 電子登機證與護照照片': ('Event details: check-in at Taoyuan Airport, with a to-do list and files (a web link, a PDF boarding pass and a passport photo)', '予定の詳細：桃園空港でのチェックイン。やることリストと添付（Web リンク、PDF の電子搭乗券、パスポートの写真）', '일정 상세: 타오위안 공항 체크인. 할 일 목록과 첨부(웹 링크, PDF 전자 탑승권, 여권 사진)'),
  # 02 路程
  '06 · 路程': ('06 · Legs', '06 · 移動', '06 · 이동'),
  '兩個行程之間，': ('Between two events,', '予定と予定のあいだの', '일정과 일정 사이의'),
  '路程自動估算時間': ('the leg time is estimated automatically', '移動時間を自動で計算', '이동 시간을 자동으로 계산'),
  '兩個行程之間是一段路程：地圖估算路上要多久。': ('Between two events there is a leg. The map estimates how long it takes.', '予定と予定のあいだに移動があります。地図が所要時間を見積もります。', '일정과 일정 사이에 이동이 있습니다. 지도가 걸리는 시간을 추정합니다.'),
  '步行、開車、騎車、大眾運輸，自動估算時間': ('Walking, driving, cycling or transit, with the time estimated automatically', '徒歩・車・自転車・公共交通。所要時間は自動で計算', '도보·자동차·자전거·대중교통, 걸리는 시간을 자동으로 추정'),
  '路程比空檔久時，顯示「遲到」': ('When the leg takes longer than the gap, it shows “Late”', '移動が空き時間より長いと、「遅刻」を表示', '이동이 빈 시간보다 길면 ‘지각’을 표시'),
  '多組班次，旅途中提醒最接近的那一班': ('Several departures, with a reminder for the nearest one on the day', '便をいくつも登録、旅先ではいちばん近い便をお知らせ', '여러 편을 저장하고, 여행 중에는 가장 가까운 편을 알림'),
  '兩個行程之間可以設一段路程：步行、開車、騎車、大眾運輸或其他。路程比兩個行程之間的空檔久時，顯示「遲到」。': ('You can set a leg between two events: walking, driving, cycling, transit or other. When the leg takes longer than the gap between the two events, it shows “Late”.', '予定と予定のあいだに移動を設定できます。徒歩、車、自転車、公共交通、その他。移動が予定間の空き時間より長いときは、「遅刻」を表示します。', '일정과 일정 사이에 이동을 설정할 수 있습니다. 도보, 자동차, 자전거, 대중교통, 기타. 이동이 두 일정 사이의 빈 시간보다 길면 ‘지각’이 표시됩니다.'),
  '大眾運輸可以預先輸入多組班次。旅途中提醒最接近現在的班次，錯過一班可以改搭下一班。': ('You can enter several transit departures in advance. During the trip, the app reminds you of the departure closest to now. If you miss one, you can switch to the next.', '公共交通は、便を複数あらかじめ入力できます。旅程中は、いまにいちばん近い便を通知します。乗り遅れたときは、次の便に切り替えられます。', '대중교통은 여러 편을 미리 입력할 수 있습니다. 여행 중에는 지금과 가장 가까운 편을 알려 줍니다. 놓치면 다음 편으로 바꿀 수 있습니다.'),
  # 03 行事曆／時間軸
  '01 · 行事曆／時間軸': ('01 · Calendar / Timeline', '01 · カレンダー／タイムライン', '01 · 캘린더/타임라인'),
  '拖曳調整時段': ('Drag to change the time slot', 'ドラッグで時間帯を調整', '끌어서 시간대 조정'),
  '待排行程拖進時段': ('Drag an unscheduled event into a time slot', '未定の予定を時間帯にドラッグ', '미정 일정을 시간대로 끌어다 놓기'),
  '<p><b>行事曆模式</b>：每則行程是一個行事曆事件。拖曳可以移動時段，也可以調整開始與結束時間。</p>': ('<p><b>Calendar view</b>: Each event is a calendar event. Drag to move it to another time slot, or to change its start and end times.</p>', '<p><b>カレンダー表示</b>：予定ひとつがカレンダーの予定ひとつです。ドラッグで別の時間帯へ移動したり、開始・終了時刻を調整したりできます。</p>', '<p><b>캘린더 보기</b>: 일정 하나가 캘린더 일정 하나입니다. 끌어서 다른 시간대로 옮기거나 시작·종료 시간을 조정할 수 있습니다.</p>'),
  '<p><b>時間軸模式</b>：顯示每天幾點去哪、停留多久、路程多久。</p>': ('<p><b>Timeline view</b>: Shows when and where you go each day, how long you stay and how long each leg takes.</p>', '<p><b>タイムライン表示</b>：毎日、何時にどこへ行くか、どれだけ滞在するか、移動にどれだけかかるかを表示します。</p>', '<p><b>타임라인 보기</b>: 매일 몇 시에 어디로 가는지, 얼마나 머무는지, 이동에 얼마나 걸리는지 표시합니다.</p>'),
  # 04 總覽
  '一天一頁，左右滑動換天': ('One page a day. Swipe sideways to change day', '1日1ページ、左右にスワイプで日を切り替え', '하루 한 페이지, 좌우로 밀어 날짜 이동'),
  '行程卡有封面，待辦直接在卡上勾': ('Event cards with covers. Tick to-dos right on the card', '予定カードにカバー、やることはカード上でチェック', '일정 카드에 커버, 할 일은 카드에서 바로 체크'),
  '卡與卡之間標著路程': ('Legs are marked between the cards', 'カードのあいだに移動を表示', '카드 사이에 이동 표시'),
  '總覽一天一頁，左右滑動換天。行程卡沒有照片時顯示地圖或圖示，卡與卡之間標著路程與所需時間。待排行程與重要的待辦放在總覽頁。': ('Overview has one page for each day, and you swipe sideways to change day. Cards without a photo show a map or an icon, and each leg shows its travel time between cards. Unscheduled events and important to-dos appear on the Overview page.', '概要は 1 日 1 ページで、左右にスワイプして日を切り替えます。写真のない予定カードには地図またはアイコンを表示し、カードのあいだに移動と所要時間を表示します。未定の予定と重要なやることは概要ページにあります。', '개요는 하루 한 페이지이며, 좌우로 밀어 날짜를 바꿉니다. 사진이 없는 일정 카드에는 지도나 아이콘이 표시되고, 카드 사이에는 이동과 소요 시간이 표시됩니다. 미정 일정과 중요한 할 일은 개요 페이지에 있습니다.'),
  # 05 地圖
  '04 · 地圖模式': ('04 · Map', '04 · 地図', '04 · 지도'),
  '行程設定地點後，地圖顯示每天的路線與行程之間的位置。': ('After you set a place for events, the map shows each day’s route and where the events are in relation to each other.', '予定に場所を設定すると、地図に毎日のルートと予定どうしの位置が表示されます。', '일정에 장소를 설정하면 지도에 매일의 동선과 일정 간의 위치가 표시됩니다.'),
  '可以新增想去的地點標記。切到「附近」，依距離列出身邊的行程與標記。內建日本購物店家的位置與營業狀態。': ('You can add markers for places you want to go. Switch to Nearby to list events and markers around you by distance. Locations and open or closed status of stores in Japan are built in.', '行きたい場所のマーカーを追加できます。「近く」に切り替えると、周りの予定とマーカーを距離順に表示します。日本の店舗の場所と営業状況を内蔵しています。', '가 보고 싶은 장소의 마커를 추가할 수 있습니다. ‘주변’으로 전환하면 주변의 일정과 마커를 거리순으로 표시합니다. 일본 상점의 위치와 영업 상태가 내장되어 있습니다.'),
  '步行導航：選一個地點，點開始導航。': ('Walking directions: select a place and tap Start Navigation.', '徒歩ナビ：場所を選んで、ナビを開始します。', '도보 길 안내: 장소를 선택하고 길 안내 시작을 누르세요.'),
  '打開地圖的預設畫面：今天的行程依序編號、連成路線，旁邊是自訂標記與附近的超商': ("The map as it opens: today's events numbered in order and joined into a route, with your own markers and nearby convenience stores alongside", '地図を開いたときの画面：今日の予定が番号順にルートでつながり、そばに自分のマーカーと近くのコンビニ', '지도를 열었을 때의 기본 화면: 오늘 일정이 순서대로 번호가 매겨져 동선으로 이어지고, 옆에 사용자 마커와 근처 편의점'),
  '地圖：第 2 天，正在步行導航到原爆圓頂，沿途標出超商與旅伴的位置': ('Map: day 2, with walking directions under way to the Atomic Bomb Dome and convenience stores and companions marked along the route', '地図：2日目、原爆ドームへ徒歩ナビ中。道沿いにコンビニと旅の仲間の位置', '지도: 2일차, 원폭 돔까지 도보 길 안내 중. 가는 길의 편의점과 동행 위치 표시'),
  # 06 旅伴共編、位置共享
  '07 · 旅伴共編、位置分享': ('07 · Companion co-editing and location sharing', '07 · 旅の仲間との共同編集・位置の共有', '07 · 동행 공동 편집, 위치 공유'),
  '傳邀請連結，或掃 QR Code 加入旅程': ('Send an invite link, or scan a QR code to join a trip', '招待リンクを送るか、QR コードを読み取って旅程に参加', '초대 링크를 보내거나 QR 코드를 스캔해 여행에 참여'),
  '旅伴的位置顯示在地圖上': ('Companions’ locations appear on the map', '旅の仲間の位置が地図に表示', '동행의 위치가 지도에 표시'),
  '筆記、附件、待辦、購物清單可選擇要不要分享給旅伴': ('Choose whether notes, files, to-dos and shopping lists are shared with companions', 'メモ・添付・やること・買い物リストは、旅の仲間に共有するかを選べる', '메모·첨부·할 일·쇼핑 목록을 동행에게 공유할지 선택 가능'),
  '旅伴可以一起編輯同一趟旅程。旅途中打開「分享我的位置」，旅伴顯示在地圖上，並標出多久前更新。位置只分享給這趟旅程的旅伴，可以隨時關閉。': ('Companions can edit the same trip together. During the trip, turn on “Share my location” to show companions on the map with the time of their last update. Your location is shared only with companions of this trip. You can turn it off at any time.', '旅の仲間は同じ旅程を一緒に編集できます。旅程中に「現在地を共有」をオンにすると、旅の仲間が地図に表示され、最終更新からの時間も表示されます。位置は、この旅程の旅の仲間にだけ共有され、いつでもオフにできます。', '동행은 같은 여행을 함께 편집할 수 있습니다. 여행 중에 ‘내 위치 공유’를 켜면 동행이 지도에 표시되고 마지막 업데이트 시각도 표시됩니다. 위치는 이 여행의 동행에게만 공유되며 언제든 끌 수 있습니다.'),
  '筆記、附件、待辦與購物清單，可以設定要不要分享給旅伴。': ('Notes, files, to-dos and shopping lists can each be shared with companions or kept private.', 'メモ・添付・やること・買い物リストは、それぞれ旅の仲間に共有するかどうかを設定できます。', '메모·첨부·할 일·쇼핑 목록은 각각 동행에게 공유할지 설정할 수 있습니다.'),
  '位置分享：旅伴的位置出現在地圖上，灰色的是超過一小時沒更新': ('Location sharing: companions appear on the map. Gray means no update for over an hour', '位置の共有：旅の仲間の位置が地図に表示されます。グレーは 1 時間以上更新がありません', '위치 공유: 동행의 위치가 지도에 표시됩니다. 회색은 1시간 넘게 업데이트가 없습니다'),
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
  'Widget 可放在主畫面或鎖定畫面：今日行程、附件、待辦、購物清單、匯率、筆記等。': ('Widgets on the Home Screen or Lock Screen show today’s events, files, to-dos, shopping list, currency rate, notes and more.', 'ウィジェットをホーム画面やロック画面に置けます。今日の予定、添付、やること、買い物リスト、為替、メモなどを表示します。', '위젯을 홈 화면이나 잠금 화면에 둘 수 있습니다. 오늘의 일정, 첨부, 할 일, 쇼핑 목록, 환율, 메모 등을 표시합니다.'),
  '即時動態在鎖定畫面與動態島顯示目前行程、剩餘時間、下一站與交通方式。': ('The Live Activity shows the current event, time left, next stop and travel mode on the Lock Screen and in the Dynamic Island.', 'ライブアクティビティは、現在の予定、残り時間、次の目的地、移動手段をロック画面とダイナミックアイランドに表示します。', '라이브 액티비티는 현재 일정, 남은 시간, 다음 장소, 이동 수단을 잠금 화면과 Dynamic Island에 표시합니다.'),
  '旅程開始前、行程開始前與有待辦時，推播通知你。': ('Notifications arrive before a trip begins, before an event starts, and when to-dos are open.', '旅程の開始前、予定の開始前、やることが残っているときに通知します。', '여행 시작 전, 일정 시작 전, 할 일이 남아 있을 때 알립니다.'),
  '鎖定畫面：即時動態顯示嚴島神社進行中、剩餘時間與下一站，底下疊著 TripEZGo 的推播通知':
      ('Lock Screen: the Live Activity shows Itsukushima Shrine under way, the time left and the next stop, with TripEZGo notifications stacked below',
       'ロック画面：ライブアクティビティに厳島神社が進行中、残り時間と次の行き先。その下に TripEZGo の通知',
       '잠금 화면: 라이브 액티비티에 진행 중인 이쓰쿠시마 신사와 남은 시간, 다음 목적지. 그 아래 TripEZGo 알림'),
  # 小工具
  'QR Code 掃描與匯率換算。': ('QR code scanning and currency conversion.', 'QR コードのスキャンと為替換算。', 'QR 코드 스캔과 환율 계산.'),
  '筆記可插圖片，內建日文常用句可朗讀': ('Notes can hold images. Built-in common Japanese phrases can be read aloud', 'メモに画像を挿入。内蔵の日本語の定型句は読み上げに対応', '메모에 이미지 삽입 가능, 내장된 일본어 상용구는 읽어 줌'),
  '沒有網路時，用上一次的匯率': ('Without a network, it uses the last rate', 'ネットワークがないときは、前回のレートを使用', '인터넷이 없으면 지난번 환율 사용'),
  '每家店的價格記在同一項，比較哪家最便宜': ('Record each shop’s price on the same item and compare which is cheapest', 'お店ごとの値段を同じ項目に記録して、いちばん安い店を比較', '가게마다 가격을 같은 항목에 기록해 어디가 가장 싼지 비교'),
  '<li><b>筆記</b>：可以插圖片，可以 @ 一則行程或購物項目。內建日文旅遊常用句，點一下朗讀給店員聽。</li>': ('<li><b>Notes</b>: Insert images, and @-mention an event or a shopping item. Built-in common Japanese travel phrases can be read aloud to shop staff with one tap.</li>', '<li><b>メモ</b>：画像を挿入でき、予定や買い物項目を @ で指定できます。日本語の旅行用定型句を内蔵し、タップして店員に読み上げられます。</li>', '<li><b>메모</b>: 이미지를 넣고, 일정이나 쇼핑 항목을 @로 지정할 수 있습니다. 내장된 일본어 여행 상용구를 탭하면 점원에게 읽어 줍니다.</li>'),
  '<li><b>購物清單</b>：邊買邊勾選，記下實付金額。每家店的價格記在同一項，比較哪家最便宜。</li>': ('<li><b>Shopping list</b>: Check items as you buy them, and record the amount you paid. Record each shop’s price on the same item and compare which is cheapest.</li>', '<li><b>買い物リスト</b>：買いながらチェックし、支払った金額を記録します。お店ごとの値段を同じ項目に記録して、いちばん安い店を比較します。</li>', '<li><b>쇼핑 목록</b>: 사면서 체크하고 실제로 낸 금액을 기록합니다. 가게마다 가격을 같은 항목에 기록해 어디가 가장 싼지 비교합니다.</li>'),
  # 藍圖 08.09 那一列還在用（整合區那張卡已併進 02 靈感）
  '從其他 App 分享進來': ('Share in from other apps', 'ほかの App から共有', '다른 앱에서 공유해 가져오기'),
  # 02 靈感（1.4.0；原「整合 › 從其他 App 分享進來」併進來。用詞照 App 字串表：Inspiration／インスピレーション／영감、未關聯 Not added／未関連／미연결、新增關聯 Add to…／関連を追加／연결 추가）
  '03 · 靈感': ('03 · Inspiration', '03 · インスピレーション', '03 · 영감'),
  '從其他 App 分享進': ('Share from other apps to', '他の App からの共有先は', '다른 앱에서 공유하는 곳은'),
  '靈感': ('inspiration', 'インスピレーション', '영감'),
  
  'Safari、地圖、社群、相簿分享進來，可直接排成行程。': ('Share from Safari, Maps, social apps and Photos. Turn any item into an event.', 'Safari・地図・SNS・写真から共有して、そのまま予定にできます。', 'Safari, 지도, SNS, 사진에서 공유하면 바로 일정으로 만들 수 있어요.'),
  '網頁、地圖、貼文、照片，分享給 TripEZGo 存起來': ('Share web pages, maps, posts and photos to TripEZGo to save them', 'Web ページ・地図・投稿・写真を TripEZGo に共有して保存', '웹페이지, 지도, 게시물, 사진을 TripEZGo로 공유해 저장'),
  '標題、預覽圖自動補上，不用整理': ('Title and preview image fill in on their own. No tidying needed', 'タイトルとプレビュー画像は自動で補完。整理いらず', '제목과 미리보기 이미지가 자동으로 채워져 정리할 필요 없음'),
  '標示未讀與未關聯': ('Unread and not-added items are marked', '未読と未関連の印を表示', '읽지 않음과 미연결 표시'),
  '存成行程、筆記、購物清單、附件或地圖標記': ('Save as an event, note, shopping item, file or map marker', '予定、メモ、買い物リスト、添付、地図マーカーとして保存', '일정, 메모, 쇼핑 목록, 첨부, 지도 마커로 저장'),
  '靈感：在網頁按分享、選 TripEZGo，存進「資料 › 靈感」，再關聯成行事曆上的行程':
      ('Inspiration: tap Share on a web page, pick TripEZGo, save it to Library › Inspiration, then add it to the calendar as an event',
       'インスピレーション：Web ページで共有をタップして TripEZGo を選び、「資料 › インスピレーション」に保存。そこからカレンダーの予定に関連づけ',
       '영감: 웹페이지에서 공유를 누르고 TripEZGo를 고른 뒤 ‘자료 › 영감’에 저장하고, 캘린더의 일정으로 연결'),
  '<p><b>從其他 App 分享進來</b>：在 Safari、Google 地圖、Instagram、Threads 等 App 按分享，選 TripEZGo，存進「資料 › 靈感」。</p>': ('<p><b>Share in from other apps</b>: In Safari, Google Maps, Instagram, Threads or another app, tap Share and select TripEZGo. The item is saved in Library › Inspiration.</p>', '<p><b>他の App から共有</b>：Safari、Google マップ、Instagram、Threads などで共有ボタンを押し、TripEZGo を選びます。「資料 › インスピレーション」に保存されます。</p>', '<p><b>다른 앱에서 공유</b>: Safari, Google 지도, Instagram, Threads 등에서 공유를 누르고 TripEZGo를 선택하세요. ‘자료 › 영감’에 저장됩니다.</p>'),
  '<p><b>先存起來，再決定</b>：不必馬上決定排在哪一天。標題與預覽圖自動補上，沒看過的標為未讀，還沒關聯的可以只看「未關聯」。</p>': ('<p><b>Save first, decide later</b>: You do not need to choose a day now. The title and preview image are added automatically. Items you have not seen are marked unread. To see items not yet added, filter by “Not added”.</p>', '<p><b>まず保存して、あとで決める</b>：今すぐ日を決める必要はありません。タイトルとプレビュー画像は自動で追加されます。未確認のものは未読になり、「未関連」で絞り込めます。</p>', '<p><b>먼저 저장하고 나중에 결정</b>: 지금 날짜를 정하지 않아도 됩니다. 제목과 미리보기 이미지는 자동으로 채워집니다. 보지 않은 영감은 읽지 않음으로 표시되고, ‘미연결’로 걸러 볼 수 있습니다.</p>'),
  '<p><b>新增關聯</b>：按「新增關聯」，靈感可以變成行事曆上的行程、筆記、購物清單、行程附件或地圖標記。</p>': ('<p><b>Add to…</b>: Tap “Add to…” to turn an inspiration into an event, a note, a shopping item, a file or a map marker.</p>', '<p><b>関連を追加</b>：「関連を追加」を押すと、インスピレーションをカレンダーの予定、メモ、買い物リスト、予定の添付、地図マーカーにできます。</p>', '<p><b>연결 추가</b>: ‘연결 추가’를 누르면 영감을 캘린더의 일정, 메모, 쇼핑 목록, 일정 첨부, 지도 마커로 만들 수 있습니다.</p>'),
  # 整合
  '整合': ('Integrations', '連携', '연동'),
  '與 iPhone 上的 App': ('TripEZGo and the apps on your iPhone:', 'iPhone の App と', 'iPhone의 앱과'),
  
  '行程寫入 Apple 行事曆或 Google 日曆，改動時跟著更新': ('Events are written to Apple Calendar or Google Calendar and update when you change them', '予定を Apple カレンダーまたは Google カレンダーに書き込み、変更も反映', '일정을 Apple 캘린더나 Google 캘린더에 기록하고 변경하면 함께 업데이트'),
  'Apple 行事曆的單日檢視：TripEZGo 同步進去的第 2 天行程': ("Apple Calendar's day view: day 2's events, synced in from TripEZGo",
                                                  'Apple カレンダーの日表示：TripEZGo から同期された2日目の予定',
                                                  'Apple 캘린더의 하루 보기: TripEZGo에서 동기화된 2일차 일정'),
  # 「、」不在 CJK 範圍，腳本抓不到，要自己列
  'Siri、Apple Intelligence': ('Siri and Apple Intelligence', 'Siri・Apple Intelligence', 'Siri와 Apple Intelligence'),
  # Siri 問句與 screens/siri.html 一致
  '問 Siri「下一個行程是什麼」，不用打開 App': ('Ask Siri “What is my next event?” without opening the app', 'Siri に「次の予定は？」と聞けば、App を開かずにわかる', 'Siri에게 “다음 일정이 뭐야?”라고 물으면 앱을 열지 않아도 됩니다'),
  '問 Siri「下一個行程是什麼」：現在是嚴島神社，接下來是紅葉谷公園，11:30 開始': ('Asking Siri “What is my next event?”: Itsukushima Shrine now, then Momijidani Park at 11:30', 'Siri に「次の予定は何？」：今は厳島神社、次は紅葉谷公園で 11:30 から', 'Siri에게 “다음 일정이 뭐야?”: 지금은 이쓰쿠시마 신사, 다음은 11:30부터 모미지다니 공원'),
  '<p><b>Apple／Google 行事曆整合</b>：把行程寫入 Apple 行事曆或 Google 日曆，行程改動時跟著更新。</p>': ('<p><b>Apple / Google Calendar integration</b>: Writes your events to Apple Calendar or Google Calendar. Changes to an event update there too.</p>', '<p><b>Apple／Google カレンダー連携</b>：予定を Apple カレンダーまたは Google カレンダーに書き込みます。予定を変更すると、そちらも更新されます。</p>', '<p><b>Apple/Google 캘린더 연동</b>: 일정을 Apple 캘린더나 Google 캘린더에 기록합니다. 일정을 바꾸면 그쪽도 업데이트됩니다.</p>'),
  '<p><b>Siri、Apple Intelligence</b>：問「下一個行程是什麼」，不用打開 App。</p>': ('<p><b>Siri, Apple Intelligence</b>: Ask “What is my next event?” without opening the app.</p>', '<p><b>Siri、Apple Intelligence</b>：「次の予定は？」と聞けば、App を開かずにわかります。</p>', '<p><b>Siri, Apple Intelligence</b>: “다음 일정이 뭐야?”라고 물으면 앱을 열 필요가 없습니다.</p>'),
  '<p><b>公開分享</b>：用連結把旅程公開給所有人。只公開行程標題、地點與時間，不公開行程描述、附件與待辦。</p>': ('<p><b>Public sharing</b>: Make a trip public with a link, so anyone can see it. Only event titles, places and times are public. Event descriptions, files and to-dos are not public.</p>', '<p><b>公開共有</b>：リンクで旅程を誰にでも公開できます。公開されるのは予定のタイトル、場所、時間だけです。予定の説明、添付、やることは公開されません。</p>', '<p><b>공개 공유</b>: 링크로 여행을 누구나 볼 수 있게 공개합니다. 일정 제목, 장소, 시간만 공개됩니다. 일정 설명, 첨부, 할 일은 공개되지 않습니다.</p>'),
  # AI
  '手機與電腦在同一個 Wi-Fi 時，AI Agent 可以用 MCP 連接 TripEZGo，排行程、整理待辦、筆記與購物清單。': ('When your phone and computer are on the same Wi-Fi, an AI agent can connect to TripEZGo over MCP. It plans events and organizes to-dos, notes and shopping lists.', 'iPhone とパソコンが同じ Wi-Fi にあるとき、AI エージェントは MCP で TripEZGo に接続できます。予定を組み、やること・メモ・買い物リストを整理します。', 'iPhone과 컴퓨터가 같은 Wi-Fi에 있으면 AI 에이전트가 MCP로 TripEZGo에 연결할 수 있습니다. 일정을 짜고 할 일·메모·쇼핑 목록을 정리합니다.'),
  # 方案
  '免費版與 Premium 有 6 項差異。': ('The free version and Premium differ in 6 ways.', '無料版と Premium の違いは 6 つです。', '무료 버전과 Premium의 차이는 6가지입니다.'),
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
  '免費版與 Premium 只有這幾項差異：無廣告、旅程數（免費版同時只能擁有 3 趟，含垃圾桶）、每趟旅伴（免費版 3 位）、主頁小工具頁數（免費版 1 頁）、即時動態、Apple／Google 行事曆整合。Premium 提供週、月、年訂閱與終身方案。': ('The free version and Premium differ only in these ways. No ads. Number of trips (3 at a time in the free version, Trash included). Companions per trip (3 in the free version). Pages of Home cards (1 in the free version). Live Activity. Apple / Google Calendar integration. Premium is a weekly, monthly or yearly subscription, or a lifetime plan.', '無料版と Premium の違いはこれだけです：広告なし、旅程の数（無料版は同時に 3 件まで。ゴミ箱を含む）、旅程ごとの旅の仲間（無料版は 3 人）、ホームのウィジェットのページ数（無料版は 1 ページ）、ライブアクティビティ、Apple／Google カレンダー連携。Premium は週・月・年のサブスクリプション、または買い切りです。', '무료 버전과 Premium의 차이는 이것뿐입니다: 광고 없음, 여행 수(무료 버전은 동시에 3개까지, 휴지통 포함), 여행마다 동행(무료 버전은 3명), 홈 위젯 페이지 수(무료 버전은 1페이지), 라이브 액티비티, Apple/Google 캘린더 연동. Premium은 주간·월간·연간 구독 또는 평생 구매입니다.'),
  # 開發背景
  '背景故事': ('Backstory', '開発ストーリー', '개발 이야기'),
  # ── 藍圖（使用者 2026-10-13：橫向時間軸，從「關於」搬出來） ──
  '藍圖': ('Roadmap', 'ロードマップ', '로드맵'),
  '從一張設計稿，': ('From one design', '一枚のデザインから、', '한 장의 디자인에서'),
  '走到下一站': ('to the next stop', '次の駅へ', '다음 정거장까지'),
  '做完的、正在做的、接下來要做的，都排在這條路線上。': ('What is done, what is in progress and what is next are all on one route.', '終わったこと、進めていること、これからのこと。ぜんぶこの路線の上に。', '끝낸 것, 하고 있는 것, 앞으로 할 것이 모두 이 노선 위에 있어요.'),
  '上一個里程碑': ('Previous milestone', '前のマイルストーン', '이전 마일스톤'),
  '下一個里程碑': ('Next milestone', '次のマイルストーン', '다음 마일스톤'),
  '已完成': ('Done', '完了', '완료'),
  '即將推出': ('Coming soon', '近日公開', '곧 출시'),
  '進行中': ('In progress', '開発中', '진행 중'),
  '時程未定': ('No date yet', '時期未定', '일정 미정'),
  '構想與地基': ('Groundwork', '構想と土台', '구상과 기반'),
  '和 AI 一起規劃架構': ('Planning the architecture with AI', 'AI と一緒に設計を計画', 'AI와 함께 구조 설계'),
  '行事曆核心': ('The calendar core', 'カレンダーの核', '캘린더의 핵심'),
  '時間軸行事曆': ('Timeline calendar', 'タイムラインカレンダー', '타임라인 캘린더'),
  '拖曳改時間、長按新增': ('Drag to reschedule, long-press to add', 'ドラッグで時間変更、長押しで追加', '끌어서 시간 변경, 길게 눌러 추가'),
  '路程（交通）': ('Travel legs between events', '移動（交通）', '이동(교통)'),
  '行程附件': ('Event files', '予定の添付', '일정 첨부'),
  '總覽、地圖、筆記': ('Overview, Map, Notes', '概要・地図・メモ', '개요, 지도, 메모'),
  '雲端與系統整合': ('Cloud and system integration', 'クラウドとシステム連携', '클라우드와 시스템 연동'),
  '即時動態、Widget': ('Live Activity, widgets', 'ライブアクティビティ・ウィジェット', '라이브 액티비티, 위젯'),
  'Apple 行事曆整合': ('Apple Calendar integration', 'Apple カレンダー連携', 'Apple 캘린더 연동'),
  '旅程範本、行前提醒': ('Trip templates, pre-trip reminders', '旅程テンプレート・出発前リマインダー', '여행 템플릿, 출발 전 알림'),
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
  '多組路程方案': ('Multiple leg options', '複数の移動プラン', '여러 이동 방안'),
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
  '旅伴位置分享': ('Companion location sharing', '旅の仲間の位置の共有', '동행 위치 공유'),
  '抵達提醒、鎖定畫面導航': ('Arrival alerts, Lock Screen navigation', '到着通知・ロック画面ナビ', '도착 알림, 잠금 화면 내비게이션'),
  '即時同步': ('Real-time sync', 'リアルタイム同期', '실시간 동기화'),
  '唯讀旅程': ('Read-only trips', '閲覧専用の旅程', '읽기 전용 여행'),
  '支援 iOS 16.2': ('iOS 16.2 support', 'iOS 16.2 に対応', 'iOS 16.2 지원'),
  '上架衝刺': ('Sprint to launch', 'リリースへのラストスパート', '출시 막바지'),
  'Widget 選旅程': ('Pick a trip for each widget', 'ウィジェットで旅程を選択', '위젯에서 여행 선택'),
  '單趟匯出匯入': ('Export / import a single trip', '旅行ごとの書き出し・取り込み', '여행별 내보내기/가져오기'),
  '公開分享旅程連結': ('Public trip links', '旅程の公開リンク', '여행 공개 링크'),
  '送審': ('Submitted for review', '審査に提出', '심사 제출'),
  '旅程時區、先選地點再填行程': ('Trip time zones, pick the place first', '旅程のタイムゾーン、場所から予定を作成', '여행 시간대, 장소부터 고르는 일정 입력'),
  '離線地名資料庫': ('Offline place-name database', 'オフライン地名データベース', '오프라인 지명 데이터베이스'),
  '行事曆縮放、掃描 QR Code': ('Calendar zoom, QR scanner', 'カレンダーのズーム・QR スキャン', '캘린더 확대/축소, QR 코드 스캔'),
  '筆記 @ 提及': ('@-mentions in notes', 'メモで @ メンション', '메모에서 @ 멘션'),
  '連接電腦上的 AI': ('Connect an AI on your computer', 'パソコンの AI と連携', '컴퓨터의 AI와 연결'),
  '多人同時編輯不互相蓋掉': ('Simultaneous edits no longer overwrite each other', '同時に編集しても上書きされない', '동시에 편집해도 서로 덮어쓰지 않음'),
  '分享改版、智慧預選類型': ('Redesigned sharing, smart event-type preselect', '共有をリニューアル、予定タイプの自動選択', '공유 개편, 일정 유형 자동 선택'),
  '從任何 App 收集旅行靈感': ('Collect travel inspiration from any app', 'どの App からでも旅のアイデアを集める', '어떤 앱에서든 여행 영감 모으기'),
  '先存起來，之後再變成行程、筆記、購物或地圖標記': ('Save it now. Turn it into an event, note, shopping item or map marker later', 'まず保存して、あとで予定・メモ・買い物・地図マーカーに', '먼저 저장하고, 나중에 일정·메모·쇼핑·지도 마커로'),
  '讓 iPhone 讀懂你的訂位': ('Let your iPhone read your bookings', 'iPhone が予約内容を読み取る', 'iPhone이 예약 내용을 읽어 줘요'),
  '機票、車票、住宿確認信，裝置上的 AI 整理成行程': ('On-device AI turns flight, train and hotel confirmations into events', '航空券・乗車券・宿泊の確認メールを、端末上の AI が予定に整理', '항공권·승차권·숙소 확인 메일을 기기의 AI가 일정으로 정리'),
  '接下來': ('Up next', 'これから', '다음 계획'),
  'UI／UX Rebranding': ('UI/UX rebranding', 'UI/UX のリブランディング', 'UI/UX 리브랜딩'),
  '記帳與分帳': ('Expense tracking and bill splitting', '支出の記録と割り勘', '가계부와 정산'),
  'Apple 天氣整合': ('Apple Weather integration', 'Apple 天気との連携', 'Apple 날씨 연동'),
  '全新的總覽設計': ('A brand-new Overview design', '新しい概要のデザイン', '새롭게 디자인된 개요'),
  '一天一頁，行程卡、路程與待辦': ('One page per day, with event cards, legs and to-dos', '1 日 1 ページで、予定カード・移動・やること', '하루 한 페이지에 일정 카드, 이동, 할 일'),
  # 藍圖改版（2026-11-11）
  '@ 行程或購物項目，點了直接打開': ('@-mention an event or shopping item. Tap it to open it', '予定や買い物アイテムを @ で指定。タップですぐ開けます', '일정이나 쇼핑 항목을 @로 지정하고, 누르면 바로 열려요'),
  'AI 排行程': ('AI trip planning', 'AI で旅程づくり', 'AI로 일정 짜기'),
  'App 內 AI 排行程': ('AI trip planning inside the app', 'App 内の AI で旅程づくり', '앱 안에서 AI로 일정 짜기'),
  'Apple 行事曆、Google 日曆': ('Apple Calendar, Google Calendar', 'Apple カレンダー、Google カレンダー', 'Apple 캘린더, Google 캘린더'),
  
  '依標題自動選好行程類型與購物分類': ('Event type and shopping category picked automatically from the title', 'タイトルから予定タイプと買い物カテゴリを自動で選択', '제목을 보고 일정 유형과 쇼핑 분류를 자동 선택'),
  '全新主頁': ('A new Home page', '新しいホーム画面', '새로운 홈'),
  '全新的總覽': ('A brand-new Overview', '新しい概要', '새로운 개요'),
  '全旅程共用的總覽筆記': ('One Overview note shared across the whole trip', '旅程全体で共有する概要メモ', '여행 전체가 함께 쓰는 개요 메모'),
  '分享單一地點或整份清單，收進靈感資料夾': ('Share one place or a whole list and it lands in your inspiration folder', '1か所でもリストまるごとでも共有して、インスピレーションのフォルダに保存', '장소 하나나 목록 전체를 공유해 영감 폴더에 담아요'),
  '即將上架': ('Releasing soon', 'まもなくリリース', '출시 예정'),
  '即時動態、Widget、Siri 與 Spotlight': ('Live Activity, widgets, Siri and Spotlight', 'ライブアクティビティ、ウィジェット、Siri と Spotlight', '라이브 액티비티, 위젯, Siri와 Spotlight'),
  '含私人筆記': ('Including private notes', 'プライベートメモも', '비공개 메모 포함'),
  '單趟匯出匯入、公開分享旅程連結': ('Export / import a single trip, public trip links', '旅程ごとの書き出し・取り込み、旅程の公開リンク', '여행별 내보내기/가져오기, 여행 공개 링크'),
  '地圖同一地點合成一疊': ('Same-place pins stack into one', '同じ場所のピンを1つにまとめる', '같은 장소의 핀을 하나로 묶기'),
  '多組路程方案、大眾運輸班次、跨午夜行程、提前／延後': ('Multiple leg options, transit departures, events past midnight, move earlier or later', '複数の移動プラン、公共交通の便、日またぎの予定、前倒し／後ろ倒し', '여러 이동 방안, 대중교통 편, 자정을 넘는 일정, 앞당기기/미루기'),
  '存成行程、購物、筆記或地圖標記，自動帶入標題、圖片與地點': ('Save as an event, shopping item, note or map marker. Title, image and place are filled in for you', '予定・買い物・メモ・地図マーカーとして保存。タイトル・画像・場所も自動で入力', '일정·쇼핑·메모·지도 마커로 저장하고, 제목·이미지·장소는 자동으로 채워요'),
  
  '從 Google 地圖匯入': ('Import from Google Maps', 'Google マップから取り込み', 'Google 지도에서 가져오기'),
  '從任何 App 先存起來，之後再變成行程、筆記、購物或地圖標記': ('Save from any app now. Turn it into an event, note, shopping item or map marker later', 'どの App からでもまず保存して、あとで予定・メモ・買い物・地図マーカーに', '어떤 앱에서든 먼저 저장하고, 나중에 일정·메모·쇼핑·지도 마커로'),
  '從任何 App 分享進來': ('Share in from any app', 'どの App からでも共有', '어떤 앱에서든 공유해 오기'),
  '從其他 App 分享進來、旅程範本': ('Share in from other apps, trip templates', 'ほかの App から共有、旅程テンプレート', '다른 앱에서 공유해 오기, 여행 템플릿'),
  '按鈕、頁首與地圖控制項避開側邊的狀態列': ('Buttons, headers and map controls stay clear of the side status bar', 'ボタン・ヘッダー・地図の操作が横のステータスバーを避けます', '버튼, 헤더, 지도 컨트롤이 옆쪽 상태 표시줄을 피합니다'),
  '拖曳改時間、長按新增行程': ('Drag to change times, long-press to add an event', 'ドラッグで時間を変更、長押しで予定を追加', '끌어서 시간 변경, 길게 눌러 일정 추가'),
  '掃描 QR Code': ('Scan QR codes', 'QR コードをスキャン', 'QR 코드 스캔'),
  '掃描或貼上連結加入共編': ('Join a co-edit by scanning or pasting a link', 'スキャンまたはリンクの貼り付けで共同編集に参加', '스캔하거나 링크를 붙여 넣어 공동 편집 참여'),
  '掛在對應的行程底下': ('Attached to the event they belong to', '対応する予定にひもづけ', '해당 일정 아래에 붙여 두기'),
  '改的是不同欄位就都保留，離線的修改也合得回來': ('Edits to different fields are all kept, and offline changes merge back in', '別の項目への編集はすべて残り、オフラインでの変更も合流', '서로 다른 항목을 고치면 모두 남고, 오프라인 수정도 다시 합쳐져요'),
  '效能優化': ('Performance improvements', 'パフォーマンスの改善', '성능 개선'),
  '旅伴位置分享、抵達提醒、步行導航': ('Companion location sharing, arrival reminders, walking directions', '旅の仲間の位置の共有、到着の通知、徒歩ナビ', '동행 위치 공유, 도착 알림, 도보 길 안내'),
  '旅程名稱自動建議、封面自動用目的地地圖': ('Trip names suggested for you, cover set to the destination map', '旅程名を自動で提案、カバーは目的地の地図に', '여행 이름 자동 추천, 표지는 목적지 지도로 자동 설정'),
  '旅程時區與旅程地點': ('Trip time zone and trip place', '旅程のタイムゾーンと場所', '여행 시간대와 여행 장소'),
  '完整的旅程分享：PDF、社群分享': ('Full trip sharing: PDF, social sharing', '旅程の共有を充実：PDF、SNSシェア', '완성된 여행 공유: PDF, 소셜 공유'),
  '完整的旅程分享': ('Full trip sharing', '旅程の共有を充実', '완성된 여행 공유'),
  '預計 2027 Q1': ('Expected 2027 Q1', '2027年 Q1 予定', '2027년 1분기 예정'),
  '社群功能': ('Community', 'コミュニティ', '커뮤니티'),
  '社群主頁': ('Community home', 'コミュニティホーム', '커뮤니티 홈'),
  '旅程分享': ('Trip sharing', '旅程のシェア', '여행 일정 공유'),
  '旅遊討論區': ('Travel forum', '旅行の掲示板', '여행 게시판'),
  '全新的地圖使用體驗': ('A whole new map experience', 'まったく新しい地図体験', '완전히 새로워진 지도 경험'),
  '行程調整選單：延後、提前、延長、縮短，可一併挪動後續行程': ('Adjust menu: push back, pull forward, extend or shorten, with the plans after it moving along if you like', '調整メニュー：後ろへ・前へ、長く・短く。以降の予定も一緒に動かせます', '조정 메뉴: 늦추기·당기기·늘리기·줄이기, 이후 일정도 함께 이동'),
  '「要延長嗎」提醒：時間到了人還在，推播問你要不要延長（需在設定開啟）': ('"Stay longer?" reminder: when time is up and you are still there, a notification offers to extend (turn it on in Settings)', '「延長しますか」のお知らせ：時間が来てもまだその場所にいるときに通知（設定でオンにします）', "'연장할까요?' 알림: 시간이 됐는데 아직 그 장소에 있으면 알려 줍니다 (설정에서 켜기)"),
  '時間選擇器：按完成才套用': ('Time picker: changes apply only when you tap Done', '時刻の選択：完了を押したときだけ反映', '시간 선택: 완료를 눌러야만 적용'),
  '總覽移動卡片、調整時間後可以復原': ('Undo after moving a card in Overview or adjusting a time', '概要でカードを動かしたり時刻を調整したりしたあとに取り消し可能', '개요에서 카드를 옮기거나 시간을 조정한 뒤 실행 취소 가능'),
  '「即將開始」高亮：總覽與地圖標出下一個行程': ('"Up next" highlight: Overview and the Map outline the next plan', '「まもなく開始」を強調：概要と地図で次の予定を枠で表示', "'곧 시작' 강조: 개요와 지도에서 다음 일정을 테두리로 표시"),
  'Apple Private Cloud Compute AI 讀取訂位排行程': ('Apple Private Cloud Compute AI reads your bookings into your trip', 'Apple Private Cloud Compute の AI が予約を読み取って旅程に', 'Apple Private Cloud Compute AI로 예약을 읽어 일정에 추가'),
  '支援 Google Drive 備份同步': ('Google Drive Backup &amp; Sync', 'Google ドライブでのバックアップと同期', 'Google 드라이브 백업 및 동기화'),
  '支援產生 PDF 或分享到社群': ('Make a PDF or share to social media', 'PDFの作成やSNSへのシェアに対応', 'PDF 만들기와 소셜 공유 지원'),
  '旅程編輯紀錄': ('Trip edit history', '旅程の編集履歴', '여행 편집 기록'),
  '主頁顯示旅程資訊': ('Home shows trip information', 'ホームに旅程の情報を表示', '홈에 여행 정보 표시'),
  '旅行靈感': ('Travel inspiration', '旅のインスピレーション', '여행 영감'),
  '旅途中': ('On the road', '旅の途中', '여행 중'),
  '日本自由行': ('Independent travel in Japan', '日本の個人旅行', '일본 자유여행'),
  '日本購物圖資、日文萬用句、購物清單、匯率換算': ('Japan shopping map data, Japanese travel phrases, shopping list, currency converter', '日本の買い物スポットデータ、日本語の旅行フレーズ、買い物リスト、為替換算', '일본 쇼핑 지도 데이터, 일본어 여행 회화, 쇼핑 목록, 환율 변환'),
  '時間夠不夠直接寫「提早」或「遲到」': ('Whether you have enough time is spelled out as “early” or “late”', '時間が足りるかは「早め」「遅れ」とはっきり表示', '시간이 충분한지 ‘일찍’ 또는 ‘늦음’으로 바로 표시'),
  '智慧建議': ('Smart suggestions', 'スマートな提案', '스마트 추천'),
  '智慧預選類型': ('Smart type preselection', 'タイプの自動選択', '유형 자동 선택'),
  '機票、車票、住宿確認信整理成行程': ('Flight, train and hotel confirmations turned into events', '航空券・乗車券・宿の確認メールを予定に整理', '항공권·승차권·숙소 확인 메일을 일정으로 정리'),
  '每一天各自的旅程地點與時區': ('A trip place and time zone for each day', '日ごとに旅程の場所とタイムゾーンを設定', '날마다 여행 장소와 시간대 설정'),
  '每個功能都有智慧建議，少填、少點': ('Smart suggestions in every feature: less typing, fewer taps', 'どの機能にもスマートな提案。入力もタップも少なく', '모든 기능에 똑똑한 제안. 입력도 탭도 줄었어요'),
  '當地語言地址': ('Addresses in the local language', '現地の言語の住所', '현지 언어 주소'),
  '看旅伴改了哪些行程': ('See which events your companions changed', '旅の仲間がどの予定を変えたか確認', '동행이 어떤 일정을 고쳤는지 확인'),
  '筆記章節': ('Note sections', 'メモのセクション', '메모 섹션'),
  '總覽、地圖與筆記': ('Overview, map and notes', '概要・地図・メモ', '개요, 지도, 메모'),
  '總覽拖曳換時間': ('Drag in the Overview to change times', '概要でドラッグして時間を入れ替え', '개요에서 끌어서 시간 바꾸기'),
  '行事曆整合': ('Calendar integration', 'カレンダー連携', '캘린더 연동'),
  '行事曆與時間軸縮放': ('Calendar and timeline zoom', 'カレンダーとタイムラインのズーム', '캘린더와 타임라인 확대/축소'),
  '行事曆＋時間軸': ('Calendar + timeline', 'カレンダー＋タイムライン', '캘린더 + 타임라인'),
  '行前待辦提醒': ('Pre-trip to-do reminders', '出発前のやることリマインダー', '출발 전 할 일 알림'),
  '行程、靈感與超商疊在一起，點開是清單': ('Events, inspirations and convenience stores stack together. Tap to open the list', '予定・インスピレーション・コンビニが重なり、タップするとリストが開きます', '일정, 영감, 편의점이 겹쳐 있고, 누르면 목록이 열려요'),
  '行程開始前提醒還沒完成的待辦': ('A reminder before an event starts about to-dos not yet done', '予定の開始前に、未完了のやることをお知らせ', '일정 시작 전에 아직 못 한 할 일을 알려 줘요'),
  '讀懂你的訂位': ('Reads your bookings', '予約内容を読み取る', '예약 내용 읽어 주기'),
  '讓 AI 規劃旅程，整理待辦、筆記與購物': ('AI plans trips and organizes to-dos, notes and shopping', 'AI が旅程を組み、やること・メモ・買い物を整理', 'AI가 여행을 계획하고 할 일·메모·쇼핑을 정리'),
  '跨時區行程標出時差': ('Time difference shown on events across time zones', 'タイムゾーンをまたぐ予定には時差を表示', '시간대가 다른 일정에 시차 표시'),
  
  '路程新增騎單車、騎機車、纜車': ('New travel modes: bicycle, motorbike, cable car', '移動に自転車・バイク・ケーブルカーを追加', '이동 수단에 자전거, 오토바이, 케이블카 추가'),
  '邀請連結、唯讀旅程、即時同步': ('Invite links, read-only trips, real-time sync', '招待リンク、閲覧専用の旅程、リアルタイム同期', '초대 링크, 읽기 전용 여행, 실시간 동기화'),
  '還沒定時間的行程先放在待排，之後排進時段': ('Events with no time yet wait in Unscheduled. Place them in a time slot later', '時間が決まっていない予定は「未定」に置き、あとで時間枠へ', '시간을 못 정한 일정은 미정에 두고 나중에 시간대에 넣어요'),
  '長按可以複製；離旅程地點太遠時提醒': ('Touch and hold to copy. A reminder appears when it is far from the trip place', '長押しでコピー。旅程の場所から遠いときは通知', '길게 눌러 복사하고, 여행 장소에서 멀면 알려 줘요'),
  '長按行程卡，拖到另一張就互換': ('Long-press an event card and drag it onto another to swap', '予定カードを長押しして別のカードへドラッグすると入れ替え', '일정 카드를 길게 누르고 다른 카드로 끌면 서로 바뀌어요'),
  '開網址、存文字；共編時旅伴看得到同一份掃描紀錄': ('Open links and save text. In a co-edited trip, companions see the same scan history', 'URL を開く、テキストを保存。共同編集では旅の仲間が同じスキャン履歴を見られます', '링크 열기, 텍스트 저장. 공동 편집에서는 동행이 같은 스캔 기록을 봐요'),
  '附件與待辦': ('Files and to-dos', '添付とやること', '첨부와 할 일'),
  '離線也能推出時區': ('Time zone worked out even offline', 'オフラインでもタイムゾーンを判定', '오프라인에서도 시간대를 알아내요'),
  '筆記與附件翻譯': ('Translate notes and files', 'メモと添付の翻訳', '메모와 첨부 번역'),
  '1.6.0 主頁 UI／UX 優化': ('1.6.0 Home tab UI/UX polish', '1.6.0 ホーム画面の UI/UX 改善', '1.6.0 홈 UI/UX 개선'),
  '全新主頁上線，顯示旅程資訊': ('A new Home shows trip information', '新しいホームが登場。旅程の情報を表示', '새로운 홈이 출시됐어요. 여행 정보를 표시합니다'),
  '新增行程、App 頁面 UI/UX 優化': ('Smoother adding of events and UI/UX improvements across the app', '予定の追加と App 全体の UI/UX を改善', '일정 추가와 앱 화면 UI/UX 개선'),
  '筆記增加章節功能': ('Chapters in notes', 'メモに章立て機能を追加', '메모에 챕터 기능 추가'),
  '1.5.0 上架': ('1.5.0 released', '1.5.0 リリース', '1.5.0 출시'),
  '1.6.0 上架': ('1.6.0 released', '1.6.0 リリース', '1.6.0 출시'),
  '1.7.0 上架': ('1.7.0 released', '1.7.0 リリース', '1.7.0 출시'),
  '1.8.0 上架': ('1.8.0 released', '1.8.0 リリース', '1.8.0 출시'),
  '1.9.0 上架': ('1.9.0 released', '1.9.0 リリース', '1.9.0 출시'),
  '1.10.0 上架': ('1.10.0 released', '1.10.0 リリース', '1.10.0 출시'),
  '主頁天氣與步數小工具': ('Weather and steps cards on Home', 'ホームに天気と歩数のウィジェット', '홈 화면 날씨·걸음 수 위젯'),
  '依每天的旅程地點看天氣，從 Apple 健康看每天走了多少步': ('Weather for each day’s trip place, and how far you walked each day from Apple Health', '毎日の旅程の場所の天気と、Apple ヘルスケアから毎日の歩数を表示', '날마다 여행 장소의 날씨를 보고, Apple 건강에서 하루 걸음 수를 확인'),
  '推薦景點': ('Spot recommendations', 'おすすめスポット', '추천 명소'),
  '依每天的旅程地點推薦附近景點，依營業時間排進行程': ('Nearby spots for each day’s trip place, placed in the plan by opening hours', '毎日の旅程の場所の近くのスポットを提案し、営業時間に合わせて予定に追加', '날마다 여행 장소 근처 명소를 추천하고, 영업시간에 맞춰 일정에 넣어요'),
  '靈感自動找地點': ('Inspirations find their own places', 'インスピレーションの場所を自動で特定', '영감에서 장소 자동 찾기'),
  '從 IG、Threads 貼文抓出店名、找到位置，直接顯示在地圖上': ('Picks the shop name out of an Instagram or Threads post, finds where it is, and puts it on the map', 'Instagram や Threads の投稿から店名を拾って場所を見つけ、そのまま地図に表示', 'Instagram·Threads 게시물에서 가게 이름을 찾아 위치를 확인하고 바로 지도에 표시'),
  '街景 Look Around': ('Look Around street views', 'Look Around でストリートビュー', 'Look Around 거리 보기'),
  '在地圖和行程裡看那個地點的街景': ('See the street view of a place on the map and in events', '地図や予定からその場所の街並みを見られる', '지도와 일정에서 그 장소의 거리 모습 보기'),
  '開啟地圖支援 Naver Map': ('Open in Naver Map', '「地図で開く」が Naver Map に対応', '지도 열기에서 Naver Map 지원'),
  '韓國的地點自動用 Naver Map 開': ('Places in Korea open in Naver Map automatically', '韓国の場所は自動で Naver Map で開く', '한국 장소는 자동으로 Naver Map에서 열기'),
  '1.5.1 上架': ('1.5.1 released', '1.5.1 リリース', '1.5.1 출시'),
  '效能優化與功能修正': ('Performance improvements and bug fixes', 'パフォーマンスの改善と不具合の修正', '성능 개선 및 버그 수정'),
  '1.4.1 上架': ('1.4.1 released', '1.4.1 リリース', '1.4.1 출시'),
  '按鈕、頁首與地圖控制項都讓開側邊那條狀態列，打開、闔上都好按': ('Buttons, headers and map controls stay clear of the side status bar, open or closed', 'ボタン・見出し・地図の操作が横のステータスバーを避けて、開いても閉じても押しやすく', '버튼·헤더·지도 조작이 옆쪽 상태 막대를 피해서, 펼쳐도 접어도 누르기 편해요'),
  '每一天各自的旅程地點與旅程時區': ('A trip place and trip time zone for each day', '日ごとに旅程の場所とタイムゾーンを設定', '날마다 여행 장소와 여행 시간대 설정'),
  '前三天福岡、後兩天大阪，時間軸每天照當地時間顯示': ('Fukuoka for the first three days, Osaka for the last two. The timeline shows each day in local time', '最初の3日は福岡、あとの2日は大阪。タイムラインは日ごとに現地時間で表示', '첫 3일은 후쿠오카, 마지막 2일은 오사카. 타임라인이 날마다 현지 시간으로 표시돼요'),
  '新增、編輯旅程分成兩步': ('New and edit trip in two steps', '旅の作成・編集を2ステップに', '여행 만들기·편집이 두 단계로'),
  '旅程安排、旅程資訊；旅程名稱自動建議，封面自動用目的地地圖': ('Trip arrangement, then trip details. The trip name is suggested for you and the cover is the destination map', '旅程の手配、旅程の情報。旅の名前は自動で提案、カバーは目的地の地図に', '여행 일정, 여행 정보. 여행 이름은 자동으로 추천하고 커버는 목적지 지도로 채워져요'),
  '建立旅程時就能寫總覽筆記': ('Write the Overview note while creating a trip', '旅の作成時から概要メモを書ける', '여행을 만들 때 바로 개요 메모 작성'),
  '支援圖文': ('Text and images', 'テキストと画像に対応', '글과 이미지 지원'),
  '1.3.0 上架': ('1.3.0 released', '1.3.0 リリース', '1.3.0 출시'),
  '1.4.0 上架': ('1.4.0 released', '1.4.0 リリース', '1.4.0 출시'),
  '支援 iPhone Duo': ('iPhone Duo support', 'iPhone Duo に対応', 'iPhone Duo 지원'),
  
  '整個 App 更聰明': ('A smarter app, everywhere', 'App 全体をもっと賢く', '앱 전체를 더 똑똑하게'),
  '每個功能都加進智慧建議，少填、少點': ('Smart suggestions in every feature: less typing, fewer taps', 'どの機能にもスマートな提案。入力もタップも少なく', '모든 기능에 똑똑한 제안. 입력도 탭도 줄었어요'),
  '在 App 裡讓 AI 排行程': ('Let AI plan your trip, right in the app', 'App の中で AI が旅程づくり', '앱 안에서 AI가 일정 짜기'),
  '說想去哪、玩幾天，不用接電腦也能排行程': ('Say where and for how many days. No computer needed to plan the events', '行き先と日数を伝えるだけ。パソコンなしで予定を組めます', '어디로 며칠인지 말하면 컴퓨터 없이도 일정을 짜 줘요'),
  '串接 Apple Private Cloud Compute': ('Apple Private Cloud Compute', 'Apple Private Cloud Compute との連携', 'Apple Private Cloud Compute 연동'),
  '裝置上跑不動的 AI，交給 Apple 私有雲，資料不留存': ('Heavier AI runs on Apple’s private cloud, and your data is not kept', '端末で処理しきれない AI は Apple のプライベートクラウドへ。データは残りません', '기기에서 감당하기 어려운 AI는 Apple 프라이빗 클라우드로, 데이터는 남지 않아요'),
  'Android 客戶端（純享版）': ('Android app (viewer edition)', 'Android 版（閲覧版）', 'Android 앱(뷰어판)'),
  '查看旅伴分享給你的行程': ('See the trips companions share with you', '旅の仲間が共有した旅行を見る', '동행이 공유한 여행 보기'),
  # ── 關於（使用者 2026-10-12：背景故事、開發團隊；藍圖 2026-10-13 搬出去自成一區） ──
  '關於': ('About', 'この App について', '소개'),
  '誰做的，': ('Who makes it,', 'つくっている人と、', '누가 만들고,'),
  '為什麼做': ('and why', 'なぜ作ったのか', '왜 만들었는지'),
  '開發團隊': ('Team', '開発チーム', '개발팀'),
  '我的遊記': ('My travel journals', '旅行記', '나의 여행기'),
  '創意發想與設計': ('Idea and design', '構想とデザイン', '아이디어와 디자인'),
  '把自己獨旅時的需求整理成一套行程規劃 App 的設計稿': ('Turning what solo trips kept needing into designs for a trip planner', '一人旅で欲しかったものを、旅程 App のデザインにまとめる', '혼자 여행하며 필요했던 것을 여행 계획 앱 디자인으로 정리'),
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
  '<p>不管是出發前的行程安排，還是旅行當中的掌控，自由行、獨旅一切都要靠自己；需要一個工具能記錄和追蹤這些事。我試過很多種方式，沒有一個完美符合我的需求——<b>AI 當道，加上本身就是 iOS 開發者，想一想，為什麼不自己做一款？</b></p>': ('<p>Planning before you leave, keeping on top of things once you are there — when you travel on your own, and especially solo, it is all on you. I needed a tool to keep track of all of it. I tried plenty of approaches, and none fit quite right. <b>With AI everywhere, and being an iOS developer myself, I thought: why not build one?</b></p>', '<p>出発前の計画も、旅行中の段取りも、個人旅行やひとり旅ではすべて自分次第。それを記録して追いかけられる道具が必要でした。いろいろ試しましたが、ぴったり合うものはひとつもありませんでした。<b>AI の時代だし、自分は iOS エンジニア。だったら自分で作ればいいじゃないか、と。</b></p>', '<p>출발 전 일정 짜기도, 여행 중 챙기기도, 자유여행과 혼자 여행은 모든 걸 스스로 해야 합니다. 이런 것들을 기록하고 따라갈 도구가 필요했어요. 여러 방법을 써 봤지만 제게 딱 맞는 건 하나도 없었습니다. <b>AI가 대세인 데다 저 자신이 iOS 개발자이니, 그렇다면 직접 만들면 되지 않을까?</b></p>'),
  'Apple 備忘錄／Obsidian／Notion／Google 文件': ('Apple Notes / Obsidian / Notion / Google Docs', 'Apple メモ／Obsidian／Notion／Google ドキュメント', 'Apple 메모/Obsidian/Notion/Google 문서'),
  'Apple 備忘錄裡的山陰關西行：每一天一則筆記，貼著地圖截圖、班次與轉乘時間':
      ("A San'in and Kansai trip in Apple Notes: one note per day, with map screenshots, departures and transfer times pasted in",
       'Apple メモの山陰・関西旅行：1日ごとに1つのメモ。地図のスクリーンショット、便と乗り換え時間を貼り付け',
       'Apple 메모로 짠 산인·간사이 여행: 하루에 메모 하나씩, 지도 스크린숏과 열차 편, 환승 시간을 붙여 넣음'),
  '這是我最一開始旅行用的規劃工具，優點是簡單好用，一打開就是富文本編輯器，可以隨意插入行程標題、圖片、附加檔案。': ('This is what I first planned trips with. The upside is that it is simple: open it and you are in a rich text editor, free to drop in event titles, images and files however you like.', '最初に旅行の計画に使っていたのがこれです。良いところはシンプルで使いやすいこと。開けばすぐリッチテキストエディタで、予定のタイトルや画像、ファイルを自由に入れられます。', '처음 여행을 계획할 때 쓰던 도구입니다. 장점은 간단하고 쓰기 쉽다는 것. 열면 바로 서식 있는 텍스트 편집기라서, 일정 제목, 이미지, 첨부 파일을 자유롭게 넣을 수 있어요.'),
  '缺點也是「隨意」這件事：沒有固定的格式，很難一眼看出整趟旅程的安排；行程一長，滾動找資料很痛苦；旅行進行中也沒辦法快速定位到目前的行程；行程如果有異動更是麻煩。另外也不支援通知、行事曆、行程地圖、Widget 等功能。': ('The downside is that same freedom. There is no fixed format, so it is hard to see the whole trip at a glance. Once the plan gets long, scrolling to find things is painful; on the road there is no quick way to jump to where you are now; and when plans change, it is a real hassle. And there are no notifications, calendar, trip map or widgets.', '悪いところも、その「自由さ」です。決まった形がないので、旅行全体の流れがひと目でつかみにくい。予定が長くなるとスクロールして探すのがつらく、旅行中も今の予定にすぐ飛べません。予定が変わったときはなおさら面倒です。通知やカレンダー、予定の地図、ウィジェットにも対応していません。', '단점도 바로 그 ‘자유로움’입니다. 정해진 형식이 없어서 여행 전체의 흐름을 한눈에 보기 어렵고, 일정이 길어지면 스크롤하며 찾기가 괴롭고, 여행 중에도 지금 일정으로 바로 갈 수 없습니다. 일정이 바뀌면 더 번거롭고요. 알림, 캘린더, 일정 지도, 위젯 같은 기능도 없습니다.'),
  '體驗上，我覺得在搜集景點或排大綱的階段蠻好用的，可以快速把大致的行程記下來；但在細節安排、或是旅程進行中查看，就不太方便。': ('In practice, I found it great for collecting places and sketching an outline — you can get a rough plan down fast. But for working out the details, or checking things mid-trip, it is not very handy.', '使ってみた感想としては、行きたい場所を集めたり大まかな流れを組んだりする段階ではとても便利で、ざっくりした予定をすばやく書き留められます。でも細かい段取りや、旅程中に見返すとなると、あまり使い勝手がよくありません。', '써 보니, 가고 싶은 곳을 모으거나 대략적인 흐름을 짜는 단계에서는 꽤 편해서 대강의 일정을 빠르게 적어 둘 수 있었어요. 하지만 세부 일정을 짜거나 여행 중에 확인하기에는 불편했습니다.'),
  'Apple 行事曆／Google 日曆': ('Apple Calendar / Google Calendar', 'Apple カレンダー／Google カレンダー', 'Apple 캘린더/Google 캘린더'),
  'Apple 行事曆的週檢視：沖繩自由行每天的行程與交通排成一格一格的事件':
      ("Apple Calendar's week view: each day of an Okinawa trip, with plans and travel laid out as blocks of events",
       'Apple カレンダーの週表示：沖縄旅行の毎日の予定と移動が、ひとつずつの予定として並ぶ',
       'Apple 캘린더의 주 보기: 오키나와 자유여행의 날마다의 일정과 이동이 한 칸 한 칸 일정으로 놓임'),
  '<p>最近一次去「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖繩自由行</a>」，我們是用 Apple／Google 行事曆排行程。優點是規劃起來非常方便，一拖一拉一放就能建立行程，要改時間也是拖一下就好；整趟旅程一目瞭然，哪裡有空檔、哪裡待太久都能馬上知道；旅行進行中也能設定通知，馬上知道這個行程預計待多久、下一個行程是什麼，要臨時調整也很容易；也支援通知、Widget。</p>': ('<p>On my most recent trip, <a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">Okinawa on our own</a>, we planned everything in Apple / Google Calendar. Planning is really easy: drag, drop, and the event\'s there; changing a time is just another drag. You can see the whole trip at a glance — where the gaps are, where you are staying too long. On the road you can set alerts, so you know right away how long you have got here and what is next, and last-minute changes are easy. Notifications and widgets work too.</p>', '<p>最近の「<a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">沖縄の個人旅行</a>」では、Apple／Google カレンダーで予定を組みました。良いところは計画がとても楽なこと。ドラッグして置くだけで予定ができ、時間を変えるのもドラッグひとつ。旅行全体がひと目でわかり、どこに空き時間があるか、どこで長居しすぎかもすぐわかります。旅行中も通知を設定すれば、この予定にどれだけいるか、次は何かがすぐわかり、急な変更も簡単。通知やウィジェットにも対応しています。</p>', '<p>가장 최근의 <a href="https://zhgchg.li/posts/2cbc121a1b7c/" target="_blank" rel="noopener">오키나와 자유여행</a>에서는 Apple/Google 캘린더로 일정을 짰습니다. 장점은 계획하기가 아주 편하다는 것. 끌어다 놓기만 하면 일정이 생기고, 시간을 바꿀 때도 끌기만 하면 됩니다. 여행 전체가 한눈에 보여서 어디에 빈 시간이 있는지, 어디에 너무 오래 머무는지 바로 알 수 있어요. 여행 중에도 알림을 설정하면 이 일정에 얼마나 머무는지, 다음 일정은 무엇인지 바로 알 수 있고, 갑작스러운 변경도 쉽습니다. 알림과 위젯도 지원하고요.</p>'),
  '缺點是資料分散：沒有一個總覽可以查看待辦、附件或筆記，也沒有地圖檢視。畢竟行事曆工具專注的是「事件」本身，事件彼此之間是獨立的；但旅程安排上有些資訊是跨行程的，例如車票、伴手禮清單、筆記，或是我跑完 A 行程後時間還很多，想知道其他天有哪些行程是順路的、可以改成今天去。': ('The downside is that things end up scattered. There is no overview of your to-dos, files or notes, and no map view. A calendar is all about the event itself, and each event stands on its own. But some trip information cuts across events: train tickets, a souvenir list, notes. Or say I finish event A with plenty of time left — I want to know which events on other days are on the way and could move to today.', '悪いところは、情報がばらばらになること。やることや添付、メモを見渡せる概要も、地図表示もありません。カレンダーはあくまで一つひとつの「予定」が主役で、予定どうしは独立しています。でも旅の計画には、予定をまたぐ情報もあります。たとえば切符、おみやげリスト、メモ。あるいは A の予定を終えてまだ時間がたっぷりあるとき、ほかの日の予定で通り道にあって今日に回せるものはどれか、知りたくなります。', '단점은 정보가 흩어진다는 것. 할 일, 첨부, 메모를 모아 볼 개요도, 지도 보기도 없습니다. 캘린더는 어디까지나 ‘일정’ 하나하나가 주인공이고, 일정끼리는 서로 독립적이니까요. 하지만 여행 계획에는 일정을 넘나드는 정보도 있습니다. 예를 들어 승차권, 기념품 목록, 메모. 또는 A 일정을 마치고도 시간이 넉넉할 때, 다른 날 일정 중 가는 길에 있어서 오늘로 옮길 만한 게 뭔지 알고 싶어지죠.'),
  '其他旅行規劃 App': ('Other trip-planning apps', 'ほかの旅行プランニング App', '다른 여행 계획 앱'),
  '也試了幾個電商集團做的旅行規劃 App，各有亮眼的功能，例如總覽看行程、直接用地點新增行程、自動安排時間、地圖功能；但體驗上我覺得都更偏向社交和電商服務，畢竟對公司來說，產品是要能變現的。': ('I also tried a few trip planners from big e-commerce groups. Each had standout features — an overview of your plans, adding events straight from a place, automatic scheduling, maps. But in use, they all felt geared more toward social and shopping. Fair enough: for a company, a product has to make money.', 'EC 大手が作った旅行プランニング App もいくつか試しました。予定を一覧できる概要、場所からそのまま予定を追加、時間の自動割り振り、地図機能など、それぞれ光る機能はありました。でも使ってみると、どれも SNS や EC のサービス寄りに感じました。会社にとって、プロダクトは収益化できなければならないので、当然ではあります。', '대형 이커머스 그룹이 만든 여행 계획 앱도 몇 가지 써 봤습니다. 일정을 한눈에 보는 개요, 장소로 바로 일정 추가, 시간 자동 배치, 지도 기능처럼 저마다 돋보이는 기능이 있었어요. 하지만 써 보니 모두 SNS와 커머스 서비스 쪽에 더 가깝게 느껴졌습니다. 회사 입장에서는 제품이 수익을 내야 하니 당연하겠지요.'),
  '所以就有了 TripEZGo：行程、路程、地圖與旅伴共編。': ('So TripEZGo exists: events, legs, maps and companion co-editing.', 'そうして生まれたのが TripEZGo。予定、移動、地図、旅の仲間との共同編集。', '그래서 TripEZGo가 만들어졌습니다. 일정, 이동, 지도, 동행과 공동 편집.'),
  # ── 開發紀錄（使用者 2026-10-25：關於之後；標籤雲的字在 assets/data/devlog.json） ──
  '開發紀錄': ('Dev log', '開発記録', '개발 기록'),
  'TripEZGo 開發紀錄 (統計至 1.4.1 2026/10/25)': ('TripEZGo dev log (as of 1.4.1, 2026/10/25)', 'TripEZGo 開発記録（1.4.1・2026/10/25 時点）', 'TripEZGo 개발 기록 (1.4.1, 2026/10/25 기준)'),
  '展開紀錄': ('Read the log', '記録を見る', '기록 펼치기'),
  '從 2026-08-02 的第一句對話，到 1.4.1 上架，TripEZGo 是一個人和 AI 一起做出來的。':
      ('From the first message on 2026-08-02 to 1.4.1 on the App Store, TripEZGo was built by one person working with AI.',
       '2026-08-02 の最初のひと言から 1.4.1 の公開まで、TripEZGo はひとりの人と AI が一緒に作りました。',
       '2026-08-02의 첫 대화부터 1.4.1 출시까지, TripEZGo는 한 사람과 AI가 함께 만들었습니다.'),
  '句對話': ('messages', '回の会話', '번의 대화'),
  '161,952 字': ('161,952 characters', '161,952 文字', '161,952자'),
  '天': ('days', '日', '일'),
  '開發天數': ('of development', '開発日数', '개발 기간'),
  '執行了約 1,252 小時': ('about 1,252 hours of runtime', '実行時間は約 1,252 時間', '약 1,252시간 실행'),
  '句': ('a day', '回', '번'),
  '平均每天對話': ('messages on average', '1 日あたりの会話', '하루 평균 대화'),
  '每天 1,905 字': ('1,905 characters a day', '1 日 1,905 文字', '하루 1,905자'),
  'tokens 消耗': ('tokens used', 'トークン消費', '토큰 사용'),
  '輸出 1.23 億・快取讀取 766 億': ('123M output · 76.6B cache reads', '出力 1.23 億・キャッシュ読み取り 766 億', '출력 1.23억 · 캐시 읽기 766억'),
  '份 ADR': ('ADRs', '件の ADR', '건의 ADR'),
  '架構決策紀錄': ('architecture decision records', 'アーキテクチャ決定記録', '아키텍처 결정 기록'),
  '對話裡反覆打磨的產品優化，大字是提到最多次的主題。': ('Product refinements worked over again and again in those messages. The biggest words are the topics that came up most.', '会話の中で何度も磨いた改善点。大きな文字ほど、よく話題にのぼったテーマです。', '대화에서 거듭 다듬은 제품 개선 사항. 글자가 클수록 자주 나온 주제예요.'),
  # 公告（使用者 2026-10-26；內容在 assets/data/announcements.json，這裡是區塊的固定字；用詞照 App 的 Scripts/i18n/maps）
  '公告': ('Announcements', 'お知らせ', '공지'),
  '最近的公告': ('Latest announcements', '最近のお知らせ', '최근 공지'),
  '所有公告': ('All announcements', 'すべてのお知らせ', '모든 공지'),
  # 限時活動（assets/js/promo.js 放會變的字與 26 則文案；這裡是頁面上固定的字）
  '限時活動': ('Limited-time offer', '期間限定', '기간 한정'),
  '分享到社群，免費兌換一年 Premium': ('Share on social media, get a year of Premium free', 'SNS でシェアして、Premium 1 年分を無料で', 'SNS에 공유하고 Premium 1년 무료로 받기'),
  '分享到社群，': ('Share on social media,', 'SNS でシェアして、', 'SNS에 공유하고'),
  '免費兌換一年 Premium': ('get a year of Premium free', 'Premium 1 年分を無料で', 'Premium 1년 무료로'),
  '把 TripEZGo 分享給朋友，就送你一年 Premium：無廣告、旅程與旅伴不限、即時動態、行事曆整合全部打開。': ('Share TripEZGo with your friends and get a year of Premium: no ads, unlimited trips and companions, Live Activity and calendar integration, all unlocked.', 'TripEZGo を友だちにシェアすると、Premium を 1 年分プレゼント。広告なし、旅程と旅の仲間は無制限、ライブアクティビティ、カレンダー連携がすべて使えます。', 'TripEZGo를 친구에게 공유하면 Premium 1년을 드려요. 광고 없음, 여행과 동행 무제한, 라이브 액티비티, 캘린더 연동이 모두 열려요.'),
  # 各語主要市場的 App Store 年訂閱價（2026-10-24 量：美國、日本、韓國）
  'NT$1,290': ('$39.99', '¥6,000', '₩66,000'),
  'NT$0': ('$0', '¥0', '₩0'),
  '兌換倒數': ('Ends in', '引き換え終了まで', '교환 마감까지'),
  '複製這段文案': ('Copy this caption', 'この文章をコピー', '이 문구 복사'),
  '複製文案': ('Copy caption', '文章をコピー', '문구 복사'),
  '換一個': ('Try another', '別の文章にする', '다른 문구'),
  '分享到社群': ('Share on social media', 'SNS でシェア', 'SNS에 공유'),
  '貼文設成公開，記得留著 tripezgo.com。': ('Make the post public and keep tripezgo.com in it.', '投稿は公開にして、tripezgo.com は消さずに残してください。', '게시물은 공개로 설정하고 tripezgo.com은 지우지 마세요.'),
  '其他': ('Other', 'その他', '기타'),
  '完成兌換': ('Redeem', '引き換える', '교환하기'),
  '前往 App Store 兌換': ('Redeem on the App Store', 'App Store で引き換える', 'App Store에서 교환'),
  '分享之後就能兌換。': ('You can redeem once you have shared.', 'シェアしたら引き換えられます。', '공유하면 교환할 수 있어요.'),
  # 第 4 步：App 裡的字照 Scripts/i18n/maps（UI.json ui.row.subscription、ui.purchase.restore；Settings.json settings.tab.title）
  '兌換方式': ('How to redeem', '引き換え方法', '교환 방법'),
  '點擊兌換連結': ('Tap the redeem link', '引き換えリンクをタップ', '교환 링크를 탭하세요'),
  '在 App Store 完成兌換': ('Finish redeeming on the App Store', 'App Store で引き換えを完了', 'App Store에서 교환을 완료하세요'),
  '回到 TripEZGo App › 設定 › 訂閱管理 › 最底部「恢復購買」': ('Back in the TripEZGo app, go to Settings › Manage subscription and tap “Restore Purchases” at the very bottom', 'TripEZGo App に戻り、設定 › サブスクリプションの管理 › いちばん下の「購入を復元」をタップ', 'TripEZGo 앱으로 돌아가 설정 › 구독 관리 › 맨 아래 「구매 복원」을 탭하세요'),
  '啟用完成。': ('Premium is now active.', 'これで有効になります。', '활성화 완료.'),
}

HEAD = {
    'en': dict(title="TripEZGo — Travel Planner & Itinerary App for iPhone and iPad",
               desc="Travel planner app for iPhone and iPad. Plan events on a calendar and legs on a timeline, and co-edit with companions. Add tickets and to-dos to events. No sign-up, works offline, free to download."),
    'ja': dict(title="TripEZGo — 旅行計画・旅程表アプリ｜カレンダーで予定、旅の仲間と共同編集",
               desc="iPhone・iPad の旅行計画アプリ。カレンダーで予定を組み、タイムラインで移動を組み、旅の仲間と共同編集。チケットとやることは予定に追加。登録不要、オフライン対応、無料でダウンロード。"),
    'ko': dict(title="TripEZGo — 여행 플래너 앱｜캘린더로 일정, 동행과 공동 편집",
               desc="iPhone·iPad 여행 플래너 앱. 캘린더로 일정을 짜고 타임라인으로 이동을 짜며, 동행과 공동 편집합니다. 승차권과 할 일은 일정에 추가. 회원가입 없이 오프라인에서 사용, 무료 다운로드."),
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
    if 'hreflang="zh-Hans"' not in head:   # 簡體中文版（1.7.0）：每一頁的 head 都要互相指到
        head = head.replace('<link rel="alternate" hreflang="en"', '<link rel="alternate" hreflang="zh-Hans" href="https://tripezgo.com/zh-cn/">\n<link rel="alternate" hreflang="en"', 1)
        head = head.replace('<meta property="og:locale:alternate" content="zh_TW">', '<meta property="og:locale:alternate" content="zh_TW">\n<meta property="og:locale:alternate" content="zh_CN">', 1)
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
    body = body.replace('href="/contact/"', f'href="/{lang}/contact/"')
    body = body.replace('href="/announcements/"', f'href="/{lang}/announcements/"')   # 區塊的「所有公告」與頁尾 → 各語的公告頁   # 頁尾「聯絡我們」→ 各語的聯絡頁   # 頁尾的「關於」：寫成絕對路徑，分享頁照抄頁尾也指得對
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
    missing -= {'中文', '繁體中文', '日本語', '简体中文'}
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

# ── 簡體中文版：/zh-cn/（對照表在 tools/home-i18n-hans.py，逐句人寫的大陸用語，不是繁簡轉換）──
exec(open(os.path.join(ROOT, 'tools/home-i18n-hans.py'), encoding='utf-8').read())
HEAD_CN = dict(title='TripEZGo — 旅行规划 App｜日历排行程、旅伴共编',
               desc='TripEZGo 是 iPhone、iPad 上的旅行规划 App：日历排行程，时间轴排路程，旅伴共编。票券和待办加在行程上。无需注册、离线可用，免费下载。')


def build_cn():
    body = SRC[SRC.index('<body>'):SRC.index('</body>')]
    body = re.sub(r'<!--.*?-->\n?', '', body, flags=re.S)
    missing, held = set(), []
    for k, v in TH.items():
        if '<' in k and k in body:
            held.append(v)
            body = body.replace(k, f'\x00{len(held) - 1}\x00')

    def tr(t):
        if t in TH:
            return TH[t]
        if re.search(r'[一-鿿]', t):
            missing.add(t)
        return t

    def text(m):
        raw = m.group(1)
        t = raw.strip()
        return '>' + raw.replace(t, tr(t)) + '<' if t else m.group(0)
    body = re.sub(r'>([^<>]+)<', text, body)
    body = re.sub(r'(alt|aria-label|title)="([^"]+)"', lambda m: f'{m.group(1)}="{tr(m.group(2))}"', body)
    body = re.sub(r'\x00(\d+)\x00', lambda m: held[int(m.group(1))], body)
    body = body.replace('/assets/img/shots/v2/zh/', '/assets/img/shots/v2/zh-Hans/')
    # 隱私、條款、聯絡、公告還沒有簡體版：連結照舊指到繁中那一份
    zh_link = '<a class="lang" href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>'
    cn_link = '<a class="lang" href="/zh-cn/" hreflang="zh-Hans" lang="zh-Hans">简体中文</a>'
    assert '<summary>繁體中文</summary>' in body and cn_link in body
    body = body.replace('<summary>繁體中文</summary>', '<summary>简体中文</summary>', 1)
    body = body.replace('<div class="lang-list">\n          ' + cn_link, '<div class="lang-list">\n          ' + zh_link, 1)
    body = body.replace('<a href="/zh-cn/" hreflang="zh-Hans" lang="zh-Hans">简体中文</a>', '<a href="/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>')
    body = body.replace('class="brand" href="/"', 'class="brand" href="/zh-cn/"').replace('href="/#about"', 'href="/zh-cn/#about"')
    missing -= {'中文', '繁體中文', '日本語', '简体中文'}
    if missing:
        sys.exit('zh-cn: 沒有對照的中文字串：\n' + '\n'.join(sorted(missing)))
    head = SRC[:SRC.index('<link rel="stylesheet"')]
    head = head.replace('<html lang="zh-Hant-TW">', '<html lang="zh-Hans">')
    head = re.sub(r'<title>[^<]*</title>', f'<title>{HEAD_CN["title"]}</title>', head)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        head = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{HEAD_CN["desc"]}">', head)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        head = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{HEAD_CN["title"]}">', head)
    head = head.replace('<link rel="canonical" href="https://tripezgo.com/">', '<link rel="canonical" href="https://tripezgo.com/zh-cn/">')
    head = head.replace('<meta property="og:url" content="https://tripezgo.com/">', '<meta property="og:url" content="https://tripezgo.com/zh-cn/">')
    head = head.replace('<meta property="og:locale" content="zh_TW">', '<meta property="og:locale" content="zh_CN">', 1)
    head = head.replace('<meta property="og:locale:alternate" content="zh_CN">', '<meta property="og:locale:alternate" content="zh_TW">', 1)
    head = head.replace('content="TripEZGo：行程、路程、地圖與旅伴共編"', 'content="TripEZGo：行程、路程、地图和旅伴共编"')
    head += SRC[SRC.index('<link rel="stylesheet"'):SRC.index('<script type="application/ld+json">')]
    ld = SRC[SRC.index('<script type="application/ld+json">'):]
    ld = ld[:ld.index('</script>') + 9]
    ld = re.sub(r'"description": "[^"]*"', '"description": ' + json.dumps(HEAD_CN['desc'], ensure_ascii=False), ld)
    os.makedirs(os.path.join(ROOT, 'zh-cn'), exist_ok=True)
    open(os.path.join(ROOT, 'zh-cn/index.html'), 'w', encoding='utf-8').write(head + ld + '\n</head>\n' + body + '</body>\n</html>\n')
    print('wrote zh-cn')


build_cn()

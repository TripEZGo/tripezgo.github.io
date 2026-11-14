# 範例資料「山陽 6 日」（內建範本 jp-sanyo-hiroshima-okayama-6d，取自 Open Design 的 z-export-190.html）。
# 只給設計稿用：稿裡每個資料槽都寫死這份資料，之後 App 原生端與網頁 JS 填的是同一份欄位。
# 路程班次、描述有些是為了把版面狀態畫全而補的（標「補」），不是範本原文。

TRIP = {
    'name': '山陽 6 日｜廣島、宮島、尾道、倉敷、岡山',
    'short': '山陽 6 日',
    'span': '2026/11/12 – 11/17',
    'dayCount': '6 天',
    'place': '日本 廣島縣・岡山縣',
    'cover': '../_sample/cover-itsukushima.jpg',
    'tz': '時間為日本時間（UTC+9）',
    'noteP': [
        '十一月的獨旅：虎航岡山進出，前三晚住廣島車站附近當基地，一天宮島嚴島神社、一天尾道千光寺與鞆之浦、一天吳市大和博物館與廣島市區，最後兩天移到倉敷與岡山。',
        '全程靠「岡山＆廣島＆山口地區 JR Pass」，連宮島渡輪都含在內。每一段交通的班次，是 2026 年 11 月照現行時刻表（平日）重新查過的——照著走得動，但出發前仍請自己再查一次。',
    ],
    'noteImg': '../_sample/cover-korakuen.jpg',
    'noteImgCap': '岡山後樂園，最後一晚的點燈',
}

# 重要附件（沒掛行程／路程的）
IMPORTANT_FILES = [
    {'kind': 'image', 'name': '護照.jpg', 'meta': '圖片 · 1 張'},
    {'kind': 'url', 'key': 'jr', 'name': '岡山＆廣島＆山口地區 JR Pass', 'meta': 'westjr.co.jp'},
]

# 型別 → 中文名（App 的 domain.eventtype.*）
TYPE_NAME = {
    'flight': '航班', 'station': '車站', 'dining': '餐廳', 'temple': '寺廟神社', 'ferry': '渡輪',
    'viewpoint': '展望台', 'train': '火車', 'sight': '景點', 'museum': '博物館', 'hotel': '飯店',
    'park': '公園', 'transport': '交通', 'castle': '城堡', 'hsr': '高鐵', 'shopping': '購物',
    'cafe': '咖啡', 'cablecar': '纜車',
}

# 網址類附件（一格＝QR＋og 圖＋標題＋網域）
URLS = {
    'jr': {'title': '岡山＆廣島＆山口地區 JR Pass｜JR 西日本', 'domain': 'westjr.co.jp',
           'url': 'https://www.westjr.co.jp/global/tc/ticket/pass/sanyo_sanin/', 'og': '../_sample/cover-tram.jpg'},
    'kaki': {'title': '牡蠣屋 宮島表參道', 'domain': 'kakiya.example', 'url': 'https://kakiya.example/miyajima/', 'og': None},
    'ropeway': {'title': '宮島ロープウエー 紅葉谷線・獅子岩線 運行時刻・料金・運休情報のご案内（日本語）',
                'domain': 'miyajima-ropeway.example', 'url': 'https://miyajima-ropeway.example/schedule/',
                'og': '../_sample/cover-torii2.jpg'},
}

EV_DESC_1 = [
    '去程 11:10 起飛、14:11 落地，是這條線最好的時段——落地還有一整個下午可以移動。實際飛約 2 小時，時差一小時，所以時刻表上看起來差 3 小時。',
    '岡山機場很小，一個人入境到出關 30 分鐘綽綽有餘。出關後右手邊就是機場巴士售票機，可以刷 IC 卡。',
]
EV_DESC_2 = [
    '世界遺產。看大鳥居要看潮汐——漲潮時鳥居浮在海上，退潮才走得到鳥居腳下，兩種完全不同的畫面，出發前先查當天的潮汐表。迴廊是單向動線，走進去就不能回頭，一個人反而好抓自己的節奏。',
    '碼頭到神社這一段全是店：現烤牡蠣、炸紅葉饅頭、星鰻包子。十一月中是紅葉最好的時候，整條溪谷都是楓樹。',
]

# 全日行程（S106）：App 沒有「住宿」「幾晚」的概念——全日行程跟一般行程是同一種東西，只是長度剛好是整天（Event.when 的全日那一種）。
# 欄位同一般行程：title、category（使用者自己寫的類型名稱，可以空）、placeName、placeAddress、description。
# 我們不知道一筆全日行程是飯店、租車還是 JR Pass。跨天的全日行程每天各出現一張卡：日期範圍＋今天是第幾天。
HOTEL = {'title': 'Hotel Granvia Hiroshima 廣島車站', 'range': '11/12 – 11/15', 'span': 4,
         'category': '住宿',   # 補：使用者自己填的類型名稱
         'place': '廣島車站 新幹線口直通', 'addr': '広島県広島市南区松原町1-5'}
JRPASS = {'title': 'JR Pass 有效期間', 'range': '11/13 – 11/16', 'span': 4}   # 補：沒有類型、沒有地點的全日行程，畫出空的狀態


def allday_on(a, k):
    """第 k 天（從 1 算起）的這張全日卡：dayOfSpan＝（k／總天數）。"""
    return dict(a, of=k)


# 事件欄位：n(地圖號碼) name time type loc cover desc(段落) descImg att(附件 url key / file)
# 路程 leg：mode(walk/bus/train/ferry/car/flight) label gap late(分) desc
DAYS = [
    {
        'no': 1, 'date': '11/12 週四', 'place': '廣島市',
        'map': '../_sample/day-1.png', 'baked': True, 'arrows': [],
        'allday': [allday_on(HOTEL, 1)],
        'items': [
            {'ev': {'n': 1, 'name': '虎航 桃園 → 岡山', 'time': '11:10–14:11', 'tz': {'kind': 'split', 'a': '台北', 'b': '日本'}, 'type': 'flight',
                    'loc': '桃園國際機場 第一航廈', 'cover': None, 'desc': EV_DESC_1,
                    'att': [{'kind': 'file', 'name': '去程機票.pdf', 'meta': 'PDF · 2 頁 · 已解開'}]}},
            {'leg': {'mode': 'bus', 'label': '公車 30 分', 'gap': '空檔 2 小時 29 分', 'late': None,
                     'desc': '機場巴士在出關後右手邊的售票機買票，可以刷 IC 卡。',
                     'runs': [{'name': '岡電巴士 岡山空港リムジン 岡山駅行', 'dep': '14:40', 'arr': '15:10'}]}},   # 補（S116）：只有一班
            {'ev': {'n': 2, 'name': '岡山車站 兌換 JR Pass', 'time': '16:40–17:50', 'type': 'station',
                    'loc': '岡山車站', 'cover': None,
                    'desc': ['兌換機在中央口附近，尖峰時間要排 10 分鐘。順手把明天宮島與後天尾道那兩段的位子一起劃掉。']}},
            {'leg': {'mode': 'train', 'label': '火車 40 分', 'gap': '空檔 1 小時 10 分', 'late': None, 'desc': None}},
            {'ev': {'n': 3, 'name': '晚餐：廣島御好燒物語 站前廣場', 'time': '19:00–20:30', 'type': 'dining',
                    'loc': '廣島車站前廣場 2F', 'cover': None, 'desc': []}},
        ],
    },
    {
        'no': 2, 'date': '11/13 週五', 'place': '廣島市・宮島',
        'map': '../_sample/day-2.png', 'baked': False, 'arrows': [],
        'allday': [allday_on(HOTEL, 2), allday_on(JRPASS, 1)],
        'items': [
            {'ev': {'n': 1, 'name': 'JR 宮島渡輪 宮島口 → 宮島', 'time': '09:10–09:20', 'type': 'ferry',
                    'loc': '宮島棧橋', 'cover': None,
                    'desc': ['10 分鐘的航程，JR Pass 含。甲板右側視野最好。']}},
            {'leg': {'mode': 'walk', 'label': '步行 12 分', 'gap': '空檔 25 分', 'late': None, 'desc': None}},
            {'ev': {'n': 2, 'name': '宮島：表參道、嚴島神社、紅葉谷', 'time': '09:45–12:30', 'type': 'temple',
                    'loc': '嚴島神社 · 瀬戸内海国立公園, 広島県, 宮島町',
                    'cover': '../_sample/cover-torii.jpg', 'desc': EV_DESC_2,
                    'descImg': ('../_sample/cover-itsukushima.jpg', '退潮時走到大鳥居腳下')}},
            {'leg': {'mode': 'walk', 'label': '步行 25 分', 'gap': '空檔 10 分', 'late': '遲到 15 分',
                     'desc': '表參道人多，走到牡蠣屋抓 25 分鐘；晚到的話先電話通知。'}},
            {'ev': {'n': 3, 'name': '午餐：牡蠣屋', 'time': '12:40–13:40', 'type': 'dining',
                    'loc': '牡蠣屋 宮島表參道', 'cover': None, 'desc': [],
                    'att': [{'kind': 'url', 'key': 'kaki'}]}},
            {'leg': {'mode': 'walk', 'label': '步行 20 分', 'gap': '空檔 20 分', 'late': None, 'desc': None}},
            {'ev': {'n': 4, 'name': '宮島纜車 → 獅子岩展望台', 'time': '14:00–15:30', 'type': 'viewpoint',
                    'loc': '紅葉谷站', 'cover': None, 'desc': [],
                    'att': [{'kind': 'url', 'key': 'ropeway'}]}},
            {'leg': {'mode': 'ferry', 'label': '渡輪 10 分', 'gap': '空檔 70 分', 'late': None, 'desc': None,   # 補（S116）：只填班次名、不填時刻
                     'runs': [{'name': '宮島松大汽船 宮島口行'}], 'sel': 0}},
            {'ev': {'n': 5, 'name': 'JR 宮島口 → 廣島', 'time': '16:40–17:30', 'type': 'train',
                    'loc': '宮島口站', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 8 分', 'gap': '空檔 20 分', 'late': None, 'desc': None}},
            {'group': [
                {'n': 6, 'name': '原爆圓頂館', 'time': '17:50–18:30', 'type': 'sight',
                 'loc': '廣島和平紀念公園', 'cover': '../_sample/cover-dome.jpg', 'desc': []},
                {'n': 7, 'name': '平和紀念資料館', 'time': '18:00–19:00', 'type': 'museum',
                 'loc': '平和大通り', 'cover': None, 'desc': []},
            ]},
        ],
    },
    {
        'no': 3, 'date': '11/14 週六', 'place': '尾道市',
        'map': '../_sample/day-3.png', 'baked': True, 'arrows': [],
        'allday': [allday_on(HOTEL, 3), allday_on(JRPASS, 2)],
        'items': [
            {'ev': {'n': 1, 'name': '千光寺公園與纜車', 'time': '10:10–12:00', 'type': 'sight',
                    'loc': '千光寺公園, 尾道市', 'cover': None,
                    'desc': ['坡道多，從纜車上站往下走比較輕鬆；山腰的貓咪細道值得慢慢繞。']}},
            {'leg': {'mode': 'walk', 'label': '步行 15 分', 'gap': '空檔 30 分', 'late': None, 'desc': None}},
            {'ev': {'n': 2, 'name': '午餐：尾道拉麵 朱華園', 'time': '12:30–13:30', 'type': 'dining',
                    'loc': '朱華園, 尾道市久保', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'bus', 'label': '公車 90 分', 'gap': '空檔 60 分', 'late': '遲到 30 分',
                     'desc': '尾道 → 福山 → 鞆港，要在福山換車。',
                     'runs': [{'name': '鞆鉄バス 福山駅→鞆港', 'dep': '13:35', 'arr': '15:05'},   # 補（S116）：多班沒選
                              {'name': '鞆鉄バス 福山駅→鞆港', 'dep': '14:05', 'arr': '15:35'},
                              {'name': '鞆鉄バス 福山駅→鞆港', 'dep': '14:35', 'arr': '16:05'}], 'sel': None}},
            {'ev': {'n': 3, 'name': '鞆の浦・常夜燈と対潮楼を歩く 福山市鞆町', 'time': '15:00–17:00', 'type': 'sight',
                    'loc': '鞆の浦, 福山市', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'train', 'label': '火車 100 分', 'gap': '空檔 120 分', 'late': None, 'desc': None}},
            {'ev': {'n': 4, 'name': '晚餐：炭火燒肉 敏 猿猴橋店', 'time': '19:00–20:30', 'type': 'dining',
                    'loc': '廣島車站南口 步行 5 分，需先預約', 'cover': None, 'desc': []}},
        ],
    },
    {
        'no': 4, 'date': '11/15 週日', 'place': '吳市・廣島市',
        'map': '../_sample/day-4.png', 'baked': False, 'arrows': [],
        'allday': [allday_on(HOTEL, 4), allday_on(JRPASS, 3)],
        'items': [
            {'ev': {'n': 1, 'name': '吳市 大和博物館', 'time': '10:00–12:00', 'type': 'museum',
                    'loc': '大和博物館, 吳市', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 10 分', 'gap': '空檔 15 分', 'late': None, 'desc': None}},
            {'ev': {'n': 2, 'name': '午餐：吳海自カレー', 'time': '12:15–13:15', 'type': 'dining',
                    'loc': '吳市中通', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'train', 'label': '火車 35 分', 'gap': '空檔 105 分', 'late': None, 'desc': None,   # 補（S116）：多班、選第 2 班
                     'runs': [{'name': 'JR 呉線 快速 安芸路ライナー', 'dep': '13:30', 'arr': '14:05'},
                              {'name': 'JR 呉線 普通 1341M', 'dep': '13:58', 'arr': '14:33'},
                              {'name': 'JR 呉線 普通 1345M', 'dep': '14:21', 'arr': '14:56'}], 'sel': 1}},
            {'ev': {'n': 3, 'name': '廣島電鐵 路面電車巡禮', 'time': '15:00–17:00', 'type': 'transport',
                    'loc': '廣島駅電停', 'cover': '../_sample/cover-tram.jpg', 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 12 分', 'gap': '空檔 15 分', 'late': None, 'desc': None}},
            {'ev': {'n': 4, 'name': '廣島城', 'time': '17:15–18:00', 'type': 'castle',
                    'loc': '廣島城', 'cover': None, 'desc': []}},
        ],
    },
    {
        'no': 5, 'date': '11/16 週一', 'place': '倉敷市・岡山市',
        'map': '../_sample/day-5.png', 'baked': False,
        'arrows': [{'side': 'l', 'pos': 62, 'deg': 180, 'label': '1 廣島車站 · 159 km'},
                   {'side': 'l', 'pos': 28, 'deg': 200, 'label': '2 福山車站 · 83 km'}],
        'allday': [allday_on(JRPASS, 4)],
        'items': [
            {'ev': {'n': 1, 'name': '山陽新幹線 廣島 → 岡山', 'time': '08:50–09:35', 'type': 'hsr',
                    'loc': '廣島車站', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 5 分', 'gap': '空檔 25 分', 'late': None, 'desc': None}},
            {'ev': {'n': 2, 'name': 'JR 岡山 → 倉敷', 'time': '10:00–10:20', 'type': 'train',
                    'loc': '岡山車站', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 15 分', 'gap': '空檔 10 分', 'late': '遲到 5 分', 'desc': None}},
            {'ev': {'n': 3, 'name': '倉敷美觀地區', 'time': '10:30–14:00', 'type': 'sight',
                    'loc': '倉敷美観地区', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'train', 'label': '火車 25 分', 'gap': '空檔 3 小時 30 分', 'late': None, 'desc': None}},
            {'ev': {'n': 4, 'name': '岡山後樂園 點燈', 'time': '17:30–19:30', 'type': 'park',
                    'loc': '岡山後樂園', 'cover': '../_sample/cover-korakuen.jpg', 'desc': []}},
            {'leg': {'mode': 'walk', 'label': '步行 25 分', 'gap': '空檔 30 分', 'late': None, 'desc': None}},
            {'ev': {'n': 5, 'name': '晚餐：岡山車站周邊', 'time': '20:00–21:00', 'type': 'dining',
                    'loc': '岡山車站', 'cover': None, 'desc': []}},
        ],
    },
    {
        'no': 6, 'date': '11/17 週二', 'place': '岡山市',
        'map': '../_sample/day-6.png', 'baked': False, 'arrows': [],
        'allday': [],
        'items': [
            {'ev': {'n': 1, 'name': '岡山車站 寄放行李、早餐', 'time': '08:30–09:30', 'type': 'cafe',
                    'loc': '岡山車站', 'cover': None, 'desc': []}},
            {'leg': {'mode': 'bus', 'label': '公車 15 分', 'gap': '空檔 30 分', 'late': None, 'desc': None}},
            {'ev': {'n': 2, 'name': '岡山 AEON MALL', 'time': '10:00–13:30', 'type': 'shopping',
                    'loc': 'イオンモール岡山', 'cover': None, 'desc': []}},
        ],
    },
]

# 整趟地圖（區域 R 取景；示意圖借用第 4 天那張，真正的會是 R 取景截圖）
TRIP_MAP = {
    'img': '../_sample/day-4.png',
    'arrows': [
        {'side': 'r', 'pos': 30, 'deg': -20, 'label': '尾道、倉敷、岡山 · 74–136 km', 'merged': 3},
        {'side': 'l', 'pos': 78, 'deg': 200, 'label': '桃園 · 1,498 km'},
    ],
}

# 狀態示範（稿備註頁，不屬於模板）
EMPTY_DAY = {'no': 7, 'date': '11/18 週三', 'place': '岡山市'}


# ── 整趟編號（S56）：同一天先編有時刻的行程；全日行程（有地點的）排當天最後，跨天的全日行程只在第一次出現那天編一個號。
# 事件卡、地圖圖釘、圖例都用這個號。接續幾天的全日卡沒有號。
def _number():
    n = 0
    ad_n = {}
    for dd in DAYS:
        for it in dd['items']:
            for e in ([it['ev']] if 'ev' in it else it.get('group', [])):
                n += 1
                e['n'] = n
        for a_ in dd['allday']:
            if a_.get('place'):
                if a_['title'] not in ad_n:
                    n += 1
                    ad_n[a_['title']] = n
                a_['n'] = ad_n[a_['title']]   # 跨天的全日行程每天同一個地圖編號


_number()

# S82：event.address。自擬的範例地址（真實格式）；刻意留「晚餐：岡山車站周邊」沒有地址，示範只顯示地點名稱。
ADDR_BY_NAME = {
    '虎航 桃園 → 岡山': '桃園市大園區航站南路9號',
    '岡山車站 兌換 JR Pass': '岡山県岡山市北区駅元町1-1',
    '晚餐：廣島御好燒物語 站前廣場': '広島県広島市南区松原町2-37',
    'JR 宮島渡輪 宮島口 → 宮島': '広島県廿日市市宮島口1-11-17',
    '宮島：表參道、嚴島神社、紅葉谷': '広島県廿日市市宮島町1-1',
    '午餐：牡蠣屋': '広島県廿日市市宮島町505-1',
    '宮島纜車 → 獅子岩展望台': '広島県廿日市市宮島町紅葉谷公園内',
    'JR 宮島口 → 廣島': '広島県廿日市市宮島口1-4-1',
    '原爆圓頂館': '広島県広島市中区大手町1-10',
    '平和紀念資料館': '広島県広島市中区中島町1-2',
    '千光寺公園與纜車': '広島県尾道市西土堂町15-1',
    '午餐：尾道拉麵 朱華園': '広島県尾道市土堂1-15-18',
    '鞆の浦・常夜燈と対潮楼を歩く 福山市鞆町': '広島県福山市鞆町鞆2',
    '晚餐：炭火燒肉 敏 猿猴橋店': '広島県広島市南区猿猴橋町5-14',
    '吳市 大和博物館': '広島県呉市宝町5-20',
    '午餐：吳海自カレー': '広島県呉市中央4-1-1',
    '廣島電鐵 路面電車巡禮': '広島県広島市中区紙屋町2-1-18',
    '廣島城': '広島県広島市中区基町21-1',
    '山陽新幹線 廣島 → 岡山': '広島県広島市南区松原町2-37',
    'JR 岡山 → 倉敷': '岡山県岡山市北区駅元町1-1',
    '倉敷美觀地區': '岡山県倉敷市中央1-4-8',
    '岡山後樂園 點燈': '岡山県岡山市北区後楽園1-5',
    '岡山車站 寄放行李、早餐': '岡山県岡山市北区駅元町1-1',
    '岡山 AEON MALL': '岡山県岡山市北区下石井1-2-1',
}
for _dd in DAYS:
    for _it in _dd['items']:
        for _e in ([_it['ev']] if 'ev' in _it else _it.get('group', [])):
            if _e['name'] in ADDR_BY_NAME:
                _e['addr'] = ADDR_BY_NAME[_e['name']]


# 每天一句話（AI 版的範例，自擬；資料槽 day.summary）。原生端有 AI 句就填句子，沒有就填當天行程標題用「・」串起來。
DAY_SUMMARY = {
    1: '虎航飛岡山，換 JR Pass 住廣島，晚餐御好燒',
    2: '搭渡輪上宮島、坐纜車看海，傍晚回廣島看原爆圓頂',
    3: '火車到尾道逛千光寺，再去鞆之浦，晚上吃燒肉',
    4: '上午吳市大和博物館，下午搭電車逛廣島城',
    5: '新幹線到岡山，逛倉敷美觀地區，晚上看後樂園',
    6: '寄放行李，到 AEON 逛街，下午返程',
}
for _d in DAYS:
    _d['summary'] = DAY_SUMMARY[_d['no']]


# ── 12 天的範例（稿備註區用；資料自擬）：逐日摘要最多列 8 天，第 9 天以後收成「還有 4 天」。
def _titles(dd):
    out = []
    for it in dd['items']:
        for e in ([it['ev']] if 'ev' in it else it.get('group', [])):
            out.append(e['name'])
    return '・'.join(out)


EX12 = [dict(no=dd['no'], date=dd['date'], place=dd['place'], titles=_titles(dd), summary=dd['summary']) for dd in DAYS] + [
    dict(no=7, date='11/18 週三', place='福岡市', titles='JR 岡山 → 博多・福岡城跡・晚餐：博多拉麵 一蘭', summary='新幹線到博多，逛福岡城跡，晚上吃一蘭拉麵'),
    dict(no=8, date='11/19 週四', place='太宰府市・福岡市', titles='太宰府天滿宮・午餐：梅枝餅・福岡塔・屋台', summary='上午太宰府天滿宮，傍晚福岡塔與屋台'),
    dict(no=9, date='11/20 週五', place='長崎市', titles='特急 博多 → 長崎・平和公園・出島・長崎夜景', summary='特急到長崎，逛平和公園與出島，晚上看夜景'),
    dict(no=10, date='11/21 週六', place='熊本市', titles='長崎 → 熊本・熊本城・午餐：馬肉料理・水前寺成趣園', summary='轉往熊本，逛熊本城與水前寺成趣園'),
    dict(no=11, date='11/22 週日', place='別府市', titles='熊本 → 別府・地獄巡り・溫泉旅館', summary='到別府看地獄巡禮，晚上泡溫泉'),
    dict(no=12, date='11/23 週一', place='福岡市', titles='別府 → 福岡機場・伴手禮・虎航 福岡 → 桃園', summary='買伴手禮，搭虎航返台'),
]
TRIP12 = dict(TRIP, name='山陽・九州 12 日｜廣島、岡山、福岡、長崎、熊本、別府', short='山陽・九州 12 日', dayCount='12 天', span='2026/11/12 – 11/23', place='日本 廣島縣・岡山縣・九州')


# S97：文件裡每一份勾了的附件，依文末出現的順序連號「附件 1、2、3…」：重要附件排最前面，接著依天、依行程；
# 連續的網址類附件同在一頁「網址連結」。書籤與文末附件頁的標題都用這個號碼。
ATTACH = [
    {'n': 1, 'kind': 'image', 'name': '護照.jpg', 'meta': '重要附件', 'pages': 1},
    {'n': 2, 'kind': 'url', 'key': 'jr', 'origin': '重要附件'},
    {'n': 3, 'kind': 'file', 'name': '去程機票.pdf', 'meta': '第 1 天 › 虎航 桃園 → 岡山', 'pages': 2},
    {'n': 4, 'kind': 'url', 'key': 'kaki', 'origin': '第 2 天 › 午餐：牡蠣屋'},
    {'n': 5, 'kind': 'url', 'key': 'ropeway', 'origin': '第 2 天 › 宮島纜車 → 獅子岩展望台'},
]
ATT_NO = {}
for _a in ATTACH:
    ATT_NO[('url', _a['key']) if _a['kind'] == 'url' else ('file', _a['name'])] = _a['n']
ATT_NO[('file', '護照.jpg')] = 1

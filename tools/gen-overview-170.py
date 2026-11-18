#!/usr/bin/env python3
"""screens/overview-170.html 與 overview-170-wide.html 的頁面內容（總覽頁＋每天一頁，共 7 頁 × 五語）。

這兩頁是靜態手刻的（沒有 loadTrip），內容寫在 `var OV = {…}`（HTML 字串）與 /*I18N*/…/*END*/ 的字表裡。
1.11.0 起畫面用使用者的網路範本（tools/sync-template-data.py 轉成 screens/data/sanyo.<lang>.json），
這支從同一份資料把 OV、字表、頁首（日期、標題、天數晶片）重寫一次，兩頁同一份。圖示與版面骨架沿用原本的 HTML 片段
（tools/ov170-snippets.json，從舊版 OV 抽出）。範本沒有的東西不編：沒有照片的行程畫圖釘，沒有待辦就沒有待辦列。

用法：python3 tools/gen-overview-170.py"""
import json, os, re, html

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SN = json.load(open(os.path.join(root, 'tools', 'ov170-snippets.json'), encoding='utf-8'))
DATA = {'zh': 'zh-Hant-TW', 'hans': 'zh-Hans', 'en': 'en', 'ja': 'ja', 'ko': 'ko'}
COLS = ['zh', 'en', 'ja', 'ko', 'hans']   # TEXT 字表的欄序（0 繁中、1 en、2 ja、3 ko、4 hans）

T = {
    'zh': dict(allday='全日', unsched='待排行程', key='重要事項', add='新增待辦', overview='總覽', edit='編輯', day=lambda n: f'第 {n} 天',
               rng=lambda a, b: f'第 {a}–{b} 天', wk='日一二三四五六', wkfmt=lambda m, d, w: f'{m}/{d} 週{w}', greet=lambda m, d, w: f'{m}月{d}日 · 週{w}',
               h=lambda x: f'{x} 小時', mi=lambda x: f'{x} 分', hm=lambda h, m: f'{h} 小時 {m} 分', mode=dict(walking='步行', train='火車', bus='巴士', ferry='渡輪', transit='交通', driving='開車', cycling='騎車'),
               tabs=['主頁', '旅程', '地圖', '資料'], lang='zh-Hant-TW'),
    'hans': dict(allday='全日', unsched='待排行程', key='重要事项', add='新增待办', overview='总览', edit='编辑', day=lambda n: f'第 {n} 天',
                 rng=lambda a, b: f'第 {a}–{b} 天', wk='日一二三四五六', wkfmt=lambda m, d, w: f'{m}/{d} 周{w}', greet=lambda m, d, w: f'{m}月{d}日 · 周{w}',
                 h=lambda x: f'{x} 小时', mi=lambda x: f'{x} 分', hm=lambda h, m: f'{h} 小时 {m} 分', mode=dict(walking='步行', train='火车', bus='巴士', ferry='渡轮', transit='交通', driving='驾车', cycling='骑车'),
                 tabs=['主页', '旅程', '地图', '资料'], lang='zh-Hans'),
    'en': dict(allday='All-day', unsched='Unscheduled', key='Key To-Dos', add='Add to-do', overview='Overview', edit='Edit', day=lambda n: f'Day {n}',
               rng=lambda a, b: f'Days {a}–{b}', wk=['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], wkfmt=lambda m, d, w: f'{m}/{d} {w}', greet=lambda m, d, w: f'{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} {d} · {w}',
               h=lambda x: f'{x} h', mi=lambda x: f'{x} min', hm=lambda h, m: f'{h} h {m} min', mode=dict(walking='Walk', train='Train', bus='Bus', ferry='Ferry', transit='Transit', driving='Drive', cycling='Bike'),
               tabs=['Home', 'Trip', 'Map', 'Library'], lang='en'),
    'ja': dict(allday='終日', unsched='未定の予定', key='重要なやること', add='やることを追加', overview='概要', edit='編集', day=lambda n: f'{n} 日目',
               rng=lambda a, b: f'{a}〜{b} 日目', wk='日月火水木金土', wkfmt=lambda m, d, w: f'{m}/{d} ({w})', greet=lambda m, d, w: f'{m}月{d}日 · {w}',
               h=lambda x: f'{x} 時間', mi=lambda x: f'{x} 分', hm=lambda h, m: f'{h} 時間 {m} 分', mode=dict(walking='徒歩', train='電車', bus='バス', ferry='フェリー', transit='移動', driving='車', cycling='自転車'),
               tabs=['ホーム', '旅行', 'マップ', '資料'], lang='ja'),
    'ko': dict(allday='종일', unsched='미정 일정', key='중요한 할 일', add='할 일 추가', overview='한눈에 보기', edit='편집', day=lambda n: f'{n}일차',
               rng=lambda a, b: f'{a}~{b}일차', wk='일월화수목금토', wkfmt=lambda m, d, w: f'{m}/{d} ({w})', greet=lambda m, d, w: f'{m}월 {d}일 · {w}',
               h=lambda x: f'{x}시간', mi=lambda x: f'{x}분', hm=lambda h, m: f'{h}시간 {m}분', mode=dict(walking='도보', train='기차', bus='버스', ferry='페리', transit='이동', driving='자동차', cycling='자전거'),
               tabs=['홈', '여행', '지도', '자료'], lang='ko'),
}
E = lambda s: html.escape(s or '', quote=False)
START = (2026, 10, 10)   # 範本起算日（其他 screens 都用 2026-10-10，第 1 天週六）
TODAY = 3                # 「今天」＝第 3 天（宮島）


def color(cat):
    if cat in ('lodging', 'hotel', 'guesthouse', 'camping'): return 'stay'
    if cat in ('dining', 'cafe', 'dessert', 'bakery', 'bar', 'fastfood', 'market'): return 'eat'
    if cat in ('shopping', 'souvenir', 'conveniencestore'): return 'shop'
    if cat in ('flight', 'airport', 'train', 'hsr', 'metro', 'station', 'bus', 'ferry', 'harbor', 'cablecar', 'taxi', 'driving', 'cycling'): return 'move'
    if cat in ('sight', 'temple', 'castle', 'museum', 'artgallery', 'park', 'viewpoint', 'mountain', 'beach', 'waterfall', 'onsen', 'aquarium', 'zoo', 'show'): return 'see'
    return 'misc'


def dur(t, m):
    h, mm = divmod(m, 60)
    return t['mi'](mm) if not h else (t['hm'](h, mm) if mm else t['h'](h))


def date_of(n):
    import datetime
    return datetime.date(*START) + datetime.timedelta(days=n - 1)


def todo_rows(t, items):
    return ''.join(f'<div class="tr " >{SN["box"]}<div class="tm"><div class="tt">{E(x["text"] if isinstance(x, dict) else x)}</div></div></div>' for x in items)


def leg_chip(t, leg):
    if not leg: return ''
    mode = leg.get('transitKind') if leg.get('mode') == 'transit' else leg.get('mode')
    icon = SN.get('leg_' + {'walking': '步行', 'train': '火車', 'bus': '巴士', 'ferry': '渡輪'}.get(mode, '火車'))
    name = t['mode'].get(mode, t['mode']['transit'])
    mins = leg.get('durationMinutes')
    txt = f'{name} {dur(t, mins)}' if mins else name
    return f'<div class="route"><span class="leg">{icon}{E(txt)}{SN["legchev"]}</span></div>'


def ev_card(t, e):
    c = color(e.get('category'))
    img = (e.get('images') or [None])[0]
    prev = f'<div class="prev real" style="background-image:url(img/tpl/{img}.jpg)"></div>' if img else '<div class="prev map"><span class="pin"></span></div>'
    tds = f'<div class="tds">{todo_rows(t, e["todos"])}</div>' if e.get('todos') else ''
    return (f'<div class="evc" data-color="{c}">{prev}<div class="evhd"><span class="t">{e["start"]}–{e["end"]}</span>'
            f'<span class="nm"><span class="ov-dot"></span>{E(e["title"])}</span>{SN["chev"]}</div>{tds}</div>')


def allday_rows(t, trip, day):
    rows = [e for e in trip['allDayEvents'] if e['fromDay'] <= day <= max(e['fromDay'], e['toDay'])]
    if not rows: return ''
    body = ''
    for e in rows:
        n = len(e.get('todos') or [])
        ic = f'<span class="q2-ic"><span>{SN["count_circle"]}{n}</span></span>' if n else ''
        body += (f'<div class="q2-row" data-color="{color(e.get("category"))}"><span class="q2-th map"><span class="pin" style="background:var(--ev)"></span></span>'
                 f'<span class="q2-tx"><span class="nm">{E(e["title"])}</span><span class="dt">{E(t["rng"](e["fromDay"], e["toDay"]))}{ic}</span></span></div>')
    return f'<div class="a-sec"><div class="a-h">{t["allday"]}<span class="ov-tag ov-count">{len(rows)}</span></div><div class="a-box">{body}</div></div><div style="height:12px"></div>'


def page_day(t, trip, day):
    d = trip['days'][day - 1]
    out = allday_rows(t, trip, day)
    for i, e in enumerate(d['events']):
        if i and e.get('leg') and e['leg'].get('fromKey') == d['events'][i - 1]['key']: out += leg_chip(t, e['leg'])
        out += ev_card(t, e)
    return out


def page_overview(t, trip):
    note = next(n for n in trip['notes'] if n['key'] == trip['overviewNoteKey'])
    paras = note['paragraphs']
    first_img = next((p['image'] for p in paras if isinstance(p, dict)), None)
    texts = [p for p in paras if isinstance(p, str)][:2]
    titles = {e['key']: e['title'] for e in [*trip['allDayEvents'], *trip['unscheduledEvents'], *[x for d in trip['days'] for x in d['events']]]}
    texts = [re.sub(r'\{@([^}]+)\}', lambda m: titles.get(m.group(1), m.group(1)), x) for x in texts]   # 筆記裡的 @ 連結：畫成那一則行程的標題
    body = (f'<img class="np-img" src="img/tpl/{first_img}.jpg" alt="">' if first_img else '') + ''.join(f'<p>{E(x)}</p>' for x in texts)
    un = ''
    for u in trip['unscheduledEvents']:
        un += f'<span class="pz-card is-loose" data-color="{color(u.get("category"))}"><span class="ov-dot"></span>{E(u["title"])}<span class="d"> · {E(dur(t, u["durationMinutes"]))}</span></span>'
    keyrows = todo_rows(t, trip['todos'])
    return (f'<div class="a-sec"><div class="a-h">{t["overview"]}</div><div class="a-box a-pad"><div class="ov-brief-title">{E(note["title"])}</div><div class="np-body">{body}</div></div></div>'
            f'<div class="a-sec"><div class="a-h">{t["unsched"]}<span class="ov-tag ov-count">{len(trip["unscheduledEvents"])}</span></div><div class="a-box a-pad"><div class="pz-flow">{un}</div></div></div>'
            f'<div class="a-sec"><div class="a-h">{t["key"]}<span class="ov-tag ov-count" id="keycnt">{len(trip["todos"])}</span></div><div class="a-box">{keyrows}<div class="compose"><span class="box"></span>{t["add"]}</div></div></div>')


OV, TEXT = {}, []
trips = {k: json.load(open(os.path.join(root, 'screens', 'data', f'sanyo.{v}.json'), encoding='utf-8')) for k, v in DATA.items()}
for k, trip in trips.items():
    t = T[k]
    OV[k] = [page_overview(t, trip)] + [page_day(t, trip, n) for n in range(1, trip['dayCount'] + 1)]


def row(fn):
    return [fn(k) for k in COLS]


def wkday(k, n):
    dt = date_of(n); t = T[k]
    return t['wkfmt'](dt.month, dt.day, t['wk'][(dt.weekday() + 1) % 7])


TEXT.append(row(lambda k: T[k]['greet'](date_of(TODAY).month, date_of(TODAY).day, T[k]['wk'][(date_of(TODAY).weekday() + 1) % 7])))
TEXT.append(row(lambda k: trips[k]['title']))
TEXT.append(row(lambda k: T[k]['overview']))
TEXT.append(row(lambda k: T[k]['edit']))
for n in range(1, 7): TEXT.append(row(lambda k, n=n: T[k]['day'](n)))
for n in range(1, 7): TEXT.append(row(lambda k, n=n: wkday(k, n)))
for i in range(4): TEXT.append(row(lambda k, i=i: T[k]['tabs'][i]))
ZH = T['zh']
tabs_zh = ZH['tabs']

for fn in ('overview-170.html', 'overview-170-wide.html'):
    p = os.path.join(root, 'screens', fn)
    s = open(p, encoding='utf-8').read()
    # OV
    i = s.index('  var OV = '); j = s.index('\n', i)
    s = s[:i] + '  var OV = ' + json.dumps(OV, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
    # TEXT 字表
    b = s.index('/*END*/'); a = s.rindex('/*I18N*/', 0, b) + len('/*I18N*/')
    s = s[:a] + '\n' + ''.join('    ' + json.dumps(r, ensure_ascii=False) + ',\n' for r in TEXT) + '    ' + s[b:]
    # 頁首：日期、標題、天數晶片
    z = trips['zh']
    s = re.sub(r'<div class="greet">[^<]*</div>', f'<div class="greet">{TEXT[0][0]}</div>', s, count=1)
    s = re.sub(r'<div class="title">[^<]*</div>', f'<div class="title">{E(z["title"])}</div>', s, count=1)
    chips = f'<span class="day-chip key"><span class="dc-t">{ZH["overview"]}</span></span>' + ''.join(
        f'<span class="day-chip"><span class="dc-t">{ZH["day"](n)}</span><span class="dc-s">{wkday("zh", n)}</span></span>' for n in range(1, 7))
    s = re.sub(r'<span class="day-chip key">.*?</span></span>(?=</div></div>)', chips, s, count=1, flags=re.S)
    # 7 頁
    s = re.sub(r'<div class="pg" id="pg0"></div>(?:<div class="pg" id="pg\d"></div>)+', ''.join(f'<div class="pg" id="pg{n}"></div>' for n in range(7)), s, count=1)
    CSS = '/* 1.11.0：範本標題很長，一行截尾（總覽頁首） */\n.head .title { display: block; max-width: 312px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n'
    if 'max-width: 312px; overflow: hidden; text-overflow' not in s: s = s.replace('</style>', CSS + '</style>', 1)
    s = s.replace('width: 1206px;', 'width: 2814px;').replace('width: 3096px;', 'width: 7224px;').replace('width: 2853px;', 'width: 6657px;')
    # 頁面不再有「新增待辦」「待排」之外的舊文字：dict 只換整段相等的文字節點，內容已是各語言，不受影響
    open(p, 'w', encoding='utf-8').write(s)
print('overview-170 regenerated:', {k: [len(x) for x in v] for k, v in OV.items()})

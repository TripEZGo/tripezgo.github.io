#!/usr/bin/env python3
"""產生 MKMapSnapshotter 的拍圖規格（spec.json）與站表（stations.json）。

跑法：python3 share-styles/_src/maps/make_spec.py   ->  swift share-styles/_src/maps/shootmaps.swift  spec.json  ../../_sample/maps
叢集規則：decisions.md S50–S58；研究：docs/App/Design/trip-share-map-clusters/（cluster_sim.py、cases.json）。
座標：山陽 6 日的範例站我依地點手填（約略位置，夠畫稿；正式版用 Domain 的座標）。長途示意用 cases.json 的 J1（MKLocalSearch 查到的座標）。"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
from data import DAYS  # noqa

RES = '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/feature-1100-trip-share/docs/App/Design/trip-share-map-clusters'
sys.path.insert(0, RES)
import cluster_sim as cs  # noqa

# ── 山陽 6 日：每站的座標（整趟編號 1…26；S56：同一天有時刻的先編，跨日住宿只在第一天編一個號、排當天最後） ──
LL = {
    1: (25.0821, 121.2378),   # 桃園機場（家鄉端點）
    2: (34.6654, 133.9178),   # 岡山車站
    3: (34.3975, 132.4755),   # 廣島站前
    4: (34.3969, 132.4742),   # Hotel Granvia（跨日住宿，編在第 1 天最後）
    5: (34.3115, 132.3017),   # 宮島口棧橋
    6: (34.2965, 132.3190),   # 嚴島神社
    7: (34.2986, 132.3217),   # 牡蠣屋
    8: (34.2788, 132.3254),   # 宮島纜車 獅子岩
    9: (34.3108, 132.3039),   # JR 宮島口
    10: (34.3955, 132.4535),  # 原爆圓頂館
    11: (34.3919, 132.4521),  # 平和紀念資料館
    12: (34.4104, 133.1987),  # 千光寺
    13: (34.4065, 133.1977),  # 尾道拉麵
    14: (34.3809, 133.3803),  # 鞆の浦
    15: (34.3954, 132.4787),  # 燒肉 敏
    16: (34.2412, 132.5559),  # 大和博物館（吳）
    17: (34.2465, 132.5662),  # 吳海自カレー
    18: (34.3985, 132.4745),  # 廣電
    19: (34.4023, 132.4595),  # 廣島城
    20: (34.3968, 132.4760),  # 新幹線 廣島站
    21: (34.6650, 133.9170),  # JR 岡山→倉敷
    22: (34.5965, 133.7726),  # 倉敷美觀
    23: (34.6663, 133.9374),  # 後樂園
    24: (34.6640, 133.9195),  # 晚餐 岡山
    25: (34.6657, 133.9183),  # 岡山車站
    26: (34.6620, 133.9174),  # AEON MALL
}
HOME = [1]
PAGES = [
    dict(id='hiroshima', name='廣島一帶', members=[3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20]),
    dict(id='okayama', name='岡山・尾道・倉敷', members=[2, 12, 13, 14, 21, 22, 23, 24, 25, 26]),
]
PLACE = {1: '桃園'}

# 各格式的地圖框與「圖釘可以落的安全區」（疊在上面的圖例、頁尾 badge 蓋住的地方要避開）
FORMATS = {
    'pdf': dict(w=1122, h=724, safe=(36, 168, 36, 40)),
    'story': dict(w=1080, h=1920, safe=(36, 50, 36, 640)),
    'square': dict(w=1080, h=1080, safe=(36, 40, 36, 400)),
    'pdf-letter': dict(w=1056, h=746, safe=(36, 168, 36, 40)),   # Letter 橫向：1056 × (816 − 70)
}


def sample_stations():
    st = []
    for d in DAYS:
        for it in d['items']:
            evs = [it['ev']] if 'ev' in it else it.get('group', [])
            for e in evs:
                st.append(dict(n=e['n'], day=d['no'], name=e['name'], ll=LL[e['n']]))
        if d['no'] == 1:
            for a in d['allday']:
                if a.get('place'):
                    st.append(dict(n=a['n'], day=d['no'], name=a['title'], ll=LL[a['n']]))
    return sorted(st, key=lambda s: s['n'])


# ── 長途示意（J1 環日本 100 天） ──
CITIES = [('札幌', 43.06, 141.35), ('旭川', 43.77, 142.36), ('函館', 41.77, 140.73), ('登別', 42.46, 141.18), ('釧路', 42.98, 144.38),
          ('青森', 40.82, 140.74), ('盛岡', 39.70, 141.15), ('仙台', 38.26, 140.87), ('新潟', 37.92, 139.04), ('東京', 35.68, 139.76),
          ('箱根・河口湖', 35.4, 139.0), ('松本', 36.24, 137.97), ('高山', 36.14, 137.25), ('金澤', 36.56, 136.65), ('名古屋', 35.18, 136.91),
          ('京都', 35.01, 135.77), ('大阪', 34.69, 135.50), ('神戶', 34.69, 135.19), ('廣島', 34.39, 132.46), ('松江', 35.47, 133.05),
          ('高松', 34.34, 134.04), ('松山', 33.84, 132.77), ('福岡', 33.59, 130.40), ('別府', 33.28, 131.49), ('長崎', 32.75, 129.88),
          ('熊本', 32.80, 130.71), ('鹿兒島', 31.60, 130.56), ('那霸', 26.21, 127.68), ('石垣', 24.34, 124.16)]


def city_name(c):
    best = min(CITIES, key=lambda x: cs.hav(c, (x[1], x[2])))
    return best[0] if cs.hav(c, (best[1], best[2])) < 90 else '其他'


def long_trip():
    cases = json.load(open(os.path.join(RES, 'cases.json'), encoding='utf-8'))
    j = [c for c in cases if c['name'].startswith('J1')][0]
    stops = j['stops']
    pts = [(s['lat'], s['lng']) for s in stops]
    groups = cs.fit_split(pts, 100.0, 30.0)
    out = []
    for g in groups:
        ns = sorted(stops[i]['n'] for i in g)
        c = cs.sph_mean([pts[i] for i in g])
        home = cs.hav(c, (25.08, 121.23)) < 30
        out.append(dict(ns=ns, c=list(c), name='桃園' if home else city_name(c), home=home, count=len(g), extent=cs.extent([pts[i] for i in g])))
    return out


def main():
    stations = sample_stations()
    json.dump(dict(stations=stations, pages=PAGES, home=HOME, place=PLACE, formats=FORMATS), open(os.path.join(HERE, 'stations.json'), 'w'), ensure_ascii=False)
    jobs = []
    for app in ('light',):
        for p in PAGES:
            for fk, f in FORMATS.items():
                jobs.append(dict(id='%s-%s-%s' % (p['id'], fk, app), w=f['w'], h=f['h'], safe=list(f['safe']), dark=(app == 'dark'),
                                 members=[LL[n] for n in p['members']], margin={'pdf': 0.2, 'story': 0.27, 'square': 0.26, 'pdf-letter': 0.2}[fk],
                                 points={str(s['n']): s['ll'] for s in stations}))
    # 長途總覽（PDF 橫向）
    lt = long_trip()
    json.dump(lt, open(os.path.join(HERE, 'long.json'), 'w'), ensure_ascii=False)
    allpts = [c['c'] for c in lt]
    for app in ('light',):
        f = FORMATS['pdf']
        jobs.append(dict(id='long-pdf-%s' % app, w=f['w'], h=f['h'], safe=[36, 168, 36, 40], dark=(app == 'dark'), members=allpts, margin=0.08,
                         points={str(i): c['c'] for i, c in enumerate(lt)}))
    f = FORMATS['pdf-letter']
    jobs.append(dict(id='long-pdf-letter-light', w=f['w'], h=f['h'], safe=[36, 168, 36, 40], dark=False, members=allpts, margin=0.08,
                     points={str(i): c['c'] for i, c in enumerate(lt)}))
    json.dump(jobs, open(os.path.join(HERE, 'spec.json'), 'w'))
    json.dump([j for j in jobs if 'letter' in j['id']], open(os.path.join(HERE, 'spec-letter.json'), 'w'))
    print('jobs', len(jobs), 'long clusters', len(lt))
    for c in lt:
        print('  ', c['name'], c['count'], 'extent %.0f' % c['extent'], c['ns'][:3], '…', c['ns'][-2:])


if __name__ == '__main__':
    main()

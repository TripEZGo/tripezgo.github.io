#!/usr/bin/env python3
"""首頁互動示意用的資料：從 screens/data/sanyo.<lang>.json（App 內建範本）抽第 2 天，寫成 assets/js/home-data.js。

範本改了先跑 tools/sync-screen-data.py，再跑這支。不要手改 home-data.js。
"""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..')
out = {}
for key, lang in (('zh', 'zh-Hant-TW'), ('en', 'en'), ('ja', 'ja')):
    d = json.load(open(os.path.join(ROOT, 'screens/data', f'sanyo.{lang}.json'), encoding='utf-8'))
    day = next(x for x in d['days'] if x['day'] == 2)
    evs = []
    for e in day['events']:
        if not (e.get('start') and e.get('end')):
            continue
        leg = e.get('leg') or {}
        evs.append({'key': e['key'], 'title': e['title'], 'start': e['start'], 'end': e['end'],
                    'category': e.get('category'),
                    'leg': {k: leg.get(k) for k in ('mode', 'transitKind', 'durationMinutes', 'runs', 'selectedRunIndex') if leg.get(k) is not None} or None})
    jr = next(a for a in d['allDayEvents'] if a['category'] == 'train')
    out[key] = {'title': d['title'], 'day': evs, 'todos': [t['title'] if isinstance(t, dict) else t for t in jr.get('todos', [])], 'todoOwner': jr['title']}
js = '// 由 tools/gen-home-data.py 產生——不要手改。資料是 App 內建範本「山陽 6 日」的第 2 天。\nexport const DATA = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(ROOT, 'assets/js/home-data.js'), 'w', encoding='utf-8').write(js)
print('wrote', {k: len(v['day']) for k, v in out.items()})

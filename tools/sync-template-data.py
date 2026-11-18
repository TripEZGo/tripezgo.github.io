#!/usr/bin/env python3
"""網路範本（App repo 的 Scripts/trip-template-remote-source/<id>/，v3：structure.json＋各語言檔）→ screens/data/sanyo.<lang>.json。

用法：python3 tools/sync-template-data.py [App repo 路徑，預設 ~/Projects/tripezgo] [範本 id，預設 jp-sanyo-okayama-hiroshima-6d]

1.11.0 起官網 screens/ 與商城截圖用使用者的網路範本（他寫的文字、他拍的照片），不再用 App 內建的舊範本。
畫面程式讀的是舊的「每語言一份完整 JSON」格式，所以這支把 v3 的 key 全部解開成字串，欄位名照舊格式：
title／subtitle／summary／destination／tags／todos／days[].events[]／allDayEvents／unscheduledEvents／notes／shopping／images…
- 文字一字不改，照語言檔。語言對應：zh-Hant-TW、zh-Hans、en、ja、ko（zh-Hant-HK 不給畫面）。
- 照片：範本 images/*.jpg 與 cover.jpg 複製到 screens/img/tpl/，行程的 images 寫檔名（不含 .jpg）。
- v3 沒有、畫面需要的東西（靈感、連結、附件）從 screens/data/extras.json 補（遊記摘錄，見檔內說明）。
不改範本來源，也不改官網 templates/。"""
import json, os, shutil, sys

app = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Projects/tripezgo')
tid = sys.argv[2] if len(sys.argv) > 2 else 'jp-sanyo-okayama-hiroshima-6d'
src = os.path.join(app, 'Scripts/trip-template-remote-source', tid)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
here = os.path.join(root, 'screens', 'data')
imgs = os.path.join(root, 'screens', 'img', 'tpl')
LANGS = ['zh-Hant-TW', 'zh-Hans', 'en', 'ja', 'ko']

s = json.load(open(os.path.join(src, 'structure.json'), encoding='utf-8'))
extras_path = os.path.join(here, 'extras.json')
extras = json.load(open(extras_path, encoding='utf-8')) if os.path.exists(extras_path) else {}

os.makedirs(imgs, exist_ok=True)
for name, meta in s.get('images', {}).items():
    shutil.copy(os.path.join(src, 'images', meta['file']), os.path.join(imgs, f'{name}.jpg'))
shutil.copy(os.path.join(src, 'cover.jpg'), os.path.join(imgs, 'cover.jpg'))


def build(lang):
    L = json.load(open(os.path.join(src, f'{lang}.json'), encoding='utf-8'))
    T = lambda k: L[k] if k else None

    def place(pid):
        p = dict(s['places'][pid])
        out = {'name': L.get(f'place.{pid}', '')}
        out.update(p)
        return out

    def todos(items):
        res = []
        for t in items or []:
            o = {'text': T(t['textKey'])}
            if t.get('noteKey'): o['note'] = T(t['noteKey'])
            res.append(o)
        return res

    def leg(l, prev_key):
        if not l: return None
        o = {k: v for k, v in l.items() if k not in ('noteKey', 'fromKey')}
        k = l.get('fromKey') or prev_key
        if k: o['fromKey'] = k
        if l.get('noteKey'): o['note'] = T(l['noteKey'])
        return o

    def event(e, prev_key=None, fallback_leg=True):
        o = {'key': e['key'], 'title': T(e['titleKey'])}
        for k in ('start', 'end', 'category'):
            if k in e: o[k] = e[k]
        if 'place' in e: o['place'] = place(e['place'])
        if e.get('notesKey'): o['notes'] = T(e['notesKey'])
        lg = leg(e.get('leg'), prev_key)
        if lg: o['leg'] = lg
        if e.get('todoKeys'): o['todos'] = todos(e['todoKeys'])
        if e.get('images'): o['images'] = e['images']
        for k in ('fromDay', 'toDay', 'openingDays', 'closingDays', 'durationMinutes'):
            if k in e: o[k] = e[k]
        o.update(extras.get('events', {}).get(e['key'], {}).get('all', {}))
        o.update(extras.get('events', {}).get(e['key'], {}).get(lang, {}))
        return o

    days = []
    for d in s['days']:
        evs, prev = [], None
        for e in d['events']:
            evs.append(event(e, prev)); prev = e['key']
        days.append({'day': d['day'], 'title': T(d.get('titleKey')), 'events': evs})

    notes = []
    for n in s.get('notes', []):
        ps = []
        for p in n['paragraphKeys']:
            ps.append({'image': p['image']} if isinstance(p, dict) and 'image' in p else T(p['key'] if isinstance(p, dict) else p))
        notes.append({'key': n['key'], 'title': T(n['titleKey']), 'paragraphs': ps})

    shopping = []
    for x in s.get('shopping', []):
        o = {'key': x['key'], 'title': T(x['titleKey']), 'category': x['category'], 'productType': x['productType']}
        if x.get('storeKey'): o['store'] = T(x['storeKey'])
        o.update(extras.get('shopping', {}).get(x['key'], {}).get('all', {}))
        shopping.append(o)
    shopping += extras.get('shoppingExtra', {}).get(lang, [])   # 範本只有 4 項：再加舊內建範本（原文遊記買的東西）有照片與價格的 3 項

    def dayplace(dp):
        pid = dp['place']
        base = {'name': L.get(f'place.{pid}', '')}
        if pid in s['places']:
            base.update({k: s['places'][pid][k] for k in ('latitude', 'longitude')})
        base.update({'timeZoneID': dp['timeZoneID'], 'countryCode': dp['countryCode']})
        return base

    out = {
        'formatVersion': s['formatVersion'], 'templateID': s['templateID'], 'revision': s['revision'], 'contentLocale': lang,
        'title': T('trip.title'), 'subtitle': T('trip.subtitle'), 'summary': T('trip.summary'), 'destination': T('trip.destination'),
        'regionCodes': s['regionCodes'], 'dayCount': s['dayCount'], 'coverColour': s['coverColour'], 'defaultTimeZoneID': s['defaultTimeZoneID'],
        'tags': [T(k) for k in s.get('tagKeys', [])],
        'todos': todos(s.get('todoKeys')),
        'cover': 'cover',
        'allDayEvents': [event(e) for e in s.get('allDayEvents', [])],
        'unscheduledEvents': [event(e) for e in s.get('unscheduledEvents', [])],
        'markers': s.get('markers', []),
        'notes': notes, 'overviewNoteKey': s.get('overviewNoteKey'),
        'inspirations': extras.get('inspirations', {}).get(lang, []),
        'links': extras.get('links', {}).get(lang, []),
        'shopping': shopping,
        'dayPlaces': [dayplace(dp) for dp in s['dayPlaces']],
        'days': days,
    }
    return out


for lang in LANGS:
    json.dump(build(lang), open(os.path.join(here, f'sanyo.{lang}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# 首頁互動示意讀的壓縮版（assets/data/sanyo-<zh|zh-Hans|en|ja>.json）
site = os.path.join(root, 'assets', 'data')
for l, k in (('zh-Hant-TW', 'zh'), ('zh-Hans', 'zh-Hans'), ('en', 'en'), ('ja', 'ja')):
    d = json.load(open(os.path.join(here, f'sanyo.{l}.json'), encoding='utf-8'))
    json.dump(d, open(os.path.join(site, f'sanyo-{k}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('synced', LANGS, 'from', src, 'revision', s['revision'])

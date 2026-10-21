#!/usr/bin/env python3
"""screens/inspiration-strings.js：靈感畫面用到的 App 字串，從 App repo 的 Scripts/i18n/maps/*.json 抄出來（不手打）。

  python3 tools/gen-inspiration-strings.py [App repo 根目錄]

語系：zh-Hant-TW／en／ja／ko／zh-Hans（zh-Hans 目前沒有任何畫面在用，先備著）。
"""
import json, sys, pathlib

APP = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/Users/zhgchgli/Projects/tripezgo/.claude/worktrees/fix-security-140')
LANGS = ['zh-Hant-TW', 'en', 'ja', 'ko', 'zh-Hans']
KEYS = {
  'Widgets': ['widgets.subtab.inspiration', 'widgets.inspiration.filter.type', 'widgets.inspiration.side.unlinked',
    'widgets.inspiration.category.place', 'widgets.inspiration.category.image', 'widgets.inspiration.category.link', 'widgets.inspiration.category.text',
    'widgets.inspiration.yesterday', 'widgets.inspiration.link.title', 'widgets.inspiration.unread',
    'widgets.inspiration.destination.event', 'widgets.inspiration.destination.note', 'widgets.inspiration.destination.shopping',
    'widgets.inspiration.destination.attachment', 'widgets.inspiration.destination.marker',
    'widgets.inspiration.addto.event.subtitle', 'widgets.inspiration.addto.note.subtitle', 'widgets.inspiration.addto.shopping.subtitle',
    'widgets.inspiration.addto.attachment.subtitle', 'widgets.inspiration.addto.attachment.link.subtitle',
    'widgets.inspiration.addto.marker.noplace', 'widgets.inspiration.detail.relations', 'widgets.inspiration.detail.norelations',
    'widgets.inspiration.detail.webimage', 'widgets.inspiration.detail.edit', 'widgets.inspiration.detail.delete',
    'widgets.inspiration.row.linked', 'widgets.inspiration.added.toast', 'widgets.inspiration.photos'],
  'Domain': ['domain.inspiration.source.instagram', 'domain.inspiration.source.threads', 'domain.inspiration.source.googlemaps'],
  'ShareForm': ['shareform.title.inspiration', 'shareform.label.trip', 'shareform.label.eventtype', 'shareform.action.save', 'shareform.action.cancel'],
  'TripEZGoShare': ['share.done.inspiration', 'share.text.quoted'],
  'UI': ['ui.typepicker.auto'],
}
out = {l: {} for l in LANGS}
for f, keys in KEYS.items():
    entries = {e['key']: e for e in json.load(open(APP / 'Scripts/i18n/maps' / f'{f}.json'))['entries']}
    for k in keys:
        for l in LANGS:
            out[l][k] = entries[k][l]
body = json.dumps(out, ensure_ascii=False, indent=1)
dest = pathlib.Path(__file__).resolve().parent.parent / 'screens/inspiration-strings.js'
dest.write_text(f"""// 靈感畫面（inspiration.html、share-ext.js 的靈感模式、share-web.html）用到的 App 字串。
// 由 tools/gen-inspiration-strings.py 從 App repo 的 Scripts/i18n/maps/{{Widgets,Domain,ShareForm,TripEZGoShare,UI}}.json 產生——不要手改。
export const IS = {body};
""")
print('wrote', dest)

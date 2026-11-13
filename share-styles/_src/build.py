#!/usr/bin/env python3
"""產生 share-styles/<id>/{pdf,story,square,web}.html 與 index.html。

跑法：  PYTHONPATH=<有 segno 的目錄> python3 share-styles/_src/build.py [--verify]
  --verify  每份 HTML 結尾多塞一段量測 script（給 chrome-headless-shell --dump-dom 讀，量有沒有溢出）。
            輸出到 stdout 同目錄的 _verify/，不會覆蓋正式檔。

這支程式只是把「範例資料寫死進 HTML」這件事自動化；交付物是產出的 .html（純 HTML＋CSS、無 JS、無外部資源）。
資料槽用 HTML 註解標出：<!-- slot: trip.name -->；重複區塊用 <!-- repeat: days[] -->。
"""
import html
import re
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from data import *  # noqa

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SITE = os.path.abspath(os.path.join(ROOT, '..'))
VERIFY = '--verify' in sys.argv

# ── 圖示 ────────────────────────────────────────────────────────────────
icons_js = open(os.path.join(SITE, 'trip', 'icons.js'), encoding='utf8').read()


def _grab(name):
    m = re.search(r'export const %s = (\{.*?\});' % name, icons_js, re.S)
    return json.loads(m.group(1))


MAKI = _grab('MAKI')
MAKI_OF_TYPE = _grab('MAKI_OF_TYPE')
TYPE_SWATCH = _grab('TYPE_SWATCH')
SW_LIGHT = _grab('SWATCH_LIGHT')
SW_DARK = _grab('SWATCH_DARK')

# 24×24 描邊圖示：全部取自 Open Design 稿（z-export-190、tripezgo-ios-trips、trip-share-public）
I = {
    'pin': '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>',
    'walk': '<circle cx="13" cy="4" r="2" fill="currentColor" stroke="none"/><path d="M11.5 8.5 9 13l3 2 1 6M13.5 8.5l2 3.5 3 1M12 15l-3 6"/>',
    'car': '<path d="M5 16.5V13l1.9-4.3A2 2 0 0 1 8.7 7.5h6.6a2 2 0 0 1 1.8 1.2L19 13v3.5M4 13h16"/><circle cx="8" cy="16.5" r="1.4"/><circle cx="16" cy="16.5" r="1.4"/>',
    'bus': '<rect x="4" y="4.5" width="16" height="11" rx="2"/><path d="M4 10h16M7.5 15.5V18M16.5 15.5V18"/><circle cx="7.5" cy="12.8" r=".9"/><circle cx="16.5" cy="12.8" r=".9"/>',
    'train': '<rect x="6" y="4" width="12" height="12" rx="2"/><path d="M6 11h12M9.5 19.5 8 22M14.5 19.5 16 22"/><circle cx="9.5" cy="13.5" r=".8"/><circle cx="14.5" cy="13.5" r=".8"/>',
    'ferry': '<path d="M3 18.2c1.5 0 1.5-1.3 3-1.3s1.5 1.3 3 1.3 1.5-1.3 3-1.3 1.5 1.3 3 1.3 1.5-1.3 3-1.3"/><path d="M5 14.2 6.2 9.5h11.6L19 14.2"/><path d="M9.5 9.5V6.2h5v3.3"/>',
    'flight': '<path d="M12 3.4c.9 0 1.3 1.1 1.3 2.2v3.3l7.2 4.1v2l-7.2-2.1v3.5l2.3 1.7v1.4L12 18.7l-3.6.8v-1.4l2.3-1.7v-3.5L3.5 15v-2l7.2-4.1V5.6c0-1.1.4-2.2 1.3-2.2Z"/>',
    'warn': '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17.2v.1"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7.4V12l3 1.8"/>',
    'cal': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    'link': '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>',
    'file': '<path d="M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6"/>',
    'lock': '<path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
}
LEG_ICON = {'walk': 'walk', 'car': 'car', 'bus': 'bus', 'train': 'train', 'ferry': 'ferry', 'flight': 'flight'}


def esc(s):
    return html.escape(s, quote=False)


def svg(name, cls='ic'):
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % (cls, I[name])


def maki(type_key, cls='mk'):
    mid = MAKI_OF_TYPE.get(type_key, 'marker')
    return '<svg class="%s" viewBox="0 0 15 15" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="%s"/></svg>' % (cls, MAKI.get(mid, MAKI['marker']))


def sw(type_key):
    return TYPE_SWATCH.get(type_key, 'misc')


def slot(name):
    return '<!-- slot: %s -->' % name


def swatch_css():
    out = [':root{']
    for k, v in SW_LIGHT.items():
        out.append('--sw-%s:%s;' % (k, v))
    out.append('}')
    return ''.join(out)


# ── QR（segno；單色、ink 模組、白底由 CSS 給） ────────────────────────────
def qr_svg(text):
    import segno
    q = segno.make(text, error='m', micro=False)
    rows = list(q.matrix)
    n = len(rows)
    d = []
    for y, row in enumerate(rows):
        x = 0
        while x < n:
            if row[x]:
                x0 = x
                while x < n and row[x]:
                    x += 1
                d.append('M%d %dh%dv1h-%dz' % (x0, y, x - x0, x - x0))
            else:
                x += 1
    return '<svg class="qr" viewBox="0 0 %d %d" shape-rendering="crispEdges" role="img" aria-label="QR"><path fill="currentColor" d="%s"/></svg>' % (n, n, ''.join(d))


# ── 元件 ────────────────────────────────────────────────────────────────
def edge_arrows(arrows):
    out = []
    for a in arrows:
        out.append(
            '<div class="edge edge-%s" style="--pos:%d%%;--deg:%ddeg">'
            '<!-- slot: map.offscreen[].label -->'
            '<span class="edge-lbl">%s</span>'
            '<svg class="edge-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5 21 12 4 19z"/></svg></div>'
            % (a['side'], a['pos'], a['deg'], esc(a['label'])))
    return ''.join(out)


def map_block(img, arrows, baked=False, cls='', note=None):
    n = '<span class="draft-note">%s</span>' % esc(note) if note else ''
    return ('<div class="map %s"><!-- slot: day.map（原生端拍好的地圖圖；框外的站由 day.map.offscreen 畫成邊緣箭頭） -->'
            '<img class="map-img" src="%s" alt="">%s%s</div>') % (cls, img, edge_arrows(arrows), n)


def url_cell(key, compact=False):
    u = URLS[key]
    og = ('<figure class="uc-og"><!-- slot: attachment.ogImage（分享當下抓；抓不到就整個 figure 不放） --><img src="%s" alt=""></figure>' % u['og']) if u['og'] else ''
    return ('<div class="url-cell%s%s"><!-- slot: attachment.url -->%s'
            '<div class="uc-body"><div class="uc-text"><!-- slot: attachment.title --><p class="uc-title">%s</p>'
            '<!-- slot: attachment.domain --><p class="uc-domain">%s %s</p></div>'
            '<!-- slot: attachment.qr -->%s</div></div>') % (
        ' no-og' if not u['og'] else '', ' compact' if compact else '', og, esc(u['title']), svg('link', 'ic ic-s'), esc(u['domain']), qr_svg(u['url']))


def file_chip(f):
    ext = f['name'].rsplit('.', 1)[-1].upper()
    return ('<li class="file-chip"><span class="fc-ic">%s<b>%s</b></span><span class="fc-t"><!-- slot: attachment.name --><span class="fc-n">%s</span>'
            '<!-- slot: attachment.meta --><span class="fc-m">%s</span></span></li>') % (svg('file'), ext, esc(f['name']), esc(f['meta']))


PAGE_OF = {}   # section id → PDF 頁碼（index 頁的預覽用）
DAY_FIRST = {}   # 第幾天 → (PDF 裡第一個 section 的 id, 頁碼)
ATT_PG = {}   # 附件頁 id → 頁碼；build_template 一開始就算好


def att_ref(a):
    """S97：附件在日頁卡片上的引用＝書籤「[附件 3] 去程機票.pdf」，指到那份附件的第一頁（內部連結 #att-N）；社群不顯示。"""
    if a['kind'] == 'url':
        n, label = ATT_NO[('url', a['key'])], URLS[a['key']]['title']
    else:
        n, label = ATT_NO[('file', a['name'])], a['name']
    return n, label


def attachments(att, fmt):
    if not att or fmt in ('story', 'square'):
        return ''
    out = ['<!-- repeat: event.attachments[]（每個附件一行書籤「[附件 N] 檔名」；PDF 內是內部連結 #att-N，指到那份附件的第一頁；社群不顯示） --><div class="ev-att">']
    for a in att:
        n, label = att_ref(a)
        out.append('<a class="ev-bm imp" href="#att-%d"><!-- slot: attachment.bookmark（附件連號 + 檔名） --><span class="bm-p">[附件 %d]</span><span class="bm-n">%s</span></a>' % (n, n, esc(label)))
    out.append('</div>')
    return ''.join(out)


def desc_units(e):
    """行程描述的可拆單位：每個段落一個、內嵌圖一個（圖本身不能拆）。"""
    n = len(e.get('desc', []))
    return n + (1 if e.get('descImg') else 0)


def rich_range(e, lo, hi):
    """描述的第 lo 到 hi-1 個單位（hi=None＝到最後）。"""
    n = len(e.get('desc', []))
    tot = desc_units(e)
    hi = tot if hi is None else hi
    paras = e.get('desc', [])[lo:min(hi, n)] if lo < n else []
    di = e.get('descImg') if (e.get('descImg') and lo <= n < hi) else None
    if not paras and not di:
        return ''
    return rich(paras, di[0] if di else None, di[1] if di else None)


def rich(paras, img=None, cap=None):
    out = ['<div class="rich"><!-- slot: event.description（段落＋內嵌圖；內嵌圖是縮圖後的本機檔） -->']
    for p in paras:
        out.append('<p>%s</p>' % esc(p))
    if img:
        out.append('<figure class="inline-img"><img src="%s" alt=""><figcaption>%s</figcaption></figure>' % (img, esc(cap or '')))
    out.append('</div>')
    return ''.join(out)


TRIP_ZONE = {'kind': 'own', 'label': '日本'}   # 範例旅程的時區；行程沒自選時區就顯示這個


def tz_span(label):
    return '<span class="tz">%s時間</span>' % esc(label)


def time_html(e):
    """S104：時區直接接在時刻後面、同一行、次要墨色小字；每則都寫，跟旅程時區相同也寫（S91）。
    起訖不同時區：各自接在自己的時刻後面「11:10 台北時間 → 14:11 日本時間」。選了別的時區時，時刻已換算成該時區。"""
    z = e.get('tz') or TRIP_ZONE
    if z['kind'] == 'split':
        a, c = e['time'].split('–')
        inner = '%s%s → %s%s' % (a, tz_span(z['a']), c, tz_span(z['b']))
    else:
        inner = '%s%s' % (z.get('time', e['time']), tz_span(z['label']))
    return ('<!-- slot: event.time + event.tzLabel（時刻後面接時區，同一行、次要墨色小字；起訖不同時區各接各的；選了別的時區時時刻已換算；'
            '一行放不下時時區整段換到下一行，不從中間斷開） --><p class="ev-time">%s</p>' % inner)


def loc_block(e):
    """S82 地址：地點名稱／地址各一行；沒有地址就只有地點名稱（pin icon 在名稱前）。時區不再獨立一行（S104）。"""
    if e.get('addr'):
        return ('<!-- slot: event.location + event.address（地址在地點名稱下一行；PDF 可換行、社群一行省略；沒有地址整行不放） -->'
                '<p class="ev-loc has-addr"><span class="loc-n">%s</span><span class="loc-a">%s<span class="a-t">%s</span></span></p>' % (
                    esc(e['loc']), svg('pin', 'ic ic-s'), esc(e['addr'])))
    return '<!-- slot: event.location --><p class="ev-loc">%s<span class="loc-n">%s</span></p>' % (svg('pin', 'ic ic-s'), esc(e['loc']))


def event_card(e, fmt, compact=False, in_group=False):
    t = e['type']
    s = sw(t)
    cover = ''
    if e.get('cover'):
        cover = '<figure class="ev-cover"><!-- slot: event.cover --><img src="%s" alt=""></figure>' % e['cover']
    desc = ''
    if fmt in ('pdf', 'web') and (e.get('desc') or e.get('descImg')):
        di = e.get('descImg')
        desc = rich(e.get('desc', []), di[0] if di else None, di[1] if di else None)
    return (
        '<article class="event%s%s" style="--ev:var(--sw-%s)" data-type="%s">'
        '%s<div class="ev-main">'
        '<div class="ev-top"><!-- slot: event.number --><span class="ev-no">%d</span>'
        '<!-- slot: event.name --><h4 class="ev-name">%s</h4></div>'
        '%s'
        '%s'
        '<!-- slot: event.type（類型色＋圖示＋名稱，色與圖示由 looks 對照表決定） --><p class="ev-type"><i class="dot"></i>%s<span>%s</span></p>'
        '%s%s</div><i class="notch n1"></i><i class="notch n2"></i><i class="tape"></i></article>'
    ) % (' compact' if compact else '', ' has-cover' if cover else ' no-cover', s, t, cover, e['n'], esc(e['name']), time_html(e),
         loc_block(e), maki(t), TYPE_NAME[t], desc, attachments(e.get('att'), fmt))


def run_time(r):
    """S96＋S104：一班車可以只填部分——名稱、發車、到達都可以是空的。有時刻才寫時區，接在時刻後面；
    起訖不同時區各接各的；選了別的時區時，時刻已換算。只填名稱（沒有時刻）就不寫時區。"""
    z = r.get('tz') or TRIP_ZONE
    dep, arr = (z['dep'], z['arr']) if z['kind'] == 'own' and 'dep' in z else (r.get('dep'), r.get('arr'))
    za, zb = (z['a'], z['b']) if z['kind'] == 'split' else (z['label'], z['label'])
    if dep and arr:
        if z['kind'] == 'split':
            return '%s%s → %s%s' % (dep, tz_span(za), arr, tz_span(zb))
        return '%s → %s%s' % (dep, arr, tz_span(zb))
    if dep:
        return '%s 發車%s' % (dep, tz_span(za))
    if arr:
        return '%s 到達%s' % (arr, tz_span(zb))
    return ''


def leg_svc(r):
    """S88：路程填了班次（大眾運輸的班次名＋發車／到達時刻）時，交通膠囊只放班次與時刻（時區接在時刻後面）；只填名稱就不寫箭頭、時間與時區。"""
    tm = run_time(r)
    return ('<!-- slot: leg.service + leg.departure/arrival + leg.tzLabel（班次名＋發車／到達時刻，時區接在時刻後面；只填名稱就只寫名稱；社群一行放不下時時區整段換行） -->'
            '<span class="leg-svc">%s%s</span>' % (
                ('<b class="svc-n">%s</b>' % esc(r['name'])) if r.get('name') else '',
                ('<span class="svc-t"><span class="leg-tl">%s</span></span>' % tm) if tm else ''))


def _mins(s):
    h = re.search(r'(\d+)\s*小時', s or '')
    m = re.search(r'(\d+)\s*分', s or '')
    if not h and not m:
        return None
    return (int(h.group(1)) * 60 if h else 0) + (int(m.group(1)) if m else 0)


def _dur(n):
    return '%d 分' % n if n < 60 else ('%d 小時' % (n // 60) if n % 60 == 0 else '%d 小時 %d 分' % (n // 60, n % 60))


def leg_rel(l):
    """S110：照 App 的規則寫「提早 X 到／遲到 X」（CONTEXT.md〈TransportMode〉）：路程時間減空檔；剛好不寫，差到三小時（180 分）以上也不寫。
    回傳 (None | 'early' | 'late', 文字)。有班次的路程：這裡仍用路程時間（label）去比，沒有另外套班次算式——App 對班次的算法我沒有讀到，不自己發明。"""
    tm, gp = _mins(l['label']), _mins(l['gap'])
    if tm is None or gp is None:
        return None, ''
    d = tm - gp
    if d == 0 or abs(d) >= 180:
        return None, ''
    return ('late', '遲到 %s' % _dur(d)) if d > 0 else ('early', '提早 %s到' % _dur(-d))


def run_alt(r):
    return ' '.join(x for x in ((r.get('dep') or r.get('arr') or ''), r.get('name') or '') if x) or '（未填）'


def leg_block(l, fmt):
    late = ''
    kind, rel = leg_rel(l)
    _runs = l.get('runs') or ([l['svc']] if l.get('svc') else [])
    _sel = l.get('sel', 0 if len(_runs) == 1 else None) if 'runs' in l else (0 if _runs else None)
    if _runs and _sel is not None and 0 <= _sel < len(_runs) and _runs[_sel].get('name'):
        kind, rel = None, ''   # App：填了班次時膠囊只寫「班次 發車 路程時間」，差額也讓開（RouteText.legPill／TripTextFormatter.runLabel）
    if kind == 'late':
        late = '<!-- slot: leg.late（遲到：保留警示圖示和框，黑白列印靠圖示與框分辨） --><i class="leg-sep">·</i><span class="leg-late">%s<span>%s</span></span>' % (svg('warn', 'ic ic-s'), rel)
    elif kind == 'early':
        late = '<!-- slot: leg.early（提早：一般次要墨色、不加框） --><i class="leg-sep">·</i><span class="leg-early">%s</span>' % rel
    desc = ''
    if l.get('desc') and fmt in ('pdf', 'web'):
        desc = '<!-- slot: leg.description --><p class="leg-desc">%s</p>' % esc(l['desc'])
    runs = l.get('runs') or ([l['svc']] if l.get('svc') else [])
    sel = l.get('sel', 0 if len(runs) == 1 else None) if 'runs' in l else (0 if runs else None)
    if sel is not None and not (0 <= sel < len(runs)):
        sel = None   # 索引超出範圍＝沒選
    icon = svg(LEG_ICON[l['mode']], 'ic ic-s')
    alt = ''
    if runs and sel is not None:
        r = runs[sel]
        pill = '<!-- slot: leg.mode + leg.duration --><span class="leg-pill has-svc">%s%s<span class="leg-dur">%s</span></span>' % (icon, leg_svc(r), l['label'])
        others = [x for i, x in enumerate(runs) if i != sel]
        if others:
            alt = ('<!-- slot: leg.alternatives（備案班次：這班趕不上就換那班，不是轉乘；PDF 列出全部，社群只寫「＋N 班備案」） -->'
                   '<p class="leg-alt"><span class="alt-full"><b>備案：</b>%s</span><span class="alt-short">＋%d 班備案</span></p>' % (
                       '、'.join(esc(run_alt(x)) for x in others), len(others)))
    else:
        pill = '<!-- slot: leg.mode + leg.duration --><span class="leg-pill">%s<span>%s</span></span>' % (icon, l['label'])
        if runs:
            alt = ('<!-- slot: leg.alternatives（多班但沒選：列出可搭的班次；社群縮成「N 班可搭」） -->'
                   '<p class="leg-alt"><span class="alt-full"><b>可搭：</b>%s</span><span class="alt-short">%d 班可搭</span></p>' % (
                       '、'.join(esc(run_alt(x)) for x in runs), len(runs)))
    return ('<div class="leg%s"><div class="leg-row"><i class="leg-ln"></i><div class="leg-body">%s'
            '%s</div><i class="leg-ln leg-ln-r"></i></div>%s%s</div>') % (
        ' is-late' if kind == 'late' else '', pill, late, alt, desc)


CATEGORY_TYPE = {v: k for k, v in TYPE_NAME.items()}
CATEGORY_TYPE.update({'住宿': 'hotel'})   # 類型名稱對照（使用者自己寫的字對得到就用它的圖示，對不到用通用圖示）


def allday_card(a):
    """S106／S109：全日行程＝日頁頁首下方的一段輕量清單，不是卡片。第一列：名稱（標題字體、比行程標題小一級）＋右側「第 N／M 天」；
    第二列：日期範圍 · 類型名稱（有填才寫）· 地點（有才寫）；地址只放 PDF、單獨一列。不放圖示。
    S108 的類型 kicker 在這裡不適用（全日清單的例外）：類型併進第二列。沒有「住宿／幾晚」的概念。"""
    num = ('<!-- slot: event.number --><span class="ev-no">%d</span>' % a['n']) if a.get('n') else ''
    multi = a.get('span', 1) > 1
    of = ('<span class="ad-of"><!-- slot: allDayEvent.dayOfSpan（跨天才有：今天是第幾天／共幾天；一律保留，不被省略） -->第 %d／%d 天</span>' % (a['of'], a['span'])) if multi else ''
    meta = [a['range']]
    if a.get('category'):
        meta.append(esc(a['category']))
    if a.get('place'):
        meta.append(esc(a['place']))
    addr = ('<p class="ad-addr"><!-- slot: allDayEvent.address（只放 PDF） -->%s</p>' % esc(a['addr'])) if a.get('place') and a.get('addr') else ''
    return ('<div class="allday"><!-- slot: day.allDay[] --><p class="ad-row1">%s<span class="ad-name"><!-- slot: allDayEvent.title -->%s</span>%s</p>'
            '<p class="ad-meta"><!-- slot: allDayEvent.dateRange + allDayEvent.category（有填才寫）+ allDayEvent.place（有才寫），用「 · 」連接 -->%s</p>%s</div>') % (
        num, esc(a['title']), of, ' · '.join(meta), addr)


def flatten(items):
    """S115：同時段組攤平成一則一則的行程（各帶 'g'＝(組 id, 第幾則, 共幾則)），拆頁時組內兩則之間也可以換頁。"""
    out = []
    for it in items:
        if 'group' in it:
            n = len(it['group'])
            for k, e in enumerate(it['group']):
                out.append({'ev': e, 'g': (id(it['group']), k, n)})
        else:
            out.append(it)
    return out


def _render_item(it, fmt):
    if 'ev' in it:
        return event_card(it['ev'], fmt)
    return leg_block(it['leg'], fmt)


def timeline(day, fmt, items=None):
    items = flatten(day['items'] if items is None else items)
    out = ['<!-- repeat: day.items[]（行程卡／交通膠囊，依時間排；同時段的幾則包在一個 .overlap 裡，每一則都是一般行程卡，上下疊放） --><div class="timeline">']
    i = 0
    while i < len(items):
        it = items[i]
        if it.get('g'):
            gid, k0, n = it['g']
            j = i
            while j < len(items) and items[j].get('g') and items[j]['g'][0] == gid:
                j += 1
            label = ('同時段 · %d 個安排' % n) if k0 == 0 else '同時段（續）'
            out.append('<div class="overlap"><!-- slot: day.overlapGroup[]（同時段的幾則：小標＋左側一條細線；跨頁時續頁標「同時段（續）」） --><p class="ov-label"><span>%s</span></p>%s</div>' % (
                label, ''.join(_render_item(m, fmt) for m in items[i:j])))
            i = j
            continue
        out.append(_render_item(it, fmt))
        i += 1
    out.append('</div>')
    return ''.join(out)


def day_head(d, tag='h2', part=None):
    return ('<header class="day-head"><!-- slot: day.number --><span class="day-no"><i>第</i><b>%d</b><i>天</i></span>'
            '<div class="day-tt"><!-- slot: day.date --><span class="day-date">%s</span>'
            '<!-- slot: day.place --><%s class="day-place">%s</%s>%s</div></header>') % (d['no'], d['date'], tag, esc(d['place']), tag,
        ('<!-- slot: day.part（一天放不下，接到下一張時標第幾張／共幾張） --><span class="day-part">%s</span>' % part) if part else '')


def empty_day(d):
    return ('<div class="day-empty"><!-- slot: day.emptyState（這一天沒有行程時） --><p>這一天還沒有安排</p></div>')


def day_count(d):
    n = 0
    for it in d['items']:
        if 'ev' in it:
            n += 1
        elif 'group' in it:
            n += len(it['group'])
    return n


def day_titles(d):
    names = []
    for it in d['items']:
        for e in ([it['ev']] if 'ev' in it else it.get('group', [])):
            names.append(e['name'])
    return '・'.join(names)


MAX_DAYS = 8   # S76：逐日摘要最多列 8 天，超過的最後一列寫「還有 N 天」


def day_rows():
    return [dict(no=d['no'], date=d['date'], place=d['place'], titles=day_titles(d), summary=d['summary']) for d in DAYS]


def day_index(fmt, ai=False, rows=None):
    rows = rows or day_rows()
    out = ['<!-- repeat: days[]（最多列 8 天；超過就最後一列「還有 N 天」；列數超過 6 加 dense：「第 N 天 · 日期 · 地點」與摘要同一行；每天的摘要行數由原生量測可用高度後平均分配，見 day.summary） --><ol class="day-index%s%s">' % (' dense' if len(rows[:MAX_DAYS]) > 6 else '', ' ai' if ai else '')]
    for d in rows[:MAX_DAYS]:
        txt = d['summary'] if ai else d['titles']
        lst = ('<!-- slot: day.titles（有 AI 一句話時，PDF 在句子下面接著列當天行程；社群不放） --><p class="di-list">%s</p>' % esc(d['titles'])) if ai else ''
        out.append('<li><div class="di-top"><!-- slot: day.number --><span class="di-no">第 %d 天</span><i class="di-sep">·</i>'
                   '<!-- slot: day.date --><span class="di-d">%s</span><i class="di-sep">·</i><!-- slot: day.place --><span class="di-pl">%s</span></div>'
                   '<!-- slot: day.summary（原生端有 AI 一句話就填句子；沒有就填當天行程標題用「・」串起來。行數規則：原生量測總覽可用高度，每一天用同一個行數（--dl-pdf／--dl-story／--dl-square），空間夠就寫 2、3 行以上直到列完那天全部行程名稱，不夠才減少行數，最後才以 … 截斷；AI 一句話版本維持一句，不擴寫） --><p class="di-sum">%s</p>%s</li>'
                   % (d['no'], d['date'].split()[0], esc(d['place']), esc(txt), lst))
    if len(rows) > MAX_DAYS:
        out.append('<li class="di-more"><!-- slot: days.more --><span>還有 %d 天</span></li>' % (len(rows) - MAX_DAYS))
    out.append('</ol>')
    return ''.join(out)


def important_files(fmt):
    """S83／S97：PDF 總覽最下面一行「重要附件：[附件 1] 護照.jpg、[附件 2] …」（附件連號在前、檔名在後），是指到那份附件第一頁的內部連結；沒勾重要附件就整行不放；社群不顯示。"""
    if fmt not in ('pdf', 'web') or not IMPORTANT_FILES:
        return ''
    items = []
    for f in IMPORTANT_FILES:
        n = ATT_NO[('url', f['key'])] if f['kind'] == 'url' else ATT_NO[('file', f['name'])]
        items.append('<a class="ev-bm imp" href="#att-%d"><span class="bm-p">[附件 %d]</span><span class="bm-n">%s</span></a>' % (n, n, esc(f['name'])))
    return ('<!-- slot: trip.importantAttachments（有勾才有這一行；多份用「、」接；PDF 內是內部連結 #att-N；社群不顯示） -->'
            '<p class="imp-bm"><b>重要附件：</b>%s</p>' % '<i class="bm-sep">、</i>'.join(items))


def overview_body(fmt, ai=False, rows=None, trip=None, cover=True):
    TRIP_ = trip or TRIP
    rows = rows or day_rows()
    cov = ('<figure class="cover-media"><!-- slot: trip.cover（封面可不勾：沒勾就整個 figure 不放，標題區直接頂在最上面） --><img src="%s" alt=""></figure>' % TRIP_['cover']) if cover else ''
    head = ('<div class="cover%s">%s<div class="cover-text"><!-- slot: trip.dayCount + trip.dateRange -->'
            '<p class="kicker"><span>%s</span><i></i><span>%s</span></p>'
            '<!-- slot: trip.name --><h1 class="trip-name">%s</h1>'
            '<!-- slot: trip.place --><p class="trip-place">%s%s</p></div>'
            '<i class="deco d1"></i><i class="deco d2"></i><i class="deco d3"></i></div>') % (
        '' if cover else ' no-cover', cov, TRIP_['dayCount'], TRIP_['span'], esc(TRIP_['name']), svg('pin', 'ic ic-s'), esc(TRIP_['place']))
    note = ''
    if fmt in ('pdf', 'web'):
        note = ('<section class="blk blk-note"><h2 class="blk-t">總覽</h2><!-- slot: trip.overviewNote（總覽筆記：文字＋內嵌圖；描述類沒勾就整區不放） -->'
                '<div class="rich">%s<figure class="inline-img"><img src="%s" alt=""><figcaption>%s</figcaption></figure></div></section>') % (
            ''.join('<p>%s</p>' % esc(p) for p in TRIP_['noteP']), TRIP_['noteImg'], esc(TRIP_['noteImgCap']))
    days = '<section class="blk blk-days"><h2 class="blk-t">每日一覽<span class="n">%d</span></h2>%s</section>' % (len(rows), day_index(fmt, ai, rows))
    files = important_files(fmt)   # S83：只剩最下面一行書籤
    return head, note, days, files


def trip_map_block(fmt, cls=''):
    return map_block(TRIP_MAP['img'], TRIP_MAP['arrows'], cls=cls + ' trip-map', note='示意：實際是區域 R 取景的地圖截圖（這裡借第 4 天的圖）')


# ── Powered by TripEZGo badge ────────────────────────────────────────────
# logo 路徑資料一個字沒動，取自 Open Design 的 tripezgo-logo-vector-1to1.svg；viewBox 照品牌識別稿的圖標框（334 235 590 529）
_OD = '/Users/zhgchgli/Library/Application Support/Open Design/namespaces/release-stable/data/projects/tripezgo/tripezgo-logo-vector-1to1.svg'
_logo = open(_OD, encoding='utf8').read()
_LOGO_D = re.search(r'<path d="([^"]+)"', _logo, re.S).group(1)
_LOGO_D = re.sub(r'\s+', ' ', _LOGO_D).strip()
SYMBOL = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="tz-mark" viewBox="334 235 590 529">'
          '<path fill="currentColor" d="%s"/></symbol><symbol id="tz-word" viewBox="191 833 878 153">'
          '<path fill="currentColor" d="%s"/></symbol></svg>') % (_LOGO_D, _LOGO_D)


def badge(pre=False):
    wm = '<svg class="wm" viewBox="0 0 878 153" aria-hidden="true"><use href="#tz-word"/></svg>'
    if pre:
        return ('<!-- slot: share.badge（Premium 預設：Premium 字標；可換成自己的 logo 圖或移除） -->'
                '<span class="badge-a pre">%s<i class="vr"></i><i class="by">Premium</i></span>' % wm)
    return ('<!-- slot: share.badge（Powered by TripEZGo；Premium 可換成 Premium 字標、自己的 logo 圖或移除） -->'
            '<span class="badge-a"><i class="by">Powered by</i>%s</span>' % wm)


def foot_mark(mode):
    if mode == 'logo':
        return '<!-- slot: share.customLogo（Premium：自己的 logo 橫幅圖，只放圖，取代整個 badge） --><img class="user-logo" src="../_sample/user-logo.svg" alt="">'
    if mode == 'none':
        return '<!-- slot: share.badge（Premium：已移除） -->'
    if mode == 'premium':
        return badge(True)
    return badge()


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tripmap.py'), encoding='utf8').read())


# ── 頁／板 ──────────────────────────────────────────────────────────────
SIG = '使用 https://tripezgo.com 安排的旅程。'


_OVL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'overview-lines.json')
OVL = json.load(open(_OVL_PATH)) if os.path.exists(_OVL_PATH) else {}


def sheet(sid, body, pn, total, cls='', run=True, foot='badge'):
    ostyle = ''
    if sid == 'overview' or sid.startswith('v-overview'):
        ostyle = ' style="%s"' % ';'.join('--dl-%s:%d' % (f_, OVL.get(f_ + (PAPER_KEY if f_ == 'pdf' else ''), {}).get(sid, 1)) for f_ in ('pdf', 'story', 'square'))
    head = ('<header class="runhead"><!-- slot: trip.shortName --><span>%s</span></header>' % esc(TRIP['short'])) if run else ''
    return ('<section class="sec %s" id="%s"%s>%s<div class="sheet-body">%s</div>'
            '<footer class="runfoot">%s<!-- slot: page.number / page.total --><span class="pn">%d / %d</span></footer></section>'
            % (cls, sid, ostyle, head, body, foot_mark(foot), pn, total))


def draft_note(text):
    return '<p class="draft-note block">%s</p>' % esc(text)


def att_head(n, title, sub, pg=1, np=1):
    """文末附件頁統一的頁首：「附件 N　檔名」加一行來源說明；多頁 PDF 的續頁寫「附件 N · 2/3」。"""
    if pg == 1:
        return '<p class="att-head"><!-- slot: attachment.name --><b>附件 %d　%s</b><br><!-- slot: attachment.origin -->%s</p>' % (n, esc(title), sub)
    return '<p class="att-head"><b>附件 %d · %d/%d</b><br>%s</p>' % (n, pg, np, esc(title))


def att_page_file(name, meta, kind, n, pg, np):
    head = att_head(n, name, esc(meta), pg, np)
    if kind == 'image':
        frame = '<div class="att-frame"><!-- slot: attachment.page（圖片附件一張一頁，原生端縮放到版心） --><img class="att-img" src="../_sample/cover-dome.jpg" alt=""></div>'
    else:
        ln = ''.join('<i style="width:%d%%"></i>' % w for w in ([80, 64, 72, 50, 68, 58] if pg == 1 else [70, 55, 76, 62]))
        frame = ('<div class="att-frame"><!-- slot: attachment.page（PDF 附件的一頁，原生端畫成圖放進來） -->'
                 '<div class="fakepdf"><b class="fp-h"></b>%s<div class="fp-qr"></div></div></div>') % ln
    return head + frame


def att_page_urls(group):
    """連續的網址類附件同在一頁；每一份先寫跟其他附件頁一樣的頁首「附件 N　標題」＋網址，下面是全寬的橫列卡（og 圖＋標題＋QR）；內部連結 #att-N 指到這一份。"""
    blocks = ''.join('<div class="att-block"%s>%s%s</div>' % (
        '' if k_ == 0 else ' id="att-%d"' % a['n'], att_head(a['n'], URLS[a['key']]['title'], esc(a['origin'])), url_cell(a['key'], compact=True))
        for k_, a in enumerate(group))
    return '<!-- repeat: attachments[kind=url] -->%s' % blocks


def att_sections():
    """依 ATTACH 的順序展開成文末的 section：(id, 內容)。檔案類每頁一個 section，連續的網址類併成一頁。"""
    secs, i = [], 0
    while i < len(ATTACH):
        a = ATTACH[i]
        if a['kind'] == 'url':
            grp = []
            while i < len(ATTACH) and ATTACH[i]['kind'] == 'url':
                grp.append(ATTACH[i])
                i += 1
            secs.append(('att-%d' % grp[0]['n'], att_page_urls(grp), [x['n'] for x in grp]))
        else:
            for pg in range(1, a['pages'] + 1):
                secs.append(('att-%d' % a['n'] if pg == 1 else 'att-%d-p%d' % (a['n'], pg),
                             att_page_file(a['name'], a['meta'], 'image' if a['kind'] == 'image' else 'pdf', a['n'], pg, a['pages']), [a['n']] if pg == 1 else []))
            i += 1
    return secs


def read(p):
    return open(os.path.join(ROOT, '_src', p), encoding='utf8').read()


sys.path.insert(0, os.path.join(ROOT, '_src'))
from cssunify import assemble  # noqa: E402

VERIFY_JS = """<script>
addEventListener('load',function(){setTimeout(function(){
var r=[];document.querySelectorAll('.sec').forEach(function(e){
 var b=e.getBoundingClientRect(), bd=e.querySelector('.sheet-body');
 var vis=getComputedStyle(e).display!=='none'&&b.width>0;
 var worst=0,worstEl='';
 if(vis&&bd){var lim=bd.getBoundingClientRect().bottom;
  bd.querySelectorAll('*').forEach(function(c){
   if(c.classList.contains('notch')||c.classList.contains('tape'))return;
   if(c.closest('.lay,.edge,.draft-note,.legend,.map,.notch,.tape'))return;
   var cb=c.getBoundingClientRect();
   if(cb.width&&cb.height){var o=cb.bottom-lim;if(o>worst){worst=o;worstEl=c.className||c.tagName;}}
  });}
 r.push({id:e.id,vis:vis,x:Math.round(b.left+scrollX),y:Math.round(b.top+scrollY),w:Math.round(b.width),h:Math.round(b.height),worst:Math.round(worst),el:String(worstEl).slice(0,40)});
});
var all={docW:document.documentElement.scrollWidth,docH:document.documentElement.scrollHeight,vw:innerWidth,vh:innerHeight,items:r};
var p=document.createElement('pre');p.id='__m';p.style.display='none';p.textContent=JSON.stringify(all);document.body.appendChild(p);
},1200)});
</script>"""

STYLES = {
    'magazine': '雜誌',
}

# 第 2 天放不下一頁／一張，拆成兩段。誰拆：原生端依量測把一天的行程分成多個 section 填進同一份模板；
# 模板只負責「一個 section ＝ 一頁（PDF）／一張（限動、方形）」。這份範例用 (0,3)／(3,11) 示範，
# 三種輸出都放得下（PDF 的頁高最緊，以它為準）。
# 拆法依風格各自量測：autosplit 量每一天每一則的高度，用三種輸出裡最緊的那個決定在哪裡斷（_src/splits.json）。
# NOSPLIT=1 時不拆（量測用）。
_SPLITS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'splits.json'))) if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'splits.json')) else {}
NOSPLIT = bool(os.environ.get('NOSPLIT'))
PAPER = (os.environ.get('PAPER') or 'a4').lower()   # a4（預設）或 letter（美加）：Letter 是另一份輸出 template-letter.html，@page 與頁面尺寸不同、拆頁另量（splits.json 的 pdf-letter）
PAPER_KEY = '-letter' if PAPER == 'letter' else ''
LETTER_CSS = ''


FMTS = ('pdf', 'story', 'square')


def day_parts(style, d, fmt='pdf'):
    """一天拆成幾段由原生端依格式各自量測決定；稿裡 PDF、9:16、1:1 各量各的（_src/splits.json），用 for-* 標出各格式的範例拆法。
    回傳 [(a, z)]：這一段含第 a 到 z-1 則。一張行程卡（含同時段的小組）不跨頁，放不下就整張移到下一頁。"""
    n = len(flatten(d['items']))
    if NOSPLIT:
        return [(0, n)]
    p = _SPLITS.get(style, {}).get(fmt + PAPER_KEY, {}).get(str(d['no']))
    if not p:
        return [(0, n)]
    return [tuple(x) for x in p]


def build_template(style, nm):
    n_pre = 3 + sum(len(day_parts(style, d, 'pdf')) for d in DAYS)
    ASEC = att_sections()
    for k, (sid_, _c, ns_) in enumerate(ASEC):
        for n_ in ns_:
            ATT_PG[n_] = n_pre + k + 1
    S = []   # (id, cls, body, run)
    head, note, days, files = overview_body('pdf')
    S.append(('overview', 'sheet-overview', head + note + days + files, False))
    for pi in (0, 1):
        lay = ''.join('<div class="lay lay-%s"><!-- slot: trip.map.layer（原生端只要填目標格式那一層：圖與圖釘位置依該畫布的 point(for:) 算） -->%s</div>' % (
            f, trip_map_page(style, 'pdf-letter' if (PAPER == 'letter' and f == 'pdf') else f, pi)) for f in ('pdf', 'story', 'square'))
        S.append(('map-%d' % (pi + 1), 'sheet-map', lay + legend_page(pi, 'legend'), False))
    for d in DAYS:
        for f_ in FMTS:
            parts = day_parts(style, d, f_)
            gcls = 'for-%s' % f_
            for pi, (a, z) in enumerate(parts):
                part = '%d/%d' % (pi + 1, len(parts)) if len(parts) > 1 else None
                body = day_head(d, part=part)
                if pi == 0 and d['allday']:
                    body += '<div class="allday-list"><p class="ov-label allday-label"><!-- slot: day.allDay（小標「全日」） -->全日</p>%s</div>' % ''.join(allday_card(x_) for x_ in d['allday'])
                its = flatten(d['items'])[a:z]
                body += timeline(d, 'pdf', its)
                S.append(('day%d-%s-%d' % (d['no'], f_, pi + 1), 'sheet-day ' + gcls, body, True))
    for sid_, content_, _n in ASEC:
        S.append((sid_, 'sheet-att', content_, True))
    def in_pdf(c_):
        return 'for-' not in c_ or 'for-pdf' in c_
    pns, k_ = [], 0
    for sid_, c_, _b, _r in S:
        if in_pdf(c_):
            k_ += 1
            pns.append(k_)
            PAGE_OF[sid_] = k_
            m_ = re.match(r'day(\d+)', sid_)
            if m_:
                DAY_FIRST.setdefault(int(m_.group(1)), (sid_, k_))
        else:
            pns.append(0)
    total = k_
    ids_ = []
    for i_, (sid_, c_, _b, _r) in enumerate(S):
        fm_ = 'pdf' if 'for-pdf' in c_ else 'story' if 'for-story' in c_ else 'square' if 'for-square' in c_ else 'all'
        ids_.append({'id': sid_, 'format': fm_, 'pdfPage': pns[i_] if pns[i_] else None})
    json.dump({'style': style, 'sections': ids_}, open(os.path.join(ROOT, '_src', 'section-ids%s.json' % PAPER_KEY), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    out = [sheet(sid, body, pns[i], total, cls, run) for i, (sid, cls, body, run) in enumerate(S)]
    # 稿上的備註區（列印時 display:none）：變體與狀態示範。每個 section 右上角有一顆說明膠囊（draft-note）。
    d6 = [x for x in S if x[0].startswith('day6')][0]
    drafts = [
        ('v-premium', 'sheet-day', d6[2], 'premium', 'Premium 預設 badge（A 的 Premium 版）'),
        ('v-logo', 'sheet-day', d6[2], 'logo', 'Premium：換成自己的 logo（只放圖、取代整個 badge）'),
        ('v-none', 'sheet-day', d6[2], 'none', 'Premium：移除 badge'),
    ]
    for sid, cls, body, foot, label in drafts:
        out.append(sheet(sid, body, total, total, cls + ' draft', True, foot).replace('</section>', '<span class="draft-note">%s</span></section>' % esc(label)))
    empty = day_head(EMPTY_DAY) + empty_day(None)
    out.append(sheet('v-empty', empty, total, total, 'sheet-day draft', True).replace('</section>', '<span class="draft-note">狀態示範：空的一天</span></section>'))
    h2, n2, d2, f2 = overview_body('pdf', True)
    out.append(sheet('v-overview-ai', h2 + n2 + d2 + f2, total, total, 'sheet-overview draft', False).replace('</section>', '<span class="draft-note">總覽：AI 一句話版（day.summary 填句子）</span></section>'))
    h3, n3, d3, f3 = overview_body('pdf', False, EX12, TRIP12)
    out.append(sheet('v-overview-12', h3 + n3 + d3 + f3, total, total, 'sheet-overview draft', False).replace('</section>', '<span class="draft-note">12 天範例：最多列 8 天，第 9 天以後收成「還有 4 天」（PDF、9:16、1:1 都一樣）</span></section>'))
    h4, n4, d4, f4 = overview_body('pdf', False, None, None, cover=False)
    out.append(sheet('v-overview-nocover', h4 + n4 + d4 + f4, total, total, 'sheet-overview no-cover draft', False).replace('</section>', '<span class="draft-note">封面可不勾：沒有封面時標題區頂在最上面，版面不留洞（PDF、9:16、1:1）</span></section>'))
    d3_ = DAYS[2]
    cut = False
    items3 = []
    for it in d3_['items']:
        if 'leg' in it and not cut:
            cut = True
            continue
        items3.append(it)
    body5 = day_head(d3_) + timeline(d3_, 'pdf', items3[:4])
    out.append(sheet('v-noleg', body5, total, total, 'sheet-day draft', True).replace('</section>', '<span class="draft-note">路程可不勾：被取消的那一段不畫交通膠囊，兩則行程直接相接</span></section>'))
    # S79：行程封面不勾——同一張卡，一張有圖、一張沒圖
    evc = [it for it in DAYS[1]['items'] if 'ev' in it and it['ev'].get('cover')][0]['ev']
    evc = dict(evc, desc=[], descImg=None)
    nocov = dict(evc, cover=None)
    body6 = day_head(DAYS[1]) + timeline(DAYS[1], 'pdf', [{'ev': evc}, {'ev': nocov}])
    out.append(sheet('v-nocover-event', body6, total, total, 'sheet-day draft', True).replace('</section>', '<span class="draft-note">行程封面可不勾：上面有圖、下面是同一張卡沒勾封面（沒圖就不留位置）</span></section>'))
    # S81：PDF 書籤目錄（outline）由原生端產生
    rows_o = [('總覽', 1), ('地圖', 2)]
    pg = 4
    for d in DAYS:
        parts = day_parts(style, d, 'pdf')
        rows_o.append(('第 %d 天　%s' % (d['no'], d['place']), pg))
        pg += len(parts)
    rows_o += [('附件 %d　%s' % (x['n'], x['name'] if x['kind'] != 'url' else URLS[x['key']]['title']), ATT_PG[x['n']]) for x in ATTACH]
    ol = ''.join('<li><span>%s</span><b>%d</b></li>' % (esc(n), p) for n, p in rows_o)
    outline = ('<h2 class="page-t">PDF 書籤目錄</h2><p class="draft-p">PDF 的側欄書籤目錄（outline）由原生端產生：每個 section 一條，指到它的頁碼；'
               '用 PDFKit 的 <code>PDFOutline</code> 建立，這份 HTML 預覽不帶。日頁卡片裡的小書籤（[附件 N] 檔名）則是 PDF 內部連結，列印時由 HTML 的錨點轉成。社群格式沒有書籤。</p>'
               '<ol class="outline-demo">%s</ol>' % ol)
    out.append(sheet('v-outline', outline, total, total, 'sheet-day draft pdfonly', False).replace('</section>', '<span class="draft-note">說明：PDF 書籤目錄由原生端產生（PDFKit PDFOutline），只有 PDF</span></section>'))
    h5, n5, d5, f5 = overview_body('pdf')
    out.append(sheet('v-overview-noimp', h5 + n5 + d5, total, total, 'sheet-overview draft', False).replace('</section>', '<span class="draft-note">沒勾重要附件：總覽最下面那行書籤整行不放</span></section>'))
    base_ev = [it['ev'] for it in DAYS[0]['items'] if 'ev' in it][2]
    flight_ev = [it['ev'] for it in DAYS[0]['items'] if 'ev' in it][0]
    ev_same = dict(base_ev, cover=None, desc=[], att=None)   # 起訖同一個時區（旅程時區）：只寫一次
    ev_split = dict(flight_ev, cover=None, desc=[], att=None, addr=None)   # 起訖不同時區：各接各的
    ev_own = dict(base_ev, tz={'kind': 'split', 'a': '台北', 'b': '日本'}, time='18:00–20:30', cover=None, desc=[], att=None)   # 自選：開始選台北、結束選日本（S126）→ 18:00 台北時間 → 20:30 日本時間
    mkl = lambda z, run=None, mode='train', label='火車 20 分': {'leg': {'mode': mode, 'label': label, 'gap': '空檔 25 分', 'late': None, 'desc': None,
                              'runs': [dict(run or {'name': '山陽本線 快速 2433M', 'dep': '16:20', 'arr': '16:40'}, **({'tz': z} if z else {}))]}}
    lg_same = mkl(None)
    lg_split = mkl({'kind': 'split', 'a': '台北', 'b': '日本'}, {'name': '虎航 IT 230', 'dep': '11:10', 'arr': '14:11'}, 'flight', '飛行 3 小時 1 分')
    lg_own = mkl({'kind': 'split', 'a': '台北', 'b': '日本'}, {'name': '山陽本線 快速 2433M', 'dep': '15:20', 'arr': '16:40'})
    body7 = day_head(dict(DAYS[0], items=[{'ev': ev_same}])) + timeline(DAYS[0], 'pdf', [{'ev': ev_same}, lg_same, {'ev': ev_split}, lg_split, {'ev': ev_own}, lg_own])
    out.append(sheet('v-tz-modes', body7, total, total, 'sheet-day draft', True).replace('</section>', '<span class="draft-note">時區：同時區寫一次；起訖不同各寫各的；「…」可各選開始／結束（S125、S126）</span></section>'))
    L = lambda **k: {'leg': dict({'mode': 'train', 'label': '火車 20 分', 'gap': '空檔 25 分', 'late': None, 'desc': None}, **k)}
    r1 = {'name': '山陽新幹線 さくら 545', 'dep': '09:12', 'arr': '09:52'}
    legs5 = [
        L(runs=[r1]),
        L(runs=[{'name': 'さくら 545', 'dep': '09:12', 'arr': '09:52'}, {'name': 'こだま 849', 'dep': '09:35', 'arr': '10:25'}, {'name': 'さくら 547', 'dep': '09:50', 'arr': '10:30'}], sel=1),
        L(runs=[{'name': 'さくら 545', 'dep': '09:12', 'arr': '09:52'}, {'name': 'こだま 849', 'dep': '09:35', 'arr': '10:25'}, {'name': 'さくら 547', 'dep': '09:50', 'arr': '10:30'}], sel=None),
        L(runs=[{'name': 'さくら 545'}], sel=0),
        L(mode='flight', label='飛行 3 小時 1 分', gap='空檔 3 小時 1 分', runs=[{'name': '虎航 IT 230', 'dep': '11:10', 'arr': '14:11', 'tz': {'kind': 'split', 'a': '台北', 'b': '日本'}}]),
    ]
    bd = day_head(DAYS[0]) + ''.join('<p class="att-lbl" style="margin-top:14px;margin-bottom:14px">%s</p>%s' % (t_, timeline(DAYS[0], 'pdf', [lg_])) for t_, lg_ in zip(
        ['1　只有一班：膠囊照單班寫', '2　多班、選第 2 班：膠囊寫選中的，下面「備案」', '3　多班、沒選：膠囊寫交通方式＋路程時間，下面「可搭」', '4　班次只填名稱：不寫箭頭和時間', '5　起訖不同時區的航班：時區各接在自己的時刻後面「11:10 台北時間 → 14:11 日本時間」'], legs5))
    out.append(sheet('v-leg-runs', bd, total, total, 'sheet-day draft', True).replace('</section>', '<span class="draft-note">路程班次（S96）：1 單班、2 多班選一班、3 多班沒選、4 只填名稱、5 跨時區航班；社群縮成「＋N 班備案」「N 班可搭」</span></section>'))
    out.append(sheet('v-long', trip_map_long(style), total, total, 'sheet-map draft long', False).replace('</section>', '<span class="draft-note">長途示意：整趟總覽頁（S53），只有 PDF</span></section>'))
    def _dedupe_notes(s_):
        spans = list(re.finditer(r'<span class="draft-note">.*?</span>', s_))
        for m_ in reversed(spans[:-1]):
            s_ = s_[:m_.start()] + s_[m_.end():]
        return s_
    out = [_dedupe_notes(x_) for x_ in out]
    css = swatch_css() + assemble(read('base.css'), read('style-%s.css' % style), read('fmt-pdf.css'), read('fmt-story.css'), read('fmt-square.css'), read('fmt-social.css'))
    html_ = ('<!doctype html>\n<html lang="zh-Hant" data-style="%s">\n<head>\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>%s</title>\n'
             '<!-- 分享模板契約：每個風格只有這一份 RWD 的純 HTML＋CSS，沒有 JS、不載任何外部資源（字型、圖片、CSS 都是本機相對路徑或 data:）。\n'
             '     PDF、限動 9:16、方形 1:1 都由這一份依「版面尺寸」排出來：列印（@media print＋@page）或寬螢幕預覽＝PDF；\n'
             '     螢幕 aspect ≤ 4/5（例 1080×1920）＝限動；螢幕 4/5～5/4（例 1080×1080）＝方形。切換全由 CSS 條件決定，原生端不用改 DOM。\n'
             '     一個 section ＝ 一頁（PDF）或一張（社群）。一天放不下時由原生端依量測拆成多個 section 填進來。\n'
             '     一天拆成幾段由原生端依格式各自量測決定；稿裡用 for-* 標出各格式的範例拆法（class for-pdf／for-story／for-square，拆法相同的格式共用同一組 section）。\n'
             '     PDF 的一張行程卡不跨頁：放不下就整張移到下一頁；9:16、1:1 同樣以整張卡為單位。\n'
             '     資料槽用 HTML 註解 slot: 欄位名 標出。稿裡的資料是範例「山陽 6 日」寫死的。 -->\n'
             '<style>\n%s\n</style>\n</head>\n<body>\n%s<main class="doc">%s</main>\n%s</body>\n</html>\n') % (
        style, esc('%s · 分享模板' % nm), css, SYMBOL, ''.join(out), VERIFY_JS if VERIFY else '')
    if PAPER == 'letter':
        html_ = (html_.replace('size: A4 landscape', 'size: Letter landscape').replace('size: A4;', 'size: Letter;')
                 .replace('--pw: 794px', '--pw: 816px').replace('--ph: 1122px', '--ph: 1056px')
                 .replace('--lw: 1122px', '--lw: 1056px').replace('--lh: 794px', '--lh: 816px')
                 )
    return html_, total


info = {}
for st, nm in STYLES.items():
    outdir = os.path.join(ROOT, '_verify', st) if VERIFY else os.path.join(ROOT, st)
    os.makedirs(outdir, exist_ok=True)
    html_, total = build_template(st, nm)
    if VERIFY:
        html_ = html_.replace('"../_sample/', '"../../_sample/').replace("url(../_sample/", "url(../../_sample/")
    open(os.path.join(outdir, ('nosplit' if NOSPLIT else 'template') + PAPER_KEY + '.html'), 'w', encoding='utf8').write(html_)
    info[st] = total
print('printed sections (pages):', info)

if PAPER != 'letter':
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'badgepage.py'), encoding='utf8').read())

if PAPER != 'letter':
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'indexpage.py'), encoding='utf8').read())

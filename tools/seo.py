#!/usr/bin/env python3
"""官網 SEO 補齊（使用者 2026-10-12）：python3 tools/seo.py（tools/stamp-home.mjs 也會跑）。冪等，重跑不會疊字。

首頁×4、隱私權×4、條款×4 的 <head> 統一成同一套：
  · canonical、hreflang（zh-Hant／en／ja／ko＋x-default）——缺了就補
  · og:locale ＋ 另外三語的 og:locale:alternate
  · og:image 用該語的 /assets/img/og-<lang>.png（tools/og/make.mjs 產），附寬高與 alt
  · twitter:card／title／description／image（照 og 的值）
  · 首頁的 JSON-LD：inLanguage 四語、author、image
分享頁×4 的 head 由 tools/gen-share.mjs 自己產（tests 比對整頁），不在這裡改。
"""
import json, os, re

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SITE = 'https://tripezgo.com'
LANGS = {'zh': ('', 'zh-Hant', 'zh_TW'), 'en': ('en/', 'en', 'en_US'), 'ja': ('ja/', 'ja', 'ja_JP'), 'ko': ('ko/', 'ko', 'ko_KR')}
ALT = {'zh': 'TripEZGo：旅行規劃、旅途所需一次搞定', 'en': 'TripEZGo: plan the trip, carry what it needs — all in one app',
       'ja': 'TripEZGo：旅の計画も、旅先で要るものも、これひとつで', 'ko': 'TripEZGo: 여행 계획부터 여행길에 필요한 것까지, 앱 하나로'}

def meta(head, attr, key):
    m = re.search(rf'<meta {attr}="{re.escape(key)}" content="([^"]*)">', head)
    return m.group(1) if m else None

def fix(rel_by_lang, lang, kind):
    path = os.path.join(R, rel_by_lang[lang])
    html = open(path, encoding='utf-8').read()
    i = html.index('</head>'); head, rest = html[:i], html[i:]
    prefix, hl, loc = LANGS[lang]
    url = f'{SITE}/{rel_by_lang[lang].replace("index.html", "")}'
    # 先拿掉這支會重寫的那幾行，再照固定順序補回 og:url 後面
    title = meta(head, 'property', 'og:title') or re.search(r'<title>([^<]*)</title>', head).group(1)
    desc = meta(head, 'property', 'og:description') or meta(head, 'name', 'description')
    for pat in [r'<meta property="og:locale(?::alternate)?" content="[^"]*">\n',
                r'<meta property="og:image(?::(?:width|height|alt))?" content="[^"]*">\n',
                r'<meta name="twitter:[a-z]+" content="[^"]*">\n',
                r'<link rel="canonical" href="[^"]*">\n',
                r'<link rel="alternate" hreflang="[^"]+" href="[^"]*">\n']:
        head = re.sub(pat, '', head)
    alts = ''.join(f'<link rel="alternate" hreflang="{LANGS[l][1]}" href="{SITE}/{rel_by_lang[l].replace("index.html", "")}">\n' for l in LANGS)
    alts += f'<link rel="alternate" hreflang="x-default" href="{SITE}/{rel_by_lang["zh"].replace("index.html", "")}">\n'
    img = f'{SITE}/assets/img/og-{lang}.png'
    og = (f'<meta property="og:locale" content="{loc}">\n'
          + ''.join(f'<meta property="og:locale:alternate" content="{LANGS[l][2]}">\n' for l in LANGS if l != lang)
          + f'<meta property="og:image" content="{img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
          + f'<meta property="og:image:alt" content="{ALT[lang]}">\n'
          + f'<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="{title}">\n'
          + f'<meta name="twitter:description" content="{desc}">\n<meta name="twitter:image" content="{img}">\n')
    # canonical＋hreflang 放在 description 後；og 那一組放在 og:url 後（沒有 og:url 就補）
    d = re.search(r'<meta name="description" content="[^"]*">\n', head)
    head = head[:d.end()] + f'<link rel="canonical" href="{url}">\n' + alts + head[d.end():]
    if '<meta property="og:url"' not in head:
        head = head.replace(f'<meta property="og:title"', f'<meta property="og:url" content="{url}">\n<meta property="og:title"', 1)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*(">\n)', rf'\g<1>{url}\g<2>', head)
    u = re.search(r'<meta property="og:url" content="[^"]*">\n', head)
    head = head[:u.end()] + og + head[u.end():]
    if kind == 'home':
        m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', head, re.S)
        ld = json.loads(m.group(2))
        ld['inLanguage'] = [LANGS[l][1] for l in LANGS]
        ld['url'] = url
        ld['image'] = img
        ld['author'] = {'@type': 'Person', 'name': 'Harry Li (ZhgChg Li)', 'url': 'https://zhgchg.li/'}
        head = head[:m.start(2)] + '\n' + json.dumps(ld, ensure_ascii=False, indent=2) + '\n' + head[m.end(2):]
    out = head + rest
    if out != html:
        open(path, 'w', encoding='utf-8').write(out); print('seo', rel_by_lang[lang])

for page, kind in [('index.html', 'home'), ('privacy.html', 'legal'), ('terms.html', 'legal')]:
    rel = {l: LANGS[l][0] + page for l in LANGS}
    for l in LANGS: fix(rel, l, kind)

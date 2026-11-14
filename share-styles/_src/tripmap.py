# build.py 尾端之前 exec：整趟地圖（S50–S58 叢集版型）。
# 底圖是 MKMapSnapshotter 真的拍的（_src/maps/shootmaps.swift，每頁每格式一張；ticket 用深色外觀）；
# 圖釘位置是 snapshot.point(for:) 算出來的（站在 _sample/maps/<id>.json），框外的站是外推點。
# 每頁：滿版地圖、數字圖釘、不畫連線；不在這頁的其他叢集在邊緣「一群一枚」（編號範圍＋地名），單站離群一站一枚；圖例只列這頁的站，依天分欄。
import math

_MAPDIR = os.path.join(ROOT, '_sample', 'maps')
_SJ = json.load(open(os.path.join(ROOT, '_src', 'maps', 'stations.json'), encoding='utf8'))
STATIONS = _SJ['stations']
MAP_PAGES = _SJ['pages']
HOME_N = _SJ['home']
FMT_BOX = _SJ['formats']
STN_LL = {s['n']: s['ll'] for s in STATIONS}
# 每格式圖釘半徑（CSS px，在地圖框的座標系）
PIN_R = {'pdf': 15, 'pdf-letter': 15, 'story': 29, 'square': 24, 'web': 24}


def _hav(a, b):
    R = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dl = math.radians(b[1] - a[1])
    dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def compress(nums):
    nums = sorted(nums)
    parts, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:
            j += 1
        parts.append(str(nums[i]) if i == j else '%d–%d' % (nums[i], nums[j]))
        i = j + 1
    return ', '.join(parts)


def _load(pid, fmt, dark):
    p = os.path.join(_MAPDIR, '%s-%s-%s.json' % (pid, fmt, 'dark' if dark else 'light'))
    return json.load(open(p))


def _spread(pos, r, bounds):
    """重疊的圖釘互相推開（示意用；位置誤差只有幾個圖釘寬）。"""
    ids = list(pos)
    l, t, rr, b = bounds
    for _ in range(80):
        moved = False
        for i, a in enumerate(ids):
            for c in ids[i + 1:]:
                ax, ay = pos[a]
                cx, cy = pos[c]
                dx, dy = cx - ax, cy - ay
                d = math.hypot(dx, dy)
                lim = 2 * r * 1.04
                if d < lim:
                    if d < 0.01:
                        ang = (a * 2.399 + c) % (2 * math.pi)
                        dx, dy, d = math.cos(ang), math.sin(ang), 1
                    push = (lim - d) / 2
                    ux, uy = dx / d, dy / d
                    pos[a] = [ax - ux * push, ay - uy * push]
                    pos[c] = [cx + ux * push, cy + uy * push]
                    moved = True
        for k in ids:
            pos[k][0] = min(max(pos[k][0], l + r), rr - r)
            pos[k][1] = min(max(pos[k][1], t + r), b - r)
        if not moved:
            break
    return pos


def _pin(x, y, r, text, pill=False):
    fs = r * (1.05 if len(text) == 1 else 0.9 if len(text) == 2 else 0.8)
    if pill:
        w = max(2 * r, len(text) * fs * 0.62 * 0.82 + r * 1.2)
        return ('<g class="tm-pin"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f"/><text x="%.1f" y="%.1f" style="font-size:%.1fpx">%s</text></g>' % (
            x - w / 2, y - r, w, 2 * r, r, x, y + fs * 0.04, fs * 0.82, text)), w
    return ('<g class="tm-pin"><circle cx="%.1f" cy="%.1f" r="%.1f"/><text x="%.1f" y="%.1f" style="font-size:%.1fpx">%s</text></g>' % (x, y, r, x, y + fs * 0.04, fs, text)), 2 * r


def _edge_point(cx, cy, tx, ty, rect):
    dx, dy = tx - cx, ty - cy
    n = math.hypot(dx, dy) or 1
    dx, dy = dx / n, dy / n
    l, t, rr, b = rect
    tx_ = ((rr - cx) / dx) if dx > 1e-6 else ((l - cx) / dx if dx < -1e-6 else 1e9)
    ty_ = ((b - cy) / dy) if dy > 1e-6 else ((t - cy) / dy if dy < -1e-6 else 1e9)
    k = min(tx_, ty_)
    side = ('r' if dx > 0 else 'l') if tx_ <= ty_ else ('b' if dy > 0 else 't')
    return cx + dx * k, cy + dy * k, side, math.degrees(math.atan2(dy, dx))


STACK_MAX = 3   # 堆疊最多畫 3 層，表示「很多」
# 可見畫面（避開圖例）：(左, 上, 右, 下)。PDF 圖例在上方、9:16 與 1:1 在下方；數字是圖例實際量到的高度／位置（map-1、map-2 各一組）。
VIS = {('pdf', 0): (0, 160.2, None, None), ('pdf', 1): (0, 112.9, None, None),
       ('pdf-letter', 0): (0, 160.2, None, None), ('pdf-letter', 1): (0, 112.9, None, None),
       ('story', 0): (0, 0, None, 1319), ('story', 1): (0, 0, None, 1469),
       ('square', 0): (0, 0, None, 782.6), ('square', 1): (0, 0, None, 847.8)}
ARROW = 0.95   # 箭頭長度（以 dot 半徑為單位）


def _arrow(x, y, r, ang):
    """S117：朝畫面外、指向那一站實際方位的小三角箭頭，貼在 dot 外緣；跟 dot 同色同一種描邊（黑白列印看得出來）。"""
    ux, uy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    nx, ny = -uy, ux
    L, w, b0 = r * ARROW, r * 0.62, r * 0.78
    tip = (x + ux * (r + L), y + uy * (r + L))
    p1 = (x + ux * b0 + nx * w, y + uy * b0 + ny * w)
    p2 = (x + ux * b0 - nx * w, y + uy * b0 - ny * w)
    return '<path class="tm-arrow" d="M%.1f %.1fL%.1f %.1fL%.1f %.1fZ"/>' % (p1[0], p1[1], tip[0], tip[1], p2[0], p2[1])


def _stack(x, y, r, n, inward, count=None):
    """一疊硬幣：n 層錯位疊在一起，最上面那顆貼在邊緣、最後面那顆往圖內縮，露出邊緣讓人看得出有好幾個。
    回傳 (圓點, 數字)：數字（S114：最上面那顆寫個數「×9」）另外回傳，由呼叫端最後才畫，不會被別的圓點蓋住。"""
    count = n if count is None else count
    n = min(n, STACK_MAX)
    ix, iy = inward
    tx_, ty_ = -iy, ix
    s = ['<g class="tm-pin tm-stack">']
    for k in range(n - 1, -1, -1):
        s.append('<circle cx="%.1f" cy="%.1f" r="%.1f"/>' % (x + (ix * 0.62 + tx_ * 0.5) * r * k, y + (iy * 0.62 + ty_ * 0.5) * r * k, r))
    s.append('</g>')
    txt = '\u00d7%d' % count
    fs = r * (0.95 if len(txt) == 2 else 0.8 if len(txt) == 3 else 0.68)
    return ''.join(s), '<g class="tm-pin tm-stack tm-stack-n"><text x="%.1f" y="%.1f" style="font-size:%.1fpx">%s</text></g>' % (x, y + fs * 0.04, fs, txt)


def _edge_dots(items, vis, r, obst, bottom_blocked=False):
    """items：[{tx,ty,cnt,n}]（目標位置、站數、單站時的編號）；vis：可見畫面 (l,t,r,b)。
    dot 貼齊可見畫面的邊緣（外緣＝dot＋箭頭剛好碰到邊），朝外一側有指向實際方位的箭頭。回傳 (svg 片段列表, 數字片段列表)。"""
    pad = r + 2   # 沿邊的範圍：圓點整顆在畫面內；垂直於邊的位置另外依箭頭方向算，讓箭頭尖端剛好貼齊邊緣
    inset = (vis[0] + pad, vis[1] + pad, vis[2] - pad, vis[3] - pad)
    sc = ((vis[0] + vis[2]) / 2, (vis[1] + vis[3]) / 2)
    pts = []
    for it in items:
        ex, ey, side, _a = _edge_point(sc[0], sc[1], it['tx'], it['ty'], inset)
        if bottom_blocked and side == 'b':   # 下緣被圖例擋住：沿側邊往上滑到圖例上方，dot＋箭頭仍貼齊可見畫面的邊緣
            left = it['tx'] < sc[0]
            side, ex, ey = ('l', inset[0], inset[3]) if left else ('r', inset[2], inset[3])
        ang_ = math.atan2(it['ty'] - sc[1], it['tx'] - sc[0])
        off_x = max(r + 1, (r + r * ARROW) * abs(math.cos(ang_)) + 1)
        off_y = max(r + 1, (r + r * ARROW) * abs(math.sin(ang_)) + 1)
        if side == 'l':
            ex = vis[0] + off_x
        elif side == 'r':
            ex = vis[2] - off_x
        elif side == 't':
            ey = vis[1] + off_y
        else:
            ey = vis[3] - off_y
        pts.append(dict(x=ex, y=ey, side=side, cnt=it['cnt'], n=it['n'], w=1, tx=it['tx'], ty=it['ty']))
    horiz = lambda s: s in 'tb'
    groups = []
    for p in sorted(pts, key=lambda p: (p['side'], p['x'] if horiz(p['side']) else p['y'])):
        for g in groups:
            d = abs(g['x'] - p['x']) if horiz(p['side']) else abs(g['y'] - p['y'])
            if g['side'] == p['side'] and d < 2.1 * r:
                w2 = g['w'] + p['w']
                for k in ('x', 'y', 'tx', 'ty'):
                    g[k] = (g[k] * g['w'] + p[k] * p['w']) / w2
                g['w'] = w2
                g['cnt'] += p['cnt']
                break
        else:
            groups.append(dict(p))
    out, texts = [], []
    boxes = list(obst)

    def hit(a, b):
        return not (a[2] < b[0] or a[0] > b[2] or a[3] < b[1] or a[1] > b[3])

    for g in groups:
        inward = {'r': (-1, 0), 'l': (1, 0), 't': (0, 1), 'b': (0, -1)}[g['side']]
        ex, ey = g['x'], g['y']
        ext = (STACK_MAX - 1) * r * 0.6 if g['cnt'] > 1 else 0
        for k in range(0, 30):
            off = ((k + 1) // 2) * r * 1.1 * (1 if k % 2 else -1)
            cx, cy = (ex, min(max(g['y'] + off, inset[1]), inset[3])) if g['side'] in 'lr' else (min(max(g['x'] + off, inset[0]), inset[2]), ey)
            box = (cx - r - ext, cy - r - ext, cx + r + ext, cy + r + ext)
            if not any(hit(box, o) for o in boxes):
                break
        boxes.append(box)
        ang = math.degrees(math.atan2(g['ty'] - sc[1], g['tx'] - sc[0]))
        out.append(_arrow(cx, cy, r, ang))
        if g['cnt'] == 1:
            s, _ = _pin(cx, cy, r, str(g['n']))
            out.append(s)
        else:
            c, tx = _stack(cx, cy, r, g['cnt'], inward, g['cnt'])
            out.append(c)
            texts.append(tx)
    return out, texts

def trip_map_page(style, fmt, pi):
    page = MAP_PAGES[pi]
    dark = False   # S74：只支援白底
    J = _load(page['id'], fmt, dark)
    W, H = J['w'], J['h']
    P = {int(k): v for k, v in J['points'].items()}
    r = PIN_R[fmt]
    sl, st, sr, sb = FMT_BOX[fmt]['safe']
    safe = (sl, st, W - sr, H - sb)
    sc = ((safe[0] + safe[2]) / 2, (safe[1] + safe[3]) / 2)
    members = page['members']
    pos = {n: list(P[n]) for n in members}
    pos = _spread(pos, r, safe)
    parts = []
    for n in members:
        s, _ = _pin(pos[n][0], pos[n][1], r, str(n))
        parts.append(s)
    # S111：地圖框外的標記只是 dot（跟框內 pin 同一種圓點）。一站＝帶編號的 dot；多站或互相重疊＝堆疊、不帶數字（最多 3 層）。
    # 不寫站名、距離、地名、編號範圍；dot 貼齊可見畫面的邊緣，朝外一側有一個指向實際方位的小三角箭頭（S117）。
    items = []
    for oj, o in enumerate(MAP_PAGES):
        if oj == pi:
            continue
        cx_ = sum(P[n][0] for n in o['members']) / len(o['members'])
        cy_ = sum(P[n][1] for n in o['members']) / len(o['members'])
        items.append(dict(tx=cx_, ty=cy_, cnt=len(o['members']), n=o['members'][0]))
    for n in HOME_N:
        items.append(dict(tx=P[n][0], ty=P[n][1], cnt=1, n=n))
    v0 = VIS[(fmt, pi)]
    vis = (v0[0], v0[1], W if v0[2] is None else v0[2], H if v0[3] is None else v0[3])
    obst = [(pos[n][0] - r, pos[n][1] - r, pos[n][0] + r, pos[n][1] + r) for n in members]
    dots, dtexts = _edge_dots(items, vis, r, obst, bottom_blocked=(v0[3] is not None))
    parts.extend(dots)
    parts.extend(dtexts)
    edge_html = []
    svg = ('<svg class="tm-svg" viewBox="0 0 %d %d" preserveAspectRatio="none" style="--sw:%.1fpx" aria-hidden="true">'
           '<!-- 編號：整趟連續編號 1…N（S56）；每頁只畫這頁的站，不畫連線；位置由 MKMapSnapshotter 的 point(for:) 算。slot: trip.map.offscreen[]（地圖外的行程：只畫貼在邊緣的 dot；一站＝帶編號的 dot，多站＝堆疊、最上面那顆寫個數「×9」，最多畫 3 層）-->%s</svg>') % (W, H, r / 5, ''.join(parts))
    return ('<div class="map trip-map" data-fmt-box="%dx%d"><!-- slot: trip.map.page[%d]（這一頁叢集的地圖圖：%s） -->'
            '<img class="map-img" src="../_sample/maps/%s-%s-%s.jpg" alt="">%s%s</div>'
            % (W, H, pi, esc(page['name']), page['id'], fmt, 'dark' if dark else 'light', svg, ''.join(edge_html)))


def legend_page(pi, cls=''):
    page = MAP_PAGES[pi]
    mem = set(page['members'])
    days = []
    for d in DAYS:
        sts = [s for s in STATIONS if s['day'] == d['no'] and s['n'] in mem]
        if sts:
            days.append((d['no'], sts))
    out = ['<div class="legend %s" style="--cols:%d"><!-- slot: trip.map.page[%d].legend（只列這一頁的站，依天分欄） -->' % (cls, len(days), pi)]
    for no, sts in days:
        li = ''.join('<li><b class="pin">%d</b><span>%s</span></li>' % (s['n'], esc(s['name'])) for s in sts)
        out.append('<div class="lg-day"><h3>第 %d 天</h3><ol>%s</ol></div>' % (no, li))
    out.append('</div>')
    return ''.join(out)


# ── 長途示意：整趟總覽頁（S53）。範例＝cases.json 的 J1 環日本 100 天；每群一枚圖釘：地名＋編號範圍 ──
def _spread_rects(boxes, bounds, iters=200):
    l, t, rr, b = bounds
    for _ in range(iters):
        moved = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, c = boxes[i], boxes[j]
                dx = (c[0] - a[0])
                dy = (c[1] - a[1])
                ox = (a[2] + c[2]) / 2 + 3 - abs(dx)
                oy = (a[3] + c[3]) / 2 + 3 - abs(dy)
                if ox > 0 and oy > 0:
                    if ox < oy:
                        s = (1 if dx >= 0 else -1) * ox / 2
                        a[0] -= s; c[0] += s
                    else:
                        s = (1 if dy >= 0 else -1) * oy / 2
                        a[1] -= s; c[1] += s
                    moved = True
        for a in boxes:
            a[0] = min(max(a[0], l + a[2] / 2), rr - a[2] / 2)
            a[1] = min(max(a[1], t + a[3] / 2), b - a[3] / 2)
        if not moved:
            break
    return boxes


def trip_map_long(style):
    dark = False   # S74：只支援白底
    LK = 'long-pdf-letter' if PAPER == 'letter' else 'long-pdf'
    J = json.load(open(os.path.join(_MAPDIR, '%s-%s.json' % (LK, 'dark' if dark else 'light'))))
    LT = json.load(open(os.path.join(ROOT, '_src', 'maps', 'long.json'), encoding='utf8'))
    W, H = J['w'], J['h']
    r = 12   # S111：長途總覽也只畫 dot，不寫地名與編號範圍
    pts = []
    for i, c in enumerate(LT):
        x, y = J['points'][str(i)]
        pts.append(dict(x=x, y=y, cnt=len(c['ns']), n=c['ns'][0], w=1))
    groups = []
    for p in sorted(pts, key=lambda p: (p['x'], p['y'])):
        for g in groups:
            if math.hypot(g['x'] - p['x'], g['y'] - p['y']) < 3.6 * r:   # 疊起來的一疊會往外長，靠近的群也併進同一疊，數字才不會被別的圓點蓋住
                g['x'] = (g['x'] * g['w'] + p['x'] * p['w']) / (g['w'] + p['w'])
                g['y'] = (g['y'] * g['w'] + p['y'] * p['w']) / (g['w'] + p['w'])
                g['w'] += p['w']
                g['cnt'] += p['cnt']
                break
        else:
            groups.append(dict(p))
    parts, texts = [], []
    for g in groups:
        if g['cnt'] == 1:
            parts.append(_pin(g['x'], g['y'], r, str(g['n']))[0])
        else:
            c, tx = _stack(g['x'], g['y'], r, g['cnt'], (0, 1), g['cnt'])
            parts.append(c)
            texts.append(tx)
    svg = ('<svg class="tm-svg" viewBox="0 0 %d %d" preserveAspectRatio="none" style="--sw:3px" aria-hidden="true">'
           '<!-- 整趟總覽：每群一個 dot；一站＝帶編號的 dot，多站＝堆疊、最上面寫個數「×N」（數字最後才畫，不被別的圓點蓋住）；這一頁沒有框外標記，所以沒有箭頭 -->%s</svg>') % (W, H, ''.join(parts + texts))
    return ('<div class="map trip-map long" data-fmt-box="%dx%d"><!-- slot: trip.map.overview（整趟比例尺；叢集超過頁數上限被截掉時放在地圖頁最前面） -->'
            '<img class="map-img" src="../_sample/maps/%s-%s.jpg" alt="">%s'
            '<span class="draft-note">長途示意：cases.json 的 J1 環日本 100 天（25 群，只有 10 群有自己的頁）；一站＝帶編號的 dot，多站＝堆疊、最上面寫個數「×N」</span></div>' % (W, H, LK, 'dark' if dark else 'light', svg))

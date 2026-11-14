"""把 base／style／fmt 的 CSS 合成單一份 template.html 用的樣式（S70：每個風格只有一份 RWD 模板）。

規則：
- 沒有 `html[data-fmt=…]` 的規則＝三種輸出共用（全域）。
- `html[data-fmt=pdf|story|square]` 開頭的規則，拿掉前綴後放進對應的 @media 區塊，排在該格式 fmt 檔的後面（維持原本「風格細修蓋過 fmt 預設」的先後）。
- 三個條件：
    列印（A4／Letter）或寬螢幕預覽（aspect ≥ 5/4）  ＝ PDF
    螢幕、aspect ≤ 4/5（例 1080×1920）            ＝ 限動 9:16
    螢幕、4/5 < aspect < 5/4（例 1080×1080）       ＝ 方形 1:1
- 舊的 artboard 選擇器改成新 DOM：.artboard→.sec、.ab-foot→.runfoot、.ab-day／.ab-overview／.ab-map（容器本身）→ .sheet-X .sheet-body。
"""
import re

PDF_Q = '@media print, screen and (min-aspect-ratio: 5/4)'
STORY_Q = '@media screen and (max-aspect-ratio: 4/5)'
SQUARE_Q = '@media screen and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4)'


def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def blocks(css):
    css = strip_comments(css)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        head = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        out.append((head, css[j + 1:k - 1]))
        i = k
    return out


def split_sel(head):
    out, depth, cur = [], 0, ''
    for c in head:
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        if c == ',' and depth == 0:
            out.append(cur.strip())
            cur = ''
        else:
            cur += c
    if cur.strip():
        out.append(cur.strip())
    return out


_AB = re.compile(r'\.ab-(day|overview|map)')


def rename_sel(s):
    s = re.sub(r'\.sheet(?![\w-])', '.sec', s)
    s = s.replace('.ab-foot', '.runfoot').replace('.artboard', '.sec')
    out, pos = '', 0
    for m in _AB.finditer(s):
        out += s[pos:m.start()]
        rest = s[m.end():]
        name = '.sheet-' + m.group(1)
        if rest.strip() == '' or rest.lstrip().startswith('>'):
            out += name + ' .sheet-body'
        else:
            out += name
        pos = m.end()
    return out + s[pos:]


DROP = ('.boards', '.board-wrap', '.board-label', '.has-allday')


def process(css, default_bucket=None):
    """回傳 (globals, {bucket: [rules]}, pages)。default_bucket：整份檔案都屬於哪個格式（fmt 檔）。"""
    glob, buckets, pages = [], {'pdf': [], 'story': [], 'square': []}, []
    for head, body in blocks(css):
        if head.startswith('@page'):
            pages.append('%s{%s}' % (head, body))
            continue
        if head.startswith('@media') or head.startswith('@supports'):
            if 'data-fmt=web' in head or 'data-fmt=web' in body:
                continue
            inner = []
            for h2, b2 in blocks(body):
                ss = [rename_sel(x) for x in split_sel(h2)]
                inner.append('%s{%s}' % (','.join(ss), b2))
            (buckets[default_bucket] if default_bucket else glob).append('%s{%s}' % (head, ''.join(inner)))
            continue
        per = {}
        for s in split_sel(head):
            m = re.match(r'html\[data-fmt=(\w+)\]\s*(.*)$', s)
            b = default_bucket
            if m:
                b = m.group(1)
                s = m.group(2) or ':root'
            if b == 'web' or any(d in s for d in DROP):
                continue
            per.setdefault(b, []).append(rename_sel(s))
        for b, ss in per.items():
            rule = '%s{%s}' % (','.join(ss), body)
            (glob if b is None else buckets[b]).append(rule)
    return glob, buckets, pages


def assemble(base, style, fmt_pdf, fmt_story, fmt_square, fmt_social):
    g, b_scoped, pg = process(base)
    g2, s_scoped, pg2 = process(style)
    _, pdf_b, pg3 = process(fmt_pdf, 'pdf')
    _, story_b, _ = process(fmt_story, 'story')
    _, square_b, _ = process(fmt_square, 'square')
    _, soc_s, _ = process(fmt_social, 'story')   # 共用的社群規則（story、square 都要）
    _, soc_q, _ = process(fmt_social, 'square')
    pages = pg + pg2 + pg3
    out = ['\n'.join(g), '\n'.join(g2), '\n'.join(pages)]
    out.append(PDF_Q + ' {\n' + '\n'.join(pdf_b['pdf'] + b_scoped['pdf'] + s_scoped['pdf']) + '\n}')
    out.append(STORY_Q + ' {\n' + '\n'.join(soc_s['story'] + story_b['story'] + b_scoped['story'] + s_scoped['story']) + '\n}')
    out.append(SQUARE_Q + ' {\n' + '\n'.join(soc_q['square'] + square_b['square'] + b_scoped['square'] + s_scoped['square']) + '\n}')
    return '\n'.join(out)

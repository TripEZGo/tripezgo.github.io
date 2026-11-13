# build.py 尾端 exec 這支：產 share-styles/_badge/badge.html（badge 設計稿：三個方向 × 一般／Premium × 淺底／深底 × PDF 頁尾／社群 × 四風格實景）
# logo 一律用品牌稿向量（#tz-mark 圖標、#tz-word 字標），路徑資料原樣；圖標 ≥32px、字標 ≥88px（品牌識別稿的最小尺寸規則）。

SYM2 = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
        '<symbol id="tz-mark" viewBox="334 235 590 529"><path fill="currentColor" d="%s"/></symbol>'
        '<symbol id="tz-word" viewBox="191 833 878 153"><path fill="currentColor" d="%s"/></symbol></svg>') % (_LOGO_D, _LOGO_D)


def _mk():
    return '<svg class="mk" viewBox="0 0 590 529" aria-hidden="true"><use href="#tz-mark"/></svg>'


def _wm():
    return '<svg class="wm" viewBox="0 0 878 153" aria-hidden="true"><use href="#tz-word"/></svg>'


def bdg(d, pre=False, soc=False):
    c = 'bd bd-%s%s%s' % (d, ' pre' if pre else '', ' soc' if soc else '')
    if d == 'a':
        if pre:
            return '<span class="%s">%s<i class="vr"></i><i class="by">Premium</i></span>' % (c, _wm())
        return '<span class="%s"><i class="by">Powered by</i>%s</span>' % (c, _wm())
    if d == 'b':
        return '<span class="%s">%s<span class="tx"><i class="by">%s</i>%s</span></span>' % (c, _mk(), 'Premium' if pre else 'Powered by', _wm())
    core = '%s<span class="tx"><i class="by">%s</i>%s</span>' % (_mk(), 'Premium' if pre else 'Powered by', _wm())
    if soc:
        return '<span class="%s"><i class="rl l"></i>%s<i class="rl r"></i></span>' % (c, core)
    return '<span class="%s">%s<i class="rl"></i></span>' % (c, core)


CTX = [  # (id, 名稱, 底色 class, 背景樣式, 圖標色)
    ('magazine', '雜誌', 'k-light', 'background:#fff;border-top:1px solid #17120f', '#17120f'),
]


def strip(d, pre, soc, ctx):
    cid, nm, kc, bgs, mk = ctx
    if soc:
        inner = '<div class="ft soc c-%s">%s</div>' % (d, bdg(d, pre, True))
        return '<div class="fit" data-w="1080" data-h="150"><div class="strip soc %s" style="%s;--mkc:%s">%s</div></div>' % (kc, bgs, mk, inner)
    inner = '<div class="ft c-%s">%s<span class="pn">3 / 14</span></div>' % (d, bdg(d, pre, False))
    return '<div class="fit" data-w="794" data-h="76"><div class="strip pdf %s" style="%s;--mkc:%s">%s</div></div>' % (kc, bgs, mk, inner)


DIRS = [
    ('a', 'A　極簡單色字標',
     '只有字：小字距的「POWERED BY」加品牌字標，單色、沒有框、沒有圖標，像 Apple 標章的克制。品牌字標寬 ≥ 88px 就能讀，所以不需要 32px 圖標。'
     'Premium：字標改香檳金，旁邊一條細金線＋字距拉大的 PREMIUM。'),
    ('b', 'B　小膠囊＋細框',
     '膠囊細框裡放 32px 圖標與兩行字（POWERED BY／字標），圓角＝高度一半、框 1px，是 Apple Pay mark 的「白底＋細輪廓」做法。'
     'Premium：框換成香檳金的細漸層描邊、圖標與字標轉金、小標換成 PREMIUM，並加一道很淡的斜向微光。'),
    ('c', 'C　嵌入式頁尾字標＋細分隔線',
     '不是一顆獨立的章，而是頁尾本身的一條細線：圖標＋字標掛在線的一端，線往頁碼延伸（社群版兩側對稱）。像 Apple Card／Apple One 的細線與留白。'
     'Premium：線改成金色往外淡出，圖標、字標轉金，小標換成 PREMIUM。'),
]


JS = """
(function () {
  function fit() {
    document.querySelectorAll('.fit').forEach(function (f) {
      var s = f.clientWidth / parseFloat(f.dataset.w);
      f.style.height = (parseFloat(f.dataset.h) * s) + 'px';
      f.firstElementChild.style.transform = 'scale(' + s + ')';
    });
  }
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); document.querySelectorAll('.fit').forEach(function (f) { ro.observe(f); }); }
  window.addEventListener('resize', fit); fit();
})();
"""


def build_badge_page():
    css = """
:root { color-scheme: light; }
* { box-sizing: border-box; } body { margin: 0; padding: 28px clamp(12px, 3vw, 20px) 80px; background: #e7e1d8; font: 14px/1.6 Inter, system-ui, -apple-system, "PingFang TC", sans-serif; color: #241d17; }
.wrap { max-width: 1100px; margin: 0 auto; } h1 { font-size: 22px; margin: 0 0 6px; } h2 { font-size: 17px; margin: 0 0 4px; } p { margin: 0; }
.rules { background: #fff; border-radius: 14px; padding: 18px 22px; margin: 14px 0 28px; font-size: 13px; }
.rules li { margin: 6px 0; } .rules ul { margin: 6px 0 10px; padding-left: 18px; } .rules a { color: #1d7370; }
.dir { background: #fbf8f4; border-radius: 16px; padding: clamp(14px, 3vw, 22px); margin-bottom: 26px; }
.why { color: #5b4f44; font-size: 13px; max-width: 820px; margin: 2px 0 16px; }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 12px; }
.cell { overflow: hidden; border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start; min-width: 0; }
.cell.k-light { background: #fff; border: 1px solid #e6dfd5; } .cell.k-dark { background: #15100c; }
.cell small { font-size: 11px; opacity: .6; letter-spacing: .04em; } .k-dark small { color: #cfc5b8; }
.row { margin-top: 18px; } .row h3 { font-size: 13px; margin: 0 0 8px; color: #5b4f44; }
.sit { display: grid; grid-template-columns: 70px 1fr 1fr; gap: 10px 12px; align-items: start; margin-top: 6px; }
.sit .lb { font-size: 12px; color: #5b4f44; } .sit .col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.fit { position: relative; width: 100%; overflow: hidden; border-radius: 6px; } .strip { border-radius: 6px; overflow: hidden; transform-origin: 0 0; position: absolute; left: 0; top: 0; } .strip.pdf { width: 794px; height: 76px; } .strip.soc { width: 1080px; height: 150px; }
.ft { display: flex; align-items: center; gap: 16px; height: 100%; padding: 0 48px; }
.ft.soc { justify-content: center; padding: 0 76px; }
.pn { font: 11px ui-monospace, Menlo, monospace; color: var(--fg2); margin-left: auto; white-space: nowrap; }
.ft.c-c .pn { margin-left: 0; }
.k-light { --fg: #241d17; --fg2: #7c6f63; --hl: rgba(36,29,23,.22); --gt: #8f6d2c; --g1: #d2b06a; --g2: #8c6a2b; --g3: #efdcab; --fill: #fff; }
.k-dark { --fg: #f4ede4; --fg2: #a99d90; --hl: rgba(244,237,228,.28); --gt: #e3cb8f; --g1: #f1deb0; --g2: #a8843e; --g3: #fff3d1; --fill: #15100c; }
.fill-j { --fill: #f6edd9; }
.bd { --mk: 32px; --wm: 96px; --fs: 8.5px; color: var(--fg); line-height: 1; white-space: nowrap; }
.bd.soc { --mk: 52px; --wm: 156px; --fs: 13.5px; }
.bd .mk { width: var(--mk); height: calc(var(--mk) * .8966); flex: none; color: var(--mkc, var(--fg)); }
.bd .wm { width: var(--wm); height: calc(var(--wm) * .1743); flex: none; display: block; }
.bd .by { font-style: normal; font-size: var(--fs); letter-spacing: .24em; text-transform: uppercase; color: var(--fg2); font-weight: 500; }
.bd.pre .by { color: var(--gt); font-weight: 600; letter-spacing: .38em; }
.bd.pre .wm, .bd.pre .mk { color: var(--gt); }
.bd-a { display: inline-flex; align-items: center; gap: calc(var(--fs) * 1.2); }
.bd-a .vr { width: 1px; height: calc(var(--fs) * 2.2); background: linear-gradient(transparent, var(--g1), transparent); }
.bd-b { display: inline-flex; align-items: center; gap: calc(var(--mk) * .34); padding: calc(var(--mk) * .17) calc(var(--mk) * .62) calc(var(--mk) * .17) calc(var(--mk) * .34); border: 1px solid var(--hl); border-radius: 999px; position: relative; overflow: hidden; }
.bd-b .tx { display: flex; flex-direction: column; gap: calc(var(--fs) * .85); }
.bd-b.pre { border-color: transparent; background: linear-gradient(var(--fill), var(--fill)) padding-box, linear-gradient(135deg, var(--g1) 0%, var(--g3) 30%, var(--g2) 62%, var(--g1) 100%) border-box; }
.bd-b.pre::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(115deg, transparent 34%, rgba(255,255,255,.16) 50%, transparent 66%); pointer-events: none; }
.k-light .bd-b.pre::after { background: linear-gradient(115deg, transparent 34%, rgba(214,176,90,.14) 50%, transparent 66%); }
.bd-c { display: flex; align-items: center; gap: calc(var(--mk) * .36); width: 100%; }
.bd-c .tx { display: flex; flex-direction: column; gap: calc(var(--fs) * .85); }
.bd-c .rl { flex: 1 1 auto; height: 1px; background: var(--hl); min-width: 24px; }
.bd-c.pre .rl { background: linear-gradient(90deg, var(--g1), transparent); }
.bd-c.soc .rl { background: linear-gradient(90deg, var(--hl), transparent); } .bd-c.soc .rl.l { background: linear-gradient(270deg, var(--hl), transparent); }
.bd-c.soc.pre .rl { background: linear-gradient(90deg, var(--g1), transparent); } .bd-c.soc.pre .rl.l { background: linear-gradient(270deg, var(--g1), transparent); }
.cell .bd-c { width: min(340px, 100%); }
.cell .soc-demo { zoom: .5; } .cell .bd-c.soc { width: 520px; }
.pick { font-size: 12px; font-weight: 700; color: #fff; background: #1d7370; border-radius: 999px; padding: 2px 12px; vertical-align: 2px; } .unpick { font-size: 12px; color: #7c6f63; border: 1px solid #cfc5b8; border-radius: 999px; padding: 1px 11px; vertical-align: 2px; font-weight: 400; }
@media (max-width: 720px) { .sit { grid-template-columns: 1fr 1fr; } .sit .lb { grid-column: 1 / -1; margin-top: 8px; font-weight: 700; } .cell { padding: 14px; } .rules { padding: 14px 16px; } }
.foot { font-size: 12px; color: #5b4f44; margin: 4px 0 10px; line-height: 1.7; }
"""
    rules = """
<div class="rules"><b>參考的標章做法（重點）</b>
<ul>
<li><b>Apple「Download on the App Store」</b>：留白＝標章高度的 1/4（極少版面可縮到 1/10）；最小 10 mm／螢幕 40 px；黑色為主、白色當淺底太重時的替代；不加陰影、不改邊框、不自行重畫。標章是固定藝術稿，只換黑／白兩版。<br>來源：<a href="https://developer.apple.com/app-store/marketing/guidelines/">developer.apple.com/app-store/marketing/guidelines</a></li>
<li><b>Apple Pay mark</b>：只有「白底＋細輪廓」一種，淺底為主、可放深底版面；留白＝高度 1/4；不加陰影、發光、反光；不改圓角與長寬比；不與別的標章共用一個框。<br>來源：<a href="https://developer.apple.com/apple-pay/marketing/">developer.apple.com/apple-pay/marketing</a></li>
<li><b>Framer</b>：標章與字標、圖標各自成對、尺寸一致、留足夠留白；不重畫、不與其他圖形或文字組合、不改色、不扭曲；「Made in Framer」標章在付費方案下可移除。<br>來源：<a href="https://www.framer.com/legal/trademark-guidelines">framer.com/legal/trademark-guidelines</a>、<a href="https://www.framer.com/help/articles/how-do-i-remove-the-made-in-framer-badge-from-my-website">help：移除 badge</a></li>
<li><b>Canva</b>：官方開發者品牌頁說明 logo 不可改色、不可用未核准的版本；免費網站要掛「Designed with Canva」badge（付費可去）。沒找到公開的淺／深兩版 badge 規格頁，這條只採「不改色、單色反白給深底」的通則。<br>來源：<a href="https://www.canva.dev/docs/apps/rest-apis/brand-guidelines/">canva.dev brand guidelines</a></li>
<li><b>Airbnb「Guest favourite」</b>：官方只有說明頁，沒有公開的徽章規格；觀察（非官方規格）是位置固定、月桂葉環繞給「榮譽」感、徽章本身很克制。來源：<a href="https://www.airbnb.com.au/help/article/3496">airbnb help 3496</a>、<a href="https://designcompass.org/en/2023/11/09/airbnb-2023-winter-update">designcompass 2023 winter update</a></li>
</ul>
<b>共同規則（拿來定這三個方向）</b>：① 單色或「單色＋一個強調色」，不用彩色漸層；② 留白至少高度 1/4，標章永遠比主內容次要；③ 細線（0.5–1px）取代陰影與厚框；④ 只有白底一版（S74：只支援白底），換色不換形，不加陰影、發光；⑤ 不重畫 logo，用原稿向量；⑥ 圖標與字的比例固定（本稿：圖標高 ≈ 兩行字高）；⑦ 圓角要嘛全圓要嘛不圓，不做中間值。
<br><b>Premium 的處理</b>：香檳金只出現在細線、圖標與字標，漸層只用在 1px 描邊上（一圈由亮到暗再回亮的金屬感）；微光是一道 16% 的斜向亮帶；小標由 POWERED BY 換成字距更寬的 PREMIUM。品牌規定圖標 ≥ 32px（B、C 用圖標，PDF 頁尾 32px、社群 52px）、字標 ≥ 88px（A 只用字標，PDF 96px、社群 156px）。
</div>"""
    secs = []
    for d, title, why in DIRS:
        cells = {}
        for kc in ('k-light',):
            for pre in (False, True):
                cells[(kc, pre)] = ('<div class="cell %s"><small>%s ・ %s ・ PDF 頁尾大小</small>%s<small>社群大小（縮 50%% 顯示）</small><div class="soc-demo">%s</div></div>' % (
                    kc, '白底', 'Premium' if pre else '一般', bdg(d, pre, False), bdg(d, pre, True)))
        grid = ''.join(cells[k] for k in (('k-light', False), ('k-light', True)))
        rows = []
        for ctx in CTX:
            c1 = '<div class="col">%s%s</div>' % (strip(d, False, False, ctx), strip(d, False, True, ctx))
            c2 = '<div class="col">%s%s</div>' % (strip(d, True, False, ctx), strip(d, True, True, ctx))
            rows.append('<div class="lb">%s</div>%s%s' % (ctx[1], c1, c2))
        secs.append('<section class="dir"><h2>%s</h2><p class="why">%s</p><div class="grid2">%s</div>'
                    '<div class="row"><h3>實景：四個風格的頁尾（PDF 頁尾 794px 寬、社群底部 1080px 寬，均縮小顯示）　左欄一般、右欄 Premium</h3><div class="sit">%s</div></div></section>' % (
                        title + ('　<span class="pick">已選 A（已套進四個風格的 16 份模板）</span>' if d == 'a' else '　<span class="unpick">未選・保留供參考</span>'), why, grid, ''.join(rows)))
    return ('<!doctype html>\n<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>Powered by TripEZGo badge 設計稿</title><style>%s</style></head><body>%s<div class="wrap"><h1>Powered by TripEZGo badge：三個方向</h1>'
            '<p class="foot">使用者已選方向 A（極簡單色字標），已套進四個風格的 16 份模板（PDF 頁尾、story／square 底部）；B、C 保留供參考。logo 一律是品牌稿向量 <code>#tz-mark</code>（圖標）與 <code>#tz-word</code>（字標），路徑資料原樣。</p>%s%s</div><script>%s</script></body></html>\n') % (
        css, SYM2, rules, ''.join(secs), JS)


if not VERIFY:
    os.makedirs(os.path.join(ROOT, '_badge'), exist_ok=True)
    open(os.path.join(ROOT, '_badge', 'badge.html'), 'w', encoding='utf8').write(build_badge_page())

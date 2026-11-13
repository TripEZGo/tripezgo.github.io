# build.py 尾端 exec 這支：產 share-styles/index.html（挑風格的總覽頁；這一頁是 RWD、可以有 JS，模板本身是固定尺寸輸出、不可以）
def build_index():
    notes = {
        'magazine': ('雜誌', '免費', '編輯排版：直角、細黑線、襯線大標、巨大的天數、滿版照片，行程像刊物一樣一則一則往下讀。'),
    }
    rows = []
    for st, (nm, tag, desc) in notes.items():
        ts = []
        # PDF：列印沒辦法放進 iframe，用 print-to-pdf 印出來的頁面截圖（_preview/<風格>/p-NN.jpg）；
        # 限動／方形：同一份 template.html 用 1080×1920／1080×1080 的 iframe 載入，由 CSS 的 aspect-ratio 條件排成對應版面。
        ts.append('<figure class="f-pdf"><a class="thumb" href="%s/template.html" target="_blank" rel="noopener" style="aspect-ratio:794/1123" aria-label="%s PDF（列印）">'
                  '<img class="pdfimg" data-st="%s" src="_preview/%s/p-01.jpg" alt=""></a><figcaption>PDF（列印）</figcaption></figure>' % (st, nm, st, st))
        for lb, fmt, w, h in (('限時動態 9:16', 'story', 1080, 1920), ('方形 1:1', 'square', 1080, 1080)):
            ts.append('<figure class="f-%s"><a class="thumb" href="%s/template.html" target="_blank" rel="noopener" style="aspect-ratio:%d/%d" aria-label="%s %s" data-w="%d" data-h="%d">'
                      '<iframe loading="lazy" tabindex="-1" data-base="%s/template.html" data-fmt="%s" src="%s/template.html" title="%s" style="width:%dpx;height:%dpx"></iframe></a>'
                      '<figcaption>%s</figcaption></figure>' % (fmt, st, w, h, nm, lb, w, h, st, fmt, st, lb, w, h, lb))
        rows.append('<section class="row"><div class="rh"><h2>%s</h2><span class="tag %s">%s</span></div><p>%s</p><div class="strip">%s</div></section>' % (
            nm, 'free', tag, desc, ''.join(ts)))
    css = """
:root { --paper:#fbf8f4; --ink:#241d17; --taupe:#7c6f63; --line:#dbd5cd; --teal:#1d7370; }
* { box-sizing: border-box; } body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.6 Inter, system-ui, -apple-system, "PingFang TC", sans-serif; }
.wrap { max-width: 1180px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: clamp(22px, 5vw, 28px); margin: 0 0 4px; letter-spacing: -.01em; } .lead { color: var(--taupe); margin: 0 0 14px; font-size: 14px; }
.tabs { display: flex; gap: 8px; position: sticky; top: 0; padding: 10px 0; background: var(--paper); z-index: 5; border-bottom: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tabs button { flex: none; min-height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--line); background: none; color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
.tabs button[aria-pressed=true] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.row { margin-top: 26px; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
.rh { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; } h2 { margin: 0; font-size: 20px; }
.tag { font-size: 12px; font-weight: 700; padding: 1px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--taupe); white-space: nowrap; } .tag.free { color: var(--teal); border-color: var(--teal); }
.row > p { margin: 4px 0 14px; color: var(--taupe); font-size: 14px; max-width: 680px; }
/* 縮圖：桌機三張同高並排（flex-grow＝寬高比）；手機 PDF／限動各半、方形整排 */
.strip { display: flex; gap: 16px; align-items: flex-start; }
.strip figure { margin: 0; min-width: 0; }
.f-pdf { flex: 0.7071 1 0; } .f-story { flex: 0.5625 1 0; } .f-square { flex: 1 1 0; }
@media (max-width: 720px) {
  .strip { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .f-square { grid-column: 1 / -1; }
}
figcaption { font-size: 12px; color: var(--taupe); margin-top: 6px; }
.thumb { position: relative; display: block; width: 100%; overflow: hidden; border-radius: 8px; border: 1px solid var(--line); background: #fff; box-shadow: 0 6px 18px -10px rgba(36,29,23,.4); }
.thumb .pdfimg { display: block; width: 100%; height: 100%; object-fit: contain; background: #fff; }
.thumb iframe { position: absolute; left: 0; top: 0; border: 0; transform-origin: 0 0; pointer-events: none; background: #fff; }
.foot { margin-top: 24px; font-size: 13px; color: var(--taupe); } .foot a { color: var(--teal); }
"""
    js = """
(function () {
  var ids = %IDS%;
  function pn(n) { return n < 10 ? '0' + n : '' + n; }
  function fit() {
    document.querySelectorAll('.thumb').forEach(function (t) {
      var f = t.querySelector('iframe'); if (!f) return;
      var s = t.clientWidth / parseFloat(t.dataset.w);
      f.style.transform = 'scale(' + s + ')';
    });
  }
  function show(k) {
    document.querySelectorAll('.tabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); });
    document.querySelectorAll('iframe[data-base]').forEach(function (f) { f.src = f.dataset.base + '#' + ids[k][0]; });
    document.querySelectorAll('.pdfimg').forEach(function (im) { im.src = '_preview/' + im.dataset.st + '/p-' + pn(ids[k][1]) + '.jpg'; });
  }
  document.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.k); }); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); document.querySelectorAll('.thumb').forEach(function (t) { ro.observe(t); }); }
  window.addEventListener('resize', fit); fit();
})();
"""
    pick = lambda sid: [sid, PAGE_OF[sid]]
    pickd = lambda n: list(DAY_FIRST[n])
    js = js.replace('%IDS%', json.dumps({'overview': pick('overview'), 'map': pick('map-1'), 'map2': pick('map-2'), 'day2': pickd(2), 'day5': pickd(5)}))
    tabs = ''.join('<button type="button" data-k="%s" aria-pressed="%s">%s</button>' % (k, 'true' if k == 'overview' else 'false', lb)
                   for k, lb in (('overview', '總覽'), ('map', '地圖 1'), ('map2', '地圖 2'), ('day2', '第 2 天'), ('day5', '第 5 天')))
    return ('<!doctype html>\n<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<meta name="robots" content="noindex"><title>分享風格</title><style>%s</style></head><body><div class="wrap">'
            '<h1>分享風格</h1><p class="lead">每個風格只有一份 RWD 的 template.html，PDF（列印）、限時動態 9:16、方形 1:1 都由同一份依版面尺寸排出來。點縮圖開模板；上面的按鈕換看哪一頁。這一頁是給你挑的，不是模板。</p>'
            '<div class="tabs">%s</div>%s<p class="foot">Powered by TripEZGo badge：<a href="_badge/badge.html">_badge/badge.html</a>（已選方向 A）</p></div><script>%s</script></body></html>\n') % (css, tabs, ''.join(rows), js)


if not VERIFY:
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf8').write(build_index())

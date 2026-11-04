#!/usr/bin/env python3
"""screens/ 的簡體中文字典：zh-Hant-TW → zh-Hans，**逐條取自 App 的字串表**（Scripts/i18n/maps/*.json 的兩個欄位），不是繁轉簡。

用法：python3 tools/gen-hans-dict.py [App repo 路徑，預設 ~/Projects/tripezgo]
輸出：screens/hans-dict.js（只收「繁體那一欄真的出現在 screens/ 原始碼裡」的條目，檔案才不會太大）。

screens/ 的畫面程式只有四語字串表（繁中、英、日、韓）；簡中版不在每一頁再寫一份，而是用繁中畫面跑完之後，
由 chrome.js 的 hansPass() 把文字節點照這份字典換成 App 自己的簡中字。範本旅程資料（行程、待辦、筆記…）不走字典，
直接讀 App 內建範本的 zh-Hans 檔（data/sanyo.zh-Hans.json）。字典裡沒有的字，要手寫進 MANUAL（下面），由人寫，不是工具轉。"""
import glob, json, os, re, sys

app = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Projects/tripezgo')
root = os.path.join(os.path.dirname(__file__), '..')
src = ''
for dp, dn, fn in os.walk(os.path.join(root, 'screens')):
    if '/out' in dp or '/ref' in dp or '/data' in dp or '/img' in dp: continue
    for f in fn:
        if f.endswith(('.html', '.js')) and f != 'hans-dict.js':
            src += open(os.path.join(dp, f), errors='ignore').read()

pairs = {}
def walk(o):
    if isinstance(o, dict):
        if isinstance(o.get('zh-Hant-TW'), str) and isinstance(o.get('zh-Hans'), str):
            pairs.setdefault(o['zh-Hant-TW'], o['zh-Hans'])
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
for f in glob.glob(os.path.join(app, 'Scripts/i18n/maps/*.json')):
    walk(json.load(open(f)))

PH = re.compile(r'%(\d+\$)?(@|lld|d|ld)')
exact, rules = {}, []
for hant, hans in pairs.items():
    if hant == hans or not hant.strip(): continue
    if PH.search(hant):
        parts = PH.split(hant)
        lit = [p for p in re.split(PH, hant) if p and p not in ('@', 'lld', 'd', 'ld') and not (p.endswith('$'))]
        if not any(l.strip() and l in src for l in lit): continue
        # 佔位符轉成 (.+?)；簡體端的佔位符照順序帶回 $1…
        n = [0]
        def to_re(m):
            n[0] += 1; return '(.+?)'
        pat = '^' + ''.join(re.escape(x) if i % 3 == 0 else '' for i, x in enumerate(PH.split(hant)))
        # PH.split 會多吐兩個群組：重組更直接
        pieces, last, idx = [], 0, 0
        for m in PH.finditer(hant):
            pieces.append(re.escape(hant[last:m.start()])); pieces.append('(.+?)'); last = m.end()
        pieces.append(re.escape(hant[last:]))
        rep, last, k = [], 0, 0
        for m in PH.finditer(hans):
            rep.append(hans[last:m.start()]); k += 1; rep.append('$%d' % k); last = m.end()
        rep.append(hans[last:])
        rules.append(['^' + ''.join(pieces) + '$', ''.join(rep)])
        continue
    if hant in src:
        exact[hant] = hans

# 人寫的補充：字串表沒有、但畫面上會出現的短語（星期、日期連接字、示範用的名字與字樣）。簡體字由人寫，來源註明。
MANUAL = {
    '週日': '周日', '週一': '周一', '週二': '周二', '週三': '周三', '週四': '周四', '週五': '周五', '週六': '周六',
    '，': '，',
    # 以下是畫面程式裡寫死的短語（不在字串表裡），簡體由人寫：地名、時間詞
    '廣島市、岡山市': '广岛市、冈山市', '廣島': '广岛', '岡山': '冈山', '宮島': '宫岛', '山陽': '山阳', '倉敷': '仓敷',
    '小時前': '小时前', '小時': '小时', '時刻表': '时刻表', '候車': '候车', '還有': '还有', '搜尋': '搜索',
    '紅葉饅頭 12 入': '红叶馒头 12 入',
}
exact.update(MANUAL)
out = os.path.join(root, 'screens/hans-dict.js')
with open(out, 'w') as f:
    f.write('// 由 tools/gen-hans-dict.py 產生（App 字串表的 zh-Hant-TW → zh-Hans 逐條對照）。不要手改。\n')
    f.write('export const HANS = ' + json.dumps(exact, ensure_ascii=False, separators=(',', ':')) + ';\n')
    f.write('export const HANS_RULES = ' + json.dumps(rules, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(exact), 'exact', len(rules), 'rules', os.path.getsize(out), 'bytes')

#!/usr/bin/env python3
"""產生 share-styles/manifest.json（票 34）。

App 開啟分享時讀 https://tripezgo.com/share-styles/manifest.json：
  contractVersion  模板契約版本。改 DOM 結構／class 名／section id 規則／slot 欄位就升；只改 CSS 不升。
                   App 不認得比自己新的版本，就用舊快取或內建備援（見 share-styles/README.md）。
  styles[].id      風格 id
  styles[].version 這個風格的內容版本（改了 CSS 或範例就 +1，App 看到變了才重新下載）
  styles[].files   紙張 → 相對於 manifest 的路徑（a4＝A4 直向、letter＝美加 Letter）
  styles[].sha256  紙張 → 該檔位元組的 SHA-256（小寫 hex）；App 下載後對不上就丟掉

跑法：python3 share-styles/_src/manifest.py   （build.py 跑完會自動呼叫；單獨改 version 後也可直接跑）
輸出是確定性的：同樣的檔案內容產出同樣的 manifest。
"""
import hashlib
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

CONTRACT_VERSION = 1
# 風格 id → 內容版本。改了該風格的模板就在這裡 +1。
STYLE_VERSIONS = {'magazine': 1}
PAPERS = {'a4': 'template.html', 'letter': 'template-letter.html'}


def build():
    styles = []
    for style_id, version in STYLE_VERSIONS.items():
        files, digests = {}, {}
        for paper, name in PAPERS.items():
            rel = '%s/%s' % (style_id, name)
            with open(os.path.join(ROOT, rel), 'rb') as f:
                digests[paper] = hashlib.sha256(f.read()).hexdigest()
            files[paper] = rel
        styles.append({'id': style_id, 'version': version, 'files': files, 'sha256': digests})
    return {'contractVersion': CONTRACT_VERSION, 'styles': styles}


def write():
    out = os.path.join(ROOT, 'manifest.json')
    with open(out, 'w', encoding='utf8') as f:
        json.dump(build(), f, ensure_ascii=False, indent=2)
        f.write('\n')
    return out


if __name__ == '__main__':
    print('wrote', write())

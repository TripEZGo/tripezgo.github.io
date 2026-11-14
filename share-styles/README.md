# share-styles

TripEZGo 1.10.0 的旅程分享模板。App 開啟分享時從 `https://tripezgo.com/share-styles/manifest.json` 讀目錄，
下載風格的 CSS 來排版；下載失敗或版本不認得時用 App 內建的備援。

## 正式站上的東西

只有這些會被 `tools/stage-pages.mjs` 發佈：

```
share-styles/manifest.json
share-styles/<風格 id>/template.html          A4
share-styles/<風格 id>/template-letter.html   Letter（美加）
```

`_src/`（產生器）、`_preview/`、`_sample/`、`_badge/`、`index.html`（開發用的預覽頁）、本檔都**不上正式站**。
模板裡 `../_sample/…` 的圖是範例資料，正式站上不存在；App 只取模板的 `<style>`（與 `@page`），不用那些 DOM。

## manifest.json

```json
{
  "contractVersion": 1,
  "styles": [
    {
      "id": "magazine",
      "version": 1,
      "files":  { "a4": "magazine/template.html", "letter": "magazine/template-letter.html" },
      "sha256": { "a4": "<64 位小寫 hex>", "letter": "<64 位小寫 hex>" }
    }
  ]
}
```

- `files` 是相對於 manifest 的路徑。
- `sha256` 是該檔位元組的 SHA-256；App 下載後對不上就丟掉。
- `version` 是風格的內容版本：改了模板就加一，App 看到變了才重新下載。

由 `_src/manifest.py` 產生，`_src/build.py` 跑完會自動呼叫。只改 `STYLE_VERSIONS` 或手動改過模板時，單獨跑：

```
python3 share-styles/_src/manifest.py
```

`npm run test:unit` 會比對 manifest 的 SHA-256 與實際檔案，忘了重跑會紅。

## 契約變更規則

**契約＝DOM 結構＋class 名＋section id 規則＋slot 欄位**（以 `_src/build.py` 的元件與模板開頭的 `slot:`／`repeat:` 註解為準）。

- 只改 CSS（長相）：不動 `contractVersion`，加 `version`。
- 改 DOM、class 名、section id 規則或 slot 欄位：**升 `contractVersion`**。
- App 只接受 `contractVersion` 不大於它自己認得的版本；比它新的一律忽略，改用舊快取或內建備援。
  所以升版之後，舊版 App 繼續用舊的樣子，不會壞。要讓新版 App 讀到，新版 App 要先上架。

## 模板的限制

純 HTML＋CSS：沒有 `<script`、沒有行內事件處理、沒有任何 `http(s)://` 或 `//` 外部資源（字型、圖片、CSS 都是 `data:` 或本機相對路徑）。
`tests/unit/share-styles.test.mjs` 守著。

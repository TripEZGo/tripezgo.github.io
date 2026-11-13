# tripezgo.com

TripEZGo iOS App 的官方網站。純靜態 HTML + CSS，沒有建置步驟，部署在 GitHub Pages。

## 結構

```
index.html            首頁（繁體中文）
announcements/        所有公告（tools/announcements.mjs 產生，四語各一頁）
privacy.html          隱私權政策（繁體中文）
terms.html            使用者條款（繁體中文）
en/index.html         首頁（English）
en/privacy.html       Privacy Policy
en/terms.html         Terms of Use
404.html
assets/css/site.css   全站唯一一份樣式，色票沿用 TripEZGo 品牌識別 token
assets/img/           標誌、App 截圖（webp）、功能插圖（明暗各一份）、OG 圖
covers/               App 的封面池圖片（長邊 ≤ 2048 的 JPEG，檔名帶 sha256 前 8 碼）；清單在 secret gist，由 App repo 的 `Scripts/covers/` 產生與更新
CNAME                 tripezgo.com
.nojekyll             關掉 GitHub Pages 的 Jekyll 處理
robots.txt / sitemap.xml
```

送 App Store 審查時填的兩個網址：

- 隱私權政策：`https://tripezgo.com/privacy.html`（英文版 `https://tripezgo.com/en/privacy.html`）
- 使用者條款：`https://tripezgo.com/terms.html`（英文版 `https://tripezgo.com/en/terms.html`）

## 公開連結頁 `trip/`（1.10.0 起停用）

`https://tripezgo.com/trip/` 之下不論 `#` 後面是什麼，一律只顯示「這個連結已停用」（五語：繁中、en、ja、ko、简中，
依瀏覽器語言挑一種；沒有 JS 時五種都顯示）。不讀 CloudKit、不解密、不載 `trip/` 底下的任何 JS，CSP 的 `default-src` 是 `'none'`。
App 的公開連結在 1.10.0 拿掉（S59、S60）；**這個頁面在 1.10.0 上架當天才部署**，步驟在 `tools/cleanup/RETIRE.md`。

```
trip/index.html     停用頁
trip/core.js        純函式：網址、解密、驗章、逐日分桶、純文字——清理工具與單元測試用
trip/icons.js, config.js   screens/ 的展示頁還在用
trip/app.js, cloudkit.js, strings.js, looks.js   舊的公開頁；已沒有頁面載入（上架後再清）
```

### 測試

網站本身沒有建置步驟；`package.json` 只為了測試（`node_modules/` 已 gitignore，不會被發布）。

```bash
npm ci
npx playwright install chromium
npm test                  # node 單元測試＋Playwright 瀏覽器測試
npm run golden:check      # 黃金檔副本 vs App repo 那一份（預設找 ../tripezgo，可給路徑）
```

- `tests/fixtures/golden-v1.json`、`golden-v1-dayzones.json` 是 App repo `docs/public-link/golden-v1.json`、`golden-v1-dayzones.json` 的副本——App 的程式碼
  加密、簽章、產純文字的那一份。解密與三語純文字都跟它逐字對。App 那一份變了就複製過來。
  v1-dayzones（App 1.5.0）＝仍是 `v: 1`，多一個選填的 `trip.dayZones`（每一天各帶旅程時區；舊版 App 的解碼會忽略它、照 `tz`＝第 1 天讀）；
  沒有 `dayZones` 的舊連結照舊讀，兩份都留。`v: 2` 一度設計過又撤回，網站仍認得（官網可能發出過），App 不再寫。
- 瀏覽器測試：`trip-retired.spec.mjs`（停用頁）、`open-page.spec.mjs`（跳轉頁）、`csp.spec.mjs`。
- `.github/workflows/test.yml` 在 push 時只跑 `npm run test:unit`，**不擋部署**。瀏覽器測試（Playwright）**禁止在 GitHub CI 跑**（使用者 2026-10-26），只在本機跑。

### 每日清理 `tools/cleanup/`

`.github/workflows/cleanup.yml` 每天 03:23（台北）跑一次、也能手動觸發（手動預設**試跑**：只列不刪）。
它用 server-to-server key 列出 **Production** public database 的 `TripEZGoPublicItinerary`。
`MODE=purge`（1.10.0 上架當天起，見 `tools/cleanup/RETIRE.md`）＝**全刪**、不驗章；沒設 `MODE` ＝下面這套判定：
刪掉格式版本不認得、payload 壞格式、沒簽、或 HMAC 在目前接受的任一把金鑰下都驗不過的——
那些不是 App 寫的（任何登入 iCloud 的人都能直接用 Web Services 建這個 type 的 record，吃的是
container 共用的 public 額度）。每一筆刪了什麼、為什麼，寫在 log 與 job summary。

- **為什麼放這個 repo**：App repo 沒有 CI（本機出貨）；驗章跟公開頁共用 `trip/core.js`，同一份黃金檔測試。
- **為什麼只碰 Production（寫死）**：Development 是模擬器與 debug build 的測試資料。
- **換鑰**：`TEZ_SIGNING_KEYS` 放逗號分隔的多把，新舊並列一段時間，等舊版 App 寫的都更新過再拿掉舊的。
- **App 升格式版本之前**，先讓清理認得新版本並上線，否則新版 App 寫的每一筆都會被刪。

要設的 Actions secrets（沒設之前每天跳過，不算失敗）：

| secret | 內容 |
|---|---|
| `CK_S2S_KEY_ID` | CloudKit Console › Production 的 server-to-server key 的 Key ID |
| `CK_S2S_PRIVATE_KEY` | 那一把的 EC P-256 私鑰（PEM 全文） |
| `TEZ_SIGNING_KEYS` | App 內嵌的簽章金鑰（base64），換鑰期間逗號分隔多把 |

server-to-server key 以建立它的開發者身分存取、連同身上的 security role：開發者的 user record
要掛上自訂角色 `Moderator`（Write），才刪得動別人建的 record（2026-09-25 spike 量過）。

## 公告 `announcements/`

首頁藍圖前的「公告」區塊與「所有公告」頁 `/announcements/`（四語各一頁）。內容是兩份 **secret gist** 合併、依日期排序：

- App 的公告：App repo `RemoteDocumentSource` 那份的 `ios-announcements.json`（ADR-0038）——App 裡看得到的，官網也列
- 官網專用的公告：zhgchgli0718 帳號下描述為「TripEZGo 官網公告」的 gist 的 `web-announcements.json`（網址不寫在這裡：repo 是公開的），
  格式跟 App 那份一樣（`promote` 不用寫）——只在官網出現，App 看不到

規則照 App 的 `Announcement.swift`。同一天 App 的排前面；兩份 id 撞到只留 App 那則。
設計稿：Open Design `site-announcements.html`、`site-announcements-page.html`。

- `tools/announcements.mjs` 抓 gist → `assets/data/announcements.json`（四語各一份、新的在前），再寫出四頁 `/announcements/`。
  首頁由 `home.js` 讀 JSON 畫最新 5 則；沒有公告整段不出現。
- **raw 網址不進 repo、也不進官網**：只放在 Actions secret `TEZ_ANNOUNCEMENTS_URL`（App）與 `TEZ_WEB_ANNOUNCEMENTS_URL`（官網）。
  部署（push、每天的排程）時抓一次；gist 改了想馬上上，手動跑一次 *Deploy to GitHub Pages*。
  沒設的那一份當作沒有公告；有設的任何一份抓不到、或文件沒有 `announcements` 陣列，整份沿用 repo 裡的快照。
- 本機更新快照：`TEZ_ANNOUNCEMENTS_URL=<App 的 raw 網址> TEZ_WEB_ANNOUNCEMENTS_URL=<官網的 raw 網址> node tools/announcements.mjs`；改了首頁的頁首頁尾，
  `node tools/stamp-home.mjs` 會順手跑 `--offline` 重產四頁。

## 本機預覽

沒有相依套件，起一個靜態伺服器即可：

```bash
python3 -m http.server 4000
```

開 <http://127.0.0.1:4000>。注意頁面內連結都是**絕對路徑**（`/assets/...`），
直接用 `file://` 開會找不到資源，一定要透過 http server 看。

## 部署

`main` 有 push 就由 `.github/workflows/pages.yml` 部署到 GitHub Pages。**發佈的是白名單，不是整個根目錄**：
`tools/stage-pages.mjs` 把 `PUBLISH` 裡的項目複製到 `_site/`，上傳的是 `_site/`。根目錄新增項目時要在
`PUBLISH`（發佈）或 `KEEP_OUT`（不發佈）選一邊，沒分類 workflow 會紅（`tests/unit/stage-pages.test.mjs` 同樣會紅）。
Workflow 在上傳前會把 `_site/` 裡所有 HTML 的站內連結對一次，斷掉或指到沒發佈的東西就讓 build 失敗。
Workflow 的 action 全部釘完整 commit SHA（後面註解寫版本）；升版時查新 tag 的 SHA 再換，不要改回 tag。

GitHub repo 的 `Settings → Pages → Source` 要選 **GitHub Actions**。

## 素材來源

首頁的截圖（`assets/img/shots/<zh|en|ja>/01–08.webp`）**就是商城那 8 張原圖**：App repo
`fastlane/screenshots/<zh-Hant|en-US|ja>/0N-*.png`（1320×2868，含標語與機身），只用
`sips -z 1434 660` 等比縮半、`cwebp -q 85` 轉檔，不裁切、不加框（使用者要求 2026-10-09）。
圖的底色就是 `--surface`；在白底與深色模式上靠 `.shot` 的圓角讀成卡片。商城圖換了就照這個重轉。
功能介紹的文案與順序對齊 App repo `fastlane/metadata/<locale>/description.txt` 的六大特色。

功能插圖（隱私那一張）來自設計稿專案。
標誌是設計稿切出的三份 SVG（圖標／字標／組合標），用 CSS `mask` 上色，
所以同一個檔案在深淺色模式下各自跟著 `currentColor` 走。

## App Store

下載連結一律是 `https://apps.apple.com/app/id6801536372`（不帶地區，Apple 依使用者的商店地區導過去）：
首頁三語的 hero 與方案段、`/open/` 的「前往下載」，首頁另有 `apple-itunes-app` Smart App Banner。


## 官網 GA4

Measurement ID：`G-MMDNPN68XK`。`tools/stage-pages.mjs` 在頁面產生後，為四語首頁、聯絡、公告、隱私與條款頁注入 `assets/js/analytics.js`，避免頁面重產後遺失。Google tag 使用標準 `js` 與 `config` 初始化，自動記錄 page_view，UTM 可用於 Threads 來源歸因。

在 `tripezgo.com`／`www.tripezgo.com` 與 `en`／`zh-tw`／`ja`／`ko` 語言子網域啟用；localhost、iframe、`?mode=embed` 不載入 GA。screens 展示頁、trip/open/join/android-auth App 工具流程與 404 不注入，避免 App 內嵌畫面及自動展示算成官網造訪。此設定不會變更 iOS App 的 Firebase 收集政策。

## 語言子網域與 shell repositories

採用與 `zhgchgli.github.io` 相同的主 repo／語言 shell repo 模式。內容與產生器只在本 repo 維護；shell repo 只需要一份 `.github/workflows/pages.yml`，部署時 checkout 本 repo 的 `main`。**不需要 Cloudflare Worker**。

| Pages repo | Actions variable `DEPLOY_LANG` | Pages custom domain |
|---|---|---|
| 本 repo | `router`（預設） | `tripezgo.com` |
| `TripEZGo/tripezgo-en` | `en` | `en.tripezgo.com` |
| `TripEZGo/tripezgo-zh-tw` | `zh-tw` | `zh-tw.tripezgo.com` |
| `TripEZGo/tripezgo-ja` | `ja` | `ja.tripezgo.com` |
| `TripEZGo/tripezgo-ko` | `ko` | `ko.tripezgo.com` |
| `TripEZGo/tripezgo-zh-cn` | `zh-cn` | `zh-cn.tripezgo.com` |

五個 shell repo 已建立並啟用（zh-cn 於 2026-11-04 隨 1.7.0 簡體版加入；瀏覽器偏好 zh-Hans／zh-CN／zh-SG 導到 zh-cn，其他 zh-* 導到 zh-tw） GitHub Actions Pages、設定對應 custom domain 與 Actions variables。Shell workflow 不監聽 push，支援手動、排程與 repository_dispatch；執行前會確認主 repo 已有語系產生器。各 shell 的 Settings → Secrets and variables → Actions → Variables 設定：

- `SOURCE_REPOSITORY`：本主 repo 的 `owner/repo`。
- `DEPLOY_LANG`：上表的語言。
- Pages → Source 選 **GitHub Actions**，Custom domain 填對應子網域，開啟 Enforce HTTPS。
- 四個 shell 會讀取主站公開的公告快照，不需要複製 secret gist 的 Actions secrets。

主 repo 設定 `SHELL_REPOS` variable 為四個 shell 的 JSON 陣列，例如 `["owner/site-en","owner/site-zh-tw","owner/site-ja","owner/site-ko"]`；設定 `GH_TOKEN` secret，使用只對這四個 shell 有 Contents write 的 fine-grained PAT（repository_dispatch 所需）。主 repo 部署完成後會觸發四個 shell 重建；也可以個別手動執行 workflow。shell 的排程同樣會更新內容。部署 workflow 日後有修改時，也要更新 shell 的那一份。

Cloudflare DNS：保留 apex 的 GitHub Pages 記錄；`www` 與四個語言子網域各加 CNAME，指向 **GitHub 帳號／組織的 `<owner>.github.io`，不是含 repo 路徑的 URL**。先用 DNS only 完成 GitHub 的網域與 HTTPS 驗證；HTTPS 就緒後可依需求啟用 proxy。移除會把所有語言子網域重新導回 apex 的舊 redirect rules。

`tools/stage-pages.mjs` 讀取 `DEPLOY_LANG`：語言站將所選內容放到根路徑、產生對應 CNAME，並轉換導覽、canonical、hreflang、OG、sitemap 與公告連結。主網域與 `www` 的首頁／聯絡／公告／政策／條款頁讀取 `navigator.languages`，按偏好順序找 `zh-*`、`en-*`、`ja-*`、`ko-*`；沒有支援的語言時預設英文。使用 `location.replace` 並保留路徑、query、hash；入口本身提供完整英文頁面；停用 JavaScript、語言讀取失敗或跳轉被阻擋時仍可閱讀。英文兜底頁 canonical 指向英文子網域，入口不重複載入 GA。

舊 `/en/`、`/ja/`、`/ko/` 行銷頁保留靜態轉址；`/trip/`、`/open/`、`/join/`、`/android-auth/`、`/.well-known/` 與素材維持原路徑。App Store 既有政策網址仍能使用，會依偏好轉到語言子網域。靜態轉址不提供 HTTP 301/302 狀態碼。

本機驗證輸出（不設 `DEPLOY_LANG` 時仍維持原始多目錄預覽）：

```bash
DEPLOY_LANG=en node tools/stage-pages.mjs _site
DEPLOY_LANG=router node tools/stage-pages.mjs _site
npm run test:unit
```

GA4 已允許四個語言子網域。首頁 MapKit 的既有 token 若僅授權 apex，需在 Apple 端重新簽發允許新子網域的 token，才能讓新網域內的地圖示範正常運作。

### 遷移進度與 SEO 轉址

Cloudflare 已新增 `en`、`zh-tw`、`ja`、`ko` 的 CNAME → `tripezgo.github.io`。舊英文／日文／韓文路徑使用 Redirect Rules：只匹配 apex 與 www 上的 `/en` 或 `/en/…`（其他語言同理），動態目的地是 `concat("https://en.tripezgo.com", substring(http.request.uri.path, 3))`，狀態 301、Preserve query string 開啟。瀏覽器會保留未被覆寫的 fragment。繁中舊政策、條款、聯絡、公告頁固定 301 到 `zh-tw` 對應頁，讓舊內容與新內容保持一致；只有主網域首頁依使用者語言跳轉。App 工具路徑不匹配這些規則。

每個語言站的 sitemap 只列自己的五個 canonical 頁；主站 sitemap 改為四個語言 sitemap 的索引。每頁保留四語 reciprocal hreflang，x-default 指向對應英文頁。切換前主 repo 的 `DEPLOY_LANG=legacy` 保留原站；四語站部署與 HTTPS 完成後改成 `router` 並啟用上述 Cloudflare 規則。

2026-11-02 已完成切換：主 repo 設為 `DEPLOY_LANG=router`；四語站已部署、各自啟用 GitHub Enforce HTTPS；四條 Cloudflare 舊網址轉址規則已啟用並實測 301。20 個行銷頁的 canonical／hreflang 與四份語系 sitemap 均已驗證。

即時同步使用主 repo 的 `SHELL_REPOS` variable 與 `GH_TOKEN` Actions secret。依使用者指定，實際權杖為 Classic、No expiration，僅有 `public_repo` scope；Classic 的權限涵蓋使用者有權操作的公開 repositories，無法只限制在四個語系 repo。權杖值不放在原始碼或文件。主站部署成功後發出 `master-updated`，四個語系 repo 由主 repo 的最新內容重建；每日排程與手動部署也保留。

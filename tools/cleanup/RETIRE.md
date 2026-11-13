# 公開連結退場：上架當天的步驟

TripEZGo 1.10.0 拿掉 App 內的公開連結（S59）。舊連結一律停用、這個 type 的雲端紀錄全刪（S60）。
**這份分支上準備好了程式，但沒有部署、沒有刪任何東西。** 開發期間不執行，上架當天照下面做。

## 分支上準備好的東西

| 東西 | 狀態 |
|---|---|
| `trip/index.html` | 停用頁（五語：繁中、en、ja、ko、简中；`/trip/` 之下任何 `#`、查詢字串都一樣）。不載 cloudkit.js、不讀資料、不解密 |
| `open/index.html` | 公開連結那條路收掉：認得舊連結，但只顯示「這個連結已停用」；邀請連結（`/join/`）那條照舊 |
| `tools/cleanup/cleanup.mjs` | 新增 `MODE=purge`（全刪、不驗章）。沒設 `MODE` ＝ 舊判定，行為不變。`DRY_RUN` 照舊 |
| 測試 | `npm run test:unit`、`npx playwright test`（本機）。purge 的單元測試用假的 Web Services |

## 部署前要先補的一件事：workflow 的 `MODE`（這份分支沒動它）

`.github/workflows/cleanup.yml` 現在不會把 `MODE` 傳給 `cleanup.mjs`，所以手動觸發也只能跑舊判定。
票 35 要求「排程維持舊模式、手動觸發能選 purge」，這需要改 workflow；改 workflow 要主 session 決定，所以只附 patch：

```diff
   workflow_dispatch:
     inputs:
       dry_run:
         description: 只列出會刪哪些，不刪
         type: boolean
         default: true
+      mode:
+        description: legacy＝只刪不是 App 寫的（預設）；purge＝這個 type 全刪（1.10.0 上架當天才用）
+        type: choice
+        options: [legacy, purge]
+        default: legacy
 ...
           DRY_RUN: ${{ github.event_name == 'workflow_dispatch' && inputs.dry_run || 'false' }}
+          # 排程觸發沒有 inputs → 空字串 → 舊判定。步驟 5 之後，把排程的預設改成 purge。
+          MODE: ${{ github.event_name == 'workflow_dispatch' && inputs.mode == 'purge' && 'purge' || '' }}
```

`MODE` 只接受空字串或 `purge`，其他值（含大小寫、打錯字）直接拒絕執行，不會悄悄退回另一種行為。
這個 patch 要先進 `main`（workflow 只認預設分支上的版本才能手動觸發），而且要在 1.10.0 上架**之前**進，這樣當天才有得用。
它單獨進 main 是安全的：預設仍是舊判定，不會刪更多東西。

## 上架當天

前置：使用者已手動發布 1.10.0。

1. **確認 1.10.0 在 App Store 上架**（使用者手動發布之後）。
2. **部署 `trip/` 停用頁**（這個分支合進 `main`，照 `site-deploy` 的流程；部署完才打新網址）。
   部署後實際打開一條舊連結（`https://tripezgo.com/trip/#<任一舊的 id>.<金鑰>`，或黃金檔
   `tests/fixtures/golden-v1.json` 裡的任何一條），確認看到「這個連結已停用」，而且 Network 面板沒有 `api.apple-cloudkit.com`。
   也打開 `https://tripezgo.com/open/#<上面那條，encodeURIComponent 過>`，確認只顯示「這個連結已停用」。
3. **手動觸發 cleanup workflow：`mode=purge`、`dry_run=true`**，看 job summary 的「會刪 N 筆」。記下 N。
4. **再觸發一次：`mode=purge`、`dry_run=false`**。看報告「刪掉 M 筆，失敗 0 筆」，**M 必須等於步驟 3 的 N**
   （中間舊版 App 新發的會讓 M 多一點；少於 N 或有「失敗」就停下來查，不要重跑到看起來對）。
5. **排程改成 `MODE=purge`**（留著防別人塞資料，spec §15 Q9）：workflow 的 `MODE` 那行直接改成 `MODE: purge`，
   `workflow_dispatch.inputs.mode` 的預設也改 purge。改完不必再觸發，隔天 03:23（台北）的排程就是全刪。
6. **CloudKit Console 確認**：Production → Data → Public Database → Record Type `TripEZGoPublicItinerary`，
   查詢沒有任何紀錄。有的話看是不是舊版 App 剛寫的（等下一輪排程，或再手動跑一次步驟 4）。

## 要知道的

- 舊版 App 仍可能寫新的紀錄：排程每天清掉，網頁一律停用，所以那些連結打不開。
- 清理只碰 **Production**（寫死，不吃參數），身分是 server-to-server key＋`Moderator` 角色，跟舊判定相同。
- purge 不需要 `TEZ_SIGNING_KEYS`；舊判定（排程在步驟 5 之前）仍需要。
- 全刪之後這支排程留著還是拿掉，上架後再看（spec §15 Q9）。拿掉的話，`trip/core.js` 的驗章（`isSigned`）才不再被這裡用到。
- `trip/app.js`、`cloudkit.js`、`strings.js`、`looks.js` 已沒有頁面載入（`screens/` 的 import map 仍列著它們；`core.js` 還被清理與單元測試用，`icons.js`、`config.js` 還被 `screens/` 用）。
  要不要刪是上架後的清理，不在這張票。

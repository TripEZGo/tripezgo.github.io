/* 公開連結頁的三語字典——逐字取自設計稿 `trip-share-public.html` 的 `S`
 * （Open Design 專案 e0f396c1-0fb8-48ff-9a11-996200cddadc）。
 *
 * 改過的地方：
 *   - 交通方式：設計稿的假資料用 car/walk/bus…；真的公開版本帶的是 App 的 `LegMode` 原始值，
 *     字取 App 的 `domain.legmode.*`（Domain/Resources/Localizable.xcstrings）。
 *   - 純文字那幾個字（it*）不在這裡：在 core.js 的 ITINERARY，跟 App 的字串目錄逐字對。
 *   - 設計稿的「退路」卡（fb*）沒有上線：spike 證實網頁登入＋刪除做得到，退路不需要。
 *   - `signinGo`／`stopFailed`：設計稿的登入鈕是 CloudKit JS 掛進來的 Apple 按鈕（稿裡只佔位）；
 *     這一頁不載 CloudKit JS，所以按鈕自己畫、字自己給。停止失敗設計稿沒畫，用 toast 講。
 *   - 時間欄的旅程時區說明（tz*，使用者裁定 2026-10-05）：句型逐字取自 App 的 `ui.calendar.zone.note`／
 *     `.difference`／`.hours`／`.minutes`（UI/Resources/Localizable.xcstrings），**只有「手機」換掉**——
 *     這一頁比的是瀏覽器的時區，看的人可能在電腦上。App 的日文本來就寫「端末の時刻」（裝置），所以中文寫
 *     「裝置時間」、英文寫「your device’s time」，三語講同一件事、也跟 App 其中一語一致；不寫「你的時間」：
 *     那讀起來像「你那裡現在幾點」，不是「你的時區」。
 *   - `tzVaries`（review F1）：App 一次只畫一天、沒有這句；這一頁幾天並排，時差會變的旅程（跨夏令時間）
 *     說明讀第一段時差，再接這句講「不是每一天都這樣、以欄內的為準」。
 */
export const LANGS = [
  { k: 'zh', lb: '中', html: 'zh-Hant' },
  { k: 'en', lb: 'EN', html: 'en' },
  { k: 'ja', lb: '日', html: 'ja' },
];

export const S = {
  zh: {
    tzNote: '目前為%s，與裝置時間差 %s', tzDiff: '%s%s 小時 %s 分', tzDiffH: '%s%s 小時', tzDiffM: '%s%s 分',
    tzVaries: '（部分日子不同，以每一天欄內左側的裝置時刻為準）',
    days: '天', day: '第 %s 天', min: '%s 分', hr: '%s 小時', hrmin: '%s 小時 %s 分',
    undated: '日期未定', updated: '最後更新 %s',
    grid: '旅程時間表，左右捲動看其他天',
    empty: '這天還沒有安排。',
    loading: '正在打開這趟旅程⋯',
    copyApp: '在 TripEZGo 建立這趟旅程',
    copyText: '複製', copiedText: '已複製純文字旅程',
    locate: '顯示我的位置',
    zoom: '時間間距', zoomIn: '放大時間間距', zoomOut: '縮小時間間距',
    cal: '行事曆', map: '地圖', mapPlaceless: '沒有地點的行程', mapFull: '全螢幕', mapExit: '結束全螢幕', mapNone: '沒有座標，不在地圖上', mapAll: '這一天沒有標了位置的行程。',
    openGoogle: 'Google 地圖', close: '關閉',
    authorLink: '管理分享連結', openOnSite: '在 tripezgo.com 開啟',
    signinK: '管理這個連結', signinT: '用 iCloud 登入',
    signinWhy: '用建立這個連結的 iCloud 帳號登入，可在這裡停止分享。',
    signinGo: '前往 Apple 登入',
    cancel: '取消',
    ownerK: '已用 iCloud 登入', ownerT: '你建立了這個連結',
    ownerWhy: '不再使用 TripEZGo 也可以在這裡停止分享。',
    stop: '停止分享', signout: '登出',
    stopAsk: '停止分享這趟旅程？',
    stopWhy: '停止後，這條連結立刻失效，拿到連結的人都打不開。之後在 App 裡重新打開分享，會沿用同一條連結。',
    back: '返回', stopped: '已停止分享',
    stopFailed: '停止分享失敗。再試一次。',
    notOwnerT: '這個 iCloud 帳號不是建立者',
    notOwnerWhy: '只有建立這個連結的人能停止分享。用建立者的帳號再登入，或請建立者在 App 裡關閉。',
    stoppedT: '已停止分享',
    stoppedWhy: '這條連結已失效。要再分享，在 TripEZGo 打開這趟旅程的公開連結，會沿用同一條。',
    err: '讀不到這趟旅程', errWhy: '連結可能已失效，或作者已停止分享。',
    badT: '這條連結不完整',
    badWhy: '解不開這趟旅程。請對方重新複製連結，網址最後（# 之後）的部分也要帶上。',
    learn: '了解 TripEZGo',
    modes: { walking: '步行', driving: '開車', cycling: '騎單車', motorcycle: '騎機車', transit: '大眾運輸', other: '其他' },
  },
  en: {
    tzNote: 'Times are in %s, %s from your device’s time', tzDiff: '%s%s h %s min', tzDiffH: '%s%s h', tzDiffM: '%s%s min',
    tzVaries: ' (varies on some days. Each day shows its own device time on its left)',
    days: 'days', day: 'Day %s', min: '%s min', hr: '%s h', hrmin: '%s h %s m',
    undated: 'Dates not set', updated: 'Last updated %s',
    grid: 'Trip schedule. Scroll sideways to see the other days',
    empty: 'Nothing planned for this day.',
    loading: 'Opening this trip…',
    copyApp: 'Create this trip in TripEZGo',
    copyText: 'Copy', copiedText: 'Trip copied as plain text',
    locate: 'Show my location',
    zoom: 'Time scale', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    cal: 'Schedule', map: 'Map', mapPlaceless: 'Events with no place', mapFull: 'Full screen', mapExit: 'Exit full screen', mapNone: 'No location. Not shown on the map', mapAll: 'Nothing on this day has a location.',
    openGoogle: 'Google Maps', close: 'Close',
    authorLink: 'Manage share link', openOnSite: 'Open on tripezgo.com',
    signinK: 'Manage this link', signinT: 'Sign in with iCloud',
    signinWhy: 'Sign in with the iCloud account that made this link. You can then stop sharing here.',
    signinGo: 'Continue to Apple sign-in',
    cancel: 'Cancel',
    ownerK: 'Signed in with iCloud', ownerT: 'You made this link',
    ownerWhy: 'You can stop sharing here, even if you no longer use TripEZGo.',
    stop: 'Stop sharing', signout: 'Sign out',
    stopAsk: 'Stop sharing this trip?',
    stopWhy: 'The link stops working immediately for everyone who has it. If you turn sharing on again in the app, it uses the same link.',
    back: 'Back', stopped: 'Sharing stopped',
    stopFailed: 'Sharing did not stop. Try again.',
    notOwnerT: 'This iCloud account did not make this link',
    notOwnerWhy: 'Only the person who made the link can stop sharing it. Sign in again with that account, or ask that person to turn it off in the app.',
    stoppedT: 'Sharing stopped',
    stoppedWhy: 'This link no longer works. To share again, turn on the public link for this trip in TripEZGo. It uses the same link.',
    err: 'This trip could not be loaded', errWhy: 'The link may have expired, or the owner stopped sharing.',
    badT: 'This link is incomplete',
    badWhy: 'This trip cannot be opened. Ask the sender to copy the link again. Include the last part of the address (after the #).',
    learn: 'Learn about TripEZGo',
    modes: { walking: 'Walking', driving: 'Driving', cycling: 'Bike', motorcycle: 'Motorbike', transit: 'Transit', other: 'Other' },
  },
  ja: {
    tzNote: '現在は%sで表示しています。端末の時刻との差は %s', tzDiff: '%s%s時間%s分', tzDiffH: '%s%s時間', tzDiffM: '%s%s分',
    tzVaries: '（日によって異なります。各日の左側の端末の時刻を参照）',
    days: '日間', day: '%s 日目', min: '%s 分', hr: '%s 時間', hrmin: '%s 時間 %s 分',
    undated: '日程未定', updated: '最終更新 %s',
    grid: '旅程表。横にスクロールすると他の日を見られます',
    empty: 'この日はまだ予定がありません。',
    loading: 'この旅程を開いています⋯',
    copyApp: 'TripEZGo でこの旅程を作成',
    copyText: 'コピー', copiedText: '旅程をテキストでコピーしました',
    locate: '現在地を表示',
    zoom: '時間の間隔', zoomIn: '間隔を広げる', zoomOut: '間隔を狭める',
    cal: 'スケジュール', map: '地図', mapPlaceless: '場所のない予定', mapFull: '全画面', mapExit: '全画面を終了', mapNone: '位置情報なし（地図には出ません）', mapAll: 'この日は位置情報のある予定がありません。',
    openGoogle: 'Google マップ', close: '閉じる',
    authorLink: '共有リンクを管理', openOnSite: 'tripezgo.com で開く',
    signinK: 'このリンクの管理', signinT: 'iCloud でサインイン',
    signinWhy: 'このリンクを作った iCloud アカウントでサインインすると、ここで共有を停止できます。',
    signinGo: 'Apple のサインインへ',
    cancel: 'キャンセル',
    ownerK: 'iCloud でサインイン中', ownerT: 'このリンクの作成者です',
    ownerWhy: 'TripEZGo を使っていなくても、ここで共有を停止できます。',
    stop: '共有を停止', signout: 'サインアウト',
    stopAsk: 'この旅程の共有を停止しますか？',
    stopWhy: '停止するとこのリンクはすぐに無効になり、誰も開けなくなります。App で共有をもう一度オンにすると、同じリンクが使われます。',
    back: '戻る', stopped: '共有を停止しました',
    stopFailed: '停止できませんでした。もう一度試してください',
    notOwnerT: 'この iCloud アカウントは作成者ではありません',
    notOwnerWhy: 'リンクの作成者だけが共有を停止できます。作成者のアカウントでサインインし直すか、作成者に App で停止してもらってください。',
    stoppedT: '共有を停止しました',
    stoppedWhy: 'このリンクは無効になりました。もう一度共有するには、TripEZGo でこの旅程の公開リンクをオンにします。同じリンクが使われます。',
    err: '旅程を読み込めませんでした', errWhy: 'リンクが無効になったか、作成者が共有を停止した可能性があります。',
    badT: 'このリンクは不完全です',
    badWhy: '旅程を開けませんでした。リンクをもう一度コピーしてもらってください。URL の最後の部分（# のあと）も必要です。',
    learn: 'TripEZGo について',
    modes: { walking: '徒歩', driving: '車', cycling: '自転車', motorcycle: 'バイク', transit: '公共交通', other: 'その他' },
  },
};

/* 去哪裡拿 App 搬到共用跳轉頁 /open/ 了（2026-09-26）。 */

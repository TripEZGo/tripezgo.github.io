#!/usr/bin/env node
/* 黃金檔的副本（tests/fixtures/golden-v1.json、golden-v1-dayzones.json）跟 App repo 那一份一不一致。
 *
 * 黃金檔由 App repo 的 `PublicLinkGoldenTests` 在每次 `make test` 重算（`docs/public-link/golden-v1.json`）。
 * 這裡的網頁與清理工具拿副本當測試 fixture——App 改了格式而副本沒跟上，網頁測試照樣會綠，
 * 所以要有這一支把兩份對一次。
 *
 * 用法：
 *   node tools/check-golden.mjs [App repo 的黃金檔路徑]   （沒給路徑就 v1、v1-dayzones 兩份都比）
 *   TRIPEZGO_GOLDEN=/path/to/golden-v1.json node tools/check-golden.mjs
 * 沒給路徑就找兄弟目錄 `../tripezgo/docs/public-link/golden-v{1,1-dayzones}.json`。
 * 找不到那一份（CI 上、或 App repo 不在這台機器）就**略過並印出原因**，不算失敗。
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 黃金檔有幾份：v1（一趟一個旅程時區）、v1-dayzones（仍是 `v: 1`，多一個選填的 `trip.dayZones`＝每一天各帶旅程時區，App 1.5.0）。
 *  兩份都留，舊連結仍要讀得懂。 */
export const VERSIONS = ['v1', 'v1-dayzones'];
export const fixturePath = (version = 'v1') => path.join(root, `tests/fixtures/golden-${version}.json`);
export const FIXTURE = fixturePath('v1');
export const defaultAppGolden = (version = 'v1') => path.resolve(root, `../tripezgo/docs/public-link/golden-${version}.json`);
export const DEFAULT_APP_GOLDEN = defaultAppGolden('v1');

/** → `{ status: 'same' | 'different' | 'skipped', reason }`。`version` 預設 v1；環境變數 `TRIPEZGO_GOLDEN`
 *  （v1）與 `TRIPEZGO_GOLDEN_V1_DAYZONES`（v1-dayzones）可以指到別的路徑。 */
export function compareGolden(appPath, version = 'v1') {
  const FIXTURE = fixturePath(version);
  const envPath = version === 'v1' ? process.env.TRIPEZGO_GOLDEN : process.env['TRIPEZGO_GOLDEN_' + version.toUpperCase().replaceAll('-', '_')];
  const source = appPath || envPath || defaultAppGolden(version);
  if (!existsSync(source)) {
    return { status: 'skipped', reason: '找不到 App repo 的黃金檔：' + source };
  }
  const app = readFileSync(source, 'utf8');
  const copy = readFileSync(FIXTURE, 'utf8');
  if (app === copy) return { status: 'same', reason: source };
  return {
    status: 'different',
    reason: '副本跟 App repo 那一份不一樣——把 ' + source + ' 複製到 ' + FIXTURE + ' 再跑一次測試',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  /* 給了路徑就只比那一份（版本從檔名讀：golden-v1-dayzones.json → v1-dayzones）；沒給就兩版都比。 */
  const given = process.argv[2];
  const versions = given ? [[...VERSIONS].reverse().find((v) => path.basename(given).includes('-' + v)) || 'v1'] : VERSIONS;
  let failed = false;
  for (const version of versions) {
    const result = compareGolden(given, version);
    if (result.status === 'skipped') console.log(version + ' 略過：' + result.reason);
    else if (result.status === 'same') console.log(version + ' 一致：' + result.reason);
    else {
      console.error(version + ' 不一致：' + result.reason);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

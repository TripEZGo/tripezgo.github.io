/* 格式 v2（App 1.5.0，場景 E2）：每一天各帶旅程時區。
 * 黃金檔 tests/fixtures/golden-v2.json 由 App 的 `PublicLinkGoldenV2Tests` 產出：第 1、2 天台北、第 3 天東京。
 * v1 的舊連結照舊讀（golden-v1，見 core.test.mjs／zone.test.mjs）。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  base64Decode, isSigned, openSealed, parseFragment, phoneNote, phoneShifts, plainText, sealedFromRecord,
  validateCopy, zoneOfDay, FORMAT_VERSIONS,
} from '../../trip/core.js';
import { compareGolden } from '../../tools/check-golden.mjs';
import { verdict } from '../../tools/cleanup/cleanup.mjs';

const golden = JSON.parse(readFileSync(new URL('../fixtures/golden-v2.json', import.meta.url), 'utf8'));
const v1 = JSON.parse(readFileSync(new URL('../fixtures/golden-v1.json', import.meta.url), 'utf8'));
const signingKey = base64Decode(golden.signingKey);
const c = golden.cases.find((x) => x.name === 'two-zones');
const recordOf = (x) => ({
  recordName: x.recordName,
  recordType: 'TripEZGoPublicItinerary',
  fields: {
    formatVersion: { value: x.record.formatVersion, type: 'INT64' },
    payload: { value: x.record.payload, type: 'BYTES' },
    signature: { value: x.record.signature, type: 'BYTES' },
  },
});
const day = (y, m, d) => ({ y, m, d });

test('黃金檔 v2 副本跟 App repo 那一份一致（App repo 不在就略過）', (t) => {
  const result = compareGolden(undefined, 'v2');
  if (result.status === 'skipped') {
    t.skip(result.reason);
    return;
  }
  assert.equal(result.status, 'same', result.reason);
});

test('認得的格式版本是 1 與 2', () => {
  assert.deepEqual(FORMAT_VERSIONS, [1, 2]);
  assert.equal(c.record.formatVersion, 2);
  assert.equal(c.plaintext.v, 2);
});

test('v2：解得開、驗得過簽章，公開版本跟明文同一份', async () => {
  const link = parseFragment(new URL(c.url).hash);
  const sealed = sealedFromRecord(recordOf(c));
  assert.equal(await isSigned(sealed, c.recordName, [signingKey]), true);
  const copy = await openSealed(sealed, link.key);
  assert.deepEqual(copy, validateCopy(c.plaintext));
});

for (const lang of ['zh', 'en', 'ja']) {
  test(`v2：純文字（${lang}）與 App 逐字相同`, async () => {
    const link = parseFragment(new URL(c.url).hash);
    const copy = await openSealed(sealedFromRecord(recordOf(c)), link.key);
    assert.equal(plainText(copy, lang), c.plainText[lang]);
  });
}

test('v2：每日清理認得格式版本 2，不把新 App 寫的每一筆當成不認得的格式刪掉', async () => {
  assert.equal(await verdict(recordOf(c), [signingKey]), null);
});

test('E2：dayZones 讀進來，tz 是第 1 天，place 是不重複的地點串', () => {
  const copy = validateCopy(c.plaintext);
  assert.deepEqual(copy.dayZones, ['Asia/Taipei', 'Asia/Taipei', 'Asia/Tokyo']);
  assert.equal(copy.tz, 'Asia/Taipei');
  assert.equal(copy.place, '台北、東京');
});

test('E2：每一天用自己的時區——東京那天用東京，台北那天用台北', () => {
  const copy = validateCopy(c.plaintext);
  assert.equal(zoneOfDay(copy, 1), 'Asia/Taipei');
  assert.equal(zoneOfDay(copy, 2), 'Asia/Taipei');
  assert.equal(zoneOfDay(copy, 3), 'Asia/Tokyo');
  assert.equal(zoneOfDay(copy, 4), 'Asia/Tokyo', '多問的「旅程隔天」讀最後一天');
  assert.equal(zoneOfDay(copy, 0), 'Asia/Taipei');
});

test('E2：台北的瀏覽器：台北那兩天偏移相同不畫，東京那天差 −60 分', () => {
  const copy = validateCopy(c.plaintext);
  const dates = [day(2026, 11, 20), day(2026, 11, 21), day(2026, 11, 22), day(2026, 11, 23)];
  const phone = dates.map((d, i) => phoneShifts(zoneOfDay(copy, i + 1), 'Asia/Taipei', d));
  assert.equal(phone[0], null);
  assert.equal(phone[1], null);
  assert.deepEqual(phone[2], [{ fromMinute: 0, deltaMinutes: -60 }]);
  /* 說明讀有差的那一天（東京），不是第 1 天 */
  const note = phoneNote(phone, { lo: 0, hi: 24 * 60 });
  assert.equal(note.day, 2);
  assert.equal(zoneOfDay(copy, note.day + 1), 'Asia/Tokyo');
  /* 時間表畫過 24:00：第 2 天（台北）欄尾讀的是隔天（東京）的時差，說明也寫東京，不寫第 2 天的台北 */
  const past = phoneNote(phone, { lo: 0, hi: 26 * 60 });
  assert.equal(zoneOfDay(copy, past.day + 1), 'Asia/Tokyo');
});

test('E2：沒有 dayZones（v1）整趟用 tz', () => {
  const old = validateCopy(structuredClone(v1.cases[0].plaintext));
  assert.equal(old.dayZones, null);
  for (const n of [1, 2, 3, 9]) assert.equal(zoneOfDay(old, n), 'Asia/Tokyo');
  assert.equal(zoneOfDay(validateCopy(v1.cases[1].plaintext), 1), null, '舊連結沒有旅程時區：不畫副時刻');
});

test('E2：dayZones 長度對不上天數、或有不認得的時區：整格丟掉退回 tz，其他照讀', () => {
  for (const zones of [['Asia/Tokyo'], ['Asia/Taipei', 'Mars/Olympus', 'Asia/Tokyo'], []]) {
    const odd = structuredClone(c.plaintext);
    odd.trip.dayZones = zones;
    const copy = validateCopy(odd);
    assert.ok(copy);
    assert.equal(copy.dayZones, null);
    assert.equal(zoneOfDay(copy, 3), 'Asia/Taipei');
  }
});

test('E2：dayZones 型別不對：整份讀不懂（同 App 的 JSONDecoder）', () => {
  for (const bad of ['Asia/Tokyo', [1, 2, 3], { 0: 'Asia/Tokyo' }]) {
    const odd = structuredClone(c.plaintext);
    odd.trip.dayZones = bad;
    assert.equal(validateCopy(odd), null);
  }
});

test('版本 3 還是不認得', () => {
  const odd = structuredClone(c.plaintext);
  odd.v = 3;
  assert.equal(validateCopy(odd), null);
});

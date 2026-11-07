/* 公開版本的行程帶選填的 `items[].placeID`（Apple 地圖的 Place ID，App 1.8.0，仍是 `v: 1`）。
 * 黃金檔 tests/fixtures/golden-v1-placeid.json 由 App 的 `PublicLinkGoldenV1PlaceIDTests` 產出。
 * 沒有這一格的舊連結照舊讀；Place ID 只用來組 Apple 地圖的網址。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareGolden } from '../../tools/check-golden.mjs';
import { appleMapsUrl, base64Decode, isSigned, openSealed, parseFragment, sealedFromRecord, validateCopy } from '../../trip/core.js';

const golden = JSON.parse(readFileSync(new URL('../fixtures/golden-v1-placeid.json', import.meta.url), 'utf8'));
const c = golden.cases.find((x) => x.name === 'place-id');
const recordOf = (x) => ({
  recordName: x.recordName,
  recordType: 'TripEZGoPublicItinerary',
  fields: {
    formatVersion: { value: x.record.formatVersion, type: 'INT64' },
    payload: { value: x.record.payload, type: 'BYTES' },
    signature: { value: x.record.signature, type: 'BYTES' },
  },
});

test('黃金檔 v1-placeid 副本跟 App repo 那一份一致（App repo 不在就略過）', (t) => {
  const result = compareGolden(undefined, 'v1-placeid');
  if (result.status === 'skipped') {
    t.skip(result.reason);
    return;
  }
  assert.equal(result.status, 'same', result.reason);
});

test('v1＋placeID：解得開、驗得過簽章，第一則帶 ID、第二則沒有', async () => {
  const link = parseFragment(new URL(c.url).hash);
  const sealed = sealedFromRecord(recordOf(c));
  assert.equal(c.record.formatVersion, 1);
  assert.equal(await isSigned(sealed, c.recordName, [base64Decode(golden.signingKey)]), true);
  const copy = await openSealed(sealed, link.key);
  assert.deepEqual(copy, validateCopy(c.plaintext));
  assert.equal(copy.items[0].placeID, 'I521E602783BA9605');
  assert.equal(copy.items[1].placeID, null);
});

test('舊黃金檔（沒有 placeID）讀成 null，網址是 null', () => {
  const v1 = JSON.parse(readFileSync(new URL('../fixtures/golden-v1.json', import.meta.url), 'utf8'));
  for (const item of validateCopy(v1.cases[0].plaintext).items) {
    assert.equal(item.placeID, null);
    assert.equal(appleMapsUrl(item), null);
  }
});

test('appleMapsUrl：有 ID 開到那一家店（place-id），有座標一併帶 coordinate', () => {
  const copy = validateCopy(c.plaintext);
  assert.equal(
    appleMapsUrl(copy.items[0]),
    'https://maps.apple.com/place?place-id=I521E602783BA9605&coordinate=34.9949,135.785'
  );
  assert.equal(appleMapsUrl({ placeID: 'I1', geo: null }), 'https://maps.apple.com/place?place-id=I1');
  assert.equal(appleMapsUrl(copy.items[1]), null);
});

test('placeID 型別不對：整份讀不懂（同 App 的 JSONDecoder）', () => {
  const bad = structuredClone(c.plaintext);
  bad.items[0].placeID = 5;
  assert.equal(validateCopy(bad), null);
});

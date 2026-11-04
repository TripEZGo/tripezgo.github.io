// App 功能示範的殼（tools/app-demos-shell.html）裡的純邏輯：預載哪兩格、自動換頁的計時。
// 殼是單一 HTML；純邏輯那一段用 /*TZ-PURE*/ … /*END-PURE*/ 圈起來，這裡抽出來直接跑（沒有 DOM）。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tools/app-demos-shell.html'), 'utf8');
const m = html.match(/\/\*TZ-PURE\*\/([\s\S]*?)\/\*END-PURE\*\//);
assert.ok(m, 'shell has a TZ-PURE block');
const { AUTO_MS, neighbourIdx, makeAutoAdvance } = new Function(`${m[1]}; return { AUTO_MS, neighbourIdx, makeAutoAdvance };`)();

// 假時鐘：只有 set／clear，tick(ms) 往前走
function clock() {
  let now = 0, id = 0; const q = new Map();
  return {
    set(fn, ms) { q.set(++id, { at: now + ms, fn }); return id; },
    clear(i) { q.delete(i); },
    tick(ms) { const end = now + ms; for (;;) { const next = [...q].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; now = next[1].at; q.delete(next[0]); next[1].fn(); } now = end; },
    pending() { return q.size; },
  };
}
function make(over = {}) {
  const c = clock(), log = { fire: 0, ring: [] };
  const a = makeAutoAdvance({ ms: AUTO_MS, reduced: false, canRun: () => true, fire: () => log.fire++, ring: (on) => log.ring.push(on), set: c.set, clear: c.clear, ...over });
  return { a, c, log };
}

test('預載：鄰格是下一格與上一格，最後一格的下一格是第 1 格', () => {
  assert.deepEqual(neighbourIdx(5, 15).sort((x, y) => x - y), [4, 6]);
  assert.deepEqual(neighbourIdx(14, 15).sort((x, y) => x - y), [0, 13]);
  assert.deepEqual(neighbourIdx(0, 15).sort((x, y) => x - y), [1, 14]);
  assert.deepEqual(neighbourIdx(0, 2), [1]);
  assert.deepEqual(neighbourIdx(0, 1), []);
});

test('計時到了會換下一格', () => {
  const { a, c, log } = make();
  a.restart();
  c.tick(AUTO_MS - 1); assert.equal(log.fire, 0);
  c.tick(1); assert.equal(log.fire, 1);
});

test('最後一步之後回到第 1 步：到了就 fire，由殼的 onNext 決定回第 1 格；一步一步連續跑', () => {
  const { a, c, log } = make({ fire: () => { log.fire++; a.restart(); } });
  a.restart();
  c.tick(AUTO_MS * 3); assert.equal(log.fire, 3);
});

test('手動換頁會重設計時（restart 把剩下的時間歸零）', () => {
  const { a, c, log } = make();
  a.restart();
  c.tick(AUTO_MS - 100);
  a.restart();
  c.tick(AUTO_MS - 100); assert.equal(log.fire, 0);
  c.tick(100); assert.equal(log.fire, 1);
});

test('pause（按住、翻走、VoiceOver 焦點）時計時停止，放開從 0 重來', () => {
  const { a, c, log } = make();
  a.restart();
  c.tick(2000);
  a.hold('touch');
  assert.equal(c.pending(), 0);
  c.tick(AUTO_MS * 5); assert.equal(log.fire, 0);
  a.release('touch');
  c.tick(AUTO_MS - 1); assert.equal(log.fire, 0);
  c.tick(1); assert.equal(log.fire, 1);
});

test('兩個理由同時按住：只放一個還是不跑', () => {
  const { a, c, log } = make();
  a.hold('touch'); a.hold('focus');
  a.release('touch'); c.tick(AUTO_MS * 2); assert.equal(log.fire, 0);
  a.release('focus'); c.tick(AUTO_MS); assert.equal(log.fire, 1);
});

test('減少動態：不啟動計時、不畫圈', () => {
  const { a, c, log } = make({ reduced: true });
  a.restart();
  assert.equal(c.pending(), 0); c.tick(AUTO_MS * 3); assert.equal(log.fire, 0);
  assert.ok(!log.ring.includes(true));
});

test('還在換頁（canRun 為 false）：不啟動計時，圈不畫', () => {
  const { a, c, log } = make({ canRun: () => false });
  a.restart(); c.tick(AUTO_MS * 2);
  assert.equal(log.fire, 0); assert.ok(!log.ring.includes(true));
});

test('倒數圈：開始畫、畫滿換頁前收掉；停掉時也收掉', () => {
  const { a, c, log } = make();
  a.restart(); assert.equal(log.ring.at(-1), true);
  c.tick(AUTO_MS); assert.equal(log.ring.at(-1), false);
  a.restart(); a.hold('ext'); assert.equal(log.ring.at(-1), false);
});

test('3 秒只寫在殼的一個地方', () => {
  assert.equal(AUTO_MS, 3000);
  assert.equal((html.match(/var AUTO_MS = 3000/g) || []).length, 1);
});

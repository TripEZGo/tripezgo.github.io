/* 把 trip/、open/、join/ 的 CSP 裡「行內 <script> 的雜湊」蓋成跟頁面現在的內容一致：
 *
 *   node tools/stamp-csp.mjs        # 冪等；改了這三頁任何一段行內 script 之後要跑一次
 *
 * ## 為什麼
 *
 * 這三頁用 `<meta http-equiv="Content-Security-Policy">`（GitHub Pages 不能設回應標頭）。
 * script-src 不給 'unsafe-inline'，行內 script 只能靠 `'sha256-…'` 放行——那串雜湊是內容的指紋，
 * 改一個字就對不上、頁面直接不跑。所以雜湊不手寫：這支從頁面裡算出來蓋回去，
 * `tests/unit/csp.test.mjs` 守著「CSP 裡的雜湊 = 頁面現在的行內 script」。
 * trip/ 的 import map 是 tools/stamp-trip.mjs 產生的，它蓋完會順手呼叫這裡。 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PAGES = ['trip/index.html', 'open/index.html', 'join/index.html'];

const META = /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/;

/** 頁面裡每一段沒有 src 的 <script> 的 `'sha256-…'`（依出現順序）。 */
export function inlineScriptHashes(html) {
  const out = [];
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    out.push("'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'");
  }
  return out;
}

/** 回傳 script-src 的雜湊已經對上的 HTML；沒有 CSP meta 就丟錯。 */
export function stampCsp(html) {
  const m = html.match(META);
  if (!m) throw new Error('找不到 <meta http-equiv="Content-Security-Policy">');
  const hashes = inlineScriptHashes(html);
  const policy = m[2].split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    if (!/^script-src(\s|$)/.test(d)) return d;
    const kept = d.split(/\s+/).filter((t) => !/^'sha256-/.test(t));
    return kept.concat(hashes).join(' ');
  }).join('; ');
  return html.replace(META, (_, a, _b, c) => a + policy + c);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const page of PAGES) {
    const file = new URL('../' + page, import.meta.url);
    const before = readFileSync(file, 'utf8');
    const after = stampCsp(before);
    if (after !== before) writeFileSync(file, after);
    console.log(page + '：' + (after === before ? '已經是最新的' : '已更新'));
  }
}

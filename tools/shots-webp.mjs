/* 官網截圖：screens/ 渲染 → assets/img/shots/v2/<語系>/<名稱>.webp（720×1565）。
 *
 *   node tools/shots-webp.mjs [--lang=zh|en|ja|ko ...] [名稱 ...]
 *
 * 不給名稱就是 tools/screens.mjs 的 SHOTS 全部；不給語系就是四語。每一張：screens.mjs render → sips 縮到 720×1565 → cwebp -q 85。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'tools/screens.mjs'), 'utf8');
const SHOTS = [...src.slice(src.indexOf('export const SHOTS'), src.indexOf('];', src.indexOf('export const SHOTS'))).matchAll(/\['([\w-]+)', '([\w-]+)', '([^']*)'\]/g)].map((m) => [m[1], m[2], m[3]]);
const args = process.argv.slice(2);
const langs = args.filter((a) => a.startsWith('--lang=')).map((a) => a.slice(7));
const names = args.filter((a) => !a.startsWith('--'));
for (const l of langs.length ? langs : ['zh', 'en', 'ja', 'ko']) {
  for (const [file, page, q] of SHOTS.filter(([f]) => !names.length || names.includes(f))) {
    execFileSync('node', [path.join(root, 'tools/screens.mjs'), 'render', page, q, `--lang=${l}`], { cwd: root, stdio: 'ignore' });
    const png = path.join(root, 'screens/out', l, `${page}.png`), tmp = path.join(root, 'screens/out', l, `${file}-720.png`);
    execFileSync('sips', ['-z', '1565', '720', png, '--out', tmp], { stdio: 'ignore' });
    const out = path.join(root, 'assets/img/shots/v2', l, `${file}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', '85', tmp, '-o', out]);
    console.log(l, file);
  }
}

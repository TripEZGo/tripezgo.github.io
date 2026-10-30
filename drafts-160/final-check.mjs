// final.html 引用的圖都在不在：node drafts-160/final-check.mjs
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const html = fs.readFileSync(path.join(dir, 'final.html'), 'utf8');
const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
const missing = srcs.filter((s) => !fs.existsSync(path.join(dir, s)));
console.log(srcs.length, 'images,', missing.length, 'missing', missing.slice(0, 10));

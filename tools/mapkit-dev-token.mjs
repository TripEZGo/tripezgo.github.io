#!/usr/bin/env node
// 本機預覽用的 MapKit JS token：用 App repo cicd/ 裡的私鑰（key TX7KT74NAS），簽一張只認本機 origin、7 天過期的 JWT，
// 寫到 screens/.mapkit-dev-token.js（.gitignore 擋著，**永遠不進 repo**）。正式站照用 trip/config.js 那張（origin 限 tripezgo.com）。
//
//   node tools/mapkit-dev-token.mjs [origin，預設 http://localhost:8770] [私鑰路徑]
//
// 作法參考：用 .p8 私鑰自己簽 ES256 JWT（kid＝Key ID、iss＝Team ID、origin 限定網址）。
import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.argv[2] || 'http://localhost:8770';
const keyPath = process.argv[3] || path.resolve(root, '../tripezgo/cicd/AuthKey_TX7KT74NAS.p8');
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'ES256', kid: 'TX7KT74NAS', typ: 'JWT' });
const body = b64({ iss: 'UGFKKJS5G7', iat: now, exp: now + 7 * 86400, origin });
const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key: readFileSync(keyPath), dsaEncoding: 'ieee-p1363' }).toString('base64url');
writeFileSync(path.join(root, 'screens/.mapkit-dev-token.js'),
  `// 本機預覽用，tools/mapkit-dev-token.mjs 產生，${new Date((now + 7 * 86400) * 1000).toISOString()} 過期。不進 repo。\nexport const DEV = { origin: ${JSON.stringify(origin)}, token: ${JSON.stringify(`${head}.${body}.${sig}`)} };\n`);
console.log('wrote screens/.mapkit-dev-token.js for', origin);

#!/usr/bin/env node
/**
 * 富数据集规模校验（与 TEST_MATURITY / PERFECT 对齐）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rich = fs.readFileSync(
  path.join(__dirname, '../packages/miniapp/src/utils/demo-rich-data.ts'),
  'utf8',
);

const checks = [
  { name: 'pending_accept 待接单', pattern: /for \(let i = 0; i < 10; i\+\+\) push\(i, i, 'pending_accept'/, min: 1 },
  { name: '老人 buildRichElders', pattern: /for \(let i = 0; i < 8; i\+\+\)/, min: 1 },
  { name: 'SERVICE_PACKAGES', pattern: /id: 'pkg-/, min: 3 },
  { name: 'SETTLEMENTS', pattern: /id: 'stl-/, min: 3 },
  { name: '演示账号 multi1', pattern: /multi1@test\.nuanban\.dev/, min: 1 },
  { name: 'ORG_SCHOOL_PARTNERS', pattern: /ORG_SCHOOL_PARTNERS/, min: 1 },
];

let errors = 0;
for (const c of checks) {
  const n = (rich.match(new RegExp(c.pattern.source || c.pattern, 'g')) || []).length;
  if (n < c.min) {
    console.error(`[data] FAIL ${c.name}: expected >= ${c.min}, got ${n}`);
    errors++;
  } else {
    console.log(`[data] OK   ${c.name}`);
  }
}

if (errors) process.exit(1);
console.log('[data] all checks passed');

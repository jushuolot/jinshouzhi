#!/usr/bin/env node
/**
 * 校验 api/*.ts 中 /nuanban/* 路径在 demo-mock 与 PB hooks 中有对应处理（前缀匹配）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'packages/miniapp/src/api');
const mock = fs.readFileSync(
  path.join(root, 'packages/miniapp/src/utils/demo-mock.ts'),
  'utf8',
);
const hooks = fs.readFileSync(
  path.join(root, 'packages/pocketbase/pb_hooks/nuanban.pb.js'),
  'utf8',
);

function extractPaths(file) {
  const text = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const out = [];
  for (const m of text.matchAll(/url:\s*['`]([^'`]+)['`]/g)) {
    const raw = m[1];
    if (!raw.includes('/nuanban/')) continue;
    const noQuery = raw.split('?')[0];
    const norm = noQuery.replace(/\$\{[^}]+\}/g, '{id}');
    out.push(norm);
  }
  return out;
}

/** 动态段 {id} 归一化后，路径各段均出现在实现中即视为覆盖 */
function covered(text, apiPath) {
  const segments = apiPath
    .replace(/^\/nuanban\//, '')
    .split('/')
    .filter((s) => s && s !== '{id}');
  return segments.length > 0 && segments.every((seg) => text.includes(seg));
}

const paths = new Set();
for (const f of fs.readdirSync(apiDir).filter((x) => x.endsWith('.ts'))) {
  for (const p of extractPaths(f)) paths.add(p);
}

let errors = 0;
for (const p of [...paths].sort()) {
  const inMock = covered(mock, p);
  const inHooks = covered(hooks, p);
  if (!inMock || !inHooks) {
    console.error(`[api] FAIL ${p} (mock=${inMock} hooks=${inHooks})`);
    errors++;
  } else {
    console.log(`[api] OK   ${p}`);
  }
}

if (errors) process.exit(1);
console.log(`[api] ${paths.size} nuanban paths aligned`);

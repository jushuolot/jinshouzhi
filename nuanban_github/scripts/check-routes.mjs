#!/usr/bin/env node
/**
 * 粗校验：pages.json 已注册的 path 对应 .vue 文件存在。
 * 用法：node scripts/check-routes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../packages/miniapp/src');
const pagesJson = JSON.parse(
  fs.readFileSync(path.join(root, 'pages.json'), 'utf8')
);

const paths = [];
for (const p of pagesJson.pages ?? []) paths.push(p.path);
for (const sub of pagesJson.subPackages ?? []) {
  for (const p of sub.pages ?? []) {
    paths.push(`${sub.root}/${p.path}`);
  }
}

let errors = 0;
for (const rel of paths) {
  const vue = path.join(root, `${rel}.vue`);
  if (!fs.existsSync(vue)) {
    console.error(`[routes] missing: ${rel}.vue (registered in pages.json)`);
    errors++;
  }
}

// 提示：主包 common 下未注册的 vue（不含 components）
const commonDir = path.join(root, 'pages/common');
if (fs.existsSync(commonDir)) {
  for (const name of fs.readdirSync(commonDir)) {
    if (!name.endsWith('.vue')) continue;
    const stem = `pages/common/${name.replace(/\.vue$/, '')}`;
    if (!paths.includes(stem)) {
      console.warn(`[routes] warn: ${stem}.vue exists but not in pages.json`);
    }
  }
}

if (errors) process.exit(1);
console.log(`[routes] OK — ${paths.length} registered paths`);

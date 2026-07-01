#!/usr/bin/env node
/**
 * 按 V2 变体生成 packages/miniapp/src/pages.json
 * 用法: node scripts/prepare-pages-json.mjs user|control|unified
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const variant = (process.argv[2] || 'unified').toLowerCase();
if (!['user', 'control', 'unified'].includes(variant)) {
  console.error('用法: prepare-pages-json.mjs user|control|unified');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'packages/miniapp/src/pages.manifest.json');
const outPath = join(root, 'packages/miniapp/src/pages.json');
const variantOutPath = join(root, `packages/miniapp/src/pages.${variant}.json`);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

/** 仅运营台包含的 main 包页面 */
const CONTROL_ONLY = new Set([
  'pages/common/org-dispatch',
  'pages/common/ops-gate',
  'pages/common/ops-home',
  'pages/common/ops-more',
  'pages/common/ops-sos',
  'pages/common/ops-sms',
  'pages/common/admin-hub',
  'pages/common/fund-admin',
  'pages/common/student-profiles',
  'pages/common/ops-org',
  'pages/common/ops-elder-profiles',
  'pages/common/ops-elder-edit',
  'pages/common/school-coop',
  'pages/common/ops-service-catalog',
  'pages/common/module-map',
  'pages/common/security',
]);

/** 用户端与运营台共享的 main 包页面 */
const SHARED_MAIN = new Set([
  'pages/common/order-chat',
  'pages/common/order-voice-call',
]);

function pathOf(page) {
  return page.path;
}

let pages = [...manifest.pages];
let subPackages = [...(manifest.subPackages || [])];

if (variant === 'user') {
  pages = pages.filter((p) => !CONTROL_ONLY.has(pathOf(p)));
} else if (variant === 'control') {
  const controlPages = pages.filter(
    (p) => CONTROL_ONLY.has(pathOf(p)) || SHARED_MAIN.has(pathOf(p)),
  );
  const gate = controlPages.find((p) => pathOf(p) === 'pages/common/ops-gate');
  const rest = controlPages.filter((p) => pathOf(p) !== 'pages/common/ops-gate');
  pages = gate ? [gate, ...rest] : controlPages;
  subPackages = [];
}

const out = {
  pages,
  subPackages,
  globalStyle: manifest.globalStyle,
};

const json = `${JSON.stringify(out, null, 2)}\n`;
writeFileSync(variantOutPath, json);
// pages.json 由 vite variant-pages-json 插件按 VITE_APP_VARIANT / 端口写入，避免双端 dev 互相覆盖
if (variant === 'unified') {
  writeFileSync(outPath, json);
}
console.log(
  `pages.${variant}.json ← ${variant} (${pages.length} pages, ${subPackages.length} subPackages)`,
);

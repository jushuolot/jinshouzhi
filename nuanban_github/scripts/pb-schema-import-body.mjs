#!/usr/bin/env node
/** 将 pb_schema.json 转为 PocketBase 0.38+ import API 所需格式（保留 fields） */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/pocketbase/pb_schema.json'), 'utf8'),
);
const collections = raw.map((c) => {
  const copy = { ...c };
  // PB 0.38 import 使用 fields，勿转成 schema（否则只剩系统 id 字段）
  if (copy.schema && !copy.fields) {
    copy.fields = copy.schema;
    delete copy.schema;
  }
  // 空库首次 import 时，带 relation 字段名的规则会校验失败
  if (copy.name === 'user_roles' && copy.updateRule === '@request.auth.id = user') {
    copy.updateRule = "@request.auth.id != ''";
  }
  return copy;
});
process.stdout.write(JSON.stringify({ collections, deleteMissing: false }));

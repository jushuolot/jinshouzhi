#!/usr/bin/env node
/** 将 pb_schema.json 转为 PocketBase import API 所需格式（fields → schema） */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/pocketbase/pb_schema.json'), 'utf8'),
);
const collections = raw.map((c) => {
  const copy = { ...c };
  if (copy.fields && !copy.schema) {
    copy.schema = copy.fields;
    delete copy.fields;
  }
  return copy;
});
process.stdout.write(JSON.stringify({ collections, deleteMissing: false }));

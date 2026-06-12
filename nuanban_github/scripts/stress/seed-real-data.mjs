#!/usr/bin/env node
/** 写入万人压测真实数据（分批 POST seed-load-test） */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getApiBase, getHealthBase } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '../..');
const SEED_KEY = process.env.NUANBAN_LOAD_SEED_KEY || 'nuanban_load_seed';
const TOTAL = Number(process.env.LOAD_TOTAL || 10000);
const BATCH = Number(process.env.LOAD_BATCH || 200);
const PHONE_BASE = 13910000000;

async function main() {
  const health = await fetch(`${getHealthBase()}/api/health`, { signal: AbortSignal.timeout(5000) });
  if (!health.ok) {
    console.error('PocketBase 未就绪，请先 ./scripts/dev-test.sh && ./scripts/seed-demo.sh');
    process.exit(2);
  }

  const seedDemo = await fetch(`${getApiBase()}/nuanban/seed-demo?key=nuanban_dev_seed`, {
    method: 'POST',
    signal: AbortSignal.timeout(120000),
  });
  if (!seedDemo.ok) {
    console.warn('seed-demo 跳过或失败，确保服务项目存在');
  }

  const totals = { users: 0, roles: 0, elders: 0, bindings: 0, orders: 0 };
  let offset = 0;
  const started = Date.now();

  while (offset < TOTAL) {
    const size = Math.min(BATCH, TOTAL - offset);
    const url = `${getApiBase()}/nuanban/seed-load-test?key=${SEED_KEY}&offset=${offset}&size=${size}`;
    const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(300000) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      console.error(`batch offset=${offset} failed:`, json.message || res.status);
      process.exit(1);
    }
    for (const k of Object.keys(totals)) {
      totals[k] += json.stats?.[k] || 0;
    }
    console.log(
      `  batch ${offset}–${offset + size - 1} +users=${json.stats?.users || 0} +roles=${json.stats?.roles || 0} +orders=${json.stats?.orders || 0}`,
    );
    offset = json.nextOffset != null ? json.nextOffset : offset + size;
  }

  const statsRes = await fetch(
    `${getApiBase()}/nuanban/platform/load-test/stats?key=${SEED_KEY}`,
    { signal: AbortSignal.timeout(60000) },
  );
  const stats = await statsRes.json();

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalTarget: TOTAL,
    phoneBase: PHONE_BASE,
    phoneEnd: PHONE_BASE + TOTAL - 1,
    batchStats: totals,
    verified: stats,
    elapsedMs: Date.now() - started,
    roleMix: { student: '60%', elder: '20%', family: '20%' },
  };

  const outDir = join(ROOT, 'dev-data/load-test');
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, 'manifest-10k.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n[seed-real-data] 完成');
  console.log(JSON.stringify(manifest, null, 2));
  console.log(`manifest: ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

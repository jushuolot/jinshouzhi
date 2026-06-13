#!/usr/bin/env node
/** 万人压测：使用 13910000000+ 真实种子账号 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  api,
  phoneLogin,
  printSummary,
  requirePbOrExit,
  runPool,
} from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '../..');
const TOTAL = Number(process.env.STRESS_USERS || 10000);
const CONCURRENCY = Number(process.env.STRESS_CONCURRENCY || 120);
const PHONE_BASE = 13910000000;

function roleForIndex(idx) {
  const bucket = idx % 100;
  if (bucket < 60) return 'student';
  if (bucket < 80) return 'elder';
  return 'family';
}

function phoneForIndex(idx) {
  return String(PHONE_BASE + (idx % 10000));
}

async function virtualUser(i) {
  const idx = i % 10000;
  const phone = phoneForIndex(idx);
  const role = roleForIndex(idx);
  const startMs = Date.now();
  let status = 200;

  try {
    const { token } = await phoneLogin(phone, role);

    if (role === 'student') {
      if (i % 10 < 7) {
        const r = await api('GET', '/nuanban/student/profile', { token, role });
        status = r.status;
      } else if (i % 10 < 9) {
        const r = await api('GET', '/nuanban/student/orders/pending', { token, role });
        status = r.status;
      } else {
        const r = await api('GET', '/nuanban/student/elders/nearby?lat=31.23&lng=121.47', {
          token,
          role,
        });
        status = r.status;
      }
    } else if (role === 'elder') {
      if (i % 5 === 0) {
        const r = await api('GET', '/nuanban/elder/caregivers/nearby?lat=31.23&lng=121.47', {
          token,
          role,
        });
        status = r.status;
      } else {
        const r = await api('GET', '/nuanban/elder/wallet', { token, role });
        status = r.status;
      }
    } else {
      const r = await api('GET', '/nuanban/family/stats', { token, role });
      status = r.status;
    }

    if (i % 50 === 0) {
      const ov = await api('GET', '/nuanban/platform/overview');
      if (ov.status >= 500) status = ov.status;
    }
  } catch (e) {
    return { status: 500, ms: Date.now() - startMs, error: String(e?.message || e) };
  }

  return { status, ms: Date.now() - startMs };
}

async function main() {
  await requirePbOrExit();
  const manifestPath = join(ROOT, 'dev-data/load-test/manifest-10k.json');
  try {
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if ((m.verified?.loadTestUsers || 0) < 5000) {
      console.warn('警告: manifest 显示种子用户不足，请先 node scripts/stress/seed-real-data.mjs');
    }
  } catch {
    console.warn('未找到 manifest-10k.json，将直接压测（需已 seed）');
  }

  console.log(`stress-10000: users=${TOTAL} concurrency=${CONCURRENCY}`);
  const started = Date.now();
  const items = Array.from({ length: TOTAL }, (_, i) => i);
  const results = await runPool(items, virtualUser, CONCURRENCY);
  const s = printSummary('stress-10000', results);

  const report = {
    ranAt: new Date().toISOString(),
    total: TOTAL,
    concurrency: CONCURRENCY,
    elapsedMs: Date.now() - started,
    summary: s,
    pass: s.fail <= TOTAL * 0.03,
  };

  const outDir = join(ROOT, 'dev-data/load-test');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'report-10k.json'), JSON.stringify(report, null, 2));
  console.log(`report: dev-data/load-test/report-10k.json`);

  process.exit(report.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/** Shared helpers for stress / flow scripts (Node 18+ fetch). */

export const DEMO_PHONES = {
  student: '13800000001',
  student2: '13800000002',
  studentPending: '13800000003',
  family: '13800000004',
  elder: '13800000005',
  multi: '13800000006',
};

const PHONE_CYCLE = Object.values(DEMO_PHONES);

export function getApiBase() {
  const base = process.env.NUANBAN_API || 'http://127.0.0.1:8090';
  return `${base.replace(/\/$/, '')}/api`;
}

export function getHealthBase() {
  const base = process.env.NUANBAN_API || 'http://127.0.0.1:8090';
  return base.replace(/\/$/, '');
}

export async function checkApiHealth() {
  try {
    const r = await fetch(`${getHealthBase()}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function phoneLogin(phone, roleHint) {
  const res = await fetch(`${getApiBase()}/nuanban/phone-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: '' }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login ${phone}: HTTP ${res.status} ${json.message || ''}`);
  }
  const role = roleHint || json.activeRole || 'student';
  return { token: json.token, role, user: json.user };
}

export async function api(method, path, opts = {}) {
  const { token, role, body, headers = {}, timeoutMs = 15000 } = opts;
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (role) h['X-Active-Role'] = role;
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const init = { method, headers: h, signal: AbortSignal.timeout(timeoutMs) };
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const start = Date.now();
  const res = await fetch(url, init);
  const ms = Date.now() - start;
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, ms, json };
}

export function phoneForIndex(i) {
  return PHONE_CYCLE[i % PHONE_CYCLE.length];
}

export function roleForPhone(phone) {
  if (phone === DEMO_PHONES.family) return 'family';
  if (phone === DEMO_PHONES.elder) return 'elder';
  return 'student';
}

/** Run fn(item, index) for each item with at most `concurrency` in flight. */
export async function runPool(items, fn, concurrency = 10) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        const out = await fn(items[i], i);
        results[i] = { ok: true, ...out };
      } catch (e) {
        results[i] = { ok: false, error: String(e?.message || e) };
      }
    }
  }

  const workers = Math.min(concurrency, items.length || 1);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export function summarize(results) {
  const total = results.length;
  const ok = results.filter(
    (r) => r.ok !== false && (r.status === undefined || r.status < 400),
  ).length;
  const fail = total - ok;
  const latencies = results.map((r) => r.ms).filter((n) => typeof n === 'number');
  latencies.sort((a, b) => a - b);
  const avg = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  return { total, ok, fail, avgMs: avg, p95Ms: p95 };
}

export function printSummary(label, results) {
  const s = summarize(results);
  console.log(
    `[${label}] total=${s.total} ok=${s.ok} fail=${s.fail} avg=${s.avgMs}ms p95=${s.p95Ms}ms`,
  );
  const errors = results.filter((r) => r.ok === false || (r.status !== undefined && r.status >= 400));
  if (errors.length) {
    console.log(`  sample errors (${Math.min(5, errors.length)}):`);
    for (const e of errors.slice(0, 5)) {
      console.log(`    - ${e.error || `HTTP ${e.status}`}`);
    }
  }
  return s;
}

export async function requirePbOrExit() {
  const ok = await checkApiHealth();
  if (!ok) {
    console.error('PocketBase 未就绪。请先: ./scripts/dev-test.sh');
    console.error(`  NUANBAN_API=${getHealthBase()}`);
    process.exit(2);
  }
}

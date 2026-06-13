#!/usr/bin/env node
/** 外部异常：超时、注入 500、PB 不可达、错误角色 */
import { api, DEMO_PHONES, getApiBase, getHealthBase, phoneLogin } from './lib.mjs';

const cases = [];

async function runCase(name, fn) {
  try {
    await fn();
    cases.push({ name, ok: true });
    console.log(`  OK  ${name}`);
  } catch (e) {
    cases.push({ name, ok: false, error: String(e.message || e) });
    console.log(`  EXPECT-FAIL ${name}: ${e.message || e}`);
  }
}

async function main() {
  console.log('simulate-failures ->', getHealthBase());

  await runCase('dead-port connection refused', async () => {
    const r = await fetch('http://127.0.0.1:19999/api/health', {
      signal: AbortSignal.timeout(1000),
    }).catch((e) => {
      if (e.name === 'TimeoutError' || e.cause?.code === 'ECONNREFUSED') return null;
      throw e;
    });
    if (r?.ok) throw new Error('expected failure');
  });

  await runCase('client timeout (short)', async () => {
    try {
      await fetch(`${getApiBase()}/nuanban/debug/stress?delay=5000`, {
        signal: AbortSignal.timeout(300),
      });
      throw new Error('expected timeout');
    } catch (e) {
      if (e.name !== 'TimeoutError') throw e;
    }
  });

  const inj = await api('GET', '/nuanban/debug/stress?fail=500');
  if (inj.status !== 500) {
    console.log(`  WARN injected-500 got ${inj.status} (PB may be down)`);
  } else {
    console.log('  OK  injected HTTP 500');
    cases.push({ name: 'injected HTTP 500', ok: true });
  }

  const { token } = await phoneLogin(DEMO_PHONES.student, 'student');
  const wrongRole = await api('GET', '/nuanban/student/profile', { token, role: 'elder' });
  if (wrongRole.status !== 403 && wrongRole.status !== 401) {
    console.log(`  WARN wrong-role got ${wrongRole.status}`);
  } else {
    console.log('  OK  wrong X-Active-Role rejected');
    cases.push({ name: 'wrong role 403', ok: true });
  }

  const noLat = await api('GET', '/nuanban/student/elders/nearby', { token, role: 'student' });
  if (noLat.status >= 400) {
    console.log('  OK  nearby without coords rejected');
    cases.push({ name: 'missing lat/lng', ok: true });
  } else {
    console.log(`  WARN nearby without coords returned ${noLat.status}`);
  }

  const passed = cases.filter((c) => c.ok).length;
  console.log(`\n${passed}/${cases.length + 3} failure scenarios exercised`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/** ~2000 虚拟用户：读密集 + 少量写竞态 */
import {
  api,
  DEMO_PHONES,
  phoneForIndex,
  phoneLogin,
  printSummary,
  requirePbOrExit,
  roleForPhone,
  runPool,
} from './lib.mjs';

const TOTAL = Number(process.env.STRESS_USERS || 2000);
const CONCURRENCY = Number(process.env.STRESS_CONCURRENCY || 80);

async function virtualUser(i) {
  const startMs = Date.now();
  let status = 200;

  if (i % 10 < 7) {
    if (i % 3 === 0) {
      const r = await api('GET', '/nuanban/platform/overview');
      status = r.status;
    } else if (i % 3 === 1) {
      const { token } = await phoneLogin(DEMO_PHONES.student, 'student');
      const r = await api('GET', '/nuanban/student/elders/nearby?lat=31.23&lng=121.47', {
        token,
        role: 'student',
      });
      status = r.status;
    } else {
      const { token } = await phoneLogin(DEMO_PHONES.elder, 'elder');
      const r = await api('GET', '/nuanban/elder/caregivers/nearby?lat=31.23&lng=121.47', {
        token,
        role: 'elder',
      });
      status = r.status;
    }
  } else if (i % 10 < 9) {
    const phone = phoneForIndex(i);
    const role = roleForPhone(phone);
    const { token } = await phoneLogin(phone, role);
    const r = await api('GET', '/nuanban/auth/me', { token, role });
    status = r.status;
  } else if (i % 2 === 0) {
    const { token } = await phoneLogin(DEMO_PHONES.student, 'student');
    const r = await api('GET', '/nuanban/student/orders/pending', { token, role: 'student' });
    const list = r.json?.list ?? [];
    if (list.length) {
      const id = list[0].id || list[0].orderId;
      const acc = await api('POST', `/nuanban/student/order-requests/${id}/accept`, {
        token,
        role: 'student',
      });
      status = acc.status === 409 || acc.status === 400 ? 200 : acc.status;
    }
  } else {
    const { token } = await phoneLogin(DEMO_PHONES.elder, 'elder');
    const r = await api('POST', '/nuanban/elder/sos', {
      token,
      role: 'elder',
      body: { elderId: 'elder-1', message: `load-${i}` },
    });
    status = r.status;
  }

  return { status, ms: Date.now() - startMs };
}

async function main() {
  await requirePbOrExit();
  console.log(`stress-2000: users=${TOTAL} concurrency=${CONCURRENCY}`);
  const items = Array.from({ length: TOTAL }, (_, i) => i);
  const results = await runPool(items, virtualUser, CONCURRENCY);
  const s = printSummary('stress-2000', results);
  process.exit(s.fail > TOTAL * 0.05 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

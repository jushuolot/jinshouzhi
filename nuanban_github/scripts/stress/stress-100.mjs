#!/usr/bin/env node
/** ~100 虚拟用户并发：登录 + 读列表 + 少量写 */
import {
  api,
  phoneForIndex,
  phoneLogin,
  printSummary,
  requirePbOrExit,
  roleForPhone,
  runPool,
} from './lib.mjs';

const TOTAL = Number(process.env.STRESS_USERS || 100);
const CONCURRENCY = Number(process.env.STRESS_CONCURRENCY || 30);

async function virtualUser(i) {
  const phone = phoneForIndex(i);
  const role = roleForPhone(phone);
  const { token } = await phoneLogin(phone, role);

  const ops = [];
  if (role === 'student') {
    ops.push(await api('GET', '/nuanban/student/profile', { token, role }));
    ops.push(await api('GET', '/nuanban/student/orders/pending', { token, role }));
    if (i % 4 === 0) {
      ops.push(
        await api('GET', '/nuanban/student/elders/nearby?lat=31.23&lng=121.47', { token, role }),
      );
    }
    if (i % 10 === 0) {
      ops.push(await api('GET', '/nuanban/student/withdrawal', { token, role }));
    }
  } else if (role === 'family') {
    ops.push(await api('GET', '/nuanban/family/stats', { token, role }));
    ops.push(await api('GET', '/nuanban/family/wallet', { token, role }));
  } else if (role === 'elder') {
    ops.push(
      await api('GET', '/nuanban/elder/caregivers/nearby?lat=31.23&lng=121.47', { token, role }),
    );
    if (i % 20 === 0) {
      ops.push(
        await api('POST', '/nuanban/elder/sos', {
          token,
          role,
          body: { elderId: 'elder-1', message: `stress-${i}` },
        }),
      );
    }
  }

  if (i % 7 === 0) {
    ops.push(await api('GET', '/nuanban/platform/overview'));
  }

  const worst = ops.reduce(
    (acc, r) => (r.status > (acc?.status || 0) ? r : acc),
    ops[0] || { status: 200, ms: 0 },
  );
  return { status: worst?.status ?? 500, ms: ops.reduce((s, r) => s + (r.ms || 0), 0) };
}

async function main() {
  await requirePbOrExit();
  console.log(`stress-100: users=${TOTAL} concurrency=${CONCURRENCY}`);
  const items = Array.from({ length: TOTAL }, (_, i) => i);
  const results = await runPool(items, virtualUser, CONCURRENCY);
  const s = printSummary('stress-100', results);
  process.exit(s.fail > TOTAL * 0.02 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

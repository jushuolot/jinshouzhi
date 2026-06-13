#!/usr/bin/env node
/** 学生完整流程：登录 → 资料 → 待接单 → 接单 → 活跃单 → 提现概览 */
import { api, DEMO_PHONES, phoneLogin, printSummary, requirePbOrExit } from './lib.mjs';

async function main() {
  await requirePbOrExit();
  const steps = [];

  const { token, role } = await phoneLogin(DEMO_PHONES.student, 'student');
  steps.push({ step: 'login', status: 200, ms: 0 });

  let r = await api('GET', '/nuanban/student/profile', { token, role });
  steps.push({ ...r, step: 'profile' });
  if (!r.ok) throw new Error('profile failed');

  r = await api('GET', '/nuanban/student/orders/pending', { token, role });
  steps.push({ ...r, step: 'pending' });
  const pendingOrders = r.ok ? r.json?.list ?? [] : [];

  r = await api('GET', '/nuanban/student/elders/nearby?lat=31.23&lng=121.47', { token, role });
  steps.push({ ...r, step: 'elders-nearby' });

  if (pendingOrders.length) {
    const acceptId = pendingOrders[0].id || pendingOrders[0].orderId;
    if (acceptId) {
      r = await api('POST', `/nuanban/student/order-requests/${acceptId}/accept`, { token, role });
      steps.push({ ...r, step: 'accept' });
    }
  }

  r = await api('GET', '/nuanban/student/orders/active', { token, role });
  steps.push({ ...r, step: 'active' });

  r = await api('GET', '/nuanban/student/income', { token, role });
  steps.push({ ...r, step: 'income' });

  r = await api('GET', '/nuanban/student/withdrawal', { token, role });
  steps.push({ ...r, step: 'withdrawal' });

  printSummary('flow-student', steps);
  const failed = steps.filter((s) => s.status >= 400);
  if (failed.length) process.exit(1);
  console.log('flow-role-student OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/** 运营完整流程：KPI → 学生审核队列 → 资金 → 派单池 → SOS */
import { api, printSummary, requirePbOrExit } from './lib.mjs';

async function main() {
  await requirePbOrExit();
  const steps = [];

  let r = await api('GET', '/nuanban/platform/overview');
  steps.push({ ...r, step: 'overview' });

  r = await api('GET', '/nuanban/platform/students');
  steps.push({ ...r, step: 'students' });

  r = await api('GET', '/nuanban/platform/funds/overview');
  steps.push({ ...r, step: 'funds' });

  r = await api('GET', '/nuanban/platform/funds/withdrawals?status=pending');
  steps.push({ ...r, step: 'withdrawals' });

  r = await api('GET', '/nuanban/org/orders/dispatchable');
  steps.push({ ...r, step: 'dispatchable' });

  r = await api('GET', '/nuanban/platform/sos/active');
  steps.push({ ...r, step: 'sos' });

  r = await api('GET', '/nuanban/platform/activity');
  steps.push({ ...r, step: 'activity' });

  printSummary('flow-ops', steps);
  const failed = steps.filter((s) => s.status >= 400);
  if (failed.length) process.exit(1);
  console.log('flow-role-ops OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

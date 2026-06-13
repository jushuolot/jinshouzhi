#!/usr/bin/env node
/** 家属完整流程：登录 → 资料 → 钱包 → 统计 → 待支付代付（若有）→ SOS 列表 */
import { api, DEMO_PHONES, phoneLogin, printSummary, requirePbOrExit } from './lib.mjs';

async function main() {
  await requirePbOrExit();
  const steps = [];

  const { token, role } = await phoneLogin(DEMO_PHONES.family, 'family');
  steps.push({ step: 'login', status: 200 });

  let r = await api('GET', '/nuanban/family/profile', { token, role });
  steps.push({ ...r, step: 'profile' });

  r = await api('GET', '/nuanban/family/wallet', { token, role });
  steps.push({ ...r, step: 'wallet' });

  r = await api('GET', '/nuanban/family/stats', { token, role });
  steps.push({ ...r, step: 'stats' });

  r = await api('GET', '/nuanban/family/sos/active', { token, role });
  steps.push({ ...r, step: 'sos' });

  r = await api('GET', '/nuanban/platform/activity');
  steps.push({ ...r, step: 'activity' });

  printSummary('flow-family', steps);
  const failed = steps.filter((s) => s.status >= 400);
  if (failed.length) process.exit(1);
  console.log('flow-role-family OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

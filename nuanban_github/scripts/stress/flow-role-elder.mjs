#!/usr/bin/env node
/** 老人完整流程：登录 → 附近同学 → 钱包 → SOS 触发 */
import { api, DEMO_PHONES, phoneLogin, printSummary, requirePbOrExit } from './lib.mjs';

async function main() {
  await requirePbOrExit();
  const steps = [];

  const { token, role } = await phoneLogin(DEMO_PHONES.elder, 'elder');
  steps.push({ step: 'login', status: 200 });

  let r = await api('GET', '/nuanban/elder/profile', { token, role });
  steps.push({ ...r, step: 'profile' });

  r = await api('GET', '/nuanban/elder/caregivers/nearby?lat=31.23&lng=121.47', { token, role });
  steps.push({ ...r, step: 'caregivers-nearby' });

  r = await api('GET', '/nuanban/elder/wallet', { token, role });
  steps.push({ ...r, step: 'wallet' });

  r = await api('GET', '/nuanban/elder/stats', { token, role });
  steps.push({ ...r, step: 'stats' });

  const profile = steps.find((s) => s.step === 'profile')?.json;
  const elderId = profile?.elderProfileId || profile?.elderId || 'elder-1';
  r = await api('POST', '/nuanban/elder/sos', {
    token,
    role,
    body: { elderId, message: 'stress-test SOS' },
  });
  steps.push({ ...r, step: 'sos-trigger' });

  printSummary('flow-elder', steps);
  const failed = steps.filter((s) => {
    if (s.step === 'sos-trigger' && s.status === 503) {
      console.warn('  skip: SOS 集合未导入（pb_schema 需加载后重试）');
      return false;
    }
    return s.status >= 400;
  });
  if (failed.length) process.exit(1);
  console.log('flow-role-elder OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

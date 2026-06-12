#!/usr/bin/env node
/** 万人全流程：种子真实数据 → 校验 → 压测 → 报告 */
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '../..');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: false });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function main() {
  console.log('=== 1/3 写入万人真实数据 ===');
  await run('node', ['scripts/stress/seed-real-data.mjs']);

  console.log('\n=== 2/3 四角色冒烟 ===');
  await run('./scripts/run-stress.sh', ['smoke']);

  console.log('\n=== 3/3 万人并发压测 ===');
  await run('node', ['scripts/stress/stress-10000.mjs']);

  console.log('\n[run-10000-full] 全部完成，见 dev-data/load-test/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * 种子进化 — 增量迁移 v2→v12，全球控制塔代数追踪
 */
import { PLATFORM_VERSION } from './lot-control-tower.js';

export { PLATFORM_VERSION };

export const SEED_MILESTONES = [
  { meta: 'network_v2_seeded', gen: 2, labelZh: 'v2 网络裂变' },
  { meta: 'domains_v3_seeded', gen: 3, labelZh: 'v3 多域 LO' },
  { meta: 'domains_v4_seeded', gen: 4, labelZh: 'v4 干线域' },
  { meta: 'warehouse_v5_seeded', gen: 5, labelZh: 'v5 仓内设备' },
  { meta: 'evolve_v6_seeded', gen: 6, labelZh: 'v6 跨域链接' },
  { meta: 'tender_v7_seeded', gen: 7, labelZh: 'v7 招标链' },
  { meta: 'docs_v8_seeded', gen: 8, labelZh: 'v8 单据种子' },
  { meta: 'eco_v9_seeded', gen: 9, labelZh: 'v9 生态链' },
  { meta: 'twin_v10_seeded', gen: 10, labelZh: 'v10 数字孪生' },
  { meta: 'intake_v11_seeded', gen: 11, labelZh: 'v11 货主下单' },
  { meta: 'global_v12_seeded', gen: 12, labelZh: 'v12 全球控制塔' },
];

export async function seedGeneration(chain) {
  const v = await chain.local.getMeta('seed_generation');
  if (v) return parseInt(v, 10) || 1;
  return chain.getFissionGeneration();
}

export async function reportSeedStatus(chain) {
  const rows = [];
  for (const m of SEED_MILESTONES) {
    const ts = await chain.local.getMeta(m.meta);
    rows.push({ ...m, applied: !!ts, at: ts || null });
  }
  const generation = await seedGeneration(chain);
  const remote = [];
  if (chain.seed?._intakeBundle) remote.push('intake-v11');
  if (chain.seed?._globalBundle) remote.push('global-v12');
  return { version: PLATFORM_VERSION, generation, milestones: rows, remoteBundle: remote.join('+') || null };
}

/** 执行全部待应用种子迁移 */
export async function runSeedEvolution(chain) {
  const before = {};
  for (const m of SEED_MILESTONES) {
    before[m.meta] = await chain.local.getMeta(m.meta);
  }

  await chain._ensureNetworkSeed();
  await chain._ensureDomainsSeed();
  await chain._ensureDomainsV4Seed();
  await chain._ensureWarehouseV5Seed();
  await chain._ensureEvolveV6Seed();
  await chain._ensureTenderV7Seed();
  await chain._ensureDocsV8Seed();
  await chain._ensureEcoV9Seed();
  await chain._ensureTwinV10Seed();
  await chain._ensureIntakeV11Seed();
  await chain._ensureGlobalV12Seed();

  if (chain.seed?.isAvailable && (await chain.seed.isAvailable())) {
    await chain.seed.init();
    await chain._mergeRemoteIntakeBundle();
    await chain._mergeRemoteGlobalBundle();
  }

  const activated = [];
  for (const m of SEED_MILESTONES) {
    const after = await chain.local.getMeta(m.meta);
    if (!before[m.meta] && after) activated.push(m.labelZh);
  }

  const prev = await seedGeneration(chain);
  const generation = activated.length ? Math.max(prev + 1, 12) : prev;
  await chain.setFissionGeneration(generation);
  await chain.local.setMeta('seed_generation', String(generation));
  await chain.local.setMeta('seed_evolved_at', new Date().toISOString());
  await chain.local.setMeta('platform_version', PLATFORM_VERSION);

  return { version: PLATFORM_VERSION, generation, activated, status: await reportSeedStatus(chain) };
}

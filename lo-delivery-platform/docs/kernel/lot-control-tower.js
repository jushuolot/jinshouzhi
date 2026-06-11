/**
 * 全球控制塔 — 链订单 KPI · 风险 · SLA · 碳足迹 · ATP
 */
import { projectChainOrder } from './lot-chain-order.js';
import { EVENT_TYPES } from './lot-nucleus.js';

const CARBON_KG = {
  procurement: 12,
  production: 8,
  warehouse_internal: 3,
  sales: 2,
  linehaul: 45,
  express: 6,
  ocean: 18,
  customs: 1,
  cold_chain: 25,
  rail: 9,
};

export const PLATFORM_VERSION = '12.1.0';

export async function computeControlTower(chain, { viewerEnterpriseId } = {}) {
  const orders = await chain.listChainOrders(viewerEnterpriseId ? { viewerEnterpriseId } : {});
  const views = await Promise.all(orders.map(async (co) => ({
    co,
    view: await projectChainOrder(chain, co),
  })));

  let exceptions = 0;
  let inTransit = 0;
  let delivered = 0;
  let draft = 0;
  let carbonKg = 0;
  let eventCount = 0;
  const risks = [];

  for (const { co, view } of views) {
    if (co.status === 'draft') draft += 1;
    if (co.status === 'in_transit') inTransit += 1;
    if (co.status === 'delivered' || co.status === 'settling' || co.status === 'settled') delivered += 1;
    if (view.status === 'exception') {
      exceptions += 1;
      risks.push({ chainOrderId: co.chainOrderId, title: co.title, level: 'high', reason: '履约异常' });
    }
    for (const leg of view.legs || []) {
      const events = await chain.getEvents(leg.loId);
      eventCount += events.length;
      const factor = CARBON_KG[leg.legType] || 5;
      carbonKg += events.filter((e) => e.type === EVENT_TYPES.FACT).length * factor;
      for (const ex of events.filter((e) => e.type === EVENT_TYPES.EXCEPTION)) {
        const resolved = events.some(
          (e) => e.seq > ex.seq && e.type === EVENT_TYPES.FACT && e.payload?.resolves === ex.code
        );
        if (!resolved) {
          risks.push({
            chainOrderId: co.chainOrderId,
            loId: leg.loId,
            title: co.title,
            level: 'medium',
            reason: ex.payload?.label || ex.code,
          });
        }
      }
    }
    if (co.laneType === 'global_sea' && view.progress < 80 && view.progress > 20) {
      risks.push({ chainOrderId: co.chainOrderId, title: co.title, level: 'low', reason: '跨境海运在途' });
    }
  }

  const total = views.length || 1;
  const otif = Math.round(((delivered + inTransit * 0.6) / total) * 100);
  const atpUnits = orders
    .filter((o) => o.status === 'draft' || o.status === 'active')
    .reduce((s, o) => s + (o.orderLines || []).reduce((a, l) => a + (l.qty || 0), 0), 0);

  const gen = parseInt((await chain.local.getMeta('seed_generation')) || '1', 10) || 1;

  return {
    version: PLATFORM_VERSION,
    seedGeneration: gen,
    orders: { total: views.length, draft, inTransit, delivered, exceptions },
    otif,
    atpUnits,
    carbonKg: Math.round(carbonKg),
    eventCount,
    risks: risks.slice(0, 8),
    policies: {
      threeWayMatch: true,
      autoEvolution: true,
      hashChain: true,
      multimodal: true,
      coldChain: views.some((v) => v.co.laneType === 'cold_chain'),
      globalLanes: views.filter((v) => v.co.laneType?.startsWith('global')).length,
    },
  };
}

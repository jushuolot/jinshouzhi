/**
 * 链订单 — 货主销售侧创建，向上游展开原料采购与履约
 */

import { EVENT_TYPES } from './lot-nucleus.js';

export const CHAIN_LEG_TYPES = [
  { id: 'procurement', labelZh: '采购原料', icon: '🛒', domain: 'procurement' },
  { id: 'production', labelZh: '生产加工', icon: '⚙️', domain: 'production' },
  { id: 'warehouse_internal', labelZh: '仓内物流', icon: '🏭', domain: 'warehouse_internal' },
  { id: 'sales', labelZh: '销售履约', icon: '📦', domain: 'sales' },
  { id: 'linehaul', labelZh: '干线运输', icon: '🚛', domain: 'linehaul' },
  { id: 'express', labelZh: '末端配送', icon: '📮', domain: 'express' },
  { id: 'ocean', labelZh: '海运', icon: '🚢', domain: 'ocean' },
  { id: 'customs', labelZh: '关务', icon: '🛃', domain: 'customs' },
  { id: 'rail', labelZh: '铁路', icon: '🚆', domain: 'rail' },
  { id: 'cold_chain', labelZh: '冷链', icon: '❄️', domain: 'cold_chain' },
];

export const CHAIN_STATUS = {
  draft: { labelZh: '草稿', order: 0 },
  active: { labelZh: '已接单', order: 1 },
  upstream: { labelZh: '上游备货', order: 2 },
  in_warehouse: { labelZh: '仓内作业', order: 3 },
  in_transit: { labelZh: '在途', order: 4 },
  delivered: { labelZh: '已签收', order: 5 },
  settling: { labelZh: '结算中', order: 6 },
  settled: { labelZh: '已结清', order: 7 },
  exception: { labelZh: '异常', order: 99 },
};

/** A：货主/品牌商从销售侧建链 */
export function createChainOrder(partial) {
  const now = new Date().toISOString();
  return {
    chainOrderId: partial.chainOrderId,
    origin: 'sales',
    anchorEnterpriseId: partial.anchorEnterpriseId,
    anchorGroupId: partial.anchorGroupId || null,
    title: partial.title || '',
    cargoSummary: partial.cargoSummary || '',
    status: partial.status || 'active',
    legLoIds: partial.legLoIds || [],
    participants: partial.participants || [],
    upstreamExpanded: partial.upstreamExpanded ?? false,
    customerRef: partial.customerRef || null,
    consignee: partial.consignee || null,
    orderLines: partial.orderLines || [],
    intakeSource: partial.intakeSource || 'manual',
    intakeMeta: partial.intakeMeta || null,
    salesFlowComplete: partial.salesFlowComplete ?? false,
    laneType: partial.laneType || 'domestic',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    lastEventAt: partial.lastEventAt || now,
  };
}

export function legMeta(legType) {
  return CHAIN_LEG_TYPES.find((l) => l.id === legType) || { id: legType, labelZh: legType, icon: '·' };
}

const POD_CODES = new Set(['POD_SIGNED', 'DELIVERED', 'SIGNED', 'CUSTOMER_SIGNED']);

export async function projectChainOrder(chain, chainOrder) {
  const legs = [];
  for (const loId of chainOrder.legLoIds || []) {
    const lo = await chain.getLO(loId);
    if (!lo) continue;
    const events = await chain.getEvents(loId);
    const last = events[events.length - 1];
    legs.push({
      loId,
      legType: lo.legType || lo.logisticsDomain,
      ownerEnterpriseId: lo.ownerEnterpriseId,
      domain: lo.logisticsDomain,
      lastCode: last?.code || null,
      lastTs: last?.ts || null,
      eventCount: events.length,
      lo,
    });
  }
  legs.sort((a, b) => (a.lo?.contract?.legSeq ?? 0) - (b.lo?.contract?.legSeq ?? 0));

  let status = chainOrder.status;
  let hasOpenException = false;
  for (const leg of legs) {
    const events = await chain.getEvents(leg.loId);
    for (const ex of events.filter((e) => e.type === EVENT_TYPES.EXCEPTION)) {
      const resolved = events.some(
        (r) => r.seq > ex.seq && (r.code === `${ex.code}_RESOLVED` || r.code === 'EXCEPTION_CLEARED')
      );
      if (!resolved) {
        hasOpenException = true;
        break;
      }
    }
    if (hasOpenException) break;
  }
  if (hasOpenException) status = 'exception';

  const allCodes = legs.map((l) => l.lastCode).filter(Boolean);
  const salesLeg = legs.find((l) => l.legType === 'sales' || l.domain === 'sales');
  const salesPod = salesLeg && POD_CODES.has(salesLeg.lastCode);

  const expLeg = legs.find((l) => l.legType === 'express' || l.domain === 'express');
  const expPod = expLeg && POD_CODES.has(expLeg.lastCode);
  if (!hasOpenException && (salesPod || expPod)) {
    const settlements = await chain.listSettlements({ chainOrderId: chainOrder.chainOrderId });
    const allPaid = settlements.length && settlements.every((s) => s.status === 'paid');
    status = allPaid ? 'settled' : 'settling';
  } else if (!hasOpenException && legs.some((l) => l.domain === 'linehaul' && l.lastCode === 'IN_TRANSIT')) {
    status = 'in_transit';
  } else if (!hasOpenException && legs.some((l) => l.domain === 'warehouse_internal' && l.lastCode)) {
    status = 'in_warehouse';
  } else if (!hasOpenException && chainOrder.upstreamExpanded) {
    status = 'upstream';
  }

  const lastEventAt =
    legs.map((l) => l.lastTs).filter(Boolean).sort().reverse()[0] || chainOrder.lastEventAt;

  return {
    ...chainOrder,
    status,
    lastEventAt,
    legs,
    progress: Math.round((legs.filter((l) => l.lastCode).length / Math.max(legs.length, 1)) * 100),
  };
}

/** 销售订单创建后向上游裂变：采购原料段 */
export function upstreamLegPlan(chainOrderId, anchorEnterpriseId) {
  return {
    loId: `LO-PUR-${chainOrderId.replace('CO-', '')}`,
    legType: 'procurement',
    logisticsDomain: 'procurement',
    ownerEnterpriseId: anchorEnterpriseId,
    counterpartyEnterpriseId: 'ENT-YANQING-SUP',
    legSeq: 1,
    label: '采购原料（上游展开）',
  };
}

export async function syncChainOrderOnEvent(chain, loId, code) {
  const lo = await chain.getLO(loId);
  if (!lo?.chainOrderId) return null;
  const co = await chain.getChainOrder(lo.chainOrderId);
  if (!co) return null;

  co.updatedAt = new Date().toISOString();
  co.lastEventAt = co.updatedAt;
  if (code === 'CHAIN_START' && lo.legType === 'sales' && !co.upstreamExpanded) {
    co.upstreamExpanded = true;
    co.salesFlowComplete = true;
    co.status = 'upstream';
  }
  const projected = await projectChainOrder(chain, co);
  co.status = projected.status;
  await chain.putChainOrder(co);

  if (POD_CODES.has(code) && (lo.legType === 'sales' || lo.legType === 'express')) {
    await chain.spawnPeerSettlements(lo.chainOrderId, loId);
    const co2 = await chain.getChainOrder(lo.chainOrderId);
    if (co2) {
      co2.status = 'settling';
      await chain.putChainOrder(co2);
    }
  }
  return co;
}

/**
 * 仓网层级 DC / RDC / FDC · 仓内作业 · 自动化设备 · 订单聚合/拆分
 */

import { createLO, createChainLink, EVENT_TYPES, appendEventToChain } from './lot-nucleus.js';

export const WAREHOUSE_TIERS = {
  dc: {
    id: 'dc',
    labelZh: 'DC 配送中心',
    labelEn: 'Distribution Center',
    color: '#60a5fa',
    descZh: '大批量存储、波次拣选、干线衔接，服务大区',
  },
  rdc: {
    id: 'rdc',
    labelZh: 'RDC 区域中心',
    labelEn: 'Regional DC',
    color: '#34d399',
    descZh: '区域集散、越库中转、向下游 FDC/门店补货',
  },
  fdc: {
    id: 'fdc',
    labelZh: 'FDC 前置仓',
    labelEn: 'Forward / Micro FC',
    color: '#fbbf24',
    descZh: '城市前置、即时履约、短半径拣配出库',
  },
};

export const EQUIPMENT_TYPES = {
  agv: { id: 'agv', labelZh: 'AGV 搬运', throughput: 120 },
  conveyor: { id: 'conveyor', labelZh: '输送线', throughput: 800 },
  sorter: { id: 'sorter', labelZh: '交叉带分拣机', throughput: 6000 },
  asrs: { id: 'asrs', labelZh: '立体库 AS/RS', throughput: 90 },
  shuttle: { id: 'shuttle', labelZh: '四向穿梭车', throughput: 200 },
  robotic_arm: { id: 'robotic_arm', labelZh: '机械臂拆码垛', throughput: 45 },
  dws: { id: 'dws', labelZh: 'DWS 称重扫描', throughput: 2000 },
  miniload: { id: 'miniload', labelZh: 'Miniload 轻载', throughput: 150 },
};

export function createEquipment(partial) {
  return {
    id: partial.id,
    facilityId: partial.facilityId,
    tier: partial.tier || 'dc',
    type: partial.type,
    labelZh: partial.labelZh || EQUIPMENT_TYPES[partial.type]?.labelZh || partial.id,
    status: partial.status || 'idle',
    utilization: partial.utilization ?? 0,
    taskLoId: partial.taskLoId || null,
    zone: partial.zone || 'storage',
    meta: partial.meta || {},
  };
}

/** 演示设备舰队 — 按 DC/RDC/FDC 分布 */
export const DEMO_EQUIPMENT = [
  createEquipment({ id: 'DC-ASRS-01', facilityId: 'bj-dc-shunyi', tier: 'dc', type: 'asrs', zone: 'storage', utilization: 62 }),
  createEquipment({ id: 'DC-AGV-A1', facilityId: 'bj-dc-shunyi', tier: 'dc', type: 'agv', zone: 'pick', utilization: 48 }),
  createEquipment({ id: 'DC-SORT-01', facilityId: 'bj-dc-shunyi', tier: 'dc', type: 'sorter', zone: 'ship', utilization: 71 }),
  createEquipment({ id: 'DC-DWS-01', facilityId: 'bj-dc-shunyi', tier: 'dc', type: 'dws', zone: 'pack', utilization: 55 }),
  createEquipment({ id: 'RDC-SHUT-01', facilityId: 'bj-rdc-tongzhou', tier: 'rdc', type: 'shuttle', zone: 'storage', utilization: 58 }),
  createEquipment({ id: 'RDC-CVY-01', facilityId: 'bj-rdc-tongzhou', tier: 'rdc', type: 'conveyor', zone: 'receive', utilization: 66 }),
  createEquipment({ id: 'RDC-AGV-R1', facilityId: 'bj-rdc-tongzhou', tier: 'rdc', type: 'agv', zone: 'pick', utilization: 41 }),
  createEquipment({ id: 'RDC-SORT-01', facilityId: 'bj-rdc-tongzhou', tier: 'rdc', type: 'sorter', zone: 'ship', utilization: 73 }),
  createEquipment({ id: 'FDC-AGV-F1', facilityId: 'bj-fdc-wangjing', tier: 'fdc', type: 'agv', zone: 'pick', utilization: 82 }),
  createEquipment({ id: 'FDC-MINI-01', facilityId: 'bj-fdc-wangjing', tier: 'fdc', type: 'miniload', zone: 'storage', utilization: 77 }),
  createEquipment({ id: 'FDC-ARM-01', facilityId: 'bj-fdc-wangjing', tier: 'fdc', type: 'robotic_arm', zone: 'pack', utilization: 35 }),
  createEquipment({ id: 'FDC-DWS-01', facilityId: 'bj-fdc-wangjing', tier: 'fdc', type: 'dws', zone: 'ship', utilization: 64 }),
];

export function bumpEquipmentOnEvent(equipmentList, eventCode, facilityId) {
  const bump = { PICK_CONFIRM: 8, PACK_DONE: 6, ASRS_RETRIEVE: 10, AGV_MOVE: 5, SORT_DROP: 4 };
  const delta = bump[eventCode] || 2;
  return equipmentList.map((eq) => {
    if (facilityId && eq.facilityId !== facilityId) return eq;
    const util = Math.min(98, Math.max(5, (eq.utilization || 0) + delta - 1));
    return {
      ...eq,
      utilization: util,
      status: util > 85 ? 'busy' : util > 50 ? 'running' : 'idle',
      lastEvent: eventCode,
    };
  });
}

export function createAggregateParent(partial) {
  return createLO({
    loId: partial.loId,
    logisticsDomain: 'warehouse_internal',
    channel: 'order-aggregate',
    facilityTier: partial.tier || 'rdc',
    originCellId: partial.facilityId,
    destCellId: partial.destCellId || partial.facilityId,
    primaryActor: 'warehouse',
    contract: {
      op: 'aggregate',
      cargo: partial.cargo || '聚合出库波次',
      childLoIds: partial.childLoIds || [],
      waveId: partial.waveId || 'WAVE-' + Date.now(),
      tier: partial.tier,
    },
    links: (partial.childLoIds || []).map((id) =>
      createChainLink({ rel: 'downstream', targetLoId: id, label: '聚合子单' })
    ),
  });
}

export function createSplitChild(partial, parentLoId) {
  return createLO({
    loId: partial.loId,
    logisticsDomain: 'warehouse_internal',
    channel: 'order-split',
    facilityTier: partial.tier || 'dc',
    originCellId: partial.originCellId,
    destCellId: partial.destCellId,
    primaryActor: 'warehouse',
    contract: {
      op: 'split',
      cargo: partial.cargo,
      parentLoId,
      splitSeq: partial.splitSeq,
      tier: partial.tier,
    },
    links: [createChainLink({ rel: 'upstream', targetLoId: parentLoId, label: '拆分来源' })],
  });
}

/** 订单聚合：多 LO → 一父 LO */
export async function aggregateOrders(chain, { parentLoId, childLoIds, tier, facilityId, cargo }) {
  const parent = createAggregateParent({
    loId: parentLoId,
    childLoIds,
    tier,
    facilityId,
    destCellId: facilityId,
    cargo,
  });
  await chain.putLODirect(parent);
  let events = await appendEventToChain([], {
    loId: parentLoId,
    type: EVENT_TYPES.DECISION,
    code: 'ORDER_AGGREGATED',
    actor: 'warehouse',
    spatialCellId: facilityId,
    payload: { childLoIds, count: childLoIds.length },
  });
  for (const e of events) await chain.appendEvent(e);
  for (const cid of childLoIds) {
    const childEvents = await chain.getEvents(cid);
    const next = await appendEventToChain(childEvents, {
      loId: cid,
      type: EVENT_TYPES.SYNC,
      code: 'AGGREGATED_INTO',
      actor: 'system',
      spatialCellId: facilityId,
      payload: { parentLoId },
    });
    const evt = next[next.length - 1];
    await chain.appendEvent(evt);
  }
  return parent;
}

/** 订单拆分：一父 LO → 多子 LO */
export async function splitOrder(chain, parentLoId, parts) {
  const parent = await chain.getLO(parentLoId);
  if (!parent) return [];
  const children = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const child = createSplitChild(
      {
        loId: p.loId,
        cargo: p.cargo,
        tier: p.tier || parent.contract?.tier,
        originCellId: p.originCellId || parent.originCellId,
        destCellId: p.destCellId || parent.destCellId,
        splitSeq: i + 1,
      },
      parentLoId
    );
    await chain.putLODirect(child);
    let ev = await appendEventToChain([], {
      loId: child.loId,
      type: EVENT_TYPES.FACT,
      code: 'SPLIT_CHILD_CREATED',
      actor: 'warehouse',
      spatialCellId: child.originCellId,
      payload: { parentLoId, splitSeq: i + 1 },
    });
    for (const e of ev) await chain.appendEvent(e);
    children.push(child);
  }
  const pe = await chain.getEvents(parentLoId);
  const next = await appendEventToChain(pe, {
    loId: parentLoId,
    type: EVENT_TYPES.DECISION,
    code: 'ORDER_SPLIT',
    actor: 'warehouse',
    spatialCellId: parent.originCellId,
    payload: { childLoIds: children.map((c) => c.loId), parts: parts.length },
  });
  await chain.appendEvent(next[next.length - 1]);
  return children;
}

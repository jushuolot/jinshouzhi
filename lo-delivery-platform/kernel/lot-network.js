/**
 * LOT Network — 多 LO 上下游裂变
 * 链环键 + SYNC 事件传播
 */

import { EVENT_TYPES, SYNC_CODES } from './lot-nucleus.js';

/** 动作完成 → 触发下游 FACT 的映射 */
export const SYNC_TRANSITIONS = {
  'LO-FARM-001': { PICKUP_DONE: { toLoId: 'LO-WH-001', factCode: 'INBOUND_PENDING' } },
  'LO-WH-001': { LOADED: { toLoId: 'LO-LINE-001', factCode: 'PICKUP_READY' } },
  'LO-LINE-001': { POD_SIGNED: { toLoId: 'LO-LAST-001', factCode: 'DISPATCH' } },
};

export function getLinkedLOs(loId, allLos) {
  const lo = allLos.find((x) => x.loId === loId);
  if (!lo) return { self: null, upstream: [], downstream: [] };
  const byId = new Map(allLos.map((x) => [x.loId, x]));
  const upstream = [];
  const downstream = [];
  for (const link of lo.links || []) {
    if (link.rel === 'upstream' && link.targetLoId) {
      const t = byId.get(link.targetLoId);
      if (t) upstream.push({ link, lo: t });
    }
    if (link.rel === 'downstream' && link.targetLoId) {
      const t = byId.get(link.targetLoId);
      if (t) downstream.push({ link, lo: t });
    }
  }
  return { self: lo, upstream, downstream };
}

export function buildNetworkEdges(allLos) {
  const edges = [];
  const seen = new Set();
  for (const lo of allLos) {
    for (const link of lo.links || []) {
      if (link.rel !== 'downstream' || !link.targetLoId) continue;
      const key = lo.loId + '→' + link.targetLoId;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: lo.loId, to: link.targetLoId, label: link.label || '' });
    }
  }
  return edges;
}

/**
 * 从 fromLo 向 toLo 传播 SYNC，并在目标 LO 写入触发 FACT
 * @param {import('./lot-chain.js').LotChain} chain
 */
export async function propagateSync(chain, fromLoId, toLoId, code, payload = {}) {
  const fromLo = await chain.getLO(fromLoId);
  const toLo = await chain.getLO(toLoId);
  if (!fromLo || !toLo) return null;

  await chain.emitAction(fromLoId, {
    type: EVENT_TYPES.SYNC,
    code: code || SYNC_CODES.DOWNSTREAM_TRIGGER,
    actor: 'system',
    spatialCellId: fromLo.destCellId,
    payload: { targetLoId: toLoId, ...payload },
  });

  const factCode = payload.factCode || 'SYNC_RECEIVED';
  return chain.emitAction(toLoId, {
    type: EVENT_TYPES.FACT,
    code: factCode,
    actor: 'system',
    spatialCellId: toLo.originCellId,
    payload: { sourceLoId: fromLoId, syncCode: code, ...payload },
  });
}

/** 根据动作表自动裂变下游 */
export async function maybePropagate(chain, loId, actionCode) {
  const { maybeEvolvePropagate } = await import('./lot-evolve.js');
  const evolved = await maybeEvolvePropagate(chain, loId, actionCode);
  if (evolved) return evolved;
  const rule = SYNC_TRANSITIONS[loId]?.[actionCode];
  if (!rule) return null;
  return propagateSync(chain, loId, rule.toLoId, SYNC_CODES.HANDOFF, {
    factCode: rule.factCode,
    triggerAction: actionCode,
  });
}

/** 司机镜头：今日可执行任务队列 */
export async function listDriverTasks(chain) {
  const los = await chain.listLOs();
  const today = new Date().toISOString().slice(0, 10);
  const tasks = [];
  for (const lo of los) {
    if (lo.primaryActor !== 'driver' || lo.status !== 'active') continue;
    const events = await chain.getEvents(lo.loId);
    const last = events[events.length - 1];
    const done = last && ['POD_SIGNED', 'DELIVERED'].includes(last.code);
    if (done) continue;
    const created = (lo.createdAt || '').slice(0, 10);
    if (created > today) continue;
    tasks.push({ lo, events, lastEvent: last });
  }
  return tasks.sort((a, b) => (a.lo.createdAt || '').localeCompare(b.lo.createdAt || ''));
}

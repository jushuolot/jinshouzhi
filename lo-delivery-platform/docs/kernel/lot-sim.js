/**
 * LOT Sim — 可展示裂变：全链演示剧本 + 管道态势
 */

import { buildNetworkEdges } from './lot-network.js';
import { projectLOState } from './lot-nucleus.js';

export const PIPELINE = [
  { loId: 'LO-FARM-001', icon: '🌾', labelZh: '农户揽收', labelEn: 'Farm pickup', actor: 'shipper', actions: ['CONFIRM', 'PICKUP_DONE'] },
  { loId: 'LO-WH-001', icon: '🏭', labelZh: '顺义仓', labelEn: 'Shunyi WH', actor: 'warehouse', actions: ['INBOUND_SCAN', 'PICK_PACK', 'LOADED'] },
  { loId: 'LO-LINE-001', icon: '🚛', labelZh: '干线运输', labelEn: 'Linehaul', actor: 'driver', actions: ['PICKUP_DONE', 'IN_TRANSIT', 'POD_SIGNED'] },
  { loId: 'LO-LAST-001', icon: '📦', labelZh: '末端配送', labelEn: 'Last mile', actor: 'driver', actions: ['PICKUP_DONE', 'IN_TRANSIT', 'POD_SIGNED'] },
];

export const DEMO_SCRIPT = [
  { loId: 'LO-FARM-001', code: 'CONFIRM', actor: 'shipper', msg: '货主确认订单 · 延庆蔬菜' },
  { loId: 'LO-FARM-001', code: 'PICKUP_DONE', actor: 'shipper', msg: '农户完成揽收 → 触发仓入库' },
  { loId: 'LO-WH-001', code: 'INBOUND_SCAN', actor: 'warehouse', msg: '顺义仓扫码入库' },
  { loId: 'LO-WH-001', code: 'PICK_PACK', actor: 'warehouse', msg: '拣配完成' },
  { loId: 'LO-WH-001', code: 'LOADED', actor: 'warehouse', msg: '装车出库 → 触发干线' },
  { loId: 'LO-LINE-001', code: 'PICKUP_DONE', actor: 'driver', msg: '干线发车' },
  { loId: 'LO-LINE-001', code: 'IN_TRANSIT', actor: 'driver', msg: '在途 · 西站枢纽' },
  { loId: 'LO-LINE-001', code: 'POD_SIGNED', actor: 'driver', msg: '枢纽落地 → 触发末端' },
  { loId: 'LO-LAST-001', code: 'PICKUP_DONE', actor: 'driver', msg: '末端取货' },
  { loId: 'LO-LAST-001', code: 'IN_TRANSIT', actor: 'driver', msg: '最后一公里配送中' },
  { loId: 'LO-LAST-001', code: 'POD_SIGNED', actor: 'driver', msg: '签收完成 · 全链通关 🎉' },
];

export async function getPipelineState(chain) {
  const los = await chain.listLOs();
  const edges = buildNetworkEdges(los);
  const stages = [];
  for (const p of PIPELINE) {
    const lo = los.find((x) => x.loId === p.loId);
    if (!lo) {
      stages.push({ ...p, lo: null, progress: 0, lastCode: null, status: 'missing' });
      continue;
    }
    const events = await chain.getEvents(lo.loId);
    const proj = projectLOState(lo, events);
    const lastCode = proj.lastEvent?.code || null;
    const done = lastCode === 'POD_SIGNED' || lastCode === 'DELIVERED';
    stages.push({
      ...p,
      lo,
      progress: proj.progress,
      lastCode,
      events,
      status: done ? 'done' : proj.lastEvent ? 'active' : 'pending',
    });
  }
  const activeIx = stages.findIndex((s) => s.status === 'active') >= 0
    ? stages.findIndex((s) => s.status === 'active')
    : stages.findIndex((s) => s.status === 'pending');
  return { stages, edges, activeIx: activeIx < 0 ? stages.length - 1 : activeIx };
}

export async function runDemoStep(chain, step, spatialCellId) {
  const lo = await chain.getLO(step.loId);
  return chain.emitAction(step.loId, {
    code: step.code,
    actor: step.actor,
    spatialCellId: spatialCellId || lo?.originCellId,
    payload: { demo: true },
  });
}

export async function runFullDemo(chain, { onStep, delayMs = 1400 } = {}) {
  for (let i = 0; i < DEMO_SCRIPT.length; i++) {
    const step = DEMO_SCRIPT[i];
    const lo = await chain.getLO(step.loId);
    await runDemoStep(chain, step, lo?.originCellId);
    if (onStep) await onStep(step, i, DEMO_SCRIPT.length);
    if (i < DEMO_SCRIPT.length - 1) await sleep(delayMs);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const ROUTE_COORDS = [
  ['bj-yanqing-cell', 40.45, 115.97],
  ['bj-shunyi-wh', 40.13, 116.65],
  ['bj-west-hub', 39.894, 116.322],
  ['bj-yanqing-cell', 40.45, 115.97],
];

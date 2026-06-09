/**
 * LOT Evolve — 跨域裂变进化 · 自动线程 · 代数追踪
 */

import { createLO, createChainLink, EVENT_TYPES, appendEventToChain } from './lot-nucleus.js';
import { domainStageCodes, getDomain } from './lot-domains.js';
import { propagateSync, SYNC_TRANSITIONS } from './lot-network.js';
import { bumpEquipmentOnEvent } from './lot-warehouse.js';

/** 扩展跨域 SYNC（与 lot-network SYNC_TRANSITIONS 合并使用） */
export const EVOLVE_SYNC = {
  'LO-PUR-001': { PUTAWAY_DONE: { toLoId: 'LO-WHI-001', factCode: 'DOCK_CHECKIN' } },
  'LO-WHI-004': { STAGE_OUT: { toLoId: 'LO-LHL-001', factCode: 'LOAD_PLAN' } },
  'LO-ECM-001': { HANDOVER_CARRIER: { toLoId: 'LO-EXP-001', factCode: 'COLLECT_SCAN' } },
  'LO-AGG-001': { SORT_DROP: { toLoId: 'LO-EXP-002', factCode: 'SORT_HUB_IN' } },
  'LO-LHL-001': { UNLOAD_COMPLETE: { toLoId: 'LO-WHI-009', factCode: 'DOCK_CHECKIN' } },
  'LO-MFG-004': { FG_STOCK_IN: { toLoId: 'LO-WHI-003', factCode: 'UNLOAD_SCAN' } },
  'LO-FDC-wangjing': { _alias: 'LO-WHI-009', STAGE_OUT: { toLoId: 'LO-EXP-009', factCode: 'OUT_DELIVERY' } },
};

export function mergedSyncTransitions() {
  return { ...SYNC_TRANSITIONS, ...EVOLVE_SYNC };
}

export async function maybeEvolvePropagate(chain, loId, actionCode) {
  const rule = EVOLVE_SYNC[loId]?.[actionCode];
  if (!rule || rule._alias) return null;
  return propagateSync(chain, loId, rule.toLoId, 'SYNC_FISSION', {
    factCode: rule.factCode,
    triggerAction: actionCode,
    fission: true,
  });
}

/** 跨域黄金线程（演示剧本） */
export const FISSION_THREADS = [
  {
    id: 'thread-golden',
    labelZh: '黄金链：采购→DC→干线→快递→签收',
    steps: [
      { loId: 'LO-PUR-001', code: 'INVOICE_MATCHED', actor: 'finance', msg: '采购三单匹配' },
      { loId: 'LO-WHI-001', code: 'ASRS_RETRIEVE', actor: 'equipment', msg: 'DC 自动化取货' },
      { loId: 'LO-WHI-001', code: 'STAGE_OUT', actor: 'warehouse', msg: 'DC 集货待发' },
      { loId: 'LO-LHL-001', code: 'DEPART_TERMINAL', actor: 'driver', msg: '干线发出' },
      { loId: 'LO-LHL-001', code: 'UNLOAD_COMPLETE', actor: 'warehouse', msg: '干线卸货 → 裂变 FDC' },
      { loId: 'LO-EXP-001', code: 'POD_SCAN', actor: 'courier', msg: '快递签收' },
    ],
  },
  {
    id: 'thread-ecom',
    labelZh: '电商链：平台单→仓内→聚合→快递',
    steps: [
      { loId: 'LO-ECM-001', code: 'WAYBILL_PRINT', actor: 'warehouse', msg: '电商面单' },
      { loId: 'LO-AGG-001', code: 'PICK_CONFIRM', actor: 'warehouse', msg: 'RDC 聚合拣货' },
      { loId: 'LO-AGG-001', code: 'SORT_DROP', actor: 'equipment', msg: '分拣 → 快递' },
      { loId: 'LO-EXP-002', code: 'OUT_DELIVERY', actor: 'courier', msg: '派送出站' },
    ],
  },
  {
    id: 'thread-tender',
    labelZh: '招标链：评标→中标→启动干线履约',
    steps: [
      { loId: 'LO-TDR-001', code: 'AWARD_NOTICE', actor: 'tender_officer', msg: '干线运输中标公示' },
      { loId: 'LO-TDR-001', code: 'CONTRACT_SIGN', actor: 'legal', msg: '运输合同签订' },
      { loId: 'LO-TDR-001', code: 'KICKOFF_SYNC', actor: 'tender_officer', msg: '启动 LO-LHL-002 履约' },
    ],
  },
  {
    id: 'thread-mfg',
    labelZh: '生产链：叫料→仓内→成品→销售',
    steps: [
      { loId: 'LO-MFG-001', code: 'LINE_DELIVERY', actor: 'driver', msg: '线边配送' },
      { loId: 'LO-MFG-004', code: 'FG_STOCK_IN', actor: 'warehouse', msg: '成品入库 DC' },
      { loId: 'LO-WHI-003', code: 'WAVE_RELEASE', actor: 'warehouse', msg: '销售波次' },
      { loId: 'LO-SAL-001', code: 'IN_TRANSIT', actor: 'driver', msg: '销售在途' },
    ],
  },
];

export const CROSS_LINKS_V6 = [
  { from: 'LO-PUR-001', to: 'LO-WHI-001', label: '采购入 DC' },
  { from: 'LO-WHI-004', to: 'LO-LHL-001', label: 'DC→干线' },
  { from: 'LO-ECM-001', to: 'LO-EXP-001', label: '电商→快递' },
  { from: 'LO-AGG-001', to: 'LO-EXP-002', label: '聚合→快递' },
  { from: 'LO-LHL-001', to: 'LO-WHI-009', label: '干线→FDC' },
  { from: 'LO-MFG-004', to: 'LO-WHI-003', label: '生产→DC' },
  { from: 'LO-WHI-009', to: 'LO-EXP-009', label: 'FDC→末端快递' },
];

/** 裂变.spawn：从母单生成子代 LO */
export async function spawnFissionChild(chain, parentLoId, partial) {
  const parent = await chain.getLO(parentLoId);
  if (!parent) return null;
  const gen = (await chain.getFissionGeneration()) + 1;
  const loId = partial.loId || `LO-FN-G${gen}-${Date.now().toString(36).slice(-4)}`;
  const child = createLO({
    loId,
    logisticsDomain: partial.domain || parent.logisticsDomain,
    facilityTier: partial.tier || parent.facilityTier,
    channel: 'fission-spawn',
    originCellId: partial.originCellId || parent.destCellId,
    destCellId: partial.destCellId || parent.destCellId,
    primaryActor: partial.actor || parent.primaryActor,
    contract: {
      cargo: partial.cargo || `裂变子代 #${gen}`,
      parentLoId,
      generation: gen,
    },
    links: [createChainLink({ rel: 'upstream', targetLoId: parentLoId, label: '裂变母核' })],
  });
  await chain.putLODirect(child);
  const pe = await chain.getEvents(parentLoId);
  const next = await appendEventToChain(pe, {
    loId: parentLoId,
    type: EVENT_TYPES.DECISION,
    code: 'FISSION_SPAWN',
    actor: 'system',
    spatialCellId: parent.destCellId,
    payload: { childLoId: loId, generation: gen },
  });
  await chain.appendEvent(next[next.length - 1]);
  let ce = await appendEventToChain([], {
    loId,
    type: EVENT_TYPES.FACT,
    code: 'FISSION_BORN',
    actor: 'system',
    spatialCellId: child.originCellId,
    payload: { parentLoId, generation: gen },
  });
  for (const e of ce) await chain.appendEvent(e);
  await chain.setFissionGeneration(gen);
  return child;
}

/** 对活跃 LO 推进一步（自动进化心跳） */
export async function evolveHeartbeat(chain) {
  const los = (await chain.listLOs()).filter((l) => l.status === 'active');
  if (!los.length) return null;
  const lo = los[Math.floor(Math.random() * los.length)];
  const domain = lo.logisticsDomain;
  if (!domain) return null;
  const stageDefs = getDomain(domain)?.stages || [];
  const events = await chain.getEvents(lo.loId);
  const doneCodes = events.filter((e) => e.type === 'FACT').map((e) => e.code);
  const nextDef = stageDefs.find((s) => !doneCodes.includes(s.code));
  if (!nextDef) {
    if (Math.random() > 0.7) {
      return spawnFissionChild(chain, lo.loId, {
        domain,
        cargo: `自进化子单 · ${lo.contract?.cargo || lo.loId}`,
      });
    }
    return null;
  }
  const evt = await chain.emitAction(lo.loId, {
    code: nextDef.code,
    actor: nextDef.actor || 'warehouse',
    spatialCellId: lo.originCellId,
    payload: { autoEvolve: true },
  });
  await maybeEvolvePropagate(chain, lo.loId, nextDef.code);
  const eq = await chain.getEquipment();
  await chain.setEquipment(bumpEquipmentOnEvent(eq, nextDef.code, lo.originCellId));
  return { lo, code: nextDef.code, evt };
}

export async function runFissionThread(chain, thread, { onStep, delayMs = 1000 } = {}) {
  for (let i = 0; i < thread.steps.length; i++) {
    const step = thread.steps[i];
    const lo = await chain.getLO(step.loId);
    await chain.emitAction(step.loId, {
      code: step.code,
      actor: step.actor,
      spatialCellId: lo?.originCellId,
      payload: { thread: thread.id },
    });
    await maybeEvolvePropagate(chain, step.loId, step.code);
    if (onStep) await onStep(step, i, thread);
    if (i < thread.steps.length - 1) await sleep(delayMs);
  }
  const gen = (await chain.getFissionGeneration()) + 1;
  await chain.setFissionGeneration(gen);
}

export async function runFullFission(chain, { onStep, onThread, delayMs = 900 } = {}) {
  for (const thread of FISSION_THREADS) {
    if (onThread) onThread(thread);
    await runFissionThread(chain, thread, {
      delayMs,
      onStep: (step, i, t) => onStep?.({ ...step, thread: t.labelZh }, i),
    });
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getEvolutionStats(chain) {
  const los = await chain.listLOs();
  const gen = await chain.getFissionGeneration();
  let events = 0;
  let spawn = 0;
  for (const lo of los) {
    const ev = await chain.getEvents(lo.loId);
    events += ev.length;
    spawn += ev.filter((e) => e.code === 'FISSION_SPAWN' || e.code === 'FISSION_BORN').length;
  }
  return { generation: gen, loCount: los.length, eventCount: events, spawnCount: spawn };
}

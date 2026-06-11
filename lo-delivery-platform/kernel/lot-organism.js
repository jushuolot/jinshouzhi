/**
 * 雨林有机体 — 点生命周期 + 共生关系投影
 * 点：单 LO / 单据 / 结算 的独立周期
 * 面：symbionts 表达链上同生共死
 */

export const LIFE_PHASES = [
  { id: 'SEED', labelZh: '种子', order: 0 },
  { id: 'SPROUT', labelZh: '发芽', order: 1 },
  { id: 'GROWING', labelZh: '生长', order: 2 },
  { id: 'MATURE', labelZh: '成熟', order: 3 },
  { id: 'FRUITING', labelZh: '结果', order: 4 },
  { id: 'DECAY', labelZh: '枯落', order: 5 },
  { id: 'COMPOST', labelZh: '腐殖', order: 6 },
];

const PHASE_ORDER = Object.fromEntries(LIFE_PHASES.map((p) => [p.id, p.order]));

/** LO 进度 → 生命阶段（启发式，供 UI 色块与 C4I 图层） */
export function loPhaseFromProgress(progressPct, { hasException = false, settled = false } = {}) {
  if (settled) return 'COMPOST';
  if (hasException) return 'DECAY';
  if (progressPct <= 0) return 'SEED';
  if (progressPct < 15) return 'SPROUT';
  if (progressPct < 70) return 'GROWING';
  if (progressPct < 95) return 'MATURE';
  return 'FRUITING';
}

/** 单据状态 → 生命阶段 */
export function docPhaseFromStatus(status) {
  const map = { draft: 'SPROUT', approved: 'GROWING', posted: 'MATURE', void: 'DECAY' };
  return map[status] || 'SEED';
}

/** 结算状态 → 生命阶段 */
export function settlementPhaseFromStatus(status) {
  const map = {
    pending_recon: 'SPROUT',
    confirmed: 'GROWING',
    invoiced: 'MATURE',
    paid: 'FRUITING',
    disputed: 'DECAY',
  };
  return map[status] || 'SEED';
}

export function phaseColor(phaseId) {
  const colors = {
    SEED: '#6d8fa8',
    SPROUT: '#7ec8ff',
    GROWING: '#3dffb0',
    MATURE: '#ffc14d',
    FRUITING: '#ff8c42',
    DECAY: '#ff4d6a',
    COMPOST: '#4a5568',
  };
  return colors[phaseId] || '#6d8fa8';
}

/**
 * 构建有机体视图（点）
 * @param {{ kind, id, labelZh, phase, symbionts?, meta? }} base
 */
export function createOrganismView(base) {
  return {
    ...base,
    phaseLabel: LIFE_PHASES.find((p) => p.id === base.phase)?.labelZh || base.phase,
    color: phaseColor(base.phase),
  };
}

/** 从链订单投影共生网络（面） */
export async function projectChainSymbiosis(chain, chainOrderId) {
  const co = await chain.getChainOrder(chainOrderId);
  if (!co) return { organisms: [], edges: [] };

  const los = (await chain.listLOs()).filter((l) => l.chainOrderId === chainOrderId);
  const docs = await chain.getDocumentsForChain?.(chainOrderId) || [];
  const stls = await chain.listSettlements({ chainOrderId });

  const organisms = [];
  const edges = [];

  for (const lo of los) {
    const events = await chain.getEvents(lo.loId);
    const hasEx = events.some((e) => e.type === 'EXCEPTION');
    const done = events.filter((e) => e.type === 'FACT').length;
    const total = 8;
    const progress = Math.min(100, Math.round((done / total) * 100));
    organisms.push(
      createOrganismView({
        kind: 'LO',
        id: lo.loId,
        labelZh: `${lo.legType || lo.logisticsDomain}`,
        phase: loPhaseFromProgress(progress, { hasException: hasEx }),
        symbionts: lo.links?.map((l) => l.targetLoId).filter(Boolean) || [],
        meta: { progress },
      })
    );
    for (const link of lo.links || []) {
      if (link.targetLoId) {
        edges.push({ from: lo.loId, to: link.targetLoId, rel: link.rel || 'downstream' });
      }
    }
  }

  for (const d of docs) {
    organisms.push(
      createOrganismView({
        kind: 'DOC',
        id: d.docId,
        labelZh: d.docType,
        phase: docPhaseFromStatus(d.status),
        symbionts: [d.loId],
      })
    );
  }

  for (const s of stls) {
    organisms.push(
      createOrganismView({
        kind: 'STL',
        id: s.settlementId,
        labelZh: s.title,
        phase: settlementPhaseFromStatus(s.status),
        symbionts: [s.legLoId, s.payerEnterpriseId, s.payeeEnterpriseId],
        meta: { amount: s.amount },
      })
    );
    edges.push({ from: s.legLoId, to: s.settlementId, rel: 'settlement' });
  }

  return { chainOrderId, title: co.title, organisms, edges };
}

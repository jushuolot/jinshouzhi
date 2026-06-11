/**
 * 业务裂变引擎 — 真实链式 handoff、阶段推进、单据与结算联动
 * 货主销售建单 → 上游采购展开 → 仓运配 → 签收 → 点对点结算
 */

import { createLO, createChainLink, appendEventToChain } from './lot-nucleus.js';
import { createChainOrder, projectChainOrder, legMeta } from './lot-chain-order.js';
import { getDomain } from './lot-domains.js';
import { propagateSync } from './lot-network.js';
import { createDocument, DOC_TYPES } from './lot-documents.js';
import { createPeerSettlement, SETTLEMENT_STATUS } from './lot-settlement.js';
import { DEMO_CHAIN_ORDER } from './lot-demo-data-eco.js';
import { normalizeSalesIntake, orderLinesFromCargo } from './lot-sales-intake.js';
import { checkShipperDocGate } from './lot-document-ops.js';

export const SHIPPER_ORDER_FLOW = [
  { code: 'SO_DRAFT', labelZh: '草拟销售订单', buttonLabel: '📝 草拟销售订单', actor: 'shipper', doc: { type: 'SO', status: 'draft' }, docGate: null },
  { code: 'SO_APPROVED', labelZh: '销售审单通过', buttonLabel: '✅ 销售审单通过', actor: 'shipper', doc: { type: 'SO', status: 'approved' }, docGate: { type: 'SO', status: 'approved' } },
  { code: 'ORDER_CREATED', labelZh: '正式下达 SO', buttonLabel: '📤 正式下达 SO', actor: 'shipper', doc: { type: 'SO', status: 'posted' }, docGate: { type: 'SO', status: 'posted' } },
  { code: 'MRP_EXPLODE', labelZh: 'MRP 展开上游', buttonLabel: '📊 MRP 展开上游', actor: 'planner', doc: { type: 'PR', status: 'draft' }, docGate: { type: 'SO', status: 'posted' } },
  { code: 'CHAIN_START', labelZh: '激活全链履约', buttonLabel: '🚀 激活全链履约', actor: 'shipper', doc: { type: 'CO', status: 'posted' }, docGate: [{ type: 'SO', status: 'posted' }, { type: 'PR', status: 'posted' }] },
];
const SHIPPER_FLOW_CODES = new Set(SHIPPER_ORDER_FLOW.map((s) => s.code));
const lineAmt = (lines) => (lines || []).reduce((s, l) => s + (l.amount ?? l.qty * l.price), 0);

async function upsertShipperFlowDoc(chain, lo, co, step) {
  if (!step?.doc) return null;
  const suffix = co.chainOrderId.replace('CO-', '');
  const lines = co.orderLines?.length ? co.orderLines : orderLinesFromCargo(co.cargoSummary, {});
  if (step.doc.type === 'SO') {
    const docId = `DOC-SO-${suffix}`;
    let doc = await chain.getDocument(docId);
    if (!doc) {
      doc = createDocument({
        docId, docType: 'SO', loId: lo.loId, status: step.doc.status,
        header: { docNo: co.customerRef || `SO-${suffix}`, title: `销售订单 · ${co.cargoSummary}`, partyFrom: lo.ownerEnterpriseId, partyTo: co.consignee || '客户', amount: lineAmt(lines) },
        lines, links: [{ loId: lo.loId, rel: 'source' }],
      });
    } else { doc.status = step.doc.status; doc.lines = lines; }
    await chain.local.putDocument(doc); return doc;
  }
  const docId = `DOC-${step.doc.type}-${suffix}`;
  if (await chain.getDocument(docId)) return chain.getDocument(docId);
  const doc = createDocument({
    docId, docType: step.doc.type, loId: lo.loId, status: step.doc.status,
    header: { docNo: `${step.doc.type}-${co.chainOrderId}`, title: co.title, partyFrom: lo.ownerEnterpriseId, partyTo: co.consignee, amount: lineAmt(lines) },
    lines, links: [{ loId: lo.loId, rel: 'source' }],
  });
  await chain.local.putDocument(doc); return doc;
}

export async function getShipperOrderFlowView(chain, chainOrderId) {
  const co = await chain.getChainOrder(chainOrderId);
  const salesLo = co ? await findLegLo(chain, chainOrderId, 'sales') : null;
  if (!co || !salesLo) return null;
  const done = await getLegDoneCodes(chain, salesLo.loId);
  const next = SHIPPER_ORDER_FLOW.find((s) => !done.has(s.code)) || null;
  return {
    chainOrderId, intakeSource: co.intakeSource, salesFlowComplete: co.salesFlowComplete || co.status !== 'draft',
    steps: SHIPPER_ORDER_FLOW.map((s) => ({ ...s, done: done.has(s.code), current: next?.code === s.code })),
    next, salesLoId: salesLo.loId,
  };
}

export async function advanceShipperOrderFlow(chain, chainOrderId, { actor, requireActor = false } = {}) {
  const co = await chain.getChainOrder(chainOrderId);
  if (!co || co.status !== 'draft') return { done: true, chainOrderId };
  const view = await getShipperOrderFlowView(chain, chainOrderId);
  if (!view?.next) return { done: true, chainOrderId };
  const step = view.next;
  if (requireActor && actor && actor !== step.actor) {
    return { ok: false, reason: `此步须由操作人「${step.actor}」执行` };
  }
  const gate = await checkShipperDocGate(chain, chainOrderId, step);
  if (!gate.ok) return { ok: false, reason: gate.reason };
  const evt = await chain.emitAction(view.salesLoId, {
    code: step.code,
    actor: actor || step.actor,
    spatialCellId: 'bj-dc-shunyi',
    payload: { salesFlow: true, manual: true, operator: actor || step.actor },
  });
  if (step.code === 'CHAIN_START') {
    const c2 = await chain.getChainOrder(chainOrderId);
    if (c2?.status === 'draft') { c2.status = 'active'; c2.salesFlowComplete = true; await chain.putChainOrder(c2); }
  }
  return { done: step.code === 'CHAIN_START', step: { ...step, loId: view.salesLoId }, evt, phase: 'sales_flow', chainOrderId };
}

export async function createChainFromIntake(chain, intake) {
  return createChainFromSales(chain, { ...normalizeSalesIntake(intake, intake.source || 'manual'), anchorEnterpriseId: intake.anchorEnterpriseId });
}

/** 链段完成 → 下一段触发（同 chainOrderId 内按 legType 匹配） */
export const LEG_HANDOFF_RULES = {
  procurement: {
    PUTAWAY_DONE: {
      toLegType: 'production',
      factCode: 'MATERIAL_CALL',
      fallbackLegType: 'warehouse_internal',
      fallbackFactCode: 'DOCK_CHECKIN',
      label: '原料上架→生产叫料/入仓',
    },
    INBOUND_ARRIVAL: { toLegType: 'warehouse_internal', factCode: 'UNLOAD_SCAN', label: '采购到货→仓卸货' },
  },
  production: {
    FG_STOCK_IN: { toLegType: 'warehouse_internal', factCode: 'DOCK_CHECKIN', label: '成品入库→仓收货' },
  },
  warehouse_internal: {
    LOADED: { toLegType: 'linehaul', factCode: 'LOAD_PLAN', label: '装车出库→干线配载' },
    STAGE_OUT: { toLegType: 'linehaul', factCode: 'VEHICLE_ASSIGN', label: '集货出库→干线' },
    SORT_DROP: { toLegType: 'linehaul', factCode: 'LOAD_PLAN', label: '分拣完成→干线', once: true },
  },
  linehaul: {
    HUB_ARRIVAL: { toLegType: 'express', factCode: 'PICKUP_REQ', label: '枢纽落地→末端取货' },
    UNLOAD_COMPLETE: { toLegType: 'express', factCode: 'COLLECT_SCAN', label: '干线卸货→快递揽收' },
  },
  express: {
    POD_SIGNED: { toLegType: 'sales', factCode: 'POD_SIGNED', label: '用户签收→销售闭环' },
    DELIVERED: { toLegType: 'sales', factCode: 'POD_SIGNED', label: '送达→销售签收' },
  },
};

/** 关键业务事件 → 自动生成/更新单据 */
export const DOC_ON_EVENT = {
  ORDER_CREATED: { docType: 'SO', title: '销售订单' },
  PO_ISSUED: { docType: 'PO', title: '采购订单' },
  INBOUND_ARRIVAL: { docType: 'ASN', title: '预到货通知' },
  PUTAWAY_DONE: { docType: 'GRN', title: '入库单' },
  PICK_PACK: { docType: 'PICK', title: '拣货单' },
  LOADED: { docType: 'DN', title: '发货单' },
  LOAD_PLAN: { docType: 'WB', title: '运单' },
  POD_SIGNED: { docType: 'POD', title: '签收单' },
  INVOICE_MATCHED: { docType: 'INV', title: '采购发票' },
};

const POD_CODES = new Set(['POD_SIGNED', 'DELIVERED', 'SIGNED', 'CUSTOMER_SIGNED', 'POD_SCAN']);

/** 事件码等价（种子/旧动作与标准域阶段对齐） */
export const CODE_ALIASES = {
  LOADED: ['STAGE_OUT', 'LOADED'],
  PICK_PACK: ['PICK_CONFIRM', 'PICK_PACK'],
  INBOUND_SCAN: ['DOCK_CHECKIN', 'UNLOAD_SCAN', 'INBOUND_SCAN'],
  INBOUND_ARRIVAL: ['INBOUND_ARRIVAL', 'UNLOAD_SCAN', 'DOCK_CHECKIN'],
  PUTAWAY_DONE: ['PUTAWAY_DONE', 'PUTAWAY_TASK'],
  FG_STOCK_IN: ['FG_STOCK_IN', 'FG_OUTPUT'],
  UNLOAD_COMPLETE: ['UNLOAD_COMPLETE', 'ARRIVE_HUB', 'HUB_ARRIVAL'],
  POD_SIGNED: ['POD_SIGNED', 'POD_SCAN', 'DELIVERED', 'DELIVERED_NOTIFY'],
  IN_TRANSIT: ['IN_TRANSIT', 'TRANSIT_CHECK', 'DEPART_TERMINAL'],
};

/** 链段启动闸门：未开始时须等上游到位 */
export const LEG_START_GATES = {
  production: [{ legType: 'procurement', anyCodes: ['SUPPLIER_CONFIRM', 'INBOUND_ARRIVAL', 'PUTAWAY_DONE'] }],
  warehouse_internal: [
    { legType: 'procurement', anyCodes: ['INBOUND_ARRIVAL', 'PUTAWAY_DONE'] },
    { legType: 'production', anyCodes: ['FG_STOCK_IN'] },
  ],
  linehaul: [{ legType: 'warehouse_internal', anyCodes: ['STAGE_OUT', 'LOADED', 'SORT_DROP'] }],
  express: [{ legType: 'linehaul', anyCodes: ['UNLOAD_COMPLETE', 'ARRIVE_HUB', 'IN_TRANSIT'] }],
};

/** 阶段推进须齐备的单据（三单匹配等） */
export const STAGE_DOC_GATES = {
  procurement: {
    INVOICE_MATCHED: ['PO', 'GRN'],
  },
};

/** 自动进化可注入的异常场景 */
export const EVOLUTION_EXCEPTIONS = [
  {
    legType: 'linehaul',
    afterCodes: ['IN_TRANSIT', 'DEPART_TERMINAL'],
    code: 'DELAY_TRANSIT',
    labelZh: '在途延误',
    actor: 'dispatcher',
  },
  {
    legType: 'procurement',
    afterCodes: ['QC_SAMPLE', 'INBOUND_ARRIVAL'],
    code: 'QC_HOLD',
    labelZh: '来料质检挂起',
    actor: 'qc',
  },
  {
    legType: 'express',
    afterCodes: ['OUT_DELIVERY'],
    code: 'POD_FAIL',
    labelZh: '签收失败待改约',
    actor: 'courier',
  },
];

export const EXCEPTION_RESOLUTIONS = {
  DELAY_TRANSIT: { code: 'REASSIGN_ROUTE', actor: 'dispatcher', labelZh: '改派路线·解除延误' },
  QC_HOLD: { code: 'QC_PASS', actor: 'qc', labelZh: '复检合格·解除挂起' },
  POD_FAIL: { code: 'RESCHEDULE_DELIVERY', actor: 'courier', labelZh: '改约重派·继续派送' },
};

/** 特定阶段执行前须满足的跨段条件 */
export const STAGE_CROSS_GATES = {
  sales: {
    IN_TRANSIT: [{ legType: 'warehouse_internal', anyCodes: ['STAGE_OUT', 'LOADED'] }],
    POD_SIGNED: [{ legType: 'express', anyCodes: ['POD_SIGNED', 'POD_SCAN', 'OUT_DELIVERY'] }],
    SETTLEMENT: [{ legType: 'express', anyCodes: ['POD_SIGNED', 'POD_SCAN'] }],
  },
  linehaul: {
    DEPART_TERMINAL: [{ legType: 'warehouse_internal', anyCodes: ['STAGE_OUT', 'LOADED'] }],
    IN_TRANSIT: [{ legType: 'warehouse_internal', anyCodes: ['STAGE_OUT', 'LOADED'] }],
  },
  express: {
    OUT_DELIVERY: [{ legType: 'linehaul', anyCodes: ['UNLOAD_COMPLETE', 'ARRIVE_HUB', 'IN_TRANSIT'] }],
    POD_SCAN: [{ legType: 'linehaul', anyCodes: ['UNLOAD_COMPLETE', 'ARRIVE_HUB'] }],
    POD_SIGNED: [{ legType: 'linehaul', anyCodes: ['UNLOAD_COMPLETE', 'ARRIVE_HUB', 'IN_TRANSIT'] }],
  },
};

/** 链订单进化优先级 */
const STATUS_PRIORITY = {
  exception: 0,
  in_transit: 1,
  in_warehouse: 2,
  upstream: 3,
  active: 4,
  settling: 5,
  delivered: 6,
};

export async function findLegLo(chain, chainOrderId, legType) {
  const los = await chain.listLOs();
  return los.find((l) => l.chainOrderId === chainOrderId && (l.legType === legType || l.logisticsDomain === legType));
}

export async function legsForChain(chain, chainOrderId) {
  const los = await chain.listLOs();
  return los.filter((l) => l.chainOrderId === chainOrderId);
}

/** 销售建单时向上游裂变采购段（若不存在） */
export async function expandUpstreamProcurement(chain, chainOrder, salesLo) {
  if (chainOrder.upstreamExpanded) return null;
  const suffix = chainOrder.chainOrderId.replace('CO-', '');
  let purLo = await findLegLo(chain, chainOrder.chainOrderId, 'procurement');
  if (!purLo) {
    purLo = createLO({
      loId: `LO-PUR-${suffix}`,
      chainOrderId: chainOrder.chainOrderId,
      legType: 'procurement',
      logisticsDomain: 'procurement',
      ownerEnterpriseId: chainOrder.anchorEnterpriseId,
      counterpartyEnterpriseId: 'ENT-YANQING-SUP',
      channel: 'upstream-fission',
      primaryActor: 'purchaser',
      originCellId: 'bj-yanqing-cell',
      destCellId: salesLo.originCellId || 'bj-dc-shunyi',
      contract: { legSeq: 1, cargo: salesLo.contract?.cargo || '原料', poNo: `PO-${suffix}` },
      links: [
        createChainLink({ rel: 'upstream', externalRef: 'ENT-YANQING-SUP', label: '供应商' }),
        createChainLink({ rel: 'downstream', targetLoId: salesLo.loId, label: '履约销售单' }),
      ],
    });
    await chain.putLODirect(purLo);
    const wh = await findLegLo(chain, chainOrder.chainOrderId, 'warehouse_internal');
    if (wh) {
      purLo.links.push(createChainLink({ rel: 'downstream', targetLoId: wh.loId, label: '原料入仓' }));
      await chain.putLODirect(purLo);
    }
    chainOrder.legLoIds = [...new Set([...(chainOrder.legLoIds || []), purLo.loId])];
    await chain.emitAction(purLo.loId, {
      code: 'PO_ISSUED',
      actor: 'purchaser',
      spatialCellId: purLo.originCellId,
      payload: { fission: 'upstream', parentSo: salesLo.loId },
    });
  }
  chainOrder.upstreamExpanded = true;
  chainOrder.status = 'upstream';
  await chain.putChainOrder(chainOrder);
  return purLo;
}

async function handoffOnceKey(chain, fromLoId, code) {
  const meta = await chain.local.getMeta(`handoff:${fromLoId}:${code}`);
  return meta;
}

async function markHandoff(chain, fromLoId, code) {
  await chain.local.setMeta(`handoff:${fromLoId}:${code}`, new Date().toISOString());
}

/** 同链内跨段 SYNC 裂变 */
export async function maybeChainHandoff(chain, fromLo, actionCode) {
  if (!fromLo?.chainOrderId) return null;
  const rules = LEG_HANDOFF_RULES[fromLo.legType || fromLo.logisticsDomain];
  const rule = rules?.[actionCode];
  if (!rule) return null;
  if (rule.once && (await handoffOnceKey(chain, fromLo.loId, actionCode))) return null;

  let target = await findLegLo(chain, fromLo.chainOrderId, rule.toLegType);
  let factCode = rule.factCode;
  if (!target && rule.fallbackLegType) {
    target = await findLegLo(chain, fromLo.chainOrderId, rule.fallbackLegType);
    factCode = rule.fallbackFactCode || factCode;
  }
  if (!target) return null;

  const result = await propagateSync(chain, fromLo.loId, target.loId, 'SYNC_CHAIN_HANDOFF', {
    factCode,
    triggerAction: actionCode,
    label: rule.label,
    chainOrderId: fromLo.chainOrderId,
  });
  if (rule.once) await markHandoff(chain, fromLo.loId, actionCode);
  return result;
}

/** 事件驱动单据裂变 */
export async function maybeSpawnDocument(chain, lo, code) {
  if (SHIPPER_FLOW_CODES.has(code) && lo?.legType === 'sales') return null;
  const spec = DOC_ON_EVENT[code];
  if (!spec || !lo?.chainOrderId) return null;
  const docId = `DOC-${spec.docType}-${lo.chainOrderId.replace('CO-', '')}-${code}`;
  const existing = await chain.getDocument(docId);
  if (existing) return existing;

  const meta = DOC_TYPES[spec.docType] || { labelZh: spec.title };
  const cargo = lo.contract?.cargo || '货品';
  const doc = createDocument({
    docId,
    docType: spec.docType,
    loId: lo.loId,
    rel: 'evidence',
    status: 'posted',
    header: {
      docNo: `${spec.docType}-${lo.chainOrderId}`,
      title: `${meta.labelZh || spec.title} · ${cargo}`,
      partyFrom: lo.ownerEnterpriseId || '',
      partyTo: lo.counterpartyEnterpriseId || lo.ownerEnterpriseId || '',
      enterpriseId: lo.ownerEnterpriseId,
    },
    lines: [{ lineNo: 1, sku: 'ITEM-01', name: cargo, qty: 1, uom: '批', price: 0, amount: 0 }],
    links: [{ loId: lo.loId, rel: 'source' }],
  });
  await chain.local.putDocument(doc);
  return doc;
}

/** 结算状态机：对账确认 → 开票 → 付款 */
export async function advanceSettlement(chain, settlementId, action = 'confirm') {
  const all = await chain.listSettlements();
  const stl = all.find((s) => s.settlementId === settlementId);
  if (!stl) return null;
  const flow = { confirm: 'confirmed', invoice: 'invoiced', pay: 'paid' };
  const next = flow[action];
  if (!next) return stl;
  const order = ['pending_recon', 'confirmed', 'invoiced', 'paid'];
  if (order.indexOf(next) <= order.indexOf(stl.status)) return stl;
  stl.status = next;
  stl.updatedAt = new Date().toISOString();
  await chain.local.putSettlement(stl);
  if (action === 'pay') await maybeCloseChainOrder(chain, stl.chainOrderId);
  return stl;
}

async function maybeCloseChainOrder(chain, chainOrderId) {
  const stls = await chain.listSettlements({ chainOrderId });
  if (!stls.length || !stls.every((s) => s.status === 'paid')) return;
  const co = await chain.getChainOrder(chainOrderId);
  if (!co) return;
  co.status = 'settled';
  co.updatedAt = new Date().toISOString();
  await chain.putChainOrder(co);
}

export async function getLegDoneCodes(chain, loId) {
  const events = await chain.getEvents(loId);
  return new Set(events.filter((e) => e.type === 'FACT').map((e) => e.code));
}

export function codesSatisfy(doneSet, requiredAny) {
  const expanded = new Set();
  for (const code of requiredAny) {
    expanded.add(code);
    for (const [canonical, aliases] of Object.entries(CODE_ALIASES)) {
      if (aliases.includes(code) || code === canonical) {
        expanded.add(canonical);
        aliases.forEach((a) => expanded.add(a));
      }
    }
  }
  for (const c of expanded) {
    if (doneSet.has(c)) return true;
  }
  return false;
}

async function upstreamGateOk(chain, chainOrderId, gates) {
  if (!gates?.length) return true;
  for (const g of gates) {
    const up = await findLegLo(chain, chainOrderId, g.legType);
    if (!up) continue;
    const done = await getLegDoneCodes(chain, up.loId);
    if (codesSatisfy(done, g.anyCodes)) return true;
  }
  return false;
}

async function canStartLeg(chain, chainOrderId, lo) {
  const legType = lo.legType || lo.logisticsDomain;
  const done = await getLegDoneCodes(chain, lo.loId);
  if (done.size > 0) return true;
  const gates = LEG_START_GATES[legType];
  if (!gates) return true;
  return upstreamGateOk(chain, chainOrderId, gates);
}

export async function docsForChainOrder(chain, chainOrderId) {
  const legLos = await legsForChain(chain, chainOrderId);
  const loIds = new Set(legLos.map((l) => l.loId));
  const all = await chain.local.listDocuments();
  return all.filter(
    (d) => loIds.has(d.loId) || d.links?.some((l) => loIds.has(l.loId))
  );
}

export async function docGateStatus(chain, chainOrderId, lo, stageCode) {
  const legType = lo.legType || lo.logisticsDomain;
  const required = STAGE_DOC_GATES[legType]?.[stageCode];
  if (!required?.length) return { ok: true, missing: [] };
  const docs = await docsForChainOrder(chain, chainOrderId);
  const have = new Set(docs.map((d) => d.docType));
  const missing = required.filter((dt) => !have.has(dt));
  return { ok: missing.length === 0, missing, required };
}

async function canExecuteStage(chain, chainOrderId, lo, stageCode) {
  const legType = lo.legType || lo.logisticsDomain;
  const cross = STAGE_CROSS_GATES[legType]?.[stageCode];
  if (cross && !(await upstreamGateOk(chain, chainOrderId, cross))) return false;
  if (!(await canStartLeg(chain, chainOrderId, lo))) return false;
  const docGate = await docGateStatus(chain, chainOrderId, lo, stageCode);
  if (!docGate.ok) return false;
  return true;
}

/** 链订单上未闭环的异常事件 */
export async function getOpenExceptions(chain, chainOrderId) {
  const legLos = await legsForChain(chain, chainOrderId);
  const open = [];
  for (const lo of legLos) {
    const events = await chain.getEvents(lo.loId);
    for (const ex of events.filter((e) => e.type === 'EXCEPTION')) {
      const resolved = events.some(
        (r) => r.seq > ex.seq && (r.code === `${ex.code}_RESOLVED` || r.code === 'EXCEPTION_CLEARED')
      );
      if (!resolved) {
        open.push({
          loId: lo.loId,
          legType: lo.legType || lo.logisticsDomain,
          event: ex,
        });
      }
    }
  }
  return open;
}

/** 低概率注入演化异常（仅自动进化线程） */
export async function maybeInjectEvolutionException(chain, chainOrderId, { probability = 0.1 } = {}) {
  if (await getOpenExceptions(chain, chainOrderId).then((x) => x.length)) return null;
  const co = await chain.getChainOrder(chainOrderId);
  if (!co || ['settled', 'draft', 'settling'].includes(co.status)) return null;
  if (Math.random() > probability) return null;

  const legLos = await legsForChain(chain, chainOrderId);
  for (const scenario of EVOLUTION_EXCEPTIONS) {
    const lo = legLos.find((l) => (l.legType || l.logisticsDomain) === scenario.legType);
    if (!lo) continue;
    const done = await getLegDoneCodes(chain, lo.loId);
    if (!scenario.afterCodes.some((c) => codesSatisfy(done, [c]))) continue;
    if ([...done].some((c) => c === scenario.code)) continue;

    await chain.emitAction(lo.loId, {
      code: scenario.code,
      actor: scenario.actor,
      type: 'EXCEPTION',
      spatialCellId: lo.originCellId,
      payload: { autoEvolve: true, injected: true, label: scenario.labelZh },
    });
    return {
      loId: lo.loId,
      code: scenario.code,
      labelZh: `⚠ 注入异常：${scenario.labelZh}`,
    };
  }
  return null;
}

/** 闭环一条开放异常（进化优先于正常推进） */
export async function resolveNextException(chain, chainOrderId) {
  const open = await getOpenExceptions(chain, chainOrderId);
  if (!open.length) return null;
  const { loId, event: ex } = open[0];
  const lo = await chain.getLO(loId);
  const res = EXCEPTION_RESOLUTIONS[ex.code] || {
    code: 'EXCEPTION_CLEARED',
    actor: 'ops',
    labelZh: '异常闭环',
  };

  await chain.emitAction(loId, {
    code: res.code,
    actor: res.actor,
    spatialCellId: lo?.destCellId || lo?.originCellId,
    payload: { autoEvolve: true, resolves: ex.code, refSeq: ex.seq },
  });

  const events = await chain.getEvents(loId);
  const next = await appendEventToChain(events, {
    loId,
    type: 'DECISION',
    code: `${ex.code}_RESOLVED`,
    actor: 'system',
    spatialCellId: lo?.originCellId,
    payload: { refSeq: ex.seq, label: res.labelZh },
  });
  await chain.appendEvent(next[next.length - 1]);

  return {
    chainOrderId,
    loId,
    code: res.code,
    actor: res.actor,
    labelZh: res.labelZh,
    settlementId: null,
  };
}

async function maybeSpawnProcurementSettlement(chain, lo) {
  if (!lo?.chainOrderId) return null;
  const suffix = lo.chainOrderId.replace('CO-', '');
  const settlementId = `STL-PUR-${suffix}`;
  const existing = (await chain.listSettlements({ chainOrderId: lo.chainOrderId })).find(
    (s) => s.settlementId === settlementId
  );
  if (existing) return existing;
  const stl = createPeerSettlement({
    settlementId,
    chainOrderId: lo.chainOrderId,
    payerEnterpriseId: lo.ownerEnterpriseId,
    payeeEnterpriseId: lo.counterpartyEnterpriseId || 'ENT-YANQING-SUP',
    legLoId: lo.loId,
    feeType: 'procurement',
    title: '原料采购款 · 点对点',
    amount: 2480,
    lines: [{ lineNo: 1, name: '原料采购', qty: 1, uom: '批', price: 2480, amount: 2480 }],
    triggerCode: 'INVOICE_MATCHED',
  });
  await chain.local.putSettlement(stl);
  return stl;
}

/** 窥视下一业务步（含闸门阻塞原因，供人工作业台展示） */
export async function peekNextBusinessStep(chain, chainOrderId) {
  const co = await chain.getChainOrder(chainOrderId);
  if (!co || ['settled', 'draft'].includes(co.status)) return null;
  if ((await getOpenExceptions(chain, chainOrderId)).length) return null;

  const legLos = await legsForChain(chain, chainOrderId);
  legLos.sort((a, b) => (a.contract?.legSeq ?? 99) - (b.contract?.legSeq ?? 99));

  for (const lo of legLos) {
    const domain = getDomain(lo.logisticsDomain);
    if (!domain?.stages?.length) continue;
    const done = await getLegDoneCodes(chain, lo.loId);
    const next = domain.stages.find((s) => !done.has(s.code));
    if (!next) continue;

    const step = {
      chainOrderId,
      loId: lo.loId,
      legType: lo.legType || lo.logisticsDomain,
      code: next.code,
      actor: next.actor,
      labelZh: next.labelZh,
      spatialCellId: pickSpatialForStage(lo, next.code),
      reason: `${legMeta(lo.legType).labelZh} · 标准作业`,
    };

    if (await canExecuteStage(chain, chainOrderId, lo, next.code)) {
      return { ...step, canExecute: true, blockedReason: null };
    }

    const legType = lo.legType || lo.logisticsDomain;
    const docGate = await docGateStatus(chain, chainOrderId, lo, next.code);
    if (!docGate.ok) {
      return {
        ...step,
        canExecute: false,
        blockedReason: `待齐备单据：${docGate.missing.join('、')}（方可 ${next.labelZh}）`,
      };
    }
    const cross = STAGE_CROSS_GATES[legType]?.[next.code];
    if (cross && !(await upstreamGateOk(chain, chainOrderId, cross))) {
      return { ...step, canExecute: false, blockedReason: `上游作业未完成 · 暂不可 ${next.labelZh}` };
    }
    if (!(await canStartLeg(chain, chainOrderId, lo))) {
      return {
        ...step,
        canExecute: false,
        blockedReason: `链段未启动 · 等待上游 ${legMeta(lo.legType).labelZh}`,
      };
    }
    return { ...step, canExecute: false, blockedReason: '业务闸门未满足' };
  }
  return null;
}

/** 取链上「当前应推进」的一段及其下一业务动作（带真实业务闸门） */
export async function getNextBusinessStep(chain, chainOrderId) {
  const co = await chain.getChainOrder(chainOrderId);
  if (!co || ['settled', 'draft'].includes(co.status)) return null;

  if ((await getOpenExceptions(chain, chainOrderId)).length) return null;

  if (co.status === 'settling' || co.status === 'delivered') {
    return null;
  }

  const legLos = await legsForChain(chain, chainOrderId);
  legLos.sort((a, b) => (a.contract?.legSeq ?? 99) - (b.contract?.legSeq ?? 99));

  for (const lo of legLos) {
    const domain = getDomain(lo.logisticsDomain);
    if (!domain?.stages?.length) continue;
    const done = await getLegDoneCodes(chain, lo.loId);
    const next = domain.stages.find((s) => !done.has(s.code));
    if (!next) continue;
    if (!(await canExecuteStage(chain, chainOrderId, lo, next.code))) continue;
    return {
      chainOrderId,
      loId: lo.loId,
      legType: lo.legType || lo.logisticsDomain,
      code: next.code,
      actor: next.actor,
      labelZh: next.labelZh,
      spatialCellId: pickSpatialForStage(lo, next.code),
      reason: `${legMeta(lo.legType).labelZh} · 标准作业`,
    };
  }
  return null;
}

function pickSpatialForStage(lo, code) {
  const destCodes = new Set(['POD_SIGNED', 'POD_SCAN', 'DELIVERED', 'OUT_DELIVERY', 'IN_TRANSIT', 'ARRIVE_HUB']);
  if (destCodes.has(code)) return lo.destCellId || lo.originCellId;
  return lo.originCellId;
}

/** 描述当前链订单下一业务步的阻塞原因（供 UI 提示） */
export async function describeStageBlock(chain, chainOrderId) {
  const open = await getOpenExceptions(chain, chainOrderId);
  if (open.length) {
    const ex = open[0];
    const res = EXCEPTION_RESOLUTIONS[ex.event.code];
    return {
      kind: 'exception',
      labelZh: `异常待闭环：${ex.event.payload?.label || ex.event.code}${res ? ` → ${res.labelZh}` : ''}`,
    };
  }
  const co = await chain.getChainOrder(chainOrderId);
  if (!co || ['settled', 'draft'].includes(co.status)) return null;
  const legLos = await legsForChain(chain, chainOrderId);
  legLos.sort((a, b) => (a.contract?.legSeq ?? 99) - (b.contract?.legSeq ?? 99));
  for (const lo of legLos) {
    const domain = getDomain(lo.logisticsDomain);
    if (!domain?.stages?.length) continue;
    const done = await getLegDoneCodes(chain, lo.loId);
    const next = domain.stages.find((s) => !done.has(s.code));
    if (!next) continue;
    const docGate = await docGateStatus(chain, chainOrderId, lo, next.code);
    if (!docGate.ok) {
      return {
        kind: 'doc',
        labelZh: `待齐备单据：${docGate.missing.join('、')}（方可 ${next.labelZh}）`,
        missing: docGate.missing,
      };
    }
    const legType = lo.legType || lo.logisticsDomain;
    const cross = STAGE_CROSS_GATES[legType]?.[next.code];
    if (cross && !(await upstreamGateOk(chain, chainOrderId, cross))) {
      return { kind: 'gate', labelZh: `上游闸门未满足 · 暂不可 ${next.labelZh}` };
    }
    if (!(await canStartLeg(chain, chainOrderId, lo))) {
      return { kind: 'gate', labelZh: `链段未启动 · 等待上游 ${legMeta(lo.legType).labelZh}` };
    }
    return null;
  }
  return null;
}

/** 推进一条链订单的下一个真实业务步骤 */
export async function advanceChainOrderStep(chain, chainOrderId) {
  const exStep = await resolveNextException(chain, chainOrderId);
  if (exStep) return { done: false, step: exStep, phase: 'exception' };

  const co = await chain.getChainOrder(chainOrderId);
  if (co?.status === 'settling') {
    const stlStep = await evolveSettlementStep(chain, chainOrderId);
    if (stlStep) return { done: false, step: stlStep, phase: 'settlement' };
    return { done: true, chainOrderId, phase: 'settlement' };
  }

  const step = await getNextBusinessStep(chain, chainOrderId);
  if (!step) return { done: true, chainOrderId };

  const evt = await chain.emitAction(step.loId, {
    code: step.code,
    actor: step.actor,
    spatialCellId: step.spatialCellId,
    payload: { businessAdvance: true, autoEvolve: true, label: step.labelZh },
  });
  return { done: false, step, evt, phase: 'fulfillment' };
}

/** 结算链自动进化：对账 → 开票 → 付款（每 tick 推进一步） */
export async function evolveSettlementStep(chain, chainOrderId) {
  const stls = await chain.listSettlements({ chainOrderId });
  const order = ['pending_recon', 'confirmed', 'invoiced', 'paid'];
  for (const stl of stls.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))) {
    if (stl.status === 'pending_recon') {
      await advanceSettlement(chain, stl.settlementId, 'confirm');
      return {
        chainOrderId,
        loId: stl.legLoId,
        code: 'RECON_CONFIRM',
        actor: 'finance',
        labelZh: `收款方确认对账 · ${stl.title}`,
        settlementId: stl.settlementId,
      };
    }
    if (stl.status === 'confirmed') {
      await advanceSettlement(chain, stl.settlementId, 'invoice');
      return {
        chainOrderId,
        code: 'INVOICE_ISSUED',
        actor: 'finance',
        labelZh: `付款方开票 · ${stl.title}`,
        settlementId: stl.settlementId,
      };
    }
    if (stl.status === 'invoiced') {
      await advanceSettlement(chain, stl.settlementId, 'pay');
      return {
        chainOrderId,
        code: 'PAYMENT_DONE',
        actor: 'finance',
        labelZh: `付款完成 · ${stl.title}`,
        settlementId: stl.settlementId,
      };
    }
  }
  return null;
}

/** 系统进化心跳：按真实业务优先级推进一条链 */
export async function runBusinessEvolutionTick(chain, { viewerEnterpriseId } = {}) {
  let orders = await chain.listChainOrders(
    viewerEnterpriseId ? { viewerEnterpriseId } : {}
  );
  const autoPilot = (await chain.local.getMeta('auto_pilot')) === '1';
  if (autoPilot) {
    for (const co of (await chain.listChainOrders(viewerEnterpriseId ? { viewerEnterpriseId } : {})).filter((c) => c.status === 'draft')) {
      const f = await advanceShipperOrderFlow(chain, co.chainOrderId);
      if (f?.step && !f.done) return { ...f, chainOrderId: co.chainOrderId };
    }
  }
  orders = orders.filter((co) => co.status !== 'settled' && co.status !== 'draft');

  const views = await Promise.all(
    orders.map(async (co) => ({
      co,
      view: await projectChainOrder(chain, co),
    }))
  );

  views.sort((a, b) => {
    const pa = STATUS_PRIORITY[a.view.status] ?? 9;
    const pb = STATUS_PRIORITY[b.view.status] ?? 9;
    if (pa !== pb) return pa - pb;
    return (b.view.lastEventAt || '').localeCompare(a.view.lastEventAt || '');
  });

  for (const { co } of views) {
    const injected = await maybeInjectEvolutionException(chain, co.chainOrderId);
    if (injected) {
      return {
        done: false,
        step: injected,
        phase: 'exception_inject',
        chainOrderId: co.chainOrderId,
      };
    }
    if (autoPilot) {
      const result = await advanceChainOrderStep(chain, co.chainOrderId);
      if (!result.done || result.phase === 'settlement' || result.phase === 'exception') {
        return { ...result, chainOrderId: co.chainOrderId };
      }
    }
  }
  return null;
}

/** 货主销售侧创建全新链订单（全段裂变） */
export async function createChainFromSales(chain, partial) {
  const suffix = `${Date.now().toString(36)}`;
  const chainOrderId = partial.chainOrderId || `CO-${suffix}`;
  const anchor = partial.anchorEnterpriseId || 'ENT-LUWEI-BRAND';
  const cargo = partial.cargoSummary || partial.cargo || '供应链货品';
  const participants = partial.participants || DEMO_CHAIN_ORDER.participants;
  const orderLines = partial.orderLines?.length ? partial.orderLines : orderLinesFromCargo(cargo, partial);
  const soNo = partial.customerRef || `SO-${suffix.toUpperCase()}`;

  const loIds = {
    pur: `LO-PUR-${suffix}`,
    mfg: `LO-MFG-${suffix}`,
    whi: `LO-WHI-${suffix}`,
    sal: `LO-SAL-${suffix}`,
    lhl: `LO-LHL-${suffix}`,
    exp: `LO-EXP-${suffix}`,
  };

  const los = [
    createLO({
      loId: loIds.sal,
      chainOrderId,
      legType: 'sales',
      logisticsDomain: 'sales',
      ownerEnterpriseId: anchor,
      primaryActor: 'shipper',
      originCellId: 'bj-dc-shunyi',
      destCellId: 'bj-west-hub',
      contract: { legSeq: 4, cargo, soNo },
      links: [
        createChainLink({ rel: 'upstream', targetLoId: loIds.pur, label: '原料采购' }),
        createChainLink({ rel: 'downstream', targetLoId: loIds.whi, label: '仓配' }),
      ],
    }),
    createLO({
      loId: loIds.pur,
      chainOrderId,
      legType: 'procurement',
      logisticsDomain: 'procurement',
      ownerEnterpriseId: anchor,
      counterpartyEnterpriseId: 'ENT-YANQING-SUP',
      primaryActor: 'purchaser',
      originCellId: 'bj-yanqing-cell',
      destCellId: 'bj-dc-shunyi',
      contract: { legSeq: 1, cargo: `${cargo}·原料`, poNo: `PO-${suffix}` },
      links: [
        createChainLink({ rel: 'downstream', targetLoId: loIds.mfg, label: '送厂' }),
        createChainLink({ rel: 'downstream', targetLoId: loIds.whi, label: '原料入仓' }),
      ],
    }),
    createLO({
      loId: loIds.mfg,
      chainOrderId,
      legType: 'production',
      logisticsDomain: 'production',
      ownerEnterpriseId: anchor,
      primaryActor: 'planner',
      originCellId: 'bj-dc-shunyi',
      destCellId: 'bj-dc-shunyi',
      contract: { legSeq: 2, cargo: `${cargo}·加工` },
      links: [createChainLink({ rel: 'downstream', targetLoId: loIds.whi, label: '成品入仓' })],
    }),
    createLO({
      loId: loIds.whi,
      chainOrderId,
      legType: 'warehouse_internal',
      logisticsDomain: 'warehouse_internal',
      facilityTier: 'dc',
      ownerEnterpriseId: 'ENT-LOT-3PL',
      counterpartyEnterpriseId: anchor,
      primaryActor: 'warehouse',
      originCellId: 'bj-dc-shunyi',
      destCellId: 'bj-dc-shunyi',
      contract: { legSeq: 3, cargo, tier: 'dc' },
      links: [createChainLink({ rel: 'downstream', targetLoId: loIds.lhl, label: '出库' })],
    }),
    createLO({
      loId: loIds.lhl,
      chainOrderId,
      legType: 'linehaul',
      logisticsDomain: 'linehaul',
      ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
      counterpartyEnterpriseId: anchor,
      primaryActor: 'dispatcher',
      originCellId: 'bj-dc-shunyi',
      destCellId: 'bj-west-hub',
      contract: { legSeq: 5, cargo, waybill: `WB-${suffix}` },
      links: [createChainLink({ rel: 'downstream', targetLoId: loIds.exp, label: '末端' })],
    }),
    createLO({
      loId: loIds.exp,
      chainOrderId,
      legType: 'express',
      logisticsDomain: 'express',
      ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
      counterpartyEnterpriseId: anchor,
      primaryActor: 'driver',
      originCellId: 'bj-west-hub',
      destCellId: 'bj-west-hub',
      contract: { legSeq: 6, cargo, consignee: partial.consignee || '终端用户' },
      links: [],
    }),
  ];

  const co = createChainOrder({
    chainOrderId,
    anchorEnterpriseId: anchor,
    anchorGroupId: partial.anchorGroupId || 'GRP-BRAND-A',
    title: partial.title || `链订单 ${suffix}`,
    cargoSummary: cargo,
    status: 'draft',
    upstreamExpanded: false,
    salesFlowComplete: false,
    customerRef: soNo,
    consignee: partial.consignee || '终端客户',
    orderLines,
    intakeSource: partial.source || partial.intakeSource || 'manual',
    intakeMeta: partial.intakeMeta || null,
    laneType: partial.laneType || 'domestic',
    participants,
    legLoIds: Object.values(loIds),
  });

  await chain.putChainOrder(co);
  for (const lo of los) await chain.putLODirect(lo);
  return { chainOrder: await chain.getChainOrder(chainOrderId), salesLoId: loIds.sal, pendingFirstStep: 'SO_DRAFT' };
}

/** 统一业务事件入口（emitAction 之后调用） */
export async function onBusinessEvent(chain, loId, code) {
  const lo = await chain.getLO(loId);
  if (!lo) return null;

  if (lo.chainOrderId) {
    const co = await chain.getChainOrder(lo.chainOrderId);
    if (co && code === 'CHAIN_START' && lo.legType === 'sales' && !co.upstreamExpanded) {
      await expandUpstreamProcurement(chain, co, lo);
    }
    if (co && SHIPPER_FLOW_CODES.has(code) && lo.legType === 'sales') {
      const st = SHIPPER_ORDER_FLOW.find((s) => s.code === code);
      if (st) await upsertShipperFlowDoc(chain, lo, co, st);
    }
    await maybeChainHandoff(chain, lo, code);
    await maybeSpawnDocument(chain, lo, code);

    if (code === 'INVOICE_MATCHED' && lo.legType === 'procurement') {
      await maybeSpawnProcurementSettlement(chain, lo);
    }

    if (POD_CODES.has(code) && lo.legType === 'express') {
      const salesLeg = await findLegLo(chain, lo.chainOrderId, 'sales');
      if (salesLeg) {
        const se = await chain.getEvents(salesLeg.loId);
        if (!se.some((e) => POD_CODES.has(e.code))) {
          await chain.emitAction(salesLeg.loId, {
            code: 'POD_SIGNED',
            actor: 'shipper',
            spatialCellId: salesLeg.destCellId,
            payload: { syncFrom: loId },
          });
        }
      }
    }
  }
  return lo;
}

export function settlementActionsForViewer(viewerEnterpriseId, stl) {
  const actions = [];
  if (stl.payeeEnterpriseId === viewerEnterpriseId && stl.status === 'pending_recon') {
    actions.push({ id: 'confirm', label: '确认对账' });
  }
  if (stl.payerEnterpriseId === viewerEnterpriseId) {
    if (stl.status === 'confirmed') actions.push({ id: 'invoice', label: '开票' });
    if (stl.status === 'invoiced') actions.push({ id: 'pay', label: '付款' });
  }
  return actions;
}

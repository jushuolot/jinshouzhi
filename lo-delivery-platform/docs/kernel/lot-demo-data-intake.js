/**
 * v11 货主下单种子 — 草稿链订单 + 销售五步流程事件 + SO/PR/CO 单据
 */
import { createLO, createChainLink } from './lot-nucleus.js';
import { createChainOrder } from './lot-chain-order.js';
import { createDocument } from './lot-documents.js';

const SEED_PARTICIPANTS = [
  { enterpriseId: 'ENT-LUWEI-BRAND', groupId: 'GRP-BRAND-A', role: 'shipper' },
  { enterpriseId: 'ENT-YANQING-SUP', groupId: 'GRP-SUP-C', role: 'supplier' },
  { enterpriseId: 'ENT-LOT-3PL', groupId: 'GRP-LOG-B', role: 'warehouse' },
  { enterpriseId: 'ENT-ZHOU-CARRIER', groupId: 'GRP-LOG-B', role: 'carrier' },
];

export const DEMO_ORDER_LINES = [
  {
    lineNo: 1,
    sku: 'SKU-MAIN-01',
    name: '智能终端整机',
    spec: '标准版',
    qty: 120,
    uom: '件',
    price: 1280,
    amount: 153600,
  },
];

export const DEMO_SALES_ORDER_API = {
  externalId: 'ERP-SO-88421',
  title: 'API 接入订单 · 华北履约',
  cargoSummary: '智能终端整机',
  consignee: '北京朝阳经销商',
  customerRef: 'SO-API-88421',
  lines: [
    { sku: 'SKU-MAIN-01', name: '智能终端整机', spec: '旗舰版', qty: 80, uom: '件', price: 1380 },
  ],
};

const DRAFT_ID = 'CO-SEED-INTAKE-DRAFT';
const DRAFT_SUFFIX = 'INTAKE-DRAFT';
const FLOW_ID = 'CO-SEED-INTAKE-FLOW';
const FLOW_SUFFIX = 'INTAKE-FLOW';

function intakeLos(chainOrderId, suffix, anchor = 'ENT-LUWEI-BRAND', cargo = '智能终端整机') {
  const ids = {
    pur: `LO-PUR-${suffix}`,
    mfg: `LO-MFG-${suffix}`,
    whi: `LO-WHI-${suffix}`,
    sal: `LO-SAL-${suffix}`,
    lhl: `LO-LHL-${suffix}`,
    exp: `LO-EXP-${suffix}`,
  };
  return {
    ids,
    los: [
      createLO({
        loId: ids.sal,
        chainOrderId,
        legType: 'sales',
        logisticsDomain: 'sales',
        ownerEnterpriseId: anchor,
        channel: 'seed-intake',
        primaryActor: 'shipper',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 4, cargo, soNo: `SO-SEED-${suffix}` },
        links: [
          createChainLink({ rel: 'upstream', targetLoId: ids.pur, label: '原料采购' }),
          createChainLink({ rel: 'downstream', targetLoId: ids.whi, label: '仓配' }),
        ],
      }),
      createLO({
        loId: ids.pur,
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
          createChainLink({ rel: 'downstream', targetLoId: ids.mfg, label: '送厂' }),
          createChainLink({ rel: 'downstream', targetLoId: ids.whi, label: '原料入仓' }),
        ],
      }),
      createLO({
        loId: ids.mfg,
        chainOrderId,
        legType: 'production',
        logisticsDomain: 'production',
        ownerEnterpriseId: anchor,
        primaryActor: 'planner',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-dc-shunyi',
        contract: { legSeq: 2, cargo: `${cargo}·生产` },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.whi, label: '成品入仓' })],
      }),
      createLO({
        loId: ids.whi,
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
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.lhl, label: '出库' })],
      }),
      createLO({
        loId: ids.lhl,
        chainOrderId,
        legType: 'linehaul',
        logisticsDomain: 'linehaul',
        ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
        counterpartyEnterpriseId: anchor,
        primaryActor: 'dispatcher',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 5, cargo, waybill: `WB-${suffix}` },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.exp, label: '末端' })],
      }),
      createLO({
        loId: ids.exp,
        chainOrderId,
        legType: 'express',
        logisticsDomain: 'express',
        ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
        counterpartyEnterpriseId: anchor,
        primaryActor: 'driver',
        originCellId: 'bj-west-hub',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 6, cargo, consignee: '北京终端客户' },
        links: [],
      }),
    ],
  };
}

const draftPack = intakeLos(DRAFT_ID, DRAFT_SUFFIX);
const flowPack = intakeLos(FLOW_ID, FLOW_SUFFIX);

export const DEMO_INTAKE_DRAFT_ORDER = createChainOrder({
  chainOrderId: DRAFT_ID,
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '种子订单 · 货主草拟中',
  cargoSummary: '智能终端整机',
  status: 'draft',
  upstreamExpanded: false,
  salesFlowComplete: false,
  customerRef: 'SO-SEED-INTAKE-DRAFT',
  consignee: '北京海淀终端客户',
  orderLines: DEMO_ORDER_LINES,
  intakeSource: 'manual',
  intakeMeta: { source: 'manual', importedAt: '2026-06-09T00:00:00.000Z', seed: 'v11' },
  participants: SEED_PARTICIPANTS,
  legLoIds: Object.values(draftPack.ids),
});

export const DEMO_INTAKE_FLOW_ORDER = createChainOrder({
  chainOrderId: FLOW_ID,
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '种子订单 · 审单待下达',
  cargoSummary: '智能终端整机',
  status: 'draft',
  upstreamExpanded: false,
  salesFlowComplete: false,
  customerRef: 'SO-SEED-INTAKE-FLOW',
  consignee: '北京朝阳经销商',
  orderLines: DEMO_ORDER_LINES,
  intakeSource: 'api',
  intakeMeta: { source: 'api', apiUrl: 'demo', importedAt: '2026-06-09T00:00:00.000Z', seed: 'v11' },
  participants: SEED_PARTICIPANTS,
  legLoIds: Object.values(flowPack.ids),
});

export const DEMO_INTAKE_LOS = [...draftPack.los, ...flowPack.los];

export const DEMO_INTAKE_EVENTS = new Map([
  [`LO-SAL-${DRAFT_SUFFIX}`, [
    {
      type: 'FACT',
      code: 'SO_DRAFT',
      actor: 'shipper',
      spatialCellId: 'bj-dc-shunyi',
      payload: { seed: 'v11', msg: '种子：草拟销售订单' },
    },
  ]],
  [`LO-SAL-${FLOW_SUFFIX}`, [
    {
      type: 'FACT',
      code: 'SO_DRAFT',
      actor: 'shipper',
      spatialCellId: 'bj-dc-shunyi',
      payload: { seed: 'v11' },
    },
    {
      type: 'FACT',
      code: 'SO_APPROVED',
      actor: 'shipper',
      spatialCellId: 'bj-dc-shunyi',
      payload: { seed: 'v11', msg: '种子：销售审单通过' },
    },
  ]],
]);

/** 将 v9 生态链主单销售段补齐五步流程（幂等） */
export const ECO_SALES_FLOW_PREFIX = [
  { type: 'FACT', code: 'SO_DRAFT', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: { seed: 'v11-retrofit' } },
  { type: 'FACT', code: 'SO_APPROVED', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: { seed: 'v11-retrofit' } },
  { type: 'FACT', code: 'ORDER_CREATED', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: { origin: 'sales', msg: '货主创建销售订单' } },
  { type: 'FACT', code: 'MRP_EXPLODE', actor: 'planner', spatialCellId: 'bj-dc-shunyi', payload: { seed: 'v11-retrofit' } },
  { type: 'FACT', code: 'CHAIN_START', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: { seed: 'v11-retrofit', msg: '激活全链履约' } },
];

export const DEMO_INTAKE_DOCUMENTS = [
  createDocument({
    docId: 'DOC-SO-SEED-INTAKE-DRAFT',
    docType: 'SO',
    loId: `LO-SAL-${DRAFT_SUFFIX}`,
    status: 'draft',
    header: {
      docNo: 'SO-SEED-INTAKE-DRAFT',
      title: '销售订单 · 智能终端整机',
      partyFrom: 'ENT-LUWEI-BRAND',
      partyTo: '北京海淀终端客户',
      amount: 153600,
    },
    lines: DEMO_ORDER_LINES,
    links: [{ loId: `LO-SAL-${DRAFT_SUFFIX}`, rel: 'source' }],
  }),
  createDocument({
    docId: 'DOC-SO-SEED-INTAKE-FLOW',
    docType: 'SO',
    loId: `LO-SAL-${FLOW_SUFFIX}`,
    status: 'approved',
    header: {
      docNo: 'SO-SEED-INTAKE-FLOW',
      title: '销售订单 · 审单待下达',
      partyFrom: 'ENT-LUWEI-BRAND',
      partyTo: '北京朝阳经销商',
      amount: 153600,
    },
    lines: DEMO_ORDER_LINES,
    links: [{ loId: `LO-SAL-${FLOW_SUFFIX}`, rel: 'source' }],
  }),
];

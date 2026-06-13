/**
 * 生态链种子：货主销售建链 → 上游采购 → 仓运配 → 签收 → 点对点结算
 */
import { createLO, createChainLink } from './lot-nucleus.js';
import { createChainOrder } from './lot-chain-order.js';
import { createPeerSettlement } from './lot-settlement.js';
import { GROUPS, ENTERPRISES } from './lot-ecosystem.js';
import { DEMO_ORDER_LINES, ECO_SALES_FLOW_PREFIX } from './lot-demo-data-intake.js';

export { GROUPS, ENTERPRISES };

const CO_ID = 'CO-2024-ECO-001';
const SUFFIX = '2024-ECO-001';

export const DEMO_CHAIN_ORDER = createChainOrder({
  chainOrderId: CO_ID,
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '智能终端整机 · 华北履约',
  cargoSummary: '原料模组 + 成品整机 → 北京用户',
  status: 'in_transit',
  upstreamExpanded: true,
  customerRef: 'SO-LUWEI-88421',
  consignee: '北京终端用户',
  orderLines: DEMO_ORDER_LINES,
  intakeSource: 'api',
  salesFlowComplete: true,
  participants: [
    { enterpriseId: 'ENT-LUWEI-BRAND', groupId: 'GRP-BRAND-A', role: 'shipper' },
    { enterpriseId: 'ENT-YANQING-SUP', groupId: 'GRP-SUP-C', role: 'supplier' },
    { enterpriseId: 'ENT-LOT-3PL', groupId: 'GRP-LOG-B', role: 'warehouse' },
    { enterpriseId: 'ENT-ZHOU-CARRIER', groupId: 'GRP-LOG-B', role: 'carrier' },
  ],
  legLoIds: [
    `LO-PUR-${SUFFIX}`,
    `LO-WHI-${SUFFIX}`,
    `LO-SAL-${SUFFIX}`,
    `LO-LHL-${SUFFIX}`,
    `LO-EXP-${SUFFIX}`,
  ],
});

export const DEMO_ECO_LOS = [
  createLO({
    loId: `LO-SAL-${SUFFIX}`,
    chainOrderId: CO_ID,
    legType: 'sales',
    logisticsDomain: 'sales',
    ownerEnterpriseId: 'ENT-LUWEI-BRAND',
    channel: 'brand-so',
    primaryActor: 'shipper',
    originCellId: 'bj-dc-shunyi',
    destCellId: 'bj-west-hub',
    contract: {
      legSeq: 3,
      cargo: '智能终端整机',
      soNo: 'SO-LUWEI-88421',
    },
    links: [
      createChainLink({ rel: 'downstream', targetLoId: `LO-WHI-${SUFFIX}`, label: '触发仓配' }),
      createChainLink({ rel: 'upstream', targetLoId: `LO-PUR-${SUFFIX}`, label: '原料采购' }),
    ],
  }),
  createLO({
    loId: `LO-PUR-${SUFFIX}`,
    chainOrderId: CO_ID,
    legType: 'procurement',
    logisticsDomain: 'procurement',
    ownerEnterpriseId: 'ENT-LUWEI-BRAND',
    counterpartyEnterpriseId: 'ENT-YANQING-SUP',
    channel: 'upstream-expand',
    primaryActor: 'purchaser',
    originCellId: 'bj-yanqing-cell',
    destCellId: 'bj-dc-shunyi',
    contract: { legSeq: 1, cargo: '电子原料模组', poNo: 'PO-UP-88421' },
    links: [
      createChainLink({ rel: 'upstream', externalRef: 'ENT-YANQING-SUP', label: '供应商延庆' }),
      createChainLink({ rel: 'downstream', targetLoId: `LO-WHI-${SUFFIX}`, label: '原料入仓' }),
    ],
  }),
  createLO({
    loId: `LO-WHI-${SUFFIX}`,
    chainOrderId: CO_ID,
    legType: 'warehouse_internal',
    logisticsDomain: 'warehouse_internal',
    facilityTier: 'dc',
    ownerEnterpriseId: 'ENT-LOT-3PL',
    counterpartyEnterpriseId: 'ENT-LUWEI-BRAND',
    channel: '3pl-dc',
    primaryActor: 'warehouse',
    originCellId: 'bj-dc-shunyi',
    destCellId: 'bj-dc-shunyi',
    contract: { legSeq: 2, cargo: '原料+成品混合作业', tier: 'dc' },
    links: [
      createChainLink({ rel: 'upstream', targetLoId: `LO-PUR-${SUFFIX}`, label: '采购到货' }),
      createChainLink({ rel: 'downstream', targetLoId: `LO-LHL-${SUFFIX}`, label: '出库交接' }),
    ],
  }),
  createLO({
    loId: `LO-LHL-${SUFFIX}`,
    chainOrderId: CO_ID,
    legType: 'linehaul',
    logisticsDomain: 'linehaul',
    ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
    counterpartyEnterpriseId: 'ENT-LUWEI-BRAND',
    channel: 'contract-linehaul',
    primaryActor: 'dispatcher',
    originCellId: 'bj-dc-shunyi',
    destCellId: 'bj-west-hub',
    contract: { legSeq: 4, cargo: '整机干线', waybill: 'WB-88421' },
    links: [
      createChainLink({ rel: 'upstream', targetLoId: `LO-WHI-${SUFFIX}`, label: '仓出' }),
      createChainLink({ rel: 'downstream', targetLoId: `LO-EXP-${SUFFIX}`, label: '枢纽落地' }),
    ],
  }),
  createLO({
    loId: `LO-EXP-${SUFFIX}`,
    chainOrderId: CO_ID,
    legType: 'express',
    logisticsDomain: 'express',
    ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
    counterpartyEnterpriseId: 'ENT-LUWEI-BRAND',
    channel: 'last-mile',
    primaryActor: 'driver',
    originCellId: 'bj-west-hub',
    destCellId: 'bj-west-hub',
    contract: { legSeq: 5, cargo: '末端配送', consignee: '北京用户' },
    links: [createChainLink({ rel: 'upstream', targetLoId: `LO-LHL-${SUFFIX}`, label: '干线到货' })],
  }),
];

/** 事件历史：反映实时态势（非播放剧本） */
export const DEMO_ECO_EVENTS = new Map([
  [`LO-SAL-${SUFFIX}`, [
    ...ECO_SALES_FLOW_PREFIX,
    { type: 'FACT', code: 'ALLOCATION', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: { msg: '库存分配' } },
  ]],
  [`LO-PUR-${SUFFIX}`, [
    { type: 'FACT', code: 'PO_ISSUED', actor: 'purchaser', spatialCellId: 'bj-yanqing-cell', payload: { msg: '上游采购展开' } },
    { type: 'FACT', code: 'SUPPLIER_CONFIRM', actor: 'supplier', spatialCellId: 'bj-yanqing-cell', payload: {} },
    { type: 'FACT', code: 'INBOUND_ARRIVAL', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: {} },
  ]],
  [`LO-WHI-${SUFFIX}`, [
    { type: 'FACT', code: 'DOCK_CHECKIN', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: {} },
    { type: 'FACT', code: 'PICK_PACK', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: {} },
    { type: 'FACT', code: 'LOADED', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: {} },
  ]],
  [`LO-LHL-${SUFFIX}`, [
    { type: 'FACT', code: 'LOAD_PLAN', actor: 'dispatcher', spatialCellId: 'bj-dc-shunyi', payload: {} },
    { type: 'FACT', code: 'IN_TRANSIT', actor: 'driver', spatialCellId: 'bj-west-hub', payload: { msg: '在途' } },
  ]],
  [`LO-EXP-${SUFFIX}`, [
    { type: 'FACT', code: 'PICKUP_REQ', actor: 'dispatcher', spatialCellId: 'bj-west-hub', payload: {} },
  ]],
]);

/** 第二条：已签收待结算 */
export const DEMO_CHAIN_ORDER_SETTLING = createChainOrder({
  chainOrderId: 'CO-2024-ECO-002',
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '消费电器 · 上月订单',
  cargoSummary: '已签收 · 待点对点结算',
  status: 'settling',
  upstreamExpanded: true,
  legLoIds: [`LO-SAL-2024-ECO-002`],
  participants: DEMO_CHAIN_ORDER.participants,
});

export const DEMO_SETTLEMENTS = [
  createPeerSettlement({
    settlementId: 'STL-FREIGHT-ECO-002',
    chainOrderId: 'CO-2024-ECO-002',
    payerEnterpriseId: 'ENT-LUWEI-BRAND',
    payeeEnterpriseId: 'ENT-ZHOU-CARRIER',
    legLoId: 'LO-LHL-2024-ECO-002',
    feeType: 'freight',
    title: '干线运费',
    amount: 3200,
    status: 'confirmed',
    lines: [{ lineNo: 1, name: '干线', qty: 1, uom: '票', price: 3200, amount: 3200 }],
  }),
  createPeerSettlement({
    settlementId: 'STL-WH-ECO-002',
    chainOrderId: 'CO-2024-ECO-002',
    payerEnterpriseId: 'ENT-LUWEI-BRAND',
    payeeEnterpriseId: 'ENT-LOT-3PL',
    feeType: 'warehouse',
    title: '仓储费',
    amount: 980,
    status: 'pending_recon',
    lines: [{ lineNo: 1, name: '仓储操作', qty: 1, uom: '票', price: 980, amount: 980 }],
  }),
];

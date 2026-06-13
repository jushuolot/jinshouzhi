/**
 * v12 全球供应链种子 — 跨境海运 · 中欧铁路 · 医药冷链
 */
import { createLO, createChainLink } from './lot-nucleus.js';
import { createChainOrder } from './lot-chain-order.js';
import { createDocument } from './lot-documents.js';

export const DEMO_SPATIAL_GLOBAL = [
  { id: 'shenzhen', level: 'metro', parentId: 'cn', labelZh: '深圳', labelEn: 'Shenzhen', lat: 22.543, lng: 114.057 },
  { id: 'sz-yantian-port', level: 'port', parentId: 'shenzhen', labelZh: '盐田港', labelEn: 'Yantian Port', lat: 22.587, lng: 114.272 },
  { id: 'eu', level: 'region', parentId: 'earth', labelZh: '欧洲', labelEn: 'Europe', lat: 50.85, lng: 4.35 },
  { id: 'netherlands', level: 'nation', parentId: 'eu', labelZh: '荷兰', labelEn: 'Netherlands', lat: 52.132, lng: 5.291 },
  { id: 'rotterdam', level: 'metro', parentId: 'netherlands', labelZh: '鹿特丹', labelEn: 'Rotterdam', lat: 51.924, lng: 4.477 },
  { id: 'eu-rotterdam-port', level: 'port', parentId: 'rotterdam', labelZh: '鹿特丹港', labelEn: 'Port of Rotterdam', lat: 51.949, lng: 4.142 },
  { id: 'eu-hub-rtm', level: 'hub', parentId: 'rotterdam', labelZh: '鹿特丹 DC', labelEn: 'Rotterdam DC', lat: 51.92, lng: 4.48 },
  { id: 'de-duisburg', level: 'hub', parentId: 'eu', labelZh: '杜伊斯堡枢纽', labelEn: 'Duisburg Hub', lat: 51.434, lng: 6.762 },
];

const GLOBAL_PARTICIPANTS = [
  { enterpriseId: 'ENT-LUWEI-BRAND', groupId: 'GRP-BRAND-A', role: 'shipper' },
  { enterpriseId: 'ENT-GLOBAL-FWD', groupId: 'GRP-LOG-B', role: 'forwarder' },
  { enterpriseId: 'ENT-ZHOU-CARRIER', groupId: 'GRP-LOG-B', role: 'carrier' },
  { enterpriseId: 'ENT-EU-3PL', groupId: 'GRP-LOG-B', role: 'warehouse' },
];

const SEA_ID = 'CO-GLOBAL-SEA-001';
const SEA_SUF = 'GLOBAL-SEA';
const COLD_ID = 'CO-GLOBAL-COLD-001';
const COLD_SUF = 'GLOBAL-COLD';

function seaLos() {
  const ids = {
    sal: `LO-SAL-${SEA_SUF}`,
    cus: `LO-CUS-${SEA_SUF}`,
    ocn: `LO-OCN-${SEA_SUF}`,
    whi: `LO-WHI-${SEA_SUF}`,
    ral: `LO-RAL-${SEA_SUF}`,
    exp: `LO-EXP-${SEA_SUF}`,
  };
  return {
    ids,
    los: [
      createLO({
        loId: ids.sal,
        chainOrderId: SEA_ID,
        legType: 'sales',
        logisticsDomain: 'sales',
        ownerEnterpriseId: 'ENT-LUWEI-BRAND',
        channel: 'global-so',
        primaryActor: 'shipper',
        originCellId: 'shenzhen',
        destCellId: 'eu-hub-rtm',
        contract: { legSeq: 1, cargo: '消费电子整机', soNo: 'SO-GLOBAL-88421' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.cus, label: '出口报关' })],
      }),
      createLO({
        loId: ids.cus,
        chainOrderId: SEA_ID,
        legType: 'customs',
        logisticsDomain: 'customs',
        ownerEnterpriseId: 'ENT-GLOBAL-FWD',
        primaryActor: 'customs_broker',
        originCellId: 'sz-yantian-port',
        destCellId: 'sz-yantian-port',
        contract: { legSeq: 2, cargo: '出口清关', declaration: 'DEC-CN-88421' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.ocn, label: '装船' })],
      }),
      createLO({
        loId: ids.ocn,
        chainOrderId: SEA_ID,
        legType: 'ocean',
        logisticsDomain: 'ocean',
        ownerEnterpriseId: 'ENT-GLOBAL-FWD',
        primaryActor: 'dispatcher',
        originCellId: 'sz-yantian-port',
        destCellId: 'eu-rotterdam-port',
        contract: { legSeq: 3, cargo: 'FCL 40HQ', vessel: 'EVER GOLDEN', voyage: 'V-2026-18' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.whi, label: '到港' })],
      }),
      createLO({
        loId: ids.whi,
        chainOrderId: SEA_ID,
        legType: 'warehouse_internal',
        logisticsDomain: 'warehouse_internal',
        ownerEnterpriseId: 'ENT-EU-3PL',
        primaryActor: 'warehouse',
        originCellId: 'eu-rotterdam-port',
        destCellId: 'eu-hub-rtm',
        contract: { legSeq: 4, cargo: '保税仓作业', tier: 'dc' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.ral, label: '铁路' })],
      }),
      createLO({
        loId: ids.ral,
        chainOrderId: SEA_ID,
        legType: 'rail',
        logisticsDomain: 'rail',
        ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
        primaryActor: 'dispatcher',
        originCellId: 'eu-hub-rtm',
        destCellId: 'de-duisburg',
        contract: { legSeq: 5, cargo: '中欧班列', train: 'X8098' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.exp, label: '末端' })],
      }),
      createLO({
        loId: ids.exp,
        chainOrderId: SEA_ID,
        legType: 'express',
        logisticsDomain: 'express',
        ownerEnterpriseId: 'ENT-EU-3PL',
        primaryActor: 'driver',
        originCellId: 'de-duisburg',
        destCellId: 'de-duisburg',
        contract: { legSeq: 6, cargo: '末端配送', consignee: 'DE-B2B-客户' },
        links: [],
      }),
    ],
  };
}

function coldLos() {
  const ids = {
    sal: `LO-SAL-${COLD_SUF}`,
    col: `LO-COL-${COLD_SUF}`,
    lhl: `LO-LHL-${COLD_SUF}`,
    exp: `LO-EXP-${COLD_SUF}`,
  };
  return {
    ids,
    los: [
      createLO({
        loId: ids.sal,
        chainOrderId: COLD_ID,
        legType: 'sales',
        logisticsDomain: 'sales',
        ownerEnterpriseId: 'ENT-LUWEI-BRAND',
        channel: 'pharma-so',
        primaryActor: 'shipper',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 1, cargo: '医药冷链试剂', soNo: 'SO-COLD-9901' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.col, label: '冷链仓' })],
      }),
      createLO({
        loId: ids.col,
        chainOrderId: COLD_ID,
        legType: 'cold_chain',
        logisticsDomain: 'cold_chain',
        ownerEnterpriseId: 'ENT-LOT-3PL',
        primaryActor: 'warehouse',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-dc-shunyi',
        contract: { legSeq: 2, cargo: '2-8°C 温控', tempRange: '2-8' },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.lhl, label: '干线' })],
      }),
      createLO({
        loId: ids.lhl,
        chainOrderId: COLD_ID,
        legType: 'linehaul',
        logisticsDomain: 'linehaul',
        ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
        primaryActor: 'dispatcher',
        originCellId: 'bj-dc-shunyi',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 3, cargo: '冷藏干线', reefer: true },
        links: [createChainLink({ rel: 'downstream', targetLoId: ids.exp, label: '末端' })],
      }),
      createLO({
        loId: ids.exp,
        chainOrderId: COLD_ID,
        legType: 'express',
        logisticsDomain: 'express',
        ownerEnterpriseId: 'ENT-ZHOU-CARRIER',
        primaryActor: 'driver',
        originCellId: 'bj-west-hub',
        destCellId: 'bj-west-hub',
        contract: { legSeq: 4, cargo: '医院配送', consignee: '北京三甲医院' },
        links: [],
      }),
    ],
  };
}

const sea = seaLos();
const cold = coldLos();

export const DEMO_GLOBAL_SEA_ORDER = createChainOrder({
  chainOrderId: SEA_ID,
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '全球链 · 深圳→鹿特丹 海运+铁路',
  cargoSummary: '消费电子整机 FCL',
  status: 'in_transit',
  laneType: 'global_sea',
  upstreamExpanded: true,
  salesFlowComplete: true,
  customerRef: 'SO-GLOBAL-88421',
  consignee: 'DE-B2B-客户',
  intakeSource: 'api',
  orderLines: [{ lineNo: 1, sku: 'SKU-GLOBAL', name: '消费电子整机', qty: 2000, uom: '件', price: 420, amount: 840000 }],
  participants: GLOBAL_PARTICIPANTS,
  legLoIds: Object.values(sea.ids),
});

export const DEMO_GLOBAL_COLD_ORDER = createChainOrder({
  chainOrderId: COLD_ID,
  anchorEnterpriseId: 'ENT-LUWEI-BRAND',
  anchorGroupId: 'GRP-BRAND-A',
  title: '医药冷链 · 2-8°C 全程监控',
  cargoSummary: '医药试剂',
  status: 'in_warehouse',
  laneType: 'cold_chain',
  upstreamExpanded: true,
  salesFlowComplete: true,
  customerRef: 'SO-COLD-9901',
  consignee: '北京三甲医院',
  intakeSource: 'manual',
  orderLines: [{ lineNo: 1, sku: 'SKU-PHARMA', name: '医药试剂', qty: 500, uom: '箱', price: 280, amount: 140000 }],
  participants: GLOBAL_PARTICIPANTS,
  legLoIds: Object.values(cold.ids),
});

export const DEMO_GLOBAL_LOS = [...sea.los, ...cold.los];

export const DEMO_GLOBAL_EVENTS = new Map([
  [`LO-SAL-${SEA_SUF}`, [
    { type: 'FACT', code: 'SO_DRAFT', actor: 'shipper', spatialCellId: 'shenzhen', payload: { seed: 'v12' } },
    { type: 'FACT', code: 'SO_APPROVED', actor: 'shipper', spatialCellId: 'shenzhen', payload: {} },
    { type: 'FACT', code: 'ORDER_CREATED', actor: 'shipper', spatialCellId: 'shenzhen', payload: {} },
    { type: 'FACT', code: 'CHAIN_START', actor: 'shipper', spatialCellId: 'shenzhen', payload: {} },
  ]],
  [`LO-CUS-${SEA_SUF}`, [
    { type: 'FACT', code: 'DECLARATION_FILED', actor: 'customs_broker', spatialCellId: 'sz-yantian-port', payload: {} },
    { type: 'FACT', code: 'CUSTOMS_RELEASED', actor: 'customs_broker', spatialCellId: 'sz-yantian-port', payload: {} },
  ]],
  [`LO-OCN-${SEA_SUF}`, [
    { type: 'FACT', code: 'VESSEL_LOADED', actor: 'dispatcher', spatialCellId: 'sz-yantian-port', payload: { vessel: 'EVER GOLDEN' } },
    { type: 'FACT', code: 'IN_TRANSIT', actor: 'dispatcher', spatialCellId: 'sz-yantian-port', payload: { leg: 'ocean' } },
  ]],
  [`LO-SAL-${COLD_SUF}`, [
    { type: 'FACT', code: 'ORDER_CREATED', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: {} },
    { type: 'FACT', code: 'CHAIN_START', actor: 'shipper', spatialCellId: 'bj-dc-shunyi', payload: {} },
  ]],
  [`LO-COL-${COLD_SUF}`, [
    { type: 'FACT', code: 'TEMP_IN_RANGE', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: { celsius: 5.2 } },
    { type: 'FACT', code: 'PICK_PACK', actor: 'warehouse', spatialCellId: 'bj-dc-shunyi', payload: { cold: true } },
  ]],
]);

export const DEMO_GLOBAL_DOCUMENTS = [
  createDocument({
    docId: 'DOC-BL-GLOBAL-SEA',
    docType: 'WB',
    loId: `LO-OCN-${SEA_SUF}`,
    status: 'posted',
    header: {
      docNo: 'BL-EVER-GOLDEN-88421',
      title: '海运提单 · 盐田→鹿特丹',
      partyFrom: 'ENT-GLOBAL-FWD',
      partyTo: 'ENT-EU-3PL',
      amount: 128000,
    },
    lines: [{ lineNo: 1, name: 'FCL 40HQ', qty: 1, uom: '柜', price: 128000, amount: 128000 }],
  }),
  createDocument({
    docId: 'DOC-COO-GLOBAL-SEA',
    docType: 'CO',
    loId: `LO-CUS-${SEA_SUF}`,
    status: 'posted',
    header: {
      docNo: 'COO-CN-88421',
      title: '原产地证',
      partyFrom: 'ENT-LUWEI-BRAND',
      partyTo: 'ENT-GLOBAL-FWD',
      amount: 0,
    },
    lines: [],
  }),
];

export const DEMO_GLOBAL_ROUTES = [
  { chainOrderId: SEA_ID, from: 'sz-yantian-port', to: 'eu-rotterdam-port', mode: 'ocean', color: '#3d9dff' },
  { chainOrderId: SEA_ID, from: 'eu-hub-rtm', to: 'de-duisburg', mode: 'rail', color: '#ffb347' },
  { chainOrderId: COLD_ID, from: 'bj-dc-shunyi', to: 'bj-west-hub', mode: 'cold', color: '#6bdcff' },
];
